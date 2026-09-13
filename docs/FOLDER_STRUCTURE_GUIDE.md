# Frontend & Backend Folder Separation Structure

This document explains the new project structure with completely separated frontend and backend.

## Project Root Structure

```
project-root/
├── frontend/                    # React/Next.js Frontend
│   ├── src/
│   │   ├── app/                # Next.js App Router
│   │   ├── components/         # React components
│   │   ├── hooks/              # React hooks (useApi, etc)
│   │   ├── lib/
│   │   │   ├── api/            # API client (client.ts only)
│   │   │   ├── auth/           # Auth client (auth-client.ts)
│   │   │   ├── utils/          # Utilities
│   │   │   └── validations/    # Shared validations
│   │   ├── types/              # TypeScript types
│   │   └── styles/
│   ├── package.json
│   ├── next.config.ts
│   ├── tsconfig.json
│   ├── .env.example
│   └── .env.local
│
├── backend/                     # Backend API Server
│   ├── src/
│   │   ├── app/
│   │   │   ├── api/            # API Routes (/api/v1/*)
│   │   │   └── middleware.ts   # Next.js middleware
│   │   ├── lib/
│   │   │   ├── api/            # API handlers & middleware
│   │   │   ├── auth/           # Authentication (server)
│   │   │   ├── db/             # Database layer
│   │   │   ├── cache/          # Caching layer
│   │   │   └── utils/          # Utilities
│   │   ├── types/              # TypeScript types
│   │   └── scripts/            # Build scripts
│   ├── package.json
│   ├── next.config.ts
│   ├── tsconfig.json
│   ├── .env.example
│   └── .env.local
│
├── shared/                      # Optional: Shared code
│   ├── src/
│   │   ├── types/              # Shared types
│   │   ├── validations/        # Shared Zod schemas
│   │   └── constants/          # Shared constants
│   └── package.json
│
├── docs/                        # Documentation
├── .gitignore
├── .gitmodules (if using submodules)
└── README.md
```

## Folder Breakdown

### Frontend (`frontend/`)

**Purpose:** React/Next.js user interface

**Contains:**
- `src/app/` - Next.js pages and layouts
- `src/components/` - Reusable React components
- `src/hooks/` - React hooks (useApi, useAuth, etc)
- `src/lib/api/client.ts` - API client for calling backend
- `src/lib/auth/auth-client.ts` - Frontend auth service
- `src/types/` - Frontend-specific TypeScript types

**Runs on:** Port 3000 (development) or custom domain
**Environment:** `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_ALLOWED_ORIGINS`

### Backend (`backend/`)

**Purpose:** REST API server and business logic

