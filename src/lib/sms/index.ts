import { env } from "@/env";

/**
 * SMS delivery.
 *
 * India makes this less trivial than it looks. Since TRAI's DLT mandate took
 * full effect, anything sent on the DOMESTIC route from an unregistered entity
 * is dropped at the network level — silently, with a success response from the
 * gateway. That is the single most common cause of "OTP not received" here, and
 * no amount of application code fixes it: the entity, the six-character header
 * and every template have to be registered first.
 *
 * Hence two providers with different trade-offs:
 *
 *   msg91   Domestic route. Much cheaper per message and shows the brand header,
 *           but needs DLT registration and a template whose ID goes in
 *           MSG91_TEMPLATE_ID. This is the production answer.
 *   twilio  International (ILDO) route. No DLT registration, delivers to Indian
 *           numbers from a numeric sender. Costs more per message. This is the
 *           answer while DLT registration is still in progress.
 *
 * Both fail loudly. A provider that is selected but not configured throws with
 * the name of the missing variable, at the point of sending rather than as a
 * mystery 500 later.
 */

export interface SmsProvider {
  readonly name: string;
  sendOtp(phone: string, code: string): Promise<void>;
}

/** A stuck vendor API must not hold a request open indefinitely. */
const SEND_TIMEOUT_MS = 10_000;

function required(value: string | undefined, name: string): string {
  if (!value) {
    throw new Error(
      `${name} is not set, but OTP_PROVIDER is "${env().OTP_PROVIDER}". ` +
      `Set it in .env.local, or set OTP_PROVIDER="console" to print codes to the log instead.`,
    );
  }
  return value;
}

/** Development provider. Prints the code to the server log instead of sending it. */
const consoleProvider: SmsProvider = {
  name: "console",
  async sendOtp(phone, code) {
    // eslint-disable-next-line no-console
    console.log(`\n  ┌─────────────────────────────────────┐\n  │  OTP for ${phone}  →  ${code}  │\n  └─────────────────────────────────────┘\n`);
  },
};

/**
 * MSG91, v5 OTP API.
 *
 * Note the response handling: MSG91 answers 200 with `{"type":"error", ...}`
 * for application-level failures such as an unapproved template or an
 * exhausted balance. Checking only res.ok would report those as sent, and the
 * user would sit waiting for a message that was never going to arrive.
 */
const msg91Provider: SmsProvider = {
  name: "msg91",
  async sendOtp(phone, code) {
    const e = env();
    const res = await fetch("https://control.msg91.com/api/v5/otp", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        authkey: required(e.MSG91_AUTH_KEY, "MSG91_AUTH_KEY"),
      },
      body: JSON.stringify({
        template_id: required(e.MSG91_TEMPLATE_ID, "MSG91_TEMPLATE_ID"),
        mobile: phone.replace(/^\+/, ""),        // MSG91 wants 91XXXXXXXXXX
        otp: code,
        ...(e.MSG91_SENDER_ID ? { sender: e.MSG91_SENDER_ID } : {}),
      }),
      signal: AbortSignal.timeout(SEND_TIMEOUT_MS),
    });

    const text = await res.text();
    if (!res.ok) throw new Error(`MSG91 send failed: ${res.status} ${text}`);

    let body: { type?: string; message?: unknown } = {};
    try { body = JSON.parse(text); } catch { /* non-JSON 200: treat as sent */ }
    if (body.type === "error") {
      throw new Error(`MSG91 rejected the send: ${typeof body.message === "string" ? body.message : text}`);
    }
  },
};

/**
 * Twilio Programmable Messaging.
 *
 * A Messaging Service is preferred over a bare From number: it is what carries
 * the sender pool and the India-specific routing. TWILIO_FROM_NUMBER is the
 * fallback for a single-number account.
 *
 * We send our own code rather than using Twilio Verify, deliberately. Verify
 * generates and holds the code itself, which would put the credential outside
 * our database and outside the hashing and attempt-counting in lib/auth/otp.ts.
 */
const twilioProvider: SmsProvider = {
  name: "twilio",
  async sendOtp(phone, code) {
    const e = env();
    const sid = required(e.TWILIO_ACCOUNT_SID, "TWILIO_ACCOUNT_SID");
    const token = required(e.TWILIO_AUTH_TOKEN, "TWILIO_AUTH_TOKEN");

    const params = new URLSearchParams({
      To: phone,
      Body: `${code} is your WorthIt verification code. It expires in 10 minutes. Never share it with anyone.`,
    });
    if (e.TWILIO_MESSAGING_SERVICE_SID) {
      params.set("MessagingServiceSid", e.TWILIO_MESSAGING_SERVICE_SID);
    } else {
      params.set("From", required(e.TWILIO_FROM_NUMBER, "TWILIO_FROM_NUMBER (or TWILIO_MESSAGING_SERVICE_SID)"));
    }

    const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params,
      signal: AbortSignal.timeout(SEND_TIMEOUT_MS),
    });
    if (!res.ok) throw new Error(`Twilio send failed: ${res.status} ${await res.text()}`);
  },
};

const PROVIDERS: Record<string, SmsProvider> = {
  msg91: msg91Provider,
  twilio: twilioProvider,
  console: consoleProvider,
};

export function getSmsProvider(): SmsProvider {
  return PROVIDERS[env().OTP_PROVIDER] ?? consoleProvider;
}
