import { createHash, randomInt, timingSafeEqual } from "node:crypto";
import { and, eq, gt, isNull, desc } from "drizzle-orm";
import { db } from "@/db";
import { emailChallenges, users } from "@/db/schema";
import { env } from "@/env";
import { getMailProvider, verificationEmail } from "@/lib/mail";
import { rateLimit, LIMITS } from "@/lib/rate-limit";
import { normaliseEmail } from "./email";

/**
 * Email codes — the way in.
 *
 * Email is the sign-in identity because it is the one channel that works today
 * without a regulator's permission. Sending SMS to an Indian number needs DLT
 * registration of the entity, the header and every template before a carrier
 * will deliver anything; email needs an API key, and works with none at all in
 * development. Phone is still mandatory, but it is collected and verified after
 * sign-in, on the profile, where waiting for an SMS provider blocks completing
 * an account rather than blocking the front door.
 *
 * Rules are the same as the phone flow: codes stored only as a digest, attempts
 * counted per challenge, a code works exactly once.
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

/**
 * Send a sign-in code.
 *
 * Deliberately says nothing about whether the address already has an account.
 * The response is identical either way, so this endpoint cannot be used to ask
 * "is this person on WorthIt" — which for a marketplace where the answer might
 * be "yes, and here is their listing" is worth protecting.
 */
export async function requestEmailOtp(rawEmail: string, ip: string): Promise<RequestEmailOtpResult> {
  const normalised = normaliseEmail(rawEmail);
  if (!normalised) return { ok: false, error: "Enter a valid email address." };

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

  await db.insert(emailChallenges).values({ email: normalised, codeHash: digest(normalised, code), expiresAt, ip });

  const { subject, text } = verificationEmail(code);
  try {
    await getMailProvider().send(rawEmail.trim(), subject, text);
  } catch (err) {
    return { ok: false, error: "We couldn't send the code right now. Please try again." + (env().NODE_ENV === "development" ? ` (${String(err)})` : "") };
  }

  return { ok: true, expiresAt, devCode: env().NODE_ENV === "development" ? code : undefined };
}

export type VerifyEmailOtpResult =
  | { ok: true; userId: string; email: string; isNewUser: boolean }
  | { ok: false; error: string };

/**
 * Verify a sign-in code, creating the account on first use.
 *
 * `consume: false` is a dry run so the UI can say "2 attempts left" before
 * handing off to Auth.js; only the real sign-in consumes the challenge, because
 * a code must work exactly once. Failed attempts count either way, so the dry
 * run is not a free brute-force oracle.
 */
export async function verifyEmailOtp(
  rawEmail: string,
  code: string,
  opts: { consume?: boolean } = {},
): Promise<VerifyEmailOtpResult> {
  const consume = opts.consume ?? true;
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

  if (consume) {
    await db.update(emailChallenges).set({ consumedAt: new Date() }).where(eq(emailChallenges.id, challenge.id));
  }

  const [existing] = await db.select().from(users).where(eq(users.emailNormalised, normalised)).limit(1);
  if (existing) {
    if (existing.bannedAt) return { ok: false, error: "This account has been suspended. Contact support." };
    if (!existing.emailVerifiedAt) {
      await db.update(users).set({ emailVerifiedAt: new Date(), updatedAt: new Date() }).where(eq(users.id, existing.id));
    }
    return { ok: true, userId: existing.id, email: normalised, isNewUser: false };
  }

  if (!consume) {
    // Valid code for an address we have never seen. Report success without
    // creating the account; sign-in will create it a moment later.
    return { ok: true, userId: "", email: normalised, isNewUser: true };
  }

  const [created] = await db
    .insert(users)
    .values({
      email: rawEmail.trim(), emailNormalised: normalised,
      emailVerifiedAt: new Date(), role: "user",
    })
    .returning({ id: users.id });

  return { ok: true, userId: created.id, email: normalised, isNewUser: true };
}
