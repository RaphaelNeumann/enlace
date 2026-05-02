import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { isAdminRole } from "@/lib/server-auth/assert-role";
import { getRsvpAccessToken } from "@/lib/rsvp/access-token";
import { wedding } from "@/config/wedding.config";
import { RsvpForm } from "./RsvpForm";

export default async function RsvpBarePage() {
  const expected = getRsvpAccessToken();
  if (!expected) {
    // Env unset — public form available at /rsvp.
    return (
      <main className="flex-1 px-6 py-12">
        <RsvpForm mode={wedding.rsvp.mode} />
      </main>
    );
  }
  // Env set — only admin preview is allowed at the bare path.
  const session = await auth();
  if (!isAdminRole(session?.user?.role)) {
    notFound();
  }
  return (
    <main className="flex-1 px-6 py-12">
      <p className="text-center text-xs uppercase tracking-widest opacity-70 mb-6">
        Modo prévia · admin
      </p>
      <RsvpForm mode={wedding.rsvp.mode} />
    </main>
  );
}
