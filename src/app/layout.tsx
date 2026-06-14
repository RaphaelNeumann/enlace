import type { Metadata } from "next";
import { headers } from "next/headers";
import { theme } from "@/config/wedding.config";
import { themeToCssBlock } from "@/lib/theme";
import { allFontVariables } from "@/lib/theme/fonts";
import { getSiteSettings } from "@/lib/site-settings/get";
import "./globals.css";

// Every route is dynamic by design: the nonce-based CSP (proxy.ts) and the
// `await headers()` below already opt out of static rendering, and pages read
// admin-managed content from the DB per request. Make it explicit so `next
// build` never tries to prerender a page — which would hit the DB at build
// time and time out (the home page export was failing after 60s ×3).
export const dynamic = "force-dynamic";

function coupleTitle(s: {
  partner1ShortName: string;
  partner2ShortName: string;
  partnersOrder: "p1-p2" | "p2-p1";
}): string {
  const p1 = s.partner1ShortName.trim();
  const p2 = s.partner2ShortName.trim();
  if (!p1 && !p2) return "enlace";
  const [a, b] = s.partnersOrder === "p2-p1" ? [p2, p1] : [p1, p2];
  return [a, b].filter(Boolean).join(" & ");
}

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  return {
    title: coupleTitle(settings),
    description: settings.metaDescriptionPt || "Wedding website",
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const requestHeaders = await headers();
  const nonce = requestHeaders.get("x-nonce") ?? undefined;
  const themeCss = themeToCssBlock(theme);
  return (
    <html
      lang="pt-BR"
      className={`${allFontVariables} antialiased`}
      // Two-layer background applied to <html> rather than <body>:
      // the root element's background is propagated to the entire
      // viewport canvas regardless of document scroll height, so even
      // tall long-scroll pages always show the textured paper from top
      // to bottom. Body stays transparent so the html background reads
      // through everywhere (including under sections that paint a tint
      // on top via color-mix).
      style={{
        backgroundColor: "var(--color-background)",
        backgroundImage:
          "linear-gradient(" +
          "color-mix(in srgb, var(--color-background) var(--background-texture-overlay), transparent), " +
          "color-mix(in srgb, var(--color-background) var(--background-texture-overlay), transparent)" +
          "), var(--background-texture)",
        backgroundSize: "cover, cover",
        backgroundPosition: "center center, center center",
        backgroundRepeat: "no-repeat, no-repeat",
        color: "var(--color-foreground)",
      }}
    >
      <head>
        <style nonce={nonce} dangerouslySetInnerHTML={{ __html: themeCss }} />
      </head>
      <body
        className="min-h-screen flex flex-col"
        style={{
          backgroundColor: "transparent",
          fontFamily: "var(--font-body, serif)",
        }}
      >
        {children}
      </body>
    </html>
  );
}
