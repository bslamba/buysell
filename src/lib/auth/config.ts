import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { env } from "@/env";
import { verifyEmailOtp } from "./email-otp";
import { normaliseEmail } from "./email";

import type { Role } from "./roles";
export type { Role } from "./roles";

/**
 * JWT sessions, not database sessions.
 *
 * We own the `users` table, so Auth.js only needs to prove identity — it does
 * not need adapter tables of its own. Every sign-in upserts into our schema and
 * the role travels in the token, so `/admin` gating costs no database round trip
 * in middleware.
 *
 * The token is refreshed against the database every 5 minutes, so a ban or a
 * role change takes effect quickly rather than at next sign-in.
 */
const ROLE_REFRESH_MS = 5 * 60_000;

export const authConfig: NextAuthConfig = {
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  pages: { signIn: "/signin", error: "/signin" },
  trustHost: true,

  providers: [
    ...(env().AUTH_GOOGLE_ID && env().AUTH_GOOGLE_SECRET
      ? [Google({ clientId: env().AUTH_GOOGLE_ID!, clientSecret: env().AUTH_GOOGLE_SECRET!, allowDangerousEmailAccountLinking: false })]
      : []),

    /**
     * Email code. The way in.
     *
     * Phone used to be this provider. It is not any more: an Indian phone
     * number cannot be verified without an SMS vendor and DLT registration,
     * which would put a regulator between a new user and the front door. Email
     * needs nothing, so it opens the account; phone is then mandatory on the
     * profile, where waiting on a vendor blocks completing an account rather
     * than starting one.
     */
    Credentials({
      id: "email-otp",
      name: "Email",
      credentials: { email: { label: "Email" }, code: { label: "Code" } },
      async authorize(raw) {
        const email = typeof raw?.email === "string" ? raw.email : "";
        const code = typeof raw?.code === "string" ? raw.code : "";
        const result = await verifyEmailOtp(email, code);
        if (!result.ok) return null;
        return { id: result.userId, email: result.email } as { id: string; email: string };
      },
    }),
  ],

  callbacks: {
    async signIn({ user, account }) {
      // Google sign-in: upsert by email into our own users table.
      if (account?.provider === "google" && user.email) {
        // Match on the normalised form, not the raw address: otherwise the same
        // Gmail inbox arriving as a dotted or +tagged variant would open a
        // second account, which is exactly what emailNormalised exists to stop.
        const normalised = normaliseEmail(user.email);
        if (!normalised) return false;

        const [existing] = await db.select().from(users)
          .where(eq(users.emailNormalised, normalised)).limit(1);
        if (existing) {
          if (existing.bannedAt) return false;
          await db.update(users)
            .set({ emailVerifiedAt: new Date(), name: existing.name ?? user.name, avatarUrl: user.image ?? existing.avatarUrl, updatedAt: new Date() })
            .where(eq(users.id, existing.id));
          user.id = existing.id;
        } else {
          const [created] = await db.insert(users)
            .values({
              email: user.email, emailNormalised: normalised, emailVerifiedAt: new Date(),
              name: user.name, avatarUrl: user.image, role: "user",
            })
            .returning({ id: users.id });
          user.id = created.id;
        }
      }
      return true;
    },

    async jwt({ token, user, trigger }) {
      if (user?.id) token.sub = user.id;

      const stale = !token.roleCheckedAt || Date.now() - Number(token.roleCheckedAt) > ROLE_REFRESH_MS;
      if (token.sub && (user || trigger === "update" || stale)) {
        const [row] = await db
          .select({
            role: users.role, phone: users.phone, name: users.name, email: users.email,
            kyc: users.kyc, trustScore: users.trustScore,
            phoneVerifiedAt: users.phoneVerifiedAt, bannedAt: users.bannedAt,
          })
          .from(users).where(eq(users.id, token.sub)).limit(1);

        if (!row || row.bannedAt) return null; // invalidates the session
        token.role = row.role;
        token.phone = row.phone ?? undefined;
        token.email = row.email ?? token.email;
        token.name = row.name ?? token.name;
        token.kyc = row.kyc;
        token.trustScore = row.trustScore;
        token.phoneVerified = Boolean(row.phoneVerifiedAt);
        token.roleCheckedAt = Date.now();
      }
      return token;
    },

    async session({ session, token }) {
      if (token.sub) session.user.id = token.sub;
      session.user.role = (token.role as Role) ?? "user";
      session.user.phone = token.phone as string | undefined;
      session.user.email = (token.email as string | undefined) ?? session.user.email;
      session.user.kyc = token.kyc as string | undefined;
      session.user.trustScore = token.trustScore as number | undefined;
      session.user.phoneVerified = Boolean(token.phoneVerified);
      return session;
    },
  },
};
