import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { isAdminRole } from "@/lib/server-auth/assert-role";
import { AdminTopNav } from "@/components/admin/AdminTopNav";

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
