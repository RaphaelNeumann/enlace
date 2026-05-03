import type { Theme } from "./types";

export const aquarelaSage: Theme = {
  mode: "light",
  colors: {
    background: "#F4EFE3",
    foreground: "#2D2A24",
    card: "#FBF8F0",
    cardForeground: "#2D2A24",
    primary: "#7E8B6E",
    primaryForeground: "#F4EFE3",
    secondary: "#D8D4C8",
    secondaryForeground: "#2D2A24",
    muted: "#E8E2D2",
    mutedForeground: "#5A554A",
    accent: "#C9A89F",
    accentForeground: "#2D2A24",
    border: "#7E8B6E",
    ring: "#7E8B6E",
  },
  radius: {
    sm: "0.25rem",
    md: "0.375rem",
    lg: "0.75rem",
    full: "9999px",
  },
  fontPair: "allura-cormorant",
  textureUrl: "/themes/aquarela-sage/paper.jpg",
};

export const presets = {
  "aquarela-sage": aquarelaSage,
} as const;

export type PresetName = keyof typeof presets;
