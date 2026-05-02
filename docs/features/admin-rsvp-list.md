# Admin: confirmed RSVPs list

## Goal

Give `COUPLE` and `CEREMONIAL` a focused report of guests who confirmed attendance — with their plus-ones, observation, and total head count — so they can plan seating, catering, and the printed program. Distinct from the broader `/admin/guests` CRUD page (`guest-list.md`), which is about managing the invitation list itself.

## In scope / out of scope

- **IN**:
  - Dedicated admin page (e.g. `/admin/rsvps`) listing only guests with `rsvpStatus = "confirmed"`.
  - Per-row data: full guest name, list of plus-one names, observation text (truncated with expand), RSVP submission timestamp, source (`admin` vs `submitted`).
  - Top-of-page totals: number of confirmed main guests, number of plus-ones, total head count.
  - Search by name (matches main guest and plus-ones).
  - Filter by source (`admin` / `submitted`) — useful in open mode to distinguish people the couple invited from people who self-registered.
  - Sort: alphabetical by full guest name (default).
  - One-click CSV export of the visible (filtered) rows for sharing with caterer / for place-card generation.
  - Schema additions to `guests` strictly required by the report: `rsvpStatus`, `observation`, `rsvpSubmittedAt`.
- **OUT** of v1, deferred:
  - Inline edit / delete from this page. Editing happens on `/admin/guests` (`guest-list.md`).
  - Declined and pending lists. The `/admin/guests` page already exposes those via its own status filter.
  - Table assignments / seating chart.
  - Group-by-side (bride's side / groom's side).
  - Print-ready layouts (printable HTML, PDF generation).
  - Real-time updates (auto-refresh as new RSVPs come in). Page is server-rendered per request.
  - Email reminders to non-respondents.
  - Pagination — list is rendered in full (a wedding fits in a single page).

## UX flow

1. `COUPLE` or `CEREMONIAL` signs in, opens `/admin/rsvps`.
2. Top of page shows three counters: "Confirmed guests: X", "Plus-ones: Y", "Total: Z". Numbers update as the user changes search / source filters.
3. Below, a search input and source-filter chips.
4. Below that, a table/list with one row per confirmed guest:
   - Full name (`firstName lastName`).
   - Plus-ones listed inline as a small bullet list under the name (or "—" if none).
   - Observation (if present): first ~80 chars with a "show full" expand affordance for longer text.
   - RSVP submitted at (formatted in the active locale).
   - Source badge (`Convidado` / `Auto-registrado` for closed-mode admin entries vs open-mode submissions).
5. A "Export CSV" button at the top right downloads the currently visible rows as a CSV (one row per main guest, plus-ones flattened into a comma-separated cell, observation in its own column).
6. Clicking a row navigates to `/admin/guests/[id]` for edit / delete (read-only on this page; edit on the CRUD page).

## Data model

This feature requires the `guests` table to grow with the columns referenced from `guest-list.md` and the broader RSVP shape that `rsvp.md` will own. The minimum fields this feature reads:

```ts
guests: {
  // ...existing columns from guest-list.md
  rsvpStatus: enum("pending", "confirmed", "declined")  default "pending"
  rsvpSubmittedAt: timestamp (nullable)
  observation: text (nullable, ~500 chars cap)
}
```

`plusOnes` (from `plus-ones.md`) is joined: rows where `plusOnes.guestId = guests.id`.

No new tables are introduced by this feature; it is a read-only view over `guests` + `plusOnes`.

## Permissions

- **`COUPLE` / `CEREMONIAL`** — read access to the page, including the CSV export. Both roles have identical permissions.
- **Public** — no access.

## Decisions

1. **Page location: `/admin/rsvps`** as a separate top-level admin page, distinct from `/admin/guests`. The "who's coming?" report has different totals, columns, and filters than the CRUD. Both pages cross-link.
2. **Confirmed status only.** Declined and pending are handled on `/admin/guests` via that page's status filter.
3. **Search matches both main guest and plus-one names.** "Is João's wife coming?" search finds João's row.
4. **Plus-ones rendered inline** under each main guest. A wedding fits comfortably in vertical layout.
5. **Source filter defaults to "all".** The chip filter is opt-in.
6. **CSV columns**: `firstName`, `lastName`, `plusOneNames` (semicolon-separated), `plusOneCount`, `observation`, `rsvpSubmittedAt`, `source`. UTF-8 with BOM so Excel renders Portuguese characters correctly.
7. **Default sort: alphabetical by full name.** Matches the "find this person" workflow.
8. **Schema ownership: `rsvp.md` owns** the broader RSVP submission schema (the full enum, per-status logic, form mapping). This doc only references the columns it reads.
9. **No pagination.** All confirmed rows render in full; CSV covers the edge case.
10. **No print-ready layout in v1.** CSV export plus browser print-to-PDF cover the offline case.
11. **No realtime auto-refresh in v1.** Manual reload is sufficient for a low-cadence event.

## Implementation notes

- New page at `src/app/(admin)/admin/rsvps/page.tsx`. Server Component:
  - Reads search params (`q`, `source`).
  - Queries `guests` filtered by `rsvpStatus = "confirmed"` and the search params, joined with `plusOnes`.
  - Computes the three totals (confirmed guests, plus-ones, total).
  - Renders the table.
- Search and filter are URL-driven (server-side), so back/forward and shareable URLs work.
- CSV export is a Server Action returning a `Response` with `Content-Type: text/csv; charset=utf-8`. Filename: `rsvps-<isoDate>.csv`. Adds a UTF-8 BOM (`﻿`) at the start so Excel handles Portuguese characters.
- Schema migration adds `rsvpStatus`, `rsvpSubmittedAt`, `observation` to the `guests` table. The existing CRUD in `guest-list.md` does not need to change — the new columns default to `"pending"`, `null`, `null`.
- Cross-link in the admin navigation: `/admin/guests` and `/admin/rsvps` are sibling links. From a row in the RSVP list, click the name → navigates to `/admin/guests/[id]` for edit.
- All Server Actions and the page itself check `auth()` and assert `role in ("COUPLE", "CEREMONIAL")` (the existing `(admin)/admin/layout.tsx` already gates the route group; per-page checks are defense in depth on Server Actions).
- The CSV uses the standard `,` delimiter and quotes fields containing commas, quotes, or newlines. Implementation can use a tiny inline encoder; no library needed.
- CSP impact: none.
- Accessibility: table uses semantic `<table>` markup with `<th scope="col">`. Plus-ones list inside each row is a `<ul>`. The CSV download button has `aria-label="Export confirmed RSVPs as CSV"`.
- Empty state: if no confirmed RSVPs yet, the page shows "Nobody has confirmed yet" with a link to `/admin/guests` to inspect the full list.
