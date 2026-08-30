import { env } from "@/env";

/**
 * Email delivery.
 *
 * Same shape as lib/sms: a real provider and a console fallback, so the whole
 * verification flow is exercisable with no vendor account. Email is why this
 * project can have a working verified sign-up today at all — unlike SMS in
 * India, nothing has to be registered with a regulator first.
 */

export interface MailProvider {
  readonly name: string;
  send(to: string, subject: string, text: string): Promise<void>;
}

const SEND_TIMEOUT_MS = 10_000;

const consoleProvider: MailProvider = {
  name: "console",
  async send(to, subject, text) {
    // eslint-disable-next-line no-console
    console.log(`\n  ┌─ email ─────────────────────────────┐\n  │ to:      ${to}\n  │ subject: ${subject}\n  │ ${text.replace(/\n/g, "\n  │ ")}\n  └─────────────────────────────────────┘\n`);
  },
};

const resendProvider: MailProvider = {
  name: "resend",
  async send(to, subject, text) {
    const e = env();
    const key = e.RESEND_API_KEY;
    if (!key) {
      throw new Error(
        'RESEND_API_KEY is not set. Set it in .env.local, or leave it empty to print ' +
        "verification emails to the server log instead.",
      );
    }
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: e.EMAIL_FROM, to: [to], subject, text }),
      signal: AbortSignal.timeout(SEND_TIMEOUT_MS),
    });
    if (!res.ok) throw new Error(`Resend send failed: ${res.status} ${await res.text()}`);
  },
};

/**
 * Resend when a key is present, the log otherwise.
 *
 * Chosen by whether the key exists rather than by a separate setting: an empty
 * key with a "resend" setting can only ever mean "not configured yet", and
 * failing sign-up over that would be pointless. `assertProductionEnv` requires
 * the key in production, so this fallback cannot reach real users.
 */
export function getMailProvider(): MailProvider {
  return env().RESEND_API_KEY ? resendProvider : consoleProvider;
}

export function verificationEmail(code: string): { subject: string; text: string } {
  return {
    subject: `${code} is your WorthIt verification code`,
    text:
      `Your WorthIt verification code is ${code}\n\n` +
      "It expires in 10 minutes. If you did not ask to verify this address, you can ignore this email.\n\n" +
      "Never share this code. WorthIt will never ask you for it.",
  };
}
