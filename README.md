# enlace

Open-source wedding website template. Fork the repo, edit a single config file, and get a public site (Portuguese) plus an admin panel (Portuguese + English) with RSVP collection. The project is intentionally simple and replicable.

## Stack

- **Next.js 16** (App Router, Server Components, Server Actions). Monolith: SSR + mutations live in the same project, no separate API.
- **TypeScript** everywhere.
- **Tailwind CSS v4** + **shadcn/ui** (preset `base-nova`, base color `neutral`, CSS variables, Lucide icons).
- **Drizzle ORM** + **drizzle-kit** + `postgres` driver. Migrations under `./drizzle`, schema at `src/lib/db/schema.ts`.
- **Auth.js v5** (`next-auth@beta`) + `@auth/drizzle-adapter`. Magic-link login. Two roles: `COUPLE`, `CEREMONIAL`.
- **Resend** for transactional email (magic links).
- **Zod 4** for validation. Schemas shared between forms and Server Actions.
- **PostgreSQL 16** in production via **Supabase** (used as Postgres + Storage; Auth/Realtime/Edge avoided due to higher lock-in).
- **Vercel** for hosting (Hobby/free tier).
- **Vitest** + **React Testing Library** + **MSW** for unit / integration / component tests; **Playwright** for end-to-end smoke flows. Coverage is enforced at ≥ 90 % per feature.

### Why these choices

- Next.js over Rails: bigger JS community → easier for forkers; Vercel one-click deploy; React + Server Actions handle the interactive admin/RSVP well.
- Drizzle over Prisma: lighter, faster cold starts on serverless, SQL-explicit (good for forkers learning the project).
- Supabase over Neon: free tier is always-on (Neon caps compute at 190h/month). Supabase also gives Storage on the free tier, which we use for the photo gallery. We avoid Supabase services with high lock-in (Auth, Realtime, Edge Functions).
- Magic-link auth over passwords: no password storage, simpler for two non-technical users (couple + ceremonial).
- Vercel free runs functions in `iad1` (US East), so create the Supabase project in `us-east-1` to keep API↔DB latency low. São Paulo (`gru1`) requires Vercel Pro.

## Folder structure

```
enlace/
├── compose.yaml                   # database + app + claude (jail profile)
├── docker/
│   ├── app.Dockerfile             # node:22-alpine, runs as user `node`
│   └── claude.Dockerfile          # node:22-bookworm-slim with @anthropic-ai/claude-code + docker CLI
├── drizzle.config.ts              # drizzle-kit config (uses .env.local)
├── components.json                # shadcn config
├── next.config.ts                 # security headers (Helmet equivalents) via headers()
├── proxy.ts                       # Next.js 16 proxy (formerly middleware.ts) — nonce-based CSP
├── .env.example                   # template for required env vars
├── src/
│   ├── app/
│   │   ├── (public)/              # public bilingual site (pt + en)
│   │   ├── (admin)/admin/         # admin panel (pt + en), gated in layout.tsx
│   │   ├── api/auth/[...nextauth]/  # Auth.js route handler
│   │   ├── layout.tsx             # awaits headers() to force dynamic rendering (nonce CSP)
│   │   ├── page.tsx
│   │   └── globals.css
│   ├── components/ui/             # shadcn components
│   ├── config/
│   │   └── wedding.config.ts      # compile-time config only (theme preset, default locale, rsvp.mode lock)
│   └── lib/
│       ├── db/
│       │   ├── index.ts           # drizzle client (postgres-js, prepare:false for poolers)
│       │   └── schema.ts          # users, accounts, sessions, verificationTokens, user_role enum
│       ├── auth/
│       │   └── index.ts           # NextAuth v5: Drizzle adapter + Resend provider + allowlist
│       └── utils.ts               # shadcn cn() helper
└── public/
```

## Internationalization

Both the public site and the admin panel are bilingual: Portuguese (pt-BR) and English. The default locale is configurable in `src/config/wedding.config.ts`.

- **UI strings** (buttons, labels, validation messages) live in i18n catalogs at `src/i18n/{pt,en}.json` (via `next-intl`).
- **Wedding content** (names, venue, story, FAQ, dress code, etc.) is stored in DB and edited via `/admin`. Each translatable field lives in two columns (`fooPt` + `fooEn`); when `fooEn` is null, the public site falls back to the Portuguese value.
- A language toggle in the layout switches between locales.

