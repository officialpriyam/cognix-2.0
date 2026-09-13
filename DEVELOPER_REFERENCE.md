# ⚡ Developer Quick Reference

Quick lookup for common tasks in the separated frontend/backend architecture.

## 🚀 Getting Started

```bash
# Terminal 1: Start Backend
cd backend && pnpm dev          # Port 3001

# Terminal 2: Start Frontend  
cd frontend && pnpm dev         # Port 3000

# Terminal 3: Database UI (optional)
cd backend && pnpm db:studio    # View/edit database
```

## 📍 Where Things Live

| What | Where | Type |
|------|-------|------|
| React components | `frontend/src/components/` | `.tsx` |
| Pages & routes | `frontend/src/app/` | `.tsx` |
| API hooks | `frontend/src/hooks/useApi.ts` | Hook |
| Frontend auth | `frontend/src/lib/auth/auth-client.ts` | Utility |
| Frontend API client | `frontend/src/lib/api/client.ts` | Utility |
| API endpoints | `backend/src/app/api/v1/` | Route |
| Backend auth | `backend/src/lib/auth/server.ts` | Utility |
| Route handler | `backend/src/lib/api/handlers.ts` | Wrapper |
| Security middleware | `backend/src/lib/api/middleware.ts` | Middleware |
| Database schema | `backend/src/lib/db/` | Drizzle ORM |
| Types | `frontend/src/types/` or `backend/src/types/` | `.ts` |

## 🔌 Frontend → Backend API Call

### Method 1: Using React Hook (Recommended)

```typescript
// frontend/src/components/MyComponent.tsx
import { useApiGet, useApiPost } from "@/hooks/useApi";

export function MyComponent() {
  // GET request
  const { data, loading, error } = useApiGet("/api/v1/user/profile");

  // POST request
  const { post } = useApiPost("/api/v1/example");

  const handleCreate = async () => {
    const response = await post({ name: "Test" });
    if (response.success) {
      console.log(response.data);
    }
  };

  return (
    <div>
      {loading ? "Loading..." : data?.name}
      <button onClick={handleCreate}>Create</button>
    </div>
  );
}
```

### Method 2: Using API Client Directly

```typescript
import { apiClient } from "@/lib/api/client";

const response = await apiClient.post("/api/v1/example", {
  name: "Test",
});

if (response.success) {
  console.log(response.data);
}
```

## 🔐 Backend API Endpoint

### Create New Endpoint

```typescript
// backend/src/app/api/v1/example/route.ts
import { createApiHandler, validateRequestBody } from "@/lib/api/handlers";
import { z } from "zod";

// 1. Define validation schema
const ExampleSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
});

// 2. Create handler
export const POST = createApiHandler(
  async (request) => {
    // Validate input
    const validation = await validateRequestBody(
      request,
      ExampleSchema
    );
    if (!validation.success) {
      throw new Error(validation.error);
    }

    // Your logic here
    const { name } = validation.data;
    
    // Return success response
    return {
      id: "123",
      name: name,
      createdAt: new Date(),
    };
  },
  {
    requireAuth: true,           // Require authentication
    methods: ["POST"],           // Allowed methods
    description: "Create example",
  }
);
```

### Available Options

```typescript
createApiHandler(handler, {
  requireAuth: true,      // Require bearer token
  requireRole: "admin",   // Require specific role
  methods: ["GET", "POST"],
  description: "Endpoint description",
});
```

## 🧪 Testing

### Frontend Tests
```bash
cd frontend
pnpm test              # Run once
pnpm test:watch        # Watch mode
pnpm test:e2e          # End-to-end tests
```

### Backend Tests
```bash
cd backend
pnpm test              # Run once
pnpm test:watch        # Watch mode
```

## 🗄️ Database

### View Database
```bash
cd backend
pnpm db:studio
# Opens UI at http://localhost:5555
```

### Update Schema
```bash
# 1. Edit schema
vi backend/src/lib/db/schema.ts

# 2. Generate migration
pnpm db:generate

# 3. Apply to database
pnpm db:push
```

### Query Database
```typescript
import { db } from "@/lib/db";
import { usersTable } from "@/lib/db/schema";

const users = await db
  .select()
  .from(usersTable)
  .where(eq(usersTable.email, "user@example.com"));
```

## 🔐 Authentication

### Frontend Login
```typescript
import { useAuthClient } from "@/lib/auth/auth-client";

export function LoginPage() {
  const { login, isAuthenticated } = useAuthClient();

  const handleLogin = async () => {
    const result = await login("user@example.com", "password");
    if (result.success) {
      // Navigate to dashboard
    }
  };

  return (
    <button onClick={handleLogin}>
      {isAuthenticated ? "Logout" : "Login"}
    </button>
  );
}
```

