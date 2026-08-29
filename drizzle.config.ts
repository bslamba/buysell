import type { Config } from "drizzle-kit";
// Must come first: drizzle-kit is a plain Node process and does not read
// .env.local the way `next` does, so without this DATABASE_URL is undefined.
import "./scripts/load-env.mjs";

function requireDatabaseUrl(): string {
  const url = process.env.DATABASE_URL;
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
