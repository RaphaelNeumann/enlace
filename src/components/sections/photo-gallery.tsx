import type { Photo } from "@/lib/photos/db";
import type { Locale } from "@/lib/hero/format-date";
import { publicUrl } from "@/lib/storage/supabase";

export interface PhotoGallerySectionProps {
  photos: Photo[];
  locale?: Locale;
  supabaseProjectUrl?: string;
}

function pickCaption(pt: string | null, en: string | null, locale: Locale): string {
  return (locale === "en" && en) || pt || "";
}

export function PhotoGallerySection({ photos, locale = "pt", supabaseProjectUrl }: PhotoGallerySectionProps) {
  const visible = photos.filter((p) => p.isVisible);
  if (visible.length === 0) return null;
  return (
    <section className="py-20 px-6" aria-labelledby="gallery-heading">
      <h2
        id="gallery-heading"
        className="text-7xl md:text-8xl text-center mb-10"
        style={{ fontFamily: "var(--font-display)", color: "var(--color-primary)" }}
      >
        {locale === "pt" ? "Galeria" : "Gallery"}
      </h2>
      <div className="mx-auto max-w-5xl grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {visible.map((p) => {
          const url = supabaseProjectUrl
            ? publicUrl({ projectUrl: supabaseProjectUrl, bucket: "gallery", path: p.storagePath })
            : null;
          const caption = pickCaption(p.captionPt, p.captionEn, locale);
          return (
            <figure key={p.id} className="rounded overflow-hidden">
              {url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={url} alt={caption || ""} className="w-full aspect-square object-cover" loading="lazy" />
              ) : null}
              {caption ? <figcaption className="text-xs mt-1 px-1 opacity-80">{caption}</figcaption> : null}
            </figure>
          );
        })}
      </div>
    </section>
  );
}