### Backend Check Auth
```typescript
// In any backend route
export const GET = createApiHandler(
  async (request) => {
    // Session automatically available
    const session = await getSession();
    
    if (!session?.user) {
      throw new Error("Not authenticated");
    }

    return { userId: session.user.id };
  },
  { requireAuth: true }  // Enforces auth
);
```

## 📡 Environment Variables

### Frontend (.env.local)
```bash
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_ALLOWED_ORIGINS=http://localhost:3000
BETTER_AUTH_URL=http://localhost:3001
```

### Backend (.env.local)
```bash
PORT=3001
DATABASE_URL=postgres://user:pass@localhost:5432/cognix
BETTER_AUTH_SECRET=your-secret-key
BETTER_AUTH_URL=http://localhost:3001
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_ALLOWED_ORIGINS=http://localhost:3000
```

## 🎯 Common Patterns

### Fetch User's Data
```typescript
// Frontend
const { data: profile } = useApiGet("/api/v1/user/profile");

// Backend
export const GET = createApiHandler(
  async (request) => {
    const session = await getSession();
    const userId = session?.user?.id;

    const user = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, userId));

    return user[0];
  },
  { requireAuth: true }
);
```

### Create Resource with Auth
```typescript
// Frontend
const { post } = useApiPost("/api/v1/chat/threads");
const response = await post({
  title: "New Chat",
  model: "gpt-4",
});

// Backend
export const POST = createApiHandler(
  async (request) => {
    const { title, model } = await validateRequestBody(
      request,
      z.object({
        title: z.string(),
        model: z.string(),
      })
    );

    const session = await getSession();
    
    const thread = await db.insert(threadsTable).values({
      userId: session.user.id,
      title,
      model,
    });

    return thread;
  },
  { requireAuth: true }
);
```

### File Upload
```typescript
// Frontend
const { uploadFile } = useApiUpload("/api/v1/files/upload");

const handleUpload = async (file: File) => {
  const response = await uploadFile(file, {
    onProgress: (percent) => console.log(`${percent}%`),
  });
};

// Backend
export const POST = createApiHandler(
  async (request) => {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    // Upload to storage (S3, etc)
    const url = await uploadToStorage(file);

    return { url };
  },
  { requireAuth: true, methods: ["POST"] }
);
```

## 🚀 Build & Deploy

### Build Both
```bash
# Backend
cd backend
pnpm build

# Frontend
cd frontend
pnpm build
```

### Start Production
```bash
# Backend (Terminal 1)
cd backend
PORT=3001 pnpm start

# Frontend (Terminal 2)
cd frontend
NEXT_PUBLIC_API_URL=https://api.yourdomain.com pnpm start
```

## 🐛 Debug Mode

### Frontend Debug
```bash
# Check logs in browser console
# F12 → Console tab
# Use React DevTools: https://react.dev/learn/react-developer-tools

# API request logging
const response = await apiClient.get("/api/v1/example");
console.log(response);
```

### Backend Debug
```bash
# Check terminal output
# Enable debug mode
DEBUG=* pnpm dev

# Check response in browser Network tab
# Use Postman/Insomnia for API testing
```

## ⚡ Performance Tips

### Frontend
- Use `useApiGet` with `staleTime` option
- Memoize components with `useMemo`, `useCallback`
- Code split pages with Next.js dynamic imports
- Use TanStack Query for cache management

### Backend
- Add database indexes for frequently queried fields
- Use Redis for caching (optional)
- Implement rate limiting (default: 100 req/min)
- Use pagination for large datasets

## 🔄 API Response Format

All endpoints return consistent format:

```json
{
  "success": true,
  "data": { /* your data */ },
  "message": "Success message",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

Error response:
```json
{
  "success": false,
  "error": "Error description",
  "code": "ERROR_CODE",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

## 📚 Documentation

- Complete Setup: [FRONTEND_BACKEND_SETUP.md](../FRONTEND_BACKEND_SETUP.md)
- Architecture: [docs/API_ARCHITECTURE.md](../docs/API_ARCHITECTURE.md)
- Project Structure: [PROJECT_STRUCTURE.md](../PROJECT_STRUCTURE.md)
- Frontend Docs: [frontend/README.md](../frontend/README.md)
- Backend Docs: [backend/README.md](../backend/README.md)

## ❓ Quick Troubleshooting

| Issue | Solution |
|-------|----------|
| "Cannot reach backend" | Check `NEXT_PUBLIC_API_URL` in frontend/.env.local |
| "Port already in use" | `lsof -i :3000` or `lsof -i :3001` then `kill -9 <PID>` |
| "Database error" | Run `cd backend && pnpm db:push` |
| "TypeScript errors" | Run `pnpm check-types` in affected folder |
| "Module not found" | Check `tsconfig.json` path aliases |

---

**Pro tip:** Keep both terminals open with `pnpm dev` running to see real-time errors!
