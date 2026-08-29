/**
 * Pre-flight for `npm run db:migrate`.
 *
 * The migration creates an HNSW index using `bit_hamming_ops`, which is how
 * duplicate-image search finds near-matching perceptual hashes. That operator
 * class arrived in pgvector 0.7.0. On an older pgvector the migration dies
 * partway with:
 *
 *     operator class "bit_hamming_ops" does not exist for access method "hnsw"
 *
 * which says nothing about pgvector, nothing about versions, and leaves the
 * schema half-applied. Ubuntu still ships 0.6.0, so this is not hypothetical.
 * Checking first turns a confusing failure into one sentence.
 */
import "./load-env.mjs";
import postgres from "postgres";
import { atLeast, MIN_PGVECTOR } from "./pgvector-version.mjs";

function die(message) {
  console.error(`\n  ${message}\n`);
  process.exit(1);
}

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    die('DATABASE_URL is not set. Put it in .env.local:\n' +
        '    DATABASE_URL="postgresql://user:password@host/dbname?sslmode=require"');
  }

  const sql = postgres(url, { max: 1, connect_timeout: 15, onnotice: () => {} });
  try {
    const [{ server }] = await sql`select version() as server`;

    const [vector] = await sql`
      select default_version, installed_version
      from pg_available_extensions where name = 'vector'`;

    if (!vector) {
      die("This Postgres does not offer the `vector` extension, which the image-duplicate\n" +
          "  index needs. Neon and Supabase include it; a local Postgres needs pgvector\n" +
          "  installed (brew install pgvector, or the pgvector/pgvector:pg16 Docker image).");
    }

    const have = vector.installed_version ?? vector.default_version;
    if (!atLeast(have, MIN_PGVECTOR)) {
      die(`pgvector ${have} is too old — the duplicate-image index needs ${MIN_PGVECTOR} or newer\n` +
          "  for `bit_hamming_ops`. Upgrade pgvector, then run this again.");
    }

    console.log(`  ✓ ${server.split(" ").slice(0, 2).join(" ")}, pgvector ${have}`);
  } catch (err) {
    if (err?.code === "ECONNREFUSED" || err?.code === "ENOTFOUND" || err?.code === "ETIMEDOUT") {
      die(`Cannot reach the database (${err.code}). Check DATABASE_URL in .env.local — it is\n` +
          "  currently pointing somewhere that is not answering.");
    }
    if (err?.code === "28P01") die("The database rejected the username or password in DATABASE_URL.");
    if (err?.code === "3D000") die("The database named in DATABASE_URL does not exist yet.");
    throw err;
  } finally {
    await sql.end({ timeout: 5 });
  }
}

main().catch((err) => { console.error(err); process.exit(1); });
