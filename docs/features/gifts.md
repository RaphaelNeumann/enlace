# Gift catalog

## Goal

Let the couple curate a list of gifts that guests can browse and send. Each item is created by `COUPLE` or `CEREMONIAL` through the admin and carries a photo, a title, and a description. Guests can pay via PIX (instant transfer with a QR code) or credit card (a Mercado Pago checkout preference generated per click with the suggested amount pre-filled), and may leave a personal signed message to the couple.

## In scope / out of scope

- **IN**:
  - Admin CRUD for gift items: title, description, photo, optional suggested amount, optional external URL, manual position, visibility flag.
  - Public catalog page listing visible items as cards (photo + title + short description).
  - Per-item "send gift" modal that shows, in this order:
    1. The PIX QR code (server-rendered) and the PIX key with copy button.
    2. A "Pay with credit card" button that creates a Mercado Pago Checkout Pro preference on click (via MP API) with the suggested amount pre-filled, then opens the returned `init_point` URL in a new tab.
    3. A short form to leave a signed message to the couple (sender name + message), submitted to the site.
  - Photo upload via Supabase Storage, using the same signed-URL Server Action pattern from `photo-gallery.md` (separate bucket: `gifts`).
  - PIX configuration (key, key type, recipient name, city) and the Mercado Pago access token in env vars; one shared payment account for all items.
  - Manual item reordering (drag handle in admin).
  - Visibility toggle per item (couple can hide without deleting).
  - Per-IP rate limit on the message endpoint to deter spam.
- **OUT** of v1, deferred:
  - Tracking which guest paid which item. The couple reads their PIX statement / Mercado Pago dashboard; the site does not log payments.
  - Mercado Pago payment confirmation webhooks (would let the site mark gifts as paid automatically).
  - "Reserve" / "claim" mechanism so guests see an item is already taken.
  - Item categories or sections.
  - Multiple photos per item.
  - Markdown / rich text in description (plain text with `\n` only).
  - Inventory: items don't disappear after N claims.
  - Multi-currency or international payment methods (PayPal, Stripe, etc.) beyond PIX + Mercado Pago.
  - Suggested amount tiers (let the guest pick from $10 / $20 / $50).
  - Email notification to the couple on each new message (admin sees them in `/admin/messages`; email push deferred).
  - Standalone guestbook / "leave a message" page outside the gift flow.

## UX flow

### Couple / planner (admin)

1. Sign in, open `/admin/gifts`. See the list of existing items (or empty state with "Add your first gift").
2. Click "Add gift" → form with: title (PT + EN), description (PT + EN), photo upload, optional suggested amount in BRL, optional external URL.
3. Submit → photo is uploaded to the `gifts` Supabase bucket, item row inserted, list re-renders.
4. Each row has edit / delete / hide controls and a drag handle for reordering. The form notes that the credit-card option requires a suggested amount.
5. A separate page `/admin/messages` lists all guest messages chronologically with sender names.

### Public visitor

1. Open `/gifts`. See a grid of visible items as cards: photo, title, short description.
2. Click a card → modal expands with three sections:
   - **PIX**: the QR code (rendered server-side as inline SVG), the PIX key with a copy-to-clipboard button, and the suggested amount (if set on the item). If the item has no suggested amount, the QR omits it and the guest types the amount in their bank app.
   - **Credit card** (only shown when the item has a `suggestedAmountCents` set and `MERCADO_PAGO_ACCESS_TOKEN` is configured): a "Pay with credit card" button. On click, a Server Action creates a fresh MP Checkout Pro preference with the gift title and the suggested amount; the returned `init_point` URL is opened in a new tab (`target="_blank" rel="noopener"`).
   - **Message to the couple**: a small form with two required fields — sender name (~80 chars) and message (~500 chars). On submit, the message is saved server-side; the form shows a success state ("thanks, message sent!"). Submission is independent of payment — guests can leave a message without paying, and they can pay without leaving a message.
