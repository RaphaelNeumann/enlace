import QRCode from "qrcode-svg";
import { buildBrCode, type BrCodeInput } from "./br-code";

export interface PixSection {
  brCode: string;
  svg: string;
}

/**
 * Build the PIX BR-Code string + a scannable QR SVG. Uses `qrcode-svg`
 * which renders entirely server-side as a single inline SVG (no external
 * fetch, no CSP entry). Error-correction "M" balances density vs. the
 * BR-Code's typical payload length (~150–250 chars).
 */
export function renderPix(input: BrCodeInput): PixSection {
  const brCode = buildBrCode(input);
  const qr = new QRCode({
    content: brCode,
    padding: 2,
    width: 256,
    height: 256,
    color: "#000000",
    // Cream surface that matches `--color-card` (#FBF8F0) so the QR
    // blends into the gift dialog instead of breaking the layout with a
    // pure-white block. Bank apps still recognise it because contrast
    // with #000 modules is well above the 50% threshold the spec needs.
    background: "#FBF8F0",
    ecl: "M",
    join: true,
    container: "svg-viewbox",
  });
  return { brCode, svg: qr.svg() };
}
