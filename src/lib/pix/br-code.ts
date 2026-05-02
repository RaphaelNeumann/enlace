import { crc16ccitt } from "./crc16";

export interface BrCodeInput {
  pixKey: string;
  recipientName: string;
  city: string;
  amountCents?: number | null;
  /** Defaults to "***" — the standard "no reference" marker. */
  txid?: string;
}

function tlv(tag: string, value: string): string {
  if (tag.length !== 2) throw new Error(`Tag must be 2 chars: ${tag}`);
  const len = value.length.toString().padStart(2, "0");
  return `${tag}${len}${value}`;
}

function asciiize(input: string): string {
  return input
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^\x20-\x7E]/g, "");
}

function clamp(input: string, max: number): string {
  return input.length <= max ? input : input.slice(0, max);
}

function formatAmount(cents: number): string {
  const reais = Math.floor(cents / 100);
  const fraction = (cents % 100).toString().padStart(2, "0");
  return `${reais}.${fraction}`;
}

export function buildBrCode(input: BrCodeInput): string {
  const pixKey = input.pixKey.trim();
  if (!pixKey) {
    throw new Error("buildBrCode: pixKey is required");
  }
  const name = clamp(asciiize(input.recipientName).trim(), 25) || "RECIPIENT";
  const city = clamp(asciiize(input.city).trim(), 15) || "BRASIL";
  const txid = input.txid && input.txid.trim().length > 0 ? input.txid.trim() : "***";

  const merchantInfo =
    tlv("00", "br.gov.bcb.pix") +
    tlv("01", pixKey);

  const additional = tlv("05", txid);

  const fields: string[] = [
    tlv("00", "01"),
    tlv("01", "12"),
    tlv("26", merchantInfo),
    tlv("52", "0000"),
    tlv("53", "986"),
  ];

  if (typeof input.amountCents === "number" && input.amountCents > 0) {
    fields.push(tlv("54", formatAmount(input.amountCents)));
  }

  fields.push(
    tlv("58", "BR"),
    tlv("59", name),
    tlv("60", city),
    tlv("62", additional),
  );

  const partial = fields.join("") + "6304";
  const crc = crc16ccitt(Buffer.from(partial, "ascii"))
    .toString(16)
    .toUpperCase()
    .padStart(4, "0");
  return partial + crc;
}
