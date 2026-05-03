"use server";

import { headers } from "next/headers";
import { getGift } from "@/lib/gifts/db";
import { createMercadoPagoClient } from "@/lib/mercadopago/client";
import { createGiftMessageInDb } from "@/lib/gifts/db";
import { createRateLimiter } from "@/lib/rate-limit/rate-limit";
import { renderPix } from "@/lib/pix/render";
import { verifyTurnstileToken } from "@/lib/turnstile/verify";

const messageLimiter = createRateLimiter({ max: 10, windowMs: 60 * 60 * 1000 });

export async function createGiftCheckoutAction(
  giftId: string,
  amountCents?: number | null,
): Promise<
  | { ok: true; preferenceId: string; url: string }
  | { ok: false; error: string }
> {
  const token = process.env.MERCADO_PAGO_ACCESS_TOKEN?.trim();
  if (!token) return { ok: false, error: "Pagamento por cartão não configurado." };
  const gift = await getGift(giftId);
  if (!gift || !gift.isVisible) return { ok: false, error: "Presente não disponível." };
  // Prefer the client-supplied amount (the guest may have edited the
  // suggested value via the PIX dialog); fall back to the cadastro value.
  let chargeCents: number;
  if (amountCents != null && gift.allowAmountOverride) {
    if (!Number.isFinite(amountCents) || amountCents <= 0) {
      return { ok: false, error: "Valor inválido." };
    }
    chargeCents = Math.round(amountCents);
  } else if (gift.suggestedAmountCents != null && gift.suggestedAmountCents > 0) {
    chargeCents = gift.suggestedAmountCents;
  } else {
    return { ok: false, error: "Este presente não tem valor sugerido para cartão." };
  }
  try {
    const client = createMercadoPagoClient({ accessToken: token });
    const result = await client.createPreference({
      title: gift.titlePt,
      amountCents: chargeCents,
      externalReference: gift.id,
    });
    return { ok: true, preferenceId: result.id, url: result.initPoint };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro inesperado";
    return { ok: false, error: message };
  }
}

/**
 * Re-builds the PIX BR-Code + QR SVG for a gift using a custom amount
 * (the guest may want to pay more or less than the suggested value). Pix
 * key, recipient name and city stay env-driven — only the amount comes
 * from the client.
 */
export async function recomputePixBrCodeAction(
  giftId: string,
  amountCents: number | null,
): Promise<
  | { ok: true; brCode: string; svg: string }
  | { ok: false; error: string }
> {
  const pixKey = process.env.PIX_KEY?.trim();
  if (!pixKey) return { ok: false, error: "PIX não configurado." };
  const gift = await getGift(giftId);
  if (!gift || !gift.isVisible) return { ok: false, error: "Presente não disponível." };
  let amount: number | undefined;
  if (amountCents != null) {
    if (!gift.allowAmountOverride) {
      // Server-side guard: even if a client sends an override, fall back
      // to the suggested value when the gift doesn't allow editing.
      amount =
        gift.suggestedAmountCents != null && gift.suggestedAmountCents > 0
          ? gift.suggestedAmountCents
          : undefined;
    } else {
      if (!Number.isFinite(amountCents) || amountCents <= 0) {
        return { ok: false, error: "Valor inválido." };
      }
      amount = Math.round(amountCents);
    }
  }
  const recipientName = process.env.PIX_RECIPIENT_NAME?.trim() ?? "";
  const city = process.env.PIX_CITY?.trim() || "BRASIL";
  try {
    const { brCode, svg } = renderPix({
      pixKey,
      recipientName,
      city,
      amountCents: amount,
    });
    return { ok: true, brCode, svg };
  } catch (err) {
    const m = err instanceof Error ? err.message : "Erro";
    return { ok: false, error: m };
  }
}

export async function submitGiftMessageAction(
  giftId: string | null,
  senderName: string,
  message: string,
  turnstileToken?: string | null,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const headerList = await headers();
  const ip =
    headerList.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    headerList.get("x-real-ip") ??
    "unknown";
  const limit = messageLimiter.check(ip);
  if (!limit.ok) return { ok: false, error: "Muitas tentativas. Tente novamente em alguns minutos." };
  // When Turnstile is configured (secret + sitekey), require + verify the
  // token. `verifyTurnstileToken` short-circuits to ok when no secret is
  // present so deployments without captcha keep working.
  const captchaRequired = Boolean(process.env.TURNSTILE_SECRET_KEY?.trim());
  if (captchaRequired) {
    const v = await verifyTurnstileToken(turnstileToken, ip === "unknown" ? undefined : ip);
    if (!v.ok) return { ok: false, error: "Verificação anti-spam falhou. Tente novamente." };
  }
  try {
    await createGiftMessageInDb({ giftId, senderName, message });
    return { ok: true };
  } catch (err) {
    const m = err instanceof Error ? err.message : "Erro";
    return { ok: false, error: m };
  }
}
