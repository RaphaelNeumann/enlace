export interface OgSvgInput {
  coupleNames: string;
  dateLabel: string;
  backgroundColor: string;
  foregroundColor: string;
  accentColor: string;
}

function escape(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function generateOgSvg(input: OgSvgInput): string {
  const names = escape(input.coupleNames);
  const date = escape(input.dateLabel);
  const dateText = date
    ? `<text x="600" y="430" text-anchor="middle" font-size="36" letter-spacing="6" font-family="serif" fill="${input.foregroundColor}">${date}</text>`
    : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="${input.backgroundColor}"/>
  <rect x="40" y="40" width="1120" height="550" fill="none" stroke="${input.accentColor}" stroke-width="2" opacity="0.5"/>
  <text x="600" y="320" text-anchor="middle" font-size="120" font-family="cursive" fill="${input.foregroundColor}">${names}</text>
  ${dateText}
</svg>`;
}
