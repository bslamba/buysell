import { env } from "@/env";

export interface SmsProvider {
  readonly name: string;
  sendOtp(phone: string, code: string): Promise<void>;
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
 * MSG91. India-native, DLT-registered, materially cheaper than Twilio for
 * domestic traffic. The template must be pre-approved on the DLT registry —
 * unregistered templates are silently dropped by carriers, which is the single
 * most common reason "OTP not received" in India.
 */
const msg91Provider: SmsProvider = {
  name: "msg91",
  async sendOtp(phone, code) {
    const e = env();
    const res = await fetch("https://control.msg91.com/api/v5/otp", {
      method: "POST",
      headers: { "Content-Type": "application/json", authkey: e.MSG91_AUTH_KEY ?? "" },
      body: JSON.stringify({
        template_id: e.MSG91_TEMPLATE_ID,
        mobile: phone.replace(/^\+/, ""),
        otp: code,
        sender: e.MSG91_SENDER_ID,
      }),
    });
    if (!res.ok) throw new Error(`MSG91 send failed: ${res.status} ${await res.text()}`);
  },
};

const twilioProvider: SmsProvider = {
  name: "twilio",
  async sendOtp(phone, code) {
    const e = env();
    const sid = e.TWILIO_ACCOUNT_SID ?? "";
    const auth = Buffer.from(`${sid}:${e.TWILIO_AUTH_TOKEN ?? ""}`).toString("base64");
    const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
      method: "POST",
      headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        To: phone,
        From: e.MSG91_SENDER_ID ?? "",
        Body: `${code} is your Pakka verification code. It expires in 10 minutes. Never share it with anyone.`,
      }),
    });
    if (!res.ok) throw new Error(`Twilio send failed: ${res.status} ${await res.text()}`);
  },
};

export function getSmsProvider(): SmsProvider {
  switch (env().OTP_PROVIDER) {
    case "msg91": return msg91Provider;
    case "twilio": return twilioProvider;
    default: return consoleProvider;
  }
}
