export type Locale = "pt" | "en";

export function formatHeroSubtitle(
  date: Date | null | undefined,
  timeZone: string,
  locale: Locale,
): string | null {
  if (!date) return null;
  const intlLocale = locale === "pt" ? "pt-BR" : "en-US";
  const dateFmt = new Intl.DateTimeFormat(intlLocale, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone,
  });
  const timeFmt = new Intl.DateTimeFormat(intlLocale, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone,
  });
  const datePart = dateFmt.format(date);
  const timePart = timeFmt.format(date);
  const connector = locale === "pt" ? " às " : " at ";
  return `${datePart}${connector}${timePart}`.toUpperCase();
}
