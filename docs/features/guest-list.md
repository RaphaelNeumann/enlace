# Guest list mode

## Goal

Let the site owner choose between two strategies for collecting RSVPs:

1. **Closed list** — the couple manages a curated list of invitees through the admin UI (name + max number of additional guests). The public RSVP form only accepts names that match the list.
2. **Open list** — anyone with the URL submits their name and confirms attendance. No pre-defined list.

This is a structural choice that constrains how the RSVP form, admin management, and data model behave. The full RSVP submission shape (status, plus-one names, observation) is handled here for the parts directly tied to list strategy; broader concerns are referenced to a future `rsvp.md`.

## In scope / out of scope

- **IN**:
  - Single mode flag in `wedding.config.ts` (`rsvp.mode: "closed" | "open"`), locked at first deploy.
  - **Admin CRUD on guests** for `COUPLE` and `CEREMONIAL`: list, create, edit, delete. Each guest stores `firstName`, `lastName`, `plusOnesAllowed`.
  - Public RSVP form — full-name typeahead (closed mode only) or free-text name input (open mode).
  - Single optional **observation** free-text field on each RSVP submission, fillable by the guest.
  - Plus-one count enforced at form submit time (closed mode reads from the guest's `plusOnesAllowed`; open mode uses a global cap from config or zero).
  - Per-IP rate limit on the public RSVP submission endpoint.
- **OUT** of v1, deferred:
  - Public-side edit of an RSVP after submit (only `COUPLE` / `CEREMONIAL` can edit afterwards from the admin).
  - Mode switching after first deploy.
  - CSV import / export of the guest list (admin manages one at a time in v1).
  - Per-guest invite URLs / tokens / emails as an alternative identification mechanism.
  - Pre-defined plus-one *names* (only the *count* is configured by the couple; names are filled by the invitee at RSVP time).
  - Dietary restrictions, table assignment, message-to-couple, contact info — handled by `rsvp.md`.
  - Captcha and email confirmation. Rate limit is the only anti-abuse layer in v1.

## UX flow

### Closed mode

1. Forker sets `rsvp.mode = "closed"` in `wedding.config.ts` before first deploy.
2. After deploy, `COUPLE` or `CEREMONIAL` signs in to `/admin` and uses the Guests CRUD page to add invitees one by one (`firstName`, `lastName`, `plusOnesAllowed`). Same page lets them edit or remove entries later.
3. Public RSVP form: invitee starts typing their name; a typeahead suggests matching guests by full name. They pick their entry, see how many plus-ones they can bring, fill plus-one names, optionally write a single observation, submit.
4. Confirmation screen acknowledges receipt. The submission cannot be edited from the public form afterwards — the invitee must contact the couple, who edits via admin.
5. If the invitee returns and tries to submit again with the same name, the form refuses ("you have already RSVP'd; please contact us if you need to change anything") rather than overwriting silently.

### Open mode

1. Forker sets `rsvp.mode = "open"` before first deploy.
2. Public RSVP form: anyone enters first + last name (free text), confirms attendance, optionally adds plus-one names (up to a global cap), optionally writes an observation, submits. A new `guests` row is created on submit.
3. Same single-shot rule: a second submission under the same full name is refused.
4. Admin sees all submissions in the same Guests page (open and closed mode share the page). `COUPLE` / `CEREMONIAL` can edit or remove any entry.
5. A simple per-IP rate limit prevents trivial spam.

## Data model

This doc fixes the guest-entity shape and the observation field. Other RSVP submission columns (status, plus-one names, etc.) are detailed in `rsvp.md`.

```ts
guests: {
  id: uuid (primary key)
  firstName: text
  lastName: text
  plusOnesAllowed: integer            // 0 if no plus-ones
  source: enum("admin", "submitted")  // closed-mode admin entries vs open-mode public submissions
  createdAt: timestamp
  // ...RSVP submission columns added in rsvp.md, including:
  // observation: text (nullable) — single optional free-text note from the guest
}
```

In closed mode, `guests` rows are created exclusively through the admin (`source: "admin"`); public RSVP submissions only update the corresponding row's RSVP status fields. In open mode, `guests` rows are created from public submissions (`source: "submitted"`).

## Permissions

- **Forker** — picks the mode in `wedding.config.ts` at compile time.
- **Public visitor** — submits the public RSVP form once. In closed mode, must match a name on the list. In open mode, can self-register. No edit after submit.
- **`COUPLE` and `CEREMONIAL`** — full CRUD on guests via the admin UI: list, create, edit, delete. Both roles have identical permissions over the guest list in v1.

## Decisions

1. **Separate doc.** `guest-list.md` is its own concern; the broader RSVP submission schema lives in `rsvp.md`.
2. **Admin CRUD owns the list.** No TS-file seed and no `wedding.config.ts` array. `COUPLE` and `CEREMONIAL` add/edit/remove guests through the admin UI. CSV import deferred.
3. **Identification by full name (typeahead).** No per-guest URLs, tokens, or email matching. First + last name disambiguates collisions adequately for a wedding.
4. **Plus-one count only.** Names are filled by the invitee at RSVP time, not pre-defined.
5. **Per-IP rate limit.** No captcha, no email confirmation in v1.
6. **No public-side edit.** Submitting once is final from the guest's side; only `COUPLE` / `CEREMONIAL` can change a submission via admin.
7. **Mode is locked at first deploy.** Switching modes is unsupported and would require a manual data migration. Documented as a constraint.
8. **One free-text observation field** per RSVP submission. No dietary, no table, no message-to-couple in v1.

## Implementation notes

- Mode flag lives in `src/config/wedding.config.ts → rsvp.mode`. Validate with Zod at module load. Refuse to boot if the value changes between deploys (compare against a record in the DB).
- New table `guests` in `src/lib/db/schema.ts`. The `source` enum (`"admin" | "submitted"`) feeds an admin filter to distinguish "people we invited" from "people who self-registered" in open mode.
- Admin pages (server components + Server Actions) under `src/app/(admin)/admin/guests/`:
  - `page.tsx` — list with filter by source / RSVP status, search by name.
  - `new/page.tsx` — create form (closed mode only; open mode admin can still add manually if needed).
  - `[id]/page.tsx` — edit / delete.
  - Each Server Action calls `auth()`, asserts `role in ("COUPLE", "CEREMONIAL")`, validates input via Zod, mutates via Drizzle, calls `revalidatePath`.
- Public RSVP submission Server Action at `src/app/(public)/rsvp/actions.ts`:
  - Validates input via Zod (full name, plus-one names array bounded by allowed count, optional observation up to N chars).
  - In closed mode: matches `(firstName, lastName)` (case-insensitive, trimmed) against `guests`; rejects if no match.
  - In open mode: creates a new `guests` row.
  - Per-IP rate limit (Upstash or in-memory bucket for v1) before any DB write.
  - If a submission already exists for that name, returns "already submitted" without modifying state.
- Closed-mode typeahead Server Action returns up to 10 matches for a prefix, never the full list (privacy + perf).
- Public form has no auth; admin pages are gated by the existing `(admin)/admin/layout.tsx`.
- Observation field rendered as a `<textarea>` with a max length (~500 chars) enforced in Zod. No HTML / markdown — render as plain text (or paragraph-broken on `\n`).
- CSP impact: none.
- README "Roadmap → Open questions" loses the "plus-ones / dietary" item once `rsvp.md` ships; for now the open question narrows to dietary only.
