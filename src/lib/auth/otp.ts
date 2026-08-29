import { createHash, randomInt, timingSafeEqual } from "node:crypto";
import { and, eq, gt, isNull, desc } from "drizzle-orm";
import { db } from "@/db";
import { otpChallenges, users } from "@/db/schema";
import { env } from "@/env";
import { getSmsProvider } from "@/lib/sms";
import { rateLimit, LIMITS } from "@/lib/rate-limit";
import { normalisePhone } from "./phone";

export { normalisePhone } from "./phone";

export const OTP_TTL_MINUTES = 10;
export const OTP_MAX_ATTEMPTS = 5;

/** Codes are never stored in plain text — only this digest is written to the database. */
function digest(phone: string, code: string): string {
  return createHash("sha256").update(`${phone}:${code}:${env().AUTH_SECRET}`).digest("hex");
}

function constantTimeEquals(a: string, b: string): boolean {
  const ba = Buffer.from(a, "utf8");
  const bb = Buffer.from(b, "utf8");
  if (ba.length !== bb.length) return false;
  return timingSafeEqual(ba, bb);
}

export type RequestOtpResult =
  | { ok: true; expiresAt: Date; devCode?: string }
  | { ok: false; error: string; retryAfterSec?: number };

export async function requestOtp(rawPhone: string, ip: string): Promise<RequestOtpResult> {
  const phone = normalisePhone(rawPhone);
  if (!phone) return { ok: false, error: "Enter a valid 10-digit Indian mobile number." };

  const byPhone = await rateLimit("otp-req-phone", phone, LIMITS.otpRequestPerPhone.limit, LIMITS.otpRequestPerPhone.windowSec);
  if (!byPhone.ok) {
    return { ok: false, error: "Too many codes requested for this number. Try again in an hour.", retryAfterSec: Math.ceil((byPhone.resetAt - Date.now()) / 1000) };
  }
  const byIp = await rateLimit("otp-req-ip", ip, LIMITS.otpRequestPerIp.limit, LIMITS.otpRequestPerIp.windowSec);
  if (!byIp.ok) {
    return { ok: false, error: "Too many requests from this network. Try again later.", retryAfterSec: Math.ceil((byIp.resetAt - Date.now()) / 1000) };
  }

  // randomInt is CSPRNG-backed; Math.random must never be used for a credential.
  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60_000);

  await db.insert(otpChallenges).values({ phone, codeHash: digest(phone, code), expiresAt, ip });

  try {
    await getSmsProvider().sendOtp(phone, code);
  } catch (err) {
    return { ok: false, error: "We couldn't send the code right now. Please try again." + (env().NODE_ENV === "development" ? ` (${String(err)})` : "") };
  }

  // Returned only in development so local sign-in doesn't need a real SMS.
  return { ok: true, expiresAt, devCode: env().NODE_ENV === "development" ? code : undefined };
}

export type VerifyOtpResult =
  | { ok: true; userId: string; phone: string; isNewUser: boolean }
  | { ok: false; error: string };

/**
 * Verify a code.
 *
 * `consume: false` is a dry run used by the UI to produce a precise error
 * message ("2 attempts left") before handing off to Auth.js. Only the real
 * sign-in path consumes the challenge, because a code must work exactly once.
 * Failed attempts increment the counter either way, so the dry run cannot be
 * used to brute-force for free.
 */
export async function verifyOtp(
  rawPhone: string,
  code: string,
  opts: { consume?: boolean } = {},
): Promise<VerifyOtpResult> {
  const consume = opts.consume ?? true;
  const phone = normalisePhone(rawPhone);
  if (!phone) return { ok: false, error: "Enter a valid 10-digit Indian mobile number." };
  if (!/^\d{6}$/.test(code)) return { ok: false, error: "Enter the 6-digit code." };

  const attempts = await rateLimit("otp-verify", phone, LIMITS.otpVerifyPerPhone.limit, LIMITS.otpVerifyPerPhone.windowSec);
  if (!attempts.ok) return { ok: false, error: "Too many attempts. Request a new code in a few minutes." };

  const [challenge] = await db
    .select()
    .from(otpChallenges)
    .where(and(eq(otpChallenges.phone, phone), isNull(otpChallenges.consumedAt), gt(otpChallenges.expiresAt, new Date())))
    .orderBy(desc(otpChallenges.createdAt))
    .limit(1);

  if (!challenge) return { ok: false, error: "That code has expired. Request a new one." };
  if (challenge.attempts >= OTP_MAX_ATTEMPTS) {
    return { ok: false, error: "Too many wrong attempts on this code. Request a new one." };
  }

  if (!constantTimeEquals(challenge.codeHash, digest(phone, code))) {
    await db.update(otpChallenges).set({ attempts: challenge.attempts + 1 }).where(eq(otpChallenges.id, challenge.id));
    const left = OTP_MAX_ATTEMPTS - (challenge.attempts + 1);
    return { ok: false, error: left > 0 ? `Incorrect code. ${left} attempt${left === 1 ? "" : "s"} left.` : "Too many wrong attempts. Request a new code." };
  }

  if (consume) {
    await db.update(otpChallenges).set({ consumedAt: new Date() }).where(eq(otpChallenges.id, challenge.id));
  }

  const [existing] = await db.select().from(users).where(eq(users.phone, phone)).limit(1);
  if (existing) {
    if (existing.bannedAt) return { ok: false, error: "This account has been suspended. Contact support." };
    if (!existing.phoneVerifiedAt) {
      await db.update(users).set({ phoneVerifiedAt: new Date(), updatedAt: new Date() }).where(eq(users.id, existing.id));
    }
    return { ok: true, userId: existing.id, phone, isNewUser: false };
  }

  if (!consume) {
    // Valid code for a number we have never seen. Report success without
    // creating the account; sign-in will create it a moment later.
    return { ok: true, userId: "", phone, isNewUser: true };
  }

  const [created] = await db
    .insert(users)
    .values({ phone, phoneVerifiedAt: new Date(), role: "user" })
    .returning({ id: users.id });

  return { ok: true, userId: created.id, phone, isNewUser: true };
}
