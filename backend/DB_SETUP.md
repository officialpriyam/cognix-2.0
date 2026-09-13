# Database Setup Guide

This project supports multiple PostgreSQL providers with automatic detection and provider-specific optimizations.

## Supported Providers

| Provider | Type | Detection | SSL Required |
|----------|------|-----------|--------------|
| Supabase | Serverless | `.supabase.co` hostname | Yes |
| Neon | Serverless | `.neon.tech` hostname | Yes |
| Railway | Managed | `.railway.app` hostname | Yes |
| Render | Managed | `.onrender.com` hostname | Yes |
| Heroku | Managed | `.heroku.com` hostname | Yes |
| AWS RDS | Managed | `.rds.amazonaws.com` hostname | Recommended |
| Google Cloud SQL | Managed | `.google.cloud` or `.cloudsql` | Recommended |
| Azure Flex Server | Managed | `.postgres.database.azure.com` | Recommended |
| Local | Development | `localhost` / `127.0.0.1` | No |

## Quick Start

### 1. Set Your Database URL

Edit `.env` and set `POSTGRES_URL`:

```bash
# Supabase example
POSTGRES_URL=postgresql://postgres.projectref:password@db.projectref.supabase.co:5432/postgres?sslmode=require&uselibpqcompat=true

# Neon example
POSTGRES_URL=postgresql://user:password@host.neon.tech/dbname?sslmode=require

# Local example (with Docker)
POSTGRES_URL=postgresql://postgres:devpass@localhost:5432/cognix
```

### 2. Run Database Commands

```bash
# Generate migrations from schema
pnpm db:generate

# Push migrations to database
pnpm db:push

# List all tables
pnpm db:list-tables

# Reset database (drops all tables)
pnpm db:reset --confirm

# Seed database with initial data
pnpm db:seed

# Create backup
pnpm db:backup
pnpm db:backup --data  # Include data
```

## Provider-Specific Notes

### Supabase

```bash
# Link to your Supabase project (one-time setup)
supabase link --project-ref <your-project-ref>

# Push migrations via Supabase CLI (uses migrations in supabase/migrations/)
pnpm supabase:push

# Or use the unified push command (auto-detects and routes appropriately)
pnpm db:push
```

**Recommendations:**
- Use the Session Pooler URI (port 5432) for best performance
- Always include `?sslmode=require` in the connection string
- For high-traffic apps, consider connection pooling

### Neon

```bash
# Neon connection string from dashboard
POSTGRES_URL=postgresql://user:password@host.neon.tech/dbname?sslmode=require
```

**Recommendations:**
- Neon uses serverless PostgreSQL - connections are stateless
- Consider using connection pooling for sustained workloads
- Branch-based development is supported

### Local Development (Docker)

```bash
# Start PostgreSQL with Docker
docker run --name cognix-pg \
  -e POSTGRES_PASSWORD=devpass \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_DB=cognix \
  -p 5432:5432 \
  -d postgres:17-alpine

# Set environment
POSTGRES_URL=postgresql://postgres:devpass@localhost:5432/cognix

# Push schema
pnpm db:push
```

**To stop:**
```bash
docker stop cognix-pg
docker rm cognix-pg
```

### Railway / Render / Heroku

These managed services provide a connection string in their dashboard:

```bash
# Railway
POSTGRES_URL=postgresql://user:password@host.railway.app:5432/dbname?sslmode=require

# Render
POSTGRES_URL=postgresql://user:password@host.onrender.com:5432/dbname?sslmode=require

# Heroku
POSTGRES_URL=postgresql://user:password@host.herokuapp.com:5432/dbname?sslmode=require
```

## SSL Configuration

### Connection String Parameters

| Parameter | Description | Recommended Value |
|-----------|-------------|-------------------|
| `sslmode` | SSL enforcement level | `require` or `verify-full` |
| `uselibpqcompat` | Compatibility with pg v9.0.0+ | `true` (for `require`/`verify-*` modes) |

### SSL Modes

- `disable` - No SSL (development only)
- `allow` - Try non-SSL first, then SSL
- `prefer` - Try SSL first, then non-SSL
- `require` - Require SSL (encrypts connection)
- `verify-ca` - Verify server certificate against CA
- `verify-full` - Verify certificate and hostname (most secure)

### Examples

```bash
# Basic SSL (encrypts connection)
POSTGRES_URL=postgresql://user:pass@host/db?sslmode=require

# With libpq compatibility (prevents security warnings in pg v9+)
POSTGRES_URL=postgresql://user:pass@host/db?sslmode=require&uselibpqcompat=true

# Full verification (production)
POSTGRES_URL=postgresql://user:pass@host/db?sslmode=verify-full&uselibpqcompat=true
```

## Migrations

### Drizzle ORM Migrations

This project uses **Drizzle ORM** for schema management:

1. **Schema definition:** `src/lib/db/pg/schema.pg.ts`
2. **Migration output:** `src/lib/db/migrations/pg/`
3. **Supabase migration sync:** `supabase/migrations/`

