import { createHash, randomInt, timingSafeEqual } from "node:crypto";
import { and, eq, gt, isNull, desc, ne } from "drizzle-orm";
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

/** True when this number already belongs to a different account. */
export async function phoneTakenByAnother(phone: string, userId: string): Promise<boolean> {
  const [row] = await db
    .select({ id: users.id })
    .from(users)
    .where(and(eq(users.phone, phone), ne(users.id, userId)))
    .limit(1);
  return Boolean(row);
}

/**
 * Send a code to a phone number, for the signed-in account claiming it.
 *
 * Phone is no longer the way in — email is — so this always runs on behalf of a
 * known user. That is what lets it refuse a number already held by someone
 * else before spending a message, and it is the check that keeps one person to
 * one account now that the front door is an address anyone can create.
 */
export async function requestOtp(rawPhone: string, userId: string, ip: string): Promise<RequestOtpResult> {
  const phone = normalisePhone(rawPhone);
  if (!phone) return { ok: false, error: "Enter a valid 10-digit Indian mobile number." };

  if (await phoneTakenByAnother(phone, userId)) {
    return { ok: false, error: "That mobile number is already on another WorthIt account. One account per person." };
  }

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

export type VerifyOtpResult = { ok: true; phone: string } | { ok: false; error: string };

/**
 * Verify a code and attach the number to the signed-in account.
 *
 * This used to create accounts, because phone was the sign-in identity. It no
 * longer is: an account already exists by the time anyone gets here, so this
 * only ever claims a number for it. The uniqueness check runs again at the
 * moment of writing — someone else may have claimed the number between the send
 * and the confirm — and the unique constraint on users.phone is the backstop
 * under both.
 */
export async function verifyOtp(rawPhone: string, code: string, userId: string): Promise<VerifyOtpResult> {
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

  if (await phoneTakenByAnother(phone, userId)) {
    return { ok: false, error: "That mobile number was just claimed by another account." };
  }

  await db.update(otpChallenges).set({ consumedAt: new Date() }).where(eq(otpChallenges.id, challenge.id));
  await db.update(users)
    .set({ phone, phoneVerifiedAt: new Date(), updatedAt: new Date() })
    .where(eq(users.id, userId));

  return { ok: true, phone };
}
