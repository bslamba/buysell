# SEO

What is built, why, and what still needs doing before this ranks for anything.

## The shape of the strategy

Organic is the whole game here. OLX India runs 30M+ monthly users on 90%+
organic traffic and effectively no marketing spend, because paid acquisition
against a few hundred rupees of gross profit per transaction does not work.
So the site is built to earn its traffic:

1. **One intent page per category.** `/browse/<slug>` — 20 of them — each with
   its own title, meta description, keyword set, a real paragraph of copy, the
   subcategory terms people actually search, the category's rules, and the live
   listings. These are the pages that rank.
2. **Structured data everywhere**, so a result can render as more than a blue
   link: breadcrumbs, an FAQ accordion, a sitelinks searchbox.
3. **Faceted URLs kept out of the index.** `/browse?category=x&q=y` is
   `Disallow`ed in robots.txt so crawl budget goes to the clean pages instead of
   an infinite combination space.

## What exists

| Piece | Where |
|---|---|
| Metadata builder (title, description, canonical, OG, Twitter, robots) | `src/lib/seo.ts` → `buildMetadata()` |
| Per-category SEO copy — title, description, keywords, intro paragraph | `src/config/categories.ts` → `seo` on each entry |
| Category landing pages, statically generated | `src/app/browse/[category]/page.tsx` |
| `Organization` / `OnlineStore` + `WebSite` with `SearchAction` | emitted in `src/app/layout.tsx` |
| `BreadcrumbList` | every content page |
| `FAQPage` | home, `/sell`, `/sell/fees`, `/sell/business`, `/help` |
| `CollectionPage` + `ItemList` | category landing pages |
| `Product` + `Offer` builder | `productLd()` — wire into listing pages in Phase 2 |
| Sitemap (37 URLs) | `src/app/sitemap.ts` |
| robots.txt | `src/app/robots.ts` |
| noindex on private routes | admin, corporate, signin, verify-phone, 403 |

Verified against a production build: robots.txt and sitemap.xml serve correctly,
all 20 category pages return 200 with distinct titles and canonicals, and the
home page emits OnlineStore, WebSite, SearchAction, BreadcrumbList and FAQPage.

## A bug this caught

The middleware originally matched `/sell/:path*`, which meant the entire seller
hub — the marketing pages that should rank for "sell online india" — redirected
to sign-in. Google cannot index a 307. Only `/sell/new` and `/sell/manage` are
gated now.

**The general lesson:** any page you want ranked must return 200 to a signed-out
request. Check that before adding a middleware rule.

## Still to do

Roughly in order of value.

1. **OG images.** Currently no `opengraph-image`. Add a dynamic one per category
   and per listing using `next/og` — shared links look broken without them.
2. **Listing pages.** `/listing/[publicId]` with `productLd()` wired up. This is
   where the long tail actually lives: thousands of pages for "used iPhone 13
   128GB Bengaluru" beats twenty category pages.
3. **A second sitemap for listings**, querying only `approved` rows. Do not
   enumerate listings in the main sitemap — a sitemap full of URLs that 404 the
   moment something sells is worse than a small honest one.
4. **City pages.** `/browse/laptops/bengaluru`. "Used laptop bangalore" has real
   volume and almost no good answer. Only build these once each has real
   inventory — an empty city page is a thin-content penalty waiting to happen.
5. **A price-check tool.** "What is my iPhone 13 worth" is the highest-intent
   query in this market and it captures the seller at the moment of decision.
   This is how Cashify built its funnel.
6. **Google Search Console + Bing Webmaster**, sitemap submitted, Core Web
   Vitals watched.
7. **`hreflang`** if regional language versions ever ship.
8. **Editorial content** — buying guides that answer real questions ("how to
   check if a used iPhone is stolen in India"). This is the slowest lever and
   the most durable one.

## Rules of thumb for this codebase

- Every new public page gets `buildMetadata()`. No exceptions.
- Every private page gets `robots: { index: false }` **and** a robots.txt
  disallow. Belt and braces — one is a hint, the other is a directive.
- Keywords go in the category config, not scattered through JSX. Keyword
  stuffing in body copy reads badly to humans and no longer helps with Google.
- Descriptions are written to be clicked, not to hit a keyword count. The
  click-through rate is a ranking input; the keyword density is not.
