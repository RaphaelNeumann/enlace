export interface AdminLink {
  href: string;
  label: string;
}

export const ADMIN_LINKS: readonly AdminLink[] = [
  { href: "/admin/site", label: "Configurações do site" },
  { href: "/admin/programacao", label: "Programação" },
  { href: "/admin/dress-code", label: "Traje" },
  { href: "/admin/story", label: "Nossa história" },
  { href: "/admin/gifts", label: "Lista de presentes" },
  { href: "/admin/photos", label: "Galeria de fotos" },
  { href: "/admin/tips", label: "Dicas" },
  { href: "/admin/faq", label: "FAQ" },
  { href: "/admin/guests", label: "Convidados" },
  { href: "/admin/rsvps", label: "Confirmados" },
  { href: "/admin/observations", label: "Observações" },
  { href: "/admin/messages", label: "Mensagens" },
];
