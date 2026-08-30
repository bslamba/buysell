/**
 * Email identity.
 *
 * One person, one account. Phone verification does most of that work, but an
 * email address is trivially multiplied: `x@gmail.com`, `X@Gmail.com`,
 * `x.x@gmail.com` and `x+worthit@gmail.com` are one inbox and four strings.
 * Storing them as four rows would hand back exactly the multi-account trick the
 * phone check exists to prevent.
 *
 * So every address is stored twice: `email` as typed (for display and for
 * sending, because some providers do treat dots as significant), and
 * `emailNormalised` folded to one identity, which is the column carrying the
 * unique index.
 */

/** Providers that genuinely ignore dots in the local part. */
const DOT_INSENSITIVE = new Set(["gmail.com", "googlemail.com"]);

/**
 * Providers whose +tag is a filing convenience rather than a different inbox.
 * Kept to the ones we can be sure about: folding +tags at a provider that
 * treats them as distinct addresses would merge two real people into one
 * account, which is a far worse failure than allowing one extra account.
 */
const PLUS_TAGGING = new Set([
  "gmail.com", "googlemail.com",
  "outlook.com", "hotmail.com", "live.com", "msn.com",
  "yahoo.com", "yahoo.in", "yahoo.co.in",
  "icloud.com", "me.com", "mac.com",
  "proton.me", "protonmail.com", "pm.me",
  "fastmail.com", "zoho.com", "zohomail.in",
]);

/** RFC-shaped enough for a sign-up form; the verification code is the real test. */
const SHAPE = /^[^\s@,;:<>()[\]\\"]+@[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/i;

export function isValidEmail(raw: string): boolean {
  const value = raw.trim();
  if (value.length < 6 || value.length > 254) return false;
  const at = value.lastIndexOf("@");
  if (at < 1) return false;
  if (value.slice(0, at).length > 64) return false;   // local part limit
  if (value.includes("..")) return false;
  return SHAPE.test(value);
}

/**
 * The identity an address maps to. Returns null when the input is not a usable
 * address, so callers cannot accidentally store an empty identity.
 */
export function normaliseEmail(raw: string): string | null {
  if (!raw) return null;
  const value = raw.trim();
  if (!isValidEmail(value)) return null;

  const at = value.lastIndexOf("@");
  let local = value.slice(0, at);
  const domainRaw = value.slice(at + 1).toLowerCase();

  // googlemail.com is the same mailbox as gmail.com.
  const domain = domainRaw === "googlemail.com" ? "gmail.com" : domainRaw;

  local = local.toLowerCase();
  if (PLUS_TAGGING.has(domain)) {
    const plus = local.indexOf("+");
    if (plus === 0) return null;              // the whole local part is a tag
    if (plus > 0) local = local.slice(0, plus);
  }
  if (DOT_INSENSITIVE.has(domain)) local = local.replace(/\./g, "");

  if (!local) return null;
  return `${local}@${domain}`;
}

/** What we show back to the user, trimmed but otherwise as they typed it. */
export function displayEmail(raw: string): string {
  return raw.trim();
}

/** Whole years between a date of birth and today, in UTC. */
export function ageInYears(dob: Date, now = new Date()): number {
  let age = now.getUTCFullYear() - dob.getUTCFullYear();
  const month = now.getUTCMonth() - dob.getUTCMonth();
  if (month < 0 || (month === 0 && now.getUTCDate() < dob.getUTCDate())) age--;
  return age;
}

/**
 * The minimum age to hold an account.
 *
 * Not an arbitrary product choice: under the Indian Contract Act a contract
 * with a minor is void ab initio, and every listing and purchase here is a
 * contract. An account that cannot legally transact should not be created.
 */
export const MIN_AGE = 18;
export const MAX_AGE = 120;

export type DobProblem = "missing" | "malformed" | "future" | "too_young" | "implausible";

export function checkDateOfBirth(value: string, now = new Date()): { ok: true; dob: Date } | { ok: false; problem: DobProblem } {
  if (!value) return { ok: false, problem: "missing" };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return { ok: false, problem: "malformed" };
  const dob = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(dob.getTime())) return { ok: false, problem: "malformed" };
  // Round-trip guard: "2025-02-31" parses to 3 March without it.
  if (dob.toISOString().slice(0, 10) !== value) return { ok: false, problem: "malformed" };
  if (dob.getTime() > now.getTime()) return { ok: false, problem: "future" };

  const age = ageInYears(dob, now);
  if (age > MAX_AGE) return { ok: false, problem: "implausible" };
  if (age < MIN_AGE) return { ok: false, problem: "too_young" };
  return { ok: true, dob };
}

export function dobMessage(problem: DobProblem): string {
  switch (problem) {
    case "missing": return "Enter your date of birth.";
    case "malformed": return "Enter your date of birth as a real date.";
    case "future": return "That date is in the future.";
    case "implausible": return "Check the year — that date of birth doesn't look right.";
    case "too_young": return `You need to be ${MIN_AGE} or over to buy and sell on WorthIt.`;
  }
}
