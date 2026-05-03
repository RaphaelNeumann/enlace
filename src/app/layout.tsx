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
          // Layer 1 (top): a tinted overlay using the configured background
          // colour, opaque up to --background-texture-overlay. This lets the
          // paper texture peek through without dominating.
          // Layer 2 (bottom): the texture itself, sized to cover the viewport
          // so it never tiles (no visible seams) and pinned with
          // background-attachment: fixed so long-scroll pages keep using
          // the same paper image.
          backgroundColor: "var(--color-background)",
          backgroundImage:
            "linear-gradient(" +
            "color-mix(in srgb, var(--color-background) var(--background-texture-overlay), transparent), " +
            "color-mix(in srgb, var(--color-background) var(--background-texture-overlay), transparent)" +
            "), var(--background-texture)",
          backgroundSize: "auto, cover",
          backgroundPosition: "center center, center center",
          backgroundRepeat: "no-repeat, no-repeat",
          backgroundAttachment: "fixed, fixed",
          color: "var(--color-foreground)",
          fontFamily: "var(--font-body, serif)",
        }}
      >
        {children}
      </body>
    </html>
  );
}
