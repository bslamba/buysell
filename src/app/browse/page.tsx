import Link from "next/link";
import { and, desc, eq, ilike } from "drizzle-orm";
import { db } from "@/db";
import { listings } from "@/db/schema";
import { CATEGORIES, categoryBySlug } from "@/config/categories";
import { DEMO_LISTINGS, showDemoListings } from "@/config/demo-listings";
import { PageHeader, EmptyState, Button, Eyebrow } from "@/components/ui";
import { ListingCard, type ListingCardData } from "@/components/listing-card";
import { CategoryIcon } from "@/components/icons";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Browse Verified Used Items in India",
  description: "Every listing here passed eleven automated checks before it appeared — photo verification, stolen-device lookup and price sanity. Payment protected until you accept.",
  path: "/browse",
  keywords: ["buy used items india", "second hand products online", "verified used marketplace", "second hand bangalore"],
});

export const dynamic = "force-dynamic";

export default async function BrowsePage({
  searchParams,
}: { searchParams: Promise<{ category?: string; q?: string }> }) {
  const { category, q } = await searchParams;
  const active = category && categoryBySlug.has(category) ? category : undefined;
  const query = q?.trim().slice(0, 80) || undefined;

  let rows: ListingCardData[] = [];
  let dbError = false;
  try {
    const found = await db
      .select({
        id: listings.id, publicId: listings.publicId, title: listings.title,
        pricePaise: listings.pricePaise, city: listings.city,
        categorySlug: listings.categorySlug, condition: listings.condition,
      })
      .from(listings)
      .where(and(
        eq(listings.status, "approved"),
        ...(active ? [eq(listings.categorySlug, active)] : []),
        ...(query ? [ilike(listings.title, `%${query}%`)] : []),
      ))
      .orderBy(desc(listings.publishedAt))
      .limit(60);
    rows = found;
  } catch {
    dbError = true;
  }

  // Samples stand in only while there is nothing real to show.
  const usingSamples = rows.length === 0 && showDemoListings() && !query;
  if (usingSamples) {
    rows = DEMO_LISTINGS
      .filter((d) => !active || d.categorySlug === active)
      .map((d) => ({ ...d, isSample: true }));
  }

  return (
    <>
      <PageHeader
        eyebrow="Store"
        title={query ? `Results for “${query}”` : active ? categoryBySlug.get(active)!.label : "The store"}
        sub="Only listings that cleared verification appear here. Nothing is shown while it is still under review."
      />

      {/* Category rail — icons above labels, the way the Apple Store opens */}
      <div className="band-grey border-b border-hairline/70">
        <div className="container-a scrollbar-none flex gap-2 overflow-x-auto py-7">
          <Link href="/browse"
            className={`flex min-w-[84px] shrink-0 flex-col items-center gap-2 rounded-xl px-3 py-2 text-center transition-colors ${
              !active ? "text-brand" : "text-ink-2 hover:text-ink"
            }`}>
            <CategoryIcon name="grid" size={26} />
            <span className="t-caption font-medium">All</span>
          </Link>
          {CATEGORIES.filter((c) => c.slug !== "other").map((c) => (
            <Link key={c.slug} href={`/browse/${c.slug}`}
              className={`flex min-w-[84px] shrink-0 flex-col items-center gap-2 rounded-xl px-3 py-2 text-center transition-colors ${
                active === c.slug ? "text-brand" : "text-ink-2 hover:text-ink"
              }`}>
              <CategoryIcon name={c.icon} size={26} />
              <span className="t-caption font-medium leading-tight">{c.label}</span>
            </Link>
          ))}
        </div>
      </div>

      <div className="band py-12">
        <div className="container-a">
          {usingSamples && (
            <div className="mb-8 rounded-[14px] bg-surface px-5 py-4">
              <Eyebrow>Sample listings</Eyebrow>
              <p className="t-small mt-1.5 text-ink-2">
                Nothing real is listed yet, so these are placeholders showing how the store will
                look. They disappear the moment a genuine listing clears verification.
              </p>
            </div>
          )}

          {dbError && !usingSamples ? (
            <EmptyState
              title="Can't reach the catalogue right now"
              body="The database isn't connected yet. Add DATABASE_URL to .env.local and run the migrations."
            />
          ) : rows.length === 0 ? (
            <EmptyState
              title={query ? `Nothing matches “${query}”` : "No live listings yet"}
              body="WorthIt is in early access in Bengaluru. Be the first — list something and it appears here as soon as it clears the automated checks."
              action={<Button href="/sell">Sell something</Button>}
            />
          ) : (
            <>
              <h2 className="t-title">
                {query ? "Results" : "The latest."}{" "}
                <span className="font-normal text-ink-2">
                  {query ? `${rows.length} found` : "Just listed this week."}
                </span>
              </h2>
              <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {rows.map((l) => <ListingCard key={l.id} item={l} />)}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
