import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { db } from "@/lib/db";

function makeUsername(name: string | null | undefined, email: string): string {
  const base = name
    ? name.toLowerCase().replace(/\s+/g, "").replace(/[^a-z0-9]/g, "")
    : email.split("@")[0].replace(/[^a-z0-9]/g, "");
  return base.slice(0, 20) || "cinefilo";
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(db),
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async session({ session, user }) {
      session.user.id = user.id;
      session.user.username = (user as { username?: string }).username ?? null;
      return session;
    },
  },
  events: {
    async createUser({ user }) {
      const base = makeUsername(user.name, user.email!);
      let username = base;
      let attempt = 0;
      while (true) {
        const exists = await db.user.findUnique({ where: { username } });
        if (!exists) break;
        attempt++;
        username = `${base}${attempt}`;
      }
      await db.user.update({ where: { id: user.id }, data: { username } });
    },
  },
  pages: { signIn: "/login" },
});
