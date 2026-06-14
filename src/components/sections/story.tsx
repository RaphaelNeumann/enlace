import type { StoryContent } from "@/lib/story/db";
import type { Locale } from "@/lib/hero/format-date";
import { publicUrl } from "@/lib/storage/supabase";
import { Markdown } from "@/components/markdown";

export interface StoryProps {
  content: StoryContent;
  locale?: Locale;
  supabaseProjectUrl?: string;
}

function pickText(pt: string, en: string | null, locale: Locale): string {
  return locale === "en" && en ? en : pt;
}

export function Story({ content, locale = "pt", supabaseProjectUrl }: StoryProps) {
  const body = pickText(content.bodyPt, content.bodyEn, locale);
  function resolvePhoto(rawPath: string | null | undefined): string | null {
    const path = rawPath?.trim();
    if (!path) return null;
    if (/^https?:\/\//.test(path)) return path;
    if (!supabaseProjectUrl) return null;
    return publicUrl({ projectUrl: supabaseProjectUrl, bucket: "site", path });
  }
  const photoUrls = [
    content.photo1StoragePath,
    content.photo2StoragePath,
    content.photo3StoragePath,
  ]
    .map(resolvePhoto)
    .filter((u): u is string => Boolean(u));
  return (
    <section
      className="py-20 px-6 text-center"
      aria-labelledby="story-heading"
      style={{
        // Translucent sage tint — the html-level paper texture reads
        // clearly through the section so it feels like "coloured paper".
        backgroundColor: "color-mix(in srgb, var(--color-primary) 65%, transparent)",
        color: "var(--color-primary-foreground)",
      }}
    >
      <h2
        id="story-heading"
        className="text-7xl md:text-8xl mb-10"
        style={{ fontFamily: "var(--font-display)" }}
      >
        {locale === "pt" ? "Nossa história" : "Our story"}
      </h2>
      {photoUrls.length > 0 || body ? (
        <div
          className="mx-auto max-w-5xl rounded-md shadow-md p-8 md:p-12"
          style={{
            // White-cream "letter" sitting on the sage band — uses the
            // same `--color-card` cream as the gift dialog so the page-
            // level paper texture (on <html>) reads through visually.
            backgroundColor: "var(--color-card)",
            color: "var(--color-card-foreground)",
          }}
        >
          {photoUrls.length > 0 ? (
            <div className="flex justify-center gap-6 mb-8 flex-wrap">
              {photoUrls.map((url, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={url}
                  src={url}
                  alt={`Foto ${i + 1}`}
                  className="rounded-full object-cover w-32 h-32 md:w-60 md:h-60 shrink-0"
                  width={160}
                  height={160}
                />
              ))}
            </div>
          ) : null}
          {body ? (
            <Markdown
              source={body}
              className="text-lg leading-relaxed text-justify hyphens-auto"
            />
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
