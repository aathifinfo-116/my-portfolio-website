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

**2. `outputDirectory` points at an empty `public/`.**
With the "Other" preset, Vercel's output directory defaults to `public` when
it exists and **the project root otherwise** — and static files are matched
*before* `rewrites`. Leaving it unset would publish the repository root, so
`/package.json`, `/tsconfig.json` and the compiled `/dist/...` would be
downloadable as plain text. An empty `public/` publishes nothing, and every
request falls through the rewrite to the function.

**3. The handler caches the in-flight promise.**
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

Vercel dashboard → the **frontend** project (`aathif-thahir-profile`) →
Settings → Environment Variables → Add:

| Key | Value | Environments |
|---|---|---|
| `VITE_API_BASE_URL` | `https://<your-backend>.vercel.app` | Production, Preview, Development |

**Origin only.** No trailing slash and no `/api` suffix —
`src/lib/apiClient.ts` appends `/api` itself, so a value ending in `/api`
produces requests to `/api/api/profile`.

Vite inlines `import.meta.env.*` at **build** time, so the variable has no
effect on the deployment already built. After saving it, go to Deployments →
the latest one → ⋯ → **Redeploy**.

Without it the frontend calls same-origin `/api`, which does not exist on the
frontend deployment.

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

## Troubleshooting "Could not reach the server" with a 200 in DevTools

DevTools shows `200 OK`, but the Response tab says *Failed to load response
data* and the app reports a network error. That combination is always CORS:
the response arrived, and the browser refused to let JavaScript read it
because `Access-Control-Allow-Origin` did not match the page's origin. Axios
sees no response object at all, so `extractErrorMessage` falls through to
"Could not reach the server. Is the API running?".

The fix is on the **backend**: `CORS_ORIGINS` must contain the exact origin the
browser is on — scheme included, no trailing slash.

Vercel mints a new subdomain per deployment, so entries may contain `*`, which
matches within a single label:

```
CORS_ORIGINS=https://my-portfolio-frontend-*.vercel.app,http://localhost:5173
```

That allows every preview deployment of that project. It does not allow
`https://evil.vercel.app`, `https://my-portfolio-frontend-x.evil.vercel.app`,
or the same host over plain `http`.

Redeploy the backend after changing it — the value is read at boot.

---

## ⚠️ Stored file URLs are absolute and baked in at write time

`storage.service.ts` and `document-sync.service.ts` compose
`${PUBLIC_BASE_URL}/static/...` and persist the **whole URL** in the database.
Rows seeded locally therefore contain `http://localhost:4000/...` forever;
changing `PUBLIC_BASE_URL` on Vercel does not rewrite them.

Because your local and deployed backends share one Aiven database, the
deployed API returns those localhost URLs. Two failures follow: the host is
unreachable from a visitor's browser, and `http://` assets on an `https://`
page are blocked as mixed content regardless.

Re-running the seed/sync with `PUBLIC_BASE_URL` set to the deployed origin
rewrites the rows — but the files themselves still are not deployed, so see
the file-storage section below. Storing relative paths and resolving them at
response time would remove this class of problem entirely.

---

## Troubleshooting `FUNCTION_INVOCATION_FAILED`

The build succeeded and the deployment says **Ready**, but every request
returns `500: INTERNAL_SERVER_ERROR / FUNCTION_INVOCATION_FAILED`. That is a
crash *inside* the function, not a build problem, so the build log will not
mention it.

**Most likely: environment variables are missing.** `env.validation.ts` marks
`DB_HOST`, `DB_USERNAME`, `DB_PASSWORD`, `DB_NAME`, `JWT_SECRET`,
`ADMIN_EMAIL` and `ADMIN_PASSWORD` as required, and `ConfigModule` throws
during `NestFactory.create` when one is absent — the same
`Config validation error: "DB_HOST" is required` you would see locally. A
project deployed without opening the Environment Variables panel fails here
every time.

