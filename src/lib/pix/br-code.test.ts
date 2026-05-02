import { describe, expect, it } from "vitest";
import { buildBrCode, BrCodeInput } from "./br-code";
import { crc16ccitt } from "./crc16";

const baseInput: BrCodeInput = {
  pixKey: "rafael@example.com",
  recipientName: "Raphael Neumann",
  city: "São Paulo",
};

describe("buildBrCode", () => {
  it("starts with the format-indicator and point-of-initiation TLVs", () => {
    const out = buildBrCode(baseInput);
    expect(out.startsWith("000201")).toBe(true);
    expect(out).toMatch(/010212/); // Not-reusable
  });

  it("ends with a 6304 + 4-char hex CRC and the CRC matches over the body", () => {
    const out = buildBrCode(baseInput);
    expect(out.length).toBeGreaterThan(8);
    expect(out.slice(-8, -4)).toBe("6304");
    const body = out.slice(0, -4);
    const expectedCrc = crc16ccitt(Buffer.from(body, "ascii"))
      .toString(16)
      .toUpperCase()
      .padStart(4, "0");
    expect(out.slice(-4)).toBe(expectedCrc);
  });

  it("embeds the PIX key inside the merchant-account-information TLV (tag 26)", () => {
    const out = buildBrCode({
      ...baseInput,
      pixKey: "raphael@example.com",
    });
    expect(out).toContain("0014br.gov.bcb.pix");
    expect(out).toContain("raphael@example.com");
  });

  it("includes amount when provided (tag 54) and omits it when not", () => {
    // "123.45" is 6 chars → length prefix "06"
    const withAmount = buildBrCode({ ...baseInput, amountCents: 12345 });
    expect(withAmount).toContain("5406123.45");
    // "10.50" is 5 chars → length prefix "05"
    const withSmallAmount = buildBrCode({ ...baseInput, amountCents: 1050 });
    expect(withSmallAmount).toContain("540510.50");
    const withoutAmount = buildBrCode(baseInput);
    expect(withoutAmount).not.toMatch(/54\d{2}\d/);
  });

  it("normalizes accented recipient name and city to ASCII", () => {
    const out = buildBrCode({
      ...baseInput,
      recipientName: "Ágatha Áma",
      city: "São Paulo",
    });
    expect(out).toContain("Agatha Ama");
    expect(out).toContain("Sao Paulo");
  });

  it("truncates recipient name to 25 chars and city to 15 chars", () => {
    const out = buildBrCode({
      ...baseInput,
      recipientName: "A".repeat(40),
      city: "B".repeat(40),
    });
    const nameTlv = out.match(/59(\d{2})([^]+?)60/);
    const cityTlv = out.match(/60(\d{2})([^]+?)62/);
    expect(parseInt(nameTlv![1], 10)).toBe(25);
    expect(parseInt(cityTlv![1], 10)).toBe(15);
  });

  it("includes additional-data-field with default TXID '***'", () => {
    const out = buildBrCode(baseInput);
    expect(out).toContain("62070503***");
  });

  it("currency is fixed to '986' (BRL) and country to 'BR'", () => {
    const out = buildBrCode(baseInput);
    expect(out).toContain("5303986");
    expect(out).toContain("5802BR");
  });

  it("amount of 0 cents emits no amount field (treated as absent)", () => {
    const out = buildBrCode({ ...baseInput, amountCents: 0 });
    expect(out).not.toMatch(/5405/);
  });

  it("rejects an empty pixKey", () => {
    expect(() =>
      buildBrCode({ ...baseInput, pixKey: "" }),
    ).toThrow();
  });
});
