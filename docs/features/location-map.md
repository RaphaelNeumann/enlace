# Location & maps

## Goal

Define how venue addresses link to maps services across the site. The reference site (`/workspace/site.pdf`) uses **external Google Maps URLs** rather than embedded iframes — clicking the "Google Maps" link opens the user's preferred maps app in a new tab. This doc settles that posture for v1 and surfaces the env / config plumbing.

## In scope / out of scope

- **IN**:
  - Per-card `mapsUrl` field on the Programação cards (already defined in `ceremony-reception.md`) used as an external link only.
  - Optional global `siteSettings.venueAddressForMaps` (a single canonical address used for SEO `LocalBusiness` schema, OG card, and any "site-level" maps reference).
  - Documentation in the README for the couple on how to obtain a shareable Google Maps URL (Right-click in Maps → "Share" → "Copy link").
- **OUT** of v1, deferred:
  - Embedded iframes from Google Maps / Mapbox / OpenStreetMap. v1 is link-only. Embed adds CSP work (`frame-src`), API keys, and visual complexity not present in the reference.
  - Custom map styles / branded markers.
  - Driving directions / transit suggestions.
  - "Get directions from your location" buttons. The user's chosen maps app handles this on the open URL.
  - A separate "Como chegar" section beyond the Programação cards. The reference doesn't have one; if needed later, the couple uses `tips.md`.

## UX flow

### Public visitor

1. On the Programação section, each card shows a "Google Maps" link with a pin icon.
2. Tapping the link opens `mapsUrl` in a new tab (`target="_blank" rel="noopener"`). The user's preferred maps app handles the rest.
3. Same pattern in `tips.md` external links (e.g. hotels, restaurants) — shared `<a>` styling, no embed.

### Admin

- The admin already edits `mapsUrl` per card in `/admin/site/programacao` (per `ceremony-reception.md`).
- A new "Endereço para mapas" field on `/admin/site` populates `siteSettings.venueAddressForMaps` for SEO uses.

## Data model

No new tables. Two existing fields cover the use cases:

- `programacaoCards.mapsUrl` (already in `ceremony-reception.md`).
- `siteSettings.venueAddressForMaps` (added by this doc):

```ts
siteSettings: {
  // ...all existing columns
  venueAddressForMaps: text (nullable)        // free-form address string used in SEO schema and OG card
}
```

## Permissions

- **Public** — clicks the link.
- **`COUPLE` / `CEREMONIAL`** — edit the URL via `/admin/site/programacao` (per-card) and `/admin/site` (global address).

## Decisions

1. **External link only, no embed.** Matches the reference; avoids CSP `frame-src` work and Google Maps API keys.
2. **`mapsUrl` is validated as `https://…`** but otherwise accepts any maps service URL (Google Maps, Apple Maps, Waze). The couple controls which service their guests land on by choosing the URL.
3. **Global venue address** lives on `siteSettings.venueAddressForMaps` for SEO/OG; per-card addresses are the visible labels in the Programação cards.
4. **No "Get directions" client integration in v1.** The maps app handles it.
5. **Tips section external links use the same `<a target="_blank">` posture** (already in `tips.md`).
6. **README adds a small how-to** for non-technical forkers on getting a shareable Maps URL.

## Implementation notes

- Single shared component `<ExternalLinkButton href={url} icon={MapPin}>Google Maps</ExternalLinkButton>` used by Programação and Tips. Lives in `src/components/external-link-button.tsx`.
- SEO: a Server Component in the public layout emits a JSON-LD `LocalBusiness` (or `Event`) script if `siteSettings.venueAddressForMaps` is set. JSON-LD is inert HTML, no CSP change.
- OG image fallback (per `site-shell.md`) can include the address as text.
- Validation: `mapsUrl` and any other URL fields use the same Zod URL schema (`z.string().url().startsWith("https://")`).
- CSP impact: none. `<a>` links don't require any directive change.
- Accessibility: `aria-label="Abrir endereço no Google Maps (abre em nova aba)"` on the link; visible icon + text label.
