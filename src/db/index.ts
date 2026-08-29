import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";
import { env } from "@/env";

/**
 * Single Postgres client, cached across hot reloads.
 *
 * `max: 1` is deliberate. On Vercel every serverless invocation is its own
 * process, so a larger pool per invocation just exhausts Postgres connections
 * faster. Neon's pooled connection string does the pooling for us.
 */
declare global {
  // eslint-disable-next-line no-var
  var __pakkaSql: ReturnType<typeof postgres> | undefined;
}

function client() {
  if (!globalThis.__pakkaSql) {
    globalThis.__pakkaSql = postgres(env().DATABASE_URL, {
      max: 1,
      idle_timeout: 20,
      connect_timeout: 10,
      prepare: false, // required when going through a transaction pooler
    });
  }
  return globalThis.__pakkaSql;
}

export const db = drizzle(client(), { schema });
export { schema };
export type Db = typeof db;
