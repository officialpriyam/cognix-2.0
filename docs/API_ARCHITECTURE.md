# API Architecture - Complete Guide

## Overview

This project implements a **secure, scalable backend/frontend separation** allowing:

- ✅ Independent scaling of frontend and backend
- ✅ Support for multiple frontend clients (web, mobile, etc.)
- ✅ Production-grade security (CORS, rate limiting, auth)
- ✅ Flexible deployment (monolithic or microservices)
- ✅ Type-safe API communication

---

## Architecture Layers

```
┌─────────────────────────────────────────────────────┐
│ Frontend Components (React)                         │
├─────────────────────────────────────────────────────┤
│ React Hooks (useApi*)                               │
│ └─ Client Service (apiClient)                       │
├─────────────────────────────────────────────────────┤
│ HTTP Layer                                          │
│ └─ CORS, Security Headers, Error Handling           │
├─────────────────────────────────────────────────────┤
│ Backend API Routes (/api/v1/*)                      │
│ └─ Handler Wrapper (createApiHandler)               │
├─────────────────────────────────────────────────────┤
│ Middleware (Auth, Validation, Rate Limit)           │
├─────────────────────────────────────────────────────┤
│ Business Logic (Services, Repositories)             │
├─────────────────────────────────────────────────────┤
│ Database Layer                                      │
└─────────────────────────────────────────────────────┘
```

---

## Files & Their Purposes

### Core API Infrastructure

#### 1. **src/lib/api/client.ts** (Frontend HTTP Client)
**Purpose:** Handles all HTTP communication from frontend to backend

**Key Features:**
- Automatic Bearer token injection
- CSRF token handling
- Error handling with proper HTTP status codes
- File upload support
- Request/response logging

**Usage:**
```typescript
import { apiClient } from "@/lib/api/client";

// GET
const response = await apiClient.get("/api/v1/example");

// POST
const response = await apiClient.post("/api/v1/example", { data });

// File upload
const response = await apiClient.uploadFile("/api/v1/upload", formData);
```

---

#### 2. **src/lib/api/handlers.ts** (Backend Route Wrapper)
**Purpose:** Standardizes API route implementation with security

**Key Features:**
- Authentication enforcement
- Authorization (role-based)
- CORS handling
- Rate limiting
- Error handling
- Standardized responses

**Usage:**
```typescript
import { createApiHandler } from "@/lib/api/handlers";

export const POST = createApiHandler(
  async (request) => {
    // Your logic here
    return { data: "result" };
  },
  {
    requireAuth: true,
    requireRole: "admin",
    methods: ["POST"],
  }
);
```

---

#### 3. **src/lib/api/middleware.ts** (Security Middleware)
**Purpose:** Protects API with security measures

**Provided Middleware:**
- **corsMiddleware()** - CORS origin validation
- **addCorsHeaders()** - Add CORS headers to response
- **securityHeadersMiddleware()** - Security headers (CSP, X-Frame-Options, etc)
- **rateLimitMiddleware()** - Rate limiting (100 req/min default)

**Usage:**
```typescript
import { corsMiddleware, securityHeadersMiddleware } from "@/lib/api/middleware";

// Used automatically in createApiHandler
```

---

#### 4. **src/lib/api/config.ts** (Configuration)
**Purpose:** Centralized API configuration

**Contains:**
- API base URL
- Endpoint definitions
- CORS settings
- Rate limiting config
- Token management settings

**Usage:**
```typescript
import { API_CONFIG, formatEndpoint } from "@/lib/api/config";

const url = formatEndpoint(API_CONFIG.ENDPOINTS.CHAT.THREAD_DETAIL, { id: "123" });
```

---

#### 5. **src/lib/auth/auth-client.ts** (Frontend Auth Service)
**Purpose:** Manages authentication on frontend

**Key Features:**
- Session management
- Token storage/retrieval
- Login/signup/logout
- Observable session changes

**Usage:**
```typescript
import { useAuthClient } from "@/lib/auth/auth-client";

const { user, isAuthenticated, login, logout } = useAuthClient();
```

---

#### 6. **src/hooks/useApi.ts** (React Hooks)
**Purpose:** Provides React hooks for easy API consumption

**Available Hooks:**
- `useApiGet()` - GET requests with data fetching
- `useApiPost()` - POST requests with data submission
- `useApiUpdate()` - PUT/PATCH requests
- `useApiDelete()` - DELETE requests
- `useApiUpload()` - File uploads with progress
- `useApi()` - Combined CRUD operations

