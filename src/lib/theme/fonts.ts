import localFont from "next/font/local";
import { Cormorant_Garamond, Cinzel } from "next/font/google";

/**
 * Boheme Floral — commercial display font, licensed by the project owner
 * and hosted locally at src/fonts/BohemeFloral.ttf. next/font/local
 * inlines and self-hosts it (no external CDN, no CSP entry needed).
 *
 * Generous swash caps, floral flourishes, drawn strokes — the most
 * "wedding-invitation" feel available so far.
 */
export const fontDisplay = localFont({
  src: "../../fonts/BohemeFloral.ttf",
  variable: "--font-display",
  display: "swap",
  weight: "400",
  style: "normal",
});

export const fontCormorant = Cormorant_Garamond({
  weight: ["400", "500", "600"],
  subsets: ["latin", "latin-ext"],
  variable: "--font-body",
  display: "swap",
});

/**
 * Cinzel — Roman/engraved serif used for the wedding-invitation date line
 * and countdown. Pairs cleanly with Boheme Floral (display) and Cormorant
 * Garamond (body), and reads well in tracked-caps small sizes.
 */
export const fontCinzel = Cinzel({
  weight: ["400", "500", "600"],
  subsets: ["latin", "latin-ext"],
  variable: "--font-caps",
  display: "swap",
});

export const allFontVariables = [
  fontDisplay.variable,
  fontCormorant.variable,
  fontCinzel.variable,
].join(" ");
