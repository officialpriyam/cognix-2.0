# 📦 Migration Guide - Moving from Monolithic to Separated Structure

Guide to migrate your existing code from the original monolithic structure to the new separated frontend/backend folders.

## 📋 Overview

| Aspect | Before | After |
|--------|--------|-------|
| Structure | `src/` (monolithic) | `frontend/src/` + `backend/src/` |
| Ports | Single app | Frontend (3000) + Backend (3001) |
| Dependencies | Single package.json | Separate package.json |
| Deployment | Single build | Independent builds |

## 🔄 Migration Steps

### Step 1: Backup Everything

```bash
# Create backup branch
git checkout -b backup/original-monolithic
git push origin backup/original-monolithic

# You're now ready to migrate
git checkout main
```

### Step 2: Identify Frontend Files

Frontend files to move to `frontend/src/`:

```
src/app/(auth)/          → frontend/src/app/(auth)/
src/app/(chat)/          → frontend/src/app/(chat)/
src/app/(public)/        → frontend/src/app/(public)/
src/app/layout.tsx       → frontend/src/app/layout.tsx
src/app/globals.css      → frontend/src/app/globals.css
src/app/store/           → frontend/src/app/store/

src/components/          → frontend/src/components/
src/hooks/useApi.ts      → frontend/src/hooks/useApi.ts
src/i18n/                → frontend/src/i18n/

src/lib/api/client.ts    → frontend/src/lib/api/client.ts
src/lib/auth/auth-client.ts  → frontend/src/lib/auth/auth-client.ts
src/lib/utils/           → frontend/src/lib/utils/

src/types/               → frontend/src/types/
public/                  → frontend/public/
```

### Step 3: Identify Backend Files

Backend files to move to `backend/src/`:

```
src/app/api/v1/          → backend/src/app/api/v1/
src/app/middleware.ts    → backend/src/app/middleware.ts

src/lib/api/handlers.ts  → backend/src/lib/api/handlers.ts
src/lib/api/middleware.ts    → backend/src/lib/api/middleware.ts
src/lib/auth/server.ts   → backend/src/lib/auth/server.ts
src/lib/db/              → backend/src/lib/db/
src/lib/cache/           → backend/src/lib/cache/

scripts/                 → backend/scripts/
drizzle.config.ts        → backend/
```

### Step 4: Copy Files

```bash
# Move frontend files
cp -r src/app/(auth) frontend/src/app/
cp -r src/app/(chat) frontend/src/app/
cp -r src/app/(public) frontend/src/app/
cp src/app/layout.tsx frontend/src/app/
cp src/app/globals.css frontend/src/app/
cp -r src/components frontend/src/
cp -r src/hooks frontend/src/
cp -r src/i18n frontend/src/
cp -r src/lib/api/client.ts frontend/src/lib/api/
cp -r src/lib/auth/auth-client.ts frontend/src/lib/auth/
cp -r src/types frontend/src/
cp -r public/* frontend/public/

# Move backend files
cp -r src/app/api backend/src/app/
cp src/app/middleware.ts backend/src/app/
cp src/lib/api/handlers.ts backend/src/lib/api/
cp src/lib/api/middleware.ts backend/src/lib/api/
cp -r src/lib/auth backend/src/lib/
cp -r src/lib/db backend/src/lib/
cp -r scripts backend/
cp drizzle.config.ts backend/
```

### Step 5: Update Import Paths

Frontend imports: Change `src/` → `@/`

**Before:**
```typescript
import { apiClient } from "src/lib/api/client";
import { useApi } from "src/hooks/useApi";
import type { User } from "src/types/user";
```

**After:**
```typescript
import { apiClient } from "@/lib/api/client";
import { useApi } from "@/hooks/useApi";
import type { User } from "@/types/user";
```

Backend imports: Same pattern

**Before:**
```typescript
import { createApiHandler } from "src/lib/api/handlers";
import { db } from "src/lib/db";
```