**Contains:**
- `src/app/api/` - API route handlers (/api/v1/*)
- `src/lib/api/handlers.ts` - Route wrapper with security
- `src/lib/api/middleware.ts` - CORS, rate limiting, etc
- `src/lib/auth/` - Server-side authentication
- `src/lib/db/` - Database access layer
- `src/scripts/` - Database migrations, seed scripts

**Runs on:** Port 3001 (development) or custom domain
**Environment:** `DATABASE_URL`, `BETTER_AUTH_SECRET`, API configs

### Shared (`shared/`) - Optional

**Purpose:** Code shared between frontend and backend

**Contains:**
- `types/` - Shared TypeScript types
- `validations/` - Shared Zod schemas
- `constants/` - Shared constants

**Usage:**
```typescript
// In frontend
import { UserType, UserSchema } from "@shared/types";

// In backend
import { UserSchema } from "@shared/validations";
```

## Development Workflow

### Start Both Services

```bash
# Terminal 1: Backend
cd backend
pnpm install
pnpm dev         # Runs on http://localhost:3001

# Terminal 2: Frontend
cd frontend
pnpm install
pnpm dev         # Runs on http://localhost:3000
```

### With Docker Compose

```bash
# In project root
docker-compose up

# Services will run on:
# Frontend: http://localhost:3000
# Backend: http://localhost:3001
```

## File Locations Map

| Component | Old Location | New Location |
|-----------|--------------|--------------|
| Frontend Components | `src/components/` | `frontend/src/components/` |
| React Hooks (useApi) | `src/hooks/useApi.ts` | `frontend/src/hooks/useApi.ts` |
| API Client | `src/lib/api/client.ts` | `frontend/src/lib/api/client.ts` |
| Frontend Auth | `src/lib/auth/auth-client.ts` | `frontend/src/lib/auth/auth-client.ts` |
| Frontend Pages | `src/app/(chat)/`, etc | `frontend/src/app/(chat)/`, etc |
| API Routes | `src/app/api/v1/` | `backend/src/app/api/v1/` |
| Handler Wrapper | `src/lib/api/handlers.ts` | `backend/src/lib/api/handlers.ts` |
| Security Middleware | `src/lib/api/middleware.ts` | `backend/src/lib/api/middleware.ts` |
| Server Auth | `src/lib/auth/server.ts` | `backend/src/lib/auth/server.ts` |
| Database | `src/lib/db/` | `backend/src/lib/db/` |
| Drizzle Config | `drizzle.config.ts` | `backend/drizzle.config.ts` |
| Database Scripts | `scripts/` | `backend/scripts/` |

## Environment Variables

### Frontend (frontend/.env.local)
```bash
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_ALLOWED_ORIGINS=http://localhost:3000
```

### Backend (backend/.env.local)
```bash
PORT=3001
DATABASE_URL=postgres://...
BETTER_AUTH_URL=http://localhost:3001
BETTER_AUTH_SECRET=...
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_ALLOWED_ORIGINS=http://localhost:3000
```

## Benefits of This Structure

✅ **Clear Separation** - Frontend and backend are completely separate
✅ **Independent Scaling** - Scale frontend and backend independently
✅ **Different Tech Stacks** - Future flexibility for different frameworks
✅ **Separate Deployments** - Deploy frontend and backend on different servers
✅ **Monorepo** - Single repository for easy management
✅ **Shared Code** - Optional shared folder for common types/schemas
✅ **Team Coordination** - Frontend and backend teams work independently

## Git Workflow

### Single Monorepo
```bash
git clone <repo>
cd frontend && npm install
cd ../backend && npm install
```

### As Separate Repos (Optional)
```bash
git clone <frontend-repo> frontend
git clone <backend-repo> backend
```

### As Git Submodules (Optional)
```bash
git submodule add <frontend-repo> frontend
git submodule add <backend-repo> backend
git submodule update --init --recursive
```

## Deployment

### Production (Monolithic on Same Domain)
- Deploy both frontend and backend to same server
- Frontend: `https://yourdomain.com/`
- Backend: `https://yourdomain.com/api/v1/`
- Nginx routes `/api/*` to backend, others to frontend

### Production (Separate Domains)
- Frontend: Deploy to `https://app.yourdomain.com` (Vercel, Netlify, etc)
- Backend: Deploy to `https://api.yourdomain.com` (AWS, Railway, etc)
- Update `NEXT_PUBLIC_API_URL` accordingly

See `docs/production-deployment.md` for detailed deployment guide.

## Getting Started

1. **Setup Frontend**
   ```bash
   cd frontend
   pnpm install
   cp .env.example .env.local
   pnpm dev
   ```

2. **Setup Backend**
   ```bash
   cd backend
   pnpm install
   cp .env.example .env.local
   pnpm db:push
   pnpm dev
   ```

3. **Test Communication**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001/api/v1/user/profile
   - Check browser console for API calls

## File Migration Guide

Each folder has its own:
- `package.json` - Dependencies for that service
- `tsconfig.json` - TypeScript configuration
- `next.config.ts` - Next.js configuration
- `.env.example` - Environment variables template
- `.gitignore` - Git ignore rules

## Next Steps

1. Create `frontend/` and `backend/` folder structures
2. Move frontend files to `frontend/src/`
3. Move backend files to `backend/src/`
4. Update import paths
5. Create separate `package.json` for each
6. Create separate `.env.example` for each
7. Test both services independently
8. Configure Docker Compose (optional)
