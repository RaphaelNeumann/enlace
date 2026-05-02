import * as React from "react";

function firstAsciiUpper(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  // Strip diacritics, keep first letter, uppercase.
  const ascii = trimmed.normalize("NFD").replace(/\p{Diacritic}/gu, "");
  return ascii.charAt(0).toUpperCase();
}

export function deriveInitials(
  partner1ShortName: string,
  partner2ShortName: string,
  override?: string | null,
): string {
  if (override && override.trim()) return override.trim();
  const p1 = firstAsciiUpper(partner1ShortName) ?? "·";
  const p2 = firstAsciiUpper(partner2ShortName) ?? "·";
  return `${p1}&${p2}`;
}

export interface MonogramProps {
  partner1ShortName: string;
  partner2ShortName: string;
  override?: string | null;
  size?: number;
  className?: string;
}

export function Monogram({
  partner1ShortName,
  partner2ShortName,
  override,
  size = 96,
  className,
}: MonogramProps) {
  const initials = deriveInitials(partner1ShortName, partner2ShortName, override);
  const ariaLabel =
    partner1ShortName && partner2ShortName
      ? `Monograma de ${partner1ShortName} e ${partner2ShortName}`
      : "Monograma";

  return (
    <svg
      role="img"
      aria-label={ariaLabel}
      viewBox="0 0 120 120"
      width={size}
      height={size}
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <circle
        cx="60"
        cy="60"
        r="54"
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
        opacity="0.6"
      />
      <text
        x="60"
        y="68"
        textAnchor="middle"
        fontFamily="var(--font-display, serif)"
        fontSize="32"
        fill="currentColor"
      >
        {initials}
      </text>
    </svg>
  );
}
