import { count, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { listings, organizations, users } from "@/db/schema";
import { Card, Badge, Button, EmptyState, Eyebrow } from "@/components/ui";

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
  let s;
  try {
    s = await stats();
  } catch {
    return (
      <EmptyState
        title="Can't reach the database"
        body="Add DATABASE_URL to .env.local and run npm run db:migrate, then this dashboard will populate."
      />
    );
  }

  const queueDepth = s.pending + s.flagged;
  const reviewed = s.live + s.rejected;
  const autoApproveRate = reviewed > 0 ? Math.round((s.live / reviewed) * 100) : null;

  const tiles = [
    { label: "Awaiting review", value: queueDepth },
    { label: "Live listings", value: s.live },
    { label: "Rejected", value: s.rejected },
    { label: "Orgs pending", value: s.orgsPending },
  ];

  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-4">
        <div>
          <Eyebrow>Moderation</Eyebrow>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.03em]">Overview</h1>
        </div>
        <Button href="/admin/queue">Open review queue</Button>
      </div>

      <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {tiles.map((t) => (
          <Card key={t.label} hover>
            <div className="text-4xl font-semibold tracking-[-0.04em] tabular">{t.value}</div>
            <div className="mt-2 text-sm font-medium text-text-muted">{t.label}</div>
          </Card>
        ))}
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <Card>
          <Eyebrow>Auto-approve rate</Eyebrow>
          <p className="mt-3 text-4xl font-semibold tracking-[-0.04em] tabular">
            {autoApproveRate === null ? "—" : `${autoApproveRate}%`}
          </p>
          <p className="mt-3 text-sm leading-relaxed text-text-muted">
            Share of reviewed listings that went live. Raise this only while the false-positive rate
            on auto-rejects stays under 2%.
          </p>
        </Card>
        <Card>
          <Eyebrow>Registered users</Eyebrow>
          <p className="mt-3 text-4xl font-semibold tracking-[-0.04em] tabular">{s.users}</p>
          <p className="mt-3 text-sm leading-relaxed text-text-muted">
            {s.oldest
              ? `Oldest unreviewed listing submitted ${new Date(s.oldest).toLocaleString("en-IN")}.`
              : "No listings waiting."}
          </p>
        </Card>
      </div>

      {queueDepth === 0 && (
        <div className="mt-3">
          <EmptyState
            title="The queue is empty"
            body="Nothing is waiting for a human. When the moderation engine can't decide, listings land here sorted by priority, not by arrival time."
            action={<Badge tone="ok">All clear</Badge>}
          />
        </div>
      )}
    </div>
  );
}
