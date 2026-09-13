# Backend & Frontend Separation - Complete Documentation Index

Welcome to your new backend/frontend separation architecture! This document provides navigation to all resources.

## 🚀 Quick Start (5 Minutes)

**Start here:**
1. Read [GETTING_STARTED.md](./GETTING_STARTED.md) - Setup & first API call
2. Review [api-quick-reference.md](./api-quick-reference.md) - Common tasks

**Then:**
3. Choose a scenario from [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)
4. Create your first API endpoint
5. Test it with the provided examples

---

## 📚 Complete Documentation

### For Learning & Understanding

| Document | Purpose | Read Time |
|----------|---------|-----------|
| **[IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)** | Overview of entire architecture | 15 min |
| **[API_ARCHITECTURE.md](./API_ARCHITECTURE.md)** | Detailed technical breakdown | 20 min |
| **[backend-frontend-separation.md](./backend-frontend-separation.md)** | Complete usage guide | 25 min |

### For Development

| Document | Purpose | Use Case |
|----------|---------|----------|
| **[api-quick-reference.md](./api-quick-reference.md)** | Quick lookup reference | Day-to-day coding |
| **[GETTING_STARTED.md](./GETTING_STARTED.md)** | Setup & first steps | Starting out |
| **[migration-guide.md](./migration-guide.md)** | Converting existing code | Refactoring components |

### For Deployment

| Document | Purpose | Scenario |
|----------|---------|----------|
| **[production-deployment.md](./production-deployment.md)** | Deployment instructions | Going to production |

---

## 🎯 Choose Your Path

### Path 1: I'm Just Getting Started
```
1. GETTING_STARTED.md
2. api-quick-reference.md  
3. Review example routes in src/app/api/v1/
4. Create first API endpoint
5. Test in component
```

### Path 2: I Need to Understand Everything
```
1. IMPLEMENTATION_SUMMARY.md
2. API_ARCHITECTURE.md
3. backend-frontend-separation.md
4. Review all example files
5. deployment-guide.md (for production)
```

### Path 3: I'm Converting Existing Code
```
1. api-quick-reference.md (quick reference)
2. migration-guide.md (step-by-step)
3. Review "BEFORE/AFTER" examples
4. Convert one component at a time
5. Test thoroughly
```

### Path 4: I'm Deploying to Production
```
1. IMPLEMENTATION_SUMMARY.md (verify setup)
2. production-deployment.md (detailed instructions)
3. Test all scenarios
4. Configure monitoring
5. Deploy!
```

---

## 📁 Project Structure

```
src/
├── lib/api/
│   ├── client.ts          # Frontend HTTP client
│   ├── handlers.ts        # Backend handler wrapper
│   ├── middleware.ts      # Security & CORS
│   └── config.ts          # Configuration
│
├── lib/auth/
│   ├── auth-client.ts     # Frontend auth service
│   └── server.ts          # Backend auth (existing)
│
├── hooks/
│   └── useApi.ts          # React API hooks
│
└── app/api/v1/
    ├── auth/              # Authentication routes
    ├── user/              # User routes  
    ├── chat/              # Chat routes
    └── ...                # Other routes

docs/
├── IMPLEMENTATION_SUMMARY.md         ← Overview
├── GETTING_STARTED.md                ← Quick start
├── API_ARCHITECTURE.md                ← Technical details
├── api-quick-reference.md            ← Quick lookup
├── backend-frontend-separation.md    ← Complete guide
├── migration-guide.md                ← Code migration
├── production-deployment.md          ← Deployment
└── README.md                         ← This file
```

---

## 🔑 Key Concepts

### API Client (`src/lib/api/client.ts`)
Makes HTTP requests from frontend to backend with automatic:
- Token injection
- Error handling
- CORS support
- File upload

### Handler Wrapper (`src/lib/api/handlers.ts`)
Wraps backend routes with automatic:
- Authentication enforcement
- Authorization checks (roles)
- CORS handling
- Rate limiting
- Error handling

### React Hooks (`src/hooks/useApi.ts`)
Provides hooks for easy API consumption:
- `useApiGet()` - Fetch data
- `useApiPost()` - Submit data
- `useApiUpdate()` - Update data
- `useApiDelete()` - Delete data
- `useApiUpload()` - Upload files

### Authentication Service (`src/lib/auth/auth-client.ts`)
Manages frontend authentication:
- Token storage
- Login/logout
- Session persistence
- Observable state

---

## 🔒 Security Features

✅ **CORS** - Origin validation with configurable whitelist
✅ **Rate Limiting** - 100 requests/minute per IP (configurable)
✅ **Security Headers** - CSP, X-Frame-Options, etc.
✅ **Authentication** - Bearer token validation
✅ **Authorization** - Role-based access control
✅ **Input Validation** - Zod schema validation
✅ **Error Handling** - Secure error messages
✅ **HTTPS** - Enforced in production

