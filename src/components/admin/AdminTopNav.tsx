"use client";

import { usePathname, useRouter } from "next/navigation";
import { ADMIN_LINKS } from "./admin-links";

export function AdminTopNav() {
  const pathname = usePathname();
  const router = useRouter();
  const currentValue = ADMIN_LINKS.some((l) => l.href === pathname)
    ? pathname
    : "";
  return (
    <nav
      className="mx-auto max-w-7xl px-4 md:px-6 pt-4 flex items-center gap-3"
      aria-label="Navegação do administrador"
    >
      <a
        href="/admin"
        className="rounded border bg-white px-3 py-2 text-sm shadow-sm hover:opacity-80"
      >
        ← Painel
      </a>
      <label className="flex-1 text-sm">
        <span className="sr-only">Trocar de seção</span>
        <select
          value={currentValue}
          onChange={(e) => {
            const next = e.currentTarget.value;
            if (next) router.push(next);
          }}
          className="w-full rounded border bg-white px-3 py-2 text-sm shadow-sm"
        >
          <option value="">Ir para outra seção...</option>
          {ADMIN_LINKS.map((l) => (
            <option key={l.href} value={l.href}>
              {l.label}
            </option>
          ))}
        </select>
      </label>
    </nav>
  );
}
