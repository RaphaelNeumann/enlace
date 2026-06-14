import type { FaqEntry } from "@/lib/faq/db";
import type { Locale } from "@/lib/hero/format-date";

export interface FaqSectionProps {
  entries: FaqEntry[];
  locale?: Locale;
}

function pickText(pt: string, en: string | null, locale: Locale): string {
  return locale === "en" && en ? en : pt;
}

export function FaqSection({ entries, locale = "pt" }: FaqSectionProps) {
  const visible = entries.filter((e) => e.isVisible);
  if (visible.length === 0) return null;
  return (
    <section aria-labelledby="faq-heading">
      <h2
        id="faq-heading"
        className="text-7xl md:text-8xl text-center mb-10"
        style={{ fontFamily: "var(--font-display)", color: "#ffffff" }}
      >
        {locale === "pt" ? "Perguntas frequentes" : "FAQ"}
      </h2>
      <div className="mx-auto max-w-2xl space-y-3">
        {visible.map((entry) => (
          <details
            key={entry.id}
            className="border rounded p-4"
            style={{
              borderColor:
                "color-mix(in srgb, var(--color-primary) 40%, transparent)",
            }}
          >
            <summary className="cursor-pointer text-base font-medium">
              {pickText(entry.questionPt, entry.questionEn, locale)}
            </summary>
            <p className="mt-3 whitespace-pre-line text-sm leading-relaxed opacity-90">
              {pickText(entry.answerPt, entry.answerEn, locale)}
            </p>
          </details>
        ))}
      </div>
    </section>
  );
}
