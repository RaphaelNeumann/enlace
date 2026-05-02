import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { LanguageToggle, otherLocale } from "./language-toggle";

describe("otherLocale", () => {
  it("returns en when current is pt", () => {
    expect(otherLocale("pt")).toBe("en");
  });
  it("returns pt when current is en", () => {
    expect(otherLocale("en")).toBe("pt");
  });
});

describe("LanguageToggle", () => {
  it("renders a link to the same path under the other locale", () => {
    render(<LanguageToggle currentLocale="pt" pathname="/" />);
    const link = screen.getByRole("link");
    expect(link.getAttribute("href")).toBe("/en");
  });

  it("preserves a deep path when switching locales", () => {
    render(<LanguageToggle currentLocale="pt" pathname="/gifts" />);
    expect(screen.getByRole("link").getAttribute("href")).toBe("/en/gifts");
  });

  it("strips an existing locale prefix before adding the new one", () => {
    render(<LanguageToggle currentLocale="en" pathname="/en/gifts" />);
    expect(screen.getByRole("link").getAttribute("href")).toBe("/pt/gifts");
  });

  it("includes both locales' labels in the displayed text", () => {
    render(<LanguageToggle currentLocale="pt" pathname="/" />);
    expect(screen.getByRole("link").textContent).toMatch(/PT.*EN|EN.*PT/);
  });

  it("has an aria-label that announces the destination locale", () => {
    render(<LanguageToggle currentLocale="pt" pathname="/" />);
    const link = screen.getByRole("link");
    expect(link.getAttribute("aria-label")).toMatch(/English/i);
  });
});
