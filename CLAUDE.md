@AGENTS.md

# Working in enlace

## Read README.md first

`README.md` is the single source of truth for application context — stack, folder structure, security model, auth model, deployment, photo-gallery design, roadmap, open questions. Always consult it before answering questions about the project or making non-trivial changes. Treat this file as instructions about *how* to work in the codebase; treat README as the *what*.

## Test-driven workflow (mandatory)

For every feature, follow this loop:

1. **Read the spec.** Open the relevant doc in `docs/features/<feature>.md`. Internalize the goal, in/out-of-scope list, UX flow, data model, permissions, and decisions sections.
2. **Write the full test suite first.** Cover every decision and every UX-flow step in the doc — Server Action validation, DB invariants, role-based permission denials, edge cases, error states, success states. The component / route / function under test does not exist yet; tests should fail with `module not found` or `not implemented` errors.
3. **Run the suite — confirm RED.** Tests must actually fail (proving they exercise the new code path). A test that passes before any code is written is a broken test, not a passing one.
4. **Implement the feature** until every new test passes (GREEN). Existing tests for other features must continue to pass — no regressions allowed when adding a feature.
5. **Coverage check.** Run `npm run test:coverage`. Lines covered for the new feature's code must be ≥ **90 %**. Branches and functions tracked but not gated. If coverage falls short, write more tests against existing untested branches; do not delete code to satisfy the threshold.
6. **Tests are frozen.** Once a test is green, you may not edit it. The only legitimate reason to change a test is when the underlying spec (the feature doc) changes — and that requires editing the doc first, agreeing the change with the user, then updating the test. If a test feels wrong while implementing, the doc is probably wrong; pause and discuss.

### Test stack

- **Vitest** as the runner (`vitest`, `@vitest/coverage-v8`). ESM-native, fast, TypeScript-first.
- **React Testing Library** (`@testing-library/react`, `@testing-library/user-event`) for component tests.
- **Drizzle against a real Postgres** for DB-touching tests. The Docker compose stack already provides a `database` service; tests use a per-suite ephemeral schema (`SET search_path TO test_<random>`) for isolation. Avoid mocking Drizzle — schema regressions only show up against real Postgres.
- **MSW** (`msw`) for HTTP-level fakes (Resend, Mercado Pago API).
- **Playwright** for end-to-end smoke tests on the public RSVP flow and the magic-link sign-in. Optional but valuable; skip in PRs that only touch internal logic.

### Test file conventions

- Co-locate unit tests with the code: `foo.ts` ↔ `foo.test.ts`. Component tests live next to the component.
- Server Action tests go alongside their `actions.ts` files, named `actions.test.ts`.
- Schema / migration tests live in `src/lib/db/__tests__/`.
- E2E tests live in `e2e/` at the repo root; one file per high-value flow.

### Coverage scope

Coverage applies to **new feature code** (`src/**` and `proxy.ts`). Excluded by config:
- Scripts (`scripts/**`).
- Type-only files (`*.d.ts`).
- Test files themselves.
- Boilerplate Next.js files (`next.config.ts`, `app/globals.css`, `layout.tsx` shells with no logic).
- Generated migration files (`drizzle/**`).

If 90 % feels artificial for a specific file (e.g. an exhaustive switch with `default: throw`), document the exclusion in `vitest.config.ts` with a comment explaining why — don't silently skip.

## Design principle: admin-editable content

**All editorial site content is editable from `/admin`** — couple names, dates, venue, ceremony/reception details, story text, dress-code text, hero copy, FAQ entries, tips, gifts, photos, etc. The forker may seed initial values during setup, but post-deploy edits never require code changes or redeploys. Content lives in DB tables and is exposed via dedicated admin pages.

Exceptions (stay outside the admin):
- Secrets (`AUTH_SECRET`, `AUTH_RESEND_KEY`, `RSVP_ACCESS_TOKEN`, `PIX_*`, `MERCADO_PAGO_ACCESS_TOKEN`, etc.) — env vars only.
- Compile-time config: theme preset selection, default locale, `rsvp.mode` lock — `src/config/wedding.config.ts` (couple sets once before first deploy; locked thereafter).
- Code: routes, components, validation rules — committed.

When designing a new feature doc, default to "admin-managed" for any field a non-technical user might want to fix or update later. Move content out of `wedding.config.ts` into a DB table whenever practical.

## Codebase language conventions

- Code, identifiers, comments, repo docs (this file, README, env files): **English**.
- User-facing strings (public site + admin UI): **i18n catalogs** (pt + en) under `src/i18n/`. Never hardcode in components.
- Editorial content (couple names, venue, story, etc.) is admin-managed in DB (see "Design principle: admin-editable content" above), with each translatable field stored as separate `_pt` / `_en` columns. The TS-file pattern (`{ pt, en }` in `wedding.config.ts`) is reserved for compile-time config only.

## Next.js 16 specifics

- Always consult `node_modules/next/dist/docs/` before using Next APIs — older training data has deprecated patterns. Heed deprecation notices.
- `middleware.ts` was renamed to `proxy.ts` (project root, same API). Do **not** create `middleware.ts`.
- `proxy.ts` runs on Edge runtime; `postgres-js` is Node-only — never call the DB from the proxy.

## Server Actions

