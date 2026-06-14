"use client";

import { useEffect, useState } from "react";

export interface PublicNavItem {
  /** Anchor to a section heading id, e.g. "#gifts-heading". */
  href: string;
  label: string;
}

/**
 * Fixed top navigation for the public home page. Hidden while the hero's date +
 * countdown are on screen and slides in once the illustration point
 * (`#nav-trigger`) scrolls past the top. Links highlight (filled background) on
 * hover or while their section is the one currently in view (scroll-spy).
 */
export function PublicNav({
  items,
  brand,
}: {
  items: PublicNavItem[];
  brand?: string;
}) {
  const [shown, setShown] = useState(false);
  const [activeHref, setActiveHref] = useState<string | null>(null);
  const [hoverHref, setHoverHref] = useState<string | null>(null);

  // Reveal once the hero point just after the date + countdown scrolls above the
  // top of the viewport (where the illustration begins).
  useEffect(() => {
    const trigger = document.getElementById("nav-trigger");
    if (!trigger) return;
    const observer = new IntersectionObserver(
      ([entry]) => setShown(entry.boundingClientRect.top < 0),
      { threshold: 0 },
    );
    observer.observe(trigger);
    return () => observer.disconnect();
  }, []);

  // Scroll-spy: mark the link whose section is currently on screen.
  useEffect(() => {
    const hrefByEl = new Map<Element, string>();
    for (const item of items) {
      const section = document.getElementById(item.href.slice(1))?.closest("section");
      if (section) hrefByEl.set(section, item.href);
    }
    if (hrefByEl.size === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length === 0) return;
        const topmost = visible.reduce((a, b) =>
          a.boundingClientRect.top <= b.boundingClientRect.top ? a : b,
        );
        const href = hrefByEl.get(topmost.target);
        if (href) setActiveHref(href);
      },
      // Active band sits in the upper third of the viewport.
      { rootMargin: "-30% 0px -60% 0px", threshold: 0 },
    );
    hrefByEl.forEach((_, el) => observer.observe(el));
    return () => observer.disconnect();
  }, [items]);

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
      <div className="mx-auto max-w-5xl px-6 h-20 flex items-center gap-2 overflow-x-auto">
        {brand ? (
          <a
            href="#hero"
            className="shrink-0 mr-auto whitespace-nowrap text-3xl md:text-4xl leading-none"
            style={{
              fontFamily: "var(--font-display)",
              color: "var(--color-primary)",
            }}
          >
            {brand}
          </a>
        ) : null}
        {items.map((item) => {
          const filled = activeHref === item.href || hoverHref === item.href;
          return (
            <a
              key={item.href}
              href={item.href}
              onMouseEnter={() => setHoverHref(item.href)}
              onMouseLeave={() =>
                setHoverHref((h) => (h === item.href ? null : h))
              }
              className="shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 text-xs uppercase tracking-widest transition-colors"
              style={{
                backgroundColor: filled
                  ? "color-mix(in srgb, var(--color-primary) 16%, transparent)"
                  : "transparent",
              }}
            >
              {item.label}
            </a>
          );
        })}
      </div>
    </nav>
  );
}