## Editing site content (admin-managed)

After deploy, every editorial field is editable from `/admin` without redeploys:

- `/admin` — dashboard with totals (confirmados / recusaram / pendentes / mensagens) + quick links.
- `/admin/site` — couple names, wedding date / time / time zone, venue short name, site title, meta description, OG image flag, section visibility flags.
- `/admin/programacao` — Cerimônia + Recepção cards (date, time, address, Google Maps link, watercolor icon).
- `/admin/dress-code` — headline, intro, women's / men's sub-blocks (PT + EN).
- `/admin/story` — Nossa história body (PT + EN) and three photo storage paths.
- `/admin/guests` — full guest CRUD with status transitions (confirmar / cancelar confirmação / marcar como recusou) and search/filter by name, status, source.
- `/admin/rsvps` — confirmed-attendance roll-up with totals, plus-ones inline, CSV export.
- `/admin/observations` — guest observations list + "Gerar PDF" (browser print-to-PDF route).
- `/admin/messages` — gift-modal messages joined with the gift title.
- `/admin/gifts`, `/admin/tips`, `/admin/photos`, `/admin/faq` — section-specific CRUD.

Public visitor routes:

- `/` — composed home (Hero, Programação, Traje, Nossa história, Lista de presentes, Galeria, Dicas, FAQ) gated by visibility flags.
- `/rsvp` — RSVP form (env-unset = public; env-set = admin-only preview).
- `/rsvp/<token>` — RSVP form gated by the `RSVP_ACCESS_TOKEN` env var via constant-time comparison; mismatch returns 404.

Admin sign-in:

- `/login` (custom branded page) replaces Auth.js's default `/api/auth/signin`. Magic-link flow stays intact. `pages.signIn`, `pages.verifyRequest`, and `pages.error` are all wired to the `/login*` routes; visiting `/admin/*` while signed out redirects to `/login?callbackUrl=/admin/...`.

`src/config/wedding.config.ts` is reserved for compile-time configuration only: the theme preset, the default locale, and the `rsvp.mode` lock. The forker sets these once before first deploy.

## Development workflow (TDD, mandatory)

Every feature follows a strict test-first loop:

1. **Read the spec** in `docs/features/<feature>.md`. The doc is the single source of truth for goal, scope, UX flow, data model, permissions, and decisions.
2. **Write the test suite first** — Server Action validation, DB invariants, role-based permission denials, edge cases, success / error states. Tests must fail before any implementation lands.
3. **Implement** until every new test passes (GREEN). Existing tests must continue to pass; no regressions when adding a feature.
4. **Coverage** is enforced at **≥ 90 % per feature** via `npm run test:coverage`. Branches and functions are tracked but not gated; lines are.
5. **Tests are frozen.** A test in main is only changed when the underlying spec changes. Editing a green test to make implementation easier is a workflow violation; if a test feels wrong while implementing, the doc is probably wrong — pause and fix the doc first.

Test stack:

- **Vitest** (`vitest`, `@vitest/coverage-v8`) as the runner.
- **React Testing Library** (`@testing-library/react`, `@testing-library/user-event`) for components.
- **Drizzle against a real Postgres** for DB tests, using the `database` Docker service with per-suite ephemeral schemas. Drizzle is **not** mocked — schema regressions only show against real Postgres.
- **MSW** for HTTP-level fakes (Resend, Mercado Pago).
- **Playwright** for end-to-end flows (public RSVP, magic-link sign-in, gift checkout). Optional but valuable.

Test files co-locate with code (`foo.ts` ↔ `foo.test.ts`). Component tests live next to the component. Server Action tests sit alongside their `actions.ts`. End-to-end tests live in `e2e/`.

## Getting started (local, no Docker)

1. **Fork** this repository.
2. **Clone** and install:
   ```bash
   git clone https://github.com/YOUR_USERNAME/enlace.git
   cd enlace
   npm install
   ```
