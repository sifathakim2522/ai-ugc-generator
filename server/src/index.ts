import './env.js';
import path from 'node:path';
import fs from 'node:fs';
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import webhookRouter from './routes/webhook.js';
import projectRouter from './routes/projects.js';
import uploadRouter from './routes/uploads.js';
import generationRouter from './routes/generation.js';

const app = express();
const PORT = Number(process.env.API_PORT ?? 3001);

// Ensure local uploads directory exists for development fallback
const LOCAL_UPLOADS_DIR = path.resolve(process.cwd(), 'public', 'uploads');
if (!fs.existsSync(LOCAL_UPLOADS_DIR)) {
  fs.mkdirSync(LOCAL_UPLOADS_DIR, { recursive: true });
}

// CORS — must be before routes
const allowedOrigins = [
  process.env.CLIENT_URL || 'http://localhost:5173',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  }),
);

// Health check — BEFORE any middleware
app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    service: 'ai-ugc-generator-api',
    videoGenerationConfigured: Boolean(process.env.FAL_KEY),
  });
});

// Serve locally uploaded files (development fallback when R2 is not configured)
app.use('/uploads', express.static(LOCAL_UPLOADS_DIR));

// Upload routes — MUST be before clerkMiddleware because multer needs to
// read the multipart body stream. clerkMiddleware may consume the body
// when verifying cookie-based sessions, preventing multer from parsing.
// Auth is handled manually inside the upload route handler.
app.use('/api', uploadRouter);

// Multer + global error handler (must come after upload routes)
app.use((err: any, _req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (err instanceof multer.MulterError) {
    console.error('[multer] error:', err.code, err.message);
    if (err.code === 'LIMIT_FILE_SIZE') {
      res.status(400).json({ error: 'File too large. Maximum size is 10 MB.' });
      return;
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      res.status(400).json({ error: 'Unexpected file field.' });
      return;
    }
    res.status(400).json({ error: err.message });
    return;
  }
  next(err);
});

// Webhook needs raw body for signature verification
app.use('/api/webhooks/clerk', express.raw({ type: 'application/json' }));
app.use('/api', webhookRouter);

// JSON parsing — AFTER upload routes
app.use(express.json());

app.use('/api', generationRouter);

// Project routes (use clerkMiddleware-authenticated getAuth)
app.use('/api', projectRouter);

// Global error handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[global-error]', err);
  if (!res.headersSent) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(PORT, () => {
  console.log(`API server running at http://localhost:${PORT}`);
  console.log(`Local uploads served from: http://localhost:${PORT}/uploads`);
});
