import { listGuests } from "@/lib/guests/db";
import {
  createGuestAction,
  deleteGuestAction,
  updateGuestAction,
  setStatusAction,
} from "./actions";

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
    <main className="mx-auto max-w-4xl px-6 py-10 space-y-8">
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
        <form action={createGuestAction} className="grid grid-cols-2 gap-2">
          <input name="firstName" required placeholder="Nome" className="rounded border px-3 py-2" />
          <input name="lastName" required placeholder="Sobrenome" className="rounded border px-3 py-2" />
          <input
            name="plusOnesAllowed"
            type="number"
            min={0}
            defaultValue={0}
            placeholder="Acompanhantes permitidos"
            className="rounded border px-3 py-2"
          />
          <button className="rounded border px-3 py-2 text-sm" type="submit">
            Adicionar
          </button>
        </form>
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

            <form
              action={async (fd: FormData) => {
                "use server";
                await updateGuestAction(g.id, fd);
              }}
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
              <button className="col-span-3 rounded border px-3 py-1 text-sm" type="submit">
                Salvar
              </button>
            </form>

            <div className="flex flex-wrap gap-2">
              {g.rsvpStatus !== "confirmed" ? (
                <form
                  action={async () => {
                    "use server";
                    await setStatusAction(g.id, "confirmed");
                  }}
                >
                  <button className="rounded border px-3 py-1 text-xs" type="submit">
                    Confirmar
                  </button>
                </form>
              ) : (
                <form
                  action={async () => {
                    "use server";
                    await setStatusAction(g.id, "pending");
                  }}
                >
                  <button className="rounded border px-3 py-1 text-xs" type="submit">
                    Cancelar confirmação
                  </button>
                </form>
              )}
              {g.rsvpStatus !== "declined" ? (
                <form
                  action={async () => {
                    "use server";
                    await setStatusAction(g.id, "declined");
                  }}
                >
                  <button className="rounded border px-3 py-1 text-xs" type="submit">
                    Marcar como recusou
                  </button>
                </form>
              ) : null}
              <form
                action={async () => {
                  "use server";
                  await deleteGuestAction(g.id);
                }}
              >
                <button className="rounded border px-3 py-1 text-xs opacity-70" type="submit">
                  Apagar
                </button>
              </form>
            </div>
          </div>
        ))}
      </section>
    </main>
  );
}
