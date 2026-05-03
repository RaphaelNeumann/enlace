import { Pinyon_Script, Cormorant_Garamond } from "next/font/google";

/**
 * Pinyon Script is the classic copperplate-style wedding-invitation
 * calligraphy. Long descenders, generous flourishes on capitals, drawn
 * strokes — much more ornate than the previous Allura. Single weight
 * (400) on Google Fonts.
 */
export const fontDisplay = Pinyon_Script({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

export const fontCormorant = Cormorant_Garamond({
  weight: ["400", "500", "600"],
  subsets: ["latin", "latin-ext"],
  variable: "--font-body",
  display: "swap",
});

export const allFontVariables = [fontDisplay.variable, fontCormorant.variable].join(" ");
