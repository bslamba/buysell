import { createHash, randomInt, timingSafeEqual } from "node:crypto";
import { and, eq, gt, isNull, desc, ne } from "drizzle-orm";
import { db } from "@/db";
import { emailChallenges, users } from "@/db/schema";
import { env } from "@/env";
import { getMailProvider, verificationEmail } from "@/lib/mail";
import { rateLimit, LIMITS } from "@/lib/rate-limit";
import { normaliseEmail } from "./email";

/**
 * Email verification codes.
 *
 * Deliberately the same rules as the phone flow in ./otp.ts: codes are stored
 * only as a digest, attempts are counted per challenge, and a code works once.
 * The one addition is the uniqueness check — an address already verified by a
 * different account is refused before a code is ever sent, so someone probing
 * for "is this person on WorthIt" gets no more from us than the person who
 * simply typed their own address.
 */

export const EMAIL_OTP_TTL_MINUTES = 10;
export const EMAIL_OTP_MAX_ATTEMPTS = 5;

function digest(email: string, code: string): string {
  return createHash("sha256").update(`${email}:${code}:${env().AUTH_SECRET}`).digest("hex");
}

function constantTimeEquals(a: string, b: string): boolean {
  const ba = Buffer.from(a, "utf8");
  const bb = Buffer.from(b, "utf8");
  if (ba.length !== bb.length) return false;
  return timingSafeEqual(ba, bb);
}

export type RequestEmailOtpResult =
  | { ok: true; expiresAt: Date; devCode?: string }
  | { ok: false; error: string; retryAfterSec?: number };

/** True when this normalised address already belongs to a different account. */
export async function emailTakenByAnother(normalised: string, userId: string): Promise<boolean> {
  const [row] = await db
    .select({ id: users.id })
    .from(users)
    .where(and(eq(users.emailNormalised, normalised), ne(users.id, userId)))
    .limit(1);
  return Boolean(row);
}

export async function requestEmailOtp(
  rawEmail: string,
  userId: string,
  ip: string,
): Promise<RequestEmailOtpResult> {
  const normalised = normaliseEmail(rawEmail);
  if (!normalised) return { ok: false, error: "Enter a valid email address." };

  if (await emailTakenByAnother(normalised, userId)) {
    return { ok: false, error: "That email is already on another WorthIt account. One account per person." };
  }

  const byEmail = await rateLimit("email-req", normalised, LIMITS.otpRequestPerPhone.limit, LIMITS.otpRequestPerPhone.windowSec);
  if (!byEmail.ok) {
    return { ok: false, error: "Too many codes requested for this address. Try again in an hour.", retryAfterSec: Math.ceil((byEmail.resetAt - Date.now()) / 1000) };
  }
  const byIp = await rateLimit("email-req-ip", ip, LIMITS.otpRequestPerIp.limit, LIMITS.otpRequestPerIp.windowSec);
  if (!byIp.ok) {
    return { ok: false, error: "Too many requests from this network. Try again later.", retryAfterSec: Math.ceil((byIp.resetAt - Date.now()) / 1000) };
  }

  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  const expiresAt = new Date(Date.now() + EMAIL_OTP_TTL_MINUTES * 60_000);

  await db.insert(emailChallenges).values({
    email: normalised, userId, codeHash: digest(normalised, code), expiresAt, ip,
  });

  const { subject, text } = verificationEmail(code);
  try {
    await getMailProvider().send(rawEmail.trim(), subject, text);
  } catch (err) {
    return { ok: false, error: "We couldn't send the code right now. Please try again." + (env().NODE_ENV === "development" ? ` (${String(err)})` : "") };
  }

  return { ok: true, expiresAt, devCode: env().NODE_ENV === "development" ? code : undefined };
}

export type VerifyEmailOtpResult = { ok: true } | { ok: false; error: string };

export async function verifyEmailOtp(rawEmail: string, code: string, userId: string): Promise<VerifyEmailOtpResult> {
  const normalised = normaliseEmail(rawEmail);
  if (!normalised) return { ok: false, error: "Enter a valid email address." };
  if (!/^\d{6}$/.test(code)) return { ok: false, error: "Enter the 6-digit code." };

  const attempts = await rateLimit("email-verify", normalised, LIMITS.otpVerifyPerPhone.limit, LIMITS.otpVerifyPerPhone.windowSec);
  if (!attempts.ok) return { ok: false, error: "Too many attempts. Request a new code in a few minutes." };

  const [challenge] = await db
    .select()
    .from(emailChallenges)
    .where(and(
      eq(emailChallenges.email, normalised),
      eq(emailChallenges.userId, userId),
      isNull(emailChallenges.consumedAt),
      gt(emailChallenges.expiresAt, new Date()),
    ))
    .orderBy(desc(emailChallenges.createdAt))
    .limit(1);

  if (!challenge) return { ok: false, error: "That code has expired. Request a new one." };
  if (challenge.attempts >= EMAIL_OTP_MAX_ATTEMPTS) {
    return { ok: false, error: "Too many wrong attempts on this code. Request a new one." };
  }

  if (!constantTimeEquals(challenge.codeHash, digest(normalised, code))) {
    await db.update(emailChallenges).set({ attempts: challenge.attempts + 1 }).where(eq(emailChallenges.id, challenge.id));
    const left = EMAIL_OTP_MAX_ATTEMPTS - (challenge.attempts + 1);
    return { ok: false, error: left > 0 ? `Incorrect code. ${left} attempt${left === 1 ? "" : "s"} left.` : "Too many wrong attempts. Request a new code." };
  }

  // Re-check at the moment of writing: someone else may have verified this
  // address between the send and the confirm.
  if (await emailTakenByAnother(normalised, userId)) {
    return { ok: false, error: "That email was just claimed by another account." };
  }

  await db.update(emailChallenges).set({ consumedAt: new Date() }).where(eq(emailChallenges.id, challenge.id));
  return { ok: true };
}
