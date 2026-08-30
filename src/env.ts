import { z } from "zod";

/**
 * Environment contract.
 *
 * Deliberately permissive in development: the app must boot and be clickable
 * with nothing but a DATABASE_URL and an AUTH_SECRET, so a new developer is
 * productive in one command. Production is strict — `assertProductionEnv()`
 * runs at startup and fails loudly rather than degrading silently.
 */

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),

  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  AUTH_SECRET: z.string().min(16, "AUTH_SECRET must be at least 16 characters"),

  AUTH_GOOGLE_ID: z.string().optional(),
  AUTH_GOOGLE_SECRET: z.string().optional(),

  OTP_PROVIDER: z.enum(["msg91", "twilio", "console"]).default("console"),
  MSG91_AUTH_KEY: z.string().optional(),
  MSG91_TEMPLATE_ID: z.string().optional(),
  MSG91_SENDER_ID: z.string().optional(),
  TWILIO_ACCOUNT_SID: z.string().optional(),
  TWILIO_AUTH_TOKEN: z.string().optional(),
  // Verify is deliberately not used: it generates and holds the code itself,
  // which would move the credential outside our hashing and attempt counting.
  TWILIO_MESSAGING_SERVICE_SID: z.string().optional(),
  TWILIO_FROM_NUMBER: z.string().optional(),

  UPSTASH_REDIS_REST_URL: z.string().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),

  BLOB_READ_WRITE_TOKEN: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().default("WorthIt <noreply@example.in>"),

  PHASH_DUPLICATE_THRESHOLD: z.coerce.number().int().min(0).max(32).default(6),
  AUTOAPPROVE_MAX_RISK_SCORE: z.coerce.number().int().min(0).max(100).default(25),
  AUTOREJECT_MIN_RISK_SCORE: z.coerce.number().int().min(0).max(100).default(80),
});

export type Env = z.infer<typeof schema>;

function load(): Env {
  const parsed = schema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `  ${i.path.join(".")}: ${i.message}`).join("\n");
    throw new Error(`Invalid environment configuration:\n${issues}\n\nCopy .env.example to .env.local and fill it in.`);
  }
  return parsed.data;
}

let cached: Env | null = null;
export function env(): Env {
  if (!cached) cached = load();
  return cached;
}

/**
 * Which variables the selected SMS provider needs.
 *
 * Lives here rather than in lib/sms because lib/sms imports env, and the
 * production assertion below needs the answer — putting it there and importing
 * back would be a cycle. It is pure environment validation either way.
 */
export function missingSmsConfig(): string[] {
  const e = env();
  if (e.OTP_PROVIDER === "msg91") {
    return [
      !e.MSG91_AUTH_KEY && "MSG91_AUTH_KEY",
      !e.MSG91_TEMPLATE_ID && "MSG91_TEMPLATE_ID (the DLT-approved template)",
    ].filter((v): v is string => Boolean(v));
  }
  if (e.OTP_PROVIDER === "twilio") {
    return [
      !e.TWILIO_ACCOUNT_SID && "TWILIO_ACCOUNT_SID",
      !e.TWILIO_AUTH_TOKEN && "TWILIO_AUTH_TOKEN",
      !e.TWILIO_MESSAGING_SERVICE_SID && !e.TWILIO_FROM_NUMBER &&
        "TWILIO_MESSAGING_SERVICE_SID or TWILIO_FROM_NUMBER",
    ].filter((v): v is string => Boolean(v));
  }
  return [];
}

/** Things that are optional locally but must exist before real users arrive. */
export function assertProductionEnv(): void {
  const e = env();
  if (e.NODE_ENV !== "production") return;
  const missing: string[] = [];
  if (e.OTP_PROVIDER === "console") missing.push("OTP_PROVIDER must not be 'console' in production");
  for (const name of missingSmsConfig()) {
    missing.push(`${name} (required by OTP_PROVIDER="${e.OTP_PROVIDER}")`);
  }
  if (!e.UPSTASH_REDIS_REST_URL) missing.push("UPSTASH_REDIS_REST_URL (rate limiting is not optional in production)");
  if (!e.AUTH_GOOGLE_ID) missing.push("AUTH_GOOGLE_ID");
  if (missing.length) throw new Error(`Production environment is incomplete:\n  ${missing.join("\n  ")}`);
}

export const isDev = () => env().NODE_ENV === "development";
