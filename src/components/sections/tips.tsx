"use client";

import { useState } from "react";
import type { TipCategory, Tip } from "@/lib/tips/db";
import type { Locale } from "@/lib/hero/format-date";

export interface TipsSectionProps {
  categories: Array<TipCategory & { tips: Tip[] }>;
  locale?: Locale;
}

function pickText(pt: string, en: string | null, locale: Locale): string {
  return locale === "en" && en ? en : pt;
}

export function TipsSection({ categories, locale = "pt" }: TipsSectionProps) {
  const [openId, setOpenId] = useState<string | null>(null);
  if (categories.length === 0) return null;
  const open = categories.find((c) => c.id === openId) ?? null;
  return (
    <section aria-labelledby="tips-heading">
      <h2
        id="tips-heading"
        className="text-7xl md:text-8xl text-center mb-10"
        style={{ fontFamily: "var(--font-display)", color: "var(--color-primary)" }}
      >
        {locale === "pt" ? "Dicas" : "Tips"}
      </h2>
      <div className="mx-auto max-w-5xl grid grid-cols-2 md:grid-cols-3 gap-4">
        {categories.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setOpenId(cat.id)}
            className="rounded p-4 border text-center"
            style={{
              borderColor: "color-mix(in srgb, var(--color-primary) 40%, transparent)",
              backgroundColor: "var(--color-card)",
              color: "var(--color-card-foreground)",
            }}
          >
            <span
              className="block text-2xl mb-2"
              style={{ fontFamily: "var(--font-display)", color: "var(--color-primary)" }}
            >
              {pickText(cat.namePt, cat.nameEn, locale)}
            </span>
          </button>
        ))}
      </div>
      {open ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby={`tips-dialog-${open.id}-heading`}
          onClick={() => setOpenId(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.45)" }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-w-lg w-full rounded p-6 max-h-[80vh] overflow-y-auto"
            style={{ backgroundColor: "var(--color-card)", color: "var(--color-card-foreground)" }}
          >
            <button
              type="button"
              onClick={() => setOpenId(null)}
              className="float-right text-sm opacity-70"
              aria-label={locale === "pt" ? "Fechar" : "Close"}
            >
              ✕
            </button>
            <h3
              id={`tips-dialog-${open.id}-heading`}
              className="text-3xl mb-4"
              style={{ fontFamily: "var(--font-display)", color: "var(--color-primary)" }}
            >
              {pickText(open.namePt, open.nameEn, locale)}
            </h3>
            <ul className="space-y-4">
              {open.tips.map((tip) => (
                <li key={tip.id}>
                  <p className="font-medium">{pickText(tip.titlePt, tip.titleEn, locale)}</p>
                  <p className="text-sm opacity-90 whitespace-pre-line">
                    {pickText(tip.bodyPt, tip.bodyEn, locale)}
                  </p>
                  {tip.externalUrl ? (
                    <p>
                      <a
                        href={tip.externalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs underline"
                      >
                        {locale === "pt" ? "Abrir" : "Open"}
                      </a>
                    </p>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}
    </section>
  );
}
