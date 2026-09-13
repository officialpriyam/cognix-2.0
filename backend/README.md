# Backend - REST API Server

## Overview

This is the backend/API layer of the Cognix application. It's a Next.js API server that provides RESTful endpoints for the frontend and other clients.

## 📁 Structure

```
backend/src/
├── app/
│   ├── api/
│   │   └── v1/                # API v1 routes
│   │       ├── auth/          # Authentication
│   │       ├── user/          # User management
│   │       ├── chat/          # Chat functionality
│   │       └── ...            # Other endpoints
│   └── middleware.ts          # Next.js middleware
├── lib/
│   ├── api/
│   │   ├── handlers.ts        # Route handler wrapper
│   │   └── middleware.ts      # Security middleware
│   ├── auth/                  # Authentication logic
│   ├── db/                    # Database layer
│   ├── cache/                 # Caching layer
│   └── utils/                 # Utilities
├── types/                     # TypeScript types
└── scripts/                   # Build scripts
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL 12+
- pnpm (or npm/yarn)
- Redis (optional, for caching)

### Installation

```bash
# Install dependencies
pnpm install

# Create environment file
cp .env.example .env.local

# Update .env.local with your settings
```

### Database Setup

```bash
# Push database schema
pnpm db:push

# Or, to generate migrations
pnpm db:generate

# View database
pnpm db:studio
```

### Development

```bash
# Start dev server
pnpm dev

# API runs on: http://localhost:3001
# Test endpoint: http://localhost:3001/api/v1/user/profile
```

### Building

```bash
# Build for production
pnpm build

# Start production server
pnpm start
```

## 🔌 API Routes

All API routes are under `/api/v1/`:

### Authentication
- `POST /api/v1/auth/login` - Login
- `POST /api/v1/auth/signup` - Register
- `POST /api/v1/auth/logout` - Logout
- `POST /api/v1/auth/refresh` - Refresh token

### User
- `GET /api/v1/user/profile` - Get current user
- `PUT /api/v1/user/profile` - Update profile
- `POST /api/v1/user/change-password` - Change password

### Chat
- `GET /api/v1/chat/threads` - List threads
- `POST /api/v1/chat/threads` - Create thread
- `GET /api/v1/chat/threads/:id` - Get thread
- `POST /api/v1/chat/threads/:id/messages` - Send message

## 📝 Creating API Endpoints

### Step 1: Create route file

```typescript
// backend/src/app/api/v1/example/route.ts
import { createApiHandler, validateRequestBody } from "@/lib/api/handlers";
import { z } from "zod";

const ExampleSchema = z.object({
  name: z.string().min(1),
});

export const POST = createApiHandler(
  async (request) => {
    const validation = await validateRequestBody(
      request,
      ExampleSchema
    );
    if (!validation.success) {
      throw new Error(validation.error);
    }

    // Your backend logic here
    return {
      id: "123",
      name: validation.data.name,
    };
  },
  {
    requireAuth: true,
    methods: ["POST"],
    description: "Create example",
  }
);
```

### Step 2: Test endpoint

```bash
curl -X POST http://localhost:3001/api/v1/example \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"name":"test"}'
```

## 🔐 Security Features

All endpoints automatically get:
- ✅ CORS validation
- ✅ Rate limiting (100 req/min per IP)
- ✅ Security headers
- ✅ Input validation
- ✅ Error handling
- ✅ Authentication enforcement (if `requireAuth: true`)
- ✅ Authorization checks (if `requireRole: "admin"`)

## 📝 Environment Variables

Create `.env.local`:

```bash
# Server
PORT=3001
NODE_ENV=development

# API
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_ALLOWED_ORIGINS=http://localhost:3000

# Database
DATABASE_URL=postgres://username:password@localhost:5432/cognix

# Authentication
BETTER_AUTH_SECRET=your-secret-key
BETTER_AUTH_URL=http://localhost:3001

# Optional
REDIS_URL=redis://localhost:6379
OPENAI_API_KEY=sk-...
```

## 📦 Scripts

```bash
pnpm dev              # Start dev server (port 3001)
pnpm build            # Build for production
pnpm start            # Start production server
pnpm lint             # Run linter
pnpm lint:fix         # Fix linting issues
pnpm format           # Format code
pnpm check-types      # Check TypeScript
pnpm test             # Run tests
pnpm db:push          # Push schema to database
pnpm db:generate      # Generate migration
pnpm db:studio        # Open database UI
pnpm db:migrate       # Run migrations
```

## 🗄️ Database

### Using Drizzle ORM

Database schema is in `src/lib/db/`:

```typescript
// Define tables
export const UsersTable = pgTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name"),
  // ... other fields
});
```

### Common Database Commands

```bash
# Push schema to database
pnpm db:push

# Open database studio
pnpm db:studio

# Generate migration
pnpm db:generate

# Migrate database
pnpm db:migrate
```

## 🧪 Testing

```bash
# Run tests
pnpm test

# Watch mode
pnpm test:watch
```

## ⚙️ Configuration

### next.config.ts
Next.js configuration for API server.

### tsconfig.json
TypeScript configuration with path aliases:
- `@/*` → `src/`
- `@api/*` → `src/app/api/`
- `@lib/*` → `src/lib/`
- `@types/*` → `src/types/`

### drizzle.config.ts
Database ORM configuration.

## 🚀 Deployment

### To Railway / Fly.io / Render

```bash
# Set environment variables
# DATABASE_URL, BETTER_AUTH_SECRET, etc

# Deploy
git push
```

### To Self-Hosted Server

```bash
# Build
pnpm build

# Start
pnpm start

# Or use PM2
pm2 start "pnpm start" --name backend
pm2 startup
pm2 save
```

## 🌐 CORS Configuration

Backend automatically handles CORS for origins in:
```bash
NEXT_PUBLIC_ALLOWED_ORIGINS=http://localhost:3000,https://app.yourdomain.com
```

## 🔒 Authentication

Uses Better Auth for authentication:

```typescript
import { auth } from "@/lib/auth/server";

// Get current session
const session = await getSession();
const userId = session?.user?.id;
```

## 📊 API Response Format

All responses follow this format:

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

## 📚 Resources

- [API Architecture Guide](../docs/API_ARCHITECTURE.md)
- [Security Details](../docs/backend-frontend-separation.md)
- [Deployment Guide](../docs/production-deployment.md)
- [Frontend README](../frontend/README.md)

## 🤝 Contributing

1. Create a new branch
2. Make your changes
3. Run tests: `pnpm test`
4. Check linting: `pnpm lint`
5. Format code: `pnpm format`
6. Submit PR

## ❓ Support

- Check the main [docs](../docs/) folder
- See [Frontend README](../frontend/README.md)
- Review example routes in `src/app/api/v1/`
- Check setup guide: [FRONTEND_BACKEND_SETUP.md](../FRONTEND_BACKEND_SETUP.md)

---

**Happy coding!** 🎉
