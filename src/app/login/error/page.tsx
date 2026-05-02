import { Monogram } from "@/components/monogram";
import { getSiteSettings } from "@/lib/site-settings/get";

const ERROR_COPY: Record<string, string> = {
  AccessDenied: "Esse e-mail não tem acesso ao painel.",
  Verification: "O link expirou ou já foi utilizado. Solicite um novo.",
  Configuration: "Configuração do servidor incompleta. Avise o casal.",
  EmailSignin: "Falha ao enviar o e-mail. Tente novamente em alguns minutos.",
  Default: "Não foi possível fazer login. Tente novamente.",
};

export default async function LoginErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const sp = await searchParams;
  const message = ERROR_COPY[sp.error ?? "Default"] ?? ERROR_COPY.Default;
  const settings = await getSiteSettings();
  return (
    <main className="flex-1 flex flex-col items-center justify-center px-6 py-16">
      <div className="text-center space-y-4 max-w-md">
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
          Algo deu errado
        </h1>
        <p
          className="text-sm rounded border px-3 py-2"
          role="alert"
          style={{ borderColor: "var(--color-accent)", color: "var(--color-accent)" }}
        >
          {message}
        </p>
        <p>
          <a href="/login" className="text-sm underline opacity-70">
            Voltar ao login
          </a>
        </p>
      </div>
    </main>
  );
}