**Usage:**
```typescript
import { useApiGet, useApiPost } from "@/hooks/useApi";

const { data, loading, error } = useApiGet("/api/v1/user/profile");
const { post, loading: posting } = useApiPost("/api/v1/chat");
```

---

## API Endpoint Structure

### Versioning
All endpoints use version prefixing: `/api/v1/`

```
/api/v1/auth/login
/api/v1/auth/signup
/api/v1/user/profile
/api/v1/chat/threads
```

### Response Format

**Success (200-201):**
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

**Error (400-500):**
```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request (validation error) |
| 401 | Unauthorized (login required) |
| 403 | Forbidden (no permission) |
| 404 | Not Found |
| 429 | Too Many Requests (rate limited) |
| 500 | Server Error |

---

## Security Implementation

### 1. Authentication Flow

```
Frontend Component
    ↓
    ├─ useAuthClient.login(email, password)
    ├─ POST /api/v1/auth/login
    ├─ Backend validates credentials
    ├─ Returns { user, token }
    ├─ Frontend stores token in localStorage
    └─ All subsequent requests include Authorization: Bearer token
```

### 2. Authorization Flow

```
Client sends request with Authorization header
    ↓
Backend receives request
    ↓
createApiHandler checks requireAuth option
    ↓
Validates Bearer token
    ↓
getSession() retrieves user from session
    ↓
Check user.role against requireRole (if specified)
    ↓
