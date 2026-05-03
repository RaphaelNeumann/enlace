import { Monogram, deriveInitials } from "@/components/monogram";
import { formatHeroSubtitle, type Locale } from "@/lib/hero/format-date";
import { computeCountdown } from "@/lib/hero/countdown";
import { publicUrl } from "@/lib/storage/supabase";
import type { SiteSettings } from "@/lib/site-settings/get";

export interface HeroProps {
  settings: SiteSettings;
  locale?: Locale;
  now?: Date;
  /** When set, allows resolving monogramImageStoragePath into a public URL. */
  supabaseProjectUrl?: string;
}

export function Hero({
  settings,
  locale = "pt",
  now = new Date(),
  supabaseProjectUrl,
}: HeroProps) {
  const initials =
    settings.monogramInitialsOverride ??
    deriveInitials(settings.partner1ShortName, settings.partner2ShortName);
  const firstLine = (
    settings.partnersOrder === "p1-p2"
      ? settings.partner1Name
      : settings.partner2Name
  ).trim();
  const secondLine = (
    settings.partnersOrder === "p1-p2"
      ? settings.partner2Name
      : settings.partner1Name
  ).trim();
  const hasBothNames = firstLine.length > 0 && secondLine.length > 0;
  const fallback = firstLine || secondLine || "—";
  const subtitle = formatHeroSubtitle(
    settings.weddingDate,
    settings.weddingTimeZone,
    locale,
  );
  const countdown = computeCountdown(settings.weddingDate, now);
  // A custom monogram image takes precedence over the generated SVG. We
  // accept either a Supabase Storage path (resolved to a public URL) or
  // an absolute http(s) URL the admin pasted in.
  const monogramImageUrl = (() => {
    const path = settings.monogramImageStoragePath?.trim();
    if (!path) return null;
    if (/^https?:\/\//.test(path)) return path;
    if (!supabaseProjectUrl) return null;
    return publicUrl({ projectUrl: supabaseProjectUrl, bucket: "site", path });
  })();
  const monogramAltLabel =
    settings.partner1ShortName && settings.partner2ShortName
      ? `Monograma de ${settings.partner1ShortName} e ${settings.partner2ShortName}`
      : "Monograma";
  return (
    <section className="py-16 px-6" aria-labelledby="hero-heading">
      {/*
        The hero content sits inside a centred bordered card so the section
        reads as the wedding invitation itself — thin sage frame, generous
        padding, the paper texture from <html> showing through.
      */}
      <div
        className="mx-auto max-w-md text-center px-8 py-12 space-y-8"
        style={{
          border:
            "1px solid color-mix(in srgb, var(--color-primary) 55%, transparent)",
          borderRadius: "var(--radius-md)",
        }}
      >
        <div style={{ color: "var(--color-primary)" }}>
          {monogramImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={monogramImageUrl}
              alt={monogramAltLabel}
              width={120}
              height={120}
              className="mx-auto h-auto max-h-32 w-auto max-w-[180px] object-contain"
            />
          ) : (
            <Monogram
              partner1ShortName={settings.partner1ShortName}
              partner2ShortName={settings.partner2ShortName}
              override={initials}
              size={120}
              className="mx-auto"
            />
          )}
        </div>
        <h1
          id="hero-heading"
          className="text-6xl md:text-7xl leading-tight"
          style={{ fontFamily: "var(--font-display)", color: "var(--color-foreground)" }}
        >
          {hasBothNames ? (
            <>
              <span className="block">{firstLine}</span>
              <span className="block text-5xl md:text-6xl">&amp;</span>
              <span className="block">{secondLine}</span>
            </>
          ) : (
            fallback
          )}
        </h1>
        {subtitle ? (
          <p
            className="text-sm tracking-[0.18em]"
            style={{ color: "var(--color-foreground)" }}
          >
            {subtitle}
          </p>
        ) : null}
        {countdown && countdown.state !== "hidden" ? (
          <p
            aria-live="polite"
            className="text-sm tracking-[0.16em] uppercase"
            style={{ color: "var(--color-primary)" }}
          >
            {countdown.state === "today"
              ? locale === "pt"
                ? "Hoje"
                : "Today"
              : locale === "pt"
                ? `Faltam ${countdown.daysRemaining} dia${countdown.daysRemaining === 1 ? "" : "s"}`
                : `${countdown.daysRemaining} day${countdown.daysRemaining === 1 ? "" : "s"} to go`}
          </p>
        ) : null}
      </div>
    </section>
  );
}
