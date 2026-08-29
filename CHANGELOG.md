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

## 2026-08-29 — Apple-style light theme: deep purple on white

- Replaced the dark-glass system with a light one built on Apple's typographic
  metrics. What transferred is structure and numbers, not imagery or copy.
- Type scale reproduces Apple's size/tracking relationship exactly: 17px body at
  1.47059 line height and -0.022em, hero at -0.015em, sub-headings tracking
  *positive* at +0.011em. Headlines at 600, never 700. That sign change is why
  Apple's large type reads tight and their intros read airy.
- SF Pro cannot be licensed off Apple platforms, so Inter stays — the metrics do
  the work, not the face.
- Global bar is now 44px, translucent with a heavy backdrop blur, links at 12px
  spread across a 1024px rail that is deliberately narrower than the content.
- New `.shelf`: the Apple Store horizontal grid with x-mandatory scroll snap,
  container-matched gutters, and paging arrows that disable rather than
  disappear at the ends.
- Home page rebuilt as stacked full-bleed bands: logo + one plain description,
  a deep-purple proposition band, two category shelves running left to right,
  a two-up checks grid, the business band, the full category directory and FAQ.
- Browse rebuilt as a store-style product grid with a category pill rail.
- Seller sub-nav restyled as Apple's product sub-bar, sticking below the global
  one at top-11.
- Footer rebuilt in Apple's idiom: 12px throughout, five plain link columns,
  hairline, legal line, region.
- All 32 pages migrated off the dark tokens; verified against a running server
  that no page renders a stale class.

34 routes build clean, 22 tests passing, Apple's exact metrics confirmed present
in the compiled CSS.

## 2026-08-29 — Fix hydration mismatch in the logo mark

- LogoMark derived its SVG gradient ids from a module-level counter, so the
  server and the client incremented in different orders: `url(#wi-tile-1)` on
  the server became `url(#wi-tile-2)` on the client and React bailed out of
  patching the tree.
- Ids are now fixed strings, making the component a pure function of its props —
  which is what hydration requires. `useId()` was the alternative but it is a
  hook, and would have forced a Client Component boundary around a logo that
  renders as a Server Component in the layout, footer and sign-in page.
- Repeated ids across instances are harmless here: every instance is identical,
  so `url(#…)` resolving to the first match paints the same gradient. `idPrefix`
  is there for the case where a genuinely distinct instance is needed.
- Verified against a running server: ids are fixed, byte-identical across
  repeated requests, and every url() reference resolves.

## 2026-08-29 — Nav proportions, store imagery, sample listings

- Global bar rebuilt to Apple's actual trick: a NARROW 980px container using
  space-between, not justify-center. That is what makes the cluster read as
  centred while the first and last items still anchor to the container edges.
  The previous left/centre/right grouping across a wider rail is why the logo
  looked stranded.
- Bar down to 40px with a 16px mark and 12px labels — slimmer than Apple's 44px
  because the mark is smaller relative to the bar.
- Sell is now the only filled control in the bar: a purple pill. It is the one
  action we want people to take, so it gets the only piece of colour.
- New ListingImage: a generated 4:3 tile with a two-stop gradient and the
  category glyph, picked by hashing the listing id so it is identical on server
  and client. A random palette here would have reintroduced exactly the
  hydration mismatch just fixed in the logo.
- New ListingCard matching the Apple Store grid: image, condition chip, title,
  price, and the saving as an absolute rupee figure rather than a percentage —
  in resale "how much less than new" is the number people respond to.
- 14 sample listings so the store renders as a storefront before any seller
  arrives. They appear ONLY when the database returns zero rows, every one
  carries a visible "Sample" badge, and NEXT_PUBLIC_HIDE_DEMO_LISTINGS=true
  removes them for production.
- Browse rebuilt with an icon category rail and the store grid; home gains a
  "The latest." shelf running left to right.

Verified against a running server: 40px/980px bar, filled Sell pill, 14 sample
tiles with images and prices, gradients byte-identical across requests.

## 2026-08-29 — Animated wordmark, 200 sample listings, listing detail pages

Identity
- The wordmark now enters letter by letter: each character arrives larger and
  out of focus and settles into place, with the It pill landing last and
  settling with a brief lift. The blur is what separates it from a plain scale —
  type coming into focus reads as considered rather than bouncy.
- CSS-only, no state and no client boundary. The stagger is an inline
  animation-delay computed from the character index, a pure function of the
  input, so server and client markup are identical. prefers-reduced-motion
  neutralises it without leaving the name invisible.
- Same treatment, smaller, on the nav logo.

Nav
- Down to 36px with 11px labels, centred cluster preserved.

Catalogue
- 200 sample listings, exactly 10 per category across all 20. Seven categories
  are hand-written with real specs; the rest generate from their own
  subcategory terms.
- Two assertions guard the data: a category that yields fewer than ten throws at
  import, and so does any duplicate title. Both caught real bugs — the first
  pass produced 184 listings, and the wrap-around produced 8 duplicate names.

Listing pages
- /listing/[publicId] for all 200, statically generated: sticky buy bar, hero
  with gallery, price breakdown including the protection fee, condition report,
  specification table, what's included, seller panel and related items.
- The condition report sits directly under the hero rather than further down,
  because it is the thing a used-goods buyer is actually anxious about.
- Product + Offer + Brand JSON-LD on every one.

242 pages build clean, 22 tests passing, verified against a running server.

## 2026-08-29 — Interactive banner, sphere zoom, stacked hero logo

- Nav down to 32px on a 940px rail with 10px labels and near-zero gaps.
- Nav wordmark now uses the heavy entrance: letters scale in from 4x with a lit
  radial bloom expanding behind each one as it lands, then fading.
- Home hero logo moved above the name, and the spark on the W now twinkles
  continuously — slow and low-contrast on purpose, because a fast blink reads as
  a notification badge rather than a gleam.
- New HeroBanner: a canvas field of ~320 drifting dots across the hero. Dots
  near the pointer peel away and assemble into a letter W around it, then drift
  home when it moves on. The W is sampled from a five-point polyline rather than
  a font, so it stays crisp at any size and needs no text measurement.
  - Canvas rather than DOM: 320 animated elements would thrash layout; one
    canvas is a single composite per frame.
  - Dots are seeded from a deterministic PRNG, not Math.random — partly
    aesthetic, partly the hydration rule that has already bitten twice.
  - The pointer listener sits on window, so the field reacts to the whole
    screen rather than only to the canvas.
  - rAF stops when the banner scrolls out of view and never starts under
    prefers-reduced-motion.

242 pages build clean, 22 tests passing, verified against a running server.

### Next
- Phase 2: listing creation, image upload to Vercel Blob, fingerprinting on ingest
- Wire ModerationServices to real queries (pgvector Hamming, price percentiles, CEIR)
- Run migrations against a real Neon database — not yet verified against live Postgres
