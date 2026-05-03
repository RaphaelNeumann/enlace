import type { StoryContent } from "@/lib/story/db";
import type { Locale } from "@/lib/hero/format-date";
import { publicUrl } from "@/lib/storage/supabase";

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
  const photos = [
    content.photo1StoragePath,
    content.photo2StoragePath,
    content.photo3StoragePath,
  ].filter((p): p is string => Boolean(p));
  const photoUrls = supabaseProjectUrl
    ? photos.map((p) => publicUrl({ projectUrl: supabaseProjectUrl, bucket: "site", path: p }))
    : [];
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
        className="text-5xl mb-10"
        style={{ fontFamily: "var(--font-display)" }}
      >
        {locale === "pt" ? "Nossa história" : "Our story"}
      </h2>
      {photoUrls.length > 0 ? (
        <div className="flex justify-center gap-6 mb-10 flex-wrap">
          {photoUrls.map((url, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={url}
              src={url}
              alt={`Foto ${i + 1}`}
              className="rounded-full object-cover"
              width={160}
              height={160}
            />
          ))}
        </div>
      ) : null}
      {body ? (
        <p className="mx-auto max-w-2xl whitespace-pre-line text-base leading-relaxed">
          {body}
        </p>
      ) : null}
    </section>
  );
}
