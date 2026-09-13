# Getting Started with Backend/Frontend Separation

## ✅ Installation & Setup (5 minutes)

### 1. Review the Implementation
- [ ] Read `docs/IMPLEMENTATION_SUMMARY.md` for overview
- [ ] Check `docs/api-quick-reference.md` for quick lookup
- [ ] Understand the new file structure

### 2. Configure Environment
```bash
# Copy .env.example to .env.local
cp .env.example .env.local

# For monolithic setup (default)
NEXT_PUBLIC_API_URL=""
NEXT_PUBLIC_ALLOWED_ORIGINS=""

# For separate services
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
NEXT_PUBLIC_ALLOWED_ORIGINS=https://app.yourdomain.com
```

### 3. Test the Setup
```bash
# Start development server
pnpm dev

# Test API endpoint
curl http://localhost:3000/api/v1/user/profile \
  -H "Cookie: session=..."

# Check CORS headers
curl -H "Origin: http://localhost:3000" \
  http://localhost:3000/api/v1/user/profile -v
```

---

## 🚀 Using the API (Examples)

### Get User Profile
```typescript
import { useApiGet } from "@/hooks/useApi";

export function UserProfile() {
  const { data: user, loading, error } = useApiGet("/api/v1/user/profile");

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return <div>Welcome, {user?.name}</div>;
}
```

### Create Chat Thread
```typescript
import { useApiPost } from "@/hooks/useApi";

export function CreateChat() {
  const { post, loading } = useApiPost("/api/v1/chat/threads");

  const handleCreate = async () => {
    const response = await post({
      title: "New Chat",
      model: "gpt-4",
    });

    if (response.success) {
      console.log("Created:", response.data);
    }
  };

  return <button onClick={handleCreate}>Create Chat</button>;
}
```

### Handle Authentication
```typescript
import { useAuthClient } from "@/lib/auth/auth-client";

export function LoginPage() {
  const { login, logout, isAuthenticated } = useAuthClient();

  if (isAuthenticated) {
    return <button onClick={logout}>Logout</button>;
  }

  return (
    <button onClick={() => login("user@example.com", "password")}>
      Login
    </button>
  );
}
```

---

## 📝 Creating New API Endpoints

### Step 1: Create Route File
```typescript
// src/app/api/v1/[resource]/route.ts
import { createApiHandler, validateRequestBody } from "@/lib/api/handlers";
import { z } from "zod";

const CreateSchema = z.object({
  title: z.string().min(1),
  // ... other fields
});

export const POST = createApiHandler(
  async (request) => {
    const validation = await validateRequestBody(request, CreateSchema);
    if (!validation.success) throw new Error(validation.error);

    // Your logic here
    return { id: "123", ...validation.data };
  },
  { requireAuth: true, methods: ["POST"] }
);
```

### Step 2: Update Config (Optional)
```typescript
// src/lib/api/config.ts
ENDPOINTS: {
  RESOURCE: "/api/v1/[resource]",
}
```

### Step 3: Use in Component
```typescript
const { post, loading } = useApiPost("/api/v1/[resource]");
await post({ title: "Example" });
```

---

## 🔒 Security Features Used

| Feature | Status | Details |
|---------|--------|---------|
| CORS | ✅ Enabled | Configurable origin whitelist |
| Rate Limiting | ✅ Enabled | 100 requests/minute per IP |
| Security Headers | ✅ Enabled | CSP, X-Frame-Options, etc |
| Authentication | ✅ Enabled | Bearer token validation |
| Authorization | ✅ Enabled | Role-based access control |
| Input Validation | ✅ Enabled | Zod schema validation |
| HTTPS | ✅ In Production | Use HTTPS in production only |
| Error Handling | ✅ Enabled | Secure error messages |

---

## 🧪 Testing

### Test API Directly
```bash
# With authentication
TOKEN="your-jwt-token"
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/v1/user/profile

# With CORS headers
curl -H "Origin: http://localhost:3000" \
  http://localhost:3000/api/v1/example
```

### Test in Component
```typescript
// Add console logs
const { data, error } = useApiGet("/api/v1/example");
console.log("Data:", data);
console.log("Error:", error);
```

### View Logs
```bash
pnpm dev
# Check console output for errors
```

---

## 🚀 Deployment Checklist

### Before Deploying
- [ ] All environment variables configured
- [ ] CORS origins whitelisted
- [ ] SSL/TLS certificates ready
- [ ] Database backups configured
- [ ] Monitoring setup (PM2 Plus)
- [ ] Rate limiting adjusted for production
- [ ] Error tracking configured (Sentry)

