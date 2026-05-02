# Site shell (public layout)

## Goal

Define the page-level chrome of the public site: how sections compose into a single long-scroll home, the background, the monogram at the top, the language toggle, the footer, and the global metadata (browser tab, OpenGraph). Provides the canvas every other section feature (`hero-countdown`, `ceremony-reception`, `story`, `dress-code`, `gifts`, `tips`, `faq`) renders into.

Reference: `/workspace/site.pdf` and the live page it was exported from. The reference is a **single-column long-scroll** with no traditional header / navbar; sections are separated by background-color shifts (cream ↔ sage) and the cream sections carry a subtle paper texture.

## In scope / out of scope

- **IN**:
  - Single-column responsive layout with sections stacked vertically. Mobile-first; desktop centers content with side margins.
  - Two alternating section backgrounds — cream paper (default) and sage block (used for emphasis sections like "Nossa história"). Driven by a per-section `tone: "paper" | "sage"` prop.
  - Subtle paper-texture overlay on cream sections (a single bundled SVG noise referenced in CSS).
  - Generated monogram SVG at the top of the hero, derived from the couple's initials and rendered in `--color-primary` (sage). One bundled SVG template per `theme.md` preset; initials substituted at render time.
  - Floating language toggle (`PT / EN`) anchored top-right of the viewport, persistent on scroll.
  - Closing footer: a centered script line ("Te esperamos!" / "We're waiting for you!") followed by a thin metadata row (couple names + year + a discreet privacy-policy link).
  - Section visibility flags: each section can be shown / hidden by `COUPLE` or `CEREMONIAL` from `/admin/site` without redeploy.
  - Global site settings editable from `/admin/site`: couple names, wedding date and time (with time zone), venue name, site title, meta description, OG image upload.
  - OpenGraph + Twitter card meta tags rendered in `<head>`, sourced from the same admin settings.
- **OUT** of v1, deferred:
  - Traditional sticky / scrolling navbar with section anchors.
  - Smooth-scroll anchor links (`#story`, `#gifts`, etc.).
  - Section reordering from the admin (order is fixed by code).
  - Per-section custom backgrounds beyond the two tones.
  - Animated transitions / parallax / scroll-triggered effects.
  - Theme switcher visible to public visitors (mode is fork-locked per `theme.md`).
  - PWA install / offline.
  - Public sitemap of inner pages (the home is the whole product).

## UX flow

### Public visitor

1. Visitor lands on `/` (or `/{pt|en}` if locale-prefixed routing is on).
2. Page renders the monogram at the very top, centered. Hero section follows.
3. Below the hero, sections are stacked: Programação (Cerimônia + Recepção) → Traje → Nossa história → Lista de presentes → Dicas → Closing footer. Order is fixed in code; admin only toggles visibility.
4. Background alternates between cream (paper-textured) and sage on a per-section basis to create rhythm.
5. A small `PT / EN` toggle floats at the top-right of the viewport, sticky across scroll. Clicking it reloads the page on the other locale (or pushes to `/pt|en/...`).
6. Reaching the bottom, the visitor sees "Te esperamos!" in script over the cream background, with a thin grey metadata row below (couple + year + privacy link).

### Admin (`/admin/site`)

1. `COUPLE` or `CEREMONIAL` opens `/admin/site` (a new top-level admin page).
2. Form sections, top to bottom:
   - **Couple**: partner 1 name, partner 2 name, display order, optional initials override (otherwise auto-derived for the monogram).
   - **Wedding date**: date, ceremony time, time zone (defaults to `wedding.config.ts → site.timezone`).
   - **Venue**: short name (used in monogram subtitle "DOMINGO, 20 DE OUTUBRO… EM <venue>" if `wedding.config.ts → site.locale === "pt"`).
   - **Metadata**: site title (browser tab), meta description (OG / SEO), OG image upload (Supabase Storage `site/og-image.<ext>` — 1200×630 recommended).
   - **Sections**: a list of all sections with a visibility toggle each. Hiding a section removes it from the public render.
3. Submit → Server Action validates with Zod, persists to `siteSettings`, calls `revalidatePath("/")` and `revalidatePath("/{pt,en}")` so changes appear on the next visitor load (no redeploy).

## Data model

