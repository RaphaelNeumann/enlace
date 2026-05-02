# Story (Nossa história)

## Goal

The "Nossa história" section seen on the reference site (`/workspace/site.pdf`, page 1, sections 2-3): a sage-toned section block with the script title "Nossa história", a row of three circular photos of the couple, and a body of free-form prose telling how the couple met / their journey. Editable from the admin panel.

## In scope / out of scope

- **IN**:
  - One section, sage-tone background per `site-shell.md`'s tone system.
  - Script-font title ("Nossa história" / "Our story" via i18n).
  - Up to **three photos** displayed as circular thumbnails in a horizontal row. Each photo is uploaded by the couple via the admin and stored in Supabase Storage (`site` bucket).
  - One free-text body field (PT + EN), plain text with `\n` preserved, ~3000 chars cap.
  - Visibility flag on `siteSettings.showStory` (per `site-shell.md`).
- **OUT** of v1, deferred:
  - Timeline-style structured story (date → milestone). v1 is a single prose block.
  - More than three photos or a carousel. The reference shows three; matches that.
  - Markdown / rich text in the body. Plain text with `\n` only.
  - Captions on the photos.
  - Photo cropping UI in the admin (the couple uploads square images).

## UX flow

### Public visitor

1. Visitor scrolls past Programação and Traje. Background shifts from cream to sage.
2. Section title "Nossa história" appears in script.
3. Three circular photos render in a row (or stacked on narrow viewports).
4. Body prose appears below, in serif, on the cream-ish overlay area or directly on the sage background depending on the active preset's contrast tokens.

### Admin (`/admin/site/story`)

1. `COUPLE` or `CEREMONIAL` opens `/admin/site/story`.
2. Form fields: body (PT, EN) — two textareas with the same `\n`-preserving rules; three photo slots with upload buttons.
3. Each photo slot shows the current image (or empty state) with "Substituir" and "Remover" buttons. Upload uses the signed-URL Server Action shared with `gifts.md` / `photo-gallery.md`.
4. Submit → Server Action persists, calls `revalidatePath("/")`.

## Data model

```ts
storyContent: {
  id: text PRIMARY KEY DEFAULT 'default'   // single row; same pattern as siteSettings
  bodyPt: text
  bodyEn: text (nullable — falls back to bodyPt)
  photo1StoragePath: text (nullable)
  photo2StoragePath: text (nullable)
  photo3StoragePath: text (nullable)
  updatedAt: timestamp
}
```

Single-row table seeded with empty content at first migration. Could alternatively merge into `siteSettings`, but kept separate so the body text is not loaded on every page render that only needs the site shell.

## Permissions

- **Public** — read.
- **`COUPLE` / `CEREMONIAL`** — full edit on `/admin/site/story`.

## Decisions

1. **Single prose block, plain text with `\n` preserved.** No timeline, no markdown.
2. **Three photo slots, fixed.** Matches reference; circular display via CSS `border-radius: 9999px`.
3. **Photos uploaded by the couple** (no bundled defaults). Empty state shows the section without the photo row.
4. **Bilingual body**, EN nullable and falls back to PT.
5. **Storage bucket `site`** (shared with hero illustration and OG image). Same signed-URL upload pattern.
6. **Section background is sage** (per the reference). Tone enforced by passing `tone="sage"` to the section wrapper from `site-shell.md`.
7. **No captions on photos in v1.**
8. **Single-row `storyContent` table**, separate from `siteSettings` so the body isn't loaded on every layout render.

## Implementation notes

- New table `storyContent`. Drizzle migration creates the singleton row at apply time.
- Section component at `src/app/(public)/[locale]/_sections/story/index.tsx`. Server Component fetches the singleton row and renders.
- Admin page at `src/app/(admin)/admin/site/story/page.tsx`. Server Component + Server Action.
- Photos rendered via `<Image>` from `next/image` with explicit `width` + `height` (e.g. 240×240) and `className="rounded-full"`.
- Upload reuses the signed-URL pattern from `photo-gallery.md`. Bucket `site`. Filename pattern `story/photo-{1,2,3}-<uuid>.<ext>`. Old paths are deleted from Storage when replaced.
- Validation: body capped at 3000 chars per locale; photo MIME type whitelist (`image/jpeg`, `image/png`, `image/webp`).
- Visual: matches the reference — sage block with the script title centered, three small circular photos in a row, body prose centered below in serif with comfortable line height.
- Accessibility: photos have explicit `alt` derived from a "couple photo {n}" pattern (no per-photo alt input in v1); the section uses `<section aria-labelledby="story-heading">` with the script title as `<h2>`.
- CSP impact: none (Supabase already covered).
