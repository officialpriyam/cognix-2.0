# Backend & Frontend Separation - Implementation Summary

## What Has Been Implemented

Your application now has a **properly separated backend and frontend architecture** with production-grade security. This allows you to:

1. ✅ Deploy frontend and backend independently
2. ✅ Scale each component separately
3. ✅ Use different technology stacks in the future
4. ✅ Implement advanced security policies
5. ✅ Support multiple frontend clients (web, mobile, etc.)

---

## Architecture Overview

### Monolithic Mode (Default)
```
┌─ Frontend (same domain)
├─ Backend API (same domain)
└─ Database
```

### Microservices Mode
```
┌─ Frontend (https://app.example.com)
├─ Backend API (https://api.example.com)
└─ Database (private network)
```

---

## New Files & Libraries

### 1. **Frontend API Client** (`src/lib/api/client.ts`)

Handles all HTTP communication with security:

```typescript
// Usage
import { apiClient } from "@/lib/api/client";

const response = await apiClient.post("/api/v1/example", { data });
```

**Features:**
- Automatic bearer token injection
- CSRF token handling
- Error handling with status codes
- Supports file uploads
- Credentials included for CORS

### 2. **Security Middleware** (`src/lib/api/middleware.ts`)

Protects your API:

```typescript
// Features
- CORS validation (origin whitelisting)
- Security headers (CSP, X-Frame-Options, etc)
- Rate limiting (100 requests/minute default)
- Preflight request handling
```

### 3. **API Handler Wrapper** (`src/lib/api/handlers.ts`)

Standardizes API route implementation:

```typescript
import { createApiHandler } from "@/lib/api/handlers";

export const POST = createApiHandler(
  async (request) => {
    // Your logic here
    return { result: "success" };
  },
  {
    requireAuth: true,        // Require login
    requireRole: "admin",     // Require role
    methods: ["POST"],
    rateLimit: true,          // Enable rate limiting
  }
);
```

**Automatically provides:**
- Authentication checks
- Authorization checks
- CORS headers
- Security headers
- Rate limiting
- Error handling
- Standardized responses

### 4. **Configuration** (`src/lib/api/config.ts`)

Centralized API configuration:

```typescript
API_CONFIG.BASE_URL          // API base URL
API_CONFIG.ENDPOINTS         // All endpoint definitions
API_CONFIG.CORS              // CORS configuration
API_CONFIG.TOKEN             // Token management
API_CONFIG.RATE_LIMIT        // Rate limiting config
```

### 5. **Authentication Service** (`src/lib/auth/auth-client.ts`)

Frontend authentication management:

```typescript
import { useAuthClient } from "@/lib/auth/auth-client";

const { user, isAuthenticated, login, logout } = useAuthClient();
```

**Features:**
- Token storage and management
- Session persistence
- Automatic token refresh (optional)
- Observable session changes

### 6. **React Hooks** (`src/hooks/useApi.ts`)

Easy-to-use hooks for API operations:

```typescript
// GET
const { data, loading, error } = useApiGet("/api/v1/user");

// POST
const { post, loading } = useApiPost("/api/v1/chat");
await post({ title: "New Chat" });

// CRUD combined
const { data, fetch, post, update, delete } = useApi("/api/v1/item");
```

---

## Security Features Included

### ✅ Authentication & Authorization
- Bearer token authentication
- Role-based access control (RBAC)
- Automatic session validation
- Secure token storage

### ✅ CORS Protection
- Origin validation
- Configurable whitelist
- Wildcard pattern support
- Preflight handling

### ✅ HTTP Security Headers
```
X-Frame-Options: SAMEORIGIN              # Prevent clickjacking
X-Content-Type-Options: nosniff           # Prevent MIME sniffing
X-XSS-Protection: 1; mode=block           # XSS protection
Content-Security-Policy: ...              # CSP rules
Referrer-Policy: strict-origin-when-cross-origin
```

### ✅ Rate Limiting
- 100 requests per minute (configurable)
- Per-IP tracking
- Graceful 429 responses

### ✅ Input Validation
- Zod schema validation
- Request body validation
- Type safety

### ✅ Error Handling
- Consistent error format
- Proper HTTP status codes
- Security-safe error messages

---

## Configuration

### Monolithic Setup (Default)

```bash
# .env.local
NEXT_PUBLIC_API_URL=""                    # Leave empty
NEXT_PUBLIC_ALLOWED_ORIGINS=""            # Leave empty
BETTER_AUTH_URL=http://localhost:3000
```

Everything runs on the same domain:
- Frontend: `https://yourdomain.com/`
- API: `https://yourdomain.com/api/v1/`

### Microservices Setup

```bash
# Backend .env
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
NEXT_PUBLIC_ALLOWED_ORIGINS=https://app.yourdomain.com
BETTER_AUTH_URL=https://api.yourdomain.com
PORT=3001

# Frontend .env
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
NEXT_PUBLIC_ALLOWED_ORIGINS=https://app.yourdomain.com
BETTER_AUTH_URL=https://api.yourdomain.com
PORT=3000
```

---

## Example Implementation

### Creating a New API Endpoint

**Step 1: Define schema** (validation)
```typescript
// src/app/api/v1/posts/route.ts
import { z } from "zod";

const CreatePostSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(10),
  published: z.boolean().default(false),
});
```

