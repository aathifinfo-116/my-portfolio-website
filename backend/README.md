# Portfolio Backend — NestJS + TypeORM + PostgreSQL

Backend for the Aathif Thahir portfolio site. Serves the public read-only
content the React app renders, plus a JWT-protected admin surface for managing
that content.

## Quick start

```bash
cd backend
npm install
cp .env.example .env     # then set DB_PASSWORD and JWT_SECRET
npm run seed             # creates the admin account + initial content
npm run start:dev
```

- API: `http://localhost:4000/api`
- Swagger (dev only): `http://localhost:4000/api/docs`
- Uploaded files: `http://localhost:4000/static/...`

Create the database first if it does not exist:

```sql
CREATE DATABASE portfolio;
```

## Security model

Authentication is a **global** `JwtAuthGuard`. Every route requires a bearer
token *unless* it is explicitly marked `@Public()`. This is deliberately
fail-closed: a new controller added later is protected by default, and forgetting
a decorator locks a route down rather than exposing it.

Public routes are exactly:

| Method | Route | Purpose |
|---|---|---|
| GET | `/api/profile` | Hero + sidebar content |
| GET | `/api/services` | Services grid |
| GET | `/api/projects`, `/api/projects/counts`, `/api/projects/:id` | Portfolio grid + filters |
| GET | `/api/certifications`, `/api/certifications/grouped`, `/api/certifications/:id` | Studies & certs |
| GET | `/api/awards`, `/api/awards/:id` | Awards section |
| POST | `/api/contact` | Contact form submission |
| POST | `/api/auth/login` | Obtain a token |

Everything else — all `POST`/`PATCH`/`DELETE`, all `/admin/all` listings, all
uploads, and the entire inbox — requires `Authorization: Bearer <token>`.

Other measures in place:

- **Password storage**: bcrypt, cost 12. The `passwordHash` column is
  `select: false`, so it cannot leak through a normal entity read.
- **Login**: identical error for unknown-email and wrong-password, with a dummy
  bcrypt comparison on the miss path so response timing does not reveal which
  emails exist. Rate limited to 5 attempts/minute.
- **Contact form**: 3 submissions/minute per IP, plus a honeypot field. Spam is
  acknowledged with the same success response it would get otherwise, so a bot
  cannot tell it was rejected.
- **Validation**: global `ValidationPipe` with `whitelist` and
  `forbidNonWhitelisted`, so unexpected fields are a 400 rather than silently
  persisted.
- **Uploads**: MIME allowlist (PDF for documents, common raster formats +
  SVG for images), size cap, and server-generated filenames — the client
  filename is kept only as display metadata, never used as a path.
- **Deletion**: `removeByUrl` resolves and confirms the path stays inside the
  upload directory before unlinking, so a tampered stored URL cannot traverse out.
- **Live account check**: the JWT strategy re-reads the account per request, so
  deactivating an admin revokes access immediately rather than at token expiry.

## Layout

```
backend/
├── src/
│   ├── main.ts                    # bootstrap: pipes, helmet, CORS, swagger
│   ├── app.module.ts              # composition root + global guards/filters
│   ├── config/
│   │   ├── configuration.ts       # typed config namespaces
│   │   ├── env.validation.ts      # Joi schema — fails fast on boot
│   │   └── typeorm.config.ts      # standalone DataSource for the CLI
│   ├── common/
│   │   ├── entities/base.entity.ts        # uuid + createdAt/updatedAt
│   │   ├── dto/pagination-query.dto.ts    # shared paging + helper
│   │   ├── decorators/public.decorator.ts # opts a route out of auth
│   │   └── filters/all-exceptions.filter.ts
│   └── modules/
│       ├── auth/            # login, JWT strategy, global guard, admin entity
│       ├── profile/         # singleton hero/sidebar record + resume upload
│       ├── services/        # ServiceOffering CRUD
│       ├── projects/        # filterable portfolio CRUD + reorder
│       ├── certifications/  # studies/certs CRUD + PDF attach
│       ├── awards/          # awards CRUD
│       ├── contact/         # public submit + admin inbox
│       ├── uploads/         # StorageService (driver-shaped) + endpoints
│       └── seed/            # idempotent seeding, run via `npm run seed`
└── uploads/                 # served at /static (gitignored)
```

Each module owns its `entities/`, `dto/`, controller, service, and module file,
so a feature is one directory rather than five parallel folders.

## Data model

| Entity | Table | Notes |
|---|---|---|
| `AdminUser` | `admin_users` | Single seeded admin; hash never selected by default |
| `Profile` | `profile` | Singleton row, auto-created on first read |
| `ServiceOffering` | `service_offerings` | Named to avoid colliding with Nest "services" |
| `Project` | `projects` | `category` enum drives the filter chips |
| `Certification` | `certifications` | `category` = Certification / Academic Degree / Study Material |
| `Award` | `awards` | |
| `Inquiry` | `inquiries` | `ipAddress`/`userAgent` are `select: false` |

`isPublished` on the content tables lets you draft an entry in the dashboard
before it appears publicly. Public queries always force `isPublished = true`;
the admin `/admin/all` routes do not.

## Migrations

`DB_SYNCHRONIZE=true` is convenient in development and **must be `false` in
production**. For real schema changes:

```bash
npm run migration:generate -- src/migrations/AddSomething
npm run migration:run
```

## Storage drivers

`StorageService` is the single seam for file persistence. `local` is implemented
and needs no third-party account. Moving to Cloudinary or S3 means implementing
the put/remove pair for that driver — `saveDocument`, `saveImage`, and
`removeByUrl` are the only methods callers touch, so no controller or service
changes.

## Verification status

`npx tsc --noEmit` and `nest build` both pass clean, and `npm audit` reports 0
vulnerabilities on NestJS 11.

The app has **not** been booted against a live database — that needs your
Postgres password in `.env`. Once set, `npm run start:dev` is the check.
