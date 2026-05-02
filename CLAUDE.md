@AGENTS.md

# enlace — project context

Open-source wedding website template. The owner forks the repo, edits a single config file, and gets a public site (Portuguese) plus an admin panel (Portuguese + English) with RSVP collection. The project is intentionally simple and replicable.

## Stack (locked in)

- **Next.js 16** — App Router, Server Components, Server Actions. Monolith: SSR + mutations live in the same project, no separate API. Read `node_modules/next/dist/docs/` before writing Next-specific code; this version has breaking changes vs. older training data.
- **TypeScript** everywhere.
- **Tailwind CSS v4** + **shadcn/ui** (preset `base-nova`, base color `neutral`, CSS variables, Lucide icons).
- **Drizzle ORM** + **drizzle-kit** + `postgres` driver. Migrations under `./drizzle`, schema at `src/lib/db/schema.ts`, client at `src/lib/db/index.ts`. Scripts: `db:generate`, `db:migrate`, `db:push`, `db:studio`.
- **Auth.js v5 beta** (`next-auth@beta`) + `@auth/drizzle-adapter`. Magic link login. Two roles: `COUPLE`, `CEREMONIAL`. Adapter tables (`users`, `accounts`, `sessions`, `verificationTokens`) already in the schema with the `user_role` Postgres enum.
- **Zod 4** for validation. Share schemas between forms and Server Actions.
- **PostgreSQL 16** in production via **Supabase** (used as Postgres only, no Supabase Auth/Realtime/Edge — those have higher lock-in). Optionally Supabase Storage for the photo gallery.
- **Vercel** for hosting (Hobby/free). Vercel free runs functions in `iad1` (US East), so Supabase region should be `us-east-1` to keep API↔DB latency low. São Paulo (`gru1`) requires Vercel Pro.

## Stack rationale (decisions made)

- Next.js over Rails: bigger JS community → easier for forkers; Vercel one-click deploy; React + Server Actions handle the interactive admin/RSVP well.
- Drizzle over Prisma: lighter, faster cold starts on serverless, SQL-explicit (good for forkers learning the project).
- Supabase over Neon: free tier is always-on (Neon has a 190h/month compute cap); Supabase also gives Storage for free, useful for the photo gallery. We avoid Supabase services with high lock-in (Auth, Realtime, Edge Functions).
- Magic link auth over passwords: no password storage, simpler for two non-technical users (couple + ceremonial).

## Internationalization

- **Public site**: Portuguese (pt-BR) only. Default locale is set in `wedding.config.ts → site.locale`.
- **Admin panel**: bilingual (pt-BR + en). When implementing, use `next-intl` scoped to the `(admin)` route group. Do not internationalize the public site.

## Codebase language conventions

- **Code, identifiers, comments, docs (README, env files, this file)**: English.
- **User-facing strings on the public site**: Portuguese (sourced from `wedding.config.ts`).
- **Admin panel UI strings**: handled via i18n catalogs (pt + en).
- The maintainer (Raphael) communicates with Claude in Portuguese; written artifacts in the repo stay English.

## Folder structure

```
enlace/
├── compose.yaml                   # database + app + claude (jail profile)
├── docker/
│   ├── app.Dockerfile             # node:22-alpine, runs as user `node`
│   └── claude.Dockerfile          # node:22-bookworm-slim with @anthropic-ai/claude-code
├── drizzle.config.ts              # drizzle-kit config (uses .env.local)
├── components.json                # shadcn config
├── .env.example                   # template for required env vars
├── src/
│   ├── app/
│   │   ├── (public)/              # public Portuguese site
│   │   ├── (admin)/admin/         # admin panel (pt + en)
│   │   ├── api/auth/[...nextauth]/  # Auth.js route handler (TBD)
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── globals.css
│   ├── components/ui/             # shadcn components
│   ├── config/
│   │   └── wedding.config.ts      # SINGLE source of truth for static site content
│   └── lib/
│       ├── db/
│       │   ├── index.ts           # drizzle client (postgres-js, prepare:false for poolers)
│       │   └── schema.ts          # users, accounts, sessions, verificationTokens, user_role enum
│       ├── auth/                  # Auth.js config (TBD)
│       └── utils.ts               # shadcn cn() helper
└── public/
```

## Local development

Two ways to run locally — pick one:

### Docker (recommended)

```bash
docker compose up --build              # starts database + app on :3000
docker compose exec app npm run db:push
docker compose --profile jail run --rm claude   # opens shell in the AI sandbox
```

