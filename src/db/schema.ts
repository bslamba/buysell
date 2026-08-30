import {
  pgTable, pgEnum, text, varchar, integer, bigint, boolean, timestamp, jsonb,
  uuid, index, uniqueIndex, doublePrecision, primaryKey, customType, date,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

/* ────────────────────────────────────────────────────────────────────────────
 * Custom types
 * ──────────────────────────────────────────────────────────────────────────*/

/**
 * 64-bit perceptual hash stored as Postgres `bit(64)`.
 * pgvector >= 0.7 gives us Hamming distance on bit types via the `<~>` operator,
 * so near-duplicate image search is a single indexed query. See docs/MODERATION.md.
 */
export const bit64 = customType<{ data: string; driverData: string }>({
  dataType: () => "bit(64)",
});

/* ────────────────────────────────────────────────────────────────────────────
 * Enums
 * ──────────────────────────────────────────────────────────────────────────*/

export const userRole = pgEnum("user_role", ["user", "corporate", "moderator", "admin", "superadmin"]);
export const kycStatus = pgEnum("kyc_status", ["none", "pending", "verified", "rejected"]);
export const orgType = pgEnum("org_type", ["corporate", "dealer", "itad", "refurbisher"]);
export const orgStatus = pgEnum("org_status", ["pending", "approved", "suspended", "rejected"]);
export const orgRole = pgEnum("org_role", ["owner", "admin", "member"]);

export const listingStatus = pgEnum("listing_status", [
  "draft",          // seller still editing
  "pending_review", // submitted, waiting on automated + human review
  "auto_flagged",   // automation raised issues, needs a human
  "approved",       // live
  "rejected",       // failed review
  "sold",
  "expired",
  "withdrawn",
  "suspended",      // pulled after going live
]);

export const decisionEnum = pgEnum("decision", ["approve", "flag", "reject"]);
export const actorEnum = pgEnum("actor", ["system", "admin", "seller", "buyer"]);
export const severityEnum = pgEnum("severity", ["info", "low", "medium", "high", "blocker"]);
export const imageStatus = pgEnum("image_status", ["pending", "clean", "flagged", "rejected"]);
export const certGrade = pgEnum("cert_grade", ["A", "B", "C", "D", "F"]);

export const auctionStatus = pgEnum("auction_status", [
  "draft", "scheduled", "live", "ended", "awarded", "cancelled",
]);
export const orderStatus = pgEnum("order_status", [
  "created", "payment_pending", "in_escrow", "shipped", "delivered",
  "inspection_window", "completed", "disputed", "refunded", "cancelled",
]);

/* ────────────────────────────────────────────────────────────────────────────
 * Identity
 * ──────────────────────────────────────────────────────────────────────────*/

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  phone: varchar("phone", { length: 16 }).unique(),            // E.164, e.g. +919812345678
  phoneVerifiedAt: timestamp("phone_verified_at", { withTimezone: true }),
  email: varchar("email", { length: 255 }).unique(),        // as typed, for display and sending
  /**
   * The email folded to one identity per person: lower-cased, and for Gmail
   * with dots and +tags removed. This is what carries the unique index, because
   * `x@gmail.com`, `X+worthit@gmail.com` and `x.x@gmail.com` are one inbox, and
   * without folding they are three accounts for one person — exactly the
   * multi-account trick phone verification exists to stop.
   */
  emailNormalised: varchar("email_normalised", { length: 255 }).unique(),
  emailVerifiedAt: timestamp("email_verified_at", { withTimezone: true }),
  name: varchar("name", { length: 120 }),
  dateOfBirth: date("date_of_birth"),
  /** Set once name, date of birth and a verified email are all present. */
  registeredAt: timestamp("registered_at", { withTimezone: true }),
  avatarUrl: text("avatar_url"),
  role: userRole("role").notNull().default("user"),

  city: varchar("city", { length: 80 }),
  pincode: varchar("pincode", { length: 6 }),

  kyc: kycStatus("kyc").notNull().default("none"),
  kycVerifiedAt: timestamp("kyc_verified_at", { withTimezone: true }),
  kycRef: varchar("kyc_ref", { length: 128 }),

  /** 0-100. Drives auto-approve eligibility. See lib/moderation/trust.ts */
  trustScore: integer("trust_score").notNull().default(50),
  listingsApproved: integer("listings_approved").notNull().default(0),
  listingsRejected: integer("listings_rejected").notNull().default(0),
  salesCompleted: integer("sales_completed").notNull().default(0),
  disputesLost: integer("disputes_lost").notNull().default(0),

  bannedAt: timestamp("banned_at", { withTimezone: true }),
  banReason: text("ban_reason"),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index("users_role_idx").on(t.role),
  index("users_trust_idx").on(t.trustScore),
]);

