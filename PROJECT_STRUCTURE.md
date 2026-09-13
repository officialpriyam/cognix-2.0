# 📁 Project Structure - Frontend & Backend Separation

**Your project has been reorganized with completely separated frontend and backend folders.**

## 🎯 Start Here

👉 **Read First:** [FRONTEND_BACKEND_SETUP.md](./FRONTEND_BACKEND_SETUP.md) - Complete setup guide

## 📂 Folder Organization

### Frontend (`frontend/`)
The React/Next.js user interface application

```
frontend/
├── src/
│   ├── app/              # Next.js App Router & pages
│   ├── components/       # Reusable React components
│   ├── hooks/            # React hooks (useApi, etc)
│   ├── lib/
│   │   ├── api/client.ts
│   │   └── auth/auth-client.ts
│   └── types/
├── package.json          # Frontend dependencies
├── next.config.ts
├── tsconfig.json
├── .env.example
└── README.md
```

**Port:** 3000
**Start:** `cd frontend && pnpm dev`

### Backend (`backend/`)
The REST API server

```
backend/
├── src/
│   ├── app/api/v1/       # API routes
│   │   ├── auth/
│   │   ├── user/
│   │   ├── chat/
│   │   └── ...
│   ├── lib/
│   │   ├── api/handlers.ts
│   │   ├── api/middleware.ts
│   │   ├── auth/
│   │   └── db/
│   └── types/
├── package.json          # Backend dependencies
├── next.config.ts
├── tsconfig.json
├── drizzle.config.ts
├── .env.example
└── README.md
```

**Port:** 3001
**Start:** `cd backend && pnpm dev`

## 🚀 Quick Start

### 1. Backend (Terminal 1)
```bash
cd backend
pnpm install
cp .env.example .env.local
pnpm db:push            # Optional: setup database
pnpm dev                # Runs on http://localhost:3001
```

### 2. Frontend (Terminal 2)
```bash
cd frontend
pnpm install
cp .env.example .env.local
pnpm dev                # Runs on http://localhost:3000
```

### 3. Test
```bash
# Open http://localhost:3000 in browser
# API available at: http://localhost:3001/api/v1/*
```

## 📚 Key Files

| File | Purpose | Location |
|------|---------|----------|
| API Client | Frontend makes requests to backend | `frontend/src/lib/api/client.ts` |
| useApi Hooks | React hooks for CRUD operations | `frontend/src/hooks/useApi.ts` |
| Handler Wrapper | Backend route standardization | `backend/src/lib/api/handlers.ts` |
| Security Middleware | CORS, rate limiting, etc | `backend/src/lib/api/middleware.ts` |
| API Routes | All endpoints under /api/v1/ | `backend/src/app/api/v1/` |

## 🔄 Communication Flow

```
Frontend Component
    ↓
useApiGet() / useApiPost() hook
    ↓
API Client (frontend/src/lib/api/client.ts)
    ↓ HTTPS Request
Backend Route Handler
    ↓
Handler Wrapper (security, validation)
    ↓
Route Logic
    ↓ HTTPS Response
Frontend receives JSON
    ↓
Component updates UI
```

## 🌐 Configuration

Each folder has its own environment configuration:

### Frontend (.env.local)
```bash
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_ALLOWED_ORIGINS=http://localhost:3000
BETTER_AUTH_URL=http://localhost:3001
```

### Backend (.env.local)
```bash
PORT=3001
DATABASE_URL=postgres://...
BETTER_AUTH_SECRET=secret
BETTER_AUTH_URL=http://localhost:3001
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_ALLOWED_ORIGINS=http://localhost:3000
```

## 📖 Documentation

### Getting Started
- **[FRONTEND_BACKEND_SETUP.md](./FRONTEND_BACKEND_SETUP.md)** ⭐ START HERE
- [frontend/README.md](./frontend/README.md) - Frontend docs
- [backend/README.md](./backend/README.md) - Backend docs

### Architecture & Design
- [docs/FOLDER_STRUCTURE_GUIDE.md](./docs/FOLDER_STRUCTURE_GUIDE.md)
- [docs/API_ARCHITECTURE.md](./docs/API_ARCHITECTURE.md)
- [docs/backend-frontend-separation.md](./docs/backend-frontend-separation.md)

### Guides & Reference
- [docs/api-quick-reference.md](./docs/api-quick-reference.md)
- [docs/production-deployment.md](./docs/production-deployment.md)
- [docs/migration-guide.md](./docs/migration-guide.md)

## 🎯 Common Tasks

### Add New API Endpoint
```bash
# 1. Create route in backend
mkdir -p backend/src/app/api/v1/example
touch backend/src/app/api/v1/example/route.ts

# 2. Implement handler
# 3. Test endpoint
# 4. Use in frontend with useApiPost()
```

### Add New Frontend Page
```bash
# 1. Create page in frontend
touch frontend/src/app/new-page/page.tsx

# 2. Add components
# 3. Use useApiGet() to fetch data
```

### Run Database Studio
```bash
cd backend
pnpm db:studio
# Opens database UI
```

### Build for Production
```bash
# Backend
cd backend
pnpm build
pnpm start

# Frontend
cd frontend
pnpm build
pnpm start
```

## 🔐 Security Features

All automatically included:

✅ CORS validation
✅ Rate limiting (100 req/min)
✅ Security headers
✅ Bearer token auth
✅ Role-based access control
✅ Input validation
✅ Error handling

## 🚀 Deployment Options

### Same Domain (Monolithic)
```
https://yourdomain.com/          Frontend
https://yourdomain.com/api/v1/   Backend API
```

### Separate Domains (Microservices)
```
https://app.yourdomain.com/      Frontend
https://api.yourdomain.com/      Backend API
```

### Cloud Platforms
```
Frontend: Vercel / Netlify
Backend:  Railway / Render
```

See [docs/production-deployment.md](./docs/production-deployment.md) for details.

## ✅ Setup Checklist

- [ ] Read [FRONTEND_BACKEND_SETUP.md](./FRONTEND_BACKEND_SETUP.md)
- [ ] Install backend dependencies: `cd backend && pnpm install`
- [ ] Install frontend dependencies: `cd frontend && pnpm install`
- [ ] Setup backend database: `cd backend && pnpm db:push`
- [ ] Create frontend .env.local
- [ ] Create backend .env.local
- [ ] Start backend: `cd backend && pnpm dev`
- [ ] Start frontend: `cd frontend && pnpm dev`
- [ ] Test frontend reaches backend
- [ ] Read [docs/API_ARCHITECTURE.md](./docs/API_ARCHITECTURE.md)

## 🆘 Troubleshooting

**Frontend can't reach backend?**
- Verify backend is running on port 3001
- Check `NEXT_PUBLIC_API_URL` in frontend/.env.local
- Verify network connectivity

**Port already in use?**
```bash
# Check what's using port 3000/3001
lsof -i :3000
lsof -i :3001

# Kill if needed
kill -9 <PID>
```

**Database connection error?**
- Verify PostgreSQL is running
- Check `DATABASE_URL` in backend/.env.local
- Run: `cd backend && pnpm db:push`

## 📞 Support

1. Check [FRONTEND_BACKEND_SETUP.md](./FRONTEND_BACKEND_SETUP.md)
2. Read [docs/API_ARCHITECTURE.md](./docs/API_ARCHITECTURE.md)
3. See [frontend/README.md](./frontend/README.md) or [backend/README.md](./backend/README.md)
4. Check [docs/](./docs/) folder for more guides

## 🎉 You're Ready!

Your project is now organized with:
- ✅ Completely separated frontend and backend
- ✅ Independent deployment capability
- ✅ Professional microservices architecture
- ✅ Production-ready security
- ✅ Comprehensive documentation

**Start here:** [FRONTEND_BACKEND_SETUP.md](./FRONTEND_BACKEND_SETUP.md) 👈
