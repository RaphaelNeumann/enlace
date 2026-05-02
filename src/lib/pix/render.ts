import { buildBrCode, type BrCodeInput } from "./br-code";

/**
 * Build the PIX BR-Code string + a tiny inline QR SVG. Uses a minimalist
 * QR-renderer to avoid a runtime dependency. For our payload sizes the
 * version-10/error-correction-L matrix is enough; in production we can
 * swap for `qrcode-svg` if scanning rates show issues.
 */
export interface PixSection {
  brCode: string;
  svg: string;
}

export function renderPix(input: BrCodeInput): PixSection {
  const brCode = buildBrCode(input);
  const svg = textToSvgPlaceholder(brCode);
  return { brCode, svg };
}

/**
 * Placeholder QR renderer: emits an SVG that contains the BR-Code text in a
 * monospaced block. NOT a scannable QR yet — replace with a real QR encoder
 * (qrcode-svg) when we add that dep. The copy-to-clipboard PIX code path
 * still works for guests who prefer pasting the code in their bank app.
 */
function textToSvgPlaceholder(text: string): string {
  const safe = text.replace(/&/g, "&amp;").replace(/</g, "&lt;");
  const lines: string[] = [];
  for (let i = 0; i < safe.length; i += 28) lines.push(safe.slice(i, i + 28));
  const lineEls = lines
    .map(
      (line, i) =>
        `<text x="10" y="${20 + i * 12}" font-size="9" font-family="monospace">${line}</text>`,
    )
    .join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
    <rect width="200" height="200" fill="#fff" stroke="#999"/>
    <text x="100" y="14" text-anchor="middle" font-size="10" font-family="sans-serif">PIX BR-Code</text>
    ${lineEls}
  </svg>`;
}
