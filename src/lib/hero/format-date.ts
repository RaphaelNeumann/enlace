export type Locale = "pt" | "en";

/**
 * Renders the wedding date as configured in /admin/site, treating the stored
 * Date as a naive wall-clock value (UTC components = the literal hours and
 * minutes the couple typed). The `timeZone` param is accepted but ignored —
 * timezone-aware rendering caused the displayed hour to drift on devices
 * whose runtime evaluated the timestamp in a different zone. Pinning to UTC
 * components matches the convention used by Programação's date formatter.
 */
export function formatHeroSubtitle(
  date: Date | null | undefined,
  _timeZone: string,
  locale: Locale,
): string | null {
  if (!date) return null;
  const intlLocale = locale === "pt" ? "pt-BR" : "en-US";
  const dateFmt = new Intl.DateTimeFormat(intlLocale, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
  const pad = (n: number) => String(n).padStart(2, "0");
  const datePart = dateFmt.format(date);
  const timePart = `${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}`;
  const connector = locale === "pt" ? " às " : " at ";
  return `${datePart}${connector}${timePart}`.toUpperCase();
}
