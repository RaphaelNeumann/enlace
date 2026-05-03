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

export const fontPairSchema = z.enum(["pinyon-cormorant"]);

/**
 * Optional paper-texture image overlaid on the page background. Accepts
 * either an absolute URL (https://…) or a path relative to the public root
 * (e.g. /themes/aquarela-sage/paper.jpg). `null` disables the overlay.
 */
export const textureUrlSchema = z
  .string()
  .min(1)
  .refine(
    (s) => s.startsWith("/") || /^https?:\/\//.test(s),
    "expected an absolute URL or a path starting with /",
  )
  .nullable();

/**
 * How much of `colors.background` is painted on top of the texture, as a
 * percentage 0..100. 0 = pure texture (no tint); 100 = solid colour
 * (texture invisible). Tweak per fork to dial how present the paper feels.
 */
export const textureOverlaySchema = z.number().min(0).max(100);

export const themeSchema = z.object({
  mode: z.enum(["light", "dark"]),
  colors: themeColorsSchema,
  radius: themeRadiusSchema,
  fontPair: fontPairSchema,
  textureUrl: textureUrlSchema.default(null),
  textureOverlay: textureOverlaySchema.default(70),
});

export type Theme = z.infer<typeof themeSchema>;
export type ThemeColors = z.infer<typeof themeColorsSchema>;
export type ThemeRadius = z.infer<typeof themeRadiusSchema>;
export type FontPair = z.infer<typeof fontPairSchema>;
