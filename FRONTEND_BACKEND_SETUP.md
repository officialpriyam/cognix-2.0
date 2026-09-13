# Frontend & Backend Separate Folders - Setup Guide

Your project now has **completely separated frontend and backend folders** for true microservices architecture.

## 📁 Project Structure

```
project-root/
├── frontend/                    # React/Next.js Frontend App
│   ├── src/
│   │   ├── app/                # Next.js App Router & pages
│   │   ├── components/         # Reusable React components
│   │   ├── hooks/              # React hooks (useApi, etc)
│   │   ├── lib/
│   │   │   ├── api/
│   │   │   │   └── client.ts   # Frontend API client
│   │   │   ├── auth/
│   │   │   │   └── auth-client.ts  # Frontend auth service
│   │   │   └── utils/          # Frontend utilities
│   │   ├── types/              # Frontend types
│   │   └── styles/
│   ├── package.json            # Frontend dependencies
│   ├── next.config.ts          # Frontend config
│   ├── tsconfig.json           # Frontend TypeScript config
│   ├── .env.example            # Frontend env template
│   └── .env.local              # Frontend env (create manually)
│
├── backend/                     # Backend API Server
│   ├── src/
│   │   ├── app/
│   │   │   ├── api/            # API routes (/api/v1/*)
│   │   │   │   ├── user/
│   │   │   │   ├── chat/
│   │   │   │   ├── auth/
│   │   │   │   └── ...
│   │   │   └── middleware.ts   # Next.js middleware
│   │   ├── lib/
│   │   │   ├── api/
│   │   │   │   ├── handlers.ts    # Route handler wrapper
│   │   │   │   └── middleware.ts  # Security middleware
│   │   │   ├── auth/           # Server auth
│   │   │   ├── db/             # Database layer
│   │   │   └── utils/          # Backend utilities
│   │   ├── types/              # Backend types
│   │   └── scripts/            # Build & migration scripts
│   ├── package.json            # Backend dependencies
│   ├── next.config.ts          # Backend config
│   ├── tsconfig.json           # Backend TypeScript config
│   ├── .env.example            # Backend env template
│   ├── .env.local              # Backend env (create manually)
│   └── drizzle.config.ts       # Database config
│
├── docs/                        # Documentation
├── .gitignore
└── README.md
```

## 🚀 Quick Start (10 minutes)

### 1. Setup Frontend

```bash
# Navigate to frontend
cd frontend

# Install dependencies
pnpm install

# Create environment file
cp .env.example .env.local

# Run frontend
pnpm dev
# Frontend runs on: http://localhost:3000
```

### 2. Setup Backend

```bash
# In another terminal, navigate to backend
cd backend

# Install dependencies
pnpm install

# Create environment file
cp .env.example .env.local

# Setup database (if needed)
pnpm db:push

# Run backend
pnpm dev
# Backend runs on: http://localhost:3001
```

### 3. Verify Communication

```bash
# Check frontend can reach backend
curl http://localhost:3001/api/v1/user/profile

# You should see the API responding
```

## 🔧 Configuration

### Frontend Configuration (frontend/.env.local)

```bash
# Backend API URL
NEXT_PUBLIC_API_URL=http://localhost:3001

# Allowed CORS origins
NEXT_PUBLIC_ALLOWED_ORIGINS=http://localhost:3000

# Auth URL
BETTER_AUTH_URL=http://localhost:3001
```

### Backend Configuration (backend/.env.local)

```bash
# Server configuration
PORT=3001

# API configuration
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_ALLOWED_ORIGINS=http://localhost:3000

# Database
DATABASE_URL=postgres://username:password@localhost:5432/cognix

# Authentication
BETTER_AUTH_SECRET=your-secret-here
BETTER_AUTH_URL=http://localhost:3001

# LLM providers (as needed)
OPENAI_API_KEY=sk-...
```

## 📦 Each Folder Has Its Own

| File | Frontend | Backend |
|------|----------|---------|
| `package.json` | Frontend deps | Backend deps |
| `tsconfig.json` | Frontend config | Backend config |
| `next.config.ts` | Frontend optimized | Backend optimized |
| `.env.example` | Frontend vars | Backend vars |
| `README.md` | Frontend docs | Backend docs |

## 🔄 Development Workflow

### Running Both Services Locally

**Terminal 1: Backend**
```bash
cd backend
pnpm dev
# Listening on: http://localhost:3001
# API: http://localhost:3001/api/v1/*
```

**Terminal 2: Frontend**
```bash
cd frontend
pnpm dev
# Listening on: http://localhost:3000
# App: http://localhost:3000/
```

**Terminal 3: Database (if needed)**
```bash
cd backend
pnpm db:studio
# Opens: http://localhost:3001 (or port shown)
```

### With Docker Compose

Create `docker-compose.yml` in project root:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: cognix
      POSTGRES_PASSWORD: changeme
      POSTGRES_DB: cognix
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  backend:
    build:
      context: ./backend
    ports:
      - "3001:3001"
    environment:
      DATABASE_URL: postgres://cognix:changeme@postgres:5432/cognix
      PORT: 3001
      BETTER_AUTH_SECRET: dev-secret
      BETTER_AUTH_URL: http://localhost:3001
    depends_on:
      - postgres

  frontend:
    build:
      context: ./frontend
    ports:
      - "3000:3000"
    environment:
      NEXT_PUBLIC_API_URL: http://localhost:3001
      NEXT_PUBLIC_ALLOWED_ORIGINS: http://localhost:3000
    depends_on:
      - backend

