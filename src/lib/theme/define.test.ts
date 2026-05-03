import { describe, expect, it } from "vitest";
import { defineTheme, listPresets } from "./define";

describe("defineTheme", () => {
  it("resolves the aquarela-sage preset with all required tokens", () => {
    const theme = defineTheme("aquarela-sage");
    expect(theme.mode).toBe("light");
    expect(theme.colors.background).toMatch(/^#[0-9a-f]{6}$/i);
    expect(theme.colors.foreground).toMatch(/^#[0-9a-f]{6}$/i);
    expect(theme.colors.primary).toMatch(/^#[0-9a-f]{6}$/i);
    expect(theme.colors.card).toBeDefined();
    expect(theme.colors.border).toBeDefined();
    expect(theme.fontPair).toBe("allura-cormorant");
    expect(theme.radius.sm).toMatch(/rem$|px$/);
    expect(theme.radius.md).toMatch(/rem$|px$/);
    expect(theme.radius.lg).toMatch(/rem$|px$/);
    expect(theme.radius.full).toBe("9999px");
  });

  it("matches the documented aquarela-sage palette from docs/features/theme.md", () => {
    const theme = defineTheme("aquarela-sage");
    expect(theme.colors.background.toLowerCase()).toBe("#f4efe3");
    expect(theme.colors.foreground.toLowerCase()).toBe("#2d2a24");
    expect(theme.colors.primary.toLowerCase()).toBe("#7e8b6e");
  });

  it("applies a single-field override on top of a preset", () => {
    const theme = defineTheme("aquarela-sage", {
      colors: { primary: "#6b4423" },
    });
    expect(theme.colors.primary.toLowerCase()).toBe("#6b4423");
    expect(theme.colors.background.toLowerCase()).toBe("#f4efe3");
  });

  it("applies a deep multi-field override on top of a preset", () => {
    const theme = defineTheme("aquarela-sage", {
      colors: { primary: "#000000", background: "#ffffff" },
      mode: "dark",
    });
    expect(theme.colors.primary.toLowerCase()).toBe("#000000");
    expect(theme.colors.background.toLowerCase()).toBe("#ffffff");
    expect(theme.mode).toBe("dark");
  });

  it("accepts a fully custom theme when preset is null", () => {
    const theme = defineTheme(null, {
      mode: "light",
      colors: {
        background: "#ffffff",
        foreground: "#000000",
        card: "#fafafa",
        cardForeground: "#000000",
        primary: "#0070f3",
        primaryForeground: "#ffffff",
        secondary: "#eeeeee",
        secondaryForeground: "#111111",
        muted: "#f5f5f5",
        mutedForeground: "#777777",
        accent: "#ff0080",
        accentForeground: "#ffffff",
        border: "#dddddd",
        ring: "#0070f3",
      },
      radius: {
        sm: "0.25rem",
        md: "0.375rem",
        lg: "0.75rem",
        full: "9999px",
      },
      fontPair: "allura-cormorant",
      textureUrl: null,
    });
    expect(theme.colors.primary.toLowerCase()).toBe("#0070f3");
    expect(theme.fontPair).toBe("allura-cormorant");
  });

  it("throws on an unknown preset name", () => {
    expect(() =>
      defineTheme("does-not-exist" as never),
    ).toThrowError(/preset/i);
  });

  it("throws when a hex color is malformed", () => {
    expect(() =>
      defineTheme("aquarela-sage", {
        colors: { primary: "not-a-color" as never },
      }),
    ).toThrow();
  });

  it("throws when an unknown font pair is supplied", () => {
    expect(() =>
      defineTheme("aquarela-sage", {
        fontPair: "comic-papyrus" as never,
      }),
    ).toThrow();
  });

  it("throws when defining a fully custom theme misses required fields", () => {
    expect(() =>
      defineTheme(null, {
        mode: "light",
        colors: { primary: "#000000" } as never,
      } as never),
    ).toThrow();
  });

  it("listPresets returns at least aquarela-sage", () => {
    const names = listPresets();
    expect(names).toContain("aquarela-sage");
  });

  it("aquarela-sage exposes a paper-texture URL pointing at the bundled asset", () => {
    const theme = defineTheme("aquarela-sage");
    expect(theme.textureUrl).toBe("/themes/aquarela-sage/paper.jpg");
  });

  it("textureUrl can be overridden to a different absolute path", () => {
    const theme = defineTheme("aquarela-sage", {
      textureUrl: "/themes/custom/another-paper.jpg",
    });
    expect(theme.textureUrl).toBe("/themes/custom/another-paper.jpg");
  });

  it("textureUrl can be overridden to null to disable the overlay", () => {
    const theme = defineTheme("aquarela-sage", { textureUrl: null });
    expect(theme.textureUrl).toBeNull();
  });

  it("textureUrl rejects bare relative strings (must start with / or http)", () => {
    expect(() =>
      defineTheme("aquarela-sage", { textureUrl: "paper.jpg" as never }),
    ).toThrow();
  });

  it("textureUrl accepts an https:// URL", () => {
    const theme = defineTheme("aquarela-sage", {
      textureUrl: "https://cdn.example.com/paper.jpg",
    });
    expect(theme.textureUrl).toBe("https://cdn.example.com/paper.jpg");
  });
});
