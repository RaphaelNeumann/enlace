# Dress code (Traje)

## Goal

The "Traje" section seen on the reference site (`/workspace/site.pdf`, page 1, section 2): a script title, a watercolor illustration of a dress and suit, a short headline ("SOCIAL OU ESPORTE FINO"), a descriptive paragraph, and two sub-blocks ("Mulheres" / "Homens") with detailed guidance per gender. Editable from the admin.

## In scope / out of scope

- **IN**:
  - Single section with a fixed sub-structure: headline (short), intro paragraph, two sub-blocks (women / men), each with its own sub-title in script and a body paragraph.
  - Watercolor illustration above the headline (selected from a curated set bundled with the theme preset; same picker mechanism as `ceremony-reception.md`).
  - All text fields bilingual (PT + EN, EN nullable and falls back to PT).
  - Admin page at `/admin/site/dress-code`.
  - Visibility flag on `siteSettings.showDressCode` (per `site-shell.md`).
- **OUT** of v1, deferred:
  - More than two sub-blocks (e.g. children, dress code by guest type).
  - Markdown / rich text. Plain text with `\n` only.
  - Image board / inspiration gallery for dress code.
  - Per-locale custom illustration.
  - Color palette swatches for dress code (e.g. "avoid white, beige, ivory" displayed as visual chips). v1 uses prose only.

## UX flow

### Public visitor

1. Section follows Programação on the home, on the cream tone.
2. Watercolor icon at top, then the short headline in small-caps tracked serif.
3. Intro paragraph below in serif body.
4. Sub-block "Mulheres" — script sub-title, body paragraph below.
5. Sub-block "Homens" — same shape.

### Admin (`/admin/site/dress-code`)

1. Form with: headline (PT/EN), intro (PT/EN), women sub-title (PT/EN), women body (PT/EN), men sub-title (PT/EN), men body (PT/EN), watercolor icon picker.
2. Submit → Server Action persists, `revalidatePath("/")`.

## Data model

```ts
dressCode: {
  id: text PRIMARY KEY DEFAULT 'default'   // single row
  headlinePt: text
  headlineEn: text (nullable)
  introPt: text
  introEn: text (nullable)
  womenTitlePt: text
  womenTitleEn: text (nullable)
  womenBodyPt: text
  womenBodyEn: text (nullable)
  menTitlePt: text
  menTitleEn: text (nullable)
  menBodyPt: text
  menBodyEn: text (nullable)
  iconKey: text                             // key into the bundled watercolor icon set
  updatedAt: timestamp
}
```

Single-row table seeded with sensible PT defaults at first migration ("SOCIAL OU ESPORTE FINO" headline; placeholder bodies the couple replaces).

## Permissions

- **Public** — read.
- **`COUPLE` / `CEREMONIAL`** — full edit.

## Decisions

1. **Two fixed sub-blocks** (women / men), matching the reference. No third / fourth blocks in v1.
2. **Bilingual fields**, EN falls back to PT.
3. **Curated watercolor icon picker**, same mechanism as `ceremony-reception.md`. Bundled assets per theme preset.
4. **Plain text body** with `\n` preserved. No markdown.
5. **No color swatches / inspiration gallery** in v1.
6. **Single-row `dressCode` table**, seeded with PT defaults so a fresh fork has the section populated reasonably.
7. **Naming "Mulheres" / "Homens" is editable** by the couple — they aren't hardcoded labels; they're text fields like the bodies.

## Implementation notes

- New table `dressCode`. Drizzle migration creates the singleton row + reasonable defaults.
- Section component at `src/app/(public)/[locale]/_sections/dress-code/index.tsx`. Server Component.
- Admin page at `src/app/(admin)/admin/site/dress-code/page.tsx`. Server Component + Server Action.
- Watercolor icon picker resolves to `public/themes/<preset>/icons/dress-code/*.svg` (e.g. dress-and-suit, gown, tuxedo, beach-attire).
- Validation: headline ~80 chars, intro ~500 chars, sub-block titles ~60 chars, sub-block bodies ~1500 chars each, all per locale.
- Visual: matches the reference — small icon, headline in small-caps tracked serif, intro paragraph centered, sub-block titles in script (`--font-display`), sub-block bodies in serif. Theme tokens from `theme.md`.
- Accessibility: section uses `<section aria-labelledby="dress-code-heading">`; sub-blocks each use `<h3>` for the script titles.
- CSP impact: none.
