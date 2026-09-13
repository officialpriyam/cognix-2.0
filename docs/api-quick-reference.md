# Quick Reference - Backend/Frontend Separation

## File Structure Overview

```
src/
├── lib/api/
│   ├── client.ts           # Frontend → Backend communication
│   ├── handlers.ts         # Backend route handler wrapper
│   ├── middleware.ts       # Security: CORS, rate limit, headers
│   └── config.ts           # API endpoints & configuration
├── lib/auth/
│   └── auth-client.ts      # Frontend authentication service
├── hooks/
│   └── useApi.ts           # React hooks for API calls
└── app/api/v1/
    ├── auth/
    ├── user/
    ├── chat/
    └── ...
```

## Quick Setup

### 1. Environment Variables

```bash
# .env.local or .env.production

# For monolithic (same origin)
NEXT_PUBLIC_API_URL=""

# For separate backend/frontend
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
NEXT_PUBLIC_ALLOWED_ORIGINS=https://app.yourdomain.com
BETTER_AUTH_URL=https://api.yourdomain.com
```

### 2. Create API Endpoint

```typescript
// src/app/api/v1/example/route.ts
import { createApiHandler } from "@/lib/api/handlers";

export const GET = createApiHandler(
  async (request) => {
    // Your logic here
    return { data: "response" };
  },
  { requireAuth: true, methods: ["GET"] }
);
```

### 3. Use in Frontend

```typescript
// Component
import { useApiGet } from "@/hooks/useApi";

const { data, loading, error } = useApiGet("/api/v1/example");
```

## Common Tasks

### Check Authentication Status
```typescript
import { useAuthClient } from "@/lib/auth/auth-client";

export function MyComponent() {
  const { isAuthenticated, user, logout } = useAuthClient();
  
  return (
    <div>
      {isAuthenticated ? `Welcome ${user?.name}` : "Please login"}
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

### Make API Call
```typescript
import { apiClient } from "@/lib/api/client";

const response = await apiClient.post("/api/v1/example", {
  title: "Example",
});

if (response.success) {
  console.log(response.data);
} else {
  console.error(response.error);
}
```

### Handle File Upload
```typescript
const { upload, loading } = useApiUpload("/api/v1/upload");

const handleUpload = async (file: File) => {
  const response = await upload(file);
  if (response.success) {
    console.log("Uploaded:", response.data);
  }
};
```

### Add Role-Based Access Control
```typescript
export const DELETE = createApiHandler(
  async (request) => {
    // Only admins can access
    return { message: "Deleted" };
  },
  {
    requireAuth: true,
    requireRole: "admin", // or ["admin", "moderator"]
    methods: ["DELETE"],
  }
);
```

## Security Headers Included

✅ CORS with origin validation
✅ X-Frame-Options (clickjacking protection)
✅ X-Content-Type-Options (MIME sniffing)
✅ X-XSS-Protection
✅ Content-Security-Policy
✅ Referrer-Policy
✅ Rate limiting (100 req/min default)
✅ Request validation
✅ Authentication/Authorization checks

## API Response Format

**Success:**
```json
{
  "success": true,
  "data": { ... },
  "message": "Success",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

**Error:**
```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

## Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden (no permission) |
| 404 | Not Found |
| 429 | Too Many Requests (rate limited) |
| 500 | Server Error |

## Debugging

### Enable Verbose Logging
```typescript
// In useApi hooks, add console.logs
console.log("API Request:", endpoint);
console.log("Response:", response);
```

### Test API Endpoint Directly
```bash
# GET
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://yourdomain.com/api/v1/user/profile

# POST
curl -X POST -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"key":"value"}' \
  https://yourdomain.com/api/v1/example
```

### Check CORS Issues
1. Open browser DevTools → Network tab
2. Look for request headers: `Access-Control-Allow-Origin`
3. Verify origin in `NEXT_PUBLIC_ALLOWED_ORIGINS`
4. Check error: "No 'Access-Control-Allow-Origin' header"

### View Logs
```bash
# Development
pnpm dev
# Check console output

# Production with PM2
pm2 logs cognix-backend
pm2 logs cognix-frontend
```

## Deployment Checklist

- [ ] Set environment variables
- [ ] Update `NEXT_PUBLIC_API_URL` for separate services
- [ ] Configure CORS origins
- [ ] Setup SSL/TLS certificates
- [ ] Configure database backups
- [ ] Enable monitoring (PM2 Plus)
- [ ] Test API endpoints
- [ ] Setup CI/CD pipeline
- [ ] Configure Redis for caching
- [ ] Enable rate limiting
- [ ] Setup error tracking (Sentry)
- [ ] Enable request logging

## Performance Tips

1. **Use Redis** for distributed rate limiting
2. **Cache responses** with Redis
3. **Enable gzip** compression in Nginx
4. **Use CDN** for static assets
5. **Database indexing** on frequently queried columns
6. **Lazy load** components
7. **Optimize images** for different screen sizes
8. **Use HTTP/2** with HPACK compression

## Links

📚 **Documentation:**
- [Backend/Frontend Separation](./backend-frontend-separation.md)
- [Migration Guide](./migration-guide.md)
- [Production Deployment](./production-deployment.md)

🔗 **External:**
- [Next.js Docs](https://nextjs.org/docs)
- [Better Auth](https://www.better-auth.com)
- [Zod Validation](https://zod.dev)
- [Nginx Docs](https://nginx.org)
