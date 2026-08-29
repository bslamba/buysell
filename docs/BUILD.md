# Pakka — Step-by-step build plan

> This is the working document. Follow it top to bottom. Every phase ends with
> something demonstrable, and nothing in a later phase is required for an
> earlier one to work.

**Repo:** `github.com/bslamba/buysell`
**Local:** `~/Projects/buysell`
**Hosting:** Vercel
**Brand name:** set in `src/config/brand.ts` — one file, changes everything.

---

## Phase 0 — Accounts and keys (half a day, do this first)

Nothing below can be built without these. Create them in this order; each takes
minutes and most have a free tier that covers the entire pilot.

| # | Service | What it does here | Plan to start | Why this one |
|---|---------|-------------------|---------------|--------------|
| 1 | **GitHub** | Source of truth | Free | Already created: `bslamba/buysell` |
| 2 | **Vercel** | Hosting, preview deploys, cron | Hobby → Pro (₹1,700/mo) at launch | Zero-config Next.js, previews per PR |
| 3 | **Neon** | Postgres + pgvector | Free → ₹1,600/mo | Branching databases; a DB branch per PR is genuinely useful for a review pipeline |
| 4 | **Vercel Blob** | Listing image storage | Usage-based | One less vendor; signed uploads straight from the browser |
| 5 | **Upstash Redis** | Rate limits, OTP throttling, hot cache | Free → pay-per-request | Serverless-native, no connection pooling problem |
| 6 | **Inngest** | Background jobs — the whole moderation pipeline | Free → ₹4,000/mo | Durable steps, retries, and a real UI for failed runs. Vercel functions alone can't do this reliably |
| 7 | **MSG91** | Phone OTP | ~₹0.15–0.20/SMS | India-native, DLT-registered, cheaper than Twilio domestically |
| 8 | **Google Cloud** | Google sign-in | Free | OAuth client ID only |
| 9 | **Sightengine** | Image moderation, watermark + NSFW | ~₹0.08/image | Cheapest credible option; swap for AWS Rekognition at volume |
| 10 | **Resend** | Transactional email | Free → ₹1,700/mo | Clean API, good deliverability |
| 11 | **Sentry** + **PostHog** | Errors + product analytics | Free tiers | You cannot tune a moderation engine you can't observe |

> **Deliberately deferred:** Razorpay/Cashfree and any escrow partner. Payments
> need a registered entity, merchant KYC and a compliance review. The code has a
> payments interface from day one (`lib/payments/provider.ts`) so plugging one in
> later is a single file, not a refactor.

**Do now:**
```bash
cd ~/Projects/buysell
cp .env.example .env.local     # then fill it in
openssl rand -base64 32        # paste as AUTH_SECRET
```

**GitHub authentication.** Do NOT use your account password — GitHub disabled
that for git in 2021. Create a fine-grained Personal Access Token scoped to the
`buysell` repo only (Settings → Developer settings → Personal access tokens →
Fine-grained), then:
```bash
git config --global credential.helper osxkeychain
git push -u origin main        # username: bslamba, password: <paste the PAT>
```
The token goes into the macOS Keychain. It never touches a file in the repo.

---

## Phase 1 — Foundations (week 1)

**Goal:** a deployed app at a real URL where a user can sign in with a phone
number, and an admin can see an empty queue.

1. **Install and run.** Run this in a terminal on the machine itself — not
   through a remote shell that mounts this folder. `sharp` and `lightningcss`
   have per-platform native binaries, and installing from the wrong OS leaves
   `node_modules` full of empty platform directories that fail at the first
   native require. If you ever see `Cannot find module
   '../lightningcss.darwin-arm64.node'`, the cure is `rm -rf node_modules && npm ci`.
   ```bash
   npm ci        # or: npm install
   npm run dev
   ```
2. **Database.** Create the Neon project, copy the pooled connection string into
   `DATABASE_URL`, then:
   ```sql
   CREATE EXTENSION IF NOT EXISTS vector;   -- needed for bit_hamming_ops
   ```
   ```bash
   npm run db:generate && npm run db:migrate
   ```