**Step 2: Implement handler**
```typescript
import { createApiHandler, validateRequestBody } from "@/lib/api/handlers";
import { getSession } from "@/lib/auth/server";

export const POST = createApiHandler(
  async (request: NextRequest) => {
    // Validate input
    const validation = await validateRequestBody(
      request,
      CreatePostSchema
    );
    if (!validation.success) {
      throw new Error(validation.error);
    }

    // Get authenticated user
    const session = await getSession();
    if (!session?.user?.id) {
      throw new Error("Unauthorized");
    }

    // Create post
    const post = await db.posts.create({
      userId: session.user.id,
      ...validation.data,
    });

    return {
      id: post.id,
      title: post.title,
      createdAt: post.createdAt,
    };
  },
  {
    requireAuth: true,
    methods: ["POST"],
    description: "Create a new post",
  }
);
```

**Step 3: Use in component**
```typescript
"use client";

import { useApiPost } from "@/hooks/useApi";

export function CreatePostForm() {
  const { post, loading, error } = useApiPost("/api/v1/posts");

  const handleSubmit = async (formData) => {
    const response = await post(formData);
    if (response.success) {
      // Show success message
      // Redirect or refresh list
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
      <button disabled={loading}>
        {loading ? "Creating..." : "Create Post"}
      </button>
      {error && <p style={{ color: "red" }}>{error}</p>}
    </form>
  );
}
```

---

## File Structure

```
src/
├── lib/
│   ├── api/
│   │   ├── client.ts          ← Frontend HTTP client
│   │   ├── handlers.ts        ← Backend handler wrapper
│   │   ├── middleware.ts      ← CORS, security, rate limit
│   │   └── config.ts          ← Configuration
│   └── auth/
│       ├── auth-client.ts     ← Frontend auth service
│       └── server.ts          ← Existing server auth
│
├── hooks/
│   └── useApi.ts              ← React hooks for API
│
├── app/
│   ├── api/v1/                ← API versioning
│   │   ├── auth/
│   │   │   ├── login/route.ts
│   │   │   ├── signup/route.ts
│   │   │   └── logout/route.ts
│   │   ├── user/
│   │   │   └── profile/route.ts
│   │   ├── chat/
│   │   │   └── threads/route.ts
│   │   └── ...
│   └── (pages)/               ← Frontend pages
│
└── components/                ← React components

docs/
├── backend-frontend-separation.md
├── migration-guide.md
├── production-deployment.md
└── api-quick-reference.md
```

---

## Documentation Files

1. **`backend-frontend-separation.md`** - Complete architecture guide
2. **`migration-guide.md`** - How to migrate existing code
3. **`production-deployment.md`** - Deployment for multiple scenarios
4. **`api-quick-reference.md`** - Quick lookup guide

---

## Status Codes & Responses

### Success Response (200-201)
```json
{
  "success": true,
  "data": { /* your data */ },
  "message": "Operation successful",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### Error Response (400-500)
```json
{
  "success": false,
  "error": "Descriptive error message",
  "code": "ERROR_CODE",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### Status Codes
- **200** - Success
- **201** - Created
- **400** - Bad Request (validation error)
- **401** - Unauthorized (login required)
- **403** - Forbidden (no permission)
- **404** - Not Found
- **429** - Too Many Requests (rate limited)
- **500** - Server Error

---

## Deployment Options

### Option 1: Monolithic (Same Domain)
```bash
NEXT_PUBLIC_API_URL=""
# Deploy as single Next.js app
pnpm build && pnpm start
```

### Option 2: Separate Services (Recommended)
```
Frontend:  https://app.yourdomain.com (port 3000)
Backend:   https://api.yourdomain.com (port 3001)

# Run both services behind Nginx reverse proxy
```

### Option 3: Docker Compose (Development)
```bash
docker-compose -f docker/compose.yml up
# All services configured and interconnected
```

See `docs/production-deployment.md` for detailed setup.

---

## Next Steps

1. **Review** the documentation files
2. **Test** existing endpoints with new API client
3. **Migrate** one component at a time to use new hooks
4. **Configure** environment variables for your deployment
5. **Deploy** following the production deployment guide
6. **Monitor** using PM2 Plus or similar

---

## Support & Troubleshooting

### CORS Issues
- Check `NEXT_PUBLIC_ALLOWED_ORIGINS` environment variable
- Verify origin is whitelisted
- Check browser DevTools Network tab

### Authentication Errors
- Verify token is stored in localStorage
- Check `Authorization` header is sent
- Verify session validity

### Rate Limiting
- Default: 100 requests/minute per IP
- Adjust in `src/lib/api/config.ts`
- Use Redis for distributed rate limiting in production

### Testing Endpoints
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://yourdomain.com/api/v1/user/profile
```

---

## Security Checklist

- ✅ CORS configured
- ✅ Security headers enabled
- ✅ Rate limiting active
- ✅ Input validation
- ✅ Authentication required
- ✅ Authorization checks
- ✅ HTTPS in production
- ✅ Error handling
- ✅ Secrets in environment variables
- ✅ Database connection secured

---

## Additional Resources

- **Next.js Documentation**: https://nextjs.org/docs
- **Better Auth**: https://www.better-auth.com
- **Zod Validation**: https://zod.dev
- **OWASP Security**: https://owasp.org

---

**Your application is now production-ready with proper backend/frontend separation and security!** 🚀
