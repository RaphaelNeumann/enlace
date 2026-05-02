# Tips

## Goal

Let the couple publish small pieces of advice for guests — hotel recommendations, local restaurants, "what to bring", dress-code clarifications, transportation, etc. — grouped under custom categories the couple defines. Categories appear on the home page as cards; clicking a card opens a dialog listing the tips inside that category.

## In scope / out of scope

- **IN**:
  - Admin CRUD on **tip categories** (`COUPLE` and `CEREMONIAL`): name, optional icon, manual position, visibility flag.
  - Admin CRUD on **tips**: parent category, title, body text, optional external URL, manual position within the category, visibility flag.
  - Home-page section showing visible categories as cards (icon + name).
  - Click a category card → dialog opens listing the visible tips for that category, in order.
  - Bilingual content via two-column pattern (`namePt`/`nameEn`, `titlePt`/`titleEn`, `bodyPt`/`bodyEn`); English columns nullable and fall back to Portuguese.
  - A category with zero visible tips is hidden from the home page automatically (no empty-dialog states).
- **OUT** of v1, deferred:
  - Photos on tips or categories.
  - Markdown / rich text in tip body (plain text with `\n` only).
  - Multiple external URLs per tip; only one.
  - Deep-link to a category (e.g. `/?tips=hotel` opening the dialog).
  - "Pinned" / featured tips highlighted on the home page outside the dialog.
  - Per-tip attachments (PDFs, etc.).
  - Category description / subtitle on the card.

## UX flow

### Couple / planner (admin)

1. Sign in, open `/admin/tips/categories`. See existing categories or empty state. Click "Add category" → form: `namePt` (required), `nameEn` (optional), `iconName` (optional), submit.
2. Open `/admin/tips`. List shows tips grouped by category, with reorder and visibility controls. Click "Add tip" → form: parent category (select), `titlePt`, `titleEn?`, `bodyPt`, `bodyEn?`, `externalUrl?`, submit.
3. Reorder via drag handles; toggle visibility per category and per tip.

### Public visitor

1. On the home page, a section "Tips & info" (label via i18n catalog) shows a grid of cards — one per visible category that has at least one visible tip. Each card displays: icon (if set; default icon otherwise) + category name.
2. Click a card → a dialog (`shadcn` Dialog) opens centered on the page. Header: category name. Body: the list of visible tips for that category, in order. Each tip shows its title, body text, and (if `externalUrl` is set) a small "Open" link/button that opens the URL in a new tab (`target="_blank" rel="noopener"`).
3. Close the dialog with the close button, ESC, or backdrop click.

## Data model

```ts
tipCategories: {
  id: uuid (primary key)
  namePt: text
  nameEn: text (nullable — falls back to namePt)
  iconName: text (nullable — Lucide icon identifier; null renders a default)
  position: integer
  isVisible: boolean (default true)
  createdAt: timestamp
  updatedAt: timestamp
}

tips: {
  id: uuid (primary key)
  categoryId: uuid (foreign key → tipCategories.id, on delete cascade)
  titlePt: text
  titleEn: text (nullable)
  bodyPt: text
  bodyEn: text (nullable)
  externalUrl: text (nullable, validated as https://…)
  position: integer
  isVisible: boolean (default true)
  createdAt: timestamp
  updatedAt: timestamp
}
```

`ON DELETE CASCADE` on `tips.categoryId` so deleting a category removes its tips. The admin form warns before delete.

## Permissions

- **Public** — read-only access to visible categories that contain visible tips.
- **`COUPLE` / `CEREMONIAL`** — full CRUD on both tables. Both roles have identical permissions.

## Decisions

1. **Tip title is required.** Each tip has a short headline so the dialog list stays scannable.
2. **Tip body capped at ~2000 chars**, plain text, `\n` preserved (no markdown).
3. **Icon picker is free-text with a whitelist** in `src/lib/icons.ts`. Admin types the name (e.g. `Hotel`, `MapPin`); Zod validates against the whitelist; unknown names fall back to a default icon at render. The whitelist can grow without a UI rebuild.
4. **External URL per tip is optional**, validated as `https://…`. Useful for hotel websites, restaurant maps, etc.
5. **No category description / subtitle on the home-page card.** Card is icon + name only; details live in the dialog.
6. **No photos on tips or categories in v1.** Tips are textual.
7. **No markdown in body.** Plain text with `\n` preserved.
8. **No deep-link to a category** (e.g. `/?tips=hotel`) in v1.
9. **Categories with zero visible tips are hidden from the home page automatically** to avoid empty-dialog states.
10. **Home-page section position is hard-coded for v1** (after Story / Ceremony, before Gifts); the section label comes from the i18n catalog.
11. **Admin lives at a single `/admin/tips` menu item with two tabs** (Categories / Tips) to avoid menu sprawl.

## Implementation notes

- New tables `tipCategories` and `tips` in `src/lib/db/schema.ts`. Indexes on `tipCategories.position` and `(tips.categoryId, tips.position)`.
- Admin pages under `src/app/(admin)/admin/tips/`:
  - `page.tsx` — tabs UI, default tab Tips.
  - `categories/page.tsx` and `categories/new/page.tsx` and `categories/[id]/page.tsx`.
  - `[id]/page.tsx` for editing a tip.
  - Server Actions check `auth()`, assert role, validate via Zod, mutate via Drizzle, `revalidatePath("/")` and `/admin/tips`.
- Icon whitelist: `src/lib/icons.ts` exports a `TIP_CATEGORY_ICONS` record mapping allowed names (`"Hotel"`, `"MapPin"`, `"Utensils"`, `"Plane"`, `"Bus"`, `"Music"`, `"Heart"`, `"Sparkles"`, `"Info"`, ~10–20 entries) to their Lucide components. The admin form's Zod schema constrains `iconName` to keys of that record.
- Public home page server-renders the entire categories+tips tree in one query (categories with `tips` joined, filtered by visibility), then passes it as a prop to a Client Component island for the dialog open/close state. No extra fetch on click — the data is already in the page.
- Dialog: shadcn `Dialog` component (already part of `base-nova` preset). Modal, focus-trapped, ESC-closable.
- Validation: `namePt` ~60 chars, `titlePt` ~120 chars, `bodyPt` ~2000 chars, `externalUrl` URL with `https://` only, `iconName` constrained to the whitelist.
- Empty-state UX: if there are no visible categories or no tips at all, the home-page section is omitted entirely (no empty section heading).
- CSP impact: none. External-URL buttons are `<a>` tags only.
- Accessibility: cards are `<button>` elements with descriptive `aria-label`; dialog has a labelled heading; tip list is a semantic `<ul>` / `<li>`; external-link buttons announce "(opens in a new tab)" via screen-reader-only text.
