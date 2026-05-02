import { describe, expect, it } from "vitest";
import { defineTheme } from "./define";
import { themeToCssVars, themeToCssBlock } from "./css";

describe("themeToCssVars", () => {
  it("emits one CSS variable per color token", () => {
    const theme = defineTheme("aquarela-sage");
    const vars = themeToCssVars(theme);
    expect(vars["--color-background"]).toBe(theme.colors.background);
    expect(vars["--color-foreground"]).toBe(theme.colors.foreground);
    expect(vars["--color-primary"]).toBe(theme.colors.primary);
    expect(vars["--color-card"]).toBe(theme.colors.card);
    expect(vars["--color-card-foreground"]).toBe(theme.colors.cardForeground);
    expect(vars["--color-primary-foreground"]).toBe(theme.colors.primaryForeground);
    expect(vars["--color-secondary"]).toBe(theme.colors.secondary);
    expect(vars["--color-secondary-foreground"]).toBe(theme.colors.secondaryForeground);
    expect(vars["--color-muted"]).toBe(theme.colors.muted);
    expect(vars["--color-muted-foreground"]).toBe(theme.colors.mutedForeground);
    expect(vars["--color-accent"]).toBe(theme.colors.accent);
    expect(vars["--color-accent-foreground"]).toBe(theme.colors.accentForeground);
    expect(vars["--color-border"]).toBe(theme.colors.border);
    expect(vars["--color-ring"]).toBe(theme.colors.ring);
  });

  it("emits radius scale variables", () => {
    const theme = defineTheme("aquarela-sage");
    const vars = themeToCssVars(theme);
    expect(vars["--radius-sm"]).toBe(theme.radius.sm);
    expect(vars["--radius-md"]).toBe(theme.radius.md);
    expect(vars["--radius-lg"]).toBe(theme.radius.lg);
    expect(vars["--radius-full"]).toBe(theme.radius.full);
  });

  it("does not include any extraneous keys", () => {
    const theme = defineTheme("aquarela-sage");
    const vars = themeToCssVars(theme);
    for (const key of Object.keys(vars)) {
      expect(key.startsWith("--")).toBe(true);
    }
  });
});

describe("themeToCssBlock", () => {
  it("renders a :root selector containing every theme variable", () => {
    const theme = defineTheme("aquarela-sage");
    const block = themeToCssBlock(theme);
    expect(block.startsWith(":root {")).toBe(true);
    expect(block.endsWith("}")).toBe(true);
    expect(block).toContain(`--color-primary: ${theme.colors.primary};`);
    expect(block).toContain(`--color-background: ${theme.colors.background};`);
    expect(block).toContain(`--radius-lg: ${theme.radius.lg};`);
  });
});