3. The site does not record the choice or whether payment occurred; the couple reconciles via their PIX statement and Mercado Pago dashboard.

## Data model

```ts
gifts: {
  id: uuid (primary key)
  titlePt: text
  titleEn: text (nullable — falls back to titlePt when missing)
  descriptionPt: text
  descriptionEn: text (nullable — falls back to descriptionPt)
  iconSvg: text (nullable — inline <svg> markup shown in the card's image slot
    instead of a photo; takes precedence over photoStoragePath. Admin-only
    content rendered via dangerouslySetInnerHTML; <script>/event handlers are
    inert under the nonce CSP.)
  photoStoragePath: text (nullable)
  externalUrl: text (nullable)
  suggestedAmountCents: integer (nullable — when null, the QR has no fixed amount and the credit-card option is hidden)
  position: integer
  isVisible: boolean (default true)
  createdAt: timestamp
  updatedAt: timestamp
}

giftMessages: {
  id: uuid (primary key)
  giftId: uuid (foreign key → gifts.id, on delete set null, nullable)
  senderName: text (non-empty, capped at ~80 chars)
  message: text (non-empty, capped at ~500 chars)
  createdAt: timestamp
}
```

Payment configuration lives in env (one shared account for all items):

- `PIX_KEY`, `PIX_KEY_TYPE` (`"cpf" | "email" | "phone" | "random"`), `PIX_RECIPIENT_NAME`, `PIX_CITY` — used by the BR-Code generator. All four required for PIX to render; if any is missing, the PIX section is omitted.
- `MERCADO_PAGO_ACCESS_TOKEN` — secret access token from the couple's MP account (Production credentials → Access token). Server-side only; never sent to the client. If unset, the credit-card section is omitted from the modal.

No MP preference IDs are persisted — each click generates a fresh preference.

## Permissions

- **Public** — read-only catalog (visible items only); can submit a message via the gift modal; can trigger the MP-preference Server Action via the credit-card button.
- **`COUPLE` / `CEREMONIAL`** — full CRUD on gifts; read access to all messages in `/admin/messages`. Both roles have identical permissions.

## Decisions

1. **Mercado Pago via API (Checkout Pro), not a shared static link.** Each click on the credit-card button creates a fresh MP preference with the gift's suggested amount pre-filled and the gift title in the preference description. The credit-card button is hidden when the gift has no suggested amount.
2. **Suggested amount is also displayed visibly next to the PIX section** so guests paying via QR without an amount, or copying the PIX key, know what to send.
3. **Messages are persisted in the DB only** (`giftMessages` table) and read by the couple at `/admin/messages`. Email notifications via Resend deferred to v2.
4. **Messages are always signed** — sender name is a required field. No anonymous messages.
5. **`giftMessages.giftId` is nullable** (foreign key with `ON DELETE SET NULL`). The form captures the gift the modal was opened from when present, but the message is preserved if the gift is later deleted.
6. **No standalone guestbook in v1.** The gift modal is the only entry point for guest messages. A standalone `/messages` page can be added later by exposing the same writer.
7. **Bilingual content per item via two columns** (`titlePt`/`titleEn`, `descriptionPt`/`descriptionEn`). English columns are nullable and fall back to Portuguese when missing.
8. **PIX configuration in env vars**, not in `wedding.config.ts`. PIX keys are personal data (CPF / phone / email) and shouldn't end up in a public fork.
9. **PIX QR generated server-side** as inline SVG. No client lib, no extra round trip.
10. **External retailer link per item is optional.** For couples who keep wishlists at Magalu, Amazon, Westwing, etc.
11. **Suggested amount per item is optional.** Without it, the QR omits the amount and the credit-card option is hidden (MP requires an amount on the preference).
12. **New items default to visible.** Couple toggles `isVisible` to hide without deleting.
13. **Public catalog uses locale-prefixed routing via `next-intl`** (`/{pt,en}/gifts`), consistent with the rest of the public site.
14. **Photo bucket is `gifts`, separate from the gallery's `gallery` bucket.** Different lifecycle, different content.
15. **No payment tracking in v1.** Couple reconciles via PIX statement and MP dashboard. Webhook-based tracking is deliberately deferred so v1 stays focused.
16. **Flat list with manual reordering — no categories or sections in v1.**

