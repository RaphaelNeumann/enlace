import { listPhotos } from "@/lib/photos/db";
import { createPhotoAction, deletePhotoAction, updatePhotoAction } from "./actions";
import { UploadField } from "@/components/admin/UploadField";
import { ConfirmingForm } from "@/components/admin/ConfirmingForm";
import { ConfirmingButton } from "@/components/admin/ConfirmingButton";

export default async function AdminPhotosPage() {
  const photos = await listPhotos();
  return (
    <main className="mx-auto max-w-3xl px-6 py-10 space-y-8">
      <h1 className="text-2xl font-semibold">Galeria de fotos</h1>

      <section className="border rounded p-4 space-y-2">
        <h2 className="text-lg font-medium">Adicionar foto</h2>
        <ConfirmingForm
          action={createPhotoAction}
          confirmTitle="Adicionar foto?"
          submitLabel="Adicionar"
          className="space-y-2"
        >
          <UploadField bucket="gallery" pathFieldName="storagePath" label="Imagem" />
          <input name="captionPt" placeholder="Legenda (PT, opcional)" className="w-full rounded border px-3 py-2" />
          <input name="captionEn" placeholder="Caption (EN, opcional)" className="w-full rounded border px-3 py-2" />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="isVisible" defaultChecked /> Visível
          </label>
        </ConfirmingForm>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-medium">Existentes ({photos.length})</h2>
        {photos.length === 0 ? <p className="text-sm opacity-70">Nenhuma foto ainda.</p> : null}
        {photos.map((p) => (
          <div key={p.id} className="border rounded p-3 space-y-2">
            <ConfirmingForm
              action={async (fd: FormData) => {
                "use server";
                await updatePhotoAction(p.id, fd);
              }}
              confirmTitle="Salvar foto?"
              className="space-y-2"
            >
              <UploadField
                bucket="gallery"
                pathFieldName="storagePath"
                defaultPath={p.storagePath}
                label="Substituir imagem"
              />
              <input name="captionPt" defaultValue={p.captionPt ?? ""} className="w-full rounded border px-3 py-2 text-sm" />
              <input name="captionEn" defaultValue={p.captionEn ?? ""} className="w-full rounded border px-3 py-2 text-sm" />
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="isVisible" defaultChecked={p.isVisible} /> Visível
              </label>
            </ConfirmingForm>
            <ConfirmingButton
              action={async () => {
                "use server";
                await deletePhotoAction(p.id);
              }}
              confirmTitle="Apagar foto?"
              confirmDescription="Esta ação não pode ser desfeita."
              buttonLabel="Apagar"
              confirmLabel="Apagar"
              variant="danger"
            />
          </div>
        ))}
      </section>
    </main>
  );
}
