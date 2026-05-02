import { describe, expect, it } from "vitest";
import { computeCountdown } from "./countdown";

describe("computeCountdown", () => {
  const dayMs = 24 * 60 * 60 * 1000;

  it("returns null when weddingDate is null", () => {
    expect(computeCountdown(null, new Date("2026-01-01T00:00:00Z"))).toBeNull();
  });

  it("returns null when weddingDate is undefined", () => {
    expect(computeCountdown(undefined, new Date())).toBeNull();
  });

  it("returns daysRemaining for a future wedding more than 24h away", () => {
    const wedding = new Date("2026-10-20T19:00:00Z");
    const now = new Date("2026-10-15T19:00:00Z");
    const result = computeCountdown(wedding, now);
    expect(result).not.toBeNull();
    expect(result!.daysRemaining).toBe(5);
    expect(result!.state).toBe("upcoming");
  });

  it("returns 1 day on the eve of the wedding", () => {
    const wedding = new Date("2026-10-20T19:00:00Z");
    const now = new Date("2026-10-19T19:00:00Z");
    const result = computeCountdown(wedding, now);
    expect(result!.daysRemaining).toBe(1);
    expect(result!.state).toBe("upcoming");
  });

  it("returns state=today when weddingDate is in the next 0..24h window", () => {
    const wedding = new Date("2026-10-20T19:00:00Z");
    const now = new Date("2026-10-20T08:00:00Z");
    const result = computeCountdown(wedding, now);
    expect(result!.daysRemaining).toBe(0);
    expect(result!.state).toBe("today");
  });

  it("returns state=hidden after wedding + 24h has passed", () => {
    const wedding = new Date("2026-10-20T19:00:00Z");
    const now = new Date("2026-10-22T00:00:00Z");
    const result = computeCountdown(wedding, now);
    expect(result!.state).toBe("hidden");
  });

  it("ceil-rounds the remaining days (mid-day on day-2 still says 2 days)", () => {
    const wedding = new Date("2026-10-20T19:00:00Z");
    const now = new Date(wedding.getTime() - 1.5 * dayMs);
    const result = computeCountdown(wedding, now);
    expect(result!.daysRemaining).toBe(2);
  });

  it("treats now after wedding but within 24h as today", () => {
    const wedding = new Date("2026-10-20T19:00:00Z");
    const now = new Date(wedding.getTime() + 2 * 60 * 60 * 1000); // +2h
    const result = computeCountdown(wedding, now);
    expect(result!.state).toBe("today");
    expect(result!.daysRemaining).toBe(0);
  });
});
