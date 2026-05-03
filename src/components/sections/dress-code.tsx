import type { DressCode } from "@/lib/dress-code/db";
import type { Locale } from "@/lib/hero/format-date";
import { publicUrl } from "@/lib/storage/supabase";

export interface DressCodeSectionProps {
  content: DressCode;
  locale?: Locale;
  /** When set, allows resolving the women/men icon storage paths into URLs. */
  supabaseProjectUrl?: string;
}

function pickText(pt: string, en: string | null, locale: Locale): string {
  return locale === "en" && en ? en : pt;
}

export function DressCodeSection({
  content,
  locale = "pt",
  supabaseProjectUrl,
}: DressCodeSectionProps) {
  const headline = pickText(content.headlinePt, content.headlineEn, locale);
  const intro = pickText(content.introPt, content.introEn, locale);
  const womenTitle = pickText(content.womenTitlePt, content.womenTitleEn, locale);
  const womenBody = pickText(content.womenBodyPt, content.womenBodyEn, locale);
  const menTitle = pickText(content.menTitlePt, content.menTitleEn, locale);
  const menBody = pickText(content.menBodyPt, content.menBodyEn, locale);
  function resolveIcon(rawPath: string | null | undefined): string | null {
    const path = rawPath?.trim();
    if (!path) return null;
    if (/^https?:\/\//.test(path)) return path;
    if (!supabaseProjectUrl) return null;
    return publicUrl({ projectUrl: supabaseProjectUrl, bucket: "site", path });
  }
  const womenIconUrl = resolveIcon(content.womenIconImageStoragePath);
  const menIconUrl = resolveIcon(content.menIconImageStoragePath);
  return (
    <section
      className="py-20 px-6 text-center"
      aria-labelledby="dress-code-heading"
      style={{ color: "#5b6946" }}
    >
      <div className="mx-auto max-w-5xl space-y-7">
        <h2
          id="dress-code-heading"
          className="text-8xl md:text-9xl"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {locale === "pt" ? "Traje" : "Dress code"}
        </h2>
        {headline ? (
          <p
            className="text-lg md:text-xl tracking-[0.18em] uppercase"
            style={{ fontFamily: "var(--font-caps)" }}
          >
            {headline}
          </p>
        ) : null}
        {intro ? (
          <p
            className="mx-auto max-w-3xl whitespace-pre-line text-lg md:text-xl tracking-[0.16em] leading-relaxed"
            style={{ fontFamily: "var(--font-caps)" }}
          >
            {intro}
          </p>
        ) : null}
        <div className="grid md:grid-cols-2 gap-10 pt-4">
          <div className="space-y-4">
            {womenIconUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={womenIconUrl}
                alt=""
                aria-hidden="true"
                className="mx-auto h-auto w-[20%] object-contain"
              />
            ) : null}
            <h3
              className="text-6xl md:text-7xl"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {womenTitle}
            </h3>
            <p
              className="whitespace-pre-line text-lg md:text-xl tracking-[0.16em] leading-relaxed"
              style={{ fontFamily: "var(--font-caps)" }}
            >
              {womenBody}
            </p>
          </div>
          <div className="space-y-4">
            {menIconUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={menIconUrl}
                alt=""
                aria-hidden="true"
                className="mx-auto h-auto w-[20%] object-contain"
              />
            ) : null}
            <h3
              className="text-6xl md:text-7xl"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {menTitle}
            </h3>
            <p
              className="whitespace-pre-line text-lg md:text-xl tracking-[0.16em] leading-relaxed"
              style={{ fontFamily: "var(--font-caps)" }}
            >
              {menBody}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
