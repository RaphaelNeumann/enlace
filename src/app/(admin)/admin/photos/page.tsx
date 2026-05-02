import { listPhotos } from "@/lib/photos/db";
import { createPhotoAction, deletePhotoAction, updatePhotoAction } from "./actions";

export default async function AdminPhotosPage() {
  const photos = await listPhotos();
  return (
    <main className="mx-auto max-w-3xl px-6 py-10 space-y-8">
      <h1 className="text-2xl font-semibold">Galeria de fotos</h1>
      <p className="text-xs opacity-70">
        Faça upload pelo Supabase Studio (bucket <code>gallery</code>) e cole o caminho aqui.
      </p>

      <section className="border rounded p-4 space-y-2">
        <h2 className="text-lg font-medium">Adicionar foto</h2>
        <form action={createPhotoAction} className="space-y-2">
          <input
            name="storagePath"
            required
            placeholder="gallery/foto-001.jpg"
            className="w-full rounded border px-3 py-2"
          />
          <input
            name="captionPt"
            placeholder="Legenda (PT, opcional)"
            className="w-full rounded border px-3 py-2"
          />
          <input
            name="captionEn"
            placeholder="Caption (EN, opcional)"
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
        <h2 className="text-lg font-medium">Existentes ({photos.length})</h2>
        {photos.length === 0 ? <p className="text-sm opacity-70">Nenhuma foto ainda.</p> : null}
        {photos.map((p) => (
          <div key={p.id} className="border rounded p-3 space-y-2">
            <form
              action={async (fd: FormData) => {
                "use server";
                await updatePhotoAction(p.id, fd);
              }}
              className="space-y-2"
            >
              <input name="storagePath" defaultValue={p.storagePath} className="w-full rounded border px-3 py-2 text-sm" />
              <input name="captionPt" defaultValue={p.captionPt ?? ""} className="w-full rounded border px-3 py-2 text-sm" />
              <input name="captionEn" defaultValue={p.captionEn ?? ""} className="w-full rounded border px-3 py-2 text-sm" />
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="isVisible" defaultChecked={p.isVisible} /> Visível
              </label>
              <button type="submit" className="rounded border px-3 py-1 text-sm">
                Salvar
              </button>
            </form>
            <form
              action={async () => {
                "use server";
                await deletePhotoAction(p.id);
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
