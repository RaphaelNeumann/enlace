import { ImageResponse } from "next/og";
import { theme } from "@/config/wedding.config";
import { deriveInitials } from "@/components/monogram";
import { getSiteSettings } from "@/lib/site-settings/get";
import { publicUrl } from "@/lib/storage/supabase";

export const size = { width: 64, height: 64 };
export const contentType = "image/png";

function resolveMonogramUrl(rawPath: string | null | undefined): string | null {
  const path = rawPath?.trim();
  if (!path) return null;
  if (/^https?:\/\//.test(path)) return path;
  const projectUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (!projectUrl) return null;
  return publicUrl({ projectUrl, bucket: "site", path });
}

export default async function Icon() {
  const s = await getSiteSettings();
  const url = resolveMonogramUrl(s.monogramImageStoragePath);

  if (url) {
    const upstream = await fetch(url, { cache: "no-store" });
    if (upstream.ok) {
      const body = await upstream.arrayBuffer();
      return new Response(body, {
        headers: {
          "content-type":
            upstream.headers.get("content-type") ?? "image/png",
          "cache-control": "public, max-age=300, s-maxage=300",
        },
      });
    }
  }

  const initials = deriveInitials(
    s.partner1ShortName,
    s.partner2ShortName,
    s.monogramInitialsOverride,
  );
  const color = theme.colors.primary;

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          height: "100%",
          background: "transparent",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 56,
            height: 56,
            borderRadius: "50%",
            border: `2px solid ${color}`,
            color,
            fontFamily: "serif",
            fontSize: 22,
            letterSpacing: -1,
          }}
        >
          {initials}
        </div>
      </div>
    ),
    { ...size },
  );
}
