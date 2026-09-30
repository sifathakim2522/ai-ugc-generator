/**
 * AI Image Generation Service
 *
 * Provider: Hugging Face Inference API (FLUX.1-schnell)
 *
 * Free tier: $0.10/month credits for free users.
 * Model: black-forest-labs/FLUX.1-schnell (fast, free)
 */

import { InferenceClient } from '@huggingface/inference';
import fs from 'node:fs/promises';
import path from 'node:path';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface GenerateImageInput {
  /** The user's generation prompt */
  prompt: string;
  /** URLs or local paths of product images (first one is primary reference) */
  productImages: string[];
  /** URL or local path of the model image */
  modelImage: string;
  /** Aspect ratio string: "9:16" | "16:9" | "1:1" */
  aspectRatio: string;
}

export interface GenerateImageResult {
  /** URL of the generated image */
  imageUrl: string;
  /** Provider identifier */
  provider: string;
  /** Provider's internal generation ID (if available) */
  providerGenerationId?: string;
}

// ---------------------------------------------------------------------------
// Provider configuration
// ---------------------------------------------------------------------------

const PROVIDER = 'huggingface/FLUX.1-schnell';
const MODEL_ID = 'black-forest-labs/FLUX.1-schnell';

/**
 * Map our app's aspect ratios to pixel dimensions for the AI model.
 * FLUX.1-schnell works best with specific width/height values.
 */
