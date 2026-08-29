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

## 2026-08-29 — Particle W matched to the logo; hero proportions rebalanced

- The banner's letter W now uses the logo mark's own path vertices rather than a
  symmetric W. The mark is deliberately asymmetric — its final stroke overshoots
  upward so the W also reads as a tick — and a symmetric version threw that away.
  Vertices are the mark's five points translated to the path centre (32.5, 29.5)
  and divided by its 40pt width, so the proportions are identical.
- Letter particles now draw at a constant radius. The mark has a single uniform
  stroke width, so a letter assembled from varying dot sizes rendered a subtly
  different letterform.
- Point count up to 64 so the stroke reads continuous rather than dotted.
- Hero mark 112px -> 168px; hero wordmark down from 44-96px to 30-54px, so the
  mark leads and the name supports it rather than competing.

Verified: the banner's vertices are byte-identical to the logo path under the
documented transform, and the asymmetry is preserved.

## 2026-08-29 — Page-wide particle field, lighter bands

- The particle canvas is now `fixed` to the viewport rather than absolute inside
  the hero, so the whole page reacts to the cursor — including the feature band
  and the shelves. It sits at z-1: above the opaque section grounds, below the
  z-50 nav.
- Letter W halved, 210px -> 105px.
- Dot field roughly quadrupled, 340 -> 1500, with idle radius down from 0.7-2.6
  to 0.5-1.6 and letter radius from a flat 3.1 to a jittered ~1.0-2.3.
- The W is now suggested rather than traced. Sampling along the polyline is
  unevenly spaced, and every dot carries a fixed offset from the stroke drawn
  from a sum-of-two-uniforms distribution, so most hug the letter and a few
  stray. Per-dot pull rates vary too, so the letter assembles raggedly instead
  of snapping into place.
- The dark purple band is now a lavender wash (`#1C1030` -> `#EFE9FB`) with ink
  text; `.on-deep` deepens buttons to brand-700 instead of inverting to white.
- The ~1400 idle dots are batched into one path per frame, so a frame is two
  fill calls rather than 1500.

Verified: 60fps at 1440x900, no console errors, no horizontal overflow, and
links under the canvas still receive clicks (it is `pointer-events-none`).

## 2026-08-29 — Complete W, finer and denser field

- **Fixed: the W rendered cropped.** Recruitment filtered candidates by a
  radius, so wherever the field ran thin — near a screen edge especially — the
  tail of the polyline never got a dot and the letter came out half-drawn. It
  now takes the nearest W_POINTS unconditionally, so every target index is
  filled and the letter is always complete. The radius survives only as a
  bound on how much of the field gets sorted.
- W down again, 105px -> 76px.
- Letter dots up 130 -> 190 and down in size, 1.55 base -> 1.0 (jittered
  ~0.6-1.9). Scatter widened 0.055 -> 0.07, and the along-stroke sampling is
  looser, so the letter is grainier and less traced.
- Idle dots down from 0.5-1.6 to 0.32-1.04, with density now derived from
  viewport area (one dot per 520px², ~2500 at 1440x900, up from 1500 fixed) so
  a large display is not sparser than a laptop.
- The cursor now carries a visible field: idle dots within 300px brighten from
  0.16 to 0.42 alpha, and the letter splits into a solid core and a fainter
  spray of the dots whose offset strays furthest from the stroke.
- Performance: at the new density the naive draw fell to 36fps. The idle field
  is now drawn as rects rather than arcs (indistinguishable at a sub-pixel
  radius, and `arc` tessellates where `rect` does not), recruitment sorts a
  local shortlist instead of the whole field into reused typed arrays, and it
  runs once per frame rather than once per pointer event.

Verified: 54fps in software rendering at 1440x900 both idle and while the
pointer sweeps (so comfortably 60 on a GPU), no page errors, and the W renders
complete at the bottom-left corner and the right edge — the cases that used to
crop it.

## 2026-08-29 — The field moves behind the content

- The particle canvas moved from z-1 to **z-index -10**, so nothing it draws is
  ever in front of text, the logo, a button or a tile. Glyphs and cards occlude
  the dots now, not the other way round. A negative z-index is required rather
  than z-0: a positioned element at z-0 still paints above non-positioned
  in-flow content.
- That only works if the section grounds stop being opaque, so `.band-grey` and
  `.band-deep` now paint veils — colours chosen to composite at 50% over the
  white body to exactly the solids they replace. Verified by pixel sample under
  `prefers-reduced-motion` (field never draws): band-grey paints #F4F1F7 and
  band-deep #EFE9FB, unchanged.
- The canvas now starts **below the nav** instead of at the top of the viewport.
  The bar is translucent, so a canvas running under it showed the letter faintly
  through it beside the logo — behind it in the stacking sense, but still
  visible next to the logo. The inset is measured from the header rather than
  hard-coded.
- The letter's centre is **clamped to the canvas**, so the W stays whole at
  every edge: it follows the cursor everywhere except the last few dozen pixels
  at a boundary, where it holds position rather than sliding off half-drawn.

Verified: 53fps in software rendering, no page errors, both band colours
byte-identical to before, the nav strip clean with the cursor jammed against it,
and a complete W at the top-left and bottom-right corners.

## 2026-08-29 — The letter stays off content entirely

Being behind the text was not enough: a W sitting under a paragraph still reads
as a W scribbled across it. The field now measures where content actually is
and refuses to form the letter there.