### Workflow

```bash
# 1. Modify schema.pg.ts

# 2. Generate Drizzle migration
pnpm db:generate
# Creates: src/lib/db/migrations/pg/00XX_description.sql

# 3. Push to database
pnpm db:push
# For Supabase: also syncs to supabase/migrations/ and pushes via CLI
# For other providers: pushes directly via Drizzle
```

### Syncing Drizzle to Supabase

The `db:push` script automatically:
1. Detects new migrations in `src/lib/db/migrations/pg/`
2. Copies them to `supabase/migrations/`
3. Pushes to Supabase via CLI (if provider is Supabase)

### Manual Sync

```bash
# Copy recent Drizzle migrations to Supabase folder
cp src/lib/db/migrations/pg/*.sql supabase/migrations/

# Push via Supabase CLI
cd supabase && supabase db push
```

## Database Scripts

| Script | Description |
|--------|-------------|
| `pnpm db:generate` | Generate migration from schema changes |
| `pnpm db:push` | Push migrations (auto-detects provider) |
| `pnpm db:push --dry-run` | Show what would be pushed |
| `pnpm db:push --supabase` | Force Supabase CLI push |
| `pnpm db:studio` | Open Drizzle Studio (GUI) |
| `pnpm db:list-tables` | List all tables in database |
| `pnpm db:list-tables --details` | Show table schemas |
| `pnpm db:reset` | Reset database (drops all tables) |
| `pnpm db:reset --confirm` | Reset without confirmation |
| `pnpm db:seed` | Run seed script |
| `pnpm db:seed --clear` | Clear data before seeding |
| `pnpm db:backup` | Create SQL backup (schema only) |
| `pnpm db:backup --data` | Backup schema + data |

## Environment Variables

### Required

```bash
POSTGRES_URL=postgresql://...
```

### Optional

```bash
# Supabase CLI authentication
SUPABASE_ACCESS_TOKEN=your-personal-access-token

# Supabase project reference (auto-detected from URL if not set)
SUPABASE_PROJECT_REF=your-project-ref

# Force direct Drizzle push (skip Supabase CLI)
DB_PUSH_DIRECT=true

# SSL root certificate path
PGSSLROOTCERT=/path/to/ca-cert.pem
```

## Troubleshooting

### Connection Issues

```bash
# Test connection (requires direct DB access)
pnpm db:list-tables

# For Supabase, use CLI commands which work via API:
pnpm db:push              # Uses Supabase CLI (API-based)
pnpm supabase:push        # Direct Supabase CLI push

# Check provider detection
npx tsx -e "import './src/lib/db/config'; console.log(getDbConfig())"
```

**Note for Supabase users:** The Supabase database hostname may only support IPv6, which can cause connection issues on some networks. 

- ✅ `supabase db push` works (uses Supabase API, not direct DB connection)
- ❌ `drizzle-kit push` and `db:list-tables` may fail (require direct DB connection)

**Workarounds:**
1. Use `pnpm db:push` (routes through Supabase CLI for Supabase provider)
2. Set up a local PostgreSQL for development
3. Configure your network to support IPv6


### SSL Errors

```bash
# For local development, disable SSL
POSTGRES_URL=postgresql://postgres:pass@localhost:5432/cognix?sslmode=disable

# For production, ensure SSL is configured correctly
POSTGRES_URL=postgresql://user:pass@host/db?sslmode=verify-full&uselibpqcompat=true
```

### IPv6 Connection Issues (Supabase)

If you see `ENOTFOUND` errors with Supabase:

1. **This is a network configuration issue** - your network may not support IPv6
2. **Workaround:** Use Supabase CLI commands which work via API:
   ```bash
   pnpm db:push      # Uses supabase db push (API-based)
   pnpm supabase:push  # Direct Supabase CLI
   ```
3. **For direct DB access**, set up a local PostgreSQL or use a network with IPv6 support

### Migration Conflicts

```bash
# View current migration state
pnpm db:list-tables

# Reset and re-apply all migrations
pnpm db:reset --confirm
pnpm db:push
```

## Architecture

```
src/lib/db/
├── config.ts           # Provider detection and configuration
├── pg/
│   ├── schema.pg.ts    # Table definitions (Drizzle)
│   └── ...            # Repositories and DB utilities
└── ...

scripts/
├── db-push.ts         # Unified push script
├── db-reset.ts        # Reset script
├── db-list-tables.ts  # List tables script
├── db-seed.ts         # Seed script
└── db-backup.ts       # Backup script

supabase/
└── migrations/        # Supabase-synced migrations (auto-copied from Drizzle)
```

## Provider Switching

To switch providers, simply change `POSTGRES_URL`:

```bash
# Switch from Supabase to Neon
export POSTGRES_URL=postgresql://user:pass@host.neon.tech/db?sslmode=require
pnpm db:push

# Switch to local
export POSTGRES_URL=postgresql://postgres:devpass@localhost:5432/cognix
pnpm db:push
```

The application automatically detects the provider and applies appropriate settings.
