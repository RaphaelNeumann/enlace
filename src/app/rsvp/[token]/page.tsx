import { notFound } from "next/navigation";
import { checkAccessToken, getRsvpAccessToken } from "@/lib/rsvp/access-token";
import { wedding } from "@/config/wedding.config";
import { RsvpForm } from "../RsvpForm";

export default async function RsvpTokenPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const expected = getRsvpAccessToken();
  const result = checkAccessToken(token, expected);
  if (result === "mismatch") notFound();
  // result === "match" or "public" (env unset) — render the form.
  return (
    <main className="flex-1 px-6 py-12">
      <RsvpForm mode={wedding.rsvp.mode} />
    </main>
  );
}