3. **Auth.** Auth.js v5 with two providers:
   - Google OAuth (fast path, desktop buyers)
   - Phone OTP as a Credentials provider: `POST /api/auth/otp/request` writes an
     `otp_challenges` row with a **hashed** code, `POST /api/auth/otp/verify`
     consumes it. Rate limit hard: 3 sends per number per hour, 5 verify attempts
     per challenge, 10 sends per IP per hour, all via Upstash.
4. **Roles.** `user | corporate | moderator | admin | superadmin`. Middleware
   guards `/admin/*` (moderator and above) and `/corporate/*` (org members).
5. **Deploy.** Connect the repo to Vercel, add every env var, push to `main`.

**Done when:** you can sign in on your phone at the Vercel URL, and `/admin`
returns 403 for a normal account.

---

## Phase 2 — Listings and the upload flow (week 2)

**Goal:** a seller can create a listing and it lands in `pending_review`.

1. **Category picker** driven by `src/config/categories.ts`. Selecting a category
   dynamically renders its `requiredAttributes` as form fields. Adding a category
   later is a config edit, not a code change.
2. **Image upload.** Client requests a signed Vercel Blob URL, uploads directly
   (never through your server — that's the cheap way to handle 15 photos), then
   posts the blob URLs to `/api/listings`.
3. **Fingerprinting on ingest.** For each image the server fetches the bytes once
   and computes `sha256`, `pHash`, `dHash` (`src/lib/hash/phash.ts`), writes
   `listing_images`, and upserts `image_fingerprints`. This happens on upload, not
   at review time, so the queue is instant.
4. **Draft → submit.** Submitting sets `status = 'pending_review'` and emits an
   Inngest event `listing/submitted`.

**Done when:** you can post a laptop with 5 photos and see the row plus 5
fingerprints in the database.

---

## Phase 3 — The automated review pipeline (week 3, the important one)

**Goal:** every submission is machine-reviewed within seconds, and only genuinely
ambiguous listings reach a human.

1. **Inngest function** on `listing/submitted` builds a `ModerationContext` and
   calls `runModeration()` (`src/lib/moderation/engine.ts`).
2. **Persist everything.** Each `CheckResult` becomes a `moderation_events` row.
   This is not optional — the event log is what lets you raise the auto-approve
   rate safely later, and what you show a seller who disputes a rejection.
3. **Apply the decision:**
   - `reject` → `status='rejected'`, seller gets the fixable reasons only
   - `approve` → `status='approved'`, `published_at=now()`
   - `flag` → `status='auto_flagged'`, with `review_priority` and `sla_due_at`
4. **Wire the real services** behind `ModerationServices`:
   - `findImageMatches` → pgvector Hamming query (see `docs/MODERATION.md`)
   - `getPriceStats` → percentile query over `price_observations`
   - `checkCeir` → CEIR/Sanchar Saathi lookup; cache results in Redis for 30 days
   - `visionAnalyse` → Sightengine
5. **Test it.** `npm test` covers the deterministic checks. Add fixtures: a
   stolen-IMEI listing, a stock-photo listing, a phone-number-in-description
   listing, a copied-photo listing. These four are your regression suite forever.

**Done when:** posting a listing with a photo you already used from another
account is rejected automatically, with a clear reason, in under 10 seconds.

---

## Phase 4 — Admin portal (week 4)

**Goal:** a moderator can clear the queue quickly and never wonder why a listing
is in front of them.

- `/admin/queue` — priority-sorted, SLA countdown, filters by category, risk band
  and check that fired. Keyboard-first: `A` approve, `R` reject, `J`/`K` navigate.
  A moderator should clear 60+ listings an hour.
- `/admin/listings/[id]` — photos side by side with **the matched image** when a
  duplicate fired, every check result with its score contribution, the seller's
  history, and a one-click reject with a reason code.
- `/admin/users`, `/admin/orgs` — approve corporate registrations, grant
  `canRunAuctions`, ban accounts.
- `/admin/rules` — read-only view of live thresholds, and a **shadow mode**
  toggle so a new rule logs what it *would* have done for a week before it
  actually blocks anything. Never ship a new blocker straight to production.
- `/admin/metrics` — auto-approve rate, false-positive rate (approved-after-appeal
  ÷ auto-rejected), median time-to-decision, checks by fire rate.
- Every admin action writes to `audit_log`. No exceptions.

**Done when:** a moderator with no context can action a flagged listing correctly
in under 20 seconds.

---

## Phase 5 — Corporate accounts and lot auctions (week 5–6)

**Goal:** an ITAD firm can list 500 laptops, and both a dealer and a student can buy.

1. **Corporate registration** at `/corporate/register`: company name, GSTIN, CIN,
   authorised signatory, document upload. Lands as `organizations.status='pending'`.
2. **Platform admin approves** and grants `canRunAuctions` / `canBulkUpload`.
   Verify the GSTIN against the public GST API before approving.
3. **Auction creation** (`/corporate/auctions/new`): title, category, window,
   anti-snipe seconds, pickup city, data-wipe certification flag.
4. **Lots.** Each lot has quantity, grade mix, a CSV manifest of serials, reserve
   and start price. `allowSinglePiece` is the switch that lets retail buyers take
   one unit at `singlePiecePricePaise` while bidders compete for the whole lot —
   this is what makes one auction serve both bulk and single-piece demand.
5. **Bidding.** Server-authoritative. Every bid in a transaction:
   `SELECT ... FOR UPDATE` on the lot, validate ≥ current + increment, insert bid,
   update lot. Proxy bidding runs the same path. Anti-sniping extends `ends_at` by
   `anti_snipe_seconds` when a bid lands inside that window.
6. **Close.** An Inngest scheduled function closes lots at `ends_at`, checks
   reserve, sets the winner, and notifies both sides.
7. **Bulk upload** — CSV → draft listings, each still passing the full moderation
   pipeline. Corporate does not mean unreviewed.

**Done when:** two accounts can bid against each other on a lot, anti-snipe fires,
and a third buys a single unit from the same lot.

---

## Phase 6 — Discovery, messaging, trust surface (week 7–8)

- **Search.** Start with Postgres full-text + trigram; it is genuinely fine to
  ~100k listings. Move to Typesense only when you can prove latency is a problem.
- **Listing page** with the check summary rendered as buyer-facing trust badges:
  "IMEI checked against CEIR", "Photos verified original", "Seller phone verified".
  The work the engine does is invisible unless you show it — showing it *is* the
  product.
- **Messaging** with the same contact-leak scrubber applied to every message.
  Store the scrubbed body; flag the raw for moderation.
- **Certificate pages** at `/c/[slug]` — public, shareable, indexable. This is the
  growth loop from the strategy memo. Make them beautiful and let people share
  them off-platform.

---

## Phase 7 — Payments and escrow (only after a registered entity exists)

- `lib/payments/provider.ts` already defines the interface. Implement Razorpay or
  Cashfree behind it.
- Escrow through a licensed partner (Castler, Escrowpay). **Never hold customer
  funds in your own account** — the RBI Payment Aggregator Directions, 2025 make
  that a licensing question.
- Order states are already modelled: `in_escrow → shipped → delivered →
  inspection_window → completed`, with a 48-hour buyer inspection window and
  auto-release.
- GST: as a pure marketplace you charge 18% GST **on your commission only**. Get
  this confirmed by your CA before you set pricing.

---

## Working agreements

- **Branch per change**, PR into `main`. Vercel builds a preview per PR; Neon
  gives it a database branch. Never push to `main` directly.
- **`npm run typecheck && npm test` must pass** before merge. Wire it as a GitHub
  Action in week 1 — it costs an hour and saves weeks.
- **No secrets in the repo.** `.env.local` is gitignored; production values live
  in Vercel's dashboard only.
- **Every moderation rule change ships in shadow mode first.** Measure for a
  week, then enforce.
- **The metric that matters** is not GMV. It is *false-positive rate on
  auto-reject*. Every wrongly rejected honest seller is a permanently lost user.
