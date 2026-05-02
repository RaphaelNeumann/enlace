import { Monogram } from "@/components/monogram";
import { getSiteSettings } from "@/lib/site-settings/get";

export default async function LoginVerifyPage() {
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
          Verifique seu e-mail
        </h1>
        <p className="text-sm opacity-80">
          Enviamos um link de acesso para sua caixa de entrada. Confira também a pasta de spam.
        </p>
        <p>
          <a href="/login" className="text-sm underline opacity-70">
            Voltar
          </a>
        </p>
      </div>
    </main>
  );
}
