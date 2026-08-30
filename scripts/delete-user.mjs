/**
 * Delete an account, permanently.
 *
 * There is no UI for this and there should not be one: it is a development and
 * support tool, not a feature. Two safety rails, because an account deletion
 * cannot be undone:
 *
 *   1. It shows exactly what it found and what it will remove, then waits for
 *      you to type the phone or email back. No flag can skip that prompt.
 *   2. It refuses when NODE_ENV is production unless --i-know-this-is-production
 *      is passed, so a stray shell in the wrong terminal cannot quietly delete a
 *      real user.
 *
 * Related rows go with the account: listings, orders, org memberships and email
 * challenges all cascade from users.id. Image fingerprints deliberately do NOT
 * — they survive listing deletion by design, so that deleting a rejected
 * listing and re-uploading the same photos is still caught. That is the whole
 * point of that table, so this script leaves it alone and says so.
 *
 * Usage:
 *   node scripts/delete-user.mjs 8447732553
 *   node scripts/delete-user.mjs someone@example.com
 */
import "./load-env.mjs";
import { createInterface } from "node:readline/promises";
import postgres from "postgres";

const target = process.argv[2];
const allowProduction = process.argv.includes("--i-know-this-is-production");

if (!target) {
  console.error("\n  Usage: node scripts/delete-user.mjs <phone-or-email>\n");
  process.exit(1);
}

if (process.env.NODE_ENV === "production" && !allowProduction) {
  console.error("\n  NODE_ENV is production. Re-run with --i-know-this-is-production if you mean it.\n");
  process.exit(1);
}

/** Same shape as lib/auth/phone.ts: 10 Indian digits become +91XXXXXXXXXX. */
function asPhone(value) {
  const digits = value.replace(/\D/g, "");
  if (/^[6-9]\d{9}$/.test(digits)) return `+91${digits}`;
  if (/^91[6-9]\d{9}$/.test(digits)) return `+${digits}`;
  return null;
}

const url = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
if (!url) {
  console.error('\n  DATABASE_URL is not set. Put it in .env.local.\n');
  process.exit(1);
}

const sql = postgres(url, { max: 1, connect_timeout: 15, onnotice: () => {} });

try {
  const phone = asPhone(target);
  const email = target.includes("@") ? target.trim().toLowerCase() : null;

  const found = await sql`
    select id, phone, email, name, role, created_at, registered_at
    from users
    where (${phone}::text is not null and phone = ${phone})
       or (${email}::text is not null and (lower(email) = ${email} or email_normalised = ${email}))`;

  if (found.length === 0) {
    console.log(`\n  No account matches "${target}". Nothing to delete.\n`);
    process.exit(0);
  }
  if (found.length > 1) {
    console.error(`\n  "${target}" matches ${found.length} accounts. Refusing to guess — delete by a unique value.\n`);
    process.exit(1);
  }

  const user = found[0];
  const [counts] = await sql`
    select
      (select count(*) from listings where seller_id = ${user.id}) as listings,
      (select count(*) from orders where buyer_id = ${user.id}) as orders,
      (select count(*) from organization_members where user_id = ${user.id}) as memberships,
      (select count(*) from email_challenges where user_id = ${user.id}) as email_challenges`;

  console.log("\n  About to permanently delete:\n");
  console.log(`    id           ${user.id}`);
  console.log(`    name         ${user.name ?? "(none)"}`);
  console.log(`    phone        ${user.phone ?? "(none)"}`);
  console.log(`    email        ${user.email ?? "(none)"}`);
  console.log(`    role         ${user.role}`);
  console.log(`    created      ${user.created_at.toISOString().slice(0, 19).replace("T", " ")}`);
  console.log(`    registered   ${user.registered_at ? "yes" : "no"}`);
  console.log("\n  Cascading rows:\n");
  console.log(`    listings ${counts.listings} · orders ${counts.orders} · org memberships ${counts.memberships} · email challenges ${counts.email_challenges}`);
  console.log("\n  Image fingerprints are NOT removed: they outlive listings on purpose, so");
  console.log("  the same photos cannot be re-uploaded by someone else later.\n");

  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const typed = await rl.question(`  Type "${target}" to confirm, or anything else to cancel: `);
  rl.close();

  if (typed.trim() !== target) {
    console.log("\n  Cancelled. Nothing was deleted.\n");
    process.exit(0);
  }

  // OTP challenges are keyed by phone, not user id, so they do not cascade.
  const otp = user.phone ? await sql`delete from otp_challenges where phone = ${user.phone} returning id` : [];
  const deleted = await sql`delete from users where id = ${user.id} returning id`;

  console.log(`\n  Deleted ${deleted.length} account and ${otp.length} phone challenge${otp.length === 1 ? "" : "s"}.`);
  console.log("  That phone and email are now free to register again.\n");
} catch (err) {
  if (err?.code === "ECONNREFUSED" || err?.code === "ENOTFOUND" || err?.code === "CONNECT_TIMEOUT") {
    console.error(`\n  Cannot reach the database (${err.code}). Check DATABASE_URL in .env.local.\n`);
    process.exit(1);
  }
  throw err;
} finally {
  await sql.end({ timeout: 5 });
}
