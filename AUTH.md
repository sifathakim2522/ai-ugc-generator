# Authentication System — Implementation Summary

## What Was Built

A complete authentication system using **Clerk** for the AI UGC generator platform. The frontend handles login/signup UI while a backend server syncs Clerk users to a PostgreSQL database.

---

## Files Created

### Client (Frontend)
| File | Purpose |
|------|---------|
| `client/src/pages/SignIn.tsx` | Sign-in page with Clerk UI, glass panel styling |
| `client/src/pages/SignUp.tsx` | Sign-up page with Clerk UI, glass panel styling |
| `client/src/components/ProtectedRoute.tsx` | Route guard — redirects unauthenticated users to `/sign-in` |
| `client/.env.example` | Environment variable template |
| `client/.env` | Live Clerk publishable key (gitignored) |

### Server (Backend)
| File | Purpose |
|------|---------|
| `server/package.json` | Express, Prisma, Clerk backend SDK, svix |
| `server/tsconfig.json` | TypeScript config |
| `server/src/index.ts` | Express server entry point (port 3001) |
| `server/src/lib/prisma.ts` | Prisma client singleton |
| `server/src/lib/auth.ts` | `getCurrentUser()` helper — gets Clerk user + Prisma user |
| `server/src/routes/webhook.ts` | Clerk webhook handler — syncs users to PostgreSQL |
| `server/prisma/schema.prisma` | Database schema with Clerk fields |
| `server/.env.example` | Environment variable template |
| `server/.env` | Live keys (gitignored) |

## Files Modified
| File | Changes |
|------|---------|
| `client/package.json` | Added `@clerk/clerk-react` |
| `client/src/main.tsx` | Wrapped app with `ClerkProvider` |
| `client/src/App.tsx` | Added `/sign-in`, `/sign-up` routes + `ProtectedRoute` wrappers |
| `client/src/components/Navbar.tsx` | Auth-aware: avatar, dropdown menu, sign in/out buttons |
| `.gitignore` | Added `.env*` files exclusion |

---

## Environment Variables

### Client (`client/.env`)
```
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
VITE_SERVER_URL=http://localhost:3001
```

### Server (`server/.env`)
```
CLERK_SECRET_KEY=sk_test_...
CLERK_WEBHOOK_SECRET=whsec_...
DATABASE_URL="postgresql://user:password@localhost:5432/freebuff?schema=public"
CLIENT_URL=http://localhost:5173
PORT=3001
```

---

## How It Works

### Authentication Flow
1. User visits protected route (`/generator`, `/my-generations`, etc.)
2. `ProtectedRoute` checks Clerk session via `useAuth()`
3. If not signed in → redirects to `/sign-in`
4. User signs in via email or Google (handled by Clerk)
5. Clerk authenticates → redirects back to original URL
6. Navbar updates to show avatar + dropdown

### User Sync Flow
1. User signs up → Clerk fires `user.created` webhook
2. Server receives webhook at `/api/webhooks/clerk`
3. Verifies signature with svix
4. Upserts user in PostgreSQL via Prisma
5. Stores: `clerkId`, `email`, `name`, `image`

### Backup Sync (Lazy)
`getCurrentUser()` in `server/src/lib/auth.ts` also upserts the user on every API call as a safety net.

---

## Route Protection

| Route | Access |
|-------|--------|
| `/` | ✅ Public |
| `/plans` | ✅ Public |
| `/community` | ✅ Public |
| `/sign-in/*` | ✅ Public |
| `/sign-up/*` | ✅ Public |
| `/generator` | 🔒 Protected |
| `/results/:id` | 🔒 Protected |
| `/loading` | 🔒 Protected |
| `/my-generations` | 🔒 Protected |

---

## Setup Instructions

### 1. Clerk Dashboard
- Create app at [dashboard.clerk.com](https://dashboard.clerk.com)
- Enable **Email** and **Google** sign-in
- Copy Publishable Key → `client/.env`
- Copy Secret Key → `server/.env`
- Create Webhook → URL: `http://localhost:3001/api/webhooks/clerk`
- Webhook events: `user.created`, `user.updated`, `user.deleted`
- Copy Webhook Signing Secret → `server/.env`

### 2. PostgreSQL
```bash
# Create database
createdb freebuff

# Run migration
cd server
npx prisma migrate dev --name add_clerk_auth
npx prisma generate
```

### 3. Start Servers
```bash
# Terminal 1 — Client
cd client
npm run dev

# Terminal 2 — Server
cd server
npm run dev
```

### 4. Test the Flow
1. Open `http://localhost:5173`
2. Navbar shows "Sign In" and "Get Started"
3. Click "Get Started" → redirects to `/sign-up`
4. Sign up with Google or email
5. Redirected to `/generator`
6. Navbar shows avatar + dropdown
7. Sign out → back to signed-out state

---

## Tech Stack
- **Auth UI:** Clerk React SDK (`@clerk/clerk-react`)
- **Auth Backend:** Clerk Backend SDK (`@clerk/backend`)
- **Webhook Verification:** svix
- **Database:** PostgreSQL + Prisma ORM
- **Server:** Express.js (port 3001)
- **Client:** React + Vite (port 5173)
