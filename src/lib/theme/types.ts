import { z } from "zod";

const hex = z.string().regex(/^#[0-9a-fA-F]{6}$/, "expected #RRGGBB hex color");
const rem = z.string().regex(/^(\d+(\.\d+)?(rem|px)|9999px)$/, "expected rem/px size");

export const themeColorsSchema = z.object({
  background: hex,
  foreground: hex,
  card: hex,
  cardForeground: hex,
  primary: hex,
  primaryForeground: hex,
  secondary: hex,
  secondaryForeground: hex,
  muted: hex,
  mutedForeground: hex,
  accent: hex,
  accentForeground: hex,
  border: hex,
  ring: hex,
});

export const themeRadiusSchema = z.object({
  sm: rem,
  md: rem,
  lg: rem,
  full: rem,
});

export const fontPairSchema = z.enum(["allura-cormorant"]);

export const themeSchema = z.object({
  mode: z.enum(["light", "dark"]),
  colors: themeColorsSchema,
  radius: themeRadiusSchema,
  fontPair: fontPairSchema,
});

export type Theme = z.infer<typeof themeSchema>;
export type ThemeColors = z.infer<typeof themeColorsSchema>;
export type ThemeRadius = z.infer<typeof themeRadiusSchema>;
export type FontPair = z.infer<typeof fontPairSchema>;
