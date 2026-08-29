# Pakka

A verification-first marketplace for pre-owned goods in India.

Every listing is machine-checked before it goes live: photographs are
fingerprinted against every image ever uploaded to the platform, IMEIs are
checked against the Government of India CEIR stolen-device register, prices are
compared against real observed market data, and contact details are stripped from
listing text. What reaches a human moderator is only what the machine genuinely
could not decide.

> The brand name is a single config value in `src/config/brand.ts`.
> See [`docs/NAMING.md`](docs/NAMING.md) for the shortlist and reasoning.

---

## Quick start

```bash
git clone https://github.com/bslamba/buysell.git
cd buysell
npm install
cp .env.example .env.local          # fill in the values
openssl rand -base64 32             # -> AUTH_SECRET

# Postgres must have pgvector:  CREATE EXTENSION IF NOT EXISTS vector;
npm run db:generate && npm run db:migrate

npm run dev                          # http://localhost:3000
```

```bash
npm run typecheck    # tsc
npm test             # vitest
npm run db:studio    # browse the database
```

## Documentation

| Document | What's in it |
|---|---|
| [`docs/BUILD.md`](docs/BUILD.md) | **Start here.** Phase-by-phase build plan, accounts to create, what "done" means at each step |
| [`docs/MODERATION.md`](docs/MODERATION.md) | Every automated check, why it exists, and the roadmap of checks still to build |
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | Stack choices and the reasoning behind each, data model, security posture |
| [`docs/NAMING.md`](docs/NAMING.md) | Brand name shortlist, trademark cautions, certificate naming |

## Stack

Next.js 15 · TypeScript · Tailwind v4 · Drizzle ORM · Neon Postgres + pgvector ·
Auth.js v5 · Vercel Blob · Upstash Redis · Inngest · Vercel

## Layout

```
src/
  config/
    brand.ts            brand identity — one file re-brands the app
    categories.ts       category registry; each category carries its own rules
  db/
    schema.ts           full Drizzle schema
  lib/
    hash/phash.ts       sha256 + pHash (DCT) + dHash, blur and stock-photo heuristics
    moderation/
      engine.ts         the pipeline: run checks, score, decide, prioritise
      types.ts          check contracts and injected service interfaces
      checks/
        images.ts       duplicate detection, quality, EXIF
        text.ts         contact leaks, scam scripts, prohibited goods, duplicates
        pricing.ts      price outliers, required attributes
        device.ts       IMEI Luhn, CEIR lookup, device-identity duplicates
        seller.ts       velocity, account age, trust, dispute history
docs/                   the documents listed above
```

## Status

Phase 1 of 7. Schema, category rules, image fingerprinting and the moderation
engine are written and unit-tested. Auth, UI, admin portal and auctions are next
— see `docs/BUILD.md`.

## Licence

Proprietary — Gryffin Global IT Services Private Limited.
