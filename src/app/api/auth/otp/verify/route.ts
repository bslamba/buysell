import { NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { verifyOtp } from "@/lib/auth/otp";
import { dbErrorHint } from "@/db/errors";
import { env } from "@/env";

export const runtime = "nodejs";

const Body = z.object({ phone: z.string().min(6).max(20), code: z.string().length(6) });

/**
 * Pre-flight check so the UI can show a precise error before handing off to
 * Auth.js. Runs as a dry run: it validates and counts a failed attempt, but does
 * NOT consume the challenge, because signIn("phone-otp") verifies the same code
 * again and that is the call that must succeed.
 */
export async function POST(req: Request) {
  let parsed;
  try {
    parsed = Body.safeParse(await req.json());
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request." }, { status: 400 });
  }
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Enter the 6-digit code." }, { status: 400 });
  }
  try {
    // Dry run: never consumes the code, so the real sign-in below still works.
    const result = await verifyOtp(parsed.data.phone, parsed.data.code, { consume: false });
    if (!result.ok) return NextResponse.json(result, { status: 400 });

    // Where to send them after sign-in. A brand-new number always needs
    // registration; an existing account needs it only if it never finished.
    let needsRegistration = result.isNewUser;
    if (!result.isNewUser && result.userId) {
      const [row] = await db.select({ registeredAt: users.registeredAt })
        .from(users).where(eq(users.id, result.userId)).limit(1);
      needsRegistration = !row?.registeredAt;
    }

    // Never return the userId from a dry run.
    return NextResponse.json({ ok: true, isNewUser: result.isNewUser, needsRegistration });
  } catch (err) {
    console.error("[auth/otp/verify] failed:", err);
    const hint = env().NODE_ENV === "development" ? dbErrorHint(err) : null;
    return NextResponse.json(
      { ok: false, error: hint ?? "Something went wrong on our side. Please try again." },
      { status: 500 },
    );
  }
}
