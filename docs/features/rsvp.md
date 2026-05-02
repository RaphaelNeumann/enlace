# RSVP form

## Goal

Define the public RSVP form — its fields, validation, submission flow, success / error states, and the schema additions on `guests` that previous docs (`admin-rsvp-list.md`, `admin-rsvp-actions.md`, `admin-observations.md`) have been deferring to this doc. This is the doc that ties together `guest-list.md` (list strategy), `plus-ones.md` (companion mechanics), and `rsvp-access.md` (URL gating) into a single user-facing flow.

## In scope / out of scope

- **IN**:
  - Single public form mounted at `/rsvp/<token>` (with `<token>` matching `RSVP_ACCESS_TOKEN` per `rsvp-access.md`) and at `/rsvp` when the env var is unset (`rsvp-access.md` decision #4) or for logged-in admin preview.
  - Fields on the form, in this order: full-name input (typeahead in closed mode, free text in open mode); attendance radio (Sim / Não); plus-one rows (only when attendance is Sim and the matched guest's `plusOnesAllowed > 0`); single observation textarea (~500 chars, optional); submit button.
  - Server Action `submitRsvp` validates, applies the matrix below in a transaction, and renders the appropriate success state.
  - Schema additions on the `guests` table (single source of truth for RSVP shape): `rsvpStatus`, `rsvpSubmittedAt`, `observation`. The `plusOnes` child table comes from `plus-ones.md`.
  - Single-shot per name: a second submission for the same `(firstName, lastName)` is refused with a friendly "you've already RSVP'd" page.
  - Per-IP rate limit (shared util across all public Server Actions).
  - i18n catalog entries for every label, validation message, and success / error string.
- **OUT** of v1, deferred:
  - Public-side editing after submit (locked to admin per `guest-list.md` decision #6 and `admin-rsvp-actions.md`).
  - Magic-link or email confirmation per RSVP submission.
  - Multi-step / wizard form. v1 is single-page.
  - File uploads (allergy notes as photos, etc.).
  - Per-plus-one observation or dietary fields (`plus-ones.md` decision #6).
  - Calendar invite (`.ics`) on the success screen — nice to have, defer.
  - WhatsApp share button on the success screen.

## UX flow

### Closed mode

1. Invitee opens `/rsvp/<token>`. The route matches the token (`rsvp-access.md`) and renders the form.
2. **Name field**: typeahead picker. Invitee types ≥ 2 characters; a Server Action returns up to 10 matches from `guests` (case-insensitive prefix on `firstName lastName`). If none match: "Não encontramos esse nome. Confira a grafia ou fale com os noivos." No "create new" affordance.
3. Invitee picks their match. The form expands: attendance radio, observation textarea, and (if `plusOnesAllowed > 0`) the plus-one rows section per `plus-ones.md`.
4. Selecting **Sim** reveals the plus-one rows. Selecting **Não** hides them (and validation skips plus-one fields).
5. Invitee submits. Server Action runs; on success the form is replaced with a success card ("Recebemos sua resposta. Obrigada!") that includes the wedding date and address from `siteSettings`.
6. If the matched guest has already submitted (`rsvpStatus != "pending"` and `rsvpSubmittedAt IS NOT NULL`), the form short-circuits before submission with: "Já registramos sua resposta como [Confirmada / Recusada]. Para alterar, fale com os noivos."

### Open mode

Same flow, except the name field is two free-text inputs (first + last) without typeahead. On submit, a new `guests` row is created with `source = "submitted"` and the chosen status.

### Validation messages (i18n keys, PT defaults)

- Empty name: "Informe seu nome completo."
- Closed-mode no match: "Não encontramos esse nome…" (above).
- Empty attendance: "Confirme se você poderá comparecer."
- Plus-one count out of range: "Você pode incluir no máximo {N} acompanhante(s)."
- Empty plus-one name: "Informe o nome de cada acompanhante."
- Observation too long: "Observação tem no máximo 500 caracteres."
- Submission rejected by allowlist or rate limit: "Não foi possível registrar sua resposta. Tente novamente em alguns minutos."
- Already submitted (closed mode): handled at step 6 above (short-circuit) rather than as a validation message.

### Success / error states

- Success: full-page confirmation card with a script-font headline ("Recebemos sua resposta!"), the wedding date, address, and a link back to the home (`/`).
- Server error: in-form error banner, form preserved so the invitee can retry without retyping.
- Token mismatch: handled by `rsvp-access.md` (404).
- Rate-limit hit: in-form error banner with a generic "tente novamente em alguns minutos" message; no specific count-down (anti-enumeration).

## Data model

Schema additions on the existing `guests` table:

```ts
guests: {
  // ...firstName, lastName, plusOnesAllowed, source from guest-list.md
  rsvpStatus: enum("pending", "confirmed", "declined") DEFAULT "pending"
  rsvpSubmittedAt: timestamp (nullable)
  observation: text (nullable, ~500 chars cap)
}
```

The `plusOnes` child table (per `plus-ones.md`) holds individual companion rows. The submission is a transactional update of `guests` + insertion of `plusOnes` rows.

State machine (the matrix is also defined in `admin-rsvp-actions.md`; this doc owns the *public submission* transitions):

| Trigger | `rsvpStatus` | `rsvpSubmittedAt` | Plus-ones |
| --- | --- | --- | --- |
| Public submit Sim | `confirmed` | `now()` | inserted |
| Public submit Não | `declined` | `now()` | none inserted |
| Repeated submit (same name, already non-pending) | unchanged | unchanged | unchanged (refused) |

## Permissions

- **Public visitor with valid token (or unset env)** — submits the form.
- **`COUPLE` / `CEREMONIAL`** — view the form in preview mode at `/rsvp` (no token needed). Submitting from preview mode is disabled (button shows "Modo prévia").
- **Public visitor without token** — 404 (`rsvp-access.md`).

## Decisions

1. **Single-page form, not multi-step.** Wedding RSVP fits on one screen at this scope; a wizard adds friction.
2. **Attendance is a radio group (Sim / Não), not a yes-only confirmation.** Captures declines for planning and matches the state machine.
3. **No public edit after submit.** Covered by `guest-list.md` decision #6.
4. **Typeahead returns ≤ 10 matches, prefix-match on full name.** Privacy + perf.
5. **Closed-mode "name not in list" never offers a "create new" affordance.** The whole point of the closed mode is that the list is curated.
6. **Plus-ones in v1 use the `plus-ones.md` design**: rows added/removed on the form, names required, count enforced server-side against the matched guest's `plusOnesAllowed`.
7. **Observation is one optional textarea, ~500 chars, plain text with `\n` preserved.** No markdown, no per-plus-one variant.
8. **Already-submitted short-circuit shows the current status** ("Confirmada" / "Recusada") plus a "fale com os noivos" instruction. No silent refusal.
9. **Preview mode for admin** at `/rsvp` (when env unset) or for logged-in admin at any `/rsvp` route. Submit button disabled and labelled "Modo prévia"; no DB writes.
10. **Per-IP rate limit** is the only anti-spam in v1 (matches `guest-list.md` decision #5).
11. **Schema lives here**: this doc owns `rsvpStatus`, `rsvpSubmittedAt`, `observation` columns. Other docs (`admin-rsvp-list.md`, `admin-rsvp-actions.md`, `admin-observations.md`) reference but don't define them.

## Implementation notes

- New page at `src/app/(public)/[locale]/rsvp/[token]/page.tsx` (matches `rsvp-access.md`) and `src/app/(public)/[locale]/rsvp/page.tsx` (no-token / preview).
- Form is a Server Component for static framing; a single Client Component island wraps the interactive parts (typeahead, attendance toggle, plus-one rows, observation textarea, submit progress).
- Server Actions in `src/app/(public)/[locale]/rsvp/actions.ts`:
  - `searchGuests(prefix: string)` — returns up to 10 `(firstName, lastName, plusOnesAllowed, rsvpStatus)` rows; called by typeahead.
  - `submitRsvp(input)` — validates with Zod, runs rate-limit check, executes the state-machine transition in a Drizzle transaction, returns `{ ok, error? }`.
- Zod schema:
  ```ts
  z.object({
    guestId: z.string().uuid().optional(),     // closed mode: from typeahead pick
    firstName: z.string().trim().min(1).max(80),
    lastName: z.string().trim().min(1).max(80),
    attending: z.enum(["yes", "no"]),
    plusOneNames: z.array(z.string().trim().min(1).max(80)).max(N),
    observation: z.string().trim().max(500).optional(),
  })
  ```
  `N` is computed from the matched guest's `plusOnesAllowed` (closed mode) or `wedding.config.ts → rsvp.openModeMaxPlusOnes` (open mode); the Zod schema is constructed per-request inside the Server Action.
- Rate limit: a small util at `src/lib/rate-limit.ts` (in-memory bucket keyed by IP for v1, swappable for `@upstash/ratelimit` later). All public Server Actions call it. 5 submissions per IP per hour as a starting limit.
- Already-submitted detection: the Server Action re-fetches the matched guest by id at the start of the transaction; if `rsvpStatus !== "pending"` and `rsvpSubmittedAt IS NOT NULL`, returns `{ ok: false, error: "alreadySubmitted", status: existing.rsvpStatus }` so the page can render the appropriate short-circuit message.
- Success page rendering: same route returns the success card via a server `searchParams.success === "1"` flag set by the Server Action via `redirect`.
- Preview mode detection: read `auth()`; if a `COUPLE`/`CEREMONIAL` session exists, the form renders with `previewMode = true`. The Client island disables the submit button and shows a "Modo prévia" badge.
- i18n catalog entries under `src/i18n/{pt,en}.json` keys `rsvp.*`. Form labels, validation messages, success copy, preview badge.
- Accessibility: every input has an explicit `<label>`; radio group has `role="radiogroup"` with `aria-labelledby`; typeahead announces match count via `aria-live`; success card sets focus on the heading on mount.
- CSP impact: none.
- Visual: matches the reference site — script-font section title ("Confirme sua presença"), serif body, sage button on cream card, watercolor of rings or champagne next to the title. Theme tokens come from `theme.md`'s `aquarela-sage`.
