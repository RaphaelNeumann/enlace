import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { isAdminRole } from "@/lib/server-auth/assert-role";
import { getSiteSettings } from "@/lib/site-settings/get";
import { Monogram } from "@/components/monogram";

async function getCsrfToken(): Promise<string | null> {
  try {
    const h = await headers();
    const host = h.get("host") ?? "localhost:3000";
    const proto = h.get("x-forwarded-proto") ?? "http";
    const url = `${proto}://${host}/api/auth/csrf`;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return null;
    const data = (await res.json()) as { csrfToken?: string };
    return data.csrfToken ?? null;
  } catch {
    return null;
  }
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>;
}) {
  const sp = await searchParams;
  const session = await auth();
  if (isAdminRole(session?.user?.role)) {
    redirect(sp.callbackUrl ?? "/admin");
  }
  const [csrf, settings] = await Promise.all([getCsrfToken(), getSiteSettings()]);
  const callbackUrl = sp.callbackUrl ?? "/admin";
  return (
    <main className="flex-1 flex flex-col items-center justify-center px-6 py-16">
      <div
        className="text-center space-y-6"
        style={{ color: "var(--color-foreground)" }}
      >
        <div style={{ color: "var(--color-primary)" }}>
          <Monogram
            partner1ShortName={settings.partner1ShortName || "·"}
            partner2ShortName={settings.partner2ShortName || "·"}
            override={settings.monogramInitialsOverride ?? undefined}
            size={84}
            className="mx-auto"
          />
        </div>
        <h1
          className="text-3xl"
          style={{ fontFamily: "var(--font-display)", color: "var(--color-primary)" }}
        >
          Acesso restrito
        </h1>
        <p className="text-sm opacity-70">
          Insira seu e-mail para receber um link de acesso ao painel.
        </p>
        {sp.error ? (
          <p
            className="text-sm rounded border px-3 py-2"
            role="alert"
            style={{
              borderColor: "var(--color-accent)",
              color: "var(--color-accent)",
            }}
          >
            {mapErrorMessage(sp.error)}
          </p>
        ) : null}
        <form
          method="post"
          action="/api/auth/signin/resend"
          className="space-y-3 text-left"
        >
          {csrf ? <input type="hidden" name="csrfToken" value={csrf} /> : null}
          <input type="hidden" name="callbackUrl" value={callbackUrl} />
          <label className="block text-sm">
            <span className="font-medium">E-mail</span>
            <input
              type="email"
              name="email"
              required
              autoFocus
              className="mt-1 w-full rounded border px-3 py-2"
              style={{ borderColor: "var(--color-primary)" }}
            />
          </label>
          <button
            type="submit"
            className="w-full rounded border px-4 py-2 text-sm uppercase tracking-wider"
            style={{
              borderColor: "var(--color-primary)",
              color: "var(--color-primary)",
            }}
          >
            Receber link
          </button>
        </form>
      </div>
    </main>
  );
}

function mapErrorMessage(code: string): string {
  switch (code) {
    case "AccessDenied":
      return "Esse e-mail não tem acesso ao painel.";
    case "Verification":
      return "O link expirou ou já foi utilizado. Solicite um novo.";
    case "EmailSignin":
      return "Falha ao enviar o e-mail. Tente novamente em alguns minutos.";
    case "Configuration":
      return "Configuração do servidor incompleta. Avise o casal.";
    default:
      return "Não foi possível fazer login. Tente novamente.";
  }
}
