import { timingSafeEqual } from "node:crypto";

/**
 * Constant-time comparison of an incoming token against `RSVP_ACCESS_TOKEN`.
 * Pure function — accepts `expected` so tests don't need to mutate process.env.
 *
 * Returns:
 * - "public": no token configured (env unset / empty); the form is open
 * - "match": the candidate matches the configured token
 * - "mismatch": a token is configured but the candidate doesn't match
 */
export type AccessCheckResult = "public" | "match" | "mismatch";

export function checkAccessToken(
  candidate: string | null | undefined,
  expected: string | null | undefined,
): AccessCheckResult {
  const expectedTrimmed = (expected ?? "").trim();
  if (!expectedTrimmed) return "public";
  if (typeof candidate !== "string" || candidate.length === 0) return "mismatch";
  const a = Buffer.from(candidate);
  const b = Buffer.from(expectedTrimmed);
  if (a.length !== b.length) return "mismatch";
  return timingSafeEqual(a, b) ? "match" : "mismatch";
}

export function getRsvpAccessToken(env: NodeJS.ProcessEnv = process.env): string | null {
  const value = env.RSVP_ACCESS_TOKEN?.trim();
  return value && value.length > 0 ? value : null;
}
