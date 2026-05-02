import NextAuth from "next-auth";
import Resend from "next-auth/providers/resend";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { accounts, sessions, users, verificationTokens } from "@/lib/db/schema";

type AdminRole = "COUPLE" | "CEREMONIAL";

function parseEmailList(raw: string | undefined): string[] {
  if (!raw) return [];
  return raw
    .split(/[,;]/)
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

const adminAllowlist = new Map<string, AdminRole>([
  ...parseEmailList(process.env.AUTH_COUPLE_EMAILS).map(
    (e) => [e, "COUPLE" as const] as const,
  ),
  ...parseEmailList(process.env.AUTH_CEREMONIAL_EMAILS).map(
    (e) => [e, "CEREMONIAL" as const] as const,
  ),
]);

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      image?: string | null;
      role: AdminRole;
    };
  }
  interface User {
    role?: AdminRole;
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  providers: [
    Resend({
      apiKey: process.env.AUTH_RESEND_KEY,
      from: process.env.AUTH_EMAIL_FROM,
    }),
  ],
  session: { strategy: "database" },
  pages: {
    signIn: "/login",
    verifyRequest: "/login/verify",
    error: "/login/error",
  },
  callbacks: {
    signIn({ user }) {
      const email = user.email?.toLowerCase();
      if (!email) return false;
      return adminAllowlist.has(email);
    },
    session({ session, user }) {
      session.user.id = user.id;
      session.user.role =
        (user as { role?: AdminRole }).role ??
        adminAllowlist.get(session.user.email.toLowerCase()) ??
        "CEREMONIAL";
      return session;
    },
  },
  events: {
    async createUser({ user }) {
      const email = user.email?.toLowerCase();
      const role = email ? adminAllowlist.get(email) : undefined;
      if (!role || !user.id) return;
      await db.update(users).set({ role }).where(eq(users.id, user.id));
    },
  },
});
