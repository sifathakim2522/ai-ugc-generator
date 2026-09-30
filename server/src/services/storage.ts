import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  type PutObjectCommandInput,
} from '@aws-sdk/client-s3';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

/**
 * Check if R2 credentials are configured.
 * If not, we fall back to local file storage for development.
 */
const R2_CONFIGURED = !!(
  process.env.R2_ACCOUNT_ID &&
  process.env.R2_ACCESS_KEY_ID &&
  process.env.R2_SECRET_ACCESS_KEY &&
  process.env.R2_BUCKET_NAME
);

const LOCAL_UPLOAD_DIR = path.resolve(
  process.cwd(),
  'public',
  'uploads',
);

/**
 * S3-compatible client for Cloudflare R2 (only used when R2 is configured).
 */
const r2 = R2_CONFIGURED
  ? new S3Client({
      region: 'auto',
      endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
      },
    })
  : null;

if (!R2_CONFIGURED) {
  console.log('[storage] R2 not configured — using LOCAL file storage');
  console.log(`[storage] Uploads will be saved to: ${LOCAL_UPLOAD_DIR}`);
} else {
  console.log('[storage] Using Cloudflare R2');
}

export interface UploadResult {
  key: string;
  url: string;
}

export interface UploadFileOptions {
  buffer: Buffer;
  filename: string;
  mimeType: string;
  userId: string;
  projectId: string;
  assetType: 'PRODUCT_IMAGE' | 'MODEL_IMAGE';
}

/**
 * Generate a safe object key: users/{userId}/projects/{projectId}/{type}/{uuid}.{ext}
 */
function buildObjectKey(
  userId: string,
  projectId: string,
  assetType: string,
  filename: string,
): string {
  const uuid = crypto.randomUUID();
  const safeName = filename
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/_{2,}/g, '_')
    .slice(0, 100);
  const ext = safeName.includes('.')
    ? safeName.split('.').pop()
    : 'jpg';
  return `users/${userId}/projects/${projectId}/${assetType.toLowerCase()}/${uuid}.${ext}`;
}

/**
 * Upload a file to local storage (development fallback).
 */
async function uploadToLocal(key: string, buffer: Buffer): Promise<void> {
  const filePath = path.join(LOCAL_UPLOAD_DIR, key);
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, buffer);
}

/**
 * Delete a file from local storage.
 */
async function deleteFromLocal(key: string): Promise<boolean> {
  try {
    const filePath = path.join(LOCAL_UPLOAD_DIR, key);
    await fs.unlink(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Upload a file buffer to Cloudflare R2 or local storage.
 */
export async function uploadFile(opts: UploadFileOptions): Promise<UploadResult> {
  const { buffer, filename, mimeType, userId, projectId, assetType } = opts;

  if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
    throw new StorageError('UNSUPPORTED_TYPE', `Unsupported file type: ${mimeType}`);
  }
  if (buffer.length > MAX_FILE_SIZE) {
    throw new StorageError('FILE_TOO_LARGE', `Maximum file size is ${MAX_FILE_SIZE / 1024 / 1024} MB`);
  }

  const key = buildObjectKey(userId, projectId, assetType, filename);

  if (R2_CONFIGURED && r2) {
    // Upload to Cloudflare R2
    const putParams: PutObjectCommandInput = {
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: mimeType,
      ContentLength: buffer.length,
    };
    await r2.send(new PutObjectCommand(putParams));
    const publicUrl = process.env.R2_PUBLIC_URL ?? '';
    const url = `${publicUrl}/${key}`;
    return { key, url };
  } else {
    // Upload to local filesystem
    await uploadToLocal(key, buffer);
    // URL points to the Express static file server
    const baseUrl = process.env.API_BASE_URL || `http://localhost:${process.env.API_PORT || 3001}`;
    const url = `${baseUrl}/uploads/${key}`;
    return { key, url };
  }
}

/**
 * Delete a file from R2 or local storage.
 * Logs failures but never throws — safe for cleanup paths.
 */
export async function deleteFile(storageKey: string): Promise<boolean> {
  try {
    if (R2_CONFIGURED && r2) {
      await r2.send(
        new DeleteObjectCommand({
          Bucket: process.env.R2_BUCKET_NAME,
          Key: storageKey,
        }),
      );
      return true;
    } else {
      return await deleteFromLocal(storageKey);
    }
  } catch (err) {
    console.error(`[cleanup] failed to delete object: ${storageKey}`, err);
    return false;
  }
}

/**
 * Best-effort delete multiple files.
 * Continues even if individual deletes fail.
 * Returns the number of successfully deleted files.
 */
export async function deleteFiles(storageKeys: string[]): Promise<number> {
  let deleted = 0;
  for (const key of storageKeys) {
    const ok = await deleteFile(key);
    if (ok) deleted++;
  }
  return deleted;
}

/**
 * Validate a file's MIME type and size.
 * Throws StorageError if invalid.
 */
export function validateFile(mimeType: string, size: number): void {
  if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
    throw new StorageError('UNSUPPORTED_TYPE', `Unsupported file type: ${mimeType}. Accepted: JPEG, PNG, WebP`);
  }
  if (size > MAX_FILE_SIZE) {
    throw new StorageError('FILE_TOO_LARGE', `File too large: ${(size / 1024 / 1024).toFixed(1)} MB. Maximum is 10 MB`);
  }
}

export const ALLOWED_TYPES = ALLOWED_MIME_TYPES;
export const MAX_SIZE = MAX_FILE_SIZE;

export class StorageError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}
