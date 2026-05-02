# Photo gallery

## Goal

A photo gallery managed by the couple via the admin panel and displayed publicly on the home page (or as its own subpage if it grows large). Photos are uploaded to Supabase Storage; the couple can reorder them, set captions, and toggle visibility per photo.

The reference site (`/workspace/site.pdf`) does not include a dedicated photo gallery beyond the three couple photos in `story.md`, but the README roadmap lists it as a v1 feature. This doc defines it in case the couple wants to add a richer gallery later.

## In scope / out of scope

- **IN**:
  - Admin CRUD on photos at `/admin/photo-gallery`: upload (one or many), reorder via drag, edit caption (PT/EN), toggle visibility, delete.
  - Public display: a responsive grid on the home page (or its own subpage if `siteSettings.photoGalleryAsSubpage = true`).
  - Photos uploaded to Supabase Storage `gallery` bucket via signed-URL Server Action (same pattern as `gifts.md`).
  - Image optimization via Next.js `<Image>` with `remotePatterns` pointing at Supabase. Next.js generates WebP and multiple sizes; Supabase bandwidth stays low.
  - Optional captions (PT + EN), nullable. Plain text.
  - Visibility flag per photo (`isVisible`); the section as a whole respects `siteSettings.showPhotoGallery`.
- **OUT** of v1, deferred:
  - Lightbox / fullscreen modal on click. v1 just shows the grid.
  - Multi-photo upload via drag-drop into the page. v1 uses one upload at a time (couple uploads from a curated set anyway).
  - EXIF / metadata extraction.
  - Auto-cropping. Couple uploads at the aspect ratio they want; the grid uses `object-fit: cover`.
  - Albums / collections. Single flat list in v1.
  - Public commenting on photos.
  - Live photo wall (guests upload during the event).
  - Slideshow / autoplay.

## UX flow

### Couple / planner (admin)

1. Open `/admin/photo-gallery`. See current photos in the same grid layout the public sees, plus per-photo controls (drag handle, edit, visibility toggle, delete).
2. Click "Adicionar foto" → file picker → file uploaded via signed URL → row inserted, grid re-renders. Image processing (validation, MIME check) happens in the Server Action.
3. Edit a photo: caption fields (PT/EN), visibility toggle. Save → `revalidatePath("/")`.
4. Drag to reorder. Reorder commits server-side on drop.
5. Delete: confirmation dialog, then Server Action removes the row + the Storage file.

### Public visitor

1. On the home (or `/photos` if subpage mode is on), the gallery section renders a responsive grid: 2 columns on mobile, 3 on tablet, 4 on desktop.
2. Each photo lazy-loads via `<Image>`; captions are shown on hover (desktop) and below the image (mobile).
3. No lightbox in v1; clicking a photo does nothing (or a future v2 enhancement).

## Data model

```ts
photos: {
  id: uuid PRIMARY KEY
  storagePath: text                          // Supabase Storage path in `gallery` bucket
  captionPt: text (nullable)
  captionEn: text (nullable — falls back to captionPt)
  position: integer                           // for manual reorder
  isVisible: boolean DEFAULT true
  createdAt: timestamp
  updatedAt: timestamp
}
```

Plus a flag added to `siteSettings` for the optional subpage mode:

```ts
siteSettings: {
  // ...all existing columns
  photoGalleryAsSubpage: boolean DEFAULT false   // false: render inline on home; true: render at /photos with a teaser on home
}
```

## Permissions

- **Public** — read visible photos only.
- **`COUPLE` / `CEREMONIAL`** — full CRUD on photos. Both roles identical.

## Decisions

1. **Single bucket `gallery`**, public per the README's Photo gallery section.
2. **Upload via signed-URL Server Action** (one file at a time in v1, like `gifts.md`). Direct browser upload to Supabase, then server records the path.
3. **Optional captions** (PT + EN), nullable.
4. **Manual ordering via drag handle** in admin. `position` integer column, update on drop.
5. **No lightbox in v1.** Grid only.
6. **`<Image>` from `next/image`** with `remotePatterns` pointing at the Supabase bucket origin. CSP `img-src` adds the bucket origin (already noted in `gifts.md`).
7. **Inline on home by default**; optional subpage mode via `siteSettings.photoGalleryAsSubpage`. Gives couples the choice without designing two products.
8. **Visibility flag per photo** so the couple can stage photos before publishing.
9. **Section visibility flag**: `siteSettings.showPhotoGallery` toggles the whole section.
10. **No live photo wall in v1** (deferred to a separate feature).

## Implementation notes

- New table `photos` in `src/lib/db/schema.ts`. New column `photoGalleryAsSubpage` on `siteSettings`.
- Admin pages under `src/app/(admin)/admin/photo-gallery/`:
  - `page.tsx` — grid with drag-reorder, per-photo controls.
  - `actions.ts` — Server Actions: `createSignedUploadUrl`, `recordPhoto`, `updatePhoto`, `reorderPhotos`, `deletePhoto`. Each calls `auth()`, asserts role, validates with Zod.
- Public section component at `src/app/(public)/[locale]/_sections/photo-gallery/index.tsx`. Server Component.
- Optional subpage at `src/app/(public)/[locale]/photos/page.tsx` that renders the same grid full-bleed when `photoGalleryAsSubpage = true`.
- Image rendering: `<Image src={supabasePublicUrl(storagePath)} alt={caption ?? ""} sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw" />`. Aspect ratio enforced via CSS `aspect-ratio: 1 / 1` + `object-fit: cover`.
- Validation: MIME whitelist (`image/jpeg`, `image/png`, `image/webp`); max file size 10 MB; caption ~200 chars per locale.
- Reorder: when a drop happens, the client sends the new order as an array of ids; the Server Action updates `position` for each in a transaction.
- Delete cascade: removing a photo also removes the Storage file (best-effort; if the Storage delete fails the DB row is still removed and the orphan is acceptable).
- CSP impact: `img-src https://<project>.supabase.co` (shared with `gifts.md`).
- Accessibility: each grid item is an `<article>` with the caption as `<figcaption>`; `<Image alt="">` set when captions are absent, screen readers skip; hover-only captions also rendered visibly on mobile.