```ts
// Single-row table (id is a constant primary key)
siteSettings: {
  id: text PRIMARY KEY DEFAULT 'default'  // enforces single row at DB level
  partner1Name: text
  partner1ShortName: text                  // used in monogram + tight spaces
  partner2Name: text
  partner2ShortName: text
  partnersOrder: enum("p1-p2", "p2-p1")    // controls "Fernanda & Daniel" vs "Daniel & Fernanda"
  monogramInitialsOverride: text           // nullable; defaults to first letters of shortNames
  weddingDate: timestamp                   // includes time
  weddingTimeZone: text                    // IANA tz, e.g. "America/Sao_Paulo"
  venueShortName: text                     // for the hero subtitle
  siteTitlePt: text
  siteTitleEn: text                        // nullable, falls back to PT
  metaDescriptionPt: text
  metaDescriptionEn: text                  // nullable
  ogImageStoragePath: text                 // Supabase Storage path, nullable
  showHero: boolean DEFAULT true
  showCeremonyReception: boolean DEFAULT true
  showDressCode: boolean DEFAULT true
  showStory: boolean DEFAULT true
  showGifts: boolean DEFAULT true
  showTips: boolean DEFAULT true
  showFaq: boolean DEFAULT true
  showPhotoGallery: boolean DEFAULT true
  updatedAt: timestamp
}
```

The table is created with one row at first migration (`id = 'default'`). Reads are always `WHERE id = 'default'`; writes are upserts on the same key. A `CHECK` constraint or application-level guard prevents a second row from being inserted.

## Permissions

- **Public visitor** — read the rendered home. No access to `/admin/site`.
- **`COUPLE` / `CEREMONIAL`** — full read/write on `/admin/site`. Both roles have identical permissions.

## Decisions

1. **Floating language toggle, top-right.** No header bar; less visual noise; matches reference.
2. **Single section-visibility list on `/admin/site`.** One place to toggle every section. Section-specific admin pages keep editing their own content.
3. **Bundled SVG monogram per preset** with `{{INITIALS}}` placeholder replaced server-side. No runtime font dependency for SVG text.
4. **SVG noise paper texture** (~3 kB) overlaid via CSS `background-image`.
5. **Minimal footer**: "Te esperamos!" + couple names + year + privacy link. Contact info lives in section content, not the footer.
6. **OG image**: admin upload (Supabase Storage `site` bucket) with a generated SVG fallback when none is set.
7. **Section order is fixed in code for v1.** Admin-reorderable is deferred — alternating tones and narrative flow are designed.
8. **Long-scroll on all viewports.** No accordion / collapse on mobile.
9. **Single-row `siteSettings` table** (not a key-value store). Type-safe, predictable.
10. **Language persistence via URL prefix** (`/pt`, `/en`) through `next-intl`. Shareable, SEO-friendly.
11. **Hidden-section admin pages stay open** for editing; a "Esta seção está oculta no site" badge shows when the section is toggled off.

## Implementation notes

- New table `siteSettings` in `src/lib/db/schema.ts`. Drizzle migration creates the row at apply time (`INSERT INTO site_settings (id, …) VALUES ('default', …) ON CONFLICT DO NOTHING`).
- New admin page at `src/app/(admin)/admin/site/page.tsx`. Server Component reads the singleton row; Server Actions for save / OG-image upload sit alongside.
- Public layout at `src/app/(public)/[locale]/layout.tsx` (or wherever the `next-intl` setup places it):
  - Server Component fetches `siteSettings` once and passes the relevant fields to children via React context or props.
  - Renders the floating language toggle and the closing footer.
  - Each section component reads its own `show…` flag from settings; when false, returns `null`.
- Monogram component: takes `initials` prop, loads the preset's `monogram.svg`, replaces `{{INITIALS}}`, returns inline `<svg>`.
- Paper-texture overlay: a CSS class `.bg-paper` applied to cream sections; `.bg-sage` on sage sections. Variables come from `theme.md`.
- OG image upload reuses the signed-URL Server Action pattern from `photo-gallery.md`. Bucket `site` (small, public). Generated SVG fallback rendered inline at `/og` route for sharing when no image is set.
- `/admin/site` is gated by the existing `(admin)/admin/layout.tsx` auth check; per-action `auth()` + role assertion as defense in depth.
- Time-zone handling: `weddingTimeZone` is the IANA name; the date is stored in UTC; rendering uses the active locale's `Intl.DateTimeFormat` with `timeZone` set explicitly. Avoids browser-local drift on what's "the wedding day".
- CSP impact: the bundled SVGs (monogram, paper) are `'self'`; OG image (Supabase Storage) is already covered by the `gifts.md` / `photo-gallery.md` `img-src` additions.
- Section visibility flags drive both server rendering (don't render hidden sections) and the admin's "this section is hidden" badge.
- Accessibility: language toggle has `aria-label="Mudar idioma para English"` (or PT depending on current); monogram SVG has `role="img"` + `aria-label` with the couple names; section landmarks use `<section aria-labelledby="…">`.
- The `siteSettings` row is the source of truth for the document `<title>` and `<meta name="description">` rendered via `generateMetadata` on the public layout.
- README's "Stack" / "Folder structure" sections grow a note that `wedding.config.ts` is now mostly compile-time configuration (theme preset, locale defaults, RSVP mode lock); editorial content lives in DB and is edited at `/admin/site` and the section-specific admin pages.
