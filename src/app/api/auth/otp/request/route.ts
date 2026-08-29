import { NextResponse } from "next/server";
import { z } from "zod";
import { requestOtp } from "@/lib/auth/otp";
import { dbErrorHint } from "@/db/errors";
import { env } from "@/env";

export const runtime = "nodejs";

const Body = z.object({ phone: z.string().min(6).max(20) });

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
    return NextResponse.json({ ok: false, error: "Enter a valid mobile number." }, { status: 400 });
  }

  // An unhandled throw here returns an empty 500, which the browser reports as
  // a failed fetch — the client then blames the user's connection for what is
  // actually a server problem. Always answer with JSON.
  try {
    const result = await requestOtp(parsed.data.phone, clientIp(req));
    if (!result.ok) {
      return NextResponse.json(result, { status: result.retryAfterSec ? 429 : 400 });
    }
    return NextResponse.json({ ok: true, expiresAt: result.expiresAt, devCode: result.devCode });
  } catch (err) {
    console.error("[auth/otp/request] failed:", err);
    const hint = env().NODE_ENV === "development" ? dbErrorHint(err) : null;
    return NextResponse.json(
      { ok: false, error: hint ?? "Something went wrong on our side. Please try again." },
      { status: 500 },
    );
  }
}
