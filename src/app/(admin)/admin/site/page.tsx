import { getSiteSettings } from "@/lib/site-settings/get";
import { updateSiteSettingsAction } from "./actions";

const VISIBILITY_FLAGS = [
  ["showHero", "Hero / Countdown"],
  ["showCeremonyReception", "Programação"],
  ["showDressCode", "Traje"],
  ["showStory", "Nossa história"],
  ["showGifts", "Lista de presentes"],
  ["showTips", "Dicas"],
  ["showFaq", "FAQ"],
  ["showPhotoGallery", "Galeria de fotos"],
] as const;

function formatDateTimeForInput(d: Date | null): string {
  if (!d) return "";
  // datetime-local input expects "YYYY-MM-DDTHH:mm"
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}` +
    `T${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`
  );
}

export default async function AdminSitePage() {
  const settings = await getSiteSettings();
  return (
    <main className="mx-auto max-w-3xl px-6 py-10 space-y-8">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Configurações do site</h1>
        <p className="text-sm opacity-70">
          Edite as informações principais do casamento. As mudanças aparecem no site público sem redeploy.
        </p>
      </header>

      <form action={updateSiteSettingsAction} className="space-y-8">
        <section className="space-y-3">
          <h2 className="text-lg font-medium">Casal</h2>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Nome 1" name="partner1Name" defaultValue={settings.partner1Name} />
            <Field label="Apelido 1" name="partner1ShortName" defaultValue={settings.partner1ShortName} hint="Usado no monograma." />
            <Field label="Nome 2" name="partner2Name" defaultValue={settings.partner2Name} />
            <Field label="Apelido 2" name="partner2ShortName" defaultValue={settings.partner2ShortName} />
          </div>
          <Select
            label="Ordem dos nomes"
            name="partnersOrder"
            defaultValue={settings.partnersOrder}
            options={[
              { value: "p1-p2", label: "Nome 1 & Nome 2" },
              { value: "p2-p1", label: "Nome 2 & Nome 1" },
            ]}
          />
          <Field
            label="Iniciais (override)"
            name="monogramInitialsOverride"
            defaultValue={settings.monogramInitialsOverride ?? ""}
            hint="Opcional. Deixe vazio para derivar dos apelidos."
          />
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-medium">Data e local</h2>
          <Field
            label="Data e hora do casamento"
            name="weddingDate"
            type="datetime-local"
            defaultValue={formatDateTimeForInput(settings.weddingDate)}
          />
          <Field
            label="Fuso horário (IANA)"
            name="weddingTimeZone"
            defaultValue={settings.weddingTimeZone}
            hint="Ex.: America/Sao_Paulo"
          />
          <Field label="Local (nome curto)" name="venueShortName" defaultValue={settings.venueShortName} />
          <Field
            label="Endereço para Google Maps (SEO)"
            name="venueAddressForMaps"
            defaultValue={settings.venueAddressForMaps ?? ""}
          />
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-medium">Metadados</h2>
          <Field label="Título do site (PT)" name="siteTitlePt" defaultValue={settings.siteTitlePt} />
          <Field label="Title (EN)" name="siteTitleEn" defaultValue={settings.siteTitleEn ?? ""} />
          <Field
            label="Descrição (PT)"
            name="metaDescriptionPt"
            defaultValue={settings.metaDescriptionPt}
          />
          <Field
            label="Description (EN)"
            name="metaDescriptionEn"
            defaultValue={settings.metaDescriptionEn ?? ""}
          />
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-medium">Seções visíveis</h2>
          <p className="text-xs opacity-70">Desmarque para esconder a seção do site público.</p>
          <div className="grid grid-cols-2 gap-2">
            {VISIBILITY_FLAGS.map(([name, label]) => (
              <label key={name} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name={name}
                  defaultChecked={settings[name as keyof typeof settings] as boolean}
                />
                {label}
              </label>
            ))}
            <label className="flex items-center gap-2 text-sm col-span-2">
              <input
                type="checkbox"
                name="photoGalleryAsSubpage"
                defaultChecked={settings.photoGalleryAsSubpage}
              />
              Galeria como subpágina (em vez de inline na home)
            </label>
          </div>
        </section>

        <button
          type="submit"
          className="rounded border border-current px-4 py-2 text-sm tracking-wide uppercase"
        >
          Salvar
        </button>
      </form>
    </main>
  );
}

function Field({
  label,
  name,
  defaultValue,
  type = "text",
  hint,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  type?: string;
  hint?: string;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="font-medium">{label}</span>
      <input
        type={type}
        name={name}
        defaultValue={defaultValue}
        className="rounded border px-3 py-2"
      />
      {hint ? <span className="text-xs opacity-60">{hint}</span> : null}
    </label>
  );
}

function Select({
  label,
  name,
  defaultValue,
  options,
}: {
  label: string;
  name: string;
  defaultValue: string;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="font-medium">{label}</span>
      <select name={name} defaultValue={defaultValue} className="rounded border px-3 py-2">
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
