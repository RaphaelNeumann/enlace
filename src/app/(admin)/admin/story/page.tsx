import { getStoryContent } from "@/lib/story/db";
import { ConfirmingForm } from "@/components/admin/ConfirmingForm";
import { updateStoryAction } from "./actions";

export default async function AdminStoryPage() {
  const story = await getStoryContent();
  return (
    <main className="mx-auto max-w-5xl px-6 py-10 space-y-6">
      <h1 className="text-2xl font-semibold">Nossa história</h1>
      <ConfirmingForm
        action={updateStoryAction}
        confirmTitle="Salvar nossa história?"
        confirmDescription="As mudanças aparecem no site público imediatamente."
        className="space-y-4"
      >
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Texto (PT)</span>
          <textarea
            name="bodyPt"
            defaultValue={story.bodyPt}
            rows={8}
            className="w-full rounded border px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Texto (EN)</span>
          <textarea
            name="bodyEn"
            defaultValue={story.bodyEn ?? ""}
            rows={8}
            className="w-full rounded border px-3 py-2"
          />
        </label>
        {[1, 2, 3].map((n) => (
          <label key={n} className="flex flex-col gap-1 text-sm">
            <span className="font-medium">Foto {n} (caminho no Supabase Storage)</span>
            <input
              name={`photo${n}StoragePath`}
              defaultValue={
                (story[
                  `photo${n}StoragePath` as "photo1StoragePath" | "photo2StoragePath" | "photo3StoragePath"
                ] as string | null) ?? ""
              }
              className="w-full rounded border px-3 py-2"
              placeholder="story/photo-1.jpg"
            />
          </label>
        ))}
        <p className="text-xs opacity-60">
          Upload via Supabase Studio (bucket <code>site</code>) e cole o caminho aqui.
        </p>
      </ConfirmingForm>
    </main>
  );
}
