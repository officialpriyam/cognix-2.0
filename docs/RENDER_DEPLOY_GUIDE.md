# Deploying Cognix 2.0 — Backend on Render + Frontend on Vercel

This project deploys as **two separate services**:

| Service | Location | Host | Stack |
|---|---|---|---|
| Backend API | `backend/` | Render (web service) | Next.js route handlers, Postgres, Redis |
| Frontend UI | `frontend/` | Vercel | Next.js app |

---

## 0. Prerequisites (set these up first)

1. **Supabase Postgres** — https://supabase.com → create a project →
   *Project Settings → Database → Connection string → URI*.
   Use the **Session pooler** URI (port 5432) and append `?sslmode=require`:
   ```
   postgresql://postgres.<project-ref>:<password>@aws-0-<region>.pooler.supabase.com:5432/postgres?sslmode=require
   ```
2. **Upstash Redis** (optional but recommended) — https://upstash.com → create a DB →
   *Connect → ioredis*. Must use the `rediss://` (TLS) scheme.
3. **At least one LLM API key** (e.g. `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `GOOGLE_GENERATIVE_AI_API_KEY`, `GROQ_API_KEY`…).
4. **File storage** — either a Vercel Blob token (`BLOB_READ_WRITE_TOKEN`, set `FILE_STORAGE_TYPE=vercel-blob`)
   or S3 credentials (`FILE_STORAGE_TYPE=s3` + `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY`).
5. **A Better Auth secret** — generate with `npx @better-auth/cli@latest secret`.

---

## 1. Deploy the backend on Render

### Option A — Blueprint (uses the repo's `render.yaml`, recommended)

1. Render Dashboard → **New +** → **Blueprint**.
2. Connect the GitHub repo (`officialpriyam/cognix-2.0`). Render detects `render.yaml`.
3. It shows the `cognix-backend` web service pre-configured (root dir `backend`, build/start commands, health check).
4. Fill in every env var marked *sync: false* (see the table below), then **Apply**.

### Option B — Manual web service

1. Render Dashboard → **New +** → **Web Service** → connect the repo.
2. Settings:
   - **Root Directory:** `backend`
   - **Runtime:** Node
   - **Build Command:** `corepack enable && pnpm install --frozen-lockfile && pnpm build`
   - **Start Command:** `pnpm start`
   - **Health Check Path:** `/api/health`
   - **Instance Type:** Free (or any)
3. Add the environment variables below → **Create Web Service**.

### Backend environment variables

| Key | Value |
|---|---|
| `POSTGRES_URL` | Supabase session-pooler URI with `?sslmode=require` |
| `BETTER_AUTH_SECRET` | generated secret |
| `BETTER_AUTH_URL` | `https://<your-backend>.onrender.com` (the Render URL) |
| `NEXT_PUBLIC_API_URL` | `https://<your-backend>.onrender.com` |
| `NEXT_PUBLIC_ALLOWED_ORIGINS` | Frontend URL, e.g. `https://your-app.vercel.app` (comma-separate to add more). *Leave placeholder on first deploy; update in step 3.* |
| `REDIS_URL` | Upstash `rediss://…` URL (optional) |
| `FILE_STORAGE_TYPE` | `vercel-blob` or `s3` |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob token (if using blob) |
| `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` | if using S3 |
| LLM keys | `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `GOOGLE_GENERATIVE_AI_API_KEY`, `XAI_API_KEY`, `GROQ_API_KEY`, `OPENROUTER_API_KEY`, `EXA_API_KEY` — add the ones you use |

> **Note:** Do **not** set `NODE_ENV` yourself — Render already injects `NODE_ENV=production` for web services, and Next.js warns about non-standard values. On first boot the backend runs its Postgres migrations automatically (via `instrumentation.ts`), so `POSTGRES_URL` must be valid before the first start.

### Verify

Open `https://<your-backend>.onrender.com/api/health` in a browser — it should return a healthy response. The deploy logs should show `PostgreSQL migrations completed`.

---

## 2. Deploy the frontend on Vercel

1. https://vercel.com → **Add New → Project** → import the same GitHub repo.
2. **Root Directory:** `frontend` (Vercel auto-detects Next.js and `pnpm`).
3. Environment variables:

| Key | Value |
|---|---|
| `NEXT_PUBLIC_API_URL` | `https://<your-backend>.onrender.com` |
| `NEXT_PUBLIC_ALLOWED_ORIGINS` | your Vercel URL, e.g. `https://your-app.vercel.app` |
| `BETTER_AUTH_URL` | `https://<your-backend>.onrender.com` |
| `BETTER_AUTH_SECRET` | same secret as the backend |
| `POSTGRES_URL` | same Supabase URI as the backend |
| `REDIS_URL` | same Upstash URL (optional) |

4. **Deploy.** Vercel may warn that `NEXT_PUBLIC_API_URL` was set after the build — that's fine on the first pass; env vars apply on this build.

---

## 3. Close the loop: point the backend at the frontend

Now that the frontend exists, update the backend's CORS allow-list:

1. Render Dashboard → `cognix-backend` → **Environment**.
2. Set `NEXT_PUBLIC_ALLOWED_ORIGINS` to your real frontend URL, e.g.
   `https://your-app.vercel.app` (multiple: `https://a.vercel.app,https://b.pages.dev`).
3. **Save** — Render redeploys automatically.

---

## 4. What was fixed for this deploy (build failure)

The first deploys failed during `next build` with
`Error occurred prerendering page "/_global-error" … Cannot read properties of null (reading 'useContext')`.

Root causes & fixes:

1. **`NODE_ENV` set in the Render environment (the actual culprit) —** `backend/.env.example` shipped
   a `NODE_ENV=development` template line, so a `NODE_ENV` variable ended up in the Render service's
   environment. During `next build`, Next.js honors an ambient `NODE_ENV` and bundles the
   **development** React build; React 19 dev-mode SSR then crashes Next 16's static prerenderer with
   exactly this `useContext` null error (reproduced locally with one command: `NODE_ENV=development pnpm build`).
   The page that dies (`/_global-error`, `/api/auth/error`, …) is just whichever route a worker hits first.
   **Fix:** delete the `NODE_ENV` env var from the Render service (dashboard → Environment).
   Render already injects `NODE_ENV=production` for web services. The line was also removed from
   `backend/.env.example` so it can't be copied into a dashboard again.
2. **Unbounded Node range** — `"engines": { "node": ">=20.x" }` in `backend/package.json` made Render
   install the *brand-new* **Node 26.8.2** (Render docs: an unbounded range always resolves to the latest
   release). A pinned, supported Node avoids unrelated risk.
   **Fix:** pinned to `"node": "24.x"` and `NODE_VERSION: "24"` in `render.yaml`.
3. **47 parallel prerender workers** — Render's many-core CI machines spawn 40+ static-generation
   workers, which amplifies prerender-time failures and risks free-plan memory limits.
   **Fix:** `experimental.cpus: 1` in `backend/next.config.ts` serializes prerendering (negligible build-time cost for an API app).
4. **Multiple lockfiles warning** — Next.js guessed the wrong workspace root because
   `pnpm-lock.yaml` exists at the repo root, in `frontend/`, and in `backend/`.
   **Fix:** `turbopack.root` pinned to the backend directory in `backend/next.config.ts`.
5. **Non-reproducible installs** — build command now uses `pnpm install --frozen-lockfile` in `render.yaml`.

The `[baseline-browser-mapping]` messages in the logs are harmless warnings, not errors. Once the
`NODE_ENV` variable is removed, the `⚠ non-standard NODE_ENV` warning disappears too.

---

## 5. Troubleshooting: deploy fails with "PostgreSQL migrations failed" / ENETUNREACH

### Symptom

The deploy log shows:

```
❌ PostgreSQL migrations failed. check the postgres instance is running.
Error: connect ENETUNREACH 2406:da1a:…:5432 - Local (:::0)
Error: Failed query: CREATE SCHEMA IF NOT EXISTS "drizzle"
ELIFECYCLE  Command failed with exit code 1.
==> No open ports detected, continuing to scan...
```

and every URL on the service (including `/api/auth/error`) shows an error page.

### Root cause

`ENETUNREACH` on an address made only of hex groups separated by `:` (e.g.
`2406:da1a:…`) means the app tried to reach Postgres over **IPv6** and the runtime
has **no IPv6 route** — Render's runtime network is IPv4-only.

This happens when `POSTGRES_URL` uses Supabase's **direct connection** host
(`db.<project-ref>.supabase.co:5432`), which only publishes an IPv6 (AAAA) DNS
record. On boot, `instrumentation.ts` runs migrations, the connection fails, the
process exits before binding a port, and Render reports "No open ports detected".
The failing page (`/api/auth/error`, `/_global-error`, …) is just whichever route
Render probes first — it is not the broken component.

### Fix

Use Supabase's **Session pooler** URI (the shared pooler is IPv4-reachable on
every plan). Render Dashboard → `cognix-backend` → **Environment** → edit
`POSTGRES_URL`:

