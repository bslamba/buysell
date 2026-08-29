# WorthIt

**Know what it's worth.** A verification-first marketplace for pre-owned goods in India.

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
| [`docs/NAMING.md`](docs/NAMING.md) | The name, the logo, typography, and what still needs a trademark check |
| [`docs/DESIGN.md`](docs/DESIGN.md) | The Apple-glass design system — tokens, the glass utilities, components |

## Stack

Next.js 15 · TypeScript · Tailwind v4 · Drizzle ORM · Neon Postgres + pgvector ·
Auth.js v5 · Vercel Blob · Upstash Redis · Inngest · Vercel

## Layout

```
src/
  config/
    brand.ts            brand identity — one file re-brands the app
    categories.ts       category registry; each category carries its own rules
  env.ts                zod-validated environment contract
  middleware.ts         coarse routing gate (not the authorisation boundary)
  db/
    schema.ts           full Drizzle schema
  lib/
    auth/
      roles.ts          role hierarchy, dependency-free (used by edge middleware)
      phone.ts          E.164 normalisation for Indian mobile numbers
      otp.ts            OTP issue and verify, hashed codes, rate limited
      config.ts         Auth.js v5 config: Google + phone-OTP, JWT sessions
      guards.ts         requireUser / requireRole / requireOrgMember
    rate-limit.ts       Upstash with an in-memory dev fallback
    sms/                MSG91 | Twilio | console providers
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

**Phase 1 complete, and the public site is built.** Schema, category rules, image
fingerprinting, the moderation engine, phone-OTP and Google authentication, role
guards, the admin review queue, and 25 routes of public site are all in place.
Typecheck, 22 unit tests and a production build are green.

Phase 2 (listing creation and image ingest) is next — see `docs/BUILD.md`.

### Pages

| Route | What it is |
|---|---|
| `/` | Home — hero, how it works, categories, the checks, corporate band |
| `/browse` | Live listings, filterable by category |
| `/categories` | Every category with its verification tier and rules |
| `/sell` | Seller onboarding and the rules that decide if a listing goes live |
| `/auctions` | Corporate bulk-lot auctions |
| `/wish` | Wishlist — tell us what to find |
| `/about` · `/team` · `/socials` | Company |
| `/help` · `/contact` · `/shipping` | Support |
| `/terms` · `/privacy` | Legal (**drafts — need counsel review**) |
| `/signin` · `/verify-phone` | Auth |
| `/admin` · `/admin/queue` | Moderation |
| `/corporate` · `/corporate/pending` | Business accounts |

### Test accounts

`npm run db:seed` creates these. In development the OTP is printed to the
dev-server terminal, so no SMS account is needed to sign in.

| Number | Role |
|---|---|
| +91 90000 00001 | superadmin |
| +91 90000 00002 | moderator |
| +91 90000 00003 | trusted seller (auto-approve eligible) |
| +91 90000 00004 | new seller (always human-reviewed) |
| +91 90000 00005 | corporate owner (1 approved + 1 pending org) |

## Licence

Proprietary — Gryffin Global IT Services Private Limited.
