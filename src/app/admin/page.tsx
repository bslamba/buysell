import { count, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { listings, organizations, users } from "@/db/schema";
import { Card, Badge, Button, EmptyState } from "@/components/ui";

export const metadata = { title: "Admin" };
export const dynamic = "force-dynamic";

async function stats() {
  const [pending] = await db.select({ n: count() }).from(listings).where(eq(listings.status, "pending_review"));
  const [flagged] = await db.select({ n: count() }).from(listings).where(eq(listings.status, "auto_flagged"));
  const [live] = await db.select({ n: count() }).from(listings).where(eq(listings.status, "approved"));
  const [rejected] = await db.select({ n: count() }).from(listings).where(eq(listings.status, "rejected"));
  const [orgsPending] = await db.select({ n: count() }).from(organizations).where(eq(organizations.status, "pending"));
  const [totalUsers] = await db.select({ n: count() }).from(users);
  const [oldest] = await db
    .select({ submitted: sql<Date | null>`min(${listings.submittedAt})` })
    .from(listings).where(eq(listings.status, "auto_flagged"));
  return {
    pending: pending.n, flagged: flagged.n, live: live.n, rejected: rejected.n,
    orgsPending: orgsPending.n, users: totalUsers.n, oldest: oldest.submitted,
  };
}

export default async function AdminHome() {
  const s = await stats();
  const queueDepth = s.pending + s.flagged;
  const reviewed = s.live + s.rejected;
  const autoApproveRate = reviewed > 0 ? Math.round((s.live / reviewed) * 100) : null;

  const tiles = [
    { label: "Awaiting review", value: queueDepth, tone: queueDepth > 50 ? "warn" : "good" as const },
    { label: "Live listings", value: s.live, tone: "neutral" as const },
    { label: "Rejected", value: s.rejected, tone: "neutral" as const },
    { label: "Orgs pending approval", value: s.orgsPending, tone: s.orgsPending > 0 ? "warn" : "neutral" as const },
  ];

  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-tight">Overview</h1>
        <Button href="/admin/queue">Open review queue</Button>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {tiles.map((t) => (
          <Card key={t.label}>
            <div className="text-3xl font-extrabold tabular-nums tracking-tight">{t.value}</div>
            <div className="mt-2 text-sm font-medium text-ink-500">{t.label}</div>
          </Card>
        ))}
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Card>
          <h2 className="text-sm font-semibold uppercase tracking-widest text-ink-400">Auto-approve rate</h2>
          <p className="mt-3 text-3xl font-extrabold tabular-nums">
            {autoApproveRate === null ? "—" : `${autoApproveRate}%`}
          </p>
          <p className="mt-2 text-sm text-ink-500">
            Share of reviewed listings that went live. Raise this only when the
            false-positive rate on auto-rejects stays under 2%.
          </p>
        </Card>
        <Card>
          <h2 className="text-sm font-semibold uppercase tracking-widest text-ink-400">Registered users</h2>
          <p className="mt-3 text-3xl font-extrabold tabular-nums">{s.users}</p>
          <p className="mt-2 text-sm text-ink-500">
            {s.oldest ? `Oldest unreviewed listing submitted ${new Date(s.oldest).toLocaleString("en-IN")}.` : "No listings waiting."}
          </p>
        </Card>
      </div>

      {queueDepth === 0 && (
        <div className="mt-6">
          <EmptyState
            title="The queue is empty"
            body="Nothing is waiting for a human. When the moderation engine can't decide, listings land here sorted by priority, not by arrival time."
            action={<Badge tone="good">All clear</Badge>}
          />
        </div>
      )}
    </div>
  );
}