## Implementation notes

- New tables `gifts` and `giftMessages` in `src/lib/db/schema.ts`.
- Photo upload reuses the signed-URL Server Action and the `<Image>` rendering pattern from `photo-gallery.md`. The bucket is `gifts` (public, same posture as `gallery`).
- Admin pages under `src/app/(admin)/admin/gifts/`:
  - `page.tsx` — list with reorder + visibility toggle.
  - `new/page.tsx` — create form.
  - `[id]/page.tsx` — edit / delete.
  - Each Server Action calls `auth()`, asserts `role in ("COUPLE", "CEREMONIAL")`, validates with Zod, mutates via Drizzle, calls `revalidatePath("/gifts")` and `/admin/gifts`.
- Admin messages page at `src/app/(admin)/admin/messages/page.tsx` — chronological list, optionally joined with `gifts` to show gift title alongside the message when `giftId` is present.
- Public pages under `src/app/(public)/[locale]/gifts/`:
  - `page.tsx` — server-rendered list.
  - The "send gift" modal is a Client Component island (clipboard copy, message form, MP-preference click handler).
- PIX BR-Code generation: `src/lib/pix.ts` exports `buildBrCode({ key, keyType, recipientName, city, amountCents? })`. Returns the BR-Code string used both for QR rendering and the copy button. Render the QR as inline SVG via `qrcode-svg` (server-side, no client lib).
- Mercado Pago integration: `src/lib/mercadopago.ts` exports `createPreference({ giftId, titlePt, amountCents })` using the official `mercadopago` SDK with `MERCADO_PAGO_ACCESS_TOKEN`. The Server Action `createGiftCheckout(giftId)`:
  - Loads the gift row, refuses if `suggestedAmountCents` is null or `isVisible` is false.
  - Calls `createPreference` with the gift's title (PT) and amount.
  - Returns `{ initPoint }` to the client; the modal opens it in a new tab.
  - Sets `external_reference: giftId` on the preference for reconciliation in the MP dashboard.
  - No webhook handler in v1.
- Message submission: Server Action at `src/app/(public)/[locale]/gifts/actions.ts` validates `{ giftId?, senderName, message }` via Zod and persists to `giftMessages`. Per-IP rate limit (shared util with `guest-list.md`'s RSVP submission) before any DB write.
- Add to `.env.example`: `PIX_KEY`, `PIX_KEY_TYPE`, `PIX_RECIPIENT_NAME`, `PIX_CITY`, `MERCADO_PAGO_ACCESS_TOKEN`. README "Admin" section grows a "Gift catalog (PIX + Mercado Pago)" subsection with the five env vars and where to find them in MP's dashboard.
- CSP impact:
  - External retailer links and the Mercado Pago `init_point`: `<a target="_blank">` (or `window.open`); no CSP change needed (we don't load anything from MP into our own page).
  - Supabase Storage photos: `gifts` bucket origin already covered when `photo-gallery.md` adds Supabase to `img-src`.
  - QR rendered as inline SVG: `'self'` covers it.
- Validation: titles ~120 chars, descriptions ~1000 chars (plain text, `\n` preserved), `externalUrl` validated as `https://…`, `suggestedAmountCents` non-negative integer, sender name ~80 chars, message ~500 chars.
- Empty-state UX: if there are no visible items, the public `/gifts` page shows a friendly placeholder rather than an empty grid. If there are no messages, `/admin/messages` shows an empty state. If a gift has no suggested amount, the admin form shows a hint that the credit-card option will be hidden for that item.
- Accessibility: each card is a `<button>` (or anchor for external-link-only items), keyboard reachable; QR has an `aria-label` describing the recipient; message form fields have explicit labels; the credit-card button shows a loading state while the preference is being created.