### Monolithic Deployment
```bash
# Build
pnpm build

# Start
pnpm start
```

### Separate Services (Microservices)
```bash
# Backend (port 3001)
NEXT_PUBLIC_API_URL=https://api.yourdomain.com pnpm start -- -p 3001

# Frontend (port 3000)
NEXT_PUBLIC_API_URL=https://api.yourdomain.com pnpm start -- -p 3000

# Behind Nginx reverse proxy
# See docs/production-deployment.md for configuration
```

### Using Docker
```bash
docker-compose -f docker/compose.yml up -d
```

---

## 📚 Documentation Reference

| Document | Purpose | Best For |
|----------|---------|----------|
| `IMPLEMENTATION_SUMMARY.md` | Overview | Getting started |
| `api-quick-reference.md` | Quick lookup | Common tasks |
| `backend-frontend-separation.md` | Detailed guide | Deep dive |
| `migration-guide.md` | Converting code | Existing components |
| `production-deployment.md` | Deployment | Production setup |

---

## ❓ FAQ

### Q: Should I use monolithic or separate services?
**A:** 
- Monolithic: Good for small/medium projects, simpler setup
- Separate: Better for scaling, large teams, complex requirements

### Q: How do I enable CORS for a new domain?
**A:** Update `NEXT_PUBLIC_ALLOWED_ORIGINS`:
```bash
NEXT_PUBLIC_ALLOWED_ORIGINS=https://app.example.com,https://other.example.com
```

### Q: How do I increase rate limit?
**A:** Edit `src/lib/api/config.ts`:
```typescript
RATE_LIMIT: {
  MAX_REQUESTS: 1000,  // Increase this
  WINDOW_MS: 60000,
}
```

### Q: How do I add authentication to an endpoint?
**A:** Use the `requireAuth` option:
```typescript
export const GET = createApiHandler(handler, {
  requireAuth: true,  // Requires user to be logged in
  requireRole: "admin",  // Optional: require specific role
});
```

### Q: Can I use this with a separate backend server?
**A:** Yes! Just set `NEXT_PUBLIC_API_URL` to your backend URL:
```bash
NEXT_PUBLIC_API_URL=https://api.example.com
```

---

## 🆘 Troubleshooting

### CORS Error in Console
```
Access to XMLHttpRequest at 'https://api.example.com' from origin 
'https://app.example.com' has been blocked by CORS policy
```

**Solution:**
1. Check `NEXT_PUBLIC_ALLOWED_ORIGINS` includes the frontend origin
2. Verify backend is running
3. Check API response headers have `Access-Control-Allow-Origin`

### 401 Unauthorized Error
```
{ success: false, error: "Unauthorized" }
```

**Solution:**
1. Check user is logged in: `useAuthClient()`
2. Verify token is stored in localStorage
3. Check authentication route works

### 429 Rate Limited
```
{ success: false, error: "Too many requests" }
```

**Solution:**
1. Wait before making more requests
2. Increase `MAX_REQUESTS` in `src/lib/api/config.ts`
3. Implement request caching

### Backend Not Responding
```
Failed to fetch / Network error
```

**Solution:**
1. Check `NEXT_PUBLIC_API_URL` is correct
2. Verify backend is running
3. Check CORS configuration
4. Look at backend logs: `pm2 logs`

---

## 📞 Getting Help

1. **Check Documentation** - `docs/` folder
2. **Review Examples** - `src/app/api/v1/` route examples
3. **Check Logs** - `pnpm dev` console output
4. **Test Endpoint** - Use curl to verify API works
5. **Browser DevTools** - Network tab shows request/response details

---

## 🎯 Next Steps

1. **Immediate:** 
   - [ ] Read IMPLEMENTATION_SUMMARY.md
   - [ ] Set up environment variables
   - [ ] Test an existing endpoint

2. **Short-term:**
   - [ ] Migrate one component to use new hooks
   - [ ] Create a new API endpoint
   - [ ] Test CORS configuration

3. **Medium-term:**
   - [ ] Migrate all components to new API client
   - [ ] Remove old server action patterns
   - [ ] Setup production deployment

4. **Long-term:**
   - [ ] Consider separate frontend/backend services
   - [ ] Implement advanced caching
   - [ ] Add comprehensive monitoring
   - [ ] Setup CI/CD pipeline

---

**You're all set! Start by exploring the new API structure and documentation.** 🎉
