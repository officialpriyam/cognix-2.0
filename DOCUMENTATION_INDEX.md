# 📚 Documentation Index - Complete Guide

Complete list of all documentation for the separated frontend/backend architecture.

## 🎯 Getting Started (Start Here!)

### For First-Time Setup
1. **[SETUP_CHECKLIST.md](./SETUP_CHECKLIST.md)** ⭐ START HERE
   - Step-by-step setup verification
   - 10 phases from setup to development
   - Success indicators

2. **[FRONTEND_BACKEND_SETUP.md](./FRONTEND_BACKEND_SETUP.md)**
   - Complete setup guide (10 minutes)
   - Configuration for both services
   - Development workflow
   - Deployment options
   - Docker Compose setup

3. **[PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md)**
   - Visual folder organization
   - File locations reference
   - Communication flow
   - Quick start commands

## 👨‍💻 Development Guides

### For Development & Coding
- **[DEVELOPER_REFERENCE.md](./DEVELOPER_REFERENCE.md)** - Quick lookup during coding
  - Where files live
  - Common patterns
  - API call examples
  - Authentication flows
  - Database queries
  - Environment variables
  - Build & deploy commands

- **[docs/API_ARCHITECTURE.md](./docs/API_ARCHITECTURE.md)** - Technical architecture
  - Security design
  - API patterns
  - Error handling
  - CORS configuration
  - Rate limiting
  - Authentication & authorization

- **[docs/api-quick-reference.md](./docs/api-quick-reference.md)** - Quick lookup reference
  - All API endpoints
  - Request/response formats
  - Example requests
  - Error codes

### Frontend-Specific
- **[frontend/README.md](./frontend/README.md)**
  - Frontend project overview
  - Project structure
  - Getting started
  - Using API hooks
  - Authentication
  - Environment variables
  - Scripts reference
  - Testing
  - Deployment

### Backend-Specific
- **[backend/README.md](./backend/README.md)**
  - Backend project overview
  - Project structure
  - Getting started
  - Creating endpoints
  - Database operations
  - Environment variables
  - Scripts reference
  - Testing
  - Deployment

## 🔄 Migration & Restructuring

### For Migrating from Monolithic
- **[MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md)**
  - Moving from monolithic to separated
  - Step-by-step migration process
  - File identification and copying
  - Import path updates
  - Troubleshooting common issues
  - Testing checklist

## 📖 Advanced Topics

### Architecture & Security
- **[docs/backend-frontend-separation.md](./docs/backend-frontend-separation.md)**
  - Backend/frontend separation patterns
  - Security model
  - API design principles
  - Monolithic vs microservices
  - When to use each approach

- **[docs/FOLDER_STRUCTURE_GUIDE.md](./docs/FOLDER_STRUCTURE_GUIDE.md)**
  - Detailed folder structure
  - File organization principles
  - Module boundaries
  - Import patterns
  - When to create new folders

### Deployment & Production
- **[docs/production-deployment.md](./docs/production-deployment.md)**
  - Production setup
  - Environment configuration
  - Deployment platforms (Vercel, Railway, etc)
  - CI/CD pipeline setup
  - Monitoring & logging
  - Scaling strategies

### Additional Guides
- **[docs/mcp-server-setup-and-tool-testing.md](./docs/mcp-server-setup-and-tool-testing.md)**
  - MCP server configuration
  - Tool testing and debugging

- **[docs/system-prompts-and-customization.md](./docs/system-prompts-and-customization.md)**
  - System prompt customization
  - AI model configuration

- **[docs/docker.md](./docs/docker.md)**
  - Docker setup
  - Docker Compose configuration
  - Running in containers

- **[docs/file-storage.md](./docs/file-storage.md)**
  - File storage configuration
  - S3 setup
  - Upload/download handling

- **[docs/oauth.md](./docs/oauth.md)**
  - OAuth configuration
  - Provider setup
  - User authentication flow

- **[docs/e2e-testing-guide.md](./docs/e2e-testing-guide.md)**
  - End-to-end testing setup
  - Playwright configuration
  - Writing E2E tests

## 📂 Project Files

### Root Level
- **README.md** - Main project overview (Cognix documentation)
- **AGENTS.md** - Repository guidelines and conventions
- **package.json** - Root workspace configuration (if using pnpm workspaces)
- **biome.json** - Code formatting rules
- **tsconfig.json** - TypeScript base configuration
- **.gitignore** - Git ignore patterns

### Frontend Folder
- **frontend/package.json** - Frontend dependencies
- **frontend/tsconfig.json** - Frontend TypeScript config with path aliases
- **frontend/next.config.ts** - Frontend Next.js configuration
- **frontend/.env.example** - Frontend environment template
- **frontend/README.md** - Frontend documentation

### Backend Folder
- **backend/package.json** - Backend dependencies
- **backend/tsconfig.json** - Backend TypeScript config with path aliases
- **backend/next.config.ts** - Backend Next.js configuration
- **backend/drizzle.config.ts** - Database ORM configuration
- **backend/.env.example** - Backend environment template
- **backend/README.md** - Backend documentation

