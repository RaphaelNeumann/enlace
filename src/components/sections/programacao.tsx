import type { ProgramacaoCard } from "@/lib/programacao/db";
import type { Locale } from "@/lib/hero/format-date";

export interface ProgramacaoProps {
  cards: ProgramacaoCard[];
  locale?: Locale;
  rsvpHref?: string | null;
}

const TITLES_FALLBACK: Record<string, { pt: string; en: string }> = {
  ceremony: { pt: "Cerimônia", en: "Ceremony" },
  reception: { pt: "Recepção", en: "Reception" },
};

function pickText(pt: string, en: string | null, locale: Locale): string {
  return locale === "en" && en ? en : pt;
}

function formatDate(d: Date | null, locale: Locale): string {
  if (!d) return "";
  const fmt = new Intl.DateTimeFormat(locale === "pt" ? "pt-BR" : "en-US", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  return fmt.format(d);
}

export function Programacao({ cards, locale = "pt", rsvpHref = null }: ProgramacaoProps) {
  if (cards.length === 0) return null;
  const ordered = [...cards].sort((a, b) => {
    const order = ["ceremony", "reception"];
    return order.indexOf(a.id) - order.indexOf(b.id);
  });
  return (
    <section
      className="py-16 px-6"
      aria-labelledby="programacao-heading"
      style={{
        // Semi-transparent tint so the body's paper texture shows through.
        backgroundColor: "color-mix(in srgb, var(--color-secondary) 80%, transparent)",
      }}
    >
      <h2 id="programacao-heading" className="sr-only">
        {locale === "pt" ? "Programação" : "Schedule"}
      </h2>
      <div className="mx-auto max-w-4xl grid md:grid-cols-2 gap-6">
        {ordered.map((card) => {
          const fallback = TITLES_FALLBACK[card.id];
          const title =
            (locale === "en" && card.titleEn) ||
            card.titlePt ||
            (fallback ? fallback[locale] : "");
          const address = pickText(card.addressPt, card.addressEn, locale);
          const dateLabel = formatDate(card.date, locale);
          return (
            <article
              key={card.id}
              className="rounded-lg p-8 text-center space-y-4"
              style={{
                backgroundColor: "var(--color-card)",
                color: "var(--color-card-foreground)",
                border: "1px solid color-mix(in srgb, var(--color-primary) 50%, transparent)",
              }}
            >
              <p className="text-sm tracking-[0.2em] uppercase">
                {dateLabel}
              </p>
              <h3
                className="text-4xl"
                style={{ fontFamily: "var(--font-display)", color: "var(--color-primary)" }}
              >
                {title}
              </h3>
              {card.time ? (
                <p className="text-sm tracking-[0.16em] uppercase">{card.time}</p>
              ) : null}
              {address ? <p className="text-sm whitespace-pre-line">{address}</p> : null}
              {card.mapsUrl ? (
                <p>
                  <a
                    href={card.mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block text-xs tracking-[0.2em] uppercase border-b"
                    style={{ borderColor: "var(--color-primary)" }}
                    aria-label={`Abrir ${title} no Google Maps (abre em nova aba)`}
                  >
                    Google Maps
                  </a>
                </p>
              ) : null}
              {card.id === "ceremony" && rsvpHref ? (
                <p>
                  <a
                    href={rsvpHref}
                    className="inline-block text-xs tracking-[0.2em] uppercase rounded border px-4 py-2"
                    style={{
                      borderColor: "var(--color-primary)",
                      color: "var(--color-primary)",
                    }}
                  >
                    {locale === "pt" ? "Confirme sua presença" : "Confirm your attendance"}
                  </a>
                </p>
              ) : null}
            </article>
          );
        })}
      </div>
    </section>
  );
}
