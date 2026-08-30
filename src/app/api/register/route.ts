import { NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { env } from "@/env";
import { currentUser } from "@/lib/auth/guards";
import { checkDateOfBirth, dobMessage } from "@/lib/auth/email";
import { normalisePhone } from "@/lib/auth/phone";
import { requestOtp } from "@/lib/auth/otp";
import { dbErrorHint } from "@/db/errors";

export const runtime = "nodejs";

const Body = z.object({
  name: z.string().trim().min(2).max(120),
  dateOfBirth: z.string().trim(),
  phone: z.string().trim().min(6).max(20),
});

function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  return fwd?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
}

/**
 * Step one of the profile: save name and date of birth, then send a code to the
 * phone number.
 *
 * The number is NOT written to the user row here — only after the code is
 * confirmed. Writing it first would let anyone burn a number they do not own by
 * typing it into their own profile, permanently blocking the real owner.
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
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Fill in your name, date of birth and mobile number." }, { status: 400 });
  }

  const dob = checkDateOfBirth(parsed.data.dateOfBirth);
  if (!dob.ok) return NextResponse.json({ ok: false, error: dobMessage(dob.problem), field: "dateOfBirth" }, { status: 400 });

  if (!normalisePhone(parsed.data.phone)) {
    return NextResponse.json({ ok: false, error: "Enter a valid 10-digit Indian mobile number.", field: "phone" }, { status: 400 });
  }

  try {
    await db.update(users)
      .set({ name: parsed.data.name, dateOfBirth: parsed.data.dateOfBirth, updatedAt: new Date() })
      .where(eq(users.id, me.id));

    const result = await requestOtp(parsed.data.phone, me.id, clientIp(req));
    if (!result.ok) {
      return NextResponse.json({ ...result, field: "phone" }, { status: result.retryAfterSec ? 429 : 400 });
    }
    return NextResponse.json({ ok: true, expiresAt: result.expiresAt, devCode: result.devCode });
  } catch (err) {
    console.error("[register] failed:", err);
    const hint = env().NODE_ENV === "development" ? dbErrorHint(err) : null;
    return NextResponse.json({ ok: false, error: hint ?? "Something went wrong on our side. Please try again." }, { status: 500 });
  }
}
