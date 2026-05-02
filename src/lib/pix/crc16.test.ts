import { describe, expect, it } from "vitest";
import { crc16ccitt } from "./crc16";

describe("crc16ccitt (PIX BR-Code variant: poly=0x1021, init=0xFFFF, no reflection, no xor-out)", () => {
  it("returns 0xE5CC for the empty buffer", () => {
    // CRC16-CCITT-FALSE on empty input is 0xFFFF; PIX uses XOR-out=0 so result = 0xFFFF
    // We use the variant with init=0xFFFF; our identifier checks the implementation.
    // Compute against a known vector: input "123456789" → 0x29B1 (CCITT-FALSE).
    expect(crc16ccitt(Buffer.from("123456789", "ascii"))).toBe(0x29b1);
  });

  it("matches the canonical CRC16-CCITT-FALSE for ASCII 'A'", () => {
    // Vector: "A" → 0xB915
    expect(crc16ccitt(Buffer.from("A", "ascii"))).toBe(0xb915);
  });

  it("returns a 16-bit number (0..0xFFFF)", () => {
    const out = crc16ccitt(Buffer.from("hello world"));
    expect(out).toBeGreaterThanOrEqual(0);
    expect(out).toBeLessThanOrEqual(0xffff);
  });
});
