/**
 * Turning a driver error into something a human can act on.
 *
 * Every one of these was, at some point, reported to the user as "Network
 * error. Check your connection and try again." — which sent them to look at
 * their wifi while the real problem was a Postgres that was not running. The
 * hints below are shown in development only: in production they would tell an
 * attacker which part of the stack is misconfigured.
 */

/** Postgres SQLSTATEs and Node socket errors we can explain precisely. */
const HINTS: Record<string, string> = {
  ECONNREFUSED:
    "The database refused the connection. Postgres is not running at the host in DATABASE_URL, or the port is wrong.",
  ENOTFOUND:
    "The database host in DATABASE_URL could not be resolved. Check the hostname.",
  ETIMEDOUT:
    "The database did not answer in time. Check DATABASE_URL and whether the host allows connections from here.",
  ECONNRESET:
    "The database closed the connection. A hosted Postgres usually needs ?sslmode=require in DATABASE_URL.",
  "28P01": "The database rejected the username or password in DATABASE_URL.",
  "28000": "The database rejected the connection for this user. Check DATABASE_URL and any IP allow-list.",
  "3D000": "The database named in DATABASE_URL does not exist. Create it, then run `npm run db:migrate`.",
  "42P01": "The database is reachable but its tables are missing. Run `npm run db:migrate`.",
  "42703": "The database schema is out of date — a column the code expects is missing. Run `npm run db:migrate`.",
  "3F000": "The `vector` extension is missing. Run `CREATE EXTENSION IF NOT EXISTS vector;` then `npm run db:migrate`.",
};

/**
 * A one-line explanation of a database failure, or null if this is not one.
 * Callers must gate the result on development themselves — this function does
 * not know whether its answer is about to be shown to a stranger.
 */
export function dbErrorHint(err: unknown, depth = 0): string | null {
  if (!err || typeof err !== "object" || depth > 4) return null;
  const code = (err as { code?: unknown }).code;
  if (typeof code === "string" && code in HINTS) return HINTS[code];

  // postgres.js wraps the original socket failure; follow the chain, bounded,
  // because a cycle of causes would otherwise hang the request.
  const cause = (err as { cause?: unknown }).cause;
  if (cause && cause !== err) return dbErrorHint(cause, depth + 1);
  return null;
}

/** True when the failure is the database rather than the caller's input. */
export function isDbError(err: unknown): boolean {
  return dbErrorHint(err) !== null;
}
