import { desc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { listings, users } from "@/db/schema";
import { Badge, EmptyState, Eyebrow } from "@/components/ui";
import { slaHours } from "@/lib/moderation/engine";

export const metadata = { title: "Review queue", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

function riskTone(score: number) {
  if (score >= 70) return "bad" as const;
  if (score >= 40) return "warn" as const;
  return "ok" as const;
}

export default async function QueuePage() {
  let rows;
  try {
    rows = await db
      .select({
        id: listings.id, publicId: listings.publicId, title: listings.title,
        category: listings.categorySlug, pricePaise: listings.pricePaise,
        status: listings.status, risk: listings.riskScore,
        priority: listings.reviewPriority, submittedAt: listings.submittedAt,
        sellerName: users.name, sellerPhone: users.phone, sellerTrust: users.trustScore,
      })
      .from(listings)
      .innerJoin(users, eq(users.id, listings.sellerId))
      .where(inArray(listings.status, ["pending_review", "auto_flagged"]))
      .orderBy(desc(listings.reviewPriority), listings.submittedAt)
      .limit(100);
  } catch {
    return (
      <EmptyState
        title="Can't reach the database"
        body="Add DATABASE_URL to .env.local and run npm run db:migrate."
      />
    );
  }

  if (rows.length === 0) {
    return (
      <div>
        <Eyebrow>Moderation</Eyebrow>
        <h1 className="mt-2 text-3xl font-semibold tracking-[-0.03em]">Review queue</h1>
        <div className="mt-8">
          <EmptyState
            title="Nothing waiting"
            body="Listings appear here only when the automated checks could not reach a confident decision. Sorted by priority — highest value and most ambiguous first."
          />
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <Eyebrow>Moderation</Eyebrow>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.03em]">Review queue</h1>
        </div>
        <p className="text-sm text-text-muted">{rows.length} waiting</p>
      </div>

      <div className="glass mt-8 overflow-x-auto rounded-[18px]">
        <table className="w-full min-w-[820px] text-sm">
          <thead>
            <tr className="border-b border-white/[0.08] text-left text-[11px] uppercase tracking-[0.16em] text-text-faint">
              <th className="px-5 py-4 font-semibold">Listing</th>
              <th className="px-5 py-4 font-semibold">Seller</th>
              <th className="px-5 py-4 font-semibold">Price</th>
              <th className="px-5 py-4 font-semibold">Risk</th>
              <th className="px-5 py-4 font-semibold">Priority</th>
              <th className="px-5 py-4 font-semibold">SLA</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-white/[0.05] transition-colors last:border-0 hover:bg-white/[0.04]">
                <td className="px-5 py-4">
                  <a href={`/admin/listings/${r.id}`} className="font-semibold hover:text-violet-200">{r.title}</a>
                  <div className="mt-1 text-xs text-text-faint">{r.category} · {r.publicId}</div>
                </td>
                <td className="px-5 py-4">
                  <div>{r.sellerName ?? r.sellerPhone ?? "—"}</div>
                  <div className="text-xs text-text-faint">trust {r.sellerTrust}</div>
                </td>
                <td className="px-5 py-4 tabular">₹{(r.pricePaise / 100).toLocaleString("en-IN")}</td>
                <td className="px-5 py-4"><Badge tone={riskTone(r.risk)}>{r.risk}</Badge></td>
                <td className="px-5 py-4 tabular">{r.priority}</td>
                <td className="px-5 py-4 text-xs text-text-muted">{slaHours(r.priority)}h target</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
