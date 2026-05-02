import { Monogram, deriveInitials } from "@/components/monogram";
import { formatHeroSubtitle, type Locale } from "@/lib/hero/format-date";
import { computeCountdown } from "@/lib/hero/countdown";
import { formatCoupleNames } from "@/components/site-footer";
import type { SiteSettings } from "@/lib/site-settings/get";

export interface HeroProps {
  settings: SiteSettings;
  locale?: Locale;
  now?: Date;
}

export function Hero({ settings, locale = "pt", now = new Date() }: HeroProps) {
  const initials =
    settings.monogramInitialsOverride ??
    deriveInitials(settings.partner1ShortName, settings.partner2ShortName);
  const coupleNames = formatCoupleNames({
    partner1Name: settings.partner1Name,
    partner2Name: settings.partner2Name,
    partnersOrder: settings.partnersOrder,
  });
  const subtitle = formatHeroSubtitle(
    settings.weddingDate,
    settings.weddingTimeZone,
    locale,
  );
  const countdown = computeCountdown(settings.weddingDate, now);
  return (
    <section className="text-center py-16 px-6 space-y-8" aria-labelledby="hero-heading">
      <div style={{ color: "var(--color-primary)" }}>
        <Monogram
          partner1ShortName={settings.partner1ShortName}
          partner2ShortName={settings.partner2ShortName}
          override={initials}
          size={120}
          className="mx-auto"
        />
      </div>
      <h1
        id="hero-heading"
        className="text-6xl md:text-7xl"
        style={{ fontFamily: "var(--font-display)", color: "var(--color-foreground)" }}
      >
        {coupleNames || "—"}
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
    </section>
  );
}
