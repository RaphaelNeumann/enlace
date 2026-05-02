import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Monogram, deriveInitials } from "./monogram";

describe("deriveInitials", () => {
  it("derives F & D from short names Fernanda + Daniel", () => {
    expect(deriveInitials("Fernanda", "Daniel")).toBe("F&D");
  });

  it("uppercases lowercase short names", () => {
    expect(deriveInitials("fernanda", "daniel")).toBe("F&D");
  });

  it("trims whitespace and uses first non-space character", () => {
    expect(deriveInitials("  Fernanda  ", " Daniel ")).toBe("F&D");
  });

  it("falls back to a placeholder when both inputs are empty", () => {
    expect(deriveInitials("", "")).toBe("·&·");
  });

  it("uses an override when provided, ignoring the partner names", () => {
    expect(deriveInitials("Whatever", "Anything", "FD")).toBe("FD");
  });

  it("normalizes accented characters to plain ASCII initials", () => {
    expect(deriveInitials("Álvaro", "Êlton")).toBe("A&E");
  });
});

describe("Monogram", () => {
  it("renders the derived initials inside an SVG with role=img", () => {
    render(<Monogram partner1ShortName="Fernanda" partner2ShortName="Daniel" />);
    const svg = screen.getByRole("img");
    expect(svg).toBeInTheDocument();
    expect(svg.tagName.toLowerCase()).toBe("svg");
    expect(svg.textContent).toContain("F&D");
  });

  it("uses the override when supplied", () => {
    render(
      <Monogram
        partner1ShortName="A"
        partner2ShortName="B"
        override="XY"
      />,
    );
    expect(screen.getByRole("img").textContent).toContain("XY");
  });

  it("sets an accessible label that includes the partner names", () => {
    render(
      <Monogram
        partner1ShortName="Fernanda"
        partner2ShortName="Daniel"
      />,
    );
    const svg = screen.getByRole("img");
    expect(svg.getAttribute("aria-label")).toMatch(/Fernanda/);
    expect(svg.getAttribute("aria-label")).toMatch(/Daniel/);
  });
});
