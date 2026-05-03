import { describe, expect, it } from "vitest";
import { theme, wedding } from "./wedding.config";

describe("wedding.config", () => {
  it("exports a valid theme resolved from the aquarela-sage preset", () => {
    expect(theme.fontPair).toBe("boheme-cormorant");
    expect(theme.mode).toBe("light");
    expect(theme.colors.primary.toLowerCase()).toBe("#7e8b6e");
  });

  it("exports a wedding config with locked rsvp.mode and known locale", () => {
    expect(wedding.defaultLocale).toBe("pt");
    expect(["closed", "open"]).toContain(wedding.rsvp.mode);
    expect(typeof wedding.rsvp.openModeMaxPlusOnes).toBe("number");
    expect(wedding.rsvp.openModeMaxPlusOnes).toBeGreaterThanOrEqual(0);
  });

  it("exports an IANA timezone the runtime can format with", () => {
    expect(() =>
      new Intl.DateTimeFormat("pt-BR", {
        timeZone: wedding.site.timezone,
      }).format(new Date()),
    ).not.toThrow();
  });
});
