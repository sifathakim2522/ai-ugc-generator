import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

// Environment variables must be loaded before Clerk, Prisma, storage, or any
// route module is evaluated. ESM evaluates imported modules before index.ts.
const currentFile = fileURLToPath(import.meta.url);
const currentDirectory = path.dirname(currentFile);

dotenv.config({ path: path.resolve(currentDirectory, '../.env') });
