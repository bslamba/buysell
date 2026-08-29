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
  var __worthitSql: ReturnType<typeof postgres> | undefined;
}

function client() {
  if (!globalThis.__worthitSql) {
    globalThis.__worthitSql = postgres(env().DATABASE_URL, {
      max: 1,
      idle_timeout: 20,
      // Deliberately short. With max:1, every request queues behind the
      // connection attempt in front of it, so a slow timeout against an
      // unreachable database turns one outage into a pile-up. Failing fast lets
      // the page render its degraded state instead.
      connect_timeout: 5,
      prepare: false, // required when going through a transaction pooler
    });
  }
  return globalThis.__worthitSql;
}

export const db = drizzle(client(), { schema });
export { schema };
export type Db = typeof db;
