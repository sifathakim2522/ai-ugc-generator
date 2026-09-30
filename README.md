# AI UGC Generator

A prompt-based web studio for short videos intended for Reels and YouTube Shorts. Built with React, TypeScript, Vite, and an Express API with a fal.ai video-generation integration.

**Status: development prototype.** The current app uses a shared local demo identity and in-memory project storage. Real video generation requires a configured fal.ai account with sufficient balance; the interface's credit counter is a placeholder.

## Features

- Prompt entry, aspect ratio, duration, and visual-style controls.
- Project creation and generation status polling.
- Video result and project-list pages.
- Provider errors surfaced to help diagnose generation failures.

## Run locally

Use Node.js 22.12+ and npm. Run the API and frontend in separate terminals.

```sh
cd server
npm ci
npx prisma generate
# Copy .env.example to .env and fill in FAL_KEY.
npm run dev
```

```sh
cd client
npm ci
# Copy .env.example to .env if you need to override the API URL.
npm run dev
```

The API defaults to http://localhost:3001 and the frontend to http://localhost:5173. Set CLIENT_URL to the frontend origin and VITE_SERVER_URL to the API origin when overriding them. Never put provider secrets in VITE_ variables.

## Configuration and limitations

- FAL_KEY enables provider requests; generation is not free merely because the UI is running locally.
- Current project records disappear on backend restart.
- Authentication is disabled for the development workflow. Do not expose this configuration as a public service.
- Prisma/PostgreSQL, Clerk, and upload-related code remain in the repository. Some legacy paths still require their original configuration.
- Reference uploads, automatic captions, and other interface controls should not be interpreted as fully implemented provider features.
- Missing project IDs after a restart are a known area for improved error handling.

## Layout

- client/ — React application and bundled interface assets.
- server/src/ — API routes, local project store, and provider integration.
- server/prisma/ — database schema for the database-backed workflow.

## Build

Run npm run build inside client/ and server/ separately.

## Next steps

Persistent project storage, authenticated production access, reliable uploads, real usage accounting, automated tests, and an end-to-end generation check.

## Attribution

Retain existing license and attribution notices, including client/LICENSE.txt. Earlier development notes may describe the legacy authenticated database workflow rather than the current demo mode.
