import { auth, signOut } from "@/lib/auth";

export default async function AdminPage() {
  const session = await auth();
  const user = session!.user;

  return (
    <main className="mx-auto max-w-2xl p-8 space-y-4">
      <h1 className="text-2xl font-semibold">Admin</h1>
      <dl className="text-sm">
        <div>
          <dt className="inline font-medium">Email: </dt>
          <dd className="inline">{user.email}</dd>
        </div>
        <div>
          <dt className="inline font-medium">Role: </dt>
          <dd className="inline">{user.role}</dd>
        </div>
      </dl>
      <form
        action={async () => {
          "use server";
          await signOut({ redirectTo: "/" });
        }}
      >
        <button type="submit" className="rounded border px-3 py-1 text-sm">
          Sign out
        </button>
      </form>
    </main>
  );
}
