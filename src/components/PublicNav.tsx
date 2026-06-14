"use client";

import { useEffect, useState } from "react";

export interface PublicNavItem {
  /** Anchor to a section heading id, e.g. "#gifts-heading". */
  href: string;
  label: string;
}

/**
 * Fixed top navigation for the public home page. Hidden while the hero is on
 * screen and slides in once the hero has scrolled out of view (observed via
 * IntersectionObserver on the `#hero` section).
 */
export function PublicNav({
  items,
  brand,
}: {
  items: PublicNavItem[];
  brand?: string;
}) {
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const hero = document.getElementById("hero");
    if (!hero) return;
    const observer = new IntersectionObserver(
      ([entry]) => setShown(!entry.isIntersecting),
      { threshold: 0 },
    );
    observer.observe(hero);
    return () => observer.disconnect();
  }, []);

  if (items.length === 0) return null;

  return (
    <nav
      aria-label="Navegação do site"
      className={`fixed inset-x-0 top-0 z-40 border-b shadow-sm transition-all duration-300 ${
        shown
          ? "translate-y-0 opacity-100"
          : "-translate-y-full opacity-0 pointer-events-none"
      }`}
      style={{
        backgroundColor: "var(--color-background)",
        color: "var(--color-foreground)",
        borderColor: "color-mix(in srgb, var(--color-primary) 20%, transparent)",
      }}
    >
      <div className="mx-auto max-w-5xl px-6 h-14 flex items-center gap-5 overflow-x-auto">
        {brand ? (
          <a
            href="#hero"
            className="shrink-0 mr-auto whitespace-nowrap text-lg"
            style={{
              fontFamily: "var(--font-display)",
              color: "var(--color-primary)",
            }}
          >
            {brand}
          </a>
        ) : null}
        {items.map((item) => (
          <a
            key={item.href}
            href={item.href}
            className="shrink-0 whitespace-nowrap text-xs uppercase tracking-widest transition-opacity hover:opacity-60"
          >
            {item.label}
          </a>
        ))}
      </div>
    </nav>
  );
}
