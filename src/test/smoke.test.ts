import { describe, expect, it } from "vitest";

describe("test stack smoke", () => {
  it("vitest + happy-dom is wired", () => {
    expect(typeof window).toBe("object");
    expect(typeof document).toBe("object");
  });
});
