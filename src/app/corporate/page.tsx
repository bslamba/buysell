import Link from "next/link";
import { requireUser, getOrgMemberships } from "@/lib/auth/guards";
import { Card, Badge, Button, EmptyState, PageHeader } from "@/components/ui";

export const metadata = { title: "Corporate" };
export const dynamic = "force-dynamic";

const STATUS_TONE = { approved: "ok", pending: "warn", suspended: "bad", rejected: "bad" } as const;

export default async function CorporateHome() {
  const user = await requireUser("/corporate");

  let orgs;
  try {
    orgs = await getOrgMemberships(user.id);
  } catch {
    return (
      <div className="mx-auto max-w-3xl px-6 py-20">
        <EmptyState
          title="Can't reach the database"
          body="Add DATABASE_URL to .env.local and run npm run db:migrate."
        />
      </div>
    );
  }

  if (orgs.length === 0) {
    return (
      <>
        <PageHeader
          eyebrow="For businesses"
          title="Corporate seller accounts"
          sub="For companies disposing of IT assets, dealers and refurbishers. A corporate account can run lot auctions — sell 500 laptops as one lot, or let retail buyers take single pieces from the same lot at a fixed price."
        />
        <div className="mx-auto max-w-3xl px-6 py-16">
          <EmptyState
            title="You're not part of a company account yet"
            body="Register your company and a WorthIt administrator will verify your GSTIN before enabling auctions."
            action={<Button href="/corporate/register">Register a company</Button>}
          />
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader eyebrow="For businesses" title="Your company accounts" />
      <div className="mx-auto max-w-3xl px-6 py-12">
        <div className="mb-6 flex justify-end">
          <Button href="/corporate/register" variant="glass">Register another</Button>
        </div>
        <div className="space-y-3">
          {orgs.map((o) => (
            <Card key={o.orgId} hover>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold tracking-[-0.02em]">{o.orgName}</h2>
                  <p className="mt-1.5 text-xs text-text-faint">You are {o.role} of this account</p>
                </div>
                <Badge tone={STATUS_TONE[o.orgStatus as keyof typeof STATUS_TONE] ?? "plain"}>
                  {o.orgStatus}
                </Badge>
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                <Badge tone={o.canRunAuctions ? "ok" : "plain"}>
                  {o.canRunAuctions ? "Auctions enabled" : "Auctions not enabled"}
                </Badge>
                <Badge tone={o.canBulkUpload ? "ok" : "plain"}>
                  {o.canBulkUpload ? "Bulk upload enabled" : "Bulk upload not enabled"}
                </Badge>
              </div>
              {o.orgStatus === "approved" && o.canRunAuctions && (
                <div className="mt-6">
                  <Link href={`/corporate/${o.orgId}/auctions`} className="text-sm font-semibold text-violet-300 hover:text-violet-200">
                    Manage auctions →
                  </Link>
                </div>
              )}
            </Card>
          ))}
        </div>
      </div>
    </>
  );
}
