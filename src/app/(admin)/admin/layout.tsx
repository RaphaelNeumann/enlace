import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { isAdminRole } from "@/lib/server-auth/assert-role";
import { AdminTopNav } from "@/components/admin/AdminTopNav";

// Admin routes are auth-gated (they read cookies + query the sessions table)
// and must never be prerendered or cached. Forcing dynamic rendering keeps the
// build from trying to statically generate them — which otherwise hits the DB
// at build time and times out.
export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!isAdminRole(session?.user?.role)) {
    redirect("/login?callbackUrl=/admin");
  }
  return (
    <>
      <AdminTopNav />
      {children}
    </>
  );
}
