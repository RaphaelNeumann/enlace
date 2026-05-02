# RSVP plus-ones

## Goal

Let an invitee filling the RSVP form add additional companions ("acompanhantes") up to a per-invitee limit configured in `guest-list.md`. Each companion requires a name. The form enforces the limit both visually (the "Add" affordance disappears at the cap) and on submit (Server Action revalidates against the source of truth).

## In scope / out of scope

- **IN**:
  - "Add plus-one" UI on the public RSVP form. Each plus-one is a row with a single name field.
  - Limit enforcement: in closed mode, read from the matched guest's `plusOnesAllowed`; in open mode, read from a global cap in `wedding.config.ts`.
  - Client-side affordance: the "Add" button disables (or is hidden) once the limit is reached; each plus-one row has a "remove" control.
  - Server-side enforcement: the Server Action revalidates the number of plus-one entries against the source of truth before persisting; rejects the submission if exceeded.
  - Plus-one name is required (non-empty after trim). Empty rows are rejected at submit.
  - Invitee can bring **fewer** than the allowed maximum (including zero).
- **OUT** of v1, deferred:
  - Per-plus-one dietary, observation, contact fields. The single observation field on the RSVP submission belongs to the main guest (per `guest-list.md`); plus-ones don't have their own.
  - Pre-defined plus-one names by the couple (already declined in `guest-list.md`).
  - Adult vs child / age category for plus-ones.
  - The plus-one editing the form themselves; only the main invitee submits.
  - Identifying a plus-one as another guest from the closed list (the closed-list typeahead is for the main invitee, not their companions).

## UX flow

1. Invitee enters their name (typeahead in closed mode, free text in open mode) and confirms attendance.
2. The form reads the allowed plus-one count for that invitee:
   - Closed mode: from the matched guest's `plusOnesAllowed`.
   - Open mode: from `wedding.config.ts → rsvp.openModeMaxPlusOnes`.
   - If the count is `0`, the plus-one section is omitted entirely.
3. If the count is `> 0`, a section reads "You can bring up to N additional people" with an "Add plus-one" button.
4. Clicking "Add plus-one" appends a new row containing a single name input. Each row has a "remove" control.
5. After N plus-ones have been added, the "Add" button becomes disabled (or hidden) — visual feedback that the limit is reached.
6. On submit, the form sends `{ guestName, plusOneNames: string[], observation?: string }`. The Server Action revalidates `plusOneNames.length` against the source-of-truth limit (closed mode: re-read the guest row by id; open mode: re-read the config). Rejects with a user-facing error if exceeded.

## Data model

A separate `plusOnes` (or `plus_ones`) table — exact schema lives in `rsvp.md`, but the shape is essentially:

```ts
plusOnes: {
  id: uuid (primary key)
  guestId: uuid (foreign key → guests.id, on delete cascade)
  name: text (non-empty)
  position: integer (display order)
  createdAt: timestamp
}
```

A separate table (rather than a JSONB column on the RSVP submission) lets the admin list individual companions, count totals, and report on names directly.

## Permissions

- **Public visitor** — adds and removes plus-ones at submission time, up to the configured limit.
- **`COUPLE` / `CEREMONIAL`** — see plus-ones inline with each guest in the admin. Can edit or remove plus-ones via the admin guest CRUD (per `guest-list.md`).

## Open decisions

1. **Open-mode global cap location and default.** `wedding.config.ts → rsvp.openModeMaxPlusOnes`, default `0`? **Recommendation: yes**, default `0` (open mode is restrictive by default; forker opts in).
2. **UI pattern.** Rows that are added/removed (each plus-one is a row), vs a counter (+/-) that pre-renders that many name fields? **Recommendation: rows.** Names are required and ordered; rows feel more natural and let the user remove a specific one without renumbering.
3. **Plus-one name format.** Single full-name input vs first + last? **Recommendation: single field.** Plus-ones are not searched against the typeahead, so separate fields don't pay off; one text input is friendlier on mobile.
4. **Storage shape.** Separate `plusOnes` table vs JSONB column on the RSVP submission? **Recommendation: separate table.** Better admin queryability (count plus-ones, list by name, etc.) and matches typical wedding-admin reporting.
5. **Doc placement.** Own feature doc, or merge into `rsvp.md`? **Recommendation: own doc.** Plus-one mechanics have enough UX and validation surface to deserve focused treatment; `rsvp.md` will reference this doc.
6. **Per-plus-one observation field?** **Recommendation: no.** One observation per submission, shared across the whole party, as decided in `guest-list.md`.

## Implementation notes

- Closed mode source-of-truth for the limit is `guests.plusOnesAllowed`. The Server Action re-fetches the guest row by id (not by name) when revalidating, in case the admin reduced the count between the page load and the submission.
- Open mode source-of-truth is `wedding.config.ts → rsvp.openModeMaxPlusOnes`. Validated at module load via Zod (non-negative integer).
- The form is a Server Component for the static parts (instructions, guest typeahead) plus a Client Component island for the dynamic plus-one rows (`useState` for the array of rows).
- Server Action signature: `submitRsvp({ guestName, plusOneNames, observation })`. Zod validates: `plusOneNames` is an array of non-empty strings, length within bounds, names trimmed and capped (~80 chars each).
- DB write is transactional: insert/update the `guests` row + insert the plus-one rows in a single Drizzle transaction. If any insert fails, the whole submission rolls back — no partial state.
- Admin guest detail page (in `rsvp.md` / admin RSVP list scope) shows the plus-ones inline below each guest, with edit/remove affordances on each.
- CSP impact: none.
- Accessibility: the "Add" button announces "Plus-one N of M added" via an aria-live region; "Remove" buttons have an accessible label that includes the plus-one's current name (for screen readers).
