import { Allura, Cormorant_Garamond } from "next/font/google";

export const fontAllura = Allura({
  weight: "400",
  subsets: ["latin", "latin-ext"],
  variable: "--font-display",
  display: "swap",
});

export const fontCormorant = Cormorant_Garamond({
  weight: ["400", "500", "600"],
  subsets: ["latin", "latin-ext"],
  variable: "--font-body",
  display: "swap",
});

export const allFontVariables = [fontAllura.variable, fontCormorant.variable].join(" ");
