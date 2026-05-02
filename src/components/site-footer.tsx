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
    <footer className="text-center py-12">
      <p
        style={{ fontFamily: "var(--font-display, serif)" }}
        className="text-3xl"
      >
        {closingText}
      </p>
      <p className="mt-6 text-sm opacity-70">
        {coupleNames ? `${coupleNames} · ${year}` : year}
      </p>
      {privacyHref ? (
        <p className="mt-2 text-xs opacity-60">
          <a href={privacyHref}>{privacyLabel}</a>
        </p>
      ) : null}
    </footer>
  );
}
