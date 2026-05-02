import { describe, expect, it } from "vitest";
import { formatHeroSubtitle } from "./format-date";

describe("formatHeroSubtitle", () => {
  const wedding = new Date("2026-10-20T19:00:00Z");
  const tz = "America/Sao_Paulo";

  it("returns null when date is null", () => {
    expect(formatHeroSubtitle(null, tz, "pt")).toBeNull();
  });

  it("formats a Brazilian date in Portuguese", () => {
    const result = formatHeroSubtitle(wedding, tz, "pt");
    expect(result).not.toBeNull();
    // Day-of-week + day + month + year + hour
    expect(result!.toLowerCase()).toContain("outubro");
    expect(result).toContain("2026");
    expect(result).toMatch(/16[h:]00/i);
  });

  it("formats the same date in English", () => {
    const result = formatHeroSubtitle(wedding, tz, "en");
    expect(result!.toLowerCase()).toContain("october");
    expect(result).toContain("2026");
  });

  it("respects the time zone for hour rendering", () => {
    const utcResult = formatHeroSubtitle(wedding, "UTC", "pt");
    const sampleHour = utcResult!.match(/(\d{2})[h:](\d{2})/);
    expect(sampleHour).not.toBeNull();
    expect(Number(sampleHour![1])).toBe(19);
  });

  it("returns the result in upper case (small-caps emulation)", () => {
    const result = formatHeroSubtitle(wedding, tz, "pt");
    expect(result).toBe(result!.toUpperCase());
  });
});
