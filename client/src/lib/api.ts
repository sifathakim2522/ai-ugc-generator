const API_BASE = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';

let tokenGetter: ((forceRefresh?: boolean) => Promise<string | null>) | null = null;

/**
 * Register a function that returns the current Clerk session token.
 * Call this once from a component that has access to useAuth().
 */
export function registerTokenGetter(getter: (forceRefresh?: boolean) => Promise<string | null>) {
  tokenGetter = getter;
}

/**
 * Make an authenticated API request to the backend.
 */
export async function apiRequest(
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  // Ask Clerk for a fresh token on every API call. Session JWTs are short-lived
  // during local development, and a cached token can become invalid while the
  // user is still visibly signed in.
  const token = tokenGetter ? await tokenGetter(true) : null;

  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  // Don't set Content-Type for FormData (browser sets multipart boundary automatically)
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  console.log(`[api] ${options.method || 'GET'} ${API_BASE}${path}`, { isFormData: options.body instanceof FormData });

  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers,
      credentials: 'include',
    });
  } catch {
    throw new Error('The video server is offline. Start the backend and try again.');
  }

  // Development Clerk sessions can briefly hand us a token that is near its
  // expiry boundary. Refresh it and retry the request once before surfacing a
  // real authentication error to the UI.
  if (response.status === 401 && tokenGetter) {
    const refreshedToken = await tokenGetter(true);
    if (refreshedToken) {
      response = await fetch(`${API_BASE}${path}`, {
        ...options,
        headers: { ...headers, Authorization: `Bearer ${refreshedToken}` },
        credentials: 'include',
      });
    }
  }

  console.log(`[api] ${options.method || 'GET'} ${path} → ${response.status}`);
  return response;
}

export interface Asset {
  id: string;
  type: 'PRODUCT_IMAGE' | 'MODEL_IMAGE';
  url: string;
  filename?: string;
  mimeType?: string;
  size?: number;
  createdAt?: string;
}

export interface Project {
  id: string;
  userId: string;
  productName: string;
  productDescription: string;
  userPrompt: string;
  aspectRatio: string;
  status: string;
  progress: number;
  productImageUrls: string[];
  modelImageUrl: string;
  generatedImageUrl: string;
  generatedVideoUrl: string;
  error: string;
  errorMessage?: string | null;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
  assets?: Asset[];
}

/**
 * Create a new project.
 */
export async function createProject(data: {
  productName: string;
  productDescription?: string;
  userPrompt: string;
  aspectRatio?: string;
  productImageUrls?: string[];
  modelImageUrl?: string;
}): Promise<{ project: Project }> {
  const res = await apiRequest('/api/projects', {
    method: 'POST',
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Failed to create project' }));
    throw new Error(err.error || 'Failed to create project');
  }

  return res.json();
}

/**
 * Upload assets (product images or model image) to a project.
 */
export async function uploadAssets(
  projectId: string,
  files: File[],
  assetType: 'PRODUCT_IMAGE' | 'MODEL_IMAGE'
): Promise<{ assets: Asset[] }> {
  const formData = new FormData();
  formData.append('type', assetType);
  files.forEach((file) => formData.append('files', file));

  console.log(`[api] uploadAssets: projectId=${projectId} type=${assetType} files=${files.length}`);
  const res = await apiRequest(`/api/projects/${projectId}/assets`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Failed to upload assets' }));
    console.error('[api] uploadAssets error:', err);
    throw new Error(err.error || 'Failed to upload assets');
  }

  return res.json();
}

/**
 * Get a project by ID.
 */
export async function getProject(id: string): Promise<{ project: Project }> {
  const res = await apiRequest(`/api/projects/${id}`);

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Project not found' }));
    throw new Error(err.error || 'Project not found');
  }

  return res.json();
}

/** Start the asynchronous video generation job for a project. */
export async function startVideoGeneration(projectId: string): Promise<{ project: Project }> {
  const res = await apiRequest(`/api/projects/${projectId}/generate`, {
    method: 'POST',
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Failed to start video generation' }));
    throw new Error(err.error || 'Failed to start video generation');
  }

  return res.json();
}

/**
 * List all projects for the current user.
 */
/**
 * Test AI image generation for a project (development only).
 */
export async function testImageGeneration(
  projectId: string
): Promise<{ success: boolean; imageUrl: string; provider: string; providerGenerationId?: string }> {
  const res = await apiRequest(`/api/projects/${projectId}/test-image-generation`, {
    method: 'POST',
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Generation failed' }));
    throw new Error(err.error || 'Generation failed');
  }

  return res.json();
}

export async function listProjects(): Promise<{ projects: Project[] }> {
  const res = await apiRequest('/api/projects');

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Failed to list projects' }));
    throw new Error(err.error || 'Failed to list projects');
  }

  return res.json();
}