volumes:
  postgres_data:
```

Run:
```bash
docker-compose up
# Frontend: http://localhost:3000
# Backend: http://localhost:3001
```

## 📝 API Routes Structure

All backend API routes go in `backend/src/app/api/v1/`:

```
backend/src/app/api/v1/
├── auth/
│   ├── login/route.ts
│   ├── signup/route.ts
│   └── logout/route.ts
├── user/
│   ├── profile/route.ts
│   └── [id]/route.ts
├── chat/
│   └── threads/route.ts
└── ...
```

**Example API Endpoint:**
```typescript
// backend/src/app/api/v1/user/profile/route.ts
import { createApiHandler } from "@/lib/api/handlers";

export const GET = createApiHandler(
  async (request) => {
    // Your backend logic here
    return { id: "123", name: "John" };
  },
  { requireAuth: true, methods: ["GET"] }
);
```

## 🎯 Frontend Usage

**Frontend calls backend API:**
```typescript
// frontend/src/components/UserProfile.tsx
"use client";

import { useApiGet } from "@/hooks/useApi";

export function UserProfile() {
  const { data: user, loading } = useApiGet(
    "/api/v1/user/profile"
  );

  return <div>Welcome, {user?.name}</div>;
}
```

## 🚀 Deployment Scenarios

### Option 1: Same Domain (Monolithic)
```
Frontend & Backend: https://yourdomain.com/
Frontend: https://yourdomain.com/
API: https://yourdomain.com/api/v1/

NEXT_PUBLIC_API_URL=""
```

### Option 2: Separate Domains (Microservices)
```
Frontend: https://app.yourdomain.com/
Backend: https://api.yourdomain.com/

NEXT_PUBLIC_API_URL=https://api.yourdomain.com
```

### Option 3: Separate Cloud Platforms
```
Frontend: Vercel (https://app.vercel.app/)
Backend: Railway (https://backend-railway.app/)

NEXT_PUBLIC_API_URL=https://backend-railway.app
```

## 📦 Dependency Management

### Frontend Dependencies
- React, Next.js
- Better Auth (client)
- Zod validation
- TanStack Query (optional)
- UI libraries

### Backend Dependencies
- Next.js API routes
- Better Auth (server)
- Drizzle ORM
- PostgreSQL driver
- Redis (optional)

### Shared (Optional)
- TypeScript types
- Zod schemas
- Constants

## 🔐 Security Configuration

Each folder has its own `.env.example`:

**Frontend Security:**
- API URL for backend
- CORS origins

**Backend Security:**
- Database credentials
- Auth secrets
- API keys
- Rate limiting config

## 📚 Documentation

See the main `docs/` folder for:
- `FOLDER_STRUCTURE_GUIDE.md` - Detailed structure
- `GETTING_STARTED.md` - Getting started
- `API_ARCHITECTURE.md` - API details
- `production-deployment.md` - Deployment guide
- `migration-guide.md` - Code migration

## ❓ Common Tasks

### Add New Frontend Page
```bash
cd frontend
touch src/app/new-page/page.tsx
```

### Add New Backend API Endpoint
```bash
cd backend
mkdir -p src/app/api/v1/new-endpoint
touch src/app/api/v1/new-endpoint/route.ts
```

### Run Frontend Only
```bash
cd frontend
pnpm dev
```

### Run Backend Only
```bash
cd backend
pnpm dev
# Runs on port 3001 (no frontend needed)
```

### Build for Production

**Frontend:**
```bash
cd frontend
pnpm build
pnpm start
```

**Backend:**
```bash
cd backend
pnpm build
pnpm start
```

## 🐛 Troubleshooting

### Frontend Can't Reach Backend
1. Verify backend is running: `http://localhost:3001/api/v1/user/profile`
2. Check `NEXT_PUBLIC_API_URL` in frontend/.env.local
3. Check CORS configuration in backend

### Port Already in Use
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Kill process on port 3001
lsof -ti:3001 | xargs kill -9
```

### Database Connection Error
1. Verify PostgreSQL is running
2. Check `DATABASE_URL` in backend/.env.local
3. Run: `cd backend && pnpm db:push`

### TypeScript Errors
1. Check `tsconfig.json` paths
2. Run: `pnpm check-types`
3. Rebuild: `rm -rf .next && pnpm build`

## ✅ Setup Checklist

- [ ] Frontend folder created with package.json
- [ ] Backend folder created with package.json
- [ ] Frontend dependencies installed (`pnpm install`)
- [ ] Backend dependencies installed (`pnpm install`)
- [ ] Frontend .env.local created
- [ ] Backend .env.local created
- [ ] Frontend running on http://localhost:3000
- [ ] Backend running on http://localhost:3001
- [ ] Frontend can call backend API
- [ ] Database initialized (if using)

## 🎉 You're Ready!

Your frontend and backend are now completely separated and can:
- ✅ Run independently
- ✅ Scale independently
- ✅ Deploy independently
- ✅ Use different technology stacks
- ✅ Have separate teams work on each

Start developing! 🚀
