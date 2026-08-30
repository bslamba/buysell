import Link from "next/link";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { brand } from "@/config/brand";
import { requireUser, getOrgMemberships } from "@/lib/auth/guards";
import { ageInYears } from "@/lib/auth/email";
import { Badge, Button, Card, Eyebrow } from "@/components/ui";
import { SignOutButton } from "./sign-out-button";

export const metadata = { title: "Your account", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

const ROLE_LABEL: Record<string, string> = {
  user: "Member",
  corporate: "Corporate seller",
  moderator: "Moderator",
  admin: "Administrator",
  superadmin: "Platform owner",
};

function formatDate(d: Date | string | null): string {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(`${d}T00:00:00Z`) : d;
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
}

/** A row of the details table. Definition list, because that is what this is. */
function Row({ label, value, note }: { label: string; value: React.ReactNode; note?: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-6 border-b border-hairline py-4 last:border-b-0">
      <dt className="t-small shrink-0 text-ink-2">{label}</dt>
      <dd className="t-body text-right">
        {value}
        {note ? <span className="t-caption mt-1 block text-ink-3">{note}</span> : null}
      </dd>
    </div>
  );
}

/**
 * The account page.
 *
 * Read-only for now, deliberately: name, date of birth and email are what the
 * uniqueness rules are built on, so changing them needs its own verified flow
 * rather than a text box. What this page owes the user today is a straight
 * answer to "what does WorthIt know about me, and how do I leave".
 */
export default async function AccountPage() {
  const me = await requireUser("/account");

  const [row] = await db
    .select({
      name: users.name, phone: users.phone, email: users.email,
      dateOfBirth: users.dateOfBirth, role: users.role,
      phoneVerifiedAt: users.phoneVerifiedAt, emailVerifiedAt: users.emailVerifiedAt,
      registeredAt: users.registeredAt, createdAt: users.createdAt,
      trustScore: users.trustScore, kyc: users.kyc, city: users.city,
      listingsApproved: users.listingsApproved, salesCompleted: users.salesCompleted,
    })
    .from(users).where(eq(users.id, me.id)).limit(1);

  if (!row) {
    // The session outlived the row — a deleted account with a live cookie.
    return (
      <div className="container-a py-24 text-center">
        <h1 className="t-title">This account no longer exists</h1>
        <p className="t-body mx-auto mt-4 max-w-md text-ink-2">
          It may have been removed. Sign out and start again.
        </p>
        <div className="mt-8 flex justify-center"><SignOutButton /></div>
      </div>
    );
  }

  const orgs = await getOrgMemberships(me.id);
  const age = row.dateOfBirth ? ageInYears(new Date(`${row.dateOfBirth}T00:00:00Z`)) : null;
  const incomplete = !row.registeredAt;

  return (
    <div className="container-a max-w-3xl py-16 sm:py-20">
      <div className="text-center">
        <Eyebrow>Your account</Eyebrow>
        <h1 className="t-title mt-3">{row.name ?? "Welcome"}</h1>
        <p className="t-body mt-3 text-ink-2">
          {ROLE_LABEL[row.role] ?? "Member"} · joined {formatDate(row.createdAt)}
        </p>
      </div>

      {incomplete ? (
        <Card className="mt-10 !bg-brand-100">
          <h2 className="t-lead font-semibold">Your account isn&apos;t finished</h2>
          <p className="t-small mt-2 text-ink-2">
            Add your name, date of birth and a verified email before you buy or sell.
          </p>
          <div className="mt-5"><Button href="/register">Finish setting up</Button></div>
        </Card>
      ) : null}

      <Card className="mt-10">
        <h2 className="t-lead font-semibold">Details</h2>
        <dl className="mt-4">
          <Row label="Name" value={row.name ?? "—"} />
          <Row
            label="Mobile"
            value={row.phone ?? "—"}
            note={row.phoneVerifiedAt ? "Verified · never shown to buyers" : "Not verified"}
          />
          <Row
            label="Email"
            value={row.email ?? "—"}
            note={row.emailVerifiedAt ? "Verified · used for order updates" : "Not verified"}
          />
          <Row
            label="Date of birth"
            value={formatDate(row.dateOfBirth)}
            note={age !== null ? `${age} years old` : undefined}
          />
          {row.city ? <Row label="City" value={row.city} /> : null}
        </dl>
      </Card>

      <Card className="mt-6">
        <h2 className="t-lead font-semibold">Standing</h2>
        <dl className="mt-4">
          <Row
            label="Verification"
            value={
              <span className="flex justify-end gap-2">
                <Badge tone={row.phoneVerifiedAt ? "ok" : "warn"}>{row.phoneVerifiedAt ? "Phone" : "No phone"}</Badge>
                <Badge tone={row.emailVerifiedAt ? "ok" : "warn"}>{row.emailVerifiedAt ? "Email" : "No email"}</Badge>
              </span>
            }
          />
          <Row label="Trust score" value={`${row.trustScore} / 100`} note="Earned by listings that pass review and sales that complete" />
          <Row label="Identity check" value={row.kyc === "none" ? "Not needed yet" : row.kyc} note="Required above a category's value threshold" />
          <Row label="Listings approved" value={row.listingsApproved} />
          <Row label="Sales completed" value={row.salesCompleted} />
        </dl>
      </Card>

      {orgs.length > 0 ? (
        <Card className="mt-6">
          <h2 className="t-lead font-semibold">Businesses</h2>
          <dl className="mt-4">
            {orgs.map((o) => (
              <Row key={o.orgId} label={o.orgName} value={<span className="capitalize">{o.role}</span>} note={`Status: ${o.orgStatus}`} />
            ))}
          </dl>
          <div className="mt-5"><Button href="/corporate" variant="link">Corporate dashboard</Button></div>
        </Card>
      ) : null}

      <Card className="mt-6">
        <h2 className="t-lead font-semibold">Signed in on this device</h2>
        <p className="t-small mt-2 text-ink-2">
          Signing out clears this session. Your listings and orders are untouched.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <SignOutButton />
          <Button href="/help" variant="link">Get help</Button>
        </div>
      </Card>

      <p className="t-caption mt-10 text-center text-ink-3">
        To change your name, date of birth or email, or to close your account,{" "}
        <Link href="/contact" className="text-brand hover:text-brand-600">contact {brand.name} support</Link>.
        These are what keep one person to one account, so they are changed with a check, not a text box.
      </p>
    </div>
  );
}
