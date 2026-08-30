import { NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { env } from "@/env";
import { currentUser } from "@/lib/auth/guards";
import { normaliseEmail } from "@/lib/auth/email";
import { verifyEmailOtp } from "@/lib/auth/email-otp";
import { dbErrorHint } from "@/db/errors";

export const runtime = "nodejs";

const Body = z.object({ email: z.string().trim().min(6).max(254), code: z.string().trim().length(6) });

/** Postgres unique_violation — the last line of defence on one-account-per-email. */
function isUniqueViolation(err: unknown): boolean {
  return typeof err === "object" && err !== null && (err as { code?: string }).code === "23505";
}

/**
 * Step two: confirm the code, then write the address and mark registration
 * complete. Only now does the account own the email.
 */
export async function POST(req: Request) {
  const me = await currentUser();
  if (!me) return NextResponse.json({ ok: false, error: "Sign in first." }, { status: 401 });

  let parsed;
  try {
    parsed = Body.safeParse(await req.json());
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request." }, { status: 400 });
  }
  if (!parsed.success) return NextResponse.json({ ok: false, error: "Enter the 6-digit code." }, { status: 400 });

  const normalised = normaliseEmail(parsed.data.email);
  if (!normalised) return NextResponse.json({ ok: false, error: "Enter a valid email address." }, { status: 400 });

  try {
    const result = await verifyEmailOtp(parsed.data.email, parsed.data.code, me.id);
    if (!result.ok) return NextResponse.json(result, { status: 400 });

    const now = new Date();
    const [row] = await db.select({ name: users.name, dateOfBirth: users.dateOfBirth })
      .from(users).where(eq(users.id, me.id)).limit(1);
    if (!row?.name || !row?.dateOfBirth) {
      return NextResponse.json({ ok: false, error: "Your details are missing. Start again." }, { status: 400 });
    }

    await db.update(users).set({
      email: parsed.data.email.trim(),
      emailNormalised: normalised,
      emailVerifiedAt: now,
      registeredAt: now,
      updatedAt: now,
    }).where(eq(users.id, me.id));

    return NextResponse.json({ ok: true });
  } catch (err) {
    if (isUniqueViolation(err)) {
      return NextResponse.json(
        { ok: false, error: "That email is already on another WorthIt account. One account per person." },
        { status: 409 },
      );
    }
    console.error("[register/verify] failed:", err);
    const hint = env().NODE_ENV === "development" ? dbErrorHint(err) : null;
    return NextResponse.json({ ok: false, error: hint ?? "Something went wrong on our side. Please try again." }, { status: 500 });
  }
}
