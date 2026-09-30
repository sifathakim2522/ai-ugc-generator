import { randomUUID } from 'node:crypto';

type LocalProject = Record<string, any>;

const projects = new Map<string, LocalProject>();

export function createLocalProject(input: Record<string, any>) {
  const now = new Date().toISOString();
  const project = {
    id: `local-${randomUUID()}`,
    userId: 'local-demo-user',
    productName: input.productName,
    productDescription: input.productDescription ?? '',
    userPrompt: input.userPrompt ?? '',
    aspectRatio: input.aspectRatio ?? '9:16',
    status: 'QUEUED',
    progress: 0,
    productImageUrls: input.productImageUrls ?? [],
    modelImageUrl: input.modelImageUrl ?? '',
    generatedImageUrl: '',
    generatedVideoUrl: '',
    error: '',
    errorMessage: null,
    isPublished: false,
    createdAt: now,
    updatedAt: now,
    assets: [],
  };
  projects.set(project.id, project);
  return project;
}

export function listLocalProjects() {
  return [...projects.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function getLocalProject(id: string) {
  return projects.get(id);
}

export function updateLocalProject(id: string, data: Record<string, any>) {
  const project = projects.get(id);
  if (!project) return undefined;
  Object.assign(project, data, { updatedAt: new Date().toISOString() });
  return project;
}
