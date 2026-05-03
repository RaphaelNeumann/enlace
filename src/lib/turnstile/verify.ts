/**
 * Verifies a Cloudflare Turnstile token against the siteverify endpoint.
 * Returns true only when the response says success === true. The action
 * reads TURNSTILE_SECRET_KEY at call time so an unconfigured deployment
 * (no env vars) skips verification — the widget is hidden client-side
 * anyway in that case.
 */
const SITEVERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

interface SiteVerifyResponse {
  success: boolean;
  "error-codes"?: string[];
  challenge_ts?: string;
  hostname?: string;
  action?: string;
  cdata?: string;
}

export async function verifyTurnstileToken(
  token: string | null | undefined,
  remoteIp?: string,
): Promise<{ ok: boolean; reason?: string }> {
  const secret = process.env.TURNSTILE_SECRET_KEY?.trim();
  // Treat missing secret as "captcha disabled" — caller decides whether
  // to require it. (`submitGiftMessageAction` requires it when
  // NEXT_PUBLIC_TURNSTILE_SITE_KEY is also configured.)
  if (!secret) return { ok: true };
  if (!token) return { ok: false, reason: "missing-token" };
  const body = new URLSearchParams();
  body.set("secret", secret);
  body.set("response", token);
  if (remoteIp) body.set("remoteip", remoteIp);
  const resp = await fetch(SITEVERIFY_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!resp.ok) return { ok: false, reason: `siteverify-${resp.status}` };
  const data = (await resp.json()) as SiteVerifyResponse;
  if (!data.success) {
    return { ok: false, reason: data["error-codes"]?.join(",") ?? "denied" };
  }
  return { ok: true };
}
