# Portfolio Frontend — React + TypeScript + Tailwind

Dark-mode portfolio UI for the NestJS backend in `../backend`.

## Quick start

Start the backend first (it serves the content), then:

```bash
cd frontend
npm install
npm run dev
```

Opens on `http://localhost:5173`. The Vite dev server proxies `/api` and
`/static` to `http://localhost:4000`, so the app calls same-origin paths and
never hits CORS in development. Deploying the frontend separately? Set
`VITE_API_BASE_URL` to the API origin.

## Design system

Tailwind v4 configures the theme in CSS, not `tailwind.config.js`. All tokens
live in the `@theme` block at the top of `src/index.css`:

| Token | Value | Role |
|---|---|---|
| `--color-ink-950` | `#09090E` | Page background |
| `--color-ink-900` | `#0F0F1A` | Sidebar / raised surfaces |
| `--color-accent-500` | `#6366F1` | Gradient start (indigo) |
| `--color-violet-accent` | `#A855F7` | Gradient end (purple) |

Three component classes carry the look, defined once in `index.css`:

- `.glass` — 3% white fill, 8% white border, 24px backdrop blur, 20px radius
- `.glass-hover` — violet border and glow lift on hover
- `.gradient-surface` / `.gradient-text` — the indigo→purple accent

Type is **Outfit** for display, **Inter** for body.

## Structure

```
src/
├── main.tsx                 # entry
├── App.tsx                  # layout shell; fetches profile once, passes down
├── index.css                # @theme tokens + .glass/.gradient component layer
├── types/api.ts             # interfaces mirroring the backend entities
├── lib/
│   ├── apiClient.ts         # axios instance, error flattening, URL resolving
│   └── portfolioApi.ts      # one function per endpoint
├── hooks/
│   ├── useApiResource.ts    # fetch-on-mount with abort + refetch
│   └── usePortfolioData.ts  # one hook per section
└── components/
    ├── layout/Sidebar.tsx
    ├── ui/Primitives.tsx    # buttons, tags, skeletons, error/empty states
    ├── ui/Toast.tsx         # context-based toast notifications
    ├── ui/BrandIcons.tsx    # inline GitHub/LinkedIn SVGs
    └── sections/            # Hero, About, Services, Projects,
                             # Certifications, Awards, Contact
```

Components never call axios directly — they go through `portfolioApi`, so an
endpoint change is a single-file edit. Every section owns its own loading,
error, and empty state, so one failing request degrades that section rather
than blanking the page.

## Notable details

- **Profile is fetched once** in `App.tsx` and passed to the sidebar, hero,
  about and contact panels rather than re-requested per section.
- **Active nav highlighting** uses `IntersectionObserver`, and the pill slides
  between items via Framer Motion's shared `layoutId`.
- **Contact form** validates client-side against the same rules as the backend
  DTO, so users get feedback without a round-trip. It includes the hidden
  honeypot field the API expects.
- **Accessibility**: skip link, `aria-live` toasts, labelled inputs with
  `aria-invalid`/`aria-describedby`, visible focus rings, and a
  `prefers-reduced-motion` block that disables animation.
- **Icons**: `DynamicIcon` resolves database-stored icon names through an
  explicit registry. A barrel `import * as Icons` was tripling the bundle
  (1,355 kB → 439 kB after switching).

## Version constraints

**Vite is pinned to v6 because this machine runs Node v20.15.0.** Vite 7 and 8
both require `^20.19.0 || >=22.12.0`; on 20.15 npm silently skips rolldown's
native binary and the build dies with a missing `.node` module.

Upgrading to Node 20.19+ or 22 LTS lets you move up:

```bash
npm install -D vite@^8 @vitejs/plugin-react@^5
```

Lucide v1 has **removed brand icons** (GitHub, LinkedIn, Figma…) for trademark
reasons. Those marks are inline SVGs in `ui/BrandIcons.tsx`.

## Verification status

`tsc --noEmit` and `vite build` both pass clean; `npm audit` reports 0
vulnerabilities.

Rendering was verified in-browser against the running dev server: all seven
sections mount, the theme tokens resolve to the exact specified hex values
(`#09090E` ground, `#6366F1`→`#A855F7` gradient), glass blur and radius apply,
and both font families load.

Not yet verified: the populated states. The check above ran with the backend
down, so the data sections were showing their error states. Start the API and
reload to confirm real content.
