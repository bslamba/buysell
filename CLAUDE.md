# Working notes for AI assistants on this repo

## What this is
WorthIt — a verification-first C2C + B2C marketplace for pre-owned goods in India.
The differentiator is the automated listing-review pipeline, not the storefront.
Read `docs/BUILD.md` and `docs/MODERATION.md` before making changes.

## Non-negotiables

- **Money is `bigint` paise.** Never a float, never rupees. Column names end
  `_paise`. Format for display only at the edge.
- **Device identifiers are hashed.** IMEIs and serials are stored as
  `sha256(value + AUTH_SECRET)`. Only `imeiLast4` is ever rendered. Never add a
  column that stores a raw IMEI or serial.
- **`image_fingerprints` must outlive listings.** No cascade delete on it, ever.
  Deleting rejected listings and re-uploading the same photos is precisely the
  abuse it exists to stop.
- **Checks never throw.** A failing check degrades to "unverified, needs a human"
  — never to "passed". See the try/catch in `engine.ts`.
- **Blockers are not scores.** If something is disqualifying, give it
  `severity: "blocker"`, not a high `scoreDelta`.
- **Seller-facing messages never leak thresholds.** "This photo has been used by
  another seller", not "pHash distance 4".
- **Every admin action writes `audit_log`.**
- **New moderation rules ship in shadow mode first**, measured for a week.

## Conventions

- TypeScript strict. No `any` — use `unknown` and narrow.
- Path alias `@/*` → `src/*`.
- Drizzle for all database access. Raw SQL only for pgvector operators, and then
  via `sql` template with bound parameters.
- Server Components by default; `"use client"` only where interaction demands it.
- Validate every request body with zod at the route boundary.
- Category behaviour belongs in `src/config/categories.ts`, never hardcoded in a
  check.

## Adding a moderation check

1. Write it in `src/lib/moderation/checks/` as a `Check`.
2. It takes only `ModerationContext` and returns `CheckResult[]`. No direct
   database access — go through `ctx.services` so it stays unit-testable.
3. Register it in `ALL_CHECKS` in `engine.ts`.
4. Add tests to `engine.test.ts`.
5. Document it in the table in `docs/MODERATION.md`.
6. Ship it in shadow mode before it can block anything.

## Adding a category

Add one entry to `CATEGORIES` in `src/config/categories.ts`. Nothing else.
If a new category needs behaviour the `CategoryRule` interface can't express,
extend the interface — don't special-case the slug in a check.

## Installing dependencies

**Always run `npm install` / `npm ci` on the host machine (macOS), never through a
remote bridge or a container that mounts this folder.**

`sharp` and `lightningcss` ship per-platform native binaries. Installing from a
Linux VM into a macOS-mounted folder produces a `node_modules` full of empty
platform directories and fails at the first native require:

```
Cannot find module '../lightningcss.darwin-arm64.node'
```

If that happens, the install is corrupt rather than incomplete — patching one
package will not fix it:

```bash
rm -rf node_modules && npm ci
```

`package-lock.json` records every platform variant, so `npm ci` on any OS
installs the right binaries.

## Commands
```
npm run dev | build | typecheck | test
npm run db:generate | db:migrate | db:studio | db:seed
```
