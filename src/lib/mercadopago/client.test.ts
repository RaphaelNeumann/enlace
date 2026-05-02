import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { createMercadoPagoClient, MercadoPagoError } from "./client";

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe("createMercadoPagoClient", () => {
  it("posts a preference and returns init_point + id", async () => {
    server.use(
      http.post("https://api.mercadopago.com/checkout/preferences", async ({ request }) => {
        const body = (await request.json()) as { items: Array<{ unit_price: number; title: string }>; external_reference?: string };
        expect(body.items[0].unit_price).toBe(50);
        expect(body.items[0].title).toBe("Geladeira");
        expect(body.external_reference).toBe("gift-uuid");
        expect(request.headers.get("authorization")).toBe("Bearer TEST_TOKEN");
        return HttpResponse.json({
          id: "pref_123",
          init_point: "https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=pref_123",
          sandbox_init_point: "https://sandbox.mercadopago.com.br/checkout/v1/redirect?pref_id=pref_123",
        });
      }),
    );
    const client = createMercadoPagoClient({ accessToken: "TEST_TOKEN" });
    const result = await client.createPreference({
      title: "Geladeira",
      amountCents: 5000,
      externalReference: "gift-uuid",
    });
    expect(result.id).toBe("pref_123");
    expect(result.initPoint).toContain("mercadopago");
  });

  it("includes back_urls when provided", async () => {
    let captured: unknown = null;
    server.use(
      http.post("https://api.mercadopago.com/checkout/preferences", async ({ request }) => {
        captured = await request.json();
        return HttpResponse.json({ id: "p", init_point: "https://x", sandbox_init_point: "https://y" });
      }),
    );
    const client = createMercadoPagoClient({ accessToken: "T" });
    await client.createPreference({
      title: "T",
      amountCents: 100,
      externalReference: "ref",
      backUrls: { success: "https://example.com/ok" },
    });
    expect(captured).toMatchObject({
      back_urls: { success: "https://example.com/ok" },
    });
  });

  it("throws MercadoPagoError on non-2xx response", async () => {
    server.use(
      http.post("https://api.mercadopago.com/checkout/preferences", () =>
        HttpResponse.json({ message: "invalid" }, { status: 400 }),
      ),
    );
    const client = createMercadoPagoClient({ accessToken: "T" });
    await expect(
      client.createPreference({ title: "T", amountCents: 100, externalReference: "r" }),
    ).rejects.toBeInstanceOf(MercadoPagoError);
  });

  it("throws if amountCents is missing or non-positive", async () => {
    const client = createMercadoPagoClient({ accessToken: "T" });
    await expect(
      client.createPreference({ title: "T", amountCents: 0, externalReference: "r" }),
    ).rejects.toThrow();
    await expect(
      client.createPreference({
        title: "T",
        amountCents: -10,
        externalReference: "r",
      }),
    ).rejects.toThrow();
  });

  it("rejects an empty access token at construction time", () => {
    expect(() => createMercadoPagoClient({ accessToken: "" })).toThrow();
  });

  it("converts cents to BRL with two decimals", async () => {
    let captured: { items: Array<{ unit_price: number }> } | null = null;
    server.use(
      http.post("https://api.mercadopago.com/checkout/preferences", async ({ request }) => {
        captured = (await request.json()) as { items: Array<{ unit_price: number }> };
        return HttpResponse.json({ id: "p", init_point: "https://x", sandbox_init_point: "https://y" });
      }),
    );
    const client = createMercadoPagoClient({ accessToken: "T" });
    await client.createPreference({ title: "T", amountCents: 12345, externalReference: "r" });
    expect(captured).not.toBeNull();
    expect(captured!.items[0].unit_price).toBeCloseTo(123.45, 2);
  });
});
