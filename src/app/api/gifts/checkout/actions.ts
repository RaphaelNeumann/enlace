"use server";

import { headers } from "next/headers";
import { getGift } from "@/lib/gifts/db";
import { createMercadoPagoClient } from "@/lib/mercadopago/client";
import { createGiftMessageInDb } from "@/lib/gifts/db";
import { createRateLimiter } from "@/lib/rate-limit/rate-limit";
import { renderPix } from "@/lib/pix/render";

const messageLimiter = createRateLimiter({ max: 10, windowMs: 60 * 60 * 1000 });

export async function createGiftCheckoutAction(
  giftId: string,
): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  const token = process.env.MERCADO_PAGO_ACCESS_TOKEN?.trim();
  if (!token) return { ok: false, error: "Pagamento por cartão não configurado." };
  const gift = await getGift(giftId);
  if (!gift || !gift.isVisible) return { ok: false, error: "Presente não disponível." };
  if (gift.suggestedAmountCents == null || gift.suggestedAmountCents <= 0) {
    return { ok: false, error: "Este presente não tem valor sugerido para cartão." };
  }
  try {
    const client = createMercadoPagoClient({ accessToken: token });
    const result = await client.createPreference({
      title: gift.titlePt,
      amountCents: gift.suggestedAmountCents,
      externalReference: gift.id,
    });
    return { ok: true, url: result.initPoint };
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
    if (!Number.isFinite(amountCents) || amountCents <= 0) {
      return { ok: false, error: "Valor inválido." };
    }
    amount = Math.round(amountCents);
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
): Promise<{ ok: true } | { ok: false; error: string }> {
  const headerList = await headers();
  const ip =
    headerList.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    headerList.get("x-real-ip") ??
    "unknown";
  const limit = messageLimiter.check(ip);
  if (!limit.ok) return { ok: false, error: "Muitas tentativas. Tente novamente em alguns minutos." };
  try {
    await createGiftMessageInDb({ giftId, senderName, message });
    return { ok: true };
  } catch (err) {
    const m = err instanceof Error ? err.message : "Erro";
    return { ok: false, error: m };
  }
}
