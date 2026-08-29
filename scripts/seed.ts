/**
 * Development seed. Creates the accounts you need to click through the app.
 * Idempotent — safe to run repeatedly. Refuses to run against production.
 */
import { eq } from "drizzle-orm";
import { db } from "../src/db";
import { users, organizations, organizationMembers } from "../src/db/schema";

async function upsertUser(v: {
  phone: string; name: string; role: "user" | "corporate" | "moderator" | "admin" | "superadmin";
  trustScore?: number; listingsApproved?: number;
}) {
  const [existing] = await db.select().from(users).where(eq(users.phone, v.phone)).limit(1);
  if (existing) {
    await db.update(users).set({ role: v.role, name: v.name, updatedAt: new Date() }).where(eq(users.id, existing.id));
    return existing.id;
  }
  const [created] = await db.insert(users).values({
    phone: v.phone, phoneVerifiedAt: new Date(), name: v.name, role: v.role,
    city: "Bengaluru", trustScore: v.trustScore ?? 50,
    listingsApproved: v.listingsApproved ?? 0, kyc: "none",
  }).returning({ id: users.id });
  return created.id;
}

async function main() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Refusing to seed a production database.");
  }

  const adminId = await upsertUser({ phone: "+919000000001", name: "Platform Admin", role: "superadmin", trustScore: 100 });
  await upsertUser({ phone: "+919000000002", name: "Moderator One", role: "moderator", trustScore: 90 });
  await upsertUser({ phone: "+919000000003", name: "Trusted Seller", role: "user", trustScore: 75, listingsApproved: 12 });
  await upsertUser({ phone: "+919000000004", name: "New Seller", role: "user", trustScore: 50 });
  const corpId = await upsertUser({ phone: "+919000000005", name: "Corporate Owner", role: "corporate", trustScore: 70 });

  const slug = "acme-itad";
  let [org] = await db.select().from(organizations).where(eq(organizations.slug, slug)).limit(1);
  if (!org) {
    [org] = await db.insert(organizations).values({
      name: "Acme ITAD Services Pvt Ltd", slug, type: "itad", status: "approved",
      gstin: "29AABCU9603R1ZM", contactEmail: "assets@example.in", contactPhone: "+919000000005",
      address: { city: "Bengaluru", state: "Karnataka", pincode: "560066" },
      canRunAuctions: true, canBulkUpload: true, approvedAt: new Date(), approvedBy: adminId,
    }).returning();
    await db.insert(organizationMembers).values({ orgId: org.id, userId: corpId, role: "owner" });
  }

  const pendingSlug = "beta-refurb";
  const [pending] = await db.select().from(organizations).where(eq(organizations.slug, pendingSlug)).limit(1);
  if (!pending) {
    const [p] = await db.insert(organizations).values({
      name: "Beta Refurbishers LLP", slug: pendingSlug, type: "refurbisher", status: "pending",
      gstin: "29AACCB1234M1Z5", contactEmail: "hello@example.in",
    }).returning();
    await db.insert(organizationMembers).values({ orgId: p.id, userId: corpId, role: "owner" });
  }

  console.log(`
Seeded. In development the OTP is printed to the dev-server log, so sign in with
any of these numbers and read the code from the terminal:

  +91 90000 00001   Platform Admin   (superadmin)
  +91 90000 00002   Moderator One    (moderator)
  +91 90000 00003   Trusted Seller   (auto-approve eligible)
  +91 90000 00004   New Seller       (always human-reviewed)
  +91 90000 00005   Corporate Owner  (owns 1 approved + 1 pending org)

Organisations: Acme ITAD Services (approved, auctions on), Beta Refurbishers (pending).
  `.trim());
  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });
