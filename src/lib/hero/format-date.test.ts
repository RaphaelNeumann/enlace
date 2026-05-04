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
    // Hour is rendered from UTC components — the value the admin typed,
    // not a timezone-converted view of it.
    expect(result).toMatch(/19:00/);
  });

  it("formats the same date in English", () => {
    const result = formatHeroSubtitle(wedding, tz, "en");
    expect(result!.toLowerCase()).toContain("october");
    expect(result).toContain("2026");
  });

  it("renders the hour identically regardless of the timeZone arg", () => {
    const inSp = formatHeroSubtitle(wedding, "America/Sao_Paulo", "pt");
    const inUtc = formatHeroSubtitle(wedding, "UTC", "pt");
    const inTokyo = formatHeroSubtitle(wedding, "Asia/Tokyo", "pt");
    expect(inSp).toBe(inUtc);
    expect(inSp).toBe(inTokyo);
  });

  it("returns the result in upper case (small-caps emulation)", () => {
    const result = formatHeroSubtitle(wedding, tz, "pt");
    expect(result).toBe(result!.toUpperCase());
  });
});
