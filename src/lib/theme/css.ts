import type { Theme } from "./types";

const colorVarMap: Record<keyof Theme["colors"], string> = {
  background: "--color-background",
  foreground: "--color-foreground",
  card: "--color-card",
  cardForeground: "--color-card-foreground",
  primary: "--color-primary",
  primaryForeground: "--color-primary-foreground",
  secondary: "--color-secondary",
  secondaryForeground: "--color-secondary-foreground",
  muted: "--color-muted",
  mutedForeground: "--color-muted-foreground",
  accent: "--color-accent",
  accentForeground: "--color-accent-foreground",
  border: "--color-border",
  ring: "--color-ring",
};

const radiusVarMap: Record<keyof Theme["radius"], string> = {
  sm: "--radius-sm",
  md: "--radius-md",
  lg: "--radius-lg",
  full: "--radius-full",
};

export function themeToCssVars(theme: Theme): Record<string, string> {
  const out: Record<string, string> = {};
  for (const key of Object.keys(theme.colors) as (keyof Theme["colors"])[]) {
    out[colorVarMap[key]] = theme.colors[key];
  }
  for (const key of Object.keys(theme.radius) as (keyof Theme["radius"])[]) {
    out[radiusVarMap[key]] = theme.radius[key];
  }
  // Background texture: emit a fully-formed url(...) value so the variable
  // can be plugged straight into `background-image:`. When unset, emit
  // `none` so the property has a valid CSS value.
  out["--background-texture"] = theme.textureUrl
    ? `url("${theme.textureUrl}")`
    : "none";
  // How opaque the colour overlay sitting on top of the texture is.
  // `color-mix(in srgb, var(--color-background) var(--background-texture-overlay), transparent)`
  // produces the rgba so consumers don't have to reach back into the hex.
  out["--background-texture-overlay"] = `${theme.textureOverlay}%`;
  return out;
}

export function themeToCssBlock(theme: Theme): string {
  const vars = themeToCssVars(theme);
  const lines = Object.entries(vars).map(([k, v]) => `  ${k}: ${v};`);
  return `:root {\n${lines.join("\n")}\n}`;
}
