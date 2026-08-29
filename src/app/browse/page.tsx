import Link from "next/link";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { listings } from "@/db/schema";
import { CATEGORIES, categoryBySlug } from "@/config/categories";
import { PageHeader, Card, Badge, EmptyState, Button } from "@/components/ui";

export const metadata = { title: "Browse" };
export const dynamic = "force-dynamic";

export default async function BrowsePage({
  searchParams,
}: { searchParams: Promise<{ category?: string }> }) {
  const { category } = await searchParams;
  const active = category && categoryBySlug.has(category) ? category : undefined;

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
      .where(active
        ? and(eq(listings.status, "approved"), eq(listings.categorySlug, active))
        : eq(listings.status, "approved"))
      .orderBy(desc(listings.publishedAt))
      .limit(60);
  } catch {
    dbError = true;
  }

  return (
    <>
      <PageHeader
        eyebrow="Browse"
        title={active ? categoryBySlug.get(active)!.label : "Everything that passed the checks"}
        sub="Only listings that cleared verification appear here. Nothing is shown while it is still under review."
      />

      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="flex flex-wrap gap-2">
          <Link href="/browse"
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              !active ? "bg-white/[0.10] text-text" : "glass glass-hover text-text-muted"
            }`}>
            All
          </Link>
          {CATEGORIES.filter((c) => c.slug !== "other").map((c) => (
            <Link key={c.slug} href={`/browse?category=${c.slug}`}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                active === c.slug ? "bg-white/[0.10] text-text" : "glass glass-hover text-text-muted"
              }`}>
              {c.label}
            </Link>
          ))}
        </div>

        <div className="mt-10">
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
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {rows.map((l) => (
                <Link key={l.id} href={`/listing/${l.publicId}`}>
                  <Card hover className="flex h-full flex-col">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="text-base font-semibold leading-snug tracking-[-0.01em]">{l.title}</h3>
                      <Badge tone="ok">Verified</Badge>
                    </div>
                    <p className="mt-2 text-xs capitalize text-text-faint">
                      {categoryBySlug.get(l.categorySlug)?.label ?? l.categorySlug} · {l.condition.replace(/_/g, " ")} · {l.city}
                    </p>
                    <p className="mt-auto pt-6 text-2xl font-semibold tracking-[-0.03em] tabular">
                      ₹{(l.pricePaise / 100).toLocaleString("en-IN")}
                    </p>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
