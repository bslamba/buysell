import type { Config } from "drizzle-kit";
// Must come first: drizzle-kit is a plain Node process and does not read
// .env.local the way `next` does, so without this DATABASE_URL is undefined.
import "./scripts/load-env.mjs";

/**
 * Migrations use the DIRECT endpoint, not the pooled one.
 *
 * Neon's pooled host (`...-pooler...`) is PgBouncer in transaction mode, which
 * is right for serverless request handling and wrong for DDL: a migration runs
 * multi-statement transactions and advisory locks that a transaction-mode
 * pooler can break in ways that surface as a half-applied schema. Neon hands
 * out both; the app keeps the pooled URL and migrations take the direct one
 * from DATABASE_URL_UNPOOLED when it is set.
 */
function requireDatabaseUrl(): string {
  const url = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL is not set. Put it in .env.local — e.g.\n" +
      "  DATABASE_URL=\"postgresql://user:password@host/dbname?sslmode=require\"",
    );
  }
  return url;
}

export default {
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: { url: requireDatabaseUrl() },
  verbose: true,
  strict: true,
} satisfies Config;