If all checks pass → execute handler
Otherwise → return 401 or 403 error
```

### 3. CORS Protection

```
Frontend (https://app.example.com)
    ↓
Makes request to Backend (https://api.example.com)
    ↓
Browser sends Origin header
    ↓
Backend CORS middleware validates origin
    ↓
Checks against NEXT_PUBLIC_ALLOWED_ORIGINS
    ↓
If allowed → responds with Access-Control-Allow-Origin
Otherwise → rejects request (403)
```

### 4. Rate Limiting

```
Request arrives
    ↓
Extract IP address (X-Forwarded-For or X-Real-IP)
    ↓
Check request count for IP in last 60 seconds
    ↓
If count < 100 → allow request
Otherwise → return 429 Too Many Requests
```

### 5. Security Headers

Every response includes:
- `X-Frame-Options: SAMEORIGIN` - Prevent clickjacking
- `X-Content-Type-Options: nosniff` - Prevent MIME sniffing
- `X-XSS-Protection: 1; mode=block` - XSS protection
- `Content-Security-Policy: ...` - CSP rules
- `Referrer-Policy: strict-origin-when-cross-origin` - Referrer policy

---

## Implementation Examples

### Example 1: Creating an Authenticated Endpoint

```typescript
// src/app/api/v1/profile/update/route.ts
import { createApiHandler, validateRequestBody } from "@/lib/api/handlers";
import { getSession } from "@/lib/auth/server";
import { z } from "zod";

const UpdateProfileSchema = z.object({
  name: z.string().min(1).max(100),
  bio: z.string().max(500).optional(),
});

export const PUT = createApiHandler(
  async (request: NextRequest) => {
    // Validate input
    const validation = await validateRequestBody(
      request,
      UpdateProfileSchema
    );
    if (!validation.success) {
      throw new Error(validation.error);
    }

    // Get authenticated user (authentication is automatic)
    const session = await getSession();
    if (!session?.user?.id) {
      throw new Error("Unauthorized");
    }

    // Update profile
    const user = await userRepository.update(session.user.id, {
      name: validation.data.name,
      bio: validation.data.bio,
    });

    return {
      id: user.id,
      name: user.name,
      bio: user.bio,
      updatedAt: user.updatedAt,
    };
  },
  {
    requireAuth: true,  // Requires authentication
    methods: ["PUT"],
    description: "Update user profile",
  }
);
```

### Example 2: Using in a Component

```typescript
// components/ProfileForm.tsx
"use client";

import { useState } from "react";
import { useApiUpdate } from "@/hooks/useApi";
import { useAuthClient } from "@/lib/auth/auth-client";

export function ProfileForm() {
  const { user } = useAuthClient();
  const [name, setName] = useState(user?.name || "");
  const { update, loading, error } = useApiUpdate(
    "/api/v1/profile/update"
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const response = await update({ name });

    if (response.success) {
      alert("Profile updated!");
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Name"
      />
      <button type="submit" disabled={loading}>
        {loading ? "Updating..." : "Update Profile"}
      </button>
      {error && <p style={{ color: "red" }}>{error}</p>}
    </form>
  );
}
```

### Example 3: Admin-Only Endpoint

```typescript
// src/app/api/v1/admin/users/route.ts
import { createApiHandler } from "@/lib/api/handlers";

export const GET = createApiHandler(
  async (request) => {
    // Gets all users - only admins can access
    const users = await userRepository.getAll();
    return users.map(u => ({
      id: u.id,
      email: u.email,
      role: u.role,
    }));
  },
  {
    requireAuth: true,
    requireRole: "admin",  // Only admins can access
    methods: ["GET"],
    description: "List all users (admin only)",
  }
);
```

---

## Configuration

### Environment Variables

```bash
# API URL (leave empty for same-origin)
NEXT_PUBLIC_API_URL=https://api.example.com

# CORS whitelist
NEXT_PUBLIC_ALLOWED_ORIGINS=https://app.example.com,https://other.example.com

# Authentication
BETTER_AUTH_URL=https://api.example.com
BETTER_AUTH_SECRET=your-secret-here

# Database
DATABASE_URL=postgres://user:pass@host/dbname

# Optional: Redis for caching/rate limiting
REDIS_URL=redis://localhost:6379
```

### Adjusting Rate Limiting

Edit `src/lib/api/config.ts`:
```typescript
RATE_LIMIT: {
  MAX_REQUESTS: 100,      // requests per window
  WINDOW_MS: 60000,       // 60 seconds
}
```

### Adding CORS Origins

Edit `.env.local`:
```bash
NEXT_PUBLIC_ALLOWED_ORIGINS=https://app.example.com,https://app2.example.com,https://*.example.com
```

---

## Deployment

### Monolithic (Single Domain)

```bash
# Environment
NEXT_PUBLIC_API_URL=""

# Deploy
pnpm build
pnpm start

# Access
Frontend & API: https://yourdomain.com
```

### Microservices (Separate Domains)

```bash
# Backend (.env)
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
PORT=3001

# Frontend (.env)
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
PORT=3000

# Deploy backend
pnpm start -- -p 3001

# Deploy frontend
pnpm start -- -p 3000

# Behind Nginx reverse proxy
# Frontend: https://app.yourdomain.com
# Backend: https://api.yourdomain.com
```

See `docs/production-deployment.md` for detailed setup.

---

## Testing

### Test Endpoint Directly

```bash
# GET request
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://api.example.com/api/v1/user/profile

# POST request
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"John"}' \
  https://api.example.com/api/v1/profile/update

# Test CORS
curl -H "Origin: https://app.example.com" \
  https://api.example.com/api/v1/user/profile -v
```

### Test in Component

```typescript
// Add to component for debugging
const { data, error, loading } = useApiGet("/api/v1/example");
console.log("Data:", data);
console.log("Error:", error);
console.log("Loading:", loading);
```

### Browser DevTools

1. Open DevTools (F12)
2. Go to Network tab
3. Look for your API request
4. Check Response headers for:
   - `Access-Control-Allow-Origin`
   - `Access-Control-Allow-Methods`
5. Check Response body for: `{ success, data/error }`

---

## Performance Optimization

1. **Enable Redis**
   ```bash
   REDIS_URL=redis://redis-host:6379
   # Caching + distributed rate limiting
   ```

2. **Database Indexes**
   ```bash
   pnpm db:studio
   # Add indexes on frequently queried columns
   ```

3. **CDN for Static Assets**
   ```bash
   FILE_STORAGE_TYPE=s3
   FILE_STORAGE_S3_PUBLIC_BASE_URL=https://cdn.example.com
   ```

4. **Nginx Compression**
   ```nginx
   gzip on;
   gzip_types text/plain text/css application/json;
   ```

---

## Common Issues & Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| CORS Error | Origin not whitelisted | Update `NEXT_PUBLIC_ALLOWED_ORIGINS` |
| 401 Unauthorized | Not logged in | Call `login()` first |
| 403 Forbidden | Insufficient role | Use admin or higher role |
| 429 Too Many Requests | Rate limited | Increase `MAX_REQUESTS` or wait |
| Network Error | Backend not running | Start backend: `pnpm dev` |

---

## Next Steps

1. **Explore** - Review all documentation in `docs/` folder
2. **Test** - Try existing API endpoints
3. **Build** - Create your first custom endpoint
4. **Migrate** - Convert components to use new hooks
5. **Deploy** - Setup production deployment

---

## Additional Resources

- `docs/IMPLEMENTATION_SUMMARY.md` - Overview
- `docs/GETTING_STARTED.md` - Quick start guide
- `docs/api-quick-reference.md` - Quick lookup
- `docs/backend-frontend-separation.md` - Detailed guide
- `docs/migration-guide.md` - Code migration
- `docs/production-deployment.md` - Deployment

---

**Your API architecture is production-ready!** 🚀
