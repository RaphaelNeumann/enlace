import { listGuests } from "@/lib/guests/db";
import {
  createGuestAction,
  deleteGuestAction,
  updateGuestAction,
  setStatusAction,
} from "./actions";
import { ConfirmingForm } from "@/components/admin/ConfirmingForm";
import { ConfirmingButton } from "@/components/admin/ConfirmingButton";

const STATUS_LABEL = {
  pending: "Pendente",
  confirmed: "Confirmado",
  declined: "Recusado",
} as const;

export default async function AdminGuestsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; source?: string }>;
}) {
  const sp = await searchParams;
  const guests = await listGuests({
    search: sp.q ?? null,
    status: (sp.status as "pending" | "confirmed" | "declined" | undefined) ?? null,
    source: (sp.source as "admin" | "submitted" | undefined) ?? null,
  });
  return (
    <main className="mx-auto max-w-5xl my-8 px-8 py-10 rounded-md bg-white shadow-sm space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Convidados</h1>
        <a href="/admin/rsvps" className="text-sm underline">
          Lista de confirmados →
        </a>
      </div>

      <form className="flex gap-2 text-sm">
        <input
          name="q"
          placeholder="Buscar..."
          defaultValue={sp.q ?? ""}
          className="flex-1 rounded border px-3 py-2"
        />
        <select name="status" defaultValue={sp.status ?? ""} className="rounded border px-3 py-2">
          <option value="">Todos status</option>
          <option value="pending">Pendentes</option>
          <option value="confirmed">Confirmados</option>
          <option value="declined">Recusados</option>
        </select>
        <select name="source" defaultValue={sp.source ?? ""} className="rounded border px-3 py-2">
          <option value="">Todas origens</option>
          <option value="admin">Convidados</option>
          <option value="submitted">Auto-registrados</option>
        </select>
        <button className="rounded border px-3 py-2">Filtrar</button>
      </form>

      <section className="border rounded p-4 space-y-2">
        <h2 className="text-lg font-medium">Adicionar convidado</h2>
        <ConfirmingForm
          action={createGuestAction}
          confirmTitle="Adicionar convidado?"
          submitLabel="Adicionar"
          className="grid grid-cols-2 gap-2"
        >
          <input name="firstName" required placeholder="Nome" className="rounded border px-3 py-2" />
          <input name="lastName" required placeholder="Sobrenome" className="rounded border px-3 py-2" />
          <input
            name="plusOnesAllowed"
            type="number"
            min={0}
            defaultValue={0}
            placeholder="Acompanhantes permitidos"
            className="rounded border px-3 py-2 col-span-2"
          />
        </ConfirmingForm>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-medium">Existentes ({guests.length})</h2>
        {guests.length === 0 ? <p className="text-sm opacity-70">Nenhum convidado.</p> : null}
        {guests.map((g) => (
          <div key={g.id} className="border rounded p-3 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
              <strong>
                {g.firstName} {g.lastName}
              </strong>
              <span className="text-xs uppercase tracking-widest opacity-70">
                {STATUS_LABEL[g.rsvpStatus as keyof typeof STATUS_LABEL]}
              </span>
              <span className="text-xs opacity-60">
                {g.source === "admin" ? "Convidado" : "Auto-registrado"}
              </span>
            </div>

            <ConfirmingForm
              action={async (fd: FormData) => {
                "use server";
                await updateGuestAction(g.id, fd);
              }}
              confirmTitle="Salvar convidado?"
              className="grid grid-cols-3 gap-2"
            >
              <input name="firstName" defaultValue={g.firstName} className="rounded border px-3 py-2 text-sm" />
              <input name="lastName" defaultValue={g.lastName} className="rounded border px-3 py-2 text-sm" />
              <input
                name="plusOnesAllowed"
                type="number"
                min={0}
                defaultValue={g.plusOnesAllowed}
                className="rounded border px-3 py-2 text-sm"
              />
              <textarea
                name="observation"
                defaultValue={g.observation ?? ""}
                placeholder="Observação (do convidado)"
                rows={2}
                className="col-span-3 rounded border px-3 py-2 text-sm"
              />
            </ConfirmingForm>

            <div className="flex flex-wrap gap-2">
              {g.rsvpStatus !== "confirmed" ? (
                <ConfirmingButton
                  action={async () => {
                    "use server";
                    await setStatusAction(g.id, "confirmed");
                  }}
                  confirmTitle={`Confirmar presença de ${g.firstName} ${g.lastName}?`}
                  buttonLabel="Confirmar"
                  confirmLabel="Confirmar"
                />
              ) : (
                <ConfirmingButton
                  action={async () => {
                    "use server";
                    await setStatusAction(g.id, "pending");
                  }}
                  confirmTitle={`Cancelar confirmação de ${g.firstName} ${g.lastName}?`}
                  buttonLabel="Cancelar confirmação"
                  confirmLabel="Cancelar"
                />
              )}
              {g.rsvpStatus !== "declined" ? (
                <ConfirmingButton
                  action={async () => {
                    "use server";
                    await setStatusAction(g.id, "declined");
                  }}
                  confirmTitle={`Marcar ${g.firstName} ${g.lastName} como recusou?`}
                  buttonLabel="Marcar como recusou"
                  confirmLabel="Recusou"
                />
              ) : null}
              <ConfirmingButton
                action={async () => {
                  "use server";
                  await deleteGuestAction(g.id);
                }}
                confirmTitle={`Apagar ${g.firstName} ${g.lastName}?`}
                confirmDescription="Esta ação não pode ser desfeita e remove também os acompanhantes."
                buttonLabel="Apagar"
                confirmLabel="Apagar"
                variant="danger"
              />
            </div>
          </div>
        ))}
      </section>
    </main>
  );
}
