import { desc, inArray } from "drizzle-orm";
import { db } from "@/db";
import { listings, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { Badge, EmptyState } from "@/components/ui";
import { slaHours } from "@/lib/moderation/engine";

export const metadata = { title: "Review queue" };
export const dynamic = "force-dynamic";

function riskTone(score: number) {
  if (score >= 70) return "bad" as const;
  if (score >= 40) return "warn" as const;
  return "good" as const;
}

export default async function QueuePage() {
  const rows = await db
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

  if (rows.length === 0) {
    return (
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Review queue</h1>
        <div className="mt-6">
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
        <h1 className="text-2xl font-bold tracking-tight">Review queue</h1>
        <p className="text-sm text-ink-500">{rows.length} waiting</p>
      </div>

      <div className="mt-6 overflow-x-auto rounded-xl border border-ink-200 bg-white dark:border-ink-700 dark:bg-ink-900">
        <table className="w-full min-w-[820px] text-sm">
          <thead>
            <tr className="border-b border-ink-200 text-left text-xs uppercase tracking-widest text-ink-400 dark:border-ink-700">
              <th className="px-4 py-3 font-semibold">Listing</th>
              <th className="px-4 py-3 font-semibold">Seller</th>
              <th className="px-4 py-3 font-semibold">Price</th>
              <th className="px-4 py-3 font-semibold">Risk</th>
              <th className="px-4 py-3 font-semibold">Priority</th>
              <th className="px-4 py-3 font-semibold">SLA</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-ink-100 last:border-0 hover:bg-ink-50 dark:border-ink-700 dark:hover:bg-ink-950">
                <td className="px-4 py-3">
                  <a href={`/admin/listings/${r.id}`} className="font-semibold hover:underline">{r.title}</a>
                  <div className="mt-0.5 text-xs text-ink-400">{r.category} · {r.publicId}</div>
                </td>
                <td className="px-4 py-3">
                  <div>{r.sellerName ?? r.sellerPhone ?? "—"}</div>
                  <div className="text-xs text-ink-400">trust {r.sellerTrust}</div>
                </td>
                <td className="px-4 py-3 tabular-nums">₹{(r.pricePaise / 100).toLocaleString("en-IN")}</td>
                <td className="px-4 py-3"><Badge tone={riskTone(r.risk)}>{r.risk}</Badge></td>
                <td className="px-4 py-3 tabular-nums">{r.priority}</td>
                <td className="px-4 py-3 text-xs text-ink-500">{slaHours(r.priority)}h target</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
