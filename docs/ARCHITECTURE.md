# Architecture

## Shape

```
Browser
  │  signed direct upload
  ├──────────────────────────────► Vercel Blob  (listing images)
  │
  └── HTTPS ──► Next.js 15 on Vercel
                  │
                  ├── React Server Components  (catalogue, listing pages)
                  ├── Route Handlers           (REST for mutations)
                  ├── Middleware               (auth + role gates)
                  │
                  ├──► Neon Postgres + pgvector   (system of record)
                  ├──► Upstash Redis              (rate limits, OTP, hot cache)
                  ├──► Inngest                    (moderation, auctions, email)
                  │        │
                  │        ├──► Sightengine   (vision moderation)
                  │        ├──► CEIR API      (stolen-device lookup)
                  │        └──► Anthropic API (listing↔photo consistency)
                  │
                  ├──► MSG91      (phone OTP)
                  └──► Resend     (transactional email)
```

## Why these pieces

**Next.js on Vercel.** Server Components mean the catalogue renders on the server
with no client-side data fetching, which matters on Indian mobile networks.
Preview deploys per PR are worth the price on their own.

**Neon over Supabase.** Database branching. A moderation-rule change can be
tested against a branch of production data in a preview deploy without touching
production. That capability is specific to this problem and worth choosing for.

**pgvector for image matching.** The alternative is a dedicated vector service,
which means a second system of record and a sync problem. `bit(64)` + HNSW +
`bit_hamming_ops` handles millions of fingerprints in single-digit milliseconds
inside the database you already have.

**Inngest for background work.** The moderation pipeline is a multi-step,
externally-dependent, must-not-silently-fail workflow. Vercel functions with
`waitUntil` give you no retries, no step visibility and no replay. Inngest gives
all three, and its UI is how you will debug a stuck queue at 2am.

**Drizzle over Prisma.** The schema leans on Postgres-specific features —
`bit(64)`, partial unique indexes, HNSW operator classes. Drizzle expresses them
directly and generates readable SQL; Prisma needs escape hatches for each.

**Payments deliberately absent.** `lib/payments/provider.ts` defines the
interface. Implementing Razorpay or Cashfree later is one file. Building it now
would block the entire project behind merchant KYC.

## Data model, in one paragraph

`users` and `organizations` are the two actors; `organization_members` joins
them. `listings` hold the item, `listing_images` hold its photos, and
`image_fingerprints` is a **separate, durable** global index of every image ever
seen — it deliberately survives listing deletion. `moderation_events` records
every check result of every run; `review_decisions` records who decided what.
`auctions` → `auction_lots` → `bids` handle the corporate side, with
`allow_single_piece` on the lot letting retail buyers take one unit from a bulk
lot. `orders` model the transaction, already carrying escrow states even though
payments aren't wired. `price_observations` accumulates into the price index.
`audit_log` catches every privileged action.

## Security posture

- OTP codes stored hashed, never plain; 3 sends/hour/number, 5 attempts/challenge.
- IMEIs and serials stored **hashed with a server-side pepper**. Only the last 4
  are ever rendered. A database leak must not become a device registry.
- All admin routes behind role middleware *and* re-checked in every handler.
  Middleware alone is not authorisation.
- Every privileged action writes `audit_log` with actor, before/after, IP.
- Images uploaded directly to Blob with short-lived signed URLs; the server never
  proxies bytes.
- Rate limits on every mutating endpoint, keyed by user *and* IP.
- No secret in the repo. `.env.local` is gitignored; production lives in Vercel.

## What will break first at scale

1. **Moderation queue depth.** Human review is the bottleneck long before the
   database is. Watch median time-to-decision; when it passes 6 hours, raise the
   auto-approve rate rather than hiring.
2. **pHash false positives on white-background photos.** Many honest listings of
   the same model on the same desk look alike. Expect to tune the threshold up
   and lean harder on EXIF and seller signals.
3. **Postgres full-text search.** Fine to ~100k listings. Move to Typesense when
   measured p95 latency, not before.
4. **Blob storage cost.** 15 photos × millions of listings. Generate and serve
   derivatives, expire originals for closed listings after 90 days.
