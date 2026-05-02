# Ceremony & reception (Programação)

## Goal

Define the "Programação" section seen on the reference site (`/workspace/site.pdf`, page 1, section 1): two side-by-side cards — **Cerimônia** and **Recepção** — each carrying a watercolor icon, the date, the time, the venue address, a "Google Maps" link, and (only on the Cerimônia card) a "Confirme sua presença" button linking to the public RSVP form.

## In scope / out of scope

- **IN**:
  - One section, two cards. Cards are stacked on mobile, side-by-side on tablet/desktop.
  - Per card: title in script (`Cerimônia` / `Recepção`), watercolor icon, date in `DD.MM.YYYY` small-caps tracked, time line ("ÀS 16H"), address (free text), Google Maps URL (the link icon + "Google Maps" label).
  - "Confirme sua presença" button on the Cerimônia card linking to `/rsvp/<token>` (or `/rsvp` when the token is unset; see `rsvp-access.md`).
  - Both cards are admin-editable from `/admin/site/programacao`: title (PT/EN), date, time, address (PT/EN), maps URL, watercolor icon (selected from a curated set bundled with the theme preset).
  - Visibility flag for the whole section comes from `siteSettings.showCeremonyReception` (per `site-shell.md`).
  - Defaults at first deploy: titles preset to "Cerimônia" / "Recepção" (PT) and "Ceremony" / "Reception" (EN); date defaults to `siteSettings.weddingDate`; address empty until the couple fills it in.
- **OUT** of v1, deferred:
  - Embedded interactive map. The reference uses an external Google Maps link, not an embed; matches our `location-map.md` posture.
  - Three or more cards (e.g. brunch the next day). Two-card layout is fixed in v1.
  - Per-card photo upload (only the curated watercolor icon set is selectable).
  - Per-card RSVP CTA on the Recepção card (Cerimônia is the canonical RSVP entry point).
  - Different times per locale (assume the wedding has one absolute time; `Intl.DateTimeFormat` localizes the rendered string).
  - Custom-uploaded watercolor icons. Couple picks from a bundled set tied to the theme preset.

## UX flow

### Public visitor

1. Section title is omitted (the reference shows the cards directly with their script titles); a subtle paper-tone background continues from the hero.
2. Two cards rendered side-by-side on ≥ 768px, stacked on smaller viewports.
3. Cerimônia card top-to-bottom: watercolor icon (rings) → date → script title → time line → address → Google Maps link → "Confirme sua presença" button.
4. Recepção card same layout minus the RSVP button. Watercolor icon (champagne flutes) instead of rings.
5. Tapping "Google Maps" opens the URL in a new tab.
6. Tapping "Confirme sua presença" navigates to `/rsvp/<token>` (or `/rsvp` if the env is unset).

### Admin (`/admin/site/programacao`)

1. Form with two parallel sections (Cerimônia + Recepção). Each section: title (PT/EN), date, time, address (PT/EN), Google Maps URL, watercolor icon picker (a 6-icon visual selector — rings, glasses, cake, church, dance, dinner).
2. Submit → Server Action validates with Zod, persists, calls `revalidatePath("/")`.

## Data model

```ts
programacaoCards: {
  id: enum("ceremony", "reception")  PRIMARY KEY  // exactly two rows, stable IDs
  titlePt: text
  titleEn: text (nullable — falls back to titlePt)
  date: date                                       // separate from siteSettings.weddingDate; defaults to it
  time: text                                       // free-form short text, e.g. "16:00" or "16H"
  addressPt: text
  addressEn: text (nullable)
  mapsUrl: text (nullable, validated as https://…)
  iconKey: enum                                    // key into the bundled watercolor icon set
  updatedAt: timestamp
}
```

Two rows are seeded at first migration: `("ceremony", …)` and `("reception", …)`. The pair is fixed; no add / remove.

## Permissions

- **Public** — read-only render of the section.
- **`COUPLE` / `CEREMONIAL`** — full edit on `/admin/site/programacao`. Both roles identical.

## Decisions

1. **Two fixed cards** keyed by id. No add / remove of cards in v1.
2. **Watercolor icon picker** shows a curated set bundled with the theme preset (`public/themes/aquarela-sage/icons/programacao/*.svg`). No custom uploads in v1.
3. **External Google Maps URL only**, no embed. Aligns with `location-map.md` posture and the reference's behavior.
4. **Default dates fall back to `siteSettings.weddingDate`** so a fresh fork shows something coherent before the couple edits.
5. **Single absolute time, localized at render** via `Intl.DateTimeFormat`. Stored as a free-form string ("16:00" / "16H") since some couples want stylized formats; no parsing is performed.
6. **RSVP CTA only on the Cerimônia card**, linking to the route from `rsvp-access.md`.
7. **Section visibility** is controlled at `/admin/site` per `site-shell.md`; the per-card content is edited at `/admin/site/programacao`.
8. **Bilingual title and address**, EN nullable and falls back to PT (matches `gifts.md` / `tips.md` pattern).
9. **No per-card photo upload.** The visual identity is the curated watercolor set; preserves theme coherence.
10. **No third card in v1.** Brunch / after-party / cerimônia religiosa + civil split are deferred.

## Implementation notes

- New table `programacaoCards` in `src/lib/db/schema.ts`. Drizzle migration seeds the two rows on apply.
- Section component at `src/app/(public)/[locale]/_sections/programacao/index.tsx`. Server Component reads both rows (parent layout already has `siteSettings`; this section fetches its own pair).
- Admin page at `src/app/(admin)/admin/site/programacao/page.tsx`. Form Server Component + Server Action.
- Watercolor icon picker is a small grid of `<button>` thumbnails inside the admin form; the chosen `iconKey` maps to a path in `public/themes/<preset>/icons/programacao/`.
- "Confirme sua presença" button reads `RSVP_ACCESS_TOKEN` once at module load; if set, the link is `/rsvp/<token>`, otherwise `/rsvp` (matches `rsvp-access.md` decisions).
- Date / time formatting: same `Intl.DateTimeFormat` helper used by `hero-countdown.md`. The `time` field is rendered as-is (no parsing).
- Visual: matches the reference — cream cards with thin sage frame, generous padding, small watercolor icon at the top, script title in `--font-display`, body in `--font-body` small-caps tracked. Theme tokens from `theme.md`.
- CSP impact: none (Google Maps is a `<a>` link, not an embed; if the couple later wants an embed, it goes to `frame-src` per `location-map.md`).
- Accessibility: each card is an `<article>` with the title as `<h2>`; the maps link has explicit `aria-label="Abrir endereço da cerimônia no Google Maps"`; the RSVP CTA has `aria-label="Confirmar presença"`.
