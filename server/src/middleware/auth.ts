import type { Request, Response, NextFunction } from 'express';
import { getAuth } from '@clerk/express';

/**
 * Middleware that checks Clerk JWT authentication.
 * Use after clerkMiddleware() in the Express chain.
 */
export function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const auth = getAuth(req);

  if (process.env.NODE_ENV !== 'production' && req.headers.authorization?.startsWith('Bearer ')) {
    try {
      const tokenPayload = JSON.parse(
        Buffer.from(req.headers.authorization.slice(7).split('.')[1], 'base64url').toString('utf8'),
      ) as Record<string, unknown>;
      console.log('[requireAuth] token diagnostics', {
        issuer: tokenPayload.iss,
        audience: tokenPayload.aud,
        authorizedParty: tokenPayload.azp,
        expiresInSeconds: typeof tokenPayload.exp === 'number' ? tokenPayload.exp - Math.floor(Date.now() / 1000) : null,
      });
    } catch {
      console.log('[requireAuth] token diagnostics: malformed JWT');
    }
  }

  console.log('[requireAuth]', req.method, req.path, 'isAuthenticated:', auth.isAuthenticated, 'userId:', auth.userId ?? 'null', 'hasAuth:', !!req.headers.authorization);

  if (!auth.isAuthenticated || !auth.userId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  next();
}