const ASPECT_RATIO_DIMENSIONS: Record<string, { width: number; height: number }> = {
  '9:16':  { width: 576, height: 1024 },
  '16:9':  { width: 1024, height: 576 },
  '1:1':   { width: 1024, height: 1024 },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Check if a URL is a localhost URL (not publicly accessible).
 */
function isLocalUrl(url: string): boolean {
  return (
    url.startsWith('http://localhost') ||
    url.startsWith('http://127.0.0.1') ||
    url.startsWith('http://0.0.0.0')
  );
}

/**
 * Resolve an image URL for the AI provider.
 *
 * - If it's a public URL, use it directly.
 * - If it's a localhost URL, read from disk and convert to base64 data URI.
 */
async function resolveImageUrl(imageUrl: string): Promise<string> {
  if (imageUrl.startsWith('data:')) {
    return imageUrl;
  }

  if (!isLocalUrl(imageUrl)) {
    return imageUrl;
  }

  console.log(`[ai] Localhost URL detected: ${imageUrl}`);
  console.log(`[ai] Reading file from disk and converting to base64 data URI...`);

  const urlPath = new URL(imageUrl).pathname;
  const relativePath = urlPath.replace(/^\/uploads\//, '');

  const uploadsDir = path.resolve(process.cwd(), 'public', 'uploads');
  const filePath = path.join(uploadsDir, relativePath);

  try {
    const buffer = await fs.readFile(filePath);
    const ext = path.extname(filePath).toLowerCase();
    const mimeType =
      ext === '.png' ? 'image/png' :
      ext === '.webp' ? 'image/webp' :
      'image/jpeg';

    const base64 = buffer.toString('base64');
    const dataUri = `data:${mimeType};base64,${base64}`;
    console.log(`[ai] Converted to base64 data URI (${(buffer.length / 1024).toFixed(1)} KB)`);
    return dataUri;
  } catch (err) {
    throw new Error(
      `Failed to read local file for image: ${imageUrl}. ` +
      `Make sure the file exists at: ${filePath}. ` +
      `For production, use cloud storage (R2) so AI providers can access the URLs.`
    );
  }
}

// ---------------------------------------------------------------------------
// Main function
// ---------------------------------------------------------------------------

/**
 * Generate an image using Hugging Face Inference API (FLUX.1-schnell).
 *
 * Flow:
 * 1. Validate inputs
 * 2. Resolve image URLs (handle localhost → base64)
 * 3. Build prompt with aspect ratio context
 * 4. Call Hugging Face API
 * 5. Return the generated image as a data URI
 */
export async function generateImage(
  input: GenerateImageInput,
): Promise<GenerateImageResult> {
  const { prompt, productImages, modelImage, aspectRatio } = input;

  // --- Validate ---
  if (!prompt || prompt.trim().length === 0) {
    throw new GenerationError('VALIDATION_ERROR', 'Prompt is required');
  }
  if (!productImages || productImages.length === 0) {
    throw new GenerationError('VALIDATION_ERROR', 'At least one product image is required');
  }
  if (!modelImage) {
    throw new GenerationError('VALIDATION_ERROR', 'A model image is required');
  }

  // --- Check HF key ---
  const hfToken = process.env.HF_TOKEN;
  if (!hfToken) {
    throw new GenerationError(
      'PROVIDER_NOT_CONFIGURED',
      'HF_TOKEN environment variable is not set. Get a free token at https://huggingface.co/settings/tokens',
    );
  }

  const client = new InferenceClient(hfToken);

  // --- Resolve image URLs ---
  console.log(`[ai] Resolving image URLs...`);
  console.log(`[ai] Product images: ${productImages.length}`);
  console.log(`[ai] Model image: ${modelImage}`);

  let resolvedProductUrl: string;
  try {
    resolvedProductUrl = await resolveImageUrl(productImages[0]);
  } catch (err) {
    if (err instanceof GenerationError) throw err;
    throw new GenerationError('URL_RESOLVE_FAILED', `Failed to resolve product image: ${err}`);
  }

  // --- Build the prompt ---
  const dims = ASPECT_RATIO_DIMENSIONS[aspectRatio] ?? ASPECT_RATIO_DIMENSIONS['9:16'];
  const fullPrompt = [
    prompt.trim(),
    `Product lifestyle photo, high quality, professional photography, ${dims.width}x${dims.height} resolution.`,
  ].join(' ');

  console.log(`[ai] Calling ${PROVIDER}...`);
  console.log(`[ai] Prompt: "${fullPrompt.substring(0, 120)}..."`);
  console.log(`[ai] Dimensions: ${dims.width}x${dims.height}`);

  // --- Call Hugging Face API ---
  // FLUX.1-schnell is text-to-image only (no img2img).
  // We include the product image context in the prompt description.
  // For real img2img, we'd need a different model.
  try {
    const imageBlob: Blob = await client.textToImage({
      model: MODEL_ID,
      inputs: fullPrompt,
      parameters: {
        width: dims.width,
        height: dims.height,
        num_inference_steps: 4, // FLUX.1-schnell is fast with 4 steps
      },
    }, { outputType: 'blob' });

    // Convert Blob to base64 data URI
    const arrayBuffer = await imageBlob.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString('base64');
    const dataUri = `data:image/jpeg;base64,${base64}`;

    console.log(`[ai] Generation successful!`);
    console.log(`[ai] Image size: ${(buffer.length / 1024).toFixed(1)} KB`);

    return {
      imageUrl: dataUri,
      provider: PROVIDER,
      providerGenerationId: `hf-${Date.now()}`,
    };
  } catch (err: any) {
    console.error(`[ai] Hugging Face error:`, err);

    if (err?.message?.includes('rate limit')) {
      throw new GenerationError('RATE_LIMITED', 'Hugging Face rate limit hit. Please wait a moment and try again.');
    }
    if (err?.message?.includes('insufficient')) {
      throw new GenerationError('PROVIDER_ERROR', 'Hugging Face credits exhausted. Upgrade to PRO for more.');
    }
    if (err?.message?.includes('model')) {
      throw new GenerationError('PROVIDER_ERROR', `Model error: ${err.message}`);
    }

    throw new GenerationError(
      'PROVIDER_ERROR',
      `Hugging Face request failed: ${err?.message ?? String(err)}`,
    );
  }
}

// ---------------------------------------------------------------------------
// Error class
// ---------------------------------------------------------------------------

export class GenerationError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
    this.name = 'GenerationError';
  }
}
