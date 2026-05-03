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
    <html lang="pt-BR" className={`${allFontVariables} h-full antialiased`}>
      <head>
        <style nonce={nonce} dangerouslySetInnerHTML={{ __html: themeCss }} />
      </head>
      <body
        className="min-h-full flex flex-col"
        style={{
          // Two-layer background applied to the body so it scrolls with
          // the document (no parallax / fixed-attachment "site sliding
          // over a frozen photo" feel).
          //
          // Layer 1 (top): a tinted overlay using the configured background
          // colour, opaque up to --background-texture-overlay. The
          // gradient is what gives the paper its tinted-paper feel —
          // texture peeks through at the configured strength.
          // Layer 2 (bottom): the texture itself, stretched to cover the
          // entire body (which spans the whole document on a long-scroll
          // page) as a single image — no tiling, no seams. Slight
          // vertical stretch is invisible because paper grain is a
          // near-uniform random pattern.
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
          fontFamily: "var(--font-body, serif)",
        }}
      >
        {children}
      </body>
    </html>
  );
}
