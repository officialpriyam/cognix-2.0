# Backend & Frontend Separation - Architecture Guide

## Overview

This guide explains the properly separated backend and frontend architecture with security best practices.

## Architecture

```
┌─────────────────┐                    ┌─────────────────┐
│   Frontend      │                    │   Backend       │
│   (Next.js)     │──── HTTPS API ────▶│   (Next.js API) │
│                 │◀─── JSON Responses │                 │
└─────────────────┘                    └─────────────────┘
       │                                       │
       ├─ React Components                     ├─ API Routes
       ├─ Hooks (useApi)                       ├─ Database
       ├─ Auth Client                          ├─ Business Logic
       └─ API Client                           └─ Authentication
```

## Security Features

### 1. **CORS (Cross-Origin Resource Sharing)**
- Whitelist specific origins
- Validate request origins
- Support for wildcard patterns
- Preflight request handling

### 2. **Authentication & Authorization**
- Bearer token authentication
- Role-based access control (RBAC)
- Automatic token validation on requests
- Secure token storage (localStorage)

### 3. **Security Headers**
- X-Frame-Options (prevent clickjacking)
- X-Content-Type-Options (prevent MIME sniffing)
- X-XSS-Protection (XSS protection)
- Content-Security-Policy (CSP)
- Referrer-Policy

### 4. **Rate Limiting**
- Request counting per IP
- Configurable limits
- 429 Too Many Requests responses
- In-memory storage (upgrade to Redis for production)

### 5. **Input Validation**
- Zod schema validation
- Request body validation
- Type safety

### 6. **Error Handling**
- Consistent error response format
- Proper HTTP status codes
- Error logging

## Directory Structure

```
src/
├── lib/
│   ├── api/
│   │   ├── client.ts           # Frontend API client
│   │   ├── handlers.ts         # Backend route handlers wrapper
│   │   ├── middleware.ts       # CORS, security, rate limiting
│   │   └── config.ts           # API configuration & endpoints
│   ├── auth/
│   │   ├── auth-client.ts      # Frontend auth service
│   │   └── ...
│   └── db/
│       └── repository          # Database access layer
├── app/
│   └── api/
│       └── v1/                 # API version 1
│           ├── auth/
│           │   ├── login/
│           │   ├── signup/
│           │   └── logout/
│           ├── user/
│           │   └── profile/
│           ├── chat/
│           │   └── threads/
│           └── ...
├── components/                 # React components
├── hooks/
│   └── useApi.ts              # API operation hooks
└── types/                     # TypeScript types
```

## Usage Guide

### 1. Creating Backend API Routes

**Step 1: Define request validation schema**
```typescript
// src/app/api/v1/example/route.ts
import { z } from "zod";

const CreateExampleSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
});
```

**Step 2: Create route handler**
```typescript
import { createApiHandler, validateRequestBody } from "@/lib/api/handlers";
import { getSession } from "@/lib/auth/server";

export const POST = createApiHandler(
  async (request: NextRequest) => {
    // Validate input
    const validation = await validateRequestBody(
      request,
      CreateExampleSchema
    );

    if (!validation.success) {
      throw new Error(validation.error);
    }

    // Get user from session
    const session = await getSession();
    if (!session?.user?.id) {
      throw new Error("Unauthorized");
    }

    // Process data
    const result = await repository.create({
      userId: session.user.id,
      ...validation.data,
    });

    return {
      id: result.id,
      title: result.title,
      createdAt: result.createdAt,
    };
  },
  {
    requireAuth: true,
    requireRole: "admin", // Optional: require specific role
    methods: ["POST"],
    description: "Create example",
  }
);
```

### 2. Using Frontend API Client

**Direct API calls:**
```typescript
import { apiClient } from "@/lib/api/client";

// GET request
const response = await apiClient.get("/api/v1/user/profile");

// POST request
const response = await apiClient.post("/api/v1/chat/threads", {
  title: "New Chat",
  model: "gpt-4",
});

// File upload
const formData = new FormData();
formData.append("file", file);
const response = await apiClient.uploadFile("/api/v1/storage/upload", formData);
```

