# Deploying the backend to Vercel

## Why your first attempt built successfully but every URL failed

```ts
export default bootstrap();   // ← exports Promise<Express>, not a handler
```

`@vercel/node` requires the default export to be a **callable** handler
`(req, res)`. It received a Promise object, which cannot be called, so every
request failed at invocation. Nothing is wrong at compile time, which is why
the build reported success.

A second problem was waiting behind it: the old `routes` block listed
`["GET","POST","PUT","DELETE","PATCH"]`, omitting **OPTIONS**. Every CORS
preflight from the frontend would have 404'd even after the handler was fixed.

---

## The setup now

```
backend/
├── vercel.json          build + routing
├── api/index.ts         serverless handler (cached Nest instance)
└── src/bootstrap.ts     shared createApp(), used by both entry points
```

`src/main.ts` is the **local dev** entry (it calls `listen()`).
Vercel invokes `api/index.ts`. Both share `createApp()`.

### Two details that matter

**1. `api/index.ts` imports from `dist/`, not `src/`.**
`@vercel/node` compiles TypeScript with esbuild, which does **not** support
`emitDecoratorMetadata`. NestJS DI and TypeORM entities are built entirely on
that metadata — compiling the decorated source through esbuild produces
`Nest can't resolve dependencies` at runtime. `vercel.json` runs `nest build`
(tsc, which does emit it) first, and the handler imports the compiled output.

**2. The handler caches the in-flight promise.**
A warm Lambda reuses module scope, so the Nest app — and its TypeORM pool — is
built once. Caching the *promise* rather than the resolved app means
concurrent cold-start requests share one initialisation instead of racing to
build several, each with its own pool.

---

## Step-by-step

### 1. Vercel project settings

- Import the repo
- **Root Directory: `backend`**
- **Framework Preset: Other** — not NestJS. The NestJS preset assumes a
  long-running server and sets a build/output config that conflicts with
  `vercel.json`.
- Leave Build & Output Settings empty; `vercel.json` supplies them.

### 2. Environment variables

Project → Settings → Environment Variables:

| Variable | Value |
|---|---|
| `NODE_ENV` | `production` |
| `DB_HOST` | your Aiven host |
| `DB_PORT` | `5432` (Aiven often uses a custom port — check) |
| `DB_USERNAME` | `avnadmin` |
| `DB_PASSWORD` | your Aiven password |
| `DB_NAME` | `portfolio` |
| `DB_SYNCHRONIZE` | `false` |
| `DB_SSL` | `true` |
| `JWT_SECRET` | `openssl rand -base64 48` — **generate a new one** |
| `JWT_EXPIRES_IN` | `1d` |
| `ADMIN_EMAIL` | `aathifinfo116@gmail.com` |
| `ADMIN_PASSWORD` | a real password |
| `CORS_ORIGINS` | `https://aathif-thahir-profile.vercel.app` |
| `PUBLIC_BASE_URL` | your deployed backend URL |
| `API_PREFIX` | `api` |

Alternatively set a single `DATABASE_URL` instead of the `DB_*` fields —
validation accepts either.

### 3. Point the frontend at the backend

In the **frontend** Vercel project:

```
VITE_API_BASE_URL=https://<your-backend>.vercel.app
```

Without it the frontend calls same-origin `/api`, which does not exist on the
frontend deployment. Redeploy the frontend after adding it.

### 4. Verify

```bash
curl https://<backend>.vercel.app/api/profile              # 200 + JSON
curl -i -X POST https://<backend>.vercel.app/api/projects  # 401
curl -i -H "Origin: https://aathif-thahir-profile.vercel.app" \
        https://<backend>.vercel.app/api/profile           # ACAO header present
```

If a request fails, Vercel → Deployment → **Functions** tab shows the runtime
log, which is where DI or connection errors surface.

---

## ⚠️ Files will not work in production

Two independent reasons:

1. **The function filesystem is read-only and ephemeral.** `StorageService`
   now returns a 503 with an explanation on Vercel rather than writing to
   `/tmp` and creating database rows pointing at files that vanish.

2. **`uploads/` is gitignored — 0 files are tracked.** All 26 files (every
   study document, project image, the avatar, the resume) are absent from the
   deployment. Their database rows survive, so the API returns `fileUrl`s that
   404. `ServeStaticModule` is skipped on Vercel so those return a clean 404
   rather than an ENOENT error.

**What still works:** everything database-backed — profile, services,
projects, certifications, awards, contact form, admin login, and all CRUD
except file attachment.

| Option | Effort | Result |
|---|---|---|
| Commit `uploads/` to git | Low | Existing files serve correctly (read-only is fine for *serving*). New uploads still fail. ~25 MB repo growth. Remove `uploads/**/*` from `.gitignore` and delete the `process.env.VERCEL` guard in `app.module.ts`. |
| S3 / Cloudinary / Supabase Storage | Medium | Full functionality. `StorageService` is the single seam — implement the driver, no controller changes. |
| Host on Railway / Render / Fly.io | Low | Persistent disk, no code change. |

---

## Connection pooling

`app.module.ts` sets `max: 1` on Vercel (`DB_POOL_SIZE` overrides), a 10s idle
timeout, and `retryAttempts: 3`. Many short-lived instances each holding one
connection, rather than each opening ten.

SSL is decided by **host**, not `NODE_ENV`: anything that is not
localhost/127.0.0.1 gets TLS. Your Aiven database therefore works in
development too — keying it off `NODE_ENV` would have broken local startup.

If you hit connection limits under load, use Aiven's connection-pooled
endpoint (PgBouncer) as `DATABASE_URL`.

---

## Before going live

- [ ] `JWT_SECRET` newly generated — not the local one
- [ ] `ADMIN_PASSWORD` is not `ChangeThisPassword123!`
- [ ] `DB_SYNCHRONIZE=false`
- [ ] Schema exists in the production database (run the seed once with
      `DB_SYNCHRONIZE=true`, or run migrations)
- [ ] `CORS_ORIGINS` lists only origins you control