**After:**
```typescript
import { createApiHandler } from "@/lib/api/handlers";
import { db } from "@/lib/db";
```

### Step 6: Fix Module Imports

**Frontend module imports:**

```typescript
// Before (from backend)
import { createApiHandler } from "@/lib/api/handlers";

// After (removed - not needed in frontend)
// Only use frontend libs
```

**Backend module imports:**

```typescript
// Before (from frontend)
import { useApiGet } from "@/hooks/useApi";

// After (removed - not needed in backend)
// Only use backend libs
```

### Step 7: Update Environment Variables

Create `frontend/.env.local`:
```bash
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_ALLOWED_ORIGINS=http://localhost:3000
BETTER_AUTH_URL=http://localhost:3001
```

Create `backend/.env.local`:
```bash
PORT=3001
DATABASE_URL=postgres://user:pass@localhost:5432/db
BETTER_AUTH_SECRET=secret
BETTER_AUTH_URL=http://localhost:3001
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_ALLOWED_ORIGINS=http://localhost:3000
```

### Step 8: Verify Configuration Files

**Frontend configuration files are already created:**
- ✅ `frontend/package.json`
- ✅ `frontend/next.config.ts`
- ✅ `frontend/tsconfig.json`
- ✅ `frontend/.env.example`

**Backend configuration files are already created:**
- ✅ `backend/package.json`
- ✅ `backend/next.config.ts`
- ✅ `backend/tsconfig.json`
- ✅ `backend/.env.example`

### Step 9: Install Dependencies

```bash
# Install frontend
cd frontend
pnpm install

# Install backend
cd backend
pnpm install
```

### Step 10: Fix TypeScript Errors

```bash
# Check frontend
cd frontend
pnpm check-types

# Check backend
cd backend
pnpm check-types

# Fix any remaining import errors
```

### Step 11: Database Migrations

```bash
# In backend folder
pnpm db:push

# Or if you need to migrate data
pnpm db:migrate
```

### Step 12: Test Both Services

**Terminal 1: Backend**
```bash
cd backend
pnpm dev
# Should run on http://localhost:3001
```

**Terminal 2: Frontend**
```bash
cd frontend
pnpm dev
# Should run on http://localhost:3000
```

**Terminal 3: Test**
```bash
# Test API endpoint
curl http://localhost:3001/api/v1/user/profile

# Test frontend reaches backend
# Open http://localhost:3000 and verify it works
```

### Step 13: Delete Old src/ Files

Once everything works:

```bash
# Remove old monolithic src/
rm -rf src/

# Note: Keep root-level config files
# - next.config.ts (if still needed)
# - tsconfig.json (if still needed)
# - package.json (update to workspace format, or remove if not needed)
```

## 🔍 Import Path Changes

### Common Frontend Import Changes

| Before | After | Notes |
|--------|-------|-------|
| `import ... from "src/components/..."` | `import ... from "@/components/..."` | Use path alias |
| `import ... from "src/hooks/useApi"` | `import ... from "@/hooks/useApi"` | Use path alias |
| `import ... from "src/lib/api/client"` | `import ... from "@/lib/api/client"` | Use path alias |
| `import ... from "src/types/..."` | `import ... from "@/types/..."` | Use path alias |

### Common Backend Import Changes

| Before | After | Notes |
|--------|--------|-------|
| `import ... from "src/lib/api/handlers"` | `import ... from "@/lib/api/handlers"` | Use path alias |
| `import ... from "src/lib/db"` | `import ... from "@/lib/db"` | Use path alias |
| `import ... from "src/types/..."` | `import ... from "@/types/..."` | Use path alias |

## 📝 Script Updates

Update any scripts or build tools that reference `src/`:

**Before:**
```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build"
  }
}
```

**After:**
```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build"
  }
}
```

(No changes needed - Next.js handles it!)

## 🧪 Testing After Migration

### Automated Tests

