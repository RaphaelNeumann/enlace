import { NextResponse, type NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const isDev = process.env.NODE_ENV === "development";

  // Mercado Pago Wallet Brick (loaded inside the gift dialog) needs to
  // fetch its SDK from `sdk.mercadopago.com`, talk to MP's APIs, and
  // render branded assets inside an iframe. Origins are documented in
  // the MP Bricks integration guide.
  const mpScript = "https://sdk.mercadopago.com";
  const mpConnect =
    "https://api.mercadopago.com https://api.mercadolibre.com https://www.mercadopago.com https://www.mercadopago.com.br https://events.mercadolibre.com https://events.mercadopago.com";
  const mpFrame =
    "https://www.mercadopago.com https://www.mercadopago.com.br https://sdk.mercadopago.com";
  // Cloudflare Turnstile loads its bootstrap script from a fixed origin
  // and renders the challenge inside an iframe served by the same host.
  const turnstileOrigin = "https://challenges.cloudflare.com";
  // Supabase Storage signed-upload PUTs go directly from the browser to
  // the project origin — needs to be in `connect-src`.
  const supabaseOrigin = (() => {
    const raw = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
    if (!raw) return "";
    try {
      return new URL(raw).origin;
    } catch {
      return "";
    }
  })();

  const csp = [
    `default-src 'self'`,
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ""} ${mpScript} ${turnstileOrigin}`,
    `style-src 'self' ${isDev ? "'unsafe-inline'" : `'nonce-${nonce}'`}`,
    // Allow images from Supabase Storage and any pasted https URL — the
    // admin lets the owner paste arbitrary image URLs (monogram, hero
    // illustration, programação / dress-code icons, gift photos).
    `img-src 'self' blob: data: https:`,
    `font-src 'self'`,
    `connect-src 'self' ${mpConnect} ${turnstileOrigin}${supabaseOrigin ? ` ${supabaseOrigin}` : ""}`,
    `frame-src ${mpFrame} ${turnstileOrigin}`,
    `object-src 'none'`,
    `base-uri 'self'`,
    `form-action 'self'`,
    `frame-ancestors 'none'`,
    `upgrade-insecure-requests`,
  ].join("; ");

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", csp);
  return response;
}

export const config = {
  matcher: [
    {
      source: "/((?!api|_next/static|_next/image|favicon.ico).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
