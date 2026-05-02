# FAQ

## Goal

A simple list of frequently asked questions and answers, managed by the couple via the admin and rendered on the public home as an accordion. The reference site (`/workspace/site.pdf`) doesn't include FAQ in its v1 layout, but the README roadmap lists it. This doc keeps the surface deliberately small so it slots into the home without disrupting the reference's pacing.

## In scope / out of scope

- **IN**:
  - Admin CRUD on FAQ entries at `/admin/faq`: create, edit, delete, reorder, toggle visibility.
  - Public render: a single section on the home with an accordion (one open at a time) listing all visible entries.
  - Bilingual fields (PT + EN, EN nullable, falls back to PT).
  - Section visibility flag on `siteSettings.showFaq` (per `site-shell.md`).
- **OUT** of v1, deferred:
  - Categories / sections within the FAQ. Single flat list in v1; if the couple wants categorization later they can use `tips.md` instead.
  - Search within the FAQ.
  - Markdown / rich text in answers (plain text with `\n` only).
  - Per-entry icons.
  - Anchored / shareable links to specific questions (`#faq-1`).
  - Auto-generated FAQ from common wedding questions.

## UX flow

### Public visitor

1. Section appears near the bottom of the home (between Tips and the closing footer).
2. Title in script ("Perguntas frequentes" / "FAQ" via i18n).
3. Each visible entry is an accordion row: question (closed state shows just the question text); clicking expands to reveal the answer below.
4. Only one entry is open at a time (clicking another closes the previous).
5. Empty state: section is omitted entirely if no visible entries exist.

### Admin (`/admin/faq`)

1. List of entries with reorder + visibility controls + edit / delete.
2. Click "Adicionar" → form: question (PT / EN), answer (PT / EN). Submit → `revalidatePath("/")`.
3. Drag handle on each row to reorder.

## Data model

```ts
faqEntries: {
  id: uuid PRIMARY KEY
  questionPt: text
  questionEn: text (nullable — falls back to questionPt)
  answerPt: text
  answerEn: text (nullable — falls back to answerPt)
  position: integer
  isVisible: boolean DEFAULT true
  createdAt: timestamp
  updatedAt: timestamp
}
```

## Permissions

- **Public** — read visible entries.
- **`COUPLE` / `CEREMONIAL`** — full CRUD. Both roles identical.

## Decisions

1. **Single flat list**, no categories in v1.
2. **Bilingual fields**, EN nullable, falls back to PT.
3. **One-at-a-time accordion** (selecting another collapses the first).
4. **Plain text answers** with `\n` preserved. No markdown.
5. **Manual ordering** via drag handle in admin (`position` column).
6. **Visibility flag per entry** so the couple can stage drafts.
7. **Section-level visibility** on `siteSettings.showFaq`.
8. **No anchored / shareable links** in v1 (could be added without breaking data later).
9. **Empty section auto-hides** when no visible entries exist.

## Implementation notes

- New table `faqEntries` in `src/lib/db/schema.ts`.
- Public section component at `src/app/(public)/[locale]/_sections/faq/index.tsx`. Server Component fetches visible entries; a Client Component island handles the accordion open/close state (uses shadcn `Accordion`, single-mode).
- Admin page at `src/app/(admin)/admin/faq/`:
  - `page.tsx` — list with drag-reorder + visibility toggle.
  - `new/page.tsx`, `[id]/page.tsx` — create / edit forms.
  - Server Actions check `auth()`, assert role, validate with Zod, mutate via Drizzle, `revalidatePath("/")` and `/admin/faq`.
- Validation: `questionPt` ~200 chars, `answerPt` ~2000 chars (plain text, `\n` preserved). Same caps for EN.
- Reorder: `position` integer column; admin sends `[id]` array on drop; Server Action updates positions in a transaction.
- Visual: matches the reference's tone — script section title, cream tone, serif body, sage divider lines between entries; chevron icon rotates when an entry expands.
- Accessibility: shadcn `Accordion` already covers `aria-expanded` and keyboard navigation; section uses `<section aria-labelledby="faq-heading">` with the script title as `<h2>`.
- CSP impact: none.
- Empty state on the public side: section returns `null` when zero visible entries exist (avoids an empty heading). Admin shows an empty state with a "Adicionar primeira pergunta" CTA.