### 3. Using React Hooks

**useApiGet - Fetch data**
```typescript
"use client";

import { useApiGet } from "@/hooks/useApi";

export function UserProfile() {
  const { data: user, loading, error, fetch } = useApiGet("/api/v1/user/profile");

  useEffect(() => {
    fetch();
  }, [fetch]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return <div>Welcome, {user?.name}</div>;
}
```

**useApiPost - Submit data**
```typescript
import { useApiPost } from "@/hooks/useApi";

export function CreateThread() {
  const { loading, error, post } = useApiPost("/api/v1/chat/threads");

  const handleCreate = async () => {
    const response = await post({
      title: "New Chat",
      model: "gpt-4",
    });

    if (response.success) {
      // Handle success
    }
  };

  return (
    <button onClick={handleCreate} disabled={loading}>
      {loading ? "Creating..." : "Create Thread"}
    </button>
  );
}
```

### 4. Using Authentication

```typescript
"use client";

import { useAuthClient } from "@/lib/auth/auth-client";

export function LoginPage() {
  const { login, loading, session } = useAuthClient();

  const handleLogin = async (email: string, password: string) => {
    const result = await login(email, password);
    if (result.success) {
      // Redirect to dashboard
    }
  };

  if (session) {
    return <div>Already logged in as {session.user.email}</div>;
  }

  return (
    <LoginForm onSubmit={handleLogin} isLoading={loading} />
  );
}
```

## Environment Configuration

**Add to `.env.local`:**
```bash
# Backend API URL (for separate frontend/backend)
# If empty, uses relative paths (same-origin)
NEXT_PUBLIC_API_URL=http://localhost:3001

# Allowed origins for CORS
NEXT_PUBLIC_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001,https://yourdomain.com

# Authentication
BETTER_AUTH_SECRET=your-secret-here
BETTER_AUTH_URL=http://localhost:3000

# Other configs
DATABASE_URL=postgres://...
```

## Deployment Scenarios

### Monolithic (Same Origin)
- Frontend and backend on same domain
- Set `NEXT_PUBLIC_API_URL` to empty string or relative paths
- No CORS needed

### Microservices (Separate Services)
- Frontend: `https://frontend.example.com`
- Backend: `https://api.example.com`
- Set `NEXT_PUBLIC_API_URL=https://api.example.com`
- Configure CORS whitelist properly

### Multi-Region
- Use CDN for frontend
- Backend behind load balancer
- Configure environment variables per region

## Security Best Practices

1. **Always validate input** on backend
2. **Never trust client data** - always verify authorization
3. **Use HTTPS in production** only
4. **Rotate secrets regularly**
5. **Monitor rate limits** and adjust as needed
6. **Log security events** for audit trails
7. **Keep dependencies updated**
8. **Use environment variables** for sensitive data
9. **Implement request signing** for critical operations
10. **Add request correlation IDs** for debugging

## API Response Format

All API responses follow a consistent format:

**Success Response:**
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

## Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `429` - Too Many Requests
- `500` - Server Error

## Troubleshooting

### CORS Errors
1. Check `NEXT_PUBLIC_ALLOWED_ORIGINS` environment variable
2. Verify `NEXT_PUBLIC_API_URL` is correct
3. Ensure credentials are included in requests

### Authentication Failures
1. Check token is stored in localStorage
2. Verify `Authorization` header is sent
3. Check token expiration

### Rate Limiting
1. Adjust `RATE_LIMIT` config in `src/lib/api/config.ts`
2. Use Redis for distributed rate limiting in production

## Next Steps

1. Migrate existing API routes to use new handlers
2. Update components to use new API hooks
3. Test CORS in different environments
4. Set up monitoring and logging
5. Document API endpoints in OpenAPI/Swagger
