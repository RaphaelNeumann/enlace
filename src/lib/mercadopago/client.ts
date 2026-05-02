export class MercadoPagoError extends Error {
  status: number;
  body: unknown;
  constructor(status: number, body: unknown) {
    super(`Mercado Pago request failed (${status})`);
    this.name = "MercadoPagoError";
    this.status = status;
    this.body = body;
  }
}

export interface MercadoPagoClientOptions {
  accessToken: string;
  baseUrl?: string;
}

export interface CreatePreferenceInput {
  title: string;
  amountCents: number;
  externalReference: string;
  backUrls?: { success?: string; failure?: string; pending?: string };
}

export interface PreferenceResult {
  id: string;
  initPoint: string;
  sandboxInitPoint: string;
}

export interface MercadoPagoClient {
  createPreference(input: CreatePreferenceInput): Promise<PreferenceResult>;
}

const DEFAULT_BASE_URL = "https://api.mercadopago.com";

export function createMercadoPagoClient(
  options: MercadoPagoClientOptions,
): MercadoPagoClient {
  const token = options.accessToken?.trim();
  if (!token) {
    throw new Error("createMercadoPagoClient: accessToken is required");
  }
  const baseUrl = options.baseUrl ?? DEFAULT_BASE_URL;

  return {
    async createPreference(input) {
      if (!Number.isFinite(input.amountCents) || input.amountCents <= 0) {
        throw new Error("createPreference: amountCents must be a positive integer");
      }
      const unitPrice = Math.round(input.amountCents) / 100;
      const body = {
        items: [
          {
            title: input.title,
            quantity: 1,
            unit_price: unitPrice,
            currency_id: "BRL",
          },
        ],
        external_reference: input.externalReference,
        ...(input.backUrls ? { back_urls: input.backUrls } : {}),
      };
      const res = await fetch(`${baseUrl}/checkout/preferences`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });
      let json: unknown = null;
      try {
        json = await res.json();
      } catch {
        // ignore parse errors; we'll surface status
      }
      if (!res.ok) {
        throw new MercadoPagoError(res.status, json);
      }
      const obj = json as Record<string, unknown>;
      return {
        id: String(obj.id),
        initPoint: String(obj.init_point),
        sandboxInitPoint: String(obj.sandbox_init_point),
      };
    },
  };
}
