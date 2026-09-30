import { Router, type Request, type Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { getDemoUser } from '../lib/demoUser.js';
import { ProjectStatus } from '@prisma/client';
import { createLocalProject, getLocalProject, listLocalProjects, updateLocalProject } from '../lib/localDemoStore.js';

const router = Router();

/**
 * POST /api/projects
 * Create a new project for the authenticated user.
 * Status starts as QUEUED.
 */
router.post('/projects', async (req: Request, res: Response) => {
  try {
    const body = req.body as Record<string, unknown>;

    if (!body.productName || typeof body.productName !== 'string') {
      res.status(400).json({ error: 'productName is required' });
      return;
    }

    // Local demo mode keeps the studio usable when the remote Neon database is offline.
    const project = createLocalProject(body);
    res.status(201).json({ project });
    return;

    /* const project = await prisma.project.create({
      data: {
        userId: user.id,
        productName: body.productName,
        productDescription: typeof body.productDescription === 'string' ? body.productDescription : '',
        userPrompt: typeof body.userPrompt === 'string' ? body.userPrompt : '',
        aspectRatio: typeof body.aspectRatio === 'string' ? body.aspectRatio : '9:16',
        productImageUrls: Array.isArray(body.productImageUrls) ? body.productImageUrls as string[] : [],
        modelImageUrl: typeof body.modelImageUrl === 'string' ? body.modelImageUrl : '',
        status: ProjectStatus.QUEUED,
      },
      include: { assets: true },
    });

    console.log(`[project] created id=${project.id} userId=${user.id}`);

    res.status(201).json({ project }); */
  } catch (error) {
    console.error('[project] create error:', error);
    res.status(500).json({ error: 'Failed to create project' });
  }
});

/**
 * GET /api/projects
 * List all projects for the authenticated user.
 */
router.get('/projects', async (_req: Request, res: Response) => {
  try {
    res.json({ projects: listLocalProjects() });
    return;
    /*
    const user = await getDemoUser();

    const projects = await prisma.project.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        productName: true,
        productDescription: true,
        userPrompt: true,
        aspectRatio: true,
        status: true,
        progress: true,
        errorMessage: true,
        generatedImageUrl: true,
        generatedVideoUrl: true,
        isPublished: true,
        createdAt: true,
        updatedAt: true,
        assets: {
          select: {
            id: true,
            type: true,
            url: true,
            filename: true,
            mimeType: true,
            size: true,
          },
          where: { type: 'PRODUCT_IMAGE' },
          take: 1,
        },
      },
    });

    res.json({ projects }); */
  } catch (error) {
    console.error('[project] list error:', error);
    res.status(500).json({ error: 'Failed to list projects' });
  }
});

/**
 * GET /api/projects/:id
 * Get a single project by ID — only if it belongs to the authenticated user.
 * Includes all assets.
 */
router.get('/projects/:id', async (req: Request, res: Response) => {
  try {
    const localProject = getLocalProject(String(req.params.id));
    if (localProject) {
      res.json({ project: localProject });
      return;
    }
    /*
    const id = String(req.params.id);
    const user = await getDemoUser();

    const project = await prisma.project.findFirst({
      where: { id, userId: user.id },
      include: {
        assets: {
          select: {
            id: true,
            type: true,
            url: true,
            filename: true,
            mimeType: true,
            size: true,
            createdAt: true,
          },
        },
      },
    });

    if (!project) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }

    res.json({ project }); */
  } catch (error) {
    console.error('[project] fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch project' });
  }
});

/**
 * PATCH /api/projects/:id
 * Update project status/progress/errorMessage.
 */
router.patch('/projects/:id', async (req: Request, res: Response) => {
  try {
    const localProject = getLocalProject(String(req.params.id));
    if (localProject) {
      const body = req.body as Record<string, unknown>;
      const data: Record<string, unknown> = {};
      if (typeof body.status === 'string') data.status = body.status;
      if (typeof body.progress === 'number') data.progress = body.progress;
      if (typeof body.generatedImageUrl === 'string') data.generatedImageUrl = body.generatedImageUrl;
      if (typeof body.generatedVideoUrl === 'string') data.generatedVideoUrl = body.generatedVideoUrl;
      if (typeof body.error === 'string') data.error = body.error;
      if (typeof body.errorMessage === 'string' || body.errorMessage === null) data.errorMessage = body.errorMessage;
      res.json({ project: updateLocalProject(localProject.id, data) });
      return;
    }
    /*
    const id = String(req.params.id);
    const user = await getDemoUser();

    const existing = await prisma.project.findFirst({
      where: { id, userId: user.id },
    });

    if (!existing) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }

    const body = req.body as Record<string, unknown>;
    const data: Record<string, unknown> = {};
    if (typeof body.status === 'string') data.status = body.status;
    if (typeof body.progress === 'number') data.progress = body.progress;
    if (typeof body.generatedImageUrl === 'string') data.generatedImageUrl = body.generatedImageUrl;
    if (typeof body.generatedVideoUrl === 'string') data.generatedVideoUrl = body.generatedVideoUrl;
    if (typeof body.error === 'string') data.error = body.error;
    if (typeof body.errorMessage === 'string' || body.errorMessage === null) {
      data.errorMessage = body.errorMessage;
    }

    const project = await prisma.project.update({ where: { id }, data });

    res.json({ project }); */
  } catch (error) {
    console.error('[project] update error:', error);
    res.status(500).json({ error: 'Failed to update project' });
  }
});

export default router;
