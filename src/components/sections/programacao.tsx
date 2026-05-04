import type { ProgramacaoCard } from "@/lib/programacao/db";
import type { Locale } from "@/lib/hero/format-date";
import { publicUrl } from "@/lib/storage/supabase";

export interface ProgramacaoProps {
  cards: ProgramacaoCard[];
  locale?: Locale;
  /** When set, allows resolving iconImageStoragePath into a public URL. */
  supabaseProjectUrl?: string;
}

const TITLES_FALLBACK: Record<string, { pt: string; en: string }> = {
  ceremony: { pt: "Cerimônia", en: "Ceremony" },
  reception: { pt: "Recepção", en: "Reception" },
};

function pickText(pt: string, en: string | null, locale: Locale): string {
  return locale === "en" && en ? en : pt;
}

function formatDate(d: Date | null): string {
  if (!d) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getUTCDate())}.${pad(d.getUTCMonth() + 1)}.${d.getUTCFullYear()}`;
}

export function Programacao({
  cards,
  locale = "pt",
  supabaseProjectUrl,
}: ProgramacaoProps) {
  function resolveIconImage(rawPath: string | null | undefined): string | null {
    const path = rawPath?.trim();
    if (!path) return null;
    if (/^https?:\/\//.test(path)) return path;
    if (!supabaseProjectUrl) return null;
    return publicUrl({ projectUrl: supabaseProjectUrl, bucket: "site", path });
  }
  const visible = cards
    .filter((c) => c.isVisible)
    .sort((a, b) => {
      const order = ["ceremony", "reception"];
      return order.indexOf(a.id) - order.indexOf(b.id);
    });
  if (visible.length === 0) return null;
  return (
    <section
      className="py-16 px-6"
      aria-labelledby="programacao-heading"
      style={{
        // Sage tint #7c8150 painted full-bleed on top of the html-level
        // paper texture. Lower opacity so the paper grain reads through.
        backgroundColor: "color-mix(in srgb, #7c8150 55%, transparent)",
      }}
    >
      <div className="mx-auto max-w-5xl">
        <h2
          id="programacao-heading"
          className="text-7xl md:text-8xl text-center mb-10"
          style={{ fontFamily: "var(--font-display)", color: "#ffffff" }}
        >
          {locale === "pt" ? "Programação" : "Schedule"}
        </h2>
        <div className="mx-auto max-w-5xl flex flex-col gap-6">
        {visible.map((card) => {
          const fallback = TITLES_FALLBACK[card.id];
          const title =
            (locale === "en" && card.titleEn) ||
            card.titlePt ||
            (fallback ? fallback[locale] : "");
          const address = pickText(card.addressPt, card.addressEn, locale);
          const dateLabel = formatDate(card.date);
          const iconImageUrl = resolveIconImage(card.iconImageStoragePath);
          return (
            <article
              key={card.id}
              className="rounded-lg p-10 text-center space-y-7"
              style={{
                backgroundColor: "var(--color-card)",
                // Owner-chosen sage tone for all card text, including the
                // title, date/time/address and the Google Maps link/icon
                // (currentColor inheritance).
                color: "#5b6946",
                border: "1px solid color-mix(in srgb, #5b6946 50%, transparent)",
              }}
            >
              {iconImageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={iconImageUrl}
                  alt=""
                  aria-hidden="true"
                  className="mx-auto h-auto w-[35%] object-contain"
                />
              ) : null}
              <h3
                className="text-6xl md:text-7xl"
                style={{ fontFamily: "var(--font-display)" }}
              >
                {title}
              </h3>
              {dateLabel || card.time ? (
                <p
                  className="text-lg md:text-xl tracking-[0.18em] uppercase"
                  style={{ fontFamily: "var(--font-caps)" }}
                >
                  {[dateLabel, card.time].filter(Boolean).join(" - ")}
                </p>
              ) : null}
              {address ? (
                <p
                  className="text-lg md:text-xl tracking-[0.16em] whitespace-pre-line"
                  style={{ fontFamily: "var(--font-caps)" }}
                >
                  {address}
                </p>
              ) : null}
              {card.mapsUrl ? (
                <div className="flex flex-col items-center gap-4">
                  <svg
                    data-testid="maps-pin-icon"
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                    className="w-[15%] h-auto"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                  <a
                    href={card.mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-lg md:text-xl tracking-[0.16em] underline underline-offset-4"
                    style={{ fontFamily: "var(--font-caps)" }}
                    aria-label={`Abrir ${title} no Google Maps (abre em nova aba)`}
                  >
                    Google Maps
                  </a>
                </div>
              ) : null}
            </article>
          );
        })}
        </div>
      </div>
    </section>
  );
}
