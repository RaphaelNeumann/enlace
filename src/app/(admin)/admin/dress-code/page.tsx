import { getDressCode } from "@/lib/dress-code/db";
import { ConfirmingForm } from "@/components/admin/ConfirmingForm";
import { UploadField } from "@/components/admin/UploadField";
import { updateDressCodeAction } from "./actions";

export default async function AdminDressCodePage() {
  const dc = await getDressCode();
  return (
    <main className="mx-auto max-w-7xl px-6 py-10 space-y-6">
      <h1 className="text-2xl font-semibold">Traje</h1>
      <ConfirmingForm
        action={updateDressCodeAction}
        confirmTitle="Salvar traje?"
        confirmDescription="As mudanças aparecem no site público imediatamente."
        className="space-y-4"
      >
        <Field label="Headline (PT)" name="headlinePt" defaultValue={dc.headlinePt} />
        <Field label="Headline (EN)" name="headlineEn" defaultValue={dc.headlineEn ?? ""} />
        <Textarea label="Intro (PT)" name="introPt" defaultValue={dc.introPt} />
        <Textarea label="Intro (EN)" name="introEn" defaultValue={dc.introEn ?? ""} />
        <UploadField
          bucket="site"
          pathFieldName="womenIconImageStoragePath"
          defaultPath={dc.womenIconImageStoragePath}
          label="Ícone das mulheres (acima do título)"
        />
        <Field label="Mulheres — título (PT)" name="womenTitlePt" defaultValue={dc.womenTitlePt} />
        <Field label="Mulheres — título (EN)" name="womenTitleEn" defaultValue={dc.womenTitleEn ?? ""} />
        <Textarea label="Mulheres — corpo (PT)" name="womenBodyPt" defaultValue={dc.womenBodyPt} />
        <Textarea label="Mulheres — corpo (EN)" name="womenBodyEn" defaultValue={dc.womenBodyEn ?? ""} />
        <UploadField
          bucket="site"
          pathFieldName="menIconImageStoragePath"
          defaultPath={dc.menIconImageStoragePath}
          label="Ícone dos homens (acima do título)"
        />
        <Field label="Homens — título (PT)" name="menTitlePt" defaultValue={dc.menTitlePt} />
        <Field label="Homens — título (EN)" name="menTitleEn" defaultValue={dc.menTitleEn ?? ""} />
        <Textarea label="Homens — corpo (PT)" name="menBodyPt" defaultValue={dc.menBodyPt} />
        <Textarea label="Homens — corpo (EN)" name="menBodyEn" defaultValue={dc.menBodyEn ?? ""} />
      </ConfirmingForm>
    </main>
  );
}

function Field({ label, name, defaultValue }: { label: string; name: string; defaultValue: string }) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="font-medium">{label}</span>
      <input name={name} defaultValue={defaultValue} className="w-full rounded border px-3 py-2" />
    </label>
  );
}

function Textarea({ label, name, defaultValue }: { label: string; name: string; defaultValue: string }) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="font-medium">{label}</span>
      <textarea name={name} defaultValue={defaultValue} rows={4} className="w-full rounded border px-3 py-2" />
    </label>
  );
}