### Configuration Files
- **playwright.config.ts** - E2E testing configuration
- **vitest.config.ts** - Unit testing configuration
- **biome.json** - Code formatting and linting
- **postcss.config.mjs** - CSS processing
- **components.json** - Component library config

## 🗂️ Documentation Folder Structure

```
docs/
├── FOLDER_STRUCTURE_GUIDE.md          # Detailed structure explanation
├── API_ARCHITECTURE.md                # Technical API design
├── api-quick-reference.md             # Quick API lookup
├── backend-frontend-separation.md     # Separation patterns
├── production-deployment.md           # Deployment guide
├── migration-guide.md                 # Code migration
├── system-prompts-and-customization.md # AI customization
├── mcp-server-setup-and-tool-testing.md
├── mcp-oauth-flow.md
├── docker.md
├── file-storage.md
├── oauth.md
├── e2e-testing-guide.md
├── storage/
│   └── s3-setup.md
├── tips-guides/
│   ├── adding-openAI-like-providers.md
│   ├── temporary_chat.md
│   └── vercel.md
└── language.md
```

## 🎯 Quick Navigation by Use Case

### "I'm new and need to get started"
1. Read: [SETUP_CHECKLIST.md](./SETUP_CHECKLIST.md)
2. Follow: [FRONTEND_BACKEND_SETUP.md](./FRONTEND_BACKEND_SETUP.md)
3. Reference: [DEVELOPER_REFERENCE.md](./DEVELOPER_REFERENCE.md)

