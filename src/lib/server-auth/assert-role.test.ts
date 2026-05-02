import { describe, expect, it } from "vitest";
import {
  ADMIN_ROLES,
  AuthorizationError,
  assertAdmin,
  isAdminRole,
} from "./assert-role";

describe("isAdminRole", () => {
  it("returns true for COUPLE and CEREMONIAL", () => {
    for (const role of ADMIN_ROLES) {
      expect(isAdminRole(role)).toBe(true);
    }
  });
  it.each([null, undefined, "", "ADMIN", "guest", 0, {}])(
    "returns false for %p",
    (value) => {
      expect(isAdminRole(value)).toBe(false);
    },
  );
});

describe("assertAdmin", () => {
  it("returns the role for a COUPLE session", () => {
    expect(assertAdmin({ user: { role: "COUPLE" } })).toBe("COUPLE");
  });
  it("returns the role for a CEREMONIAL session", () => {
    expect(assertAdmin({ user: { role: "CEREMONIAL" } })).toBe("CEREMONIAL");
  });
  it("throws on a missing session", () => {
    expect(() => assertAdmin(null)).toThrow(AuthorizationError);
  });
  it("throws on a session without a user", () => {
    expect(() => assertAdmin({})).toThrow(AuthorizationError);
  });
  it("throws on a session with no role", () => {
    expect(() => assertAdmin({ user: {} })).toThrow(AuthorizationError);
  });
  it("throws on a session with a non-admin role", () => {
    expect(() => assertAdmin({ user: { role: "GUEST" } })).toThrow(
      AuthorizationError,
    );
  });
  it("AuthorizationError carries its name for serialization", () => {
    try {
      assertAdmin(null);
    } catch (error) {
      expect((error as AuthorizationError).name).toBe("AuthorizationError");
    }
  });
});
