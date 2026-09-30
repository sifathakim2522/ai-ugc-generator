import { Router, type Request, type Response } from 'express';
import { ProjectStatus } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { getDemoUser } from '../lib/demoUser.js';
import { generateVideo, VideoGenerationError } from '../services/ai/videoGeneration.js';
import { getLocalProject, updateLocalProject } from '../lib/localDemoStore.js';

const router = Router();

function parseSettings(value: string): { duration?: number; style?: string } {
  try {
    return JSON.parse(value) as { duration?: number; style?: string };
  } catch {
    return {};
  }
}

async function runGeneration(project: {
  id: string;
  userPrompt: string;
  aspectRatio: string;
  productDescription: string;
} | any) {
  const settings = parseSettings(project.productDescription);
  try {
    const videoUrl = await generateVideo({
      prompt: project.userPrompt,
      aspectRatio: project.aspectRatio,
      duration: settings.duration ?? 5,
      style: settings.style,
      onProgress(progress) {
        void (getLocalProject(project.id)
          ? Promise.resolve(updateLocalProject(project.id, { progress }))
          : prisma.project.update({
          where: { id: project.id },
          data: { progress },
        })).catch((error) => console.error('[generation] progress update failed:', error));
      },
    });

    const data = {
        status: ProjectStatus.COMPLETED,
        progress: 100,
        generatedVideoUrl: videoUrl,
        error: '',
        errorMessage: null,
      };
    if (getLocalProject(project.id)) updateLocalProject(project.id, data);
    else await prisma.project.update({ where: { id: project.id }, data });
    console.log(`[generation] completed project=${project.id}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Video generation failed';
    const data = {
        status: ProjectStatus.FAILED,
        error: error instanceof VideoGenerationError ? error.code : 'GENERATION_FAILED',
        errorMessage: message,
      };
    if (getLocalProject(project.id)) updateLocalProject(project.id, data);
    else await prisma.project.update({ where: { id: project.id }, data });
    console.error(`[generation] failed project=${project.id}:`, error);
  }
}

router.post('/projects/:id/generate', async (req: Request, res: Response) => {
  try {
    if (!process.env.FAL_KEY) {
      res.status(503).json({ error: 'Video generation is not configured yet. Add FAL_KEY to server/.env.' });
      return;
    }

    const localProject = getLocalProject(String(req.params.id));
    const user = localProject ? null : await getDemoUser();

    const project = localProject ?? await prisma.project.findFirst({
      where: { id: String(req.params.id), userId: user!.id },
    });
    if (!project) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }
    if (project.status === ProjectStatus.COMPLETED) {
      res.json({ project, alreadyCompleted: true });
      return;
    }
    if (project.status === ProjectStatus.PROCESSING && project.progress > 10) {
      res.status(202).json({ project, alreadyProcessing: true });
      return;
    }

    const processingData = {
        status: ProjectStatus.PROCESSING,
        progress: 10,
        error: '',
        errorMessage: null,
      };
    const processingProject = localProject
      ? updateLocalProject(project.id, processingData)
      : await prisma.project.update({ where: { id: project.id }, data: processingData });

    res.status(202).json({ project: processingProject });
    void runGeneration(project);
  } catch (error) {
    console.error('[generation] start error:', error);
    if (!res.headersSent) res.status(500).json({ error: 'Failed to start video generation' });
  }
});

export default router;
