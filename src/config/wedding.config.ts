import { defineTheme } from "@/lib/theme";

/**
 * Wedding configuration — compile-time only.
 *
 * Editorial content (couple names, dates, venue, story, etc.) lives in DB
 * tables and is edited via /admin (see CLAUDE.md "Design principle:
 * admin-editable content"). Only the values below are committed:
 *
 *   - theme: the visual preset selection (locked at deploy time).
 *   - defaultLocale: the locale used when the visitor has no preference.
 *   - rsvp.mode: "closed" or "open"; locked at first deploy.
 *   - rsvp.openModeMaxPlusOnes: cap for plus-ones in open mode.
 *   - site.timezone: IANA timezone for date formatting.
 */
export const theme = defineTheme("aquarela-sage");

export const wedding = {
  defaultLocale: "pt" as const,

  rsvp: {
    mode: "closed" as const,
    openModeMaxPlusOnes: 0,
  },

  site: {
    timezone: "America/Sao_Paulo",
  },
} as const;

export type WeddingConfig = typeof wedding;
