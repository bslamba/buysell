import type { CategoryRule } from "@/config/categories";

export type Severity = "info" | "low" | "medium" | "high" | "blocker";
export type Decision = "approve" | "flag" | "reject";

export interface CheckResult {
  key: string;
  passed: boolean;
  severity: Severity;
  /** Added to the listing's risk score when the check fails. 0-100 scale. */
  scoreDelta: number;
  /** Shown to the moderator, and (when safe) to the seller. */
  message: string;
  detail?: Record<string, unknown>;
  /** Set when the seller can fix this themselves — drives the rejection email. */
  sellerFixable?: boolean;
}

export interface ImageInput {
  id: string;
  buffer?: Buffer;
  url: string;
  sha256: string;
  phash: string;
  dhash: string;
  width: number;
  height: number;
  bytes: number;
  exif?: Record<string, unknown>;
}

export interface ModerationContext {
  listing: {
    id: string;
    sellerId: string;
    orgId?: string | null;
    categorySlug: string;
    title: string;
    description: string;
    pricePaise: number;
    condition: string;
    attributes: Record<string, unknown>;
    city: string;
    imei?: string | null;
    serial?: string | null;
  };
  category: CategoryRule;
  images: ImageInput[];
  seller: {
    id: string;
    createdAt: Date;
    phoneVerifiedAt: Date | null;
    kyc: string;
    trustScore: number;
    listingsApproved: number;
    listingsRejected: number;
    disputesLost: number;
    bannedAt: Date | null;
  };
  /** Injected so checks stay pure and testable. */
  services: ModerationServices;
}

export interface ModerationServices {
  findImageMatches(hashes: { sha256: string; phash: string }[]): Promise<ImageMatch[]>;
  countRecentListings(sellerId: string, sinceHours: number): Promise<number>;
  findSimilarText(text: string, excludeListingId: string): Promise<{ listingId: string; similarity: number; sellerId: string }[]>;
  getPriceStats(variantKey: string, condition: string): Promise<PriceStats | null>;
  checkCeir(imei: string): Promise<{ status: "clean" | "blocked" | "unknown" }>;
  findDeviceIdMatches(imeiHash?: string, serialHash?: string): Promise<{ listingId: string; sellerId: string; status: string }[]>;
  visionAnalyse?(image: ImageInput): Promise<VisionVerdict>;
}

export interface ImageMatch {
  imageId: string;
  matchedListingId: string | null;
  matchedUserId: string | null;
  distance: number; // 0 = byte identical
  kind: "exact" | "near";
  isStockImage: boolean;
  timesSeen: number;
}

export interface PriceStats {
  variantKey: string;
  sampleSize: number;
  medianPaise: number;
  p10Paise: number;
  p90Paise: number;
}

export interface VisionVerdict {
  nsfwScore: number;        // 0-1
  hasWatermark: boolean;
  watermarkText?: string;
  isScreenshot: boolean;
  isStockPhoto: boolean;
  faceCount: number;
  detectedObjects: string[];
  matchesTitle?: boolean;
}

export interface ModerationRun {
  runId: string;
  listingId: string;
  decision: Decision;
  riskScore: number;
  results: CheckResult[];
  blockers: CheckResult[];
  reviewPriority: number;
  startedAt: Date;
  durationMs: number;
}

export type Check = (ctx: ModerationContext) => Promise<CheckResult[]>;
