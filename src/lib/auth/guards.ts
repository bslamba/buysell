import { redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { auth } from "./index";
import { atLeast, orgAtLeast, type Role, type OrgRole } from "./roles";

export { atLeast, orgAtLeast } from "./roles";
export type { Role, OrgRole } from "./roles";
import { db } from "@/db";
import { organizationMembers, organizations, users } from "@/db/schema";

export interface SessionUser {
  id: string;
  role: Role;
  name?: string | null;
  email?: string | null;
  phone?: string;
  phoneVerified: boolean;
  kyc?: string;
  trustScore?: number;
}

export async function currentUser(): Promise<SessionUser | null> {
  const session = await auth();
  if (!session?.user?.id) return null;
  return session.user as SessionUser;
}

/** Redirects to sign-in, preserving where the user was going. */
export async function requireUser(returnTo = "/"): Promise<SessionUser> {
  const user = await currentUser();
  if (!user) redirect(`/signin?next=${encodeURIComponent(returnTo)}`);
  return user;
}

/**
 * Role gate. Middleware also blocks these paths, but authorisation is re-checked
 * here on purpose: middleware is a routing convenience, not a security boundary,
 * and a route reachable by any other means must still refuse.
 */
export async function requireRole(minimum: Role, returnTo = "/"): Promise<SessionUser> {
  const user = await requireUser(returnTo);
  if (!atLeast(user.role, minimum)) redirect("/403");
  return user;
}

/**
 * Selling requires a verified phone in every category.
 *
 * Sends people to /register rather than a standalone verify page: a phone is
 * now attached during registration, so an account without a verified number is
 * an account that never finished, and finishing it is the thing to ask for.
 */
export async function requireVerifiedPhone(returnTo = "/"): Promise<SessionUser> {
  const user = await requireUser(returnTo);
  if (!user.phoneVerified) redirect(`/register?next=${encodeURIComponent(returnTo)}`);
  return user;
}

/**
 * Registration gate.
 *
 * Reads the database rather than the session on purpose. The JWT carries a
 * cached copy refreshed on a timer, so a user who has just finished registering
 * would still look unregistered in their token — and a gate that trusted the
 * token would bounce them back to /register, which reads the database, sees
 * they are done, and sends them on again. That is an infinite redirect. One
 * query on a page that is already hitting the database is the cheaper answer.
 */
export async function requireRegistered(returnTo = "/"): Promise<SessionUser> {
  const user = await requireUser(returnTo);
  const [row] = await db
    .select({ registeredAt: users.registeredAt })
    .from(users).where(eq(users.id, user.id)).limit(1);
  if (!row?.registeredAt) redirect(`/register?next=${encodeURIComponent(returnTo)}`);
  return user;
}

export interface OrgMembership {
  orgId: string;
  orgName: string;
  orgStatus: string;
  role: "owner" | "admin" | "member";
  canRunAuctions: boolean;
  canBulkUpload: boolean;
}

export async function getOrgMemberships(userId: string): Promise<OrgMembership[]> {
  return db
    .select({
      orgId: organizations.id,
      orgName: organizations.name,
      orgStatus: organizations.status,
      role: organizationMembers.role,
      canRunAuctions: organizations.canRunAuctions,
      canBulkUpload: organizations.canBulkUpload,
    })
    .from(organizationMembers)
    .innerJoin(organizations, eq(organizations.id, organizationMembers.orgId))
    .where(eq(organizationMembers.userId, userId));
}

/** Corporate area: must belong to the org, and the org must be approved. */
export async function requireOrgMember(
  orgId: string,
  minimumOrgRole: OrgRole = "member",
): Promise<{ user: SessionUser; membership: OrgMembership }> {
  const user = await requireUser(`/corporate/${orgId}`);

  const [row] = await db
    .select({
      orgId: organizations.id,
      orgName: organizations.name,
      orgStatus: organizations.status,
      role: organizationMembers.role,
      canRunAuctions: organizations.canRunAuctions,
      canBulkUpload: organizations.canBulkUpload,
    })
    .from(organizationMembers)
    .innerJoin(organizations, eq(organizations.id, organizationMembers.orgId))
    .where(and(eq(organizationMembers.userId, user.id), eq(organizationMembers.orgId, orgId)))
    .limit(1);

  if (!row) redirect("/403");

  if (!orgAtLeast(row.role, minimumOrgRole)) redirect("/403");
  if (row.orgStatus !== "approved") redirect("/corporate/pending");

  return { user, membership: row };
}
