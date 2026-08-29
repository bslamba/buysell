import Link from "next/link";
import { requireUser, getOrgMemberships } from "@/lib/auth/guards";
import { Card, Badge, Button, EmptyState } from "@/components/ui";

export const metadata = { title: "Corporate" };
export const dynamic = "force-dynamic";

const STATUS_TONE = { approved: "good", pending: "warn", suspended: "bad", rejected: "bad" } as const;

export default async function CorporateHome() {
  const user = await requireUser("/corporate");
  const orgs = await getOrgMemberships(user.id);

  if (orgs.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-5 py-12">
        <h1 className="text-2xl font-bold tracking-tight">Corporate seller accounts</h1>
        <p className="mt-3 max-w-xl text-sm text-ink-500">
          For companies disposing of IT assets, dealers and refurbishers. A corporate
          account can run lot auctions — sell 500 laptops as one lot, or let retail
          buyers take single pieces from the same lot at a fixed price.
        </p>
        <div className="mt-8">
          <EmptyState
            title="You're not part of a company account yet"
            body="Register your company and a Pakka administrator will verify your GSTIN before enabling auctions."
            action={<Button href="/corporate/register">Register a company</Button>}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-5 py-12">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight">Your company accounts</h1>
        <Button href="/corporate/register" variant="secondary">Register another</Button>
      </div>
      <div className="mt-6 space-y-3">
        {orgs.map((o) => (
          <Card key={o.orgId}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-base font-bold">{o.orgName}</h2>
                <p className="mt-1 text-xs text-ink-500">You are {o.role} of this account</p>
              </div>
              <Badge tone={STATUS_TONE[o.orgStatus as keyof typeof STATUS_TONE] ?? "neutral"}>
                {o.orgStatus}
              </Badge>
            </div>
            <div className="mt-4 flex flex-wrap gap-2 text-xs">
              <Badge tone={o.canRunAuctions ? "good" : "neutral"}>
                {o.canRunAuctions ? "Auctions enabled" : "Auctions not enabled"}
              </Badge>
              <Badge tone={o.canBulkUpload ? "good" : "neutral"}>
                {o.canBulkUpload ? "Bulk upload enabled" : "Bulk upload not enabled"}
              </Badge>
            </div>
            {o.orgStatus === "approved" && o.canRunAuctions && (
              <div className="mt-5">
                <Link href={`/corporate/${o.orgId}/auctions`} className="text-sm font-semibold text-brand-600 hover:underline">
                  Manage auctions →
                </Link>
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