3. **Pick a theme preset** in `src/config/wedding.config.ts` (default is `aquarela-sage`, modeled after the reference design in `docs/features/theme.md`).
4. **Create a Supabase project** at [supabase.com](https://supabase.com) and copy the connection string. Editorial content (couple names, date, venue, etc.) is filled in later via `/admin`, not in this file.
5. **Set up environment variables**:
   ```bash
   cp .env.example .env.local
   # edit .env.local with your values
   ```
6. **Push the schema to the database**:
   ```bash
   npm run db:push
   ```
7. **Start the dev server**:
   ```bash
   npm run dev
   ```

## Getting started (Docker)

The project ships a Docker stack with three services:

- **database** — PostgreSQL 16 (replaces Supabase locally).
- **app** — runs the Next.js dev server.
- **claude** — sandboxed container with the Claude Code CLI installed, opt-in via the `jail` profile.

```bash
# Build images and start app + database
docker compose up --build

# In another terminal, push the schema to the local database
docker compose exec app npm run db:push

# Open the app
open http://localhost:3000

# Drop into the Claude jail container (separate command)
docker compose --profile jail run --rm claude
# Inside the container:
#   claude            # first run authenticates and stores creds in /home/node (persisted volume)
#   claude --dangerously-skip-permissions
```

When using Docker locally, `DATABASE_URL` is set automatically inside the containers (`postgres://enlace:enlace@database:5432/enlace`). Any other variables come from `.env.local` if present.

`node_modules` and `.next` live in named volumes (not the host bind mount) to avoid macOS↔Linux platform mismatch.

### About the `claude` jail container

The container runs as user `node` with `sudo` (NOPASSWD), and the host Docker socket (`/var/run/docker.sock`) is mounted in so Claude can run `docker compose` commands directly. **This trades isolation for convenience** — anything with the Docker socket is effectively root on the host. To restore strict isolation, remove the `/var/run/docker.sock` volume mount and the `group_add` entry from `compose.yaml`.

The `group_add` entry uses the env var `DOCKER_GID` (defaults to 102; check on the host with `stat -c '%g' /var/run/docker.sock` on Linux or `stat -f '%g' /var/run/docker.sock` on macOS — Debian/Ubuntu desktops often use 999).

## Admin login (magic link via Resend)

`/admin` is gated by Auth.js with magic-link sign-in. There are no passwords; clicking the link in the email logs the user in.

Two roles: `COUPLE` (the couple) and `CEREMONIAL` (the wedding planner). Only emails listed in the env vars below can sign in — anyone else who tries is rejected before any email is sent.

1. Create a free account at [resend.com](https://resend.com) and generate an API key (Dashboard → API Keys → Create).
2. Set `AUTH_RESEND_KEY` in `.env.local` (or in the Vercel dashboard for production).
3. **Development**: keep `AUTH_EMAIL_FROM="onboarding@resend.dev"`. Resend's sandbox sender only delivers to the email on your Resend account, which is fine while testing locally.
4. **Production**: add and verify your wedding domain in Resend → Domains, then set `AUTH_EMAIL_FROM` to an address on that domain (e.g. `enlace@your-wedding-domain.com`).
5. Set the allowlists. Both accept comma- or semicolon-separated lists:
   ```
   AUTH_COUPLE_EMAILS="you@example.com;partner@example.com"
   AUTH_CEREMONIAL_EMAILS="planner@example.com"
   ```
6. Generate `AUTH_SECRET` with `npx auth secret` (or `openssl rand -base64 32`).
7. Set `AUTH_URL=http://localhost:3000` and `AUTH_TRUST_HOST=true` for local dev.
8. Visit `/api/auth/signin` (or anything under `/admin`, which redirects there).

Operational notes:
- Sessions are DB-backed (default 30-day expiry). `auth()` queries the DB on every call.
- Role is written to the DB on first sign-in (`events.createUser`). To change someone's role afterward, update the env var **and** run `UPDATE users SET role = '…' WHERE email = '…'`.
- Removing an email from the env var rejects future logins but does not invalidate existing sessions. For immediate revocation, delete the user's row from `sessions`.

## Photo gallery (Supabase Storage)

The gallery uses Supabase Storage. Both `COUPLE` and `CEREMONIAL` can upload.

Design decisions:

- **Public bucket** named `gallery`. Wedding photos aren't confidential and signed-URL latency on every page load isn't worth it.
- **Direct browser upload via signed upload URL.** A Server Action issues a one-time signed URL (using the Service Role key, never exposed to the client); the browser `PUT`s the file directly to Supabase. This avoids Vercel's 4.5 MB Server-Action body limit (modern phone photos exceed that).
- **`photos` table in Postgres** tracks ordering, captions, and alt text. The bucket itself is a blob store keyed by random IDs. Schema (planned): `id`, `storagePath`, `caption { pt, en }`, `alt { pt, en }`, `position`, `uploadedAt`.
- **Image optimization via Next.js `<Image>`** with `remotePatterns` pointing at the Supabase URL. Next.js downloads the raw file once, generates WebP and multiple sizes, and serves from the Vercel cache — keeping Supabase bandwidth low (the free tier is 2 GB/month and would otherwise be a bottleneck).
- **Bucket creation is manual** the first time, via the Supabase dashboard (Storage → New Bucket → name `gallery`, public on). Documented in this README rather than scripted, because Storage doesn't have a clean SQL-migration story.

CSP impact: `proxy.ts` `img-src` needs the bucket origin (`https://<project>.supabase.co`).

## Security model

- **Nonce-based Content Security Policy** in `proxy.ts`. A fresh nonce is generated per request and forwarded to the renderer via the `x-nonce` request header. Next 16 auto-applies it to framework scripts and `next/font` style tags. `script-src 'self' 'nonce-…' 'strict-dynamic'`, `frame-ancestors 'none'`, etc. In dev, `'unsafe-eval'` and `'unsafe-inline'` (styles only) are allowed for React debugging.
- The proxy matcher excludes `api`, `_next/static`, `_next/image`, `favicon.ico` and link-prefetch requests.
- `src/app/layout.tsx` calls `await headers()` to force dynamic rendering. Nonce-based CSP is incompatible with static rendering, ISR, and PPR — pages cannot be cached at the CDN.
- **Adding new external origins** requires editing the CSP in `proxy.ts`:
  - Resend / magic-link emails: server-side, no CSP change needed.
  - Supabase Storage gallery: add bucket origin to `img-src`.
  - Third-party `<script>` (analytics, maps): add origin to `script-src` and pass `nonce={(await headers()).get('x-nonce')}` to the `<Script>` component; backend calls go in `connect-src`.
- **Static security headers** (HSTS, X-Frame-Options=DENY, COOP/CORP=same-origin, Referrer-Policy, Permissions-Policy, X-Content-Type-Options, etc.) live in `next.config.ts → headers()` — covers the rest of the Helmet defaults.
- Verifying headers locally:
  ```bash
  curl -sI http://localhost:3000/ | grep -iE 'content-security|strict-transport|x-frame|cross-origin|referrer|permissions'
  ```

## Deploying to Vercel

1. Import the repository at [vercel.com](https://vercel.com).
2. Use the Supabase **transaction pooler** connection string (port 6543) for `DATABASE_URL` — Vercel functions are short-lived, and the project's Postgres client is configured for that pooler.
3. Add the environment variables from `.env.local` in the Vercel dashboard. At minimum:
   - `DATABASE_URL`
   - `AUTH_SECRET` (regenerate with `npx auth secret`; do not reuse the dev value)
   - `AUTH_URL` (the production URL — see custom-domain section below)
   - `AUTH_TRUST_HOST=true` (Vercel runs behind their proxy)
   - `AUTH_RESEND_KEY`
   - `AUTH_EMAIL_FROM` (must use a domain verified in Resend — see below)
   - `AUTH_COUPLE_EMAILS`, `AUTH_CEREMONIAL_EMAILS`
4. Deploy.

### Using a custom domain

Local development uses `AUTH_URL=http://localhost:3000` and the Resend sandbox sender (`onboarding@resend.dev`), which works without a verified domain. For production with a custom domain (e.g. `enlace.your-domain.com`):

1. Point DNS to Vercel (Vercel dashboard → Domains → Add → follow the DNS instructions). TLS is issued automatically.
2. In Vercel → Settings → Environment Variables (Production), set `AUTH_URL=https://your-domain.com`. Setting it explicitly avoids edge cases where Vercel's auto-detect picks `*.vercel.app` instead of the custom domain.
3. In Resend → Domains → Add Domain, paste the DNS records they generate, wait for propagation (usually a few minutes).
4. Set `AUTH_EMAIL_FROM` to a sender on that domain (e.g. `enlace@your-domain.com`). The sandbox sender only delivers to the email of the Resend account owner — fine for local dev, but unusable in production.
5. Redeploy.

No code change is needed for the domain switch. The Content Security Policy in `proxy.ts` uses `'self'`, which adapts to whatever origin the site is served from.

> **Heads-up about HSTS.** The project sets `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload` in `next.config.ts`. Once a browser visits the production site, it will refuse plain HTTP for the domain (and all subdomains) for two years. Don't break HTTPS afterwards. If you need to roll out gradually, lower `max-age` temporarily and raise it before sharing the site publicly.

## Scripts

- `npm run dev` — development server
- `npm run build` — production build
- `npm run db:generate` — generate migration files from the schema
- `npm run db:migrate` — apply migrations
- `npm run db:push` — sync schema directly to the database (dev)
- `npm run db:studio` — open Drizzle Studio
- `npm run test` — run the Vitest suite
- `npm run test:watch` — Vitest in watch mode
- `npm run test:coverage` — Vitest with coverage report (gates new features at ≥ 90 % lines)
- `npm run test:e2e` — Playwright suite (public flows)

## Roadmap

### Done — v1 ready

The v1 wedding site is functional end-to-end. Couple/Cerimonial sign in at `/login`, manage everything from `/admin/*`, and the public site composes every section dynamically from the DB.

**Foundations**

- Next.js 16 scaffold (TS, Tailwind, App Router, ESLint, src dir, alias `@/*`).
- shadcn/ui initialized (`base-nova` preset, neutral base color).
- Drizzle ORM with full schema: users / accounts / sessions / verificationTokens / siteSettings (singleton) / programacaoCards / dressCode / storyContent / faqEntries / tipCategories / tips / gifts / giftMessages / photos / guests / plusOnes.
- Docker stack: `database`, `app`, `claude` (jail with host Docker socket).
- Security: nonce-based CSP in `proxy.ts` + Helmet-equivalent static headers in `next.config.ts`.
- **Auth.js v5 + Resend** end-to-end with custom branded sign-in pages at `/login`, `/login/verify`, `/login/error`.
- **TDD discipline**: 284 Vitest tests across 34 files (~96% line coverage on logic modules); all admin paths exercised.

**Public site (every section composes from the DB and respects its visibility flag)**

- `/` — Hero (monogram + couple names + tracked-caps date + countdown), Programação (Cerimônia + Recepção cards with Google Maps + RSVP CTA), Traje (sub-blocks Mulheres/Homens), Nossa história (sage block + circular photos + prose), Lista de presentes (PIX QR + Mercado Pago Checkout Pro + signed messages), Galeria, Dicas (categories with dialog), FAQ accordion, "Te esperamos!" closing footer.
- `/rsvp` and `/rsvp/<token>` — public RSVP form (closed-mode typeahead, plus-ones, observation, single-shot rule, rate-limited per IP, gated via `RSVP_ACCESS_TOKEN` with constant-time comparison).
- `/login*` — custom branded magic-link auth pages.

**Admin panel (`COUPLE` and `CEREMONIAL`)**

- `/admin` — dashboard with totals.
- `/admin/site`, `/admin/programacao`, `/admin/dress-code`, `/admin/story` — singletons + fixed-row CRUD.
- `/admin/faq`, `/admin/tips`, `/admin/gifts`, `/admin/photos` — list CRUD with reorder + visibility.
- `/admin/guests` — full CRUD + status transitions + plus-one editing.
- `/admin/rsvps` — confirmed-attendance roll-up + CSV export.
- `/admin/observations` — observations list + browser-print PDF route.
- `/admin/messages` — gift messages joined with the gift title.
- Image upload everywhere via `<UploadField>` (Supabase signed URL → browser PUT direct to Storage; bypasses Vercel 4.5 MB body limit).

### Backlog (post-v1, when needed)

- next-intl integration (replace the hardcoded `locale="pt"` props with route-based switching using the existing language toggle component).
- Polish UI to match the reference PDF more closely (watercolor illustrations, monogram SVG per preset, paper texture).
- Replace the placeholder PIX SVG with a real QR encoder (`qrcode-svg`).
- Mercado Pago webhooks for live payment confirmation + tracking.
- Resend templated emails (custom magic-link HTML, optional admin notifications on new RSVPs / messages).
- Playwright E2E suite (RSVP flow, admin sign-in flow).
- LGPD privacy page + footer link.
- Save-the-date sub-route + live photo wall (decided OUT of v1 in feature docs).

## License

MIT
