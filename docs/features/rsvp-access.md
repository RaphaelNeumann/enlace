# RSVP form access protection

## Goal

Prevent random visitors from reaching the public RSVP form. Only people who received the printed invitation — which carries a secret token embedded in the URL — can access the form. The rest of the public site (story, ceremony info, gallery, etc.) remains open to anyone.

## In scope / out of scope

- **IN**:
  - A single shared access token configured by the forker via the `RSVP_ACCESS_TOKEN` environment variable. The token is the same for every printed invite.
  - Token-aware route for the public RSVP form: `/rsvp/<token>`.
  - Visitors hitting `/rsvp` (no token) or a wrong token get a 404 — no hint that the page exists.
  - Opt-in protection: forks that don't care leave `RSVP_ACCESS_TOKEN` unset and `/rsvp` becomes a normal public route.
  - Logged-in admin bypass — `COUPLE` / `CEREMONIAL` can preview the form at `/rsvp` without the token.
- **OUT** of v1, deferred:
  - Per-guest tokens / unique invite URLs (already declined in `guest-list.md`).
  - Token rotation at runtime. Rotating requires changing the env var and redeploying, and would invalidate every printed invite already mailed.
  - Cookie-based remembering after first valid hit. Token stays in the URL on every visit.
  - Captcha / email confirmation as additional layers.
  - Extending the same protection to other public pages (gallery, story, etc.).

## UX flow

1. Forker generates a secret token (recommended: `openssl rand -hex 16`) and sets `RSVP_ACCESS_TOKEN` in `.env.local` (locally) or in the Vercel dashboard (production). Forks that don't want this protection just leave the env var unset.
2. Forker prints `https://your-wedding-domain.com/rsvp/<token>` on the physical invite (or encodes it in a QR code).
3. Invitee opens the URL → RSVP form renders. They fill it in (full-name match against the guests list per `guest-list.md`), optionally write an observation, submit. Confirmation screen acknowledges receipt.
4. Anyone hitting `/rsvp` without a token, or with a wrong token, gets a 404. There is no "you need an invite" landing page — failure is indistinguishable from a missing page.
5. A logged-in `COUPLE` or `CEREMONIAL` visiting `/rsvp` directly (no token) sees the form for preview/testing purposes.

## Data model

None. The token is a static environment variable; no DB tables or columns added.

## Permissions

- **Public visitor** — must hit `/rsvp/<token>` with the correct token. Anything else: 404.
- **`COUPLE` / `CEREMONIAL`** (logged in) — can access `/rsvp` directly without the token, for preview.

## Decisions

1. **Token lives in the `RSVP_ACCESS_TOKEN` env var.** Keeps the secret out of git history and out of the repo, so a public fork doesn't leak it.
2. **Path-based URL.** `/rsvp/<token>` (cleaner on a printed invite, easier to QR-encode).
3. **404 on missing or wrong token.** No leakage that the route exists.
4. **Public when the env var is unset.** Protection is opt-in; forks that don't care don't have to do anything.
5. **Admin bypass.** Logged-in `COUPLE` / `CEREMONIAL` see the form at bare `/rsvp` without a token, for preview.
6. **No enforced format.** Forker chooses the token length and characters. Recommended: 16 hex chars from `openssl rand -hex 16` (~64 bits of entropy). The check on the page only verifies non-empty + constant-time equality.
7. **Only the RSVP form is gated.** Other public pages (story, gallery, ceremony info, etc.) stay open.

## Implementation notes

- Read `process.env.RSVP_ACCESS_TOKEN` once at module load, into a constant. Empty string is treated as unset.
- New dynamic segment: `src/app/(public)/rsvp/[token]/page.tsx`. Compare `params.token` against the env value with `crypto.timingSafeEqual` on equal-length buffers (so timing attacks can't leak character-by-character information). On mismatch — or if the buffers have unequal length — `notFound()` from `next/navigation`. If the env var is unset, this dynamic route always `notFound()`s (use the bare `/rsvp` instead).
- Bare `/rsvp` route at `src/app/(public)/rsvp/page.tsx`:
  - If `RSVP_ACCESS_TOKEN` is unset: render the form (gating opt-out).
  - If set and the visitor is anonymous: `notFound()`.
  - If set and the visitor is `COUPLE` / `CEREMONIAL`: render the form in preview mode (a small banner indicates "preview").
- Add `RSVP_ACCESS_TOKEN` to `.env.example`, commented, with a one-line generation hint (`# openssl rand -hex 16`).
- README "Admin login" section grows a sibling "RSVP access protection" subsection explaining: when to use it, how to generate the token, where to set it (`.env.local` for dev, Vercel for prod), what URL to print on the invite, what happens when the env var is left unset.
- The per-IP rate limit defined in `guest-list.md` still applies on top — defense in depth in case the token leaks (someone screenshots an invite, posts to social media, etc.).
- CSP impact: none.
- No new DB columns. Whether a guest's submission was gated by the token does not need to be tracked — every successful submission is by definition someone who had the URL.
