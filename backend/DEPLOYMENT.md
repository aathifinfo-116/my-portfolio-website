# Deploying the backend to Vercel

## ⚠️ Read this first: file uploads and stored files will not work

This backend stores files on local disk (`uploads/`). **That model is
incompatible with Vercel**, for two separate reasons:

1. **The function filesystem is read-only and ephemeral.** Uploads cannot be
   written. `StorageService` now fails fast with a 503 explaining this rather
   than writing to `/tmp` and producing database rows that point at files
   which vanish on the next cold start.

2. **`uploads/` is gitignored, so none of your existing files deploy.** All 26
   files — every study document, project image, the avatar and the resume —
   are absent from the deployment. Their database rows survive, so the API
   returns `fileUrl` values that 404.

`ServeStaticModule` is therefore skipped on Vercel entirely (`process.env.VERCEL`),
so those paths return a normal 404 instead of an unhandled static-middleware error.

### What still works on Vercel

Everything that is database-only: profile, services, projects, certifications,
awards, the contact form, admin login, and all read/write CRUD **except** file
attachment.

### Your options

| Option | Effort | Result |
|---|---|---|
| **Move storage to S3 / Cloudinary / Supabase Storage** | Medium | Full functionality. `StorageService` was built as the single seam for exactly this — implement `saveTo`/`removeByUrl`/`resolveStoredPath` for the new driver and no controller changes. |
| **Commit `uploads/` to git** | Low | Existing files serve correctly (read-only is fine for serving). New uploads still fail. Remove `uploads/**/*` from `.gitignore` and delete the `process.env.VERCEL` guard in `app.module.ts`. Repo grows by ~25 MB. |
| **Host the backend somewhere with a disk** | Low | Railway, Render, Fly.io — all support persistent volumes and need no code change. |

For a portfolio where documents change rarely, **committing `uploads/`** is the
pragmatic choice. For anything where you want the admin portal's upload forms
to work in production, you need real object storage.

---

## Files added for Vercel

```
backend/
├── vercel.json          build + routing config
├── api/index.ts         serverless handler (cached Nest instance)
└── src/bootstrap.ts     shared app configuration
```

`src/main.ts` is now the **local dev** entry point only — it calls `listen()`.
Vercel invokes `api/index.ts`, which shares `createApp()` so the two
environments cannot drift apart.

### Why the handler caches

A warm Lambda reuses module scope between invocations. The Nest app — and with
it the TypeORM pool — is built once and cached. Rebuilding per request would
open a new pool every time and exhaust the database connection limit in
seconds. The in-flight *promise* is cached, not the resolved app, so
concurrent cold-start requests share one initialisation instead of racing.

---

## Step-by-step

### 1. Provision a Postgres database

Vercel does not host Postgres. Use a managed provider — Neon, Supabase, Aiven
or Render all have free tiers. Copy the connection string.

### 2. Create the Vercel project

- Import the repo
- **Root Directory: `backend`** ← this matters; the repo has two projects
- Framework preset: **Other**
- Leave build/output settings empty — `vercel.json` handles it

### 3. Set environment variables

In Project → Settings → Environment Variables:

| Variable | Value |
|---|---|
| `NODE_ENV` | `production` |
| `DATABASE_URL` | your Postgres connection string |
| `DB_SYNCHRONIZE` | `false` |
| `DB_SSL` | `true` |
| `JWT_SECRET` | `openssl rand -base64 48` — **not** your local one |
| `JWT_EXPIRES_IN` | `1d` |
| `ADMIN_EMAIL` | `aathifinfo116@gmail.com` |
| `ADMIN_PASSWORD` | a real password, not the placeholder |
| `CORS_ORIGINS` | `https://aathif-thahir-profile.vercel.app` |
| `PUBLIC_BASE_URL` | your deployed backend URL |
| `API_PREFIX` | `api` |

`DATABASE_URL` replaces the discrete `DB_*` fields — env validation accepts
either, requiring the discrete ones only when no URL is present.

### 4. Create the schema

`DB_SYNCHRONIZE=false` in production means tables are not auto-created. Either:

```bash
# One-off, from your machine, pointed at the production database:
DATABASE_URL='postgresql://...' DB_SYNCHRONIZE=true npm run seed
```

…or generate and run a migration:

```bash
npm run migration:generate -- src/migrations/Init
DATABASE_URL='postgresql://...' npm run migration:run
```

The seed also creates the admin account, so run it either way.

### 5. Point the frontend at the backend

In the **frontend** Vercel project:

```
VITE_API_BASE_URL=https://<your-backend>.vercel.app
```

Without it the frontend calls same-origin `/api`, which does not exist on the
frontend deployment.

### 6. Verify

```bash
curl https://<backend>.vercel.app/api/profile
curl -i -X POST https://<backend>.vercel.app/api/projects   # expect 401
curl -i -H "Origin: https://aathif-thahir-profile.vercel.app" \
     https://<backend>.vercel.app/api/profile               # expect ACAO header
```

---

## Serverless connection pooling

`app.module.ts` sets:

- `max: 1` on Vercel (`DB_POOL_SIZE` overrides) — many short-lived instances
  each holding one connection, rather than each opening ten
- `idleTimeoutMillis: 10_000` — a frozen Lambda otherwise holds sockets open
- `retryAttempts: 3` — reconnect rather than crash when a pooled socket is cut

If you still hit connection limits under load, put **PgBouncer** in front
(Supabase and Neon both offer a pooled connection string) and use that URL.

---

## Security checklist before going live

- [ ] `JWT_SECRET` is newly generated for production, not copied from `.env`
- [ ] `ADMIN_PASSWORD` is not `ChangeThisPassword123!`
- [ ] `DB_SYNCHRONIZE=false`
- [ ] `CORS_ORIGINS` lists only origins you control
- [ ] Rotate the local Postgres password if it was ever committed
