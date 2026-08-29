import Link from "next/link";
import { desc, inArray } from "drizzle-orm";
import { db } from "@/db";
import { auctions, organizations } from "@/db/schema";
import { eq } from "drizzle-orm";
import { PageHeader, Card, Badge, EmptyState, Button, Eyebrow } from "@/components/ui";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Corporate Bulk Lot Auctions in India",
  description: "Bid on bulk lots from companies retiring IT hardware — serial manifests, published grade mix and certified data wipe. Single-piece purchase where allowed.",
  path: "/auctions",
  keywords: ["bulk laptop auction india", "IT asset auction india", "liquidation auction india", "buy used laptops in bulk", "corporate hardware auction bangalore"],
});
export const dynamic = "force-dynamic";

export default async function AuctionsPage() {
  let rows: {
    id: string; publicId: string; title: string; categorySlug: string;
    status: string; startsAt: Date; endsAt: Date; pickupCity: string | null;
    dataWipeCertified: boolean; orgName: string;
  }[] = [];
  let dbError = false;

  try {
    rows = await db
      .select({
        id: auctions.id, publicId: auctions.publicId, title: auctions.title,
        categorySlug: auctions.categorySlug, status: auctions.status,
        startsAt: auctions.startsAt, endsAt: auctions.endsAt,
        pickupCity: auctions.pickupCity, dataWipeCertified: auctions.dataWipeCertified,
        orgName: organizations.name,
      })
      .from(auctions)
      .innerJoin(organizations, eq(organizations.id, auctions.orgId))
      .where(inArray(auctions.status, ["scheduled", "live"]))
      .orderBy(desc(auctions.endsAt))
      .limit(40);
  } catch {
    dbError = true;
  }

  return (
    <>
      <PageHeader
        eyebrow="Corporate auctions"
        title="Bulk lots from companies retiring their hardware"
        sub="When a company refreshes 500 laptops, those machines usually go to a scrap broker for a fraction of what they're worth. Here they're auctioned with a serial manifest, a published grade mix, and a data-wipe certificate."
      />

      <div className="mx-auto max-w-6xl px-6 py-12">
        {dbError ? (
          <EmptyState
            title="Can't reach the auction list right now"
            body="The database isn't connected yet. Add DATABASE_URL to .env.local and run the migrations."
          />
        ) : rows.length === 0 ? (
          <EmptyState
            title="No auctions running yet"
            body="We're onboarding the first ITAD partners and corporate IT teams in Bengaluru. If your company has hardware to retire, we'd like to talk."
            action={<Button href="/corporate/register">Register your company</Button>}
          />
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {rows.map((a) => (
              <Link key={a.id} href={`/auctions/${a.publicId}`}>
                <Card hover className="flex h-full flex-col">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-semibold leading-snug tracking-[-0.02em]">{a.title}</h3>
                      <p className="mt-1.5 text-xs text-text-faint">{a.orgName}</p>
                    </div>
                    <Badge tone={a.status === "live" ? "ok" : "violet"}>{a.status}</Badge>
                  </div>
                  <div className="mt-6 flex flex-wrap gap-2 text-xs">
                    {a.pickupCity && <span className="glass rounded-full px-3 py-1">{a.pickupCity}</span>}
                    {a.dataWipeCertified && <span className="glass rounded-full px-3 py-1">Data wipe certified</span>}
                    <span className="glass rounded-full px-3 py-1 capitalize">{a.categorySlug}</span>
                  </div>
                  <p className="mt-auto pt-6 text-sm text-text-muted">
                    Closes {new Date(a.endsAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                  </p>
                </Card>
              </Link>
            ))}
          </div>
        )}

        <section className="mt-16 grid gap-4 md:grid-cols-3">
          {[
            { t: "Bid on the whole lot", b: "Dealers and refurbishers bid with proxy bidding and anti-sniping — a late bid extends the close rather than stealing it." },
            { t: "Or buy a single piece", b: "Where the seller allows it, retail buyers can take one unit from a bulk lot at a fixed price while the auction runs." },
            { t: "Know what you're getting", b: "Every lot publishes a serial manifest and a grade mix, so you're bidding on facts rather than a photo of a pallet." },
          ].map((x) => (
            <Card key={x.t}>
              <Eyebrow>How it works</Eyebrow>
              <h3 className="mt-3 text-base font-semibold tracking-[-0.01em]">{x.t}</h3>
              <p className="mt-2.5 text-sm leading-relaxed text-text-muted">{x.b}</p>
            </Card>
          ))}
        </section>
      </div>
    </>
  );
}
