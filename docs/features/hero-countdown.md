# Hero & countdown

## Goal

The first impression of the public site: monogram, couple names in a calligraphic display font, the wedding date in small-caps tracked serif, a watercolor illustration of the venue, and a discreet countdown to the wedding day. Mirrors the top of the reference site (`/workspace/site.pdf`, page 1, section 0).

## In scope / out of scope

- **IN**:
  - Monogram at the very top (rendered by `site-shell.md`'s monogram component).
  - Couple names rendered in `--font-display` (Allura), connected by a script "&".
  - Subtitle line in small-caps tracked serif: "DOMINGO, 20 DE OUTUBRO DE 2026 ÀS 16H00" — day-of-week, date, time, derived from `siteSettings.weddingDate` formatted in the active locale.
  - A central watercolor illustration of the venue, uploaded by the couple via `/admin/site` and stored in the Supabase `site` bucket. Falls back to a neutral default if not uploaded.
  - A countdown showing "X dias / Y horas" to the wedding date. Hides automatically once the date has passed.
  - All copy comes from `siteSettings` (per `site-shell.md`); no hardcoded text in the component.
- **OUT** of v1, deferred:
  - Animated countdown (live ticking seconds). v1 renders on page load; refresh updates.
  - Scrolling animation / parallax on the hero image.
  - Multiple alternate hero illustrations (one per language, etc.).
  - Background video.
  - Inline RSVP CTA in the hero (the Programação section already has the "Confirme sua presença" button).
  - Save-the-date countdown variant for a different audience (e.g. pre-invite teaser).

## UX flow

1. Visitor lands on `/`. The page renders the monogram, then the couple names in display script, then the subtitle line, then the venue illustration, then the countdown.
2. Countdown shows `{daysRemaining} dias` for `daysRemaining > 1`, `1 dia` for the day before, "Hoje" on the day itself, and is omitted entirely after `weddingDate + 1 day` (so the hero stays clean post-wedding).
3. After the wedding has passed, the hero shows the names, subtitle, and illustration without the countdown — useful as a memento page.
4. Mobile: same vertical stack with adjusted type sizes via theme-defined fluid scale.

## Data model

Reads from the singleton `siteSettings` row (defined by `site-shell.md`). No new tables.

Fields read:
- `partner1Name`, `partner2Name`, `partnersOrder`
- `weddingDate`, `weddingTimeZone`
- `venueShortName` (used in subtitle if the locale layout includes it)
- The hero illustration path is on `siteSettings.heroIllustrationStoragePath` (added in this doc).

Schema additions to `siteSettings`:

```ts
siteSettings: {
  // ...all the columns from site-shell.md
  heroIllustrationStoragePath: text (nullable)  // Supabase Storage path; null → bundled default
}
```

## Permissions

- **Public** — read-only render of the hero.
- **`COUPLE` / `CEREMONIAL`** — manage the hero illustration via `/admin/site` (the same form that owns the rest of `siteSettings`). Both roles have identical permissions.

## Decisions

1. **Countdown granularity is days only.** Hours / minutes / seconds add visual noise and require client-side ticking; "X dias" is enough for a wedding website.
2. **Countdown auto-hides 24h after the wedding has started.** The hero stays usable as a memento page; no "happened N days ago" reverse counter in v1.
3. **Venue illustration is admin-uploaded** (Supabase `site` bucket), with a bundled neutral default for fresh forks. Reuses the signed-URL upload pattern from `gifts.md` / `photo-gallery.md`.
4. **Subtitle is auto-formatted** from `siteSettings.weddingDate` + `weddingTimeZone` + active locale via `Intl.DateTimeFormat`. The forker / admin doesn't write the string by hand.
5. **No inline RSVP CTA in the hero.** The Programação section (next, per the reference) carries the "Confirme sua presença" button; duplicating the CTA in the hero would violate the reference's pacing.
6. **Server-rendered, no client island.** The hero is fully static per request; the countdown uses the request timestamp. No live ticking.

## Implementation notes

- New section component at `src/app/(public)/[locale]/_sections/hero/index.tsx`. Server Component.
- Reads `siteSettings` once in the parent layout (per `site-shell.md`); receives the relevant fields as props.
- Subtitle formatting: `Intl.DateTimeFormat(locale, { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone })` for the date; a separate `Intl.DateTimeFormat` for the time. Result is uppercased + tracked via CSS (`text-transform: uppercase; letter-spacing: 0.08em`).
- Countdown computation: `const days = Math.ceil((weddingDate - now) / dayMs)`; rendered in the active locale ("dias" / "days"). Hidden when `now > weddingDate + 24h`.
- Venue illustration: `<Image>` from `next/image` with Supabase URL or the bundled default at `public/themes/aquarela-sage/hero-default.png`. `priority` + `fetchPriority="high"` since it's above the fold.
- The hero respects `siteSettings.showHero`; if false, returns `null`.
- Visual: matches the reference — large script names with vertical "&" between them, thin sage frame around the illustration block, generous vertical spacing. Theme tokens (`--color-primary`, `--font-display`, `--font-body`) come from `theme.md`.
- Accessibility: the names are in an `<h1>` (the only h1 on the page); the illustration `<img>` has an `alt` derived from `venueShortName`; the countdown is announced by an `aria-live="polite"` region only when present.
- CSP impact: bundled default illustration is `'self'`; Supabase Storage is already covered by `gifts.md` / `photo-gallery.md` `img-src` additions.
- README "Roadmap" entry for hero/countdown can be marked done once this lands.
