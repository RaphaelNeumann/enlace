import { listConfirmedWithPlusOnes } from "@/lib/guests/db";

export default async function AdminRsvpsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; source?: string }>;
}) {
  const sp = await searchParams;
  const rows = await listConfirmedWithPlusOnes({
    search: sp.q ?? null,
    source: (sp.source as "admin" | "submitted" | undefined) ?? null,
  });
  const totalPlusOnes = rows.reduce((acc, r) => acc + r.plusOnes.length, 0);
  return (
    <main className="mx-auto max-w-5xl px-6 py-10 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Confirmados</h1>
        <a href="/admin/guests" className="text-sm underline">
          ← Lista completa
        </a>
      </div>

      <div className="grid grid-cols-3 gap-3 text-sm border rounded p-4">
        <div>
          <p className="opacity-70 text-xs">Convidados</p>
          <p className="text-2xl">{rows.length}</p>
        </div>
        <div>
          <p className="opacity-70 text-xs">Acompanhantes</p>
          <p className="text-2xl">{totalPlusOnes}</p>
        </div>
        <div>
          <p className="opacity-70 text-xs">Total de pessoas</p>
          <p className="text-2xl">{rows.length + totalPlusOnes}</p>
        </div>
      </div>

      <form className="flex gap-2 text-sm">
        <input name="q" defaultValue={sp.q ?? ""} placeholder="Buscar..." className="flex-1 rounded border px-3 py-2" />
        <select name="source" defaultValue={sp.source ?? ""} className="rounded border px-3 py-2">
          <option value="">Todas origens</option>
          <option value="admin">Convidados</option>
          <option value="submitted">Auto-registrados</option>
        </select>
        <button className="rounded border px-3 py-2">Filtrar</button>
        <a href={`/admin/rsvps/export${toQuery(sp)}`} className="rounded border px-3 py-2">
          Exportar CSV
        </a>
      </form>

      <ul className="space-y-2">
        {rows.length === 0 ? <li className="text-sm opacity-70">Ninguém confirmou ainda.</li> : null}
        {rows.map((r) => (
          <li key={r.id} className="border rounded p-3">
            <div className="flex justify-between text-sm">
              <strong>
                <a href={`/admin/guests`}>
                  {r.firstName} {r.lastName}
                </a>
              </strong>
              <span className="opacity-60 text-xs">
                {r.source === "admin" ? "Convidado" : "Auto-registrado"}
              </span>
            </div>
            {r.plusOnes.length > 0 ? (
              <ul className="mt-1 list-disc list-inside text-sm opacity-90">
                {r.plusOnes.map((p) => (
                  <li key={p.id}>{p.name}</li>
                ))}
              </ul>
            ) : null}
            {r.observation ? (
              <p className="mt-1 text-xs italic opacity-70">{r.observation}</p>
            ) : null}
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

function toQuery(sp: { q?: string; source?: string }): string {
  const usp = new URLSearchParams();
  if (sp.q) usp.set("q", sp.q);
  if (sp.source) usp.set("source", sp.source);
  const s = usp.toString();
  return s ? `?${s}` : "";
}
