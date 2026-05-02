import { listGifts } from "@/lib/gifts/db";
import { createGiftAction, deleteGiftAction, updateGiftAction } from "./actions";

export default async function AdminGiftsPage() {
  const items = await listGifts();
  return (
    <main className="mx-auto max-w-3xl px-6 py-10 space-y-8">
      <h1 className="text-2xl font-semibold">Lista de presentes</h1>

      <section className="border rounded p-4 space-y-2">
        <h2 className="text-lg font-medium">Adicionar presente</h2>
        <form action={createGiftAction} className="space-y-2">
          <input name="titlePt" required placeholder="Título (PT)" className="w-full rounded border px-3 py-2" />
          <input name="titleEn" placeholder="Title (EN)" className="w-full rounded border px-3 py-2" />
          <textarea name="descriptionPt" rows={3} placeholder="Descrição (PT)" className="w-full rounded border px-3 py-2" />
          <textarea name="descriptionEn" rows={3} placeholder="Description (EN)" className="w-full rounded border px-3 py-2" />
          <input name="photoStoragePath" placeholder="gifts/foto.jpg (Supabase)" className="w-full rounded border px-3 py-2" />
          <input name="externalUrl" placeholder="https://..." className="w-full rounded border px-3 py-2" />
          <input
            name="suggestedAmountCents"
            type="number"
            min={0}
            placeholder="Valor sugerido (em centavos)"
            className="w-full rounded border px-3 py-2"
          />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="isVisible" defaultChecked /> Visível
          </label>
          <button type="submit" className="rounded border px-4 py-2 text-sm">
            Adicionar
          </button>
        </form>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-medium">Existentes ({items.length})</h2>
        {items.length === 0 ? <p className="text-sm opacity-70">Nenhum presente ainda.</p> : null}
        {items.map((g) => (
          <div key={g.id} className="border rounded p-4 space-y-2">
            <form
              action={async (fd: FormData) => {
                "use server";
                await updateGiftAction(g.id, fd);
              }}
              className="space-y-2"
            >
              <input name="titlePt" defaultValue={g.titlePt} className="w-full rounded border px-3 py-2" />
              <input name="titleEn" defaultValue={g.titleEn ?? ""} className="w-full rounded border px-3 py-2" />
              <textarea name="descriptionPt" defaultValue={g.descriptionPt} rows={3} className="w-full rounded border px-3 py-2" />
              <textarea name="descriptionEn" defaultValue={g.descriptionEn ?? ""} rows={3} className="w-full rounded border px-3 py-2" />
              <input name="photoStoragePath" defaultValue={g.photoStoragePath ?? ""} className="w-full rounded border px-3 py-2" />
              <input name="externalUrl" defaultValue={g.externalUrl ?? ""} className="w-full rounded border px-3 py-2" />
              <input
                name="suggestedAmountCents"
                type="number"
                min={0}
                defaultValue={g.suggestedAmountCents ?? ""}
                className="w-full rounded border px-3 py-2"
              />
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="isVisible" defaultChecked={g.isVisible} /> Visível
              </label>
              <button type="submit" className="rounded border px-3 py-1 text-sm">
                Salvar
              </button>
            </form>
            <form
              action={async () => {
                "use server";
                await deleteGiftAction(g.id);
              }}
            >
              <button type="submit" className="rounded border px-3 py-1 text-sm opacity-70">
                Apagar
              </button>
            </form>
          </div>
        ))}
      </section>
    </main>
  );
}
