import { listGuestsWithObservations } from "@/lib/guests/db";

export default async function AdminObservationsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const sp = await searchParams;
  const rows = await listGuestsWithObservations({ search: sp.q ?? null });
  return (
    <main className="mx-auto max-w-5xl px-6 py-10 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Observações</h1>
        <a
          href={`/admin/observations/print${sp.q ? `?q=${encodeURIComponent(sp.q)}` : ""}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm underline"
        >
          Gerar PDF
        </a>
      </div>

      <form className="flex gap-2 text-sm">
        <input name="q" defaultValue={sp.q ?? ""} placeholder="Buscar..." className="flex-1 rounded border px-3 py-2" />
        <button className="rounded border px-3 py-2">Filtrar</button>
      </form>

      <ul className="space-y-3">
        {rows.length === 0 ? <li className="text-sm opacity-70">Nenhuma observação ainda.</li> : null}
        {rows.map((r) => (
          <li key={r.id} className="border rounded p-3">
            <div className="flex justify-between text-sm">
              <strong>
                <a href="/admin/guests">
                  {r.firstName} {r.lastName}
                </a>
              </strong>
              <span className="text-xs opacity-60">
                {r.rsvpStatus === "confirmed"
                  ? "Confirmado"
                  : r.rsvpStatus === "declined"
                    ? "Recusou"
                    : "Pendente"}
              </span>
            </div>
            <p className="mt-2 text-sm whitespace-pre-line">{r.observation}</p>
            {r.rsvpSubmittedAt ? (
              <p className="mt-1 text-xs opacity-50">
                {new Date(r.rsvpSubmittedAt).toLocaleString("pt-BR")}
              </p>
            ) : null}
          </li>
        ))}
      </ul>
    </main>
  );
}
