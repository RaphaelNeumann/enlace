import { describe, expect, it } from "vitest";
import { generateOgSvg } from "./generate";

describe("generateOgSvg", () => {
  it("returns a 1200x630 SVG with the couple names and date", () => {
    const svg = generateOgSvg({
      coupleNames: "Fernanda & Daniel",
      dateLabel: "20 de outubro de 2026",
      backgroundColor: "#F4EFE3",
      foregroundColor: "#2D2A24",
      accentColor: "#7E8B6E",
    });
    expect(svg.startsWith("<svg")).toBe(true);
    expect(svg).toContain('width="1200"');
    expect(svg).toContain('height="630"');
    expect(svg).toContain("Fernanda &amp; Daniel");
    expect(svg).toContain("20 de outubro de 2026");
  });

  it("escapes HTML-unsafe characters in inputs", () => {
    const svg = generateOgSvg({
      coupleNames: '<script>alert("x")</script>',
      dateLabel: "X & Y",
      backgroundColor: "#fff",
      foregroundColor: "#000",
      accentColor: "#888",
    });
    expect(svg).not.toContain("<script>");
    expect(svg).toContain("&lt;script&gt;");
    expect(svg).toContain("X &amp; Y");
  });

  it("omits the date line when dateLabel is empty", () => {
    const svg = generateOgSvg({
      coupleNames: "A & B",
      dateLabel: "",
      backgroundColor: "#fff",
      foregroundColor: "#000",
      accentColor: "#888",
    });
    expect(svg).toContain("A &amp; B");
    // No date text
    expect(svg.match(/<text[^>]*>20/)).toBeNull();
  });

  it("uses the colors passed in", () => {
    const svg = generateOgSvg({
      coupleNames: "A & B",
      dateLabel: "Today",
      backgroundColor: "#abcdef",
      foregroundColor: "#fedcba",
      accentColor: "#0f0f0f",
    });
    expect(svg).toContain("#abcdef");
    expect(svg).toContain("#fedcba");
    expect(svg).toContain("#0f0f0f");
  });
});
