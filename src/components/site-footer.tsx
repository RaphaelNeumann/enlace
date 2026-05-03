import * as React from "react";

export interface FormatCoupleNamesInput {
  partner1Name: string;
  partner2Name: string;
  partnersOrder: "p1-p2" | "p2-p1";
}

export function formatCoupleNames({
  partner1Name,
  partner2Name,
  partnersOrder,
}: FormatCoupleNamesInput): string {
  const a = (partnersOrder === "p1-p2" ? partner1Name : partner2Name).trim();
  const b = (partnersOrder === "p1-p2" ? partner2Name : partner1Name).trim();
  if (a && b) return `${a} & ${b}`;
  if (a) return a;
  if (b) return b;
  return "";
}

export interface SiteFooterProps {
  closingText: string;
  coupleNames: string;
  year: number;
  privacyHref?: string | null;
  privacyLabel?: string;
}

export function SiteFooter({
  closingText,
  coupleNames,
  year,
  privacyHref,
  privacyLabel = "Privacidade",
}: SiteFooterProps) {
  return (
    <footer
      className="text-center py-20 px-6"
      style={{
        // Same sage tint used by Programação and FAQ — gives the closing
        // band a clear visual stop on top of the paper texture.
        backgroundColor: "color-mix(in srgb, #7c8150 55%, transparent)",
      }}
    >
      <p
        style={{ fontFamily: "var(--font-display, serif)" }}
        className="text-7xl md:text-8xl"
      >
        {closingText}
      </p>
      <p
        className="mt-8 text-lg md:text-xl tracking-[0.18em] uppercase"
        style={{ fontFamily: "var(--font-caps)" }}
      >
        {coupleNames ? `${coupleNames} · ${year}` : year}
      </p>
      {privacyHref ? (
        <p
          className="mt-3 text-xs tracking-[0.16em] uppercase opacity-70"
          style={{ fontFamily: "var(--font-caps)" }}
        >
          <a href={privacyHref}>{privacyLabel}</a>
        </p>
      ) : null}
    </footer>
  );
}
