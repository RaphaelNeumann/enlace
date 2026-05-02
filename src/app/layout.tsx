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
          backgroundColor: "var(--color-background)",
          color: "var(--color-foreground)",
          fontFamily: "var(--font-body, serif)",
        }}
      >
        {children}
      </body>
    </html>
  );
}
