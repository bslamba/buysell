/**
 * Load .env.local (then .env) into process.env for the standalone CLIs.
 *
 * Next.js loads .env.local automatically. drizzle-kit and tsx do not — they are
 * ordinary Node processes — so `npm run db:migrate` saw DATABASE_URL as
 * undefined and failed with "Please provide required params for Postgres
 * driver". Anything that touches the database outside `next` must import this
 * first.
 *
 * Deliberately dependency-free: adding dotenv would mean an npm install, and on
 * this project installs happen only on the machine that owns node_modules.
 * Precedence matches Next's: .env.local wins over .env, and a variable already
 * present in the real environment wins over both, so CI and Vercel are
 * unaffected.
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function parse(text) {
  const out = {};
  for (let line of text.split(/\r?\n/)) {
    line = line.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim().replace(/^export\s+/, "");
    if (!key) continue;
    let value = line.slice(eq + 1).trim();

    // A quoted value ends at its closing quote, so a trailing `# comment` is
    // dropped. An unquoted value keeps everything, because `#` is legal inside
    // a Postgres password.
    const q = value[0];
    if (q === '"' || q === "'") {
      const end = value.indexOf(q, 1);
      value = end === -1 ? value.slice(1) : value.slice(1, end);
      if (q === '"') value = value.replace(/\\n/g, "\n");
    }
    out[key] = value;
  }
  return out;
}

export function loadEnv() {
  for (const file of [".env.local", ".env"]) {
    const path = resolve(root, file);
    if (!existsSync(path)) continue;
    for (const [k, v] of Object.entries(parse(readFileSync(path, "utf8")))) {
      if (process.env[k] === undefined) process.env[k] = v;   // real env wins
    }
  }
  return process.env;
}

loadEnv();
