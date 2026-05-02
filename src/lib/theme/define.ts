import { presets, type PresetName } from "./presets";
import { themeSchema, type Theme } from "./types";

type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K];
};

function deepMerge<T extends Record<string, unknown>>(
  base: T,
  patch: DeepPartial<T>,
): T {
  const out: Record<string, unknown> = { ...base };
  for (const [key, value] of Object.entries(patch)) {
    if (value === undefined) continue;
    const baseValue = (base as Record<string, unknown>)[key];
    if (
      baseValue !== null &&
      typeof baseValue === "object" &&
      !Array.isArray(baseValue) &&
      value !== null &&
      typeof value === "object" &&
      !Array.isArray(value)
    ) {
      out[key] = deepMerge(
        baseValue as Record<string, unknown>,
        value as Record<string, unknown>,
      );
    } else {
      out[key] = value;
    }
  }
  return out as T;
}

export function defineTheme(
  preset: PresetName,
  overrides?: DeepPartial<Theme>,
): Theme;
export function defineTheme(preset: null, full: Theme): Theme;
export function defineTheme(
  preset: PresetName | null,
  overridesOrFull?: DeepPartial<Theme> | Theme,
): Theme {
  let candidate: unknown;
  if (preset === null) {
    candidate = overridesOrFull;
  } else {
    const base = presets[preset];
    if (!base) {
      throw new Error(
        `Unknown theme preset "${preset}". Known presets: ${Object.keys(presets).join(", ")}`,
      );
    }
    candidate = overridesOrFull
      ? deepMerge(base, overridesOrFull as DeepPartial<Theme>)
      : base;
  }
  return themeSchema.parse(candidate);
}

export function listPresets(): PresetName[] {
  return Object.keys(presets) as PresetName[];
}
