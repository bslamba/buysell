import { NextResponse } from "next/server";
import { z } from "zod";
import { requestOtp } from "@/lib/auth/otp";

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

  const result = await requestOtp(parsed.data.phone, clientIp(req));
  if (!result.ok) {
    return NextResponse.json(result, { status: result.retryAfterSec ? 429 : 400 });
  }
  return NextResponse.json({ ok: true, expiresAt: result.expiresAt, devCode: result.devCode });
}
