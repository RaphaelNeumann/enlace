# Admin: guest observations list

## Goal

Give `COUPLE` and `CEREMONIAL` a focused page to read every free-text observation guests left when filling the RSVP form. Useful for catching dietary restrictions, late-arrival notices, allergies, plus-one logistics, and any other note a guest tucked into the single observation field defined in `guest-list.md`.

Distinct from `/admin/rsvps` (which lists confirmed guests with observation as one column among many) and from `/admin/messages` (gift-modal messages from `gifts.md`, which are not tied to RSVP).

## In scope / out of scope

- **IN**:
  - New admin page (e.g. `/admin/observations`) listing every guest whose `observation` field is non-empty.
  - Per row: guest full name, the observation text in full (no truncation), `rsvpStatus` badge (`Pendente` / `Confirmado` / `Recusado`), `rsvpSubmittedAt` formatted in the active locale.
  - Default sort: most recent submission first (`rsvpSubmittedAt DESC`).
  - Search input matching against guest name and observation content (case-insensitive substring).
  - **PDF export** of the currently visible (filtered) observations, via a print-friendly route that the user prints to PDF through the browser's native print dialog.
  - Click a row → navigate to `/admin/guests/[id]` (where the observation can be edited or cleared if needed via the existing CRUD).
  - Read-only on this page; no inline editing or deletion.
  - Both `COUPLE` and `CEREMONIAL` can read and export; identical permissions.
- **OUT** of v1, deferred:
  - Inline editing or deletion of observations from this page. Admin uses the existing edit page in `guest-list.md` for that.
  - CSV export.
  - Filtering by `rsvpStatus` (the `rsvpStatus` badge is informational; if filtering is needed later, the page already has search).
  - Bulk actions (mark as read, archive, etc.).
  - "Read / unread" tracking — every visit shows the full list; there is no per-admin read state.
  - Sorting by guest name as default (recency wins; sorting toggle deferred).
  - Pagination.
  - Email notification to the couple when a new observation arrives.
  - Server-rendered PDF generation via a library (e.g. `@react-pdf/renderer` or `puppeteer`). The browser's print-to-PDF satisfies the requirement at zero dependency cost.

## UX flow

1. `COUPLE` or `CEREMONIAL` opens `/admin/observations`.
2. Top of page: a search input and a "Gerar PDF" button.
3. Below: a list of cards or rows, one per guest with a non-empty observation, sorted by `rsvpSubmittedAt` desc. Each entry shows:
   - Guest full name (clickable, navigates to `/admin/guests/[id]`).
   - Status badge (`Pendente` / `Confirmado` / `Recusado`).
   - Submission timestamp ("há 2 dias" / "ontem" / absolute date for older entries; toggleable via tooltip showing the absolute timestamp on hover).
   - Observation text in full, plain text, with `\n` rendered as line breaks. Long observations wrap rather than truncate (the page is meant for reading them, not scanning).
4. Empty state: "Nenhuma observação ainda." with a link to `/admin/guests`.
5. "Gerar PDF" flow: clicking the button opens a new tab on `/admin/observations/print` which renders a print-friendly version (no chrome, paper-friendly typography, header with couple names + export date) preserving the current filter (search query carried via URL). The page auto-triggers `window.print()` on load. The user picks "Save as PDF" in the browser's print dialog and gets the file. Closing the tab returns to the regular admin view.

## Data model

Reads existing columns only; no new tables or columns introduced.

- `guests.observation` (text, nullable) — already defined by `guest-list.md` and used by `admin-rsvp-list.md`.
- `guests.rsvpStatus`, `guests.rsvpSubmittedAt`, `guests.firstName`, `guests.lastName` — already in scope of prior features.

Filter: `WHERE observation IS NOT NULL AND length(trim(observation)) > 0`.

## Permissions

