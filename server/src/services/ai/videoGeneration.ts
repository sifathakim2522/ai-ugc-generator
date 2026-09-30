import { fal } from '@fal-ai/client';

const MODEL_ID = 'fal-ai/vidu/q3/text-to-video';

export interface VideoGenerationInput {
  prompt: string;
  aspectRatio: string;
  duration: number;
  style?: string;
  onProgress?: (progress: number) => void;
}

interface FalVideoResult {
  video?: {
    url?: string;
  };
}

export class VideoGenerationError extends Error {
  constructor(public code: string, message: string) {
    super(message);
    this.name = 'VideoGenerationError';
  }
}

// FAL often supplies the actual reason in body.detail, while Error.message
// contains only the HTTP status text (for example, "Forbidden").
export function describeProviderError(error: unknown, credentials = ''): string {
  const readDetail = (value: unknown, depth = 0): string => {
    if (depth > 4) return '';
    if (typeof value === 'string') return value.trim();
    if (Array.isArray(value)) return value.map(item => readDetail(item, depth + 1)).filter(Boolean).join('; ');
    if (value && typeof value === 'object') {
      const record = value as Record<string, unknown>;
      return ['detail', 'message', 'msg', 'error'].map(key => readDetail(record[key], depth + 1)).find(Boolean) || '';
    }
    return '';
  };
  const record = error && typeof error === 'object' ? error as Record<string, unknown> : {};
  const detail = readDetail(record.body) || readDetail(record.message) || 'Unknown provider error';
  const status = typeof record.status === 'number' ? ` (HTTP ${record.status})` : '';
  let message = `Video generation failed${status}: ${detail}`;
  if (credentials) message = message.split(credentials).join('[redacted]');
  return message.slice(0, 2000);
}

export async function generateVideo(input: VideoGenerationInput): Promise<string> {
  const credentials = process.env.FAL_KEY;
  if (!credentials) {
    throw new VideoGenerationError(
      'PROVIDER_NOT_CONFIGURED',
      'Video generation is not configured. Add FAL_KEY to server/.env.',
    );
  }

  fal.config({ credentials });

  const duration = Math.max(1, Math.min(16, Math.round(input.duration || 5)));
  type SupportedAspectRatio = '16:9' | '9:16' | '4:3' | '3:4' | '1:1';
  const supportedRatios: SupportedAspectRatio[] = ['16:9', '9:16', '4:3', '3:4', '1:1'];
  const aspectRatio: SupportedAspectRatio = supportedRatios.includes(input.aspectRatio as SupportedAspectRatio)
    ? input.aspectRatio as SupportedAspectRatio
    : '9:16';
  const prompt = input.style
    ? `${input.prompt.trim()} Visual style: ${input.style}. Social short-form video, strong opening frame, coherent motion.`
    : input.prompt.trim();

  try {
    const result = await fal.subscribe(MODEL_ID, {
      input: {
        prompt,
        duration,
        aspect_ratio: aspectRatio,
        resolution: '720p',
        audio: true,
      },
      logs: true,
      onQueueUpdate(update) {
        if (update.status === 'IN_QUEUE') input.onProgress?.(15);
        if (update.status === 'IN_PROGRESS') input.onProgress?.(55);
      },
    });

    const data = result.data as FalVideoResult;
    const videoUrl = data.video?.url;
    if (!videoUrl) {
      throw new VideoGenerationError('INVALID_PROVIDER_RESPONSE', 'The video provider returned no video URL.');
    }
    return videoUrl;
  } catch (error) {
    if (error instanceof VideoGenerationError) throw error;
    throw new VideoGenerationError('PROVIDER_ERROR', describeProviderError(error, credentials));
  }
}
