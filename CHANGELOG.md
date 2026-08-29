# WorthIt — engineering log

## 2026-08-29 — Repo initialised

- Next.js 15 + TypeScript + Tailwind v4 + Drizzle scaffold
- Full database schema: users, orgs, listings, image fingerprints, moderation events, auctions, lots, bids, orders, certificates, price observations, audit log
- Category registry with per-category rules (open catalogue, category-scoped strictness)
- Image fingerprinting: sha256 + DCT pHash + dHash, blur and stock-photo heuristics
- Moderation engine with 11 check groups, blocker/score/priority model, unit tests
- Docs: BUILD, MODERATION, ARCHITECTURE, NAMING

## 2026-08-29 — Phase 1 complete: authentication, roles, app shell

- Zod-validated environment with dev-friendly defaults and a strict production assertion
- Drizzle Postgres client tuned for serverless (max: 1, prepare: false)
- Rate limiter: Upstash when configured, bounded in-memory window for local dev
- SMS provider abstraction: MSG91, Twilio, and a console provider that prints the
  OTP to the dev log so local sign-in needs no vendor account
- Phone OTP: CSPRNG codes, stored only as sha256(phone:code:secret), 10-minute
  TTL, 5 attempts per challenge, 3 sends per number per hour, 10 per IP
- Auth.js v5 with JWT sessions, Google OAuth, and a phone-OTP credentials
  provider; role refreshed from the database every 5 minutes so bans take effect
- Role hierarchy extracted to a dependency-free module shared by middleware,
  server components and tests
- Middleware routing gate on /admin, /corporate, /sell, /account, with
  authorisation re-checked in every protected route
- App shell, home page, sign-in and phone-verification flows, admin overview and
  review queue, corporate account pages
- Migration 0000 generated (18 tables) with a post-processor that unquotes the
  bit(64) custom type and declares the pgvector extension
- Seed script for five test accounts and two organisations
- 22 unit tests passing; typecheck and production build clean

## 2026-08-29 — Named WorthIt; public site built

- Final name **WorthIt**; identity is a single stroke that reads as a W whose
  last stroke overshoots into a tick (`src/components/logo.tsx`, plus standalone
  mark and lockup SVGs in `public/`)
- Apple-glass design system on dark violet and black: layered translucency with
  an inner top highlight, fixed radial light pools so the glass has something to
  refract, and a fine noise layer to stop gradient banding. Single-theme by
  choice — see `docs/DESIGN.md`
- Inter self-hosted via `@fontsource-variable/inter` rather than
  `next/font/google`, which fetches at build time and leaks a request per page
  load. The first cloud build failed on exactly that, which is how it was caught
- 13 new public pages mirroring a full marketplace information architecture:
  home, browse, categories, sell, auctions, wish, about, team, socials, help,
  contact, shipping, terms, privacy
- Existing auth, admin and corporate pages migrated off the old light theme
- 25 routes build clean; 22 tests passing

## 2026-08-29 — Taxonomy, seller hub and the SEO layer

Categories
- Rebuilt the registry: 20 categories across 8 groups, merging a Circle-style
  consumer rail with a general marketplace's top-level shape, adapted for India.
- Each entry now carries an icon, a blurb, subcategory terms, and its own SEO
  title, description, keyword set and intro paragraph — so adding a category
  adds a ranking page with no other code change.
- Four things are deliberately excluded with the reasoning written down: gift
  cards, event tickets, real estate and services. Each is unverifiable before
  payment or a different business; listing what we cannot check would undo the
  point of the product.
- Prohibited-goods screening extended to live animals, human remains, gift-card
  codes and event tickets.

Navigation
- Icon category rail across the top, plus a real search bar wired to /browse?q=.

Seller hub
- /sell rebuilt with its own sticky sub-navigation, plus three new pages:
  how-it-works (six steps and the four reasons listings fail), fees (full
  breakdown and why the fee sits on the buyer), and business (bulk lots,
  auctions, ITAD).

SEO
- buildMetadata() helper: canonical, OpenGraph, Twitter, robots per page.
- JSON-LD: OnlineStore, WebSite with SearchAction, BreadcrumbList, FAQPage,
  CollectionPage + ItemList, and a Product builder ready for listing pages.
- 20 statically-generated category landing pages at /browse/<slug>.
- sitemap.xml (37 URLs) and robots.txt generated from the registry; faceted
  /browse?* URLs disallowed so crawl budget goes to the clean pages.
- noindex on every private route, in metadata and robots.txt both.
- **Bug caught by this work:** middleware matched /sell/:path*, so the entire
  seller hub redirected to sign-in — pages meant to rank for "sell online india"
  returned 307 to a crawler. Only /sell/new and /sell/manage are gated now.

Logo
- Reworked: the stroke carries its own top-lit gradient, a spark sits at the
  tick's apex, and the tile has an inner rim highlight so it reads as an object
  rather than a coloured square. The wordmark now sets "It" in a gradient pill —
  it reads as a stamp, which is what the company does.

Also
- Postgres connect_timeout 10s -> 5s. With max:1 every request queues behind the
  one in front, so a slow timeout turns a brief outage into a pile-up.

34 routes build clean, 22 tests passing, verified against a production server.

### Next
- Phase 2: listing creation, image upload to Vercel Blob, fingerprinting on ingest
- Wire ModerationServices to real queries (pgvector Hamming, price percentiles, CEIR)
- Run migrations against a real Neon database — not yet verified against live Postgres
