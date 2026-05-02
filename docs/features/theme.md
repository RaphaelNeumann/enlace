# Theme configuration

## Goal

Let the site owner customize the visual identity (colors, typography, etc.) of the entire site by editing a single config file. The forker should not need to learn Tailwind or touch component code to make the site visually theirs.

## In scope / out of scope

- **IN**:
  - Color palette (primary, secondary, neutrals, semantic colors).
  - Typography: heading font, body font, optional accent/script font for couple names and date headlines.
  - Border-radius scale (sharp / soft / pill).
  - Single light **or** dark mode (forker picks one per fork — see Open decisions #2).
- **OUT** of v1, deferred to a later iteration:
  - Layout reordering / section composition (the order of sections is fixed in v1; the forker hides/shows sections via flags in `wedding.config.ts`, but does not move them around).
  - Per-section theme overrides (gallery with a different background than the hero, etc.).
  - Custom CSS injection by the forker.
  - Pattern / texture / illustration backgrounds.
  - Animation tuning.
  - Light + dark in the same fork (with auto/system toggle).

## UX flow

The forker edits `src/config/theme.config.ts`, which exports a typed object. The values are turned into CSS variables on `<html>` at render time; Tailwind v4 and shadcn components consume those variables, so no component code changes.

The forker picks one of the bundled preset themes and (optionally) overrides individual fields:

```ts
// src/config/theme.config.ts
import { defineTheme } from "@/lib/theme";

export default defineTheme("classic-elegance", {
  // optional overrides on top of the preset
  colors: { primary: "#6b4423" },
});
```

Available presets are documented in the README. A forker who wants a fully custom palette can pass `defineTheme(null, { ... })` with all fields supplied.

### Bundled presets (v1)

| Name | Mode | Vibe | Display font | Body font | Primary | Background |
| --- | --- | --- | --- | --- | --- | --- |
| `aquarela-sage` | light | Watercolor romantic — cream paper, sage green, calligraphic script | Allura | Cormorant Garamond | `#7E8B6E` | `#F4EFE3` |

`aquarela-sage` is the **default** preset for the template skeleton (`wedding.config.ts` ships with `defineTheme("aquarela-sage", {})`). It is modeled after the reference design provided by the owner (`/workspace/site.pdf`).

Additional presets (`modern-minimal`, `monochrome`, `rustic`, etc.) can ship in v1.1+ once the framework is exercised by the first preset.

### `aquarela-sage` token values

```ts
{
  mode: "light",
  colors: {
    background: "#F4EFE3",        // cream paper
    foreground: "#2D2A24",        // dark brown
    card: "#FBF8F0",              // very light cream (cards)
    cardForeground: "#2D2A24",
    primary: "#7E8B6E",           // sage green
    primaryForeground: "#F4EFE3",
    secondary: "#D8D4C8",         // light sage-gray (secondary surfaces)
    secondaryForeground: "#2D2A24",
    muted: "#E8E2D2",             // muted background panels
    mutedForeground: "#5A554A",
    accent: "#C9A89F",            // rose touches (sparingly)
    accentForeground: "#2D2A24",
    border: "#7E8B6E",            // used at varying opacities for thin frames
    ring: "#7E8B6E",
  },
  radius: {
    sm: "0.25rem",   // 4px
    md: "0.375rem",  // 6px — default for buttons
    lg: "0.75rem",   // 12px — cards
    full: "9999px",  // pills
  },
  fontPair: "allura-cormorant",
}
```

The `allura-cormorant` font pair (registered in `src/lib/theme/fonts.ts`) loads:
- **Display / script**: `Allura` (Google Fonts) → exposed as `--font-display`.
- **Body / serif**: `Cormorant Garamond` (Google Fonts), weights 400/500/600 with `latin` and `latin-ext` subsets → exposed as `--font-body`.
- The body font's **small-caps** variant drives the all-caps tracked headings (`DOMINGO, 20 DE OUTUBRO DE 2026 ÀS 16H00`, button labels, location lines). Implemented via the CSS `font-variant: small-caps` plus `letter-spacing: 0.08em` rather than a separate font.

No third script font is needed — `Allura` covers all calligraphic uses (couple names, section headings).

## Data model

None. This is build-time configuration; no DB tables.

## Permissions

Forker (compile-time). End users do not interact with this file at runtime.

## Decisions

1. **Scope is visual only.** Colors, typography, radius, mode. Layout/section ordering stays out of v1; sections can be hidden via flags in `wedding.config.ts` but cannot be reordered.
2. **One mode per fork.** `theme.config.ts` declares `mode: "light" | "dark"`. No light/dark toggle in v1.
3. **Preset + overrides + escape hatch.** Ship 3-5 curated presets. `defineTheme("preset-name", { … })` applies a preset and accepts per-field overrides; `defineTheme(null, { … })` accepts a fully custom palette.
4. **Curated font pairings via preset.** `next/font/google` imports for each supported font pair live in `src/lib/theme/fonts.ts`; the theme config picks one by name. Forker does not touch `next/font` directly.
5. **No decorative ornaments in v1.** Floral dividers / monograms / illustrations are deferred to a separate "ornaments" feature. v1 is typography-driven.
6. **Separate config file.** `src/config/theme.config.ts` lives alongside `wedding.config.ts` (presentation vs content; different change cadences).

## Implementation notes

- Tailwind v4 uses CSS-variable design tokens via `@theme` in CSS. shadcn under `base-nova` already uses `--primary`, `--background`, `--foreground`, `--radius`, etc.
- Approach: at root layout, render a `<style>` block containing the resolved CSS variables for the active theme. Components stay untouched and read from the variables (which is already how shadcn works).
- Light vs dark is just a different value set for the same CSS variables, applied via a class on `<html>` (`<html class="dark">` or `light`).
- Fonts: `src/lib/theme/fonts.ts` declares `next/font/google` imports for every supported font pair (e.g. Playfair + Cormorant, Italiana + Lora, etc.). The active preset selects one and exposes its CSS variables (`--font-display`, `--font-body`, `--font-script`). Unused fonts are tree-shaken because Next analyzes static imports.
- Validate the resolved theme with Zod at module load — typos in color values or unknown presets fail fast at build time instead of producing silently-broken styles.
- Update the README "Stack" section once implemented, and add a "Theme presets" section listing what's available with screenshots.
- CSP impact: none. All assets self-hosted via `next/font` (already covered by `'self'`).
