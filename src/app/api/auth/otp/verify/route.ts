import { NextResponse } from "next/server";
import { z } from "zod";
import { verifyOtp } from "@/lib/auth/otp";

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
  // Dry run: never consumes the code, so the real sign-in below still works.
  const result = await verifyOtp(parsed.data.phone, parsed.data.code, { consume: false });
  // Never return the userId from a dry run.
  return NextResponse.json(
    result.ok ? { ok: true, isNewUser: result.isNewUser } : result,
    { status: result.ok ? 200 : 400 },
  );
}
