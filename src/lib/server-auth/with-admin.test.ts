import { describe, expect, it, vi } from "vitest";
import { withAdmin } from "./with-admin";
import { AuthorizationError } from "./assert-role";

describe("withAdmin", () => {
  it("invokes the inner function when the session is admin", async () => {
    const inner = vi.fn(async (input: number) => input * 2);
    const wrapped = withAdmin(inner);
    const result = await wrapped(7, { user: { role: "COUPLE" } });
    expect(result).toBe(14);
    expect(inner).toHaveBeenCalledWith(7);
  });

  it("forwards any number of args to the inner function", async () => {
    const inner = vi.fn(async (a: string, b: number) => `${a}:${b}`);
    const wrapped = withAdmin(inner);
    const result = await wrapped("foo", 3, { user: { role: "CEREMONIAL" } });
    expect(result).toBe("foo:3");
  });

  it("throws AuthorizationError without invoking the inner function on missing session", async () => {
    const inner = vi.fn();
    const wrapped = withAdmin(inner);
    await expect(wrapped(1, null)).rejects.toBeInstanceOf(AuthorizationError);
    expect(inner).not.toHaveBeenCalled();
  });

  it("throws when the session has a non-admin role", async () => {
    const inner = vi.fn();
    const wrapped = withAdmin(inner);
    await expect(
      wrapped(1, { user: { role: "GUEST" } }),
    ).rejects.toBeInstanceOf(AuthorizationError);
    expect(inner).not.toHaveBeenCalled();
  });
});