```
postgresql://postgres.<project-ref>:<password>@aws-0-<region>.pooler.supabase.com:5432/postgres?sslmode=require
```

Two easy-to-miss details:

1. The **username** for pooler URLs is `postgres.<project-ref>` (a dot, not a
   direct connection's plain `postgres`).
2. The **host** is `aws-0-<region>.pooler.supabase.com`, not `db.<ref>.supabase.co`.

Copy it from Supabase Dashboard → **Connect** → *Session pooler*, replacing
`[YOUR-PASSWORD]` (percent-encode reserved characters like `&` or `#`).

**Save** the env var and Redeploy. Verify via the deploy log
(`✅ PostgreSQL migrations completed in … ms`) and
`https://<your-backend>.onrender.com/api/health`.

#### Skipping boot-time migrations

The backend runs Drizzle migrations automatically on boot (via
`instrumentation.ts`); if they fail, the process exits and the deploy dies with
"No open ports detected". If you have already applied the schema another way
(e.g. `pnpm db:migrate` locally, or Supabase CLI), you can opt out:

- Render Dashboard → `cognix-backend` → **Environment** → add
  **`DISABLE_AUTO_MIGRATE` = `true`** → **Save** (auto-redeploys).

With the flag set, the boot log shows
`⏭️ DISABLE_AUTO_MIGRATE=true — skipping boot-time database migrations.`
and the server starts without touching the database. Remember: schema changes
then need a manual `pnpm db:migrate` (or CI step) before the new code deploys,
and the flag does **not** remove the need for a working `POSTGRES_URL` — the
app still queries the database at runtime.

### Other migration-startup errors and their meanings

| Error code | Meaning | Fix |
|---|---|---|
| `ENETUNREACH` (IPv6 address) | No IPv6 route from the runtime | Use the Supabase session-pooler URI (above) |
| `ECONNREFUSED` | Host reachable, nothing on that port | Check the DB is running and the port in `POSTGRES_URL` |
| `ETIMEDOUT` | Firewalled | Allow inbound connections from the runtime (Supabase → Database → Network) |
| `ENOTFOUND` | DNS failure | Fix the hostname in `POSTGRES_URL` |

The backend now prints these hints automatically next to
`❌ PostgreSQL migrations failed.` in the startup log.
