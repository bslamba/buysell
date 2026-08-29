/**
 * Phone normalisation, kept free of any database or environment dependency so it
 * can be unit-tested and used from the edge runtime.
 */

/**
 * Normalise anything a user might type into E.164.
 * Accepts 9876543210, 09876543210, 919876543210, +91 98765 43210, (+91)-98765-43210.
 * Indian mobile numbers are 10 digits and start with 6-9.
 */
export function normalisePhone(input: string): string | null {
  const digits = input.replace(/\D/g, "");
  let local: string;
  if (digits.length === 10) local = digits;
  else if (digits.length === 11 && digits.startsWith("0")) local = digits.slice(1);
  else if (digits.length === 12 && digits.startsWith("91")) local = digits.slice(2);
  else if (digits.length === 13 && digits.startsWith("091")) local = digits.slice(3);
  else return null;
  if (!/^[6-9]\d{9}$/.test(local)) return null;
  return `+91${local}`;
}

/** Display form: +91 98765 43210 */
export function formatPhone(e164: string): string {
  const m = /^\+91(\d{5})(\d{5})$/.exec(e164);
  return m ? `+91 ${m[1]} ${m[2]}` : e164;
}

/** Masked form for logs and moderator views: +91 98••• ••210 */
export function maskPhone(e164: string): string {
  const m = /^\+91(\d{2})\d{5}(\d{3})$/.exec(e164);
  return m ? `+91 ${m[1]}••• ••${m[2]}` : "+91 ••••• •••••";
}
