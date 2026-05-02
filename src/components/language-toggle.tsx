import * as React from "react";

export type Locale = "pt" | "en";

export function otherLocale(current: Locale): Locale {
  return current === "pt" ? "en" : "pt";
}

function stripLocale(pathname: string): string {
  const match = pathname.match(/^\/(pt|en)(\/.*)?$/);
  if (match) return match[2] ?? "/";
  return pathname.startsWith("/") ? pathname : `/${pathname}`;
}

function buildHref(target: Locale, pathname: string): string {
  const stripped = stripLocale(pathname);
  if (stripped === "/") return `/${target}`;
  return `/${target}${stripped}`;
}

export interface LanguageToggleProps {
  currentLocale: Locale;
  pathname: string;
  className?: string;
}

const LOCALE_LABELS: Record<Locale, string> = {
  pt: "PT",
  en: "EN",
};

const LOCALE_NAMES: Record<Locale, string> = {
  pt: "Português",
  en: "English",
};

export function LanguageToggle({
  currentLocale,
  pathname,
  className,
}: LanguageToggleProps) {
  const target = otherLocale(currentLocale);
  const href = buildHref(target, pathname);
  return (
    <a
      href={href}
      aria-label={`Mudar idioma para ${LOCALE_NAMES[target]}`}
      className={className}
    >
      <span aria-hidden={target !== "pt"}>{LOCALE_LABELS.pt}</span>
      <span aria-hidden> / </span>
      <span aria-hidden={target !== "en"}>{LOCALE_LABELS.en}</span>
    </a>
  );
}
