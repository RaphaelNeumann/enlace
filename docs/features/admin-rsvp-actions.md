# Admin: RSVP confirm / cancel actions

## Goal

Let `COUPLE` and `CEREMONIAL` manage attendance directly from the guests list at `/admin/guests` — without leaving the page — via inline action buttons that fire confirmation dialogs. Common scenarios: a guest replies by phone or in person, the cerimonial confirms on their behalf; a confirmed guest later cancels and the cerimonial reverts the status. Creating a new guest is already covered by `guest-list.md`'s CRUD; this doc focuses on the *status transitions*.

## In scope / out of scope

- **IN**:
  - "Confirmar presença" action button on rows whose `rsvpStatus` is `pending` or `declined`. Opens a yes/no dialog with the guest's full name; on confirm, sets `rsvpStatus = "confirmed"` and stamps `rsvpSubmittedAt = now()`.
  - "Cancelar confirmação" action button on rows whose `rsvpStatus` is `confirmed`. Opens a yes/no dialog; on confirm, reverts `rsvpStatus` to `"pending"` and clears `rsvpSubmittedAt`.
  - "Marcar como recusou" action button on rows whose `rsvpStatus` is `pending` or `confirmed`. Opens a yes/no dialog; on confirm, sets `rsvpStatus = "declined"`.
  - Status badge per row showing the current state (Pendente / Confirmado / Recusado).
  - Both `COUPLE` and `CEREMONIAL` can perform all three transitions; identical permissions.
  - Toast notification after each successful action ("João Silva foi marcado como confirmado").
- **OUT** of v1, deferred:
  - Audit log of who triggered which transition and when. The status reflects the latest state only.
  - Bulk actions (multi-select rows and confirm/decline several at once).
  - Inline plus-one editing inside the action dialog. Admin uses the existing edit page for plus-one changes.
  - Email notification to the guest when admin confirms on their behalf.
  - Per-guest action history view.
  - Reason / note fields when canceling a confirmation.
  - Undo toast (a "desfazer" affordance after the action runs).

## UX flow

1. `COUPLE` or `CEREMONIAL` opens `/admin/guests`. Each row shows: name, plus-ones-allowed, current status badge, an actions column.
2. The actions column shows context-aware buttons:
   - `pending` → "Confirmar presença" and "Marcar como recusou".
   - `confirmed` → "Cancelar confirmação" and "Marcar como recusou".
   - `declined` → "Confirmar presença".
3. Clicking any button opens a `shadcn` Dialog: a heading like "Confirmar presença de João Silva?" with a single-line explanation of what the action does (e.g. "O convidado será marcado como confirmado") and two buttons: "Confirmar" / "Cancelar".
4. Confirming runs the Server Action; the row updates in place; the dialog closes; a toast appears with the result.
5. Cancel button or ESC closes the dialog without changes.
6. If an action fails (network/DB), the toast surfaces the error and the row's state stays unchanged.

## Data model

Reads and writes existing columns on `guests`. No new tables or columns introduced by this feature.

The columns this feature touches (defined in `rsvp.md` / referenced in `admin-rsvp-list.md`):

- `rsvpStatus: enum("pending", "confirmed", "declined")`
- `rsvpSubmittedAt: timestamp (nullable)`

Behavior matrix:

| From → To | `rsvpStatus` | `rsvpSubmittedAt` |
| --- | --- | --- |
| `pending` → `confirmed` | `"confirmed"` | `now()` |
| `declined` → `confirmed` | `"confirmed"` | `now()` |
| `confirmed` → `pending` | `"pending"` | `null` |
| `pending` → `declined` | `"declined"` | unchanged (still `null`) |
| `confirmed` → `declined` | `"declined"` | unchanged (was set; left as historical record) |

## Permissions

- **`COUPLE` / `CEREMONIAL`** — both can perform all three transitions on any guest. Identical permissions.
- **Public** — no access to admin pages at all (covered by `(admin)/admin/layout.tsx`).

## Decisions

1. **Cancel confirmation reverts to `pending`** (neutral state). Declining is a separate active statement requiring its own action.
2. **`rsvpSubmittedAt` is left unchanged on a decline transition.** The timestamp captures "when did we last record an answer"; declining doesn't invalidate the history.
3. **Admin confirmation does not touch plus-ones.** Plus-one rows are managed exclusively via the existing edit page in `guest-list.md`.
4. **Dialog shows a short context line** ("O convidado será marcado como confirmado.") in addition to the guest name. No rich form inside the dialog.
5. **Toast library: `sonner`,** mounted once in the admin layout.
6. **No audit log in v1.** A future `rsvpHistory` table can be added without breaking existing data.
7. **No bulk actions in v1.** Cerimonial typically confirms one guest at a time as replies come in.
8. **Modal dialog** for every action (per the user's request — `dialog de confirmação`). No inline-confirm pattern.
9. **Conflict with public form is handled by the existing single-shot rule** in `guest-list.md`: the public form refuses a second submission for the same name regardless of whether the prior record was admin- or guest-created.
10. **"Marcar como recusou" action is included in this doc** even though the user only mentioned confirm + cancel. Declining completes the state machine and is trivial to add now.
11. **Server-roundtrip with `revalidatePath`,** not optimistic UI. Admin pages are low-traffic; simplicity wins.

## Implementation notes

- Extends `src/app/(admin)/admin/guests/page.tsx` (defined in `guest-list.md`) with a new "Actions" column and a row-level Client Component that owns the dialog open/close state.
- New Server Action `setGuestRsvpStatus(guestId, status)` in `src/app/(admin)/admin/guests/actions.ts`:
  - Calls `auth()`, asserts `role in ("COUPLE", "CEREMONIAL")`.
  - Validates input via Zod: `guestId` is a uuid, `status` is one of `"pending" | "confirmed" | "declined"`.
  - In a single Drizzle transaction, updates `rsvpStatus` and `rsvpSubmittedAt` per the matrix above.
  - Calls `revalidatePath("/admin/guests")` and `revalidatePath("/admin/rsvps")` so both views reflect the change.
  - Returns `{ ok: true }` or `{ ok: false, error }`; the client toasts accordingly.
- Dialog: `shadcn` Dialog (already in `base-nova`). One reusable component `<RsvpActionDialog>` parameterized by `{ guestName, action: "confirm" | "cancel" | "decline", onConfirm }`.
- Status badge: small reusable component reading `rsvpStatus`, mapping to color via theme tokens (already CSS-variable-driven per `theme.md`).
- Toast: `sonner` mounted once in the admin layout (`src/app/(admin)/admin/layout.tsx` after the auth gate). All admin actions can hook into it.
- The Server Action does not mutate plus-ones or observation. Only the two columns described in the matrix.
- CSP impact: none.
- Accessibility: action buttons have explicit `aria-label`s including the guest's name ("Confirmar presença de João Silva"); dialog has a labelled heading; ESC and backdrop click close the dialog; focus returns to the originating button on close.
- Empty list edge case: when there are zero guests, no buttons exist anywhere — the empty state of `/admin/guests` from `guest-list.md` applies.
- Concurrent-edit edge case: if two cerimonials open the same row at the same time, the last write wins. No optimistic locking. Acceptable for a wedding admin used by 2–3 people.