- Content is measured per text LINE, not per block. Range.getClientRects() on
  each text node yields one rect per rendered line, so the letter can use a
  paragraph's ragged right edge and the gaps between lines instead of being
  locked out of the whole column. Links, buttons, inputs, images and SVGs go in
  whole. 493 rects on the home page.
- Rects are held in document coordinates, so scrolling costs nothing. They are
  remeasured on resize and on any change to the body's size, which covers
  webfont swap-in, images loading and the FAQ accordion opening.
- Fixed a leak found while verifying: dots still travelling toward the letter
  were drawn at full letter strength, so a dot in flight could streak across
  text even when the letter's resting place was clear. A dot now counts as part
  of the letter only within SNAP (12px) of its target; further out it is drawn
  as an ordinary field dot. SNAP is folded into the clearance box, so every
  pixel drawn at letter strength is provably inside the box that was tested.
- Removed the "Move your cursor anywhere on the page." hint from the hero.

Verified by pixel test rather than by eye: across 384 cursor positions at four
scroll depths, the canvas's own pixels were read back and every dot drawn at
letter strength was tested against all 493 content rects. Before the in-flight
fix, 2 positions leaked (worst 5px); after it, 0. The letter still forms at 153
of the 384 positions, so the effect is suppressed near content, not disabled.
53fps, no page errors.

## 2026-08-29 — Sign-in reported the wrong problem

Phone sign-in showed "Network error. Check your connection and try again." The
connection was fine. `requestOtp` threw because Postgres was not reachable, the
route had no try/catch, so Next returned an empty 500 — and an empty body makes
`res.json()` throw, which landed in the client's catch block alongside genuine
transport failures. Every server-side fault was being reported as the user's
wifi.

- Both OTP routes now catch, log server-side, and always answer with JSON. A
  route that can throw must never return an empty body to a client that parses
  one.
- `src/db/errors.ts` maps driver failures to one actionable line: ECONNREFUSED
  to "Postgres is not running at the host in DATABASE_URL", 42P01 to "run
  npm run db:migrate", 28P01 to bad credentials, 3F000 to the missing `vector`
  extension. Shown in development only — in production these would tell an
  attacker which part of the stack is misconfigured. Cause chains are followed
  to a bounded depth so a cycle cannot hang a request.
- The client now separates "the request never completed" (offline, DNS) from
  "the server answered with something unparseable" (a server fault, reported
  with its status). Only the first is called a network error.
- 7 tests on the mapping, including the cycle guard.

Verified against a dev server with a dead DATABASE_URL: the sign-in page now
says "The database refused the connection. Postgres is not running at the host
in DATABASE_URL, or the port is wrong."

Also, in .env.local (untracked): OTP_PROVIDER was "msg91" with no MSG91_AUTH_KEY,
so sending would have failed even with a working database. Set to "console",
which returns the code to the screen in development and needs no SMS vendor.

## 2026-08-29 — `db:migrate` could never have worked

`npm run db:migrate` failed with `Please provide required params for Postgres
driver: [x] url: undefined`. `drizzle.config.ts` read `process.env.DATABASE_URL`,
but nothing put it there: `next` loads `.env.local` automatically and
`drizzle-kit` — an ordinary Node process — does not.

- `scripts/load-env.mjs` loads `.env.local` then `.env`, imported first by
  `drizzle.config.ts` and `scripts/seed.ts`. Dependency-free on purpose: adding
  dotenv would mean an npm install, and installs on this project happen only on
  the machine that owns node_modules. Precedence matches Next's — `.env.local`
  beats `.env`, and a real environment variable beats both, so CI and Vercel are
  untouched. Quoted values end at the closing quote (so a trailing `# comment`
  is dropped) while unquoted ones keep everything, because `#` is legal in a
  Postgres password.
- `drizzle.config.ts` now fails with the line to add to `.env.local` instead of
  passing `undefined` down to the driver.

Found while verifying, and worth its own note: **the schema requires pgvector
0.7.0+**. The image-fingerprint index is HNSW over `bit(64)` using
`bit_hamming_ops`, which arrived in 0.7.0. On 0.6.0 — still what Ubuntu ships —
the migration dies with `operator class "bit_hamming_ops" does not exist for
access method "hnsw"` and leaves the schema half-applied.

- `npm run db:check` (also run automatically before `db:migrate`) reports the
  server and pgvector versions, and refuses with one actionable sentence on an
  unreachable host, bad credentials, a missing database, a missing `vector`
  extension, or a pgvector below the floor.
- The version comparison is numeric, not textual, so 0.10 counts as newer than
  0.9. Four tests, including that case.

Verified end to end against a real PostgreSQL 16 with pgvector 0.8.0 built from
source: migrations apply to a clean database (20 tables, `fp_phash_idx` HNSW
index present), the seed runs, and a full browser sign-in completes — code shown
on screen, dry-run verify, Auth.js sign-in, redirect, httpOnly
`authjs.session-token` set, no page errors. Also confirmed the 0.6.0 failure
first-hand, which is why the check exists.

### Next
- Phase 2: listing creation, image upload to Vercel Blob, fingerprinting on ingest
- Wire ModerationServices to real queries (pgvector Hamming, price percentiles, CEIR)
- Run migrations against a real Neon database — not yet verified against live Postgres
