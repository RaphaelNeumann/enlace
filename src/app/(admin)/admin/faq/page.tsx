import { listFaq } from "@/lib/faq/db";
import { ConfirmingForm } from "@/components/admin/ConfirmingForm";
import { ConfirmingButton } from "@/components/admin/ConfirmingButton";
import { createFaqAction, deleteFaqAction, updateFaqAction } from "./actions";

export default async function AdminFaqPage() {
  const entries = await listFaq();
  return (
    <main className="mx-auto max-w-3xl px-6 py-10 space-y-8">
      <h1 className="text-2xl font-semibold">Perguntas frequentes</h1>

      <section className="space-y-3 border rounded p-4">
        <h2 className="text-lg font-medium">Adicionar pergunta</h2>
        <ConfirmingForm
          action={createFaqAction}
          confirmTitle="Adicionar pergunta?"
          submitLabel="Adicionar"
          className="space-y-2"
        >
          <input name="questionPt" placeholder="Pergunta (PT)" required className="w-full rounded border px-3 py-2" />
          <input name="questionEn" placeholder="Question (EN)" className="w-full rounded border px-3 py-2" />
          <textarea name="answerPt" placeholder="Resposta (PT)" required rows={3} className="w-full rounded border px-3 py-2" />
          <textarea name="answerEn" placeholder="Answer (EN)" rows={3} className="w-full rounded border px-3 py-2" />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="isVisible" defaultChecked /> Visível
          </label>
        </ConfirmingForm>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-medium">Existentes ({entries.length})</h2>
        {entries.length === 0 ? <p className="text-sm opacity-70">Nenhuma pergunta ainda.</p> : null}
        {entries.map((e) => (
          <div key={e.id} className="border rounded p-4 space-y-2">
            <ConfirmingForm
              action={async (fd: FormData) => {
                "use server";
                await updateFaqAction(e.id, fd);
              }}
              confirmTitle="Salvar alterações?"
              className="space-y-2"
            >
              <input name="questionPt" defaultValue={e.questionPt} className="w-full rounded border px-3 py-2" />
              <input name="questionEn" defaultValue={e.questionEn ?? ""} placeholder="EN (opcional)" className="w-full rounded border px-3 py-2" />
              <textarea name="answerPt" defaultValue={e.answerPt} rows={3} className="w-full rounded border px-3 py-2" />
              <textarea name="answerEn" defaultValue={e.answerEn ?? ""} placeholder="EN (opcional)" rows={3} className="w-full rounded border px-3 py-2" />
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="isVisible" defaultChecked={e.isVisible} /> Visível
              </label>
            </ConfirmingForm>
            <ConfirmingButton
              action={async () => {
                "use server";
                await deleteFaqAction(e.id);
              }}
              confirmTitle="Apagar pergunta?"
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
