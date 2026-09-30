/**
 * Test endpoint for AI image generation.
 *
 * POST /api/projects/:id/test-image-generation
 *
 * This is a development/test endpoint that:
 * 1. Authenticates the user
 * 2. Verifies project ownership
 * 3. Loads product and model assets from Prisma
 * 4. Calls the AI image generation service
 * 5. Returns the generated image URL
 *
 * Does NOT modify project status or save results.
 */

import { Router, type Request, type Response } from 'express';
import { getAuth } from '@clerk/express';
import { prisma } from '../lib/prisma.js';
import { requireAuth } from '../middleware/auth.js';
import {
  generateImage,
  GenerationError,
} from '../services/ai/imageGeneration.js';

const router = Router();

router.post(
  '/projects/:id/test-image-generation',
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      const { userId } = getAuth(req);
      const projectId = String(req.params.id);

      // --- Find Prisma user ---
      const user = await prisma.user.findUnique({ where: { clerkId: userId! } });
      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      // --- Verify project ownership ---
      const project = await prisma.project.findFirst({
        where: { id: projectId, userId: user.id },
        include: {
          assets: {
            select: {
              id: true,
              type: true,
              url: true,
              storageKey: true,
            },
          },
        },
      });

      if (!project) {
        res.status(404).json({ error: 'Project not found' });
        return;
      }

      console.log(`[test-gen] project=${projectId} user=${user.id}`);

      // --- Load assets ---
      const productAssets = project.assets.filter((a) => a.type === 'PRODUCT_IMAGE');
      const modelAssets = project.assets.filter((a) => a.type === 'MODEL_IMAGE');

      if (productAssets.length === 0) {
        res.status(400).json({
          error: 'No PRODUCT_IMAGE assets found for this project. Upload product images first.',
        });
        return;
      }

      if (modelAssets.length === 0) {
        res.status(400).json({
          error: 'No MODEL_IMAGE asset found for this project. Upload a model image first.',
        });
        return;
      }

      const productImageUrls = productAssets.map((a) => a.url);
      const modelImageUrl = modelAssets[0].url;

      console.log(`[test-gen] product images: ${productImageUrls.length}`);
      console.log(`[test-gen] model image: ${modelImageUrl}`);
      console.log(`[test-gen] prompt: "${(project.userPrompt || '').substring(0, 80)}..."`);
      console.log(`[test-gen] aspect ratio: ${project.aspectRatio}`);

      // --- Call AI generation ---
      const result = await generateImage({
        prompt: project.userPrompt || 'Generate a lifestyle product image',
        productImages: productImageUrls,
        modelImage: modelImageUrl,
        aspectRatio: project.aspectRatio || '9:16',
      });

      console.log(`[test-gen] success! imageUrl=${result.imageUrl.substring(0, 80)}...`);

      // --- Return result ---
      res.json({
        success: true,
        imageUrl: result.imageUrl,
        provider: result.provider,
        providerGenerationId: result.providerGenerationId,
        project: {
          id: project.id,
          prompt: project.userPrompt,
          aspectRatio: project.aspectRatio,
          productImagesCount: productImageUrls.length,
        },
      });
    } catch (error) {
      if (error instanceof GenerationError) {
        console.error(`[test-gen] generation error (${error.code}):`, error.message);
        res.status(422).json({
          error: error.message,
          code: error.code,
        });
        return;
      }

      console.error('[test-gen] unexpected error:', error);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Internal server error during image generation' });
      }
    }
  },
);

export default router;