- **`COUPLE` / `CEREMONIAL`** — read-only access to the page; identical permissions.
- **Public** — no access (covered by the admin layout's auth gate).

## Open decisions

1. **Page location.** `/admin/observations` as a new top-level admin page, or a tab inside `/admin/rsvps` or `/admin/guests`? **Recommendation: `/admin/observations`** as a separate top-level page. Different scope (any status, not just confirmed), different sort default (recency, not alphabetical), different mental model ("read what guests said" vs "plan seating").
2. **Scope: observations on which guests?** Only confirmed, or any guest regardless of `rsvpStatus`? **Recommendation: any guest with a non-empty observation.** A declined guest may have left a relevant note ("conflict with another wedding, sorry"), and the cerimonial wants to see it too.
3. **Default sort.** Most recent submission first vs alphabetical by guest name? **Recommendation: most recent first.** Matches the "what's new since I last checked" workflow.
4. **Search scope.** Guest name only, or also full-text on observation content? **Recommendation: both.** Cerimonial often searches a keyword like "alergia" across all observations.
5. **Truncation.** Truncate long observations with "show full", or render in full? **Recommendation: render in full.** The page exists to read them; truncating defeats the purpose. Wedding observations are typically short anyway.
6. **Inline edit / delete on this page.** Add edit/delete affordances next to each row, or read-only with a click-through to the CRUD? **Recommendation: read-only, click-through.** Avoids two ways to edit the same field; keeps this page focused on reading.
7. **CSV export.** Include? **Recommendation: out for v1.** PDF export covers the offline-share use case; CSV is structured-data territory and there's no clear consumer for it.
12. **PDF generation approach.** Server-rendered via `@react-pdf/renderer` (one-click direct download, ~600 kB dependency) vs dedicated print route + browser print-to-PDF (zero dependency, two clicks)? **Recommendation: print route + browser print-to-PDF.** Aligns with the project's minimal-deps stance, leverages the user's browser, gives the user control over margins and scale before saving. The "Gerar PDF" button opens `/admin/observations/print` and auto-triggers `window.print()`.
13. **PDF scope: all observations vs the currently filtered set?** **Recommendation: filtered set** (mirrors the visible page). The print route reads the same `q` query param the main page uses, so a search like "alergia" produces a PDF of just those rows.
14. **PDF layout.** **Recommendation:** simple paginated single-column document with a header (couple names from `wedding.config.ts` + "Observações" + export date), each entry as `<guest name> — <status> — <timestamp>` followed by the observation text below. CSS `@media print` styles handle page breaks (`break-inside: avoid` per entry) and margins.
8. **Filter by `rsvpStatus`.** Add a chip filter? **Recommendation: out for v1.** The status badge per row carries the information; a filter toggle is unnecessary at wedding scale (a few dozen observations max).
9. **Read / unread tracking.** Should each admin user see which observations are new since their last visit? **Recommendation: out for v1.** Adds a per-user state table for marginal value. The recency sort surfaces new entries naturally.
10. **Pagination.** Render all rows or paginate? **Recommendation: render all** — consistent with `admin-rsvp-list.md`. A wedding's observation set is small.
11. **Empty-string vs `NULL` handling.** Treat empty-after-trim as "no observation"? **Recommendation: yes** — the filter is `IS NOT NULL AND length(trim(observation)) > 0`. Avoids surfacing whitespace-only entries.

## Implementation notes

- New page at `src/app/(admin)/admin/observations/page.tsx`. Server Component:
  - Reads search param `q`.
  - Queries `guests` filtered by `observation IS NOT NULL AND length(trim(observation)) > 0`, optionally filtered by the search term across `firstName`, `lastName`, `observation` (case-insensitive `ILIKE`).
  - Orders by `rsvpSubmittedAt DESC NULLS LAST` (covers admin-edited observations on guests who haven't formally submitted).
  - Renders the list and a "Gerar PDF" button that opens `/admin/observations/print?q=…` in a new tab.
- New print route at `src/app/(admin)/admin/observations/print/page.tsx`. Server Component running the same query as the main page (driven by the same `q` param), but rendering a print-friendly layout with no admin chrome (no nav, no search bar, no buttons). Couple names pulled from `wedding.config.ts`. The page includes a small Client Component island that calls `window.print()` after render. CSS uses `@media print` and `@page` rules for margins and page breaks. The print route is gated by the same `(admin)/admin/layout.tsx` auth check.
- Search and filter are URL-driven (server-side) so back/forward and shareable URLs work, and the same query string drives the print route.
- Status badge is the same reusable component introduced by `admin-rsvp-actions.md`.
- Relative time formatting (`há 2 dias`): use `Intl.RelativeTimeFormat` with the active locale; show absolute timestamp on hover via `title` attribute.
- Cross-link in the admin nav: `/admin/observations` is a sibling to `/admin/guests` and `/admin/rsvps`.
- Admin layout already enforces auth + role; no per-page checks needed for the read view (Server Actions are not used here — the page is read-only).
- CSP impact: none.
- Accessibility: each entry is a semantic article/list item with the guest name as a heading; the click-through is a real anchor; observation text preserves `\n` via `white-space: pre-wrap` (no `dangerouslySetInnerHTML`).
- Empty state: when the filtered query returns zero rows (either because there are no observations yet or the search didn't match anything), the page shows a friendly empty state with a link back to `/admin/guests`.
