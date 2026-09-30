import { Router, type Request, type Response } from 'express';
import multer from 'multer';
import { prisma } from '../lib/prisma.js';
import { getDemoUser } from '../lib/demoUser.js';
import {
  uploadFile,
  deleteFile,
  deleteFiles,
  validateFile,
  StorageError,
  type UploadResult,
} from '../services/storage.js';
import { ProjectStatus } from '@prisma/client';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
});

const router = Router();

/**
 * POST /api/projects/:id/assets
 * Upload product images or model image to a project.
 *
 * This route is registered BEFORE any optional auth middleware so multer can
 * read the multipart body. The first version of the app uses a local demo user.
 */
router.post(
  '/projects/:id/assets',
  upload.array('files', 10),
  async (req: Request, res: Response) => {
    try {
      const projectId = String(req.params.id);
      const assetType = String(req.body.type ?? '') as 'PRODUCT_IMAGE' | 'MODEL_IMAGE';
      const user = await getDemoUser();

      console.log(`[upload] userId=${user.id} projectId=${projectId} type=${assetType}`);

      // Validate asset type
      if (!['PRODUCT_IMAGE', 'MODEL_IMAGE'].includes(assetType)) {
        res.status(400).json({ error: 'type must be PRODUCT_IMAGE or MODEL_IMAGE' });
        return;
      }

      // Validate files exist
      const files = req.files as Express.Multer.File[] | undefined;
      if (!files || files.length === 0) {
        res.status(400).json({ error: 'No files provided' });
        return;
      }

      // Validate file count
      if (assetType === 'MODEL_IMAGE' && files.length !== 1) {
        res.status(400).json({ error: 'Exactly 1 model image required' });
        return;
      }
      if (assetType === 'PRODUCT_IMAGE' && (files.length < 1 || files.length > 5)) {
        res.status(400).json({ error: 'Product images: 1-5 files required' });
        return;
      }

      console.log(`[upload] ${files.length} files validated`);

      // Verify project ownership
      const project = await prisma.project.findFirst({
        where: { id: projectId, userId: user.id },
      });
      if (!project) {
        res.status(404).json({ error: 'Project not found' });
        return;
      }

      console.log(`[upload] ownership verified, starting uploads`);

      // Track uploads for cleanup on failure
      const uploadedKeys: string[] = [];
      const createdAssetIds: string[] = [];

      try {
        // Validate all files before starting uploads
        for (const file of files) {
          validateFile(file.mimetype, file.size);
        }

        // Update project status → UPLOADING
        await prisma.project.update({
          where: { id: projectId },
          data: { status: ProjectStatus.UPLOADING },
        });

        // Upload each file to R2 and create Asset rows
        const createdAssets: Array<{
          id: string;
          type: string;
          url: string;
          filename: string | null;
          mimeType: string | null;
          size: number | null;
        }> = [];

        for (const file of files) {
          console.log(`[upload] uploading ${file.originalname} (${file.mimetype}, ${file.size} bytes)`);

          const uploaded: UploadResult = await uploadFile({
            buffer: file.buffer,
            filename: file.originalname,
            mimeType: file.mimetype,
            userId: user.id,
            projectId,
            assetType,
          });
          uploadedKeys.push(uploaded.key);
          console.log(`[upload] R2 key: ${uploaded.key}`);

          const asset = await prisma.asset.create({
            data: {
              projectId,
              type: assetType,
              url: uploaded.url,
              storageKey: uploaded.key,
              filename: file.originalname,
              mimeType: file.mimetype,
              size: file.size,
            },
          });
          createdAssetIds.push(asset.id);

          createdAssets.push({
            id: asset.id,
            type: asset.type,
            url: asset.url,
            filename: asset.filename,
            mimeType: asset.mimeType,
            size: asset.size,
          });
        }

        // Update project's legacy URL fields
        if (assetType === 'MODEL_IMAGE') {
          await prisma.project.update({
            where: { id: projectId },
            data: { modelImageUrl: createdAssets[0]?.url ?? '' },
          });
        } else {
          const productUrls = createdAssets.map((a) => a.url);
          await prisma.project.update({
            where: { id: projectId },
            data: { productImageUrls: productUrls },
          });
        }

        // Update project status → PROCESSING
        await prisma.project.update({
          where: { id: projectId },
          data: { status: ProjectStatus.PROCESSING },
        });

        console.log(`[upload] project=${projectId} uploaded ${files.length} ${assetType} files`);
        res.status(201).json({ assets: createdAssets });
      } catch (error) {
        console.error(`[upload] project=${projectId} upload failed:`, error);

        let safeMessage = 'Failed to upload files';
        if (error instanceof StorageError) {
          safeMessage = error.message;
        } else if (error instanceof Error) {
          if (error.message.includes('ECONNREFUSED') || error.message.includes('ENOTFOUND')) {
            safeMessage = 'Storage service unavailable. Please try again.';
          } else if (error.message.includes('timeout')) {
            safeMessage = 'Upload timed out. Please try again.';
          }
        }

        // Best-effort cleanup: delete R2 objects
        if (uploadedKeys.length > 0) {
          const deleted = await deleteFiles(uploadedKeys);
          if (deleted < uploadedKeys.length) {
            console.error(`[cleanup] project=${projectId} only deleted ${deleted}/${uploadedKeys.length} R2 objects`);
          }
        }

        // Best-effort cleanup: delete Asset rows
        if (createdAssetIds.length > 0) {
          try {
            await prisma.asset.deleteMany({
              where: { id: { in: createdAssetIds } },
            });
          } catch (cleanupErr) {
            console.error(`[cleanup] project=${projectId} failed to delete Asset rows:`, cleanupErr);
          }
        }

        // Mark project as FAILED
        try {
          await prisma.project.update({
            where: { id: projectId },
            data: {
              status: ProjectStatus.FAILED,
              errorMessage: safeMessage,
            },
          });
        } catch (statusErr) {
          console.error(`[cleanup] project=${projectId} failed to set FAILED status:`, statusErr);
        }

        res.status(500).json({ error: safeMessage });
      }
    } catch (outerError) {
      console.error('[upload] unexpected error:', outerError);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  },
);

/**
 * DELETE /api/assets/:assetId
 * Local demo mode uses the shared workspace user.
 */
router.delete('/assets/:assetId', async (req: Request, res: Response) => {
  try {
    const assetId = String(req.params.assetId);
    const user = await getDemoUser();

    const asset = await prisma.asset.findUnique({
      where: { id: assetId },
      include: { project: true },
    });

    if (!asset || asset.project.userId !== user.id) {
      res.status(404).json({ error: 'Asset not found' });
      return;
    }

    await deleteFile(asset.storageKey);
    await prisma.asset.delete({ where: { id: assetId } });

    console.log(`[delete] asset=${assetId} project=${asset.projectId} deleted by user ${user.id}`);
    res.json({ deleted: true });
  } catch (error) {
    console.error('Error deleting asset:', error);
    res.status(500).json({ error: 'Failed to delete asset' });
  }
});

export default router;
