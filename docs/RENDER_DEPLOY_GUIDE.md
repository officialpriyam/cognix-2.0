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

The first deploy failed during `next build` with
`Error occurred prerendering page "/_global-error" … Cannot read properties of null (reading 'useContext')`.

Root causes & fixes:

1. **Unbounded Node range** — `"engines": { "node": ">=20.x" }` in `backend/package.json` made Render
   install the *brand-new* **Node 26.8.2** (Render docs: an unbounded range always resolves to the latest
   release). The app builds fine on Node 24 but trips a known Next.js 16 prerender bug on Node 26
   (see vercel/next.js#95741, #86178, #84994).
   **Fix:** pinned to `"node": "24.x"` (matches Render's current default 24.14.1) and `NODE_VERSION: "24"` in `render.yaml`.
2. **47 parallel prerender workers** — Render's many-core CI machines spawn 40+ static-generation
   workers, which makes the scheduling-sensitive `/_global-error` crash far more likely.
   **Fix:** `experimental.cpus: 1` in `backend/next.config.ts` serializes prerendering (negligible build-time cost for an API app).
3. **Multiple lockfiles warning** — Next.js guessed the wrong workspace root because
   `pnpm-lock.yaml` exists at the repo root, in `frontend/`, and in `backend/`.
   **Fix:** `turbopack.root` pinned to the backend directory in `backend/next.config.ts`.
4. **Non-reproducible installs** — build command now uses `pnpm install --frozen-lockfile` in `render.yaml`.

The `⚠ non-standard NODE_ENV` and `[baseline-browser-mapping]` messages in the logs are harmless warnings, not errors.
