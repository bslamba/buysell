#!/usr/bin/env node
/**
 * Post-processes drizzle-kit output.
 *
 * Two things drizzle-kit cannot express for us:
 *
 * 1. `bit(64)` comes from a customType, and drizzle-kit emits unknown types as
 *    quoted identifiers — `"bit(64)"` — which Postgres reads as a type literally
 *    named `bit(64)` and rejects. We unquote it.
 *
 * 2. The HNSW index on the perceptual-hash column needs the `vector` extension,
 *    which has to exist before the index is created.
 *
 * Wired into `npm run db:generate`, so it can't be forgotten.
 */
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const DIR = "drizzle";
const EXTENSION_LINE = "CREATE EXTENSION IF NOT EXISTS vector;--> statement-breakpoint";

let changed = 0;

for (const file of readdirSync(DIR).filter((f) => f.endsWith(".sql")).sort()) {
  const path = join(DIR, file);
  const before = readFileSync(path, "utf8");
  let after = before;

  // 1. Unquote the custom bit type wherever it appears.
  after = after.replace(/"bit\((\d+)\)"/g, "bit($1)");

  // 2. Ensure pgvector exists before any hnsw index is created.
  if (/USING hnsw/i.test(after) && !after.includes("CREATE EXTENSION IF NOT EXISTS vector")) {
    after = `${EXTENSION_LINE}\n${after}`;
  }

  if (after !== before) {
    writeFileSync(path, after);
    console.log(`  fixed ${file}`);
    changed++;
  }
}

console.log(changed === 0 ? "Migrations already correct." : `Post-processed ${changed} migration file(s).`);