- `'use server'` files only.
- Check `auth()` **and** role inside every action. Server Actions are POST endpoints regardless of which UI element calls them.
- Zod-validate input before touching the DB; share schemas between forms and Server Actions.
- `revalidatePath` / `revalidateTag` after mutations; `redirect()` from `next/navigation` for post-action redirects.
- Prefer plain `<form action={...}>` with progressive enhancement; reach for `useActionState` when pending UI is needed.

## Database

- All access is server-side via Drizzle. Never expose Supabase Service Role key to the client.
- RLS is on by default in Supabase ("automatic RLS" on, Data API off). Keep it as defense-in-depth even though we only access via the server.

## Auth gotchas (when editing auth code)

- Sessions are DB-backed (`session: { strategy: "database" }`). `auth()` queries `sessions` join `users` per call.
- `/admin/*` is gated in `src/app/(admin)/admin/layout.tsx`, **not in `proxy.ts`** (Edge incompatibility with `postgres-js`). If a proxy-level gate is ever needed for non-`/admin` routes, use the Auth.js v5 split-config pattern (Edge-safe config without adapter) — adds complexity, avoid unless required.
- Allowlist (`AUTH_COUPLE_EMAILS` / `AUTH_CEREMONIAL_EMAILS`) is built once at module load. Changes require a redeploy. If an email appears in both vars, `CEREMONIAL` wins (last-write into the Map).
- Role is written to the DB in `events.createUser` (first sign-in only). To change a role for an existing user, update the env var **and** run `UPDATE users SET role = '…' WHERE email = '…'`.
- Removing an email from the env var rejects future logins but does **not** invalidate existing sessions (default 30 days). For immediate revocation, delete the row from `sessions`.
- Local dev requires `AUTH_URL=http://localhost:3000` and `AUTH_TRUST_HOST=true` in `.env.local`. Without `AUTH_URL`, Auth.js builds callback URLs from the bind address (`http://0.0.0.0:3000/...`) which breaks magic links opened from the browser.
- Diagnostic gotcha: `/api/auth/*` rejects HEAD with 400 (`UnknownAction: Only GET and POST requests are supported`). Use `curl -G` or `-X GET` instead of `curl -I`.

## Security headers / CSP (when adding external origins)

- Nonce-based CSP lives in `proxy.ts`. The nonce is generated per request and forwarded to the renderer via the `x-nonce` request header — Next 16 auto-applies it to framework scripts and `next/font` style tags.
- Adding new external origins requires editing the CSP in `proxy.ts`:
  - Resend / magic-link emails: server-side, no CSP change needed.
  - Supabase Storage gallery: add the bucket origin to `img-src`.
  - Third-party `<script>` (analytics, maps): add origin to `script-src` and pass `nonce={(await headers()).get('x-nonce')}` to the `<Script>` component; backend calls go in `connect-src`.
  - Embedded maps/video/iframes: `frame-src`.
- Don't add `'unsafe-inline'` or `'unsafe-eval'` outside dev — defeats the policy.
- Static security headers (HSTS, X-Frame-Options, COOP/CORP, Referrer-Policy, Permissions-Policy, etc.) live in `next.config.ts → headers()`.
- Nonce-based CSP forces dynamic rendering. `src/app/layout.tsx` calls `await headers()` to opt out of static rendering. Static rendering, ISR, and PPR are incompatible with nonce CSP — if a page needs to be cached at the CDN, it must opt out of CSP.

## Server Action conventions (established pattern)

Admin Server Actions follow this shape across the codebase:

```ts
"use server";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { adminFooBar } from "@/lib/foo/db";

export async function fooBarAction(formData: FormData): Promise<void> {
  const session = await auth();
  const obj = fdToObj(formData);   // local helper that handles "on", "", strings
  await adminFooBar(obj, session); // session is the trailing arg consumed by withAdmin
  revalidatePath("/", "layout");
  revalidatePath("/admin/foo");
}
```

- Always return `Promise<void>` from form-bound Server Actions so React's
  `<form action={...}>` typing accepts them.
- `revalidatePath("/", "layout")` invalidates the home (since it composes
  most sections). Add per-admin-page revalidation as needed.
- Admin pages that take a row id use closures: `action={async (fd) => { "use server"; await updateAction(id, fd) }}`.

## Auth gate location

- The auth gate for `/admin/*` lives in `src/app/(admin)/admin/layout.tsx`
  and redirects unauthenticated/non-admin sessions to `/login?callbackUrl=...`.
- `/login`, `/login/verify`, `/login/error` are at the top-level (NOT under
  `/admin`) so they don't conflict with the layout-level gate.
- Auth.js v5's `pages.signIn` / `verifyRequest` / `error` are configured
  to point to those custom pages.

## Test DB pool

`src/lib/db/index.ts` sets `postgres-js { max: 3 }` so multiple Vitest
worker processes can run in parallel without exhausting Postgres
`max_connections`. If tests hit "sorry, too many clients already" again,
restart the `database` container or lower `max` further.

## Working alongside Docker

- This repo includes a `claude` jail container (compose `jail` profile) where Claude Code runs. The host Docker socket is mounted in, so Claude can run `docker compose` from inside the container (e.g. `docker compose restart app`, `docker compose logs app`). Use `sudo docker …` if `node` user lacks the host's docker GID — see README.
- The `claude` and `app` services share the project bind mount (`/workspace`). File edits from inside `claude` are immediately visible to `app` via the volume.
- Restart `app` after changing `.env.local` — Next.js dev server reads `process.env` at boot and does not hot-reload env vars.
