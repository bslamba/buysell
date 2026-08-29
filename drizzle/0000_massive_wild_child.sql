CREATE EXTENSION IF NOT EXISTS vector;--> statement-breakpoint
CREATE TYPE "public"."actor" AS ENUM('system', 'admin', 'seller', 'buyer');--> statement-breakpoint
CREATE TYPE "public"."auction_status" AS ENUM('draft', 'scheduled', 'live', 'ended', 'awarded', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."cert_grade" AS ENUM('A', 'B', 'C', 'D', 'F');--> statement-breakpoint
CREATE TYPE "public"."decision" AS ENUM('approve', 'flag', 'reject');--> statement-breakpoint
CREATE TYPE "public"."image_status" AS ENUM('pending', 'clean', 'flagged', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."kyc_status" AS ENUM('none', 'pending', 'verified', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."listing_status" AS ENUM('draft', 'pending_review', 'auto_flagged', 'approved', 'rejected', 'sold', 'expired', 'withdrawn', 'suspended');--> statement-breakpoint
CREATE TYPE "public"."order_status" AS ENUM('created', 'payment_pending', 'in_escrow', 'shipped', 'delivered', 'inspection_window', 'completed', 'disputed', 'refunded', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."org_role" AS ENUM('owner', 'admin', 'member');--> statement-breakpoint
CREATE TYPE "public"."org_status" AS ENUM('pending', 'approved', 'suspended', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."org_type" AS ENUM('corporate', 'dealer', 'itad', 'refurbisher');--> statement-breakpoint
CREATE TYPE "public"."severity" AS ENUM('info', 'low', 'medium', 'high', 'blocker');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('user', 'corporate', 'moderator', 'admin', 'superadmin');--> statement-breakpoint
CREATE TABLE "auction_lots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"auction_id" uuid NOT NULL,
	"lot_number" integer NOT NULL,
	"title" varchar(200) NOT NULL,
	"description" text,
	"quantity" integer DEFAULT 1 NOT NULL,
	"quantity_remaining" integer DEFAULT 1 NOT NULL,
	"grade_mix" jsonb,
	"manifest_url" text,
	"images" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"reserve_paise" bigint,
	"start_price_paise" bigint NOT NULL,
	"bid_increment_paise" bigint DEFAULT 50000 NOT NULL,
	"allow_single_piece" boolean DEFAULT false NOT NULL,
	"single_piece_price_paise" bigint,
	"single_piece_max_per_buyer" integer DEFAULT 2 NOT NULL,
	"current_bid_paise" bigint,
	"current_bidder_id" uuid,
	"bid_count" integer DEFAULT 0 NOT NULL,
	"winning_bid_id" uuid,
	"closed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "auctions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"public_id" varchar(12) NOT NULL,
	"org_id" uuid NOT NULL,
	"created_by" uuid NOT NULL,
	"title" varchar(200) NOT NULL,
	"description" text,
	"category_slug" varchar(60) NOT NULL,
	"status" "auction_status" DEFAULT 'draft' NOT NULL,
	"buyers_must_be_verified" boolean DEFAULT true NOT NULL,
	"buyers_must_be_org" boolean DEFAULT false NOT NULL,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone NOT NULL,
	"anti_snipe_seconds" integer DEFAULT 120 NOT NULL,
	"pickup_city" varchar(80),
	"data_wipe_certified" boolean DEFAULT false NOT NULL,
	"approved_by" uuid,
	"approved_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "auctions_public_id_unique" UNIQUE("public_id")
);
--> statement-breakpoint
CREATE TABLE "audit_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"actor_id" uuid,
	"action" varchar(80) NOT NULL,
	"entity_type" varchar(40) NOT NULL,
	"entity_id" varchar(64) NOT NULL,
	"before" jsonb,
	"after" jsonb,
	"ip" varchar(45),
	"user_agent" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bids" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"auction_id" uuid NOT NULL,
	"lot_id" uuid NOT NULL,
	"bidder_id" uuid NOT NULL,
	"org_id" uuid,
	"amount_paise" bigint NOT NULL,
	"max_proxy_paise" bigint,
	"is_auto_bid" boolean DEFAULT false NOT NULL,
	"retracted" boolean DEFAULT false NOT NULL,
	"ip" varchar(45),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "certificates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"public_slug" varchar(16) NOT NULL,
	"listing_id" uuid,
	"user_id" uuid NOT NULL,
	"category_slug" varchar(60) NOT NULL,
	"grade" "cert_grade" NOT NULL,
	"diagnostic_version" varchar(20) NOT NULL,
	"report" jsonb NOT NULL,
	"fair_price_low_paise" bigint,
	"fair_price_high_paise" bigint,
	"signature" varchar(64) NOT NULL,
	"issued_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone,
	"revoked_at" timestamp with time zone,
	"revoke_reason" text,
	"view_count" integer DEFAULT 0 NOT NULL,
	"share_count" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "certificates_public_slug_unique" UNIQUE("public_slug")
);
--> statement-breakpoint
CREATE TABLE "conversations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"listing_id" uuid,
	"buyer_id" uuid NOT NULL,
	"seller_id" uuid NOT NULL,
	"last_message_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "image_fingerprints" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sha256" varchar(64) NOT NULL,
	"phash" bit(64) NOT NULL,
	"dhash" bit(64),
	"first_listing_id" uuid,
	"first_user_id" uuid,
	"times_seen" integer DEFAULT 1 NOT NULL,
	"is_stock_image" boolean DEFAULT false NOT NULL,
	"source_note" text,
	"first_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_seen_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "listing_images" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"listing_id" uuid NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"url" text NOT NULL,
	"blob_path" text NOT NULL,
	"width" integer NOT NULL,
	"height" integer NOT NULL,
	"bytes" integer NOT NULL,
	"mime_type" varchar(40) NOT NULL,
	"sha256" varchar(64) NOT NULL,
	"phash" bit(64),
	"dhash" bit(64),
	"exif" jsonb,
	"status" "image_status" DEFAULT 'pending' NOT NULL,
	"flags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "listing_reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"listing_id" uuid NOT NULL,
	"reporter_id" uuid,
	"reason_code" varchar(60) NOT NULL,
	"details" text,
	"resolved_at" timestamp with time zone,
	"resolved_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "listings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"public_id" varchar(12) NOT NULL,
	"seller_id" uuid NOT NULL,
	"org_id" uuid,
	"category_slug" varchar(60) NOT NULL,
	"title" varchar(140) NOT NULL,
	"description" text NOT NULL,
	"price_paise" bigint NOT NULL,
	"negotiable" boolean DEFAULT true NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"condition" varchar(30) NOT NULL,
	"attributes" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"city" varchar(80) NOT NULL,
	"pincode" varchar(6),
	"lat" double precision,
	"lng" double precision,
	"serial_hash" varchar(64),
	"imei_hash" varchar(64),
	"imei_last4" varchar(4),
	"ceir_status" varchar(20),
	"status" "listing_status" DEFAULT 'draft' NOT NULL,
	"risk_score" integer DEFAULT 0 NOT NULL,
	"auto_decision" "decision",
	"rejection_reason" text,
	"reviewed_by" uuid,
	"reviewed_at" timestamp with time zone,
	"review_priority" integer DEFAULT 50 NOT NULL,
	"sla_due_at" timestamp with time zone,
	"submitted_at" timestamp with time zone,
	"published_at" timestamp with time zone,
	"expires_at" timestamp with time zone,
	"sold_at" timestamp with time zone,
	"view_count" integer DEFAULT 0 NOT NULL,
	"save_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "listings_public_id_unique" UNIQUE("public_id")
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversation_id" uuid NOT NULL,
	"sender_id" uuid NOT NULL,
	"body" text NOT NULL,
	"raw_flagged" boolean DEFAULT false NOT NULL,
	"flags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"read_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "moderation_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"listing_id" uuid NOT NULL,
	"run_id" uuid NOT NULL,
	"check_key" varchar(60) NOT NULL,
	"passed" boolean NOT NULL,
	"severity" "severity" DEFAULT 'info' NOT NULL,
	"score_delta" integer DEFAULT 0 NOT NULL,
	"message" text NOT NULL,
	"detail" jsonb,
	"duration_ms" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"public_id" varchar(14) NOT NULL,
	"buyer_id" uuid NOT NULL,
	"seller_id" uuid NOT NULL,
	"listing_id" uuid,
	"lot_id" uuid,
	"quantity" integer DEFAULT 1 NOT NULL,
	"item_paise" bigint NOT NULL,
	"buyer_fee_paise" bigint DEFAULT 0 NOT NULL,
	"shipping_paise" bigint DEFAULT 0 NOT NULL,
	"total_paise" bigint NOT NULL,
	"platform_revenue_paise" bigint DEFAULT 0 NOT NULL,
	"status" "order_status" DEFAULT 'created' NOT NULL,
	"escrow_ref" varchar(128),
	"payment_ref" varchar(128),
	"inspection_ends_at" timestamp with time zone,
	"shipping_address" jsonb,
	"tracking_ref" varchar(80),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "orders_public_id_unique" UNIQUE("public_id")
);
--> statement-breakpoint
CREATE TABLE "organization_members" (
	"org_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" "org_role" DEFAULT 'member' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "organization_members_org_id_user_id_pk" PRIMARY KEY("org_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "organizations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(200) NOT NULL,
	"slug" varchar(120) NOT NULL,
	"type" "org_type" DEFAULT 'corporate' NOT NULL,
	"status" "org_status" DEFAULT 'pending' NOT NULL,
	"gstin" varchar(15),
	"cin" varchar(21),
	"pan" varchar(10),
	"website" text,
	"contact_email" varchar(255),
	"contact_phone" varchar(16),
	"address" jsonb,
	"documents" jsonb DEFAULT '[]'::jsonb,
	"can_run_auctions" boolean DEFAULT false NOT NULL,
	"can_bulk_upload" boolean DEFAULT false NOT NULL,
	"auto_approve_listings" boolean DEFAULT false NOT NULL,
	"commission_bps" integer DEFAULT 650 NOT NULL,
	"approved_at" timestamp with time zone,
	"approved_by" uuid,
	"rejection_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "organizations_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "otp_challenges" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"phone" varchar(16) NOT NULL,
	"code_hash" varchar(64) NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"consumed_at" timestamp with time zone,
	"ip" varchar(45),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "price_observations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"category_slug" varchar(60) NOT NULL,
	"brand" varchar(60),
	"model" varchar(120),
	"variant_key" varchar(160),
	"condition" varchar(30),
	"grade" "cert_grade",
	"age_months" integer,
	"city" varchar(80),
	"price_paise" bigint NOT NULL,
	"kind" varchar(20) NOT NULL,
	"listing_id" uuid,
	"observed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "review_decisions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"listing_id" uuid NOT NULL,
	"actor" "actor" NOT NULL,
	"admin_id" uuid,
	"decision" "decision" NOT NULL,
	"reason_code" varchar(60),
	"notes" text,
	"risk_score_at_decision" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "saved_listings" (
	"user_id" uuid NOT NULL,
	"listing_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "saved_listings_user_id_listing_id_pk" PRIMARY KEY("user_id","listing_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"phone" varchar(16),
	"phone_verified_at" timestamp with time zone,
	"email" varchar(255),
	"email_verified_at" timestamp with time zone,
	"name" varchar(120),
	"avatar_url" text,
	"role" "user_role" DEFAULT 'user' NOT NULL,
	"city" varchar(80),
	"pincode" varchar(6),
	"kyc" "kyc_status" DEFAULT 'none' NOT NULL,
	"kyc_verified_at" timestamp with time zone,
	"kyc_ref" varchar(128),
	"trust_score" integer DEFAULT 50 NOT NULL,
	"listings_approved" integer DEFAULT 0 NOT NULL,
	"listings_rejected" integer DEFAULT 0 NOT NULL,
	"sales_completed" integer DEFAULT 0 NOT NULL,
	"disputes_lost" integer DEFAULT 0 NOT NULL,
	"banned_at" timestamp with time zone,
	"ban_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_phone_unique" UNIQUE("phone"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "auction_lots" ADD CONSTRAINT "auction_lots_auction_id_auctions_id_fk" FOREIGN KEY ("auction_id") REFERENCES "public"."auctions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auction_lots" ADD CONSTRAINT "auction_lots_current_bidder_id_users_id_fk" FOREIGN KEY ("current_bidder_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auctions" ADD CONSTRAINT "auctions_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auctions" ADD CONSTRAINT "auctions_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auctions" ADD CONSTRAINT "auctions_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bids" ADD CONSTRAINT "bids_auction_id_auctions_id_fk" FOREIGN KEY ("auction_id") REFERENCES "public"."auctions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bids" ADD CONSTRAINT "bids_lot_id_auction_lots_id_fk" FOREIGN KEY ("lot_id") REFERENCES "public"."auction_lots"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bids" ADD CONSTRAINT "bids_bidder_id_users_id_fk" FOREIGN KEY ("bidder_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bids" ADD CONSTRAINT "bids_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_listing_id_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_listing_id_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_buyer_id_users_id_fk" FOREIGN KEY ("buyer_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_seller_id_users_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "listing_images" ADD CONSTRAINT "listing_images_listing_id_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "listing_reports" ADD CONSTRAINT "listing_reports_listing_id_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "listing_reports" ADD CONSTRAINT "listing_reports_reporter_id_users_id_fk" FOREIGN KEY ("reporter_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "listing_reports" ADD CONSTRAINT "listing_reports_resolved_by_users_id_fk" FOREIGN KEY ("resolved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "listings" ADD CONSTRAINT "listings_seller_id_users_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "listings" ADD CONSTRAINT "listings_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "listings" ADD CONSTRAINT "listings_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_sender_id_users_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "moderation_events" ADD CONSTRAINT "moderation_events_listing_id_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_buyer_id_users_id_fk" FOREIGN KEY ("buyer_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_seller_id_users_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_listing_id_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_lot_id_auction_lots_id_fk" FOREIGN KEY ("lot_id") REFERENCES "public"."auction_lots"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_members" ADD CONSTRAINT "organization_members_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_members" ADD CONSTRAINT "organization_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organizations" ADD CONSTRAINT "organizations_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_decisions" ADD CONSTRAINT "review_decisions_listing_id_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_decisions" ADD CONSTRAINT "review_decisions_admin_id_users_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_listings" ADD CONSTRAINT "saved_listings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_listings" ADD CONSTRAINT "saved_listings_listing_id_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "lot_number_idx" ON "auction_lots" USING btree ("auction_id","lot_number");--> statement-breakpoint
CREATE INDEX "lot_auction_idx" ON "auction_lots" USING btree ("auction_id");--> statement-breakpoint
CREATE INDEX "auction_status_idx" ON "auctions" USING btree ("status","ends_at");--> statement-breakpoint
CREATE INDEX "auction_org_idx" ON "auctions" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "audit_entity_idx" ON "audit_log" USING btree ("entity_type","entity_id","created_at");--> statement-breakpoint
CREATE INDEX "audit_actor_idx" ON "audit_log" USING btree ("actor_id","created_at");--> statement-breakpoint
CREATE INDEX "bid_lot_idx" ON "bids" USING btree ("lot_id","amount_paise");--> statement-breakpoint
CREATE INDEX "bid_bidder_idx" ON "bids" USING btree ("bidder_id","created_at");--> statement-breakpoint
CREATE INDEX "cert_user_idx" ON "certificates" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "cert_listing_idx" ON "certificates" USING btree ("listing_id");--> statement-breakpoint
CREATE UNIQUE INDEX "convo_unique_idx" ON "conversations" USING btree ("listing_id","buyer_id");--> statement-breakpoint
CREATE UNIQUE INDEX "fp_sha_idx" ON "image_fingerprints" USING btree ("sha256");--> statement-breakpoint
CREATE INDEX "fp_phash_idx" ON "image_fingerprints" USING hnsw ("phash" bit_hamming_ops);--> statement-breakpoint
CREATE INDEX "img_listing_idx" ON "listing_images" USING btree ("listing_id","position");--> statement-breakpoint
CREATE INDEX "img_sha_idx" ON "listing_images" USING btree ("sha256");--> statement-breakpoint
CREATE INDEX "report_listing_idx" ON "listing_reports" USING btree ("listing_id");--> statement-breakpoint
CREATE INDEX "listing_status_idx" ON "listings" USING btree ("status","review_priority");--> statement-breakpoint
CREATE INDEX "listing_seller_idx" ON "listings" USING btree ("seller_id","created_at");--> statement-breakpoint
CREATE INDEX "listing_cat_idx" ON "listings" USING btree ("category_slug","status","published_at");--> statement-breakpoint
CREATE INDEX "listing_city_idx" ON "listings" USING btree ("city","status");--> statement-breakpoint
CREATE INDEX "listing_org_idx" ON "listings" USING btree ("org_id");--> statement-breakpoint
CREATE UNIQUE INDEX "listing_imei_active_idx" ON "listings" USING btree ("imei_hash") WHERE status IN ('pending_review','auto_flagged','approved');--> statement-breakpoint
CREATE INDEX "msg_convo_idx" ON "messages" USING btree ("conversation_id","created_at");--> statement-breakpoint
CREATE INDEX "mod_listing_idx" ON "moderation_events" USING btree ("listing_id","created_at");--> statement-breakpoint
CREATE INDEX "mod_check_idx" ON "moderation_events" USING btree ("check_key","passed");--> statement-breakpoint
CREATE INDEX "order_buyer_idx" ON "orders" USING btree ("buyer_id","created_at");--> statement-breakpoint
CREATE INDEX "order_seller_idx" ON "orders" USING btree ("seller_id","created_at");--> statement-breakpoint
CREATE INDEX "order_status_idx" ON "orders" USING btree ("status");--> statement-breakpoint
CREATE INDEX "org_status_idx" ON "organizations" USING btree ("status");--> statement-breakpoint
CREATE INDEX "org_type_idx" ON "organizations" USING btree ("type");--> statement-breakpoint
CREATE INDEX "otp_phone_idx" ON "otp_challenges" USING btree ("phone","created_at");--> statement-breakpoint
CREATE INDEX "price_variant_idx" ON "price_observations" USING btree ("variant_key","condition","observed_at");--> statement-breakpoint
CREATE INDEX "price_cat_idx" ON "price_observations" USING btree ("category_slug","observed_at");--> statement-breakpoint
CREATE INDEX "rd_listing_idx" ON "review_decisions" USING btree ("listing_id","created_at");--> statement-breakpoint
CREATE INDEX "users_role_idx" ON "users" USING btree ("role");--> statement-breakpoint
CREATE INDEX "users_trust_idx" ON "users" USING btree ("trust_score");