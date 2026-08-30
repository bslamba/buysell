import { NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { verifyEmailOtp } from "@/lib/auth/email-otp";
import { dbErrorHint } from "@/db/errors";
import { env } from "@/env";

export const runtime = "nodejs";

const Body = z.object({ email: z.string().trim().min(6).max(254), code: z.string().trim().length(6) });

/**
 * Pre-flight so the UI can show a precise error before handing off to Auth.js.
 * A dry run: it validates and counts a failed attempt but does NOT consume the
 * challenge, because signIn("email-otp") verifies the same code again and that
 * is the call that has to succeed.
 */
export async function POST(req: Request) {
  let parsed;
  try {
    parsed = Body.safeParse(await req.json());
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request." }, { status: 400 });
  }
  if (!parsed.success) return NextResponse.json({ ok: false, error: "Enter the 6-digit code." }, { status: 400 });

  try {
    const result = await verifyEmailOtp(parsed.data.email, parsed.data.code, { consume: false });
    if (!result.ok) return NextResponse.json(result, { status: 400 });

    // A brand-new address always needs the profile; an existing account needs
    // it only if it never finished.
    let needsRegistration = result.isNewUser;
    if (!result.isNewUser && result.userId) {
      const [row] = await db.select({ registeredAt: users.registeredAt })
        .from(users).where(eq(users.id, result.userId)).limit(1);
      needsRegistration = !row?.registeredAt;
    }

    // Never return the userId from a dry run.
    return NextResponse.json({ ok: true, isNewUser: result.isNewUser, needsRegistration });
  } catch (err) {
    console.error("[auth/email/verify] failed:", err);
    const hint = env().NODE_ENV === "development" ? dbErrorHint(err) : null;
    return NextResponse.json({ ok: false, error: hint ?? "Something went wrong on our side. Please try again." }, { status: 500 });
  }
}
