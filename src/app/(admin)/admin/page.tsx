import { auth, signOut } from "@/lib/auth";
import { listGuests } from "@/lib/guests/db";
import { listGiftMessages } from "@/lib/gifts/db";

const ADMIN_LINKS = [
  { href: "/admin/site", label: "Configurações do site" },
  { href: "/admin/programacao", label: "Programação" },
  { href: "/admin/dress-code", label: "Traje" },
  { href: "/admin/story", label: "Nossa história" },
  { href: "/admin/gifts", label: "Lista de presentes" },
  { href: "/admin/tips", label: "Dicas" },
  { href: "/admin/faq", label: "FAQ" },
  { href: "/admin/guests", label: "Convidados" },
  { href: "/admin/rsvps", label: "Confirmados" },
  { href: "/admin/observations", label: "Observações" },
  { href: "/admin/messages", label: "Mensagens" },
];

export default async function AdminHomePage() {
  const session = await auth();
  const user = session!.user;
  const [guests, messages] = await Promise.all([listGuests(), listGiftMessages()]);
  const confirmed = guests.filter((g) => g.rsvpStatus === "confirmed").length;
  const declined = guests.filter((g) => g.rsvpStatus === "declined").length;
  const pending = guests.filter((g) => g.rsvpStatus === "pending").length;
  return (
    <main className="mx-auto max-w-3xl px-6 py-10 space-y-8">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Painel</h1>
        <div className="text-sm">
          <span className="opacity-70">{user.email}</span> ·{" "}
          <span className="text-xs uppercase tracking-widest">{user.role}</span>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/" });
            }}
            className="inline ml-3"
          >
            <button type="submit" className="rounded border px-2 py-0.5 text-xs">
              Sair
            </button>
          </form>
        </div>
      </header>

      <section className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
        <div className="border rounded p-3">
          <p className="opacity-70 text-xs">Confirmados</p>
          <p className="text-2xl">{confirmed}</p>
        </div>
        <div className="border rounded p-3">
          <p className="opacity-70 text-xs">Recusaram</p>
          <p className="text-2xl">{declined}</p>
        </div>
        <div className="border rounded p-3">
          <p className="opacity-70 text-xs">Pendentes</p>
          <p className="text-2xl">{pending}</p>
        </div>
        <div className="border rounded p-3">
          <p className="opacity-70 text-xs">Mensagens</p>
          <p className="text-2xl">{messages.length}</p>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-2">
        {ADMIN_LINKS.map((l) => (
          <a
            key={l.href}
            href={l.href}
            className="border rounded p-3 text-sm hover:opacity-80"
          >
            {l.label}
          </a>
        ))}
      </section>
    </main>
  );
}