### "I need to add a new API endpoint"
1. Reference: [DEVELOPER_REFERENCE.md](./DEVELOPER_REFERENCE.md#-backend-api-endpoint)
2. Example code in: [backend/README.md](./backend/README.md#-creating-api-endpoints)
3. Details: [docs/API_ARCHITECTURE.md](./docs/API_ARCHITECTURE.md)

### "I need to call the API from frontend"
1. Reference: [DEVELOPER_REFERENCE.md](./DEVELOPER_REFERENCE.md#-frontend--backend-api-call)
2. Examples: [frontend/README.md](./frontend/README.md#-communicating-with-backend)
3. Hooks API: Look at `frontend/src/hooks/useApi.ts`

### "I'm migrating from monolithic structure"
1. Follow: [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md)
2. Troubleshoot: [MIGRATION_GUIDE.md#-troubleshooting-migration](./MIGRATION_GUIDE.md#-troubleshooting-migration)

### "I need to understand the architecture"
1. Read: [docs/backend-frontend-separation.md](./docs/backend-frontend-separation.md)
2. Review: [docs/API_ARCHITECTURE.md](./docs/API_ARCHITECTURE.md)
3. Explore: [docs/FOLDER_STRUCTURE_GUIDE.md](./docs/FOLDER_STRUCTURE_GUIDE.md)

### "I'm deploying to production"
1. Follow: [docs/production-deployment.md](./docs/production-deployment.md)
2. Setup CI/CD: See deployment section
3. Configure: [docs/docker.md](./docs/docker.md) (if using Docker)

### "I need to fix an error"
1. Check: [DEVELOPER_REFERENCE.md#-quick-troubleshooting](./DEVELOPER_REFERENCE.md#-quick-troubleshooting)
2. Troubleshoot:
   - Frontend issue: [frontend/README.md](./frontend/README.md)
   - Backend issue: [backend/README.md](./backend/README.md)
   - Setup issue: [SETUP_CHECKLIST.md](./SETUP_CHECKLIST.md#-phase-4-start-services-10-min)

### "I need to test my code"
1. Unit tests: [DEVELOPER_REFERENCE.md#-testing](./DEVELOPER_REFERENCE.md#-testing)
2. E2E tests: [docs/e2e-testing-guide.md](./docs/e2e-testing-guide.md)

## 📋 File Locations Quick Reference

| What | Where | Reference |
|------|-------|-----------|
| API Client | `frontend/src/lib/api/client.ts` | [DEVELOPER_REFERENCE.md](./DEVELOPER_REFERENCE.md) |
| useApi Hooks | `frontend/src/hooks/useApi.ts` | [DEVELOPER_REFERENCE.md](./DEVELOPER_REFERENCE.md) |
| Frontend Auth | `frontend/src/lib/auth/auth-client.ts` | [DEVELOPER_REFERENCE.md](./DEVELOPER_REFERENCE.md) |
| API Routes | `backend/src/app/api/v1/` | [DEVELOPER_REFERENCE.md](./DEVELOPER_REFERENCE.md) |
| Handler Wrapper | `backend/src/lib/api/handlers.ts` | [DEVELOPER_REFERENCE.md](./DEVELOPER_REFERENCE.md) |
| Security Middleware | `backend/src/lib/api/middleware.ts` | [docs/API_ARCHITECTURE.md](./docs/API_ARCHITECTURE.md) |
| Database Schema | `backend/src/lib/db/` | [DEVELOPER_REFERENCE.md](./DEVELOPER_REFERENCE.md#-database) |
| Types | `frontend/src/types/` or `backend/src/types/` | [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md) |
| Environment | `frontend/.env.local` or `backend/.env.local` | [DEVELOPER_REFERENCE.md](./DEVELOPER_REFERENCE.md#-environment-variables) |

## 🔍 Search by Topic

### API & Backend
- Creating endpoints: [DEVELOPER_REFERENCE.md](./DEVELOPER_REFERENCE.md#-backend-api-endpoint)
- Route wrapper: [docs/API_ARCHITECTURE.md](./docs/API_ARCHITECTURE.md)
- Error handling: [docs/API_ARCHITECTURE.md](./docs/API_ARCHITECTURE.md)
- Security: [docs/API_ARCHITECTURE.md](./docs/API_ARCHITECTURE.md)

### Frontend & Components
- Using API: [DEVELOPER_REFERENCE.md](./DEVELOPER_REFERENCE.md#-frontend--backend-api-call)
- React hooks: [frontend/README.md](./frontend/README.md)
- Authentication: [DEVELOPER_REFERENCE.md](./DEVELOPER_REFERENCE.md#-authentication)

### Database
- Schema: [DEVELOPER_REFERENCE.md](./DEVELOPER_REFERENCE.md#-database)
- Migrations: [docs/production-deployment.md](./docs/production-deployment.md)
- Queries: [DEVELOPER_REFERENCE.md](./DEVELOPER_REFERENCE.md#-database)

### Development
- Project setup: [SETUP_CHECKLIST.md](./SETUP_CHECKLIST.md)
- Common tasks: [DEVELOPER_REFERENCE.md](./DEVELOPER_REFERENCE.md#-common-patterns)
- Scripts: [DEVELOPER_REFERENCE.md](./DEVELOPER_REFERENCE.md#-build--deploy)

### Testing
- Unit tests: [DEVELOPER_REFERENCE.md](./DEVELOPER_REFERENCE.md#-testing)
- E2E tests: [docs/e2e-testing-guide.md](./docs/e2e-testing-guide.md)
- Testing setup: [SETUP_CHECKLIST.md](./SETUP_CHECKLIST.md#-phase-8-testing-10-min)

### Deployment
- Production setup: [docs/production-deployment.md](./docs/production-deployment.md)
- Docker: [docs/docker.md](./docs/docker.md)
- CI/CD: [docs/production-deployment.md](./docs/production-deployment.md)

### Security
- Security features: [docs/API_ARCHITECTURE.md](./docs/API_ARCHITECTURE.md)
- CORS: [docs/API_ARCHITECTURE.md](./docs/API_ARCHITECTURE.md)
- Rate limiting: [docs/API_ARCHITECTURE.md](./docs/API_ARCHITECTURE.md)
- Authentication: [docs/oauth.md](./docs/oauth.md)

## 📱 Quick Commands

### Setup
```bash
pnpm install          # Install both
cd frontend && pnpm install && pnpm dev
cd backend && pnpm install && pnpm dev
```

### Development
```bash
pnpm dev              # Start both
pnpm test             # Test both
pnpm lint             # Lint both
pnpm format           # Format both
```

### Database
```bash
pnpm db:push          # Push schema
pnpm db:studio        # View database
pnpm db:generate      # Create migration
```

### Building
```bash
pnpm build            # Build both
pnpm start            # Start production
```

## 🎯 Most Useful Documents

1. **[SETUP_CHECKLIST.md](./SETUP_CHECKLIST.md)** - For setup and verification
2. **[DEVELOPER_REFERENCE.md](./DEVELOPER_REFERENCE.md)** - For daily development
3. **[FRONTEND_BACKEND_SETUP.md](./FRONTEND_BACKEND_SETUP.md)** - For complete setup
4. **[docs/API_ARCHITECTURE.md](./docs/API_ARCHITECTURE.md)** - For understanding design
5. **[docs/production-deployment.md](./docs/production-deployment.md)** - For going to production

## ✅ Documentation Checklist

- [x] Setup guide
- [x] Developer reference
- [x] Architecture documentation
- [x] API documentation
- [x] Frontend README
- [x] Backend README
- [x] Migration guide
- [x] Deployment guide
- [x] Project structure guide
- [x] Docker guide
- [x] E2E testing guide
- [x] OAuth documentation
- [x] File storage documentation

## 🚀 Next Steps

1. **Setup:** Follow [SETUP_CHECKLIST.md](./SETUP_CHECKLIST.md)
2. **Learn:** Read [DEVELOPER_REFERENCE.md](./DEVELOPER_REFERENCE.md)
3. **Code:** Use [docs/API_ARCHITECTURE.md](./docs/API_ARCHITECTURE.md) as reference
4. **Deploy:** Follow [docs/production-deployment.md](./docs/production-deployment.md)

---

**All documentation is complete and ready to use!**

📍 **Start here:** [SETUP_CHECKLIST.md](./SETUP_CHECKLIST.md)
