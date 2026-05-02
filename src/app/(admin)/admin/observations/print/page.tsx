import { listGuestsWithObservations } from "@/lib/guests/db";
import { getSiteSettings } from "@/lib/site-settings/get";
import { formatCoupleNames } from "@/components/site-footer";

export default async function AdminObservationsPrintPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const sp = await searchParams;
  const [rows, settings] = await Promise.all([
    listGuestsWithObservations({ search: sp.q ?? null }),
    getSiteSettings(),
  ]);
  const couple = formatCoupleNames({
    partner1Name: settings.partner1Name,
    partner2Name: settings.partner2Name,
    partnersOrder: settings.partnersOrder,
  });
  const exported = new Date().toLocaleString("pt-BR");
  return (
    <html lang="pt-BR">
      <head>
        <title>Observações — {couple}</title>
        <style>{`
          @page { margin: 1in; }
          body { font-family: serif; color: #111; }
          h1 { font-size: 24px; margin-bottom: 4px; }
          .header { margin-bottom: 24px; border-bottom: 1px solid #ccc; padding-bottom: 12px; }
          .entry { break-inside: avoid; margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px dashed #ddd; }
          .entry-name { font-weight: 600; }
          .entry-meta { font-size: 11px; color: #666; }
          .entry-body { white-space: pre-line; margin-top: 6px; }
        `}</style>
        <script
          dangerouslySetInnerHTML={{
            __html: "window.addEventListener('load', () => setTimeout(() => window.print(), 200));",
          }}
        />
      </head>
      <body>
        <div className="header">
          <h1>Observações — {couple || "—"}</h1>
          <p className="entry-meta">Gerado em {exported}</p>
        </div>
        {rows.length === 0 ? (
          <p>Nenhuma observação.</p>
        ) : (
          rows.map((r) => (
            <div key={r.id} className="entry">
              <p>
                <span className="entry-name">
                  {r.firstName} {r.lastName}
                </span>{" "}
                <span className="entry-meta">
                  ·{" "}
                  {r.rsvpStatus === "confirmed"
                    ? "Confirmado"
                    : r.rsvpStatus === "declined"
                      ? "Recusou"
                      : "Pendente"}
                  {r.rsvpSubmittedAt
                    ? ` · ${new Date(r.rsvpSubmittedAt).toLocaleString("pt-BR")}`
                    : ""}
                </span>
              </p>
              <p className="entry-body">{r.observation}</p>
            </div>
          ))
        )}
      </body>
    </html>
  );
}