---

## 🚀 Example Usage

### Create API Endpoint
```typescript
// src/app/api/v1/example/route.ts
export const POST = createApiHandler(
  async (request) => {
    const data = await validateRequestBody(request, MySchema);
    // Your logic here
    return { id: "123" };
  },
  { requireAuth: true, methods: ["POST"] }
);
```

### Use in Component
```typescript
"use client";
import { useApiPost } from "@/hooks/useApi";

const { post, loading } = useApiPost("/api/v1/example");
await post({ data });
```

### Check Authentication
```typescript
import { useAuthClient } from "@/lib/auth/auth-client";

const { user, isAuthenticated, logout } = useAuthClient();
```

---

## 🧪 Testing

### Test Endpoint
```bash
curl -H "Authorization: Bearer TOKEN" \
  https://yourdomain.com/api/v1/example
```

### View Logs
```bash
pnpm dev
# Check console output
```

### Browser DevTools
1. Open DevTools (F12)
2. Network tab
3. Look for API requests
4. Check headers and response

---

## 📋 Configuration

### Environment Variables
```bash
# API URL (empty for same-origin)
NEXT_PUBLIC_API_URL=https://api.yourdomain.com

# CORS whitelist
NEXT_PUBLIC_ALLOWED_ORIGINS=https://app.yourdomain.com

# Authentication
BETTER_AUTH_URL=https://api.yourdomain.com
```

### Deployment Options

1. **Monolithic** (default)
   - Frontend + Backend on same domain
   - Set `NEXT_PUBLIC_API_URL="""`
   - Simplest setup

2. **Microservices**
   - Frontend & Backend on separate domains
   - Set `NEXT_PUBLIC_API_URL=https://api.yourdomain.com`
   - Better for scaling

3. **Docker Compose**
   - Local development with all services
   - See production-deployment.md

---

## ❓ FAQ

**Q: Which deployment should I use?**
A: Start with monolithic (same domain). Switch to microservices when you need independent scaling.

**Q: How do I add a new domain to CORS?**
A: Update `NEXT_PUBLIC_ALLOWED_ORIGINS` environment variable.

**Q: Can I use this with a separate backend server?**
A: Yes! Set `NEXT_PUBLIC_API_URL` to your backend URL.

**Q: How do I require admin role?**
A: Use `requireRole: "admin"` in handler options.

**Q: Where are my API endpoints documented?**
A: In `src/lib/api/config.ts` under `ENDPOINTS`.

---

## 🆘 Troubleshooting

### CORS Error
Check `NEXT_PUBLIC_ALLOWED_ORIGINS` includes your frontend origin.

### 401 Unauthorized
User not logged in. Call `login()` first.

### 429 Rate Limited
Increase `MAX_REQUESTS` in `src/lib/api/config.ts`.

### Backend Not Responding
Verify `NEXT_PUBLIC_API_URL` and backend is running.

**More help:** See docs/production-deployment.md troubleshooting section.

---

## 🔗 External Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Better Auth](https://www.better-auth.com)
- [Zod Validation](https://zod.dev)
- [OWASP Security Guidelines](https://owasp.org)

---

## 📈 Next Steps

### Immediate (Today)
- [ ] Read GETTING_STARTED.md
- [ ] Set up environment variables
- [ ] Test existing API endpoint

### This Week
- [ ] Create your first API endpoint
- [ ] Migrate one component to use new hooks
- [ ] Test CORS configuration

### This Month
- [ ] Migrate all components to new API structure
- [ ] Remove old server action patterns
- [ ] Plan deployment strategy

### Production
- [ ] Follow production-deployment.md
- [ ] Setup monitoring and logging
- [ ] Configure backups and disaster recovery

---

## 💡 Pro Tips

1. **Use useApi hook** - Simplifies state management
2. **Validate input** - Always validate on both client and server
3. **Version your API** - Use `/api/v1/`, `/api/v2/` for backwards compatibility
4. **Log errors** - Add proper error logging for debugging
5. **Monitor rate limits** - Adjust based on actual usage
6. **Use Redis** - For distributed caching in production
7. **Cache responses** - Reduce database queries
8. **Test endpoints** - Use curl or Postman before component integration

---

## 📞 Need Help?

1. **Check Documentation** - Most answers are in the docs
2. **Review Examples** - See src/app/api/v1/ for real implementations
3. **Check Logs** - `pnpm dev` console shows errors
4. **Test Endpoint** - Use curl to verify API works
5. **Browser DevTools** - Network tab shows request/response details

---

## ✨ You're All Set!

Your backend/frontend separation is ready to go. Start with [GETTING_STARTED.md](./GETTING_STARTED.md) and happy coding! 🚀

---

**Last Updated:** 2024
**Version:** 1.0
**Status:** Production Ready
