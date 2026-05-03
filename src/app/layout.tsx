import type { Metadata } from "next";
import { headers } from "next/headers";
import { theme } from "@/config/wedding.config";
import { themeToCssBlock } from "@/lib/theme";
import { allFontVariables } from "@/lib/theme/fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "enlace",
  description: "Wedding website",
};

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
