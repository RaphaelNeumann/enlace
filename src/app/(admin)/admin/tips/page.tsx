import { listCategories, listTipsByCategory } from "@/lib/tips/db";
import { TIP_ICON_WHITELIST } from "@/lib/tips/schema";
import { ConfirmingForm } from "@/components/admin/ConfirmingForm";
import { ConfirmingButton } from "@/components/admin/ConfirmingButton";
import {
  createCategoryAction,
  deleteCategoryAction,
  updateCategoryAction,
  createTipAction,
  deleteTipAction,
  updateTipAction,
} from "./actions";

export default async function AdminTipsPage() {
  const categories = await listCategories();
  const tipsByCategory = await Promise.all(
    categories.map(async (c) => ({ category: c, tips: await listTipsByCategory(c.id) })),
  );
  return (
    <main className="mx-auto max-w-5xl px-6 py-10 space-y-8">
      <h1 className="text-2xl font-semibold">Dicas</h1>

      <section className="border rounded p-4 space-y-2">
        <h2 className="text-lg font-medium">Nova categoria</h2>
        <ConfirmingForm
          action={createCategoryAction}
          confirmTitle="Adicionar categoria?"
          submitLabel="Adicionar categoria"
          className="space-y-2"
        >
          <input name="namePt" required placeholder="Nome (PT)" className="w-full rounded border px-3 py-2" />
          <input name="nameEn" placeholder="Name (EN)" className="w-full rounded border px-3 py-2" />
          <select name="iconName" className="w-full rounded border px-3 py-2">
            <option value="">— ícone (opcional) —</option>
            {TIP_ICON_WHITELIST.map((i) => (
              <option key={i} value={i}>{i}</option>
            ))}
          </select>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="isVisible" defaultChecked /> Visível
          </label>
        </ConfirmingForm>
      </section>

      {tipsByCategory.map(({ category, tips }) => (
        <section key={category.id} className="border rounded p-4 space-y-3">
          <h2 className="text-lg font-medium">{category.namePt}</h2>
          <ConfirmingForm
            action={async (fd: FormData) => {
              "use server";
              await updateCategoryAction(category.id, fd);
            }}
            confirmTitle="Salvar categoria?"
            submitLabel="Salvar categoria"
            className="space-y-2"
          >
            <input name="namePt" defaultValue={category.namePt} className="w-full rounded border px-3 py-2" />
            <input name="nameEn" defaultValue={category.nameEn ?? ""} className="w-full rounded border px-3 py-2" />
            <select name="iconName" defaultValue={category.iconName ?? ""} className="w-full rounded border px-3 py-2">
              <option value="">— sem ícone —</option>
              {TIP_ICON_WHITELIST.map((i) => (
                <option key={i} value={i}>{i}</option>
              ))}
            </select>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="isVisible" defaultChecked={category.isVisible} /> Visível
            </label>
          </ConfirmingForm>
          <ConfirmingButton
            action={async () => {
              "use server";
              await deleteCategoryAction(category.id);
            }}
            confirmTitle="Apagar categoria?"
            confirmDescription="Todas as dicas dentro dela também serão apagadas."
            buttonLabel="Apagar categoria"
            confirmLabel="Apagar"
            variant="danger"
          />

          <details>
            <summary className="cursor-pointer text-sm font-medium">+ Adicionar dica</summary>
            <ConfirmingForm
              action={createTipAction}
              confirmTitle="Adicionar dica?"
              submitLabel="Adicionar dica"
              className="space-y-2 mt-2"
            >
              <input type="hidden" name="categoryId" value={category.id} />
              <input name="titlePt" required placeholder="Título (PT)" className="w-full rounded border px-3 py-2" />
              <input name="titleEn" placeholder="Title (EN)" className="w-full rounded border px-3 py-2" />
              <textarea name="bodyPt" required rows={3} placeholder="Corpo (PT)" className="w-full rounded border px-3 py-2" />
              <textarea name="bodyEn" rows={3} placeholder="Body (EN)" className="w-full rounded border px-3 py-2" />
              <input name="externalUrl" placeholder="https://..." className="w-full rounded border px-3 py-2" />
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="isVisible" defaultChecked /> Visível
              </label>
            </ConfirmingForm>
          </details>

          <ul className="space-y-2">
            {tips.map((t) => (
              <li key={t.id} className="border rounded p-3 space-y-2">
                <ConfirmingForm
                  action={async (fd: FormData) => {
                    "use server";
                    await updateTipAction(t.id, fd);
                  }}
                  confirmTitle="Salvar dica?"
                  className="space-y-2"
                >
                  <input name="titlePt" defaultValue={t.titlePt} className="w-full rounded border px-3 py-2" />
                  <input name="titleEn" defaultValue={t.titleEn ?? ""} className="w-full rounded border px-3 py-2" />
                  <textarea name="bodyPt" defaultValue={t.bodyPt} rows={3} className="w-full rounded border px-3 py-2" />
                  <textarea name="bodyEn" defaultValue={t.bodyEn ?? ""} rows={3} className="w-full rounded border px-3 py-2" />
                  <input name="externalUrl" defaultValue={t.externalUrl ?? ""} className="w-full rounded border px-3 py-2" />
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" name="isVisible" defaultChecked={t.isVisible} /> Visível
                  </label>
                </ConfirmingForm>
                <ConfirmingButton
                  action={async () => {
                    "use server";
                    await deleteTipAction(t.id);
                  }}
                  confirmTitle="Apagar dica?"
                  buttonLabel="Apagar"
                  confirmLabel="Apagar"
                  variant="danger"
                />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </main>
  );
}
