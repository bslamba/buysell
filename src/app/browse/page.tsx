import Link from "next/link";
import { and, desc, eq, ilike } from "drizzle-orm";
import { db } from "@/db";
import { listings } from "@/db/schema";
import { CATEGORIES, categoryBySlug } from "@/config/categories";
import { PageHeader, Card, Badge, EmptyState, Button } from "@/components/ui";
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

  let rows: { id: string; publicId: string; title: string; pricePaise: number; city: string; categorySlug: string; condition: string }[] = [];
  let dbError = false;
  try {
    rows = await db
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
  } catch {
    dbError = true;
  }

  return (
    <>
      <PageHeader
        eyebrow="Store"
        title={query ? `Results for \u201c${query}\u201d` : active ? categoryBySlug.get(active)!.label : "The store"}
        sub="Only listings that cleared verification appear here. Nothing is shown while it is still under review."
      />

      <div className="band-grey">
        <div className="container-a scrollbar-none flex gap-1 overflow-x-auto py-3">
          <Link href="/browse"
            className={`whitespace-nowrap rounded-full px-4 py-2 t-small transition-colors ${
              !active ? "bg-brand text-white" : "text-ink-2 hover:text-ink"
            }`}>
            All
          </Link>
          {CATEGORIES.filter((c) => c.slug !== "other").map((c) => (
            <Link key={c.slug} href={`/browse/${c.slug}`}
              className={`whitespace-nowrap rounded-full px-4 py-2 t-small transition-colors ${
                active === c.slug ? "bg-brand text-white" : "text-ink-2 hover:text-ink"
              }`}>
              {c.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="band py-14">
        <div className="container-a">
          {dbError ? (
            <EmptyState
              title="Can't reach the catalogue right now"
              body="The database isn't connected yet. Add DATABASE_URL to .env.local and run the migrations, then listings will appear here."
            />
          ) : rows.length === 0 ? (
            <EmptyState
              title={active ? `Nothing live in ${categoryBySlug.get(active)!.label} yet` : "No live listings yet"}
              body="WorthIt is in early access in Bengaluru. Be the first — list something and it will appear here as soon as it clears the automated checks."
              action={<Button href="/sell">Sell something</Button>}
            />
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {rows.map((l) => (
                <Link key={l.id} href={`/listing/${l.publicId}`} className="tile flex flex-col p-7">
                  <Badge tone="ok">Verified</Badge>
                  <h2 className="mt-4 text-[19px] font-semibold leading-snug tracking-[-0.015em]">{l.title}</h2>
                  <p className="t-caption mt-2 capitalize text-ink-3">
                    {categoryBySlug.get(l.categorySlug)?.label ?? l.categorySlug} · {l.condition.replace(/_/g, " ")} · {l.city}
                  </p>
                  <p className="mt-auto pt-8 text-[24px] font-semibold tracking-[-0.02em] tabular">
                    \u20b9{(l.pricePaise / 100).toLocaleString("en-IN")}
                  </p>
                  <span className="a-link mt-3 !text-[14px]">View</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
