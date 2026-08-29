import Link from "next/link";
import { notFound } from "next/navigation";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { listings } from "@/db/schema";
import { CATEGORIES, categoryBySlug } from "@/config/categories";
import { Badge, EmptyState, Button, Eyebrow, Card } from "@/components/ui";
import { ListingCard, type ListingCardData } from "@/components/listing-card";
import { samplesForCategory, showSamples } from "@/config/catalogue";
import { CategoryIcon } from "@/components/icons";
import { JsonLd } from "@/components/json-ld";
import { categoryMetadata, breadcrumbLd, categoryCollectionLd } from "@/lib/seo";

export const dynamic = "force-dynamic";

/**
 * One indexable landing page per category.
 *
 * This is the page that ranks. It carries the category's own title, meta
 * description, keyword set, a paragraph of real copy, the subcategory terms
 * people actually search for, and the live listings themselves — plus
 * CollectionPage and BreadcrumbList structured data. `/browse?category=x` is
 * disallowed in robots.txt precisely so this URL is the one Google indexes.
 */

export function generateStaticParams() {
  return CATEGORIES.map((c) => ({ category: c.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ category: string }> }) {
  const { category } = await params;
  const c = categoryBySlug.get(category);
  if (!c) return {};
  return categoryMetadata(c);
}

export default async function CategoryLandingPage({
  params,
}: { params: Promise<{ category: string }> }) {
  const { category } = await params;
  const c = categoryBySlug.get(category);
  if (!c) notFound();

  let rows: ListingCardData[] = [];
  let dbError = false;
  try {
    rows = await db
      .select({
        id: listings.id, publicId: listings.publicId, title: listings.title,
        pricePaise: listings.pricePaise, city: listings.city,
        condition: listings.condition, categorySlug: listings.categorySlug,
      })
      .from(listings)
      .where(and(eq(listings.status, "approved"), eq(listings.categorySlug, c.slug)))
      .orderBy(desc(listings.publishedAt))
      .limit(48);
  } catch {
    dbError = true;
  }

  // Samples stand in only while there is nothing real in this category.
  const usingSamples = rows.length === 0 && showSamples();
  if (usingSamples) {
    rows = samplesForCategory(c.slug).map((d) => ({ ...d, isSample: true }));
  }

  const related = CATEGORIES.filter((x) => x.group === c.group && x.slug !== c.slug).slice(0, 5);

  return (
    <>
      <JsonLd data={[
        breadcrumbLd([
          { name: "Home", path: "/" },
          { name: "Browse", path: "/browse" },
          { name: c.label, path: `/browse/${c.slug}` },
        ]),
        categoryCollectionLd(c, rows.map((r) => ({ title: r.title, path: `/listing/${r.publicId}`, pricePaise: r.pricePaise }))),
      ]} />

      <header className="border-b border-hairline py-16">
        <div className="container-a">
          <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-2 text-xs text-ink-3">
            <Link href="/" className="hover:text-ink-2">Home</Link>
            <span>/</span>
            <Link href="/browse" className="hover:text-ink-2">Browse</Link>
            <span>/</span>
            <span className="text-ink-2">{c.label}</span>
          </nav>

          <div className="flex items-start gap-4">
            <span className="tile mt-1 shrink-0 rounded-2xl p-3 text-brand">
              <CategoryIcon name={c.icon} size={26} />
            </span>
            <div>
              <h1 className="text-balance text-4xl font-semibold tracking-[-0.035em] sm:text-5xl">
                {c.label}
              </h1>
              <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-ink-2">{c.seo.intro}</p>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-2">
            <Badge tone={c.tier === "certified" ? "ok" : c.tier === "assisted" ? "brand" : "plain"}>
              {c.tier === "certified" ? "Fully certified" : c.tier === "assisted" ? "Assisted checks" : "Standard checks"}
            </Badge>
            {c.requiresImei && <Badge tone="ok">IMEI checked against CEIR</Badge>}
            {c.requiresSerial && <Badge tone="plain">Serial number required</Badge>}
            <Badge tone="plain">{c.minImages}+ photos required</Badge>
          </div>
        </div>
      </header>

      <div className="container-a py-12">
        {/* Subcategory terms — the long-tail queries, as real internal links */}
        <section aria-label="Popular in this category">
          <Eyebrow>Popular in {c.label}</Eyebrow>
          <div className="mt-4 flex flex-wrap gap-2">
            {c.subcategories.map((s) => (
              <Link key={s} href={`/browse?category=${c.slug}&q=${encodeURIComponent(s)}`}
                className="tile rounded-full px-4 py-2 text-sm text-ink-2">
                {s}
              </Link>
            ))}
          </div>
        </section>

        <section className="mt-12">
          {usingSamples && rows.length > 0 && (
            <div className="mb-8 rounded-[14px] bg-surface px-5 py-4">
              <Eyebrow>Sample listings</Eyebrow>
              <p className="t-small mt-1.5 text-ink-2">
                Nothing real is listed in {c.label} yet — these show how the category will look.
              </p>
            </div>
          )}

          {dbError && !usingSamples ? (
            <EmptyState title="Can't reach the catalogue right now"
              body="The database isn't connected yet. Add DATABASE_URL to .env.local and run the migrations." />
          ) : rows.length === 0 ? (
            <EmptyState
              title={`Nothing live in ${c.label} yet`}
              body="WorthIt is in early access in Bengaluru. List something here and it appears the moment it clears the automated checks."
              action={<Button href={`/sell/new?category=${c.slug}`}>Sell in {c.label}</Button>}
            />
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {rows.map((l) => <ListingCard key={l.id} item={l} />)}
            </div>
          )}
        </section>

        {/* Category rules — genuinely useful, and indexable depth */}
        <section className="mt-16 grid gap-4 md:grid-cols-2">
          <Card>
            <Eyebrow>What we ask sellers for</Eyebrow>
            <p className="mt-3 text-sm leading-relaxed text-ink-2">
              {c.requiredAttributes.map((a) => a.replace(/_/g, " ")).join(", ")}.
              Between {c.minImages} and {c.maxImages} photographs of the actual item.
            </p>
          </Card>
          {c.notes && c.notes.length > 0 && (
            <Card>
              <Eyebrow>Rules for this category</Eyebrow>
              <ul className="mt-3 space-y-2">
                {c.notes.map((n) => (
                  <li key={n} className="flex gap-2.5 text-sm leading-relaxed text-ink-2">
                    <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
                    {n}
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </section>

        {related.length > 0 && (
          <section className="mt-16">
            <Eyebrow>Related categories</Eyebrow>
            <div className="mt-4 flex flex-wrap gap-2">
              {related.map((r) => (
                <Link key={r.slug} href={`/browse/${r.slug}`}
                  className="tile flex items-center gap-2.5 rounded-full px-4 py-2.5 text-sm font-medium">
                  <span className="text-brand"><CategoryIcon name={r.icon} size={17} /></span>
                  {r.label}
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  );
}
