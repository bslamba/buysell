import { NextResponse } from "next/server";
import { z } from "zod";
import { requestEmailOtp } from "@/lib/auth/email-otp";
import { dbErrorHint } from "@/db/errors";
import { env } from "@/env";

export const runtime = "nodejs";

const Body = z.object({ email: z.string().trim().min(6).max(254) });

function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  return fwd?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
}

export async function POST(req: Request) {
  let parsed;
  try {
    parsed = Body.safeParse(await req.json());
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request." }, { status: 400 });
  }
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Enter a valid email address." }, { status: 400 });
  }

  // Always answer with JSON: an unhandled throw returns an empty 500, which the
  // browser reports as a failed fetch and the client blames on the connection.
  try {
    const result = await requestEmailOtp(parsed.data.email, clientIp(req));
    if (!result.ok) return NextResponse.json(result, { status: result.retryAfterSec ? 429 : 400 });
    return NextResponse.json({ ok: true, expiresAt: result.expiresAt, devCode: result.devCode });
  } catch (err) {
    console.error("[auth/email/request] failed:", err);
    const hint = env().NODE_ENV === "development" ? dbErrorHint(err) : null;
    return NextResponse.json({ ok: false, error: hint ?? "Something went wrong on our side. Please try again." }, { status: 500 });
  }
}
