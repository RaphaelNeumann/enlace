import { listProgramacao } from "@/lib/programacao/db";
import { ConfirmingForm } from "@/components/admin/ConfirmingForm";
import { UploadField } from "@/components/admin/UploadField";
import { updateCardAction } from "./actions";

function dateToInput(d: Date | null): string {
  if (!d) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}

export default async function AdminProgramacaoPage() {
  const cards = await listProgramacao();
  const ordered = [...cards].sort((a, b) => {
    const order = ["ceremony", "reception"];
    return order.indexOf(a.id) - order.indexOf(b.id);
  });
  return (
    <main className="mx-auto max-w-5xl px-6 py-10 space-y-8">
      <h1 className="text-2xl font-semibold">Programação</h1>
      {ordered.map((card) => (
        <section key={card.id} className="border rounded p-4 space-y-3">
          <h2 className="text-lg font-medium">
            {card.id === "ceremony" ? "Cerimônia" : "Recepção"}
          </h2>
          <ConfirmingForm
            action={async (fd: FormData) => {
              "use server";
              await updateCardAction(card.id as "ceremony" | "reception", fd);
            }}
            confirmTitle={`Salvar ${card.id === "ceremony" ? "Cerimônia" : "Recepção"}?`}
            confirmDescription="As mudanças aparecem no site público imediatamente."
            className="space-y-2"
          >
            <input name="titlePt" defaultValue={card.titlePt} placeholder="Título (PT)" className="w-full rounded border px-3 py-2" />
            <input name="titleEn" defaultValue={card.titleEn ?? ""} placeholder="Title (EN)" className="w-full rounded border px-3 py-2" />
            <input type="date" name="date" defaultValue={dateToInput(card.date as Date | null)} className="w-full rounded border px-3 py-2" />
            <input name="time" defaultValue={card.time} placeholder="Horário (ex: 16h00)" className="w-full rounded border px-3 py-2" />
            <textarea name="addressPt" defaultValue={card.addressPt} rows={2} placeholder="Endereço (PT)" className="w-full rounded border px-3 py-2" />
            <textarea name="addressEn" defaultValue={card.addressEn ?? ""} rows={2} placeholder="Address (EN)" className="w-full rounded border px-3 py-2" />
            <input
              type="url"
              name="mapsUrl"
              defaultValue={card.mapsUrl ?? ""}
              placeholder="https://maps.google.com/..."
              className="w-full rounded border px-3 py-2"
            />
            <input name="iconKey" defaultValue={card.iconKey} placeholder="Ícone (rings, glasses, ...)" className="w-full rounded border px-3 py-2" />
            <UploadField
              bucket="site"
              pathFieldName="iconImageStoragePath"
              defaultPath={card.iconImageStoragePath}
              label="Imagem do ícone (substitui o ícone padrão)"
            />
            <p className="text-xs opacity-60">
              Opcional. Quando uma imagem é enviada, ela aparece no topo do
              cartão. Aceita também colar uma URL absoluta (https://…).
            </p>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="isVisible" defaultChecked={card.isVisible} />
              Mostrar este cartão no site
            </label>
          </ConfirmingForm>
        </section>
      ))}
    </main>
  );
}
