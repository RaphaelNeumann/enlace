import { listGiftMessages, listGifts } from "@/lib/gifts/db";

export default async function AdminMessagesPage() {
  const [messages, gifts] = await Promise.all([listGiftMessages(), listGifts()]);
  const giftById = new Map(gifts.map((g) => [g.id, g.titlePt]));
  return (
    <main className="mx-auto max-w-3xl px-6 py-10 space-y-4">
      <h1 className="text-2xl font-semibold">Mensagens</h1>
      {messages.length === 0 ? <p className="text-sm opacity-70">Nenhuma mensagem ainda.</p> : null}
      <ul className="space-y-3">
        {messages.map((m) => (
          <li key={m.id} className="border rounded p-3">
            <div className="flex justify-between text-sm">
              <strong>{m.senderName}</strong>
              <span className="text-xs opacity-60">
                {new Date(m.createdAt).toLocaleString("pt-BR")}
              </span>
            </div>
            {m.giftId ? (
              <p className="text-xs opacity-70">
                Presente: {giftById.get(m.giftId) ?? "—"}
              </p>
            ) : null}
            <p className="mt-2 text-sm whitespace-pre-line">{m.message}</p>
          </li>
        ))}
      </ul>
    </main>
  );
}
