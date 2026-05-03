"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { searchGuestsForTypeahead } from "@/lib/guests/db";
import { submitRsvp, type SubmitResult } from "@/lib/rsvp/submit";
import { wedding } from "@/config/wedding.config";
import { createRateLimiter } from "@/lib/rate-limit/rate-limit";
import { verifyTurnstileToken } from "@/lib/turnstile/verify";

const limiter = createRateLimiter({ max: 10, windowMs: 60 * 60 * 1000 });

export async function searchAction(prefix: string) {
  if (!prefix || prefix.length < 2) return [];
  return searchGuestsForTypeahead({ prefix });
}

export async function submitRsvpAction(formData: FormData): Promise<
  | SubmitResult
  | { ok: false; error: { kind: "rateLimited"; retryAfterMs: number } }
  | { ok: false; error: { kind: "captchaFailed" } }
> {
  const headerList = await headers();
  const ip =
    headerList.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    headerList.get("x-real-ip") ??
    "unknown";
  const limit = limiter.check(ip);
  if (!limit.ok) {
    return { ok: false, error: { kind: "rateLimited", retryAfterMs: limit.retryAfterMs } };
  }
  // Captcha is always required when Turnstile is configured — both the
  // RSVP and the message-to-couple flows enforce the same gate.
  if (process.env.TURNSTILE_SECRET_KEY?.trim()) {
    const token = formData.get("turnstileToken");
    const v = await verifyTurnstileToken(
      typeof token === "string" ? token : null,
      ip === "unknown" ? undefined : ip,
    );
    if (!v.ok) return { ok: false, error: { kind: "captchaFailed" } };
  }
  const plusOneNames: string[] = [];
  for (const [key, value] of formData.entries()) {
    if (typeof value === "string" && key.startsWith("plusOneName-") && value.trim().length > 0) {
      plusOneNames.push(value.trim());
    }
  }
  const input = {
    firstName: String(formData.get("firstName") ?? ""),
    lastName: String(formData.get("lastName") ?? ""),
    attending: String(formData.get("attending") ?? ""),
    plusOneNames,
    observation: ((formData.get("observation") as string) ?? "").trim() || null,
  };
  const result = await submitRsvp(input, {
    mode: wedding.rsvp.mode,
    openModeMaxPlusOnes: wedding.rsvp.openModeMaxPlusOnes,
  });
  if (result.ok) {
    revalidatePath("/admin/rsvps");
    revalidatePath("/admin/guests");
    revalidatePath("/admin/observations");
  }
  return result;
}
