# Frontend - React/Next.js Application

## Overview

This is the frontend/UI layer of the Cognix application. It's a Next.js application that communicates with the backend API via RESTful calls.

## 📁 Structure

```
frontend/src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Authentication pages
│   ├── (chat)/            # Chat pages
│   ├── (public)/          # Public pages
│   └── layout.tsx         # Root layout
├── components/            # Reusable React components
├── hooks/                 # React hooks (useApi, etc)
├── lib/
│   ├── api/               # API client
│   ├── auth/              # Frontend auth service
│   └── utils/             # Utilities
└── types/                 # TypeScript types
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- pnpm (or npm/yarn)

### Installation

```bash
# Install dependencies
pnpm install

# Create environment file
cp .env.example .env.local

# Update .env.local with backend URL
# NEXT_PUBLIC_API_URL=http://localhost:3001
```

### Development

```bash
# Start dev server
pnpm dev

# Open http://localhost:3000 in browser
```

### Building

```bash
# Build for production
pnpm build

# Start production server
pnpm start
```

## 🔌 Communicating with Backend

### Using React Hooks

```typescript
import { useApiGet, useApiPost } from "@/hooks/useApi";

export function MyComponent() {
  // Fetch data
  const { data, loading, error } = useApiGet("/api/v1/user/profile");

  // Submit data
  const { post } = useApiPost("/api/v1/example");
  
  const handleSubmit = async () => {
    await post({ data: "example" });
  };

  return (
    <div>
      {loading ? "Loading..." : data?.name}
      <button onClick={handleSubmit}>Submit</button>
    </div>
  );
}
```

### Using API Client Directly

```typescript
import { apiClient } from "@/lib/api/client";

const response = await apiClient.get("/api/v1/user/profile");
if (response.success) {
  console.log(response.data);
}
```

## 🔐 Authentication

```typescript
import { useAuthClient } from "@/lib/auth/auth-client";

export function LoginPage() {
  const { login, logout, isAuthenticated } = useAuthClient();

  const handleLogin = async () => {
    const result = await login("user@example.com", "password");
    if (result.success) {
      // Redirect to dashboard
    }
  };

  return (
    <div>
      {isAuthenticated ? (
        <button onClick={logout}>Logout</button>
      ) : (
        <button onClick={handleLogin}>Login</button>
      )}
    </div>
  );
}
```

## 📝 Environment Variables

Create `.env.local`:

```bash
# Backend API URL
NEXT_PUBLIC_API_URL=http://localhost:3001

# CORS origins
NEXT_PUBLIC_ALLOWED_ORIGINS=http://localhost:3000

# Auth URL
BETTER_AUTH_URL=http://localhost:3001
```

## 📦 Scripts

```bash
pnpm dev              # Start dev server
pnpm build            # Build for production
pnpm start            # Start production server
pnpm lint             # Run linter
pnpm lint:fix         # Fix linting issues
pnpm format           # Format code
pnpm check-types      # Check TypeScript
pnpm test             # Run tests
pnpm test:watch       # Watch tests
pnpm test:e2e         # E2E tests
```

## 🧪 Testing

```bash
# Unit tests
pnpm test

# Watch mode
pnpm test:watch

# E2E tests
pnpm test:e2e

# With UI
pnpm test:e2e:ui
```

## 📚 Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [Backend API Docs](../backend/README.md)
- [Setup Guide](../FRONTEND_BACKEND_SETUP.md)

## ⚙️ Configuration

### next.config.ts
Next.js configuration with internationalization support.

### tsconfig.json
TypeScript configuration with path aliases:
- `@/*` → `src/`
- `@components/*` → `src/components/`
- `@hooks/*` → `src/hooks/`
- `@lib/*` → `src/lib/`
- `@types/*` → `src/types/`

## 🚀 Deployment

### To Vercel

```bash
# Push to GitHub
git push

# Deploy on Vercel dashboard
# Set environment variables in Vercel
```

### To Self-Hosted Server

```bash
# Build
pnpm build

# Start
pnpm start

# Or use PM2
pm2 start "pnpm start" --name frontend
```

## 🤝 Contributing

1. Create a new branch
2. Make your changes
3. Run tests: `pnpm test`
4. Check linting: `pnpm lint`
5. Format code: `pnpm format`
6. Submit PR

## 📖 Documentation

For detailed documentation, see:
- [Architecture Guide](../docs/API_ARCHITECTURE.md)
- [Quick Reference](../docs/api-quick-reference.md)
- [Migration Guide](../docs/migration-guide.md)

## ❓ Support

- Check the main [docs](../docs/) folder
- See [Backend README](../backend/README.md)
- Review example components in `src/components/`

---

**Happy coding!** 🎉