Note there is no `.env` in the deployment: `.env` is gitignored, so the
Vercel dashboard is the *only* source of these values.

**To see the real error:** Vercel → your project → **Logs** (or Observability
→ Logs), then reload the failing URL. `api/index.ts` catches boot failures and
writes the full stack there with a `[boot]` prefix.

To surface the message in the HTTP response instead — useful when the log
viewer is awkward — add `DEBUG_BOOT=1` to the environment variables and
redeploy. The response body then carries the reason:

```json
{ "statusCode": 500, "error": "Boot failure", "message": "..." }
```

Remove it once fixed; the message can name your database host and user.

**Other causes, in rough order of likelihood:**

| Message in the log | Cause |
|---|---|
| `Config validation error: "X" is required` | Missing environment variable |
| `no pg_hba.conf entry ... no encryption` | `DB_SSL` set to `false` against a managed database |
| `password authentication failed` | Wrong `DB_PASSWORD`, or Aiven's IP allow-list excludes Vercel |
| `Cannot find module '../dist/bootstrap'` | `nest build` did not run — check `buildCommand` in `vercel.json` |
| `relation "profile" does not exist` | Schema was never created in the production database |

---

## File storage: Vercel Blob

The function filesystem is read-only and ephemeral, and `uploads/` is
gitignored, so the local driver cannot serve or accept files on Vercel. The
`vercel-blob` driver moves both to Vercel Blob.

### 1. Create and connect the store

Vercel → Storage → Create → Blob. Then **Connect to Project** → your backend
project → Production + Preview.

Tick **"Add a read-write token env var to this connection."** This is
required, not optional. Connecting a store creates only `BLOB_STORE_ID` and
`BLOB_WEBHOOK_PUBLIC_KEY`, and the SDK refuses to upload with those alone:

```
Vercel Blob: No blob credentials found. Pass a `token` option, set
`BLOB_READ_WRITE_TOKEN`, or use `oidcToken` (or `VERCEL_OIDC_TOKEN`) with
`storeId` or `BLOB_STORE_ID`.
```

Every upload returns 500 until `BLOB_READ_WRITE_TOKEN` exists. Redeploy the
backend after adding it — environment variables are only read at boot.

The same variable is what the local migration script needs. To fetch it into
`backend/.env`: `vercel link` then `vercel env pull .env.vercel`.

### 2. Migrate the existing files

Dry run first — it uploads nothing and writes nothing:

```bash
cd backend
npm run migrate:blob
```

It lists every file it would upload and every database column it would
repoint. When the report looks right:

```bash
npm run migrate:blob -- --apply
```

This uploads each file under `uploads/` to a blob whose pathname mirrors the
folder layout (`documents/devops/x.pdf` stays `documents/devops/x.pdf`), then
rewrites `profile.avatarUrl`, `profile.resumeUrl`, `documents.fileUrl`,
`projects.imageUrl`, `certifications.documentUrl`, `certifications.badgeUrl`
and `awards.imageUrl` to the returned public URLs.

`githubUrl`, `liveUrl` and `credentialUrl` are deliberately untouched — those
are real external links.

The script talks to whatever database your `.env` points at, which for this
project is the shared Aiven instance. There is no undo, which is why dry run
is the default. Re-running is safe: pathnames are stable, uploads overwrite,
and rows already on a blob URL are skipped.

### 3. Switch the driver

On the backend Vercel project:

```
STORAGE_DRIVER=vercel-blob
```

Redeploy. New uploads from the admin portal now go to Blob, deletes remove the
blob, and `/documents/:id/download` and `/profile/resume/download` redirect to
the blob URL with `?download=1`, which is what makes Blob send
`Content-Disposition: attachment`.

Set it locally too if you want the admin portal to write to Blob in
development; leave it unset to keep writing to `uploads/`.

### What this does not fix

`PUBLIC_BASE_URL` is still baked into any *new* local-driver URL, so keep the
driver consistent across environments or you will mix the two schemes again.

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
