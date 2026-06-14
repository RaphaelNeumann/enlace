import { redirect } from "next/navigation";
import { AuthError } from "next-auth";
import { auth, signIn } from "@/lib/auth";
import { isAdminRole } from "@/lib/server-auth/assert-role";
import { getSiteSettings } from "@/lib/site-settings/get";
import { Monogram } from "@/components/monogram";

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
  const settings = await getSiteSettings();
  const callbackUrl = sp.callbackUrl ?? "/admin";

  async function sendMagicLink(formData: FormData): Promise<void> {
    "use server";
    try {
      // Server-side signIn runs with skipCSRFCheck and writes the auth
      // cookies straight to the browser, so it avoids the double-submit
      // CSRF cookie mismatch that a raw POST to /api/auth/signin/resend hits.
      await signIn("resend", formData);
    } catch (error) {
      if (error instanceof AuthError) {
        redirect(`/login?error=${error.type}`);
      }
      throw error;
    }
  }

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
        <form action={sendMagicLink} className="space-y-3 text-left">
          <input type="hidden" name="redirectTo" value={callbackUrl} />
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
    case "Resend":
      return "Falha ao enviar o e-mail. Tente novamente em alguns minutos.";
    case "Configuration":
      return "Configuração do servidor incompleta. Avise o casal.";
    default:
      return "Não foi possível fazer login. Tente novamente.";
  }
}
