# Admin custom sign-in page

## Goal

Replace the default Auth.js sign-in page (`/api/auth/signin`) with a custom page that matches the wedding site's visual identity (`theme.md`'s `aquarela-sage` preset). Same magic-link flow as today; only the visual shell changes. The functional auth pipeline (Resend provider, allowlist, role assignment, DB session) is already in place per the existing Auth.js setup.

## In scope / out of scope

- **IN**:
  - Custom sign-in page at `/admin/login` rendered as part of the `(admin)` route group but **outside** the existing `/admin/*` auth gate (so unauthenticated users can reach it).
  - Auth.js `pages.signIn = "/admin/login"` config so the framework redirects there instead of `/api/auth/signin`.
  - The page renders: monogram (smaller scale than the public hero), couple names (subtitle line), an email input, a "Receber link de acesso" button.
  - On submit: posts to `/api/auth/signin/resend` (same endpoint Auth.js uses internally) with the CSRF token; renders a "Verifique seu e-mail" success state on success, or an inline error on failure (matching `error` query param semantics from Auth.js).
  - "Verifique seu e-mail" page mirrors Auth.js's `/api/auth/verify-request` route at `/admin/login/verify` (also custom-styled).
  - Error page mirrors Auth.js's `/api/auth/error` at `/admin/login/error` with locale-aware error messages mapped from Auth.js's `error` codes (e.g. `AccessDenied` → "Esse e-mail não tem acesso ao painel").
- **OUT** of v1, deferred:
  - Multiple sign-in methods on the same page (only magic link, no Google / GitHub OAuth).
  - "Remember me" / extended sessions beyond the existing 30-day default.
  - Public-facing email allowlist hint ("we sent you a link if you're on the list"). The page just acknowledges the request without leaking which emails are accepted.
  - Dark-mode variant (the theme is light-only per `theme.md` decision #2).
  - Branded emails (the magic-link email's HTML is a future iteration; v1 uses Auth.js's default Resend template).

## UX flow

1. Anyone visits `/admin/anything` without a session → redirect to `/admin/login?callbackUrl=/admin/anything` (per `pages.signIn` Auth.js config).
2. `/admin/login` renders: monogram, couple names ("Fernanda & Daniel"), short copy ("Acesso restrito"), email input, submit button.
3. User types their email, submits.
4. Server validates (CSRF, then Auth.js's `signIn` callback runs the allowlist), redirects to `/admin/login/verify` on success, or to `/admin/login/error?error=AccessDenied` on rejection.
5. Verify page: "Te enviamos um e-mail com o link de acesso. Confira sua caixa de entrada e o spam." — no other action.
6. User clicks the link in the email → Auth.js verifies the token → session cookie set → redirected to `callbackUrl` (e.g. `/admin`).
7. Error page renders a friendly message matching the Auth.js error code, plus a "Voltar" link to `/admin/login`. The page does **not** reveal whether the email is on the allowlist (the message is generic for `AccessDenied`).

## Data model

None. The page reuses the existing Auth.js + Drizzle schema. The only configuration change is `pages.signIn = "/admin/login"` in `src/lib/auth/index.ts`.

## Permissions

- **Public** — read `/admin/login` and submit the form.
- **Authenticated `COUPLE` / `CEREMONIAL`** — visiting `/admin/login` while logged in redirects them to `/admin` (no point in re-signing-in).

## Decisions

1. **Page lives at `/admin/login`**, outside the auth gate of `/admin/*`. The existing `(admin)/admin/layout.tsx` gate is moved one level deeper so `/admin/login` is exempt.
2. **Reuses Auth.js's POST endpoint** (`/api/auth/signin/resend`); only the GET render is custom.
3. **Verify page at `/admin/login/verify`**, error page at `/admin/login/error`. Both mapped from Auth.js's `pages.verifyRequest` and `pages.error` config.
4. **Monogram is smaller than the hero's** (~80% scale); same SVG asset.
5. **Single email input, no other fields**. No "remember me" toggle; default 30-day sessions.
6. **Generic error copy for `AccessDenied`** ("Esse e-mail não tem acesso ao painel.") to avoid leaking the allowlist contents.
7. **Already-authenticated users hitting `/admin/login` redirect to `/admin`.**
8. **Bilingual via `next-intl`** like every other public page; the route is at `/{pt,en}/admin/login` if the i18n setup applies, otherwise plain `/admin/login` (the admin route group might opt out of locale prefixing — see open below). For v1, prefix is **off** for the entire `/admin` tree to keep URLs short; the page itself reads the user's preferred locale from a cookie if set, otherwise defaults to PT.
9. **Magic-link email's body uses Auth.js's default Resend template in v1.** Branded HTML email is a future iteration.
10. **Subject of the magic-link email** is overridden to "Acesso ao painel · {couple names}" via the Auth.js Resend provider's custom `sendVerificationRequest` later (deferred).

## Implementation notes

- New pages:
  - `src/app/(admin)/login/page.tsx` — sign-in form.
  - `src/app/(admin)/login/verify/page.tsx` — "verifique seu email" message.
  - `src/app/(admin)/login/error/page.tsx` — error message with mapped copy.
- Move the existing auth gate from `src/app/(admin)/admin/layout.tsx` to a deeper layout that doesn't include `login`. Concretely: split the `(admin)` route group into `(admin)/admin/*` (gated) and `(admin)/login/*` (ungated). The login routes still inherit the `(admin)` group's chrome (theme tokens, etc.) but skip the auth check.
- Update `src/lib/auth/index.ts`:
  - `pages.signIn = "/admin/login"`
  - `pages.verifyRequest = "/admin/login/verify"`
  - `pages.error = "/admin/login/error"`
- Already-authenticated redirect: the `/admin/login` page Server Component calls `auth()`; if a session exists, `redirect("/admin")`.
- Form: a real `<form action="/api/auth/signin/resend" method="POST">` with the CSRF token from `/api/auth/csrf`. No client JS required (progressive enhancement). A small Client island can be added later for inline validation but is not necessary for v1.
- Error code mapping: a small server-side map in `src/app/(admin)/login/error/error-messages.ts` from Auth.js error codes to localized strings.
- Visual: matches the reference's romantic tone — paper-textured cream background, monogram at the top, couple names in script, a thin sage frame around the email input, a sage button. Theme tokens from `theme.md`.
- CSP impact: none — all assets are `'self'`.
- Accessibility: explicit `<label>` for the email input; submit button has a clear text label; error messages announced via `aria-live="assertive"` after a failed submit; verify page sets focus on the heading.
- Test plan: smoke-test that visiting `/admin/anything` while logged out redirects to `/admin/login` (not the default `/api/auth/signin`); submit with an allowed email lands on `/admin/login/verify`; submit with a rejected email lands on `/admin/login/error?error=AccessDenied`; clicking the magic link from the email completes the sign-in and arrives at `callbackUrl`.