- App: http://localhost:3000
- DB host port: 5432 (inside the Docker network it's `database:5432`)
- The `claude` service uses the `jail` profile, so it does NOT start with plain `up`. It is meant for running the Claude Code CLI in permissive mode without exposing the host. It shares the project workspace with the app, but only `/workspace` and the persistent home volume are accessible — no Docker socket, no privileged flags, no host filesystem outside the project.
- `node_modules` and `.next` live in named volumes (not the host bind mount) to avoid macOS↔Linux platform mismatch.
- `DATABASE_URL` inside containers is `postgres://enlace:enlace@database:5432/enlace`.
- `.env.local` is loaded if present (optional).

### Without Docker

```bash
cp .env.example .env.local      # fill DATABASE_URL with Supabase pooler URL
npm install
npm run db:push
npm run dev
```

## Deployment

- Vercel imports the GitHub repo. Add the env vars from `.env.example` in the project settings.
- Production `DATABASE_URL` should use Supabase's **transaction pooler** (port 6543) since Vercel functions are short-lived; the postgres-js client is configured with `prepare: false` to be compatible with that pooler.
- `AUTH_URL` must be set to the production URL.

## Status

### Done
- Repo initialized, on GitHub: `git@github.com:RaphaelNeumann/enlace.git` (branch `main`).
- Next.js 16 scaffold with TS, Tailwind, App Router, ESLint, src dir, alias `@/*`.
- shadcn/ui initialized (`base-nova` preset, neutral base color).
- Drizzle ORM configured with adapter-compatible schema (users, accounts, sessions, verificationTokens, `user_role` enum).
- `wedding.config.ts` skeleton with placeholder fields (couple, date, venue, ceremony, reception, rsvp deadline, dress code, contact, site).
- `.env.example` with `DATABASE_URL`, `AUTH_SECRET`, optional Resend / Supabase Storage vars.
- `.gitignore` updated to allow `.env.example` while still ignoring real `.env*`.
- Docker stack: `database` (postgres:16-alpine), `app` (Next.js dev server), `claude` (jail, opt-in profile). All three validated.
- README with PT/EN i18n note, fork instructions, Docker instructions, and scripts.

### Next (in order)
1. **Auth.js v5 setup**: `src/lib/auth/index.ts` (config + adapter + magic link), route handler at `src/app/api/auth/[...nextauth]/route.ts`, `auth()` helper, `middleware.ts` for role-based gating of `/admin`.
2. Email provider for magic link (Resend recommended). Wire `AUTH_RESEND_KEY` and `AUTH_EMAIL_FROM`.
3. Define feature scope:
   - Public site sections (hero/countdown, story, ceremony/reception, gallery, RSVP form, gifts/PIX, dress code, location, FAQ).
   - Admin panel features (RSVP list, filters, search, manual confirmation, CSV export, dashboard totals).
   - Permissions per role (`COUPLE` vs. `CEREMONIAL`).
4. Schema for guests/RSVPs (after feature scope is fixed).
5. `next-intl` setup scoped to `(admin)`.
6. Public site UI (single locale, Tailwind + shadcn).
7. Admin panel UI.

### Open questions for the next session
- Will RSVP allow plus-ones? Free-text dietary restrictions?
- Does `CEREMONIAL` only manage RSVPs, or also see contact info / messages?
- Will the gallery be Supabase Storage (server-uploaded by the couple) or just static images in `/public`?
- Custom domain plans (affects `AUTH_URL` and any CSP).

## Conventions and gotchas

- Next.js 16: always consult `node_modules/next/dist/docs/` before using Next APIs; some patterns from older training data are deprecated.
- `wedding.config.ts` is the single source of truth for site content. Do not hardcode names/dates/venues in components.
- Server Actions go in files marked `'use server'`. Always check `auth()` and role inside every action — they are reachable as POST endpoints.
- Use `revalidatePath` / `revalidateTag` after mutations; `redirect()` from `next/navigation` for post-action redirects.
- Validation: every Server Action input goes through a Zod schema before touching the DB.
- Forms: prefer plain `<form action={...}>` with progressive enhancement; reach for `useActionState` when pending UI is needed.
- Database: never expose Supabase Service Role key to the client. All DB access is server-side via Drizzle.
- RLS: enabled on Supabase by default ("automatic RLS" on, Data API off) — even though we only access via the server, keep RLS as a defense-in-depth layer.
