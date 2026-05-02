import { describe, expect, it } from "vitest";
import { checkAccessToken, getRsvpAccessToken } from "../access-token";

describe("checkAccessToken", () => {
  it("returns public when expected is null", () => {
    expect(checkAccessToken("anything", null)).toBe("public");
    expect(checkAccessToken("anything", undefined)).toBe("public");
    expect(checkAccessToken("anything", "")).toBe("public");
    expect(checkAccessToken("anything", "   ")).toBe("public");
  });

  it("returns mismatch when candidate is missing", () => {
    expect(checkAccessToken(null, "secret")).toBe("mismatch");
    expect(checkAccessToken(undefined, "secret")).toBe("mismatch");
    expect(checkAccessToken("", "secret")).toBe("mismatch");
  });

  it("returns mismatch on different lengths", () => {
    expect(checkAccessToken("short", "longer-token")).toBe("mismatch");
  });

  it("returns mismatch on different content of same length", () => {
    expect(checkAccessToken("abcdef", "abcdez")).toBe("mismatch");
  });

  it("returns match when candidate equals expected", () => {
    expect(checkAccessToken("abcdef", "abcdef")).toBe("match");
  });

  it("trims whitespace around expected before comparing", () => {
    expect(checkAccessToken("abcdef", "  abcdef  ")).toBe("match");
  });
});

describe("getRsvpAccessToken", () => {
  it("returns trimmed token when set", () => {
    expect(
      getRsvpAccessToken({ RSVP_ACCESS_TOKEN: "  xyz  " } as unknown as NodeJS.ProcessEnv),
    ).toBe("xyz");
  });
  it("returns null when unset / empty", () => {
    expect(getRsvpAccessToken({} as unknown as NodeJS.ProcessEnv)).toBeNull();
    expect(
      getRsvpAccessToken({ RSVP_ACCESS_TOKEN: "" } as unknown as NodeJS.ProcessEnv),
    ).toBeNull();
    expect(
      getRsvpAccessToken({ RSVP_ACCESS_TOKEN: "   " } as unknown as NodeJS.ProcessEnv),
    ).toBeNull();
  });
});
