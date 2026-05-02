import type { DressCode } from "@/lib/dress-code/db";
import type { Locale } from "@/lib/hero/format-date";

export interface DressCodeSectionProps {
  content: DressCode;
  locale?: Locale;
}

function pickText(pt: string, en: string | null, locale: Locale): string {
  return locale === "en" && en ? en : pt;
}

export function DressCodeSection({ content, locale = "pt" }: DressCodeSectionProps) {
  const headline = pickText(content.headlinePt, content.headlineEn, locale);
  const intro = pickText(content.introPt, content.introEn, locale);
  const womenTitle = pickText(content.womenTitlePt, content.womenTitleEn, locale);
  const womenBody = pickText(content.womenBodyPt, content.womenBodyEn, locale);
  const menTitle = pickText(content.menTitlePt, content.menTitleEn, locale);
  const menBody = pickText(content.menBodyPt, content.menBodyEn, locale);
  return (
    <section className="py-20 px-6 text-center" aria-labelledby="dress-code-heading">
      <h2
        id="dress-code-heading"
        className="text-4xl mb-2"
        style={{ fontFamily: "var(--font-display)", color: "var(--color-primary)" }}
      >
        {locale === "pt" ? "Traje" : "Dress code"}
      </h2>
      {headline ? (
        <p className="text-sm tracking-[0.18em] uppercase mb-6">{headline}</p>
      ) : null}
      {intro ? (
        <p className="mx-auto max-w-2xl whitespace-pre-line mb-10 text-base leading-relaxed">
          {intro}
        </p>
      ) : null}
      <div className="mx-auto max-w-3xl grid md:grid-cols-2 gap-10">
        <div>
          <h3
            className="text-3xl mb-4"
            style={{ fontFamily: "var(--font-display)", color: "var(--color-primary)" }}
          >
            {womenTitle}
          </h3>
          <p className="whitespace-pre-line text-sm leading-relaxed">{womenBody}</p>
        </div>
        <div>
          <h3
            className="text-3xl mb-4"
            style={{ fontFamily: "var(--font-display)", color: "var(--color-primary)" }}
          >
            {menTitle}
          </h3>
          <p className="whitespace-pre-line text-sm leading-relaxed">{menBody}</p>
        </div>
      </div>
    </section>
  );
}
