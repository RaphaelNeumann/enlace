"use server";

import { headers } from "next/headers";
import { getGift } from "@/lib/gifts/db";
import { createMercadoPagoClient } from "@/lib/mercadopago/client";
import { createGiftMessageInDb } from "@/lib/gifts/db";
import { createRateLimiter } from "@/lib/rate-limit/rate-limit";

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