/** Short-lived phone OTP challenges. Codes are stored hashed, never plain. */
export const otpChallenges = pgTable("otp_challenges", {
  id: uuid("id").defaultRandom().primaryKey(),
  phone: varchar("phone", { length: 16 }).notNull(),
  codeHash: varchar("code_hash", { length: 64 }).notNull(),   // sha256(code + pepper)
  attempts: integer("attempts").notNull().default(0),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  consumedAt: timestamp("consumed_at", { withTimezone: true }),
  ip: varchar("ip", { length: 45 }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [index("otp_phone_idx").on(t.phone, t.createdAt)]);

/**
 * Short-lived email verification challenges. Same shape and same rules as the
 * phone table above — hashed codes, bounded attempts, single use — kept
 * separate rather than generalised so neither channel's rate limiting or
 * expiry can be changed by accident while editing the other.
 */
export const emailChallenges = pgTable("email_challenges", {
  id: uuid("id").defaultRandom().primaryKey(),
  /** Normalised form, so an alias cannot be used to sidestep the attempt count. */
  email: varchar("email", { length: 255 }).notNull(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
  codeHash: varchar("code_hash", { length: 64 }).notNull(),
  attempts: integer("attempts").notNull().default(0),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  consumedAt: timestamp("consumed_at", { withTimezone: true }),
  ip: varchar("ip", { length: 45 }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [index("email_challenge_idx").on(t.email, t.createdAt)]);

/* ────────────────────────────────────────────────────────────────────────────
 * Organisations — corporate sellers, dealers, ITAD firms
 * ──────────────────────────────────────────────────────────────────────────*/

export const organizations = pgTable("organizations", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  slug: varchar("slug", { length: 120 }).notNull().unique(),
  type: orgType("type").notNull().default("corporate"),
  status: orgStatus("status").notNull().default("pending"),

  gstin: varchar("gstin", { length: 15 }),
  cin: varchar("cin", { length: 21 }),
  pan: varchar("pan", { length: 10 }),
  website: text("website"),
  contactEmail: varchar("contact_email", { length: 255 }),
  contactPhone: varchar("contact_phone", { length: 16 }),
  address: jsonb("address").$type<{ line1?: string; line2?: string; city?: string; state?: string; pincode?: string }>(),

  /** Documents uploaded during corporate onboarding (GST cert, incorporation, authority letter) */
  documents: jsonb("documents").$type<{ kind: string; url: string; uploadedAt: string }[]>().default([]),

  /** Privileges granted by a platform admin */
  canRunAuctions: boolean("can_run_auctions").notNull().default(false),
  canBulkUpload: boolean("can_bulk_upload").notNull().default(false),
  autoApproveListings: boolean("auto_approve_listings").notNull().default(false),
  commissionBps: integer("commission_bps").notNull().default(650), // 6.50%

  approvedAt: timestamp("approved_at", { withTimezone: true }),
  approvedBy: uuid("approved_by").references(() => users.id),
  rejectionReason: text("rejection_reason"),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [index("org_status_idx").on(t.status), index("org_type_idx").on(t.type)]);

export const organizationMembers = pgTable("organization_members", {
  orgId: uuid("org_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  role: orgRole("role").notNull().default("member"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [primaryKey({ columns: [t.orgId, t.userId] })]);

/* ────────────────────────────────────────────────────────────────────────────
 * Listings
 * ──────────────────────────────────────────────────────────────────────────*/

export const listings = pgTable("listings", {
  id: uuid("id").defaultRandom().primaryKey(),
  publicId: varchar("public_id", { length: 12 }).notNull().unique(), // short, shareable

  sellerId: uuid("seller_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  orgId: uuid("org_id").references(() => organizations.id, { onDelete: "set null" }),

  categorySlug: varchar("category_slug", { length: 60 }).notNull(),
  title: varchar("title", { length: 140 }).notNull(),
  description: text("description").notNull(),

  pricePaise: bigint("price_paise", { mode: "number" }).notNull(),
  negotiable: boolean("negotiable").notNull().default(true),
  quantity: integer("quantity").notNull().default(1),

  condition: varchar("condition", { length: 30 }).notNull(), // new | like_new | good | fair | for_parts
  attributes: jsonb("attributes").$type<Record<string, string | number | boolean>>().notNull().default({}),

  city: varchar("city", { length: 80 }).notNull(),
  pincode: varchar("pincode", { length: 6 }),
  lat: doublePrecision("lat"),
  lng: doublePrecision("lng"),

  /** Device identity — stored hashed; only the last 4 are ever displayed. */
  serialHash: varchar("serial_hash", { length: 64 }),
  imeiHash: varchar("imei_hash", { length: 64 }),
  imeiLast4: varchar("imei_last4", { length: 4 }),
  ceirStatus: varchar("ceir_status", { length: 20 }), // clean | blocked | unknown | not_checked

  status: listingStatus("status").notNull().default("draft"),
  riskScore: integer("risk_score").notNull().default(0),      // 0-100, higher = riskier
  autoDecision: decisionEnum("auto_decision"),
  rejectionReason: text("rejection_reason"),

  reviewedBy: uuid("reviewed_by").references(() => users.id),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  reviewPriority: integer("review_priority").notNull().default(50), // higher = review sooner
  slaDueAt: timestamp("sla_due_at", { withTimezone: true }),

  submittedAt: timestamp("submitted_at", { withTimezone: true }),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  soldAt: timestamp("sold_at", { withTimezone: true }),

  viewCount: integer("view_count").notNull().default(0),
  saveCount: integer("save_count").notNull().default(0),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index("listing_status_idx").on(t.status, t.reviewPriority),
  index("listing_seller_idx").on(t.sellerId, t.createdAt),
  index("listing_cat_idx").on(t.categorySlug, t.status, t.publishedAt),
  index("listing_city_idx").on(t.city, t.status),
  index("listing_org_idx").on(t.orgId),
  uniqueIndex("listing_imei_active_idx").on(t.imeiHash)
    .where(sql`status IN ('pending_review','auto_flagged','approved')`),
]);

export const listingImages = pgTable("listing_images", {
  id: uuid("id").defaultRandom().primaryKey(),
  listingId: uuid("listing_id").notNull().references(() => listings.id, { onDelete: "cascade" }),
  position: integer("position").notNull().default(0),

  url: text("url").notNull(),
  blobPath: text("blob_path").notNull(),
  width: integer("width").notNull(),
  height: integer("height").notNull(),
  bytes: integer("bytes").notNull(),
  mimeType: varchar("mime_type", { length: 40 }).notNull(),

  /** Exact-match fingerprint */
  sha256: varchar("sha256", { length: 64 }).notNull(),
  /** Near-match fingerprints — see lib/hash/phash.ts */
  phash: bit64("phash"),
  dhash: bit64("dhash"),

  exif: jsonb("exif").$type<Record<string, unknown>>(),
  status: imageStatus("status").notNull().default("pending"),
  flags: jsonb("flags").$type<string[]>().notNull().default([]),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index("img_listing_idx").on(t.listingId, t.position),
  index("img_sha_idx").on(t.sha256),
]);

/**
 * Durable, global image fingerprint index.
 *
 * Separate from listing_images on purpose: rows here SURVIVE listing deletion,
 * so a seller cannot delete a rejected listing and re-upload the same photos.
 * This is the table that answers "has this picture ever been used on WorthIt?".
 */
export const imageFingerprints = pgTable("image_fingerprints", {
  id: uuid("id").defaultRandom().primaryKey(),
  sha256: varchar("sha256", { length: 64 }).notNull(),
  phash: bit64("phash").notNull(),
  dhash: bit64("dhash"),

  firstListingId: uuid("first_listing_id"),
  firstUserId: uuid("first_user_id"),
  timesSeen: integer("times_seen").notNull().default(1),

  /** Set when we know the image is not an original photo (stock, web-scraped, catalogue) */
  isStockImage: boolean("is_stock_image").notNull().default(false),
  sourceNote: text("source_note"),

  firstSeenAt: timestamp("first_seen_at", { withTimezone: true }).notNull().defaultNow(),
  lastSeenAt: timestamp("last_seen_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  uniqueIndex("fp_sha_idx").on(t.sha256),
  index("fp_phash_idx").using("hnsw", sql`${t.phash} bit_hamming_ops`),
]);

/* ────────────────────────────────────────────────────────────────────────────
 * Moderation
 * ──────────────────────────────────────────────────────────────────────────*/

/** One row per check, per listing submission. The audit trail for every decision. */
export const moderationEvents = pgTable("moderation_events", {
  id: uuid("id").defaultRandom().primaryKey(),
  listingId: uuid("listing_id").notNull().references(() => listings.id, { onDelete: "cascade" }),
  runId: uuid("run_id").notNull(),

  checkKey: varchar("check_key", { length: 60 }).notNull(), // e.g. "image.duplicate"
  passed: boolean("passed").notNull(),
  severity: severityEnum("severity").notNull().default("info"),
  scoreDelta: integer("score_delta").notNull().default(0),
  message: text("message").notNull(),
  detail: jsonb("detail").$type<Record<string, unknown>>(),
  durationMs: integer("duration_ms"),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index("mod_listing_idx").on(t.listingId, t.createdAt),
  index("mod_check_idx").on(t.checkKey, t.passed),
]);

/** Human and system decisions on a listing. Append-only. */
export const reviewDecisions = pgTable("review_decisions", {
  id: uuid("id").defaultRandom().primaryKey(),
  listingId: uuid("listing_id").notNull().references(() => listings.id, { onDelete: "cascade" }),
  actor: actorEnum("actor").notNull(),
  adminId: uuid("admin_id").references(() => users.id),
  decision: decisionEnum("decision").notNull(),
  reasonCode: varchar("reason_code", { length: 60 }),
  notes: text("notes"),
  riskScoreAtDecision: integer("risk_score_at_decision"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [index("rd_listing_idx").on(t.listingId, t.createdAt)]);

/** Buyer/community reports on live listings. */
export const listingReports = pgTable("listing_reports", {
  id: uuid("id").defaultRandom().primaryKey(),
  listingId: uuid("listing_id").notNull().references(() => listings.id, { onDelete: "cascade" }),
  reporterId: uuid("reporter_id").references(() => users.id),
  reasonCode: varchar("reason_code", { length: 60 }).notNull(),
  details: text("details"),
  resolvedAt: timestamp("resolved_at", { withTimezone: true }),
  resolvedBy: uuid("resolved_by").references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [index("report_listing_idx").on(t.listingId)]);

/* ────────────────────────────────────────────────────────────────────────────
 * Condition certificates
 * ──────────────────────────────────────────────────────────────────────────*/

export const certificates = pgTable("certificates", {
  id: uuid("id").defaultRandom().primaryKey(),
  publicSlug: varchar("public_slug", { length: 16 }).notNull().unique(),
  listingId: uuid("listing_id").references(() => listings.id, { onDelete: "set null" }),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),

  categorySlug: varchar("category_slug", { length: 60 }).notNull(),
  grade: certGrade("grade").notNull(),
  diagnosticVersion: varchar("diagnostic_version", { length: 20 }).notNull(),

  /** Full machine-read diagnostic payload. Never edited after issue. */
  report: jsonb("report").$type<Record<string, unknown>>().notNull(),
  fairPriceLowPaise: bigint("fair_price_low_paise", { mode: "number" }),
  fairPriceHighPaise: bigint("fair_price_high_paise", { mode: "number" }),

  /** Tamper-evidence: sha256 over the canonicalised report + issuedAt + secret. */
  signature: varchar("signature", { length: 64 }).notNull(),

  issuedAt: timestamp("issued_at", { withTimezone: true }).notNull().defaultNow(),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  revokedAt: timestamp("revoked_at", { withTimezone: true }),
  revokeReason: text("revoke_reason"),
  viewCount: integer("view_count").notNull().default(0),
  shareCount: integer("share_count").notNull().default(0),
}, (t) => [index("cert_user_idx").on(t.userId), index("cert_listing_idx").on(t.listingId)]);

/* ────────────────────────────────────────────────────────────────────────────
 * Corporate lot auctions
 * ──────────────────────────────────────────────────────────────────────────*/

export const auctions = pgTable("auctions", {
  id: uuid("id").defaultRandom().primaryKey(),
  publicId: varchar("public_id", { length: 12 }).notNull().unique(),
  orgId: uuid("org_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  createdBy: uuid("created_by").notNull().references(() => users.id),

  title: varchar("title", { length: 200 }).notNull(),
  description: text("description"),
  categorySlug: varchar("category_slug", { length: 60 }).notNull(),
  status: auctionStatus("status").notNull().default("draft"),

  /** Who may bid: open to all verified buyers, or invited orgs only */
  buyersMustBeVerified: boolean("buyers_must_be_verified").notNull().default(true),
  buyersMustBeOrg: boolean("buyers_must_be_org").notNull().default(false),

  startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
  endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
  /** Anti-sniping: extend the close by N seconds if a bid lands near the end */
  antiSnipeSeconds: integer("anti_snipe_seconds").notNull().default(120),

  pickupCity: varchar("pickup_city", { length: 80 }),
  dataWipeCertified: boolean("data_wipe_certified").notNull().default(false),

  approvedBy: uuid("approved_by").references(() => users.id),
  approvedAt: timestamp("approved_at", { withTimezone: true }),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [index("auction_status_idx").on(t.status, t.endsAt), index("auction_org_idx").on(t.orgId)]);

/**
 * A lot is what people actually bid on. `allowSinglePiece` is the switch that
 * lets a retail buyer purchase one unit out of a bulk lot at a fixed price,
 * while bidders compete for the whole lot.
 */
export const auctionLots = pgTable("auction_lots", {
  id: uuid("id").defaultRandom().primaryKey(),
  auctionId: uuid("auction_id").notNull().references(() => auctions.id, { onDelete: "cascade" }),
  lotNumber: integer("lot_number").notNull(),

  title: varchar("title", { length: 200 }).notNull(),
  description: text("description"),
  quantity: integer("quantity").notNull().default(1),
  quantityRemaining: integer("quantity_remaining").notNull().default(1),

  gradeMix: jsonb("grade_mix").$type<Record<string, number>>(), // {"A":12,"B":40,"C":8}
  manifestUrl: text("manifest_url"),                             // CSV of serials + specs
  images: jsonb("images").$type<string[]>().notNull().default([]),

  reservePaise: bigint("reserve_paise", { mode: "number" }),
  startPricePaise: bigint("start_price_paise", { mode: "number" }).notNull(),
  bidIncrementPaise: bigint("bid_increment_paise", { mode: "number" }).notNull().default(50000),

  allowSinglePiece: boolean("allow_single_piece").notNull().default(false),
  singlePiecePricePaise: bigint("single_piece_price_paise", { mode: "number" }),
  singlePieceMaxPerBuyer: integer("single_piece_max_per_buyer").notNull().default(2),

  currentBidPaise: bigint("current_bid_paise", { mode: "number" }),
  currentBidderId: uuid("current_bidder_id").references(() => users.id),
  bidCount: integer("bid_count").notNull().default(0),

  winningBidId: uuid("winning_bid_id"),
  closedAt: timestamp("closed_at", { withTimezone: true }),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  uniqueIndex("lot_number_idx").on(t.auctionId, t.lotNumber),
  index("lot_auction_idx").on(t.auctionId),
]);

export const bids = pgTable("bids", {
  id: uuid("id").defaultRandom().primaryKey(),
  auctionId: uuid("auction_id").notNull().references(() => auctions.id, { onDelete: "cascade" }),
  lotId: uuid("lot_id").notNull().references(() => auctionLots.id, { onDelete: "cascade" }),
  bidderId: uuid("bidder_id").notNull().references(() => users.id),
  orgId: uuid("org_id").references(() => organizations.id),

  amountPaise: bigint("amount_paise", { mode: "number" }).notNull(),
  /** Proxy bidding: platform bids up to this on the bidder's behalf */
  maxProxyPaise: bigint("max_proxy_paise", { mode: "number" }),
  isAutoBid: boolean("is_auto_bid").notNull().default(false),
  retracted: boolean("retracted").notNull().default(false),

  ip: varchar("ip", { length: 45 }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index("bid_lot_idx").on(t.lotId, t.amountPaise),
  index("bid_bidder_idx").on(t.bidderId, t.createdAt),
]);

/* ────────────────────────────────────────────────────────────────────────────
 * Orders (payments stubbed in Phase 1 — see lib/payments/provider.ts)
 * ──────────────────────────────────────────────────────────────────────────*/

export const orders = pgTable("orders", {
  id: uuid("id").defaultRandom().primaryKey(),
  publicId: varchar("public_id", { length: 14 }).notNull().unique(),

  buyerId: uuid("buyer_id").notNull().references(() => users.id),
  sellerId: uuid("seller_id").notNull().references(() => users.id),
  listingId: uuid("listing_id").references(() => listings.id),
  lotId: uuid("lot_id").references(() => auctionLots.id),
  quantity: integer("quantity").notNull().default(1),

  itemPaise: bigint("item_paise", { mode: "number" }).notNull(),
  buyerFeePaise: bigint("buyer_fee_paise", { mode: "number" }).notNull().default(0),
  shippingPaise: bigint("shipping_paise", { mode: "number" }).notNull().default(0),
  totalPaise: bigint("total_paise", { mode: "number" }).notNull(),
  platformRevenuePaise: bigint("platform_revenue_paise", { mode: "number" }).notNull().default(0),

  status: orderStatus("status").notNull().default("created"),
  escrowRef: varchar("escrow_ref", { length: 128 }),
  paymentRef: varchar("payment_ref", { length: 128 }),
  inspectionEndsAt: timestamp("inspection_ends_at", { withTimezone: true }),

  shippingAddress: jsonb("shipping_address").$type<Record<string, string>>(),
  trackingRef: varchar("tracking_ref", { length: 80 }),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index("order_buyer_idx").on(t.buyerId, t.createdAt),
  index("order_seller_idx").on(t.sellerId, t.createdAt),
  index("order_status_idx").on(t.status),
]);

/* ────────────────────────────────────────────────────────────────────────────
 * Messaging (contact details are scrubbed — see lib/moderation/checks/contact.ts)
 * ──────────────────────────────────────────────────────────────────────────*/

export const conversations = pgTable("conversations", {
  id: uuid("id").defaultRandom().primaryKey(),
  listingId: uuid("listing_id").references(() => listings.id, { onDelete: "cascade" }),
  buyerId: uuid("buyer_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  sellerId: uuid("seller_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  lastMessageAt: timestamp("last_message_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [uniqueIndex("convo_unique_idx").on(t.listingId, t.buyerId)]);

export const messages = pgTable("messages", {
  id: uuid("id").defaultRandom().primaryKey(),
  conversationId: uuid("conversation_id").notNull().references(() => conversations.id, { onDelete: "cascade" }),
  senderId: uuid("sender_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  body: text("body").notNull(),          // stored already scrubbed
  rawFlagged: boolean("raw_flagged").notNull().default(false),
  flags: jsonb("flags").$type<string[]>().notNull().default([]),
  readAt: timestamp("read_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [index("msg_convo_idx").on(t.conversationId, t.createdAt)]);

/* ────────────────────────────────────────────────────────────────────────────
 * Pricing intelligence + audit
 * ──────────────────────────────────────────────────────────────────────────*/

/** Every observed sale/ask. This table becomes the India used-device price index. */
export const priceObservations = pgTable("price_observations", {
  id: uuid("id").defaultRandom().primaryKey(),
  categorySlug: varchar("category_slug", { length: 60 }).notNull(),
  brand: varchar("brand", { length: 60 }),
  model: varchar("model", { length: 120 }),
  variantKey: varchar("variant_key", { length: 160 }),  // normalised: brand|model|ram|storage
  condition: varchar("condition", { length: 30 }),
  grade: certGrade("grade"),
  ageMonths: integer("age_months"),
  city: varchar("city", { length: 80 }),
  pricePaise: bigint("price_paise", { mode: "number" }).notNull(),
  kind: varchar("kind", { length: 20 }).notNull(), // ask | sold | bid | external
  listingId: uuid("listing_id"),
  observedAt: timestamp("observed_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index("price_variant_idx").on(t.variantKey, t.condition, t.observedAt),
  index("price_cat_idx").on(t.categorySlug, t.observedAt),
]);

export const auditLog = pgTable("audit_log", {
  id: uuid("id").defaultRandom().primaryKey(),
  actorId: uuid("actor_id").references(() => users.id),
  action: varchar("action", { length: 80 }).notNull(),
  entityType: varchar("entity_type", { length: 40 }).notNull(),
  entityId: varchar("entity_id", { length: 64 }).notNull(),
  before: jsonb("before"),
  after: jsonb("after"),
  ip: varchar("ip", { length: 45 }),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index("audit_entity_idx").on(t.entityType, t.entityId, t.createdAt),
  index("audit_actor_idx").on(t.actorId, t.createdAt),
]);

export const savedListings = pgTable("saved_listings", {
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  listingId: uuid("listing_id").notNull().references(() => listings.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [primaryKey({ columns: [t.userId, t.listingId] })]);