```bash
# Frontend tests
cd frontend
pnpm test

# Backend tests
cd backend
pnpm test
```

### Manual Testing Checklist

- [ ] Backend starts: `cd backend && pnpm dev`
- [ ] Frontend starts: `cd frontend && pnpm dev`
- [ ] Frontend loads at http://localhost:3000
- [ ] Backend API responds at http://localhost:3001/api/v1/*
- [ ] Frontend can fetch data from backend
- [ ] Authentication flow works
- [ ] Database operations work
- [ ] File uploads work (if applicable)
- [ ] API errors are handled correctly

## 🆘 Troubleshooting Migration

### "Module not found" errors

**Problem:** Can't find imports with `@/` paths

**Solution:**
```bash
# Check tsconfig.json paths
cat frontend/tsconfig.json | grep -A 5 '"paths"'
cat backend/tsconfig.json | grep -A 5 '"paths"'

# Should contain:
# "@/*": ["./src/*"]
```

### "Port already in use" error

**Problem:** Port 3000 or 3001 already in use

**Solution:**
```bash
# Find process
lsof -i :3000
lsof -i :3001

# Kill it
kill -9 <PID>

# Or use different port
PORT=3002 pnpm dev  # Frontend
PORT=3003 pnpm dev  # Backend
```

### "Database not found" error

**Problem:** Backend can't connect to database

**Solution:**
```bash
# Verify database URL
cat backend/.env.local | grep DATABASE_URL

# Test connection
psql $DATABASE_URL

# Push schema
cd backend && pnpm db:push
```

### "TypeScript compilation errors"

**Problem:** TS errors after migration

**Solution:**
```bash
# Check types
pnpm check-types

# Rebuild
rm -rf .next
pnpm build

# Check for circular imports
# Look for: frontend files importing from backend/lib/api/handlers
# Look for: backend files importing from frontend/hooks/useApi
```

### "Frontend can't reach backend"

**Problem:** CORS or API URL error

**Solution:**
```bash
# Verify NEXT_PUBLIC_API_URL
cat frontend/.env.local | grep NEXT_PUBLIC_API_URL

# Should be: http://localhost:3001

# Verify CORS origins in backend
cat backend/.env.local | grep NEXT_PUBLIC_ALLOWED_ORIGINS

# Should include: http://localhost:3000
```

## 📋 Migration Checklist

- [ ] Create backup branch
- [ ] Identify frontend vs backend files
- [ ] Copy files to new locations
- [ ] Update all import paths
- [ ] Remove backend imports from frontend
- [ ] Remove frontend imports from backend
- [ ] Create .env.local files
- [ ] Install dependencies
- [ ] Run TypeScript checks
- [ ] Push database schema
- [ ] Test both services separately
- [ ] Test frontend ↔ backend communication
- [ ] Delete old src/ folder
- [ ] Commit changes
- [ ] Deploy to production

## 🎉 After Migration

You now have:
✅ Completely separated frontend and backend
✅ Independent deployment capability
✅ Separate dependency management
✅ Microservices-ready architecture
✅ Production-ready security

**Next steps:**
1. Read [FRONTEND_BACKEND_SETUP.md](../FRONTEND_BACKEND_SETUP.md)
2. Review [docs/production-deployment.md](../docs/production-deployment.md)
3. Update CI/CD pipelines for separate builds
4. Configure deployment platforms

## 📚 Additional Resources

- [FRONTEND_BACKEND_SETUP.md](../FRONTEND_BACKEND_SETUP.md) - Setup guide
- [PROJECT_STRUCTURE.md](../PROJECT_STRUCTURE.md) - Folder structure
- [DEVELOPER_REFERENCE.md](../DEVELOPER_REFERENCE.md) - Developer guide
- [docs/API_ARCHITECTURE.md](../docs/API_ARCHITECTURE.md) - Architecture details

---

**Need help?** Check the troubleshooting section or review the documentation!
