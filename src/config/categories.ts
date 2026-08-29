/**
 * Category registry.
 *
 * The platform accepts ANY category, but each category carries its own rule set.
 * High-value, high-fraud categories (phones, laptops) get the strictest automated
 * checks and a verification tier that can produce a Condition Certificate.
 * Low-value categories get light checks so we don't strangle supply.
 *
 * Adding a category = adding an entry here. No code changes elsewhere.
 */

export type VerificationTier =
  | "certified" // software diagnostic possible -> full Condition Certificate
  | "assisted" // guided photo + serial checks, no self-diagnostic
  | "basic"; // photo + description checks only

export interface CategoryRule {
  slug: string;
  label: string;
  parent?: string;
  tier: VerificationTier;

  /** Listing constraints */
  minPricePaise: number;
  maxPricePaise: number;
  minImages: number;
  maxImages: number;

  /** Structured attributes the seller MUST provide (validated by zod at runtime) */
  requiredAttributes: string[];
  optionalAttributes?: string[];

  /** Identity / device checks */
  requiresSerial: boolean;
  requiresImei: boolean; // triggers CEIR / Sanchar Saathi blocklist lookup
  requiresInvoiceOrBox: boolean;

  /** Seller trust gates */
  requiresPhoneVerified: boolean;
  requiresKycAbovePaise?: number; // KYC needed above this ticket size

  /**
   * Risk multiplier applied to the moderation score. Categories with high
   * fraud/stolen-goods rates score harsher for the same signals.
   */
  riskMultiplier: number;

  /** Words that make a listing an automatic reject in this category */
  bannedTerms?: string[];
}

const RUPEE = 100; // paise per rupee

export const CATEGORIES: CategoryRule[] = [
  // ── Tier 1: certified ─────────────────────────────────────────────────────
  {
    slug: "laptops",
    label: "Laptops & Notebooks",
    tier: "certified",
    minPricePaise: 2_000 * RUPEE,
    maxPricePaise: 5_00_000 * RUPEE,
    minImages: 5,
    maxImages: 15,
    requiredAttributes: ["brand", "model", "processor", "ram_gb", "storage_gb", "year", "condition"],
    optionalAttributes: ["gpu", "screen_size", "battery_health_pct", "warranty_until", "charger_included"],
    requiresSerial: true,
    requiresImei: false,
    requiresInvoiceOrBox: false,
    requiresPhoneVerified: true,
    requiresKycAbovePaise: 50_000 * RUPEE,
    riskMultiplier: 1.3,
  },
  {
    slug: "phones",
    label: "Mobile Phones",
    tier: "certified",
    minPricePaise: 1_000 * RUPEE,
    maxPricePaise: 3_00_000 * RUPEE,
    minImages: 5,
    maxImages: 12,
    requiredAttributes: ["brand", "model", "storage_gb", "condition", "imei_last4"],
    optionalAttributes: ["ram_gb", "colour", "battery_health_pct", "warranty_until", "box_included"],
    requiresSerial: false,
    requiresImei: true,
    requiresInvoiceOrBox: false,
    requiresPhoneVerified: true,
    requiresKycAbovePaise: 40_000 * RUPEE,
    riskMultiplier: 1.6, // highest stolen-goods rate of any category
    bannedTerms: ["unlock service", "icloud bypass", "imei repair", "clone", "first copy", "master copy"],
  },
  {
    slug: "tablets",
    label: "Tablets & iPads",
    tier: "certified",
    minPricePaise: 1_000 * RUPEE,
    maxPricePaise: 2_00_000 * RUPEE,
    minImages: 4,
    maxImages: 12,
    requiredAttributes: ["brand", "model", "storage_gb", "condition"],
    requiresSerial: true,
    requiresImei: false,
    requiresInvoiceOrBox: false,
    requiresPhoneVerified: true,
    riskMultiplier: 1.3,
  },

  // ── Tier 2: assisted ──────────────────────────────────────────────────────
  {
    slug: "monitors",
    label: "Monitors & Displays",
    tier: "assisted",
    minPricePaise: 500 * RUPEE,
    maxPricePaise: 3_00_000 * RUPEE,
    minImages: 4,
    maxImages: 10,
    requiredAttributes: ["brand", "model", "size_inches", "resolution", "condition"],
    requiresSerial: true,
    requiresImei: false,
    requiresInvoiceOrBox: false,
    requiresPhoneVerified: true,
    riskMultiplier: 1.0,
  },
  {
    slug: "cameras",
    label: "Cameras & Lenses",
    tier: "assisted",
    minPricePaise: 1_000 * RUPEE,
    maxPricePaise: 10_00_000 * RUPEE,
    minImages: 5,
    maxImages: 15,
    requiredAttributes: ["brand", "model", "type", "condition"],
    optionalAttributes: ["shutter_count", "mount", "accessories"],
    requiresSerial: true,
    requiresImei: false,
    requiresInvoiceOrBox: false,
    requiresPhoneVerified: true,
    riskMultiplier: 1.4,
    bannedTerms: ["first copy", "replica"],
  },
  {
    slug: "audio",
    label: "Audio & Headphones",
    tier: "assisted",
    minPricePaise: 300 * RUPEE,
    maxPricePaise: 5_00_000 * RUPEE,
    minImages: 3,
    maxImages: 10,
    requiredAttributes: ["brand", "model", "condition"],
    requiresSerial: false,
    requiresImei: false,
    requiresInvoiceOrBox: false,
    requiresPhoneVerified: true,
    riskMultiplier: 1.5, // counterfeit-heavy category
    bannedTerms: ["first copy", "master copy", "replica", "7a quality", "aaa quality"],
  },
  {
    slug: "gaming",
    label: "Consoles & GPUs",
    tier: "assisted",
    minPricePaise: 1_000 * RUPEE,
    maxPricePaise: 5_00_000 * RUPEE,
    minImages: 4,
    maxImages: 12,
    requiredAttributes: ["brand", "model", "condition"],
    optionalAttributes: ["ban_status", "hours_used"],
    requiresSerial: true,
    requiresImei: false,
    requiresInvoiceOrBox: false,
    requiresPhoneVerified: true,
    riskMultiplier: 1.3,
  },
  {
    slug: "appliances",
    label: "Home Appliances",
    tier: "assisted",
    minPricePaise: 500 * RUPEE,
    maxPricePaise: 5_00_000 * RUPEE,
    minImages: 4,
    maxImages: 10,
    requiredAttributes: ["brand", "model", "type", "age_years", "condition"],
    requiresSerial: false,
    requiresImei: false,
    requiresInvoiceOrBox: false,
    requiresPhoneVerified: true,
    riskMultiplier: 0.9,
  },

  // ── Tier 3: basic ─────────────────────────────────────────────────────────
  {
    slug: "furniture",
    label: "Furniture",
    tier: "basic",
    minPricePaise: 200 * RUPEE,
    maxPricePaise: 10_00_000 * RUPEE,
    minImages: 3,
    maxImages: 12,
    requiredAttributes: ["type", "material", "condition"],
    requiresSerial: false,
    requiresImei: false,
    requiresInvoiceOrBox: false,
    requiresPhoneVerified: true,
    riskMultiplier: 0.7,
  },
  {
    slug: "books",
    label: "Books & Study Material",
    tier: "basic",
    minPricePaise: 20 * RUPEE,
    maxPricePaise: 50_000 * RUPEE,
    minImages: 2,
    maxImages: 8,
    requiredAttributes: ["title", "condition"],
    requiresSerial: false,
    requiresImei: false,
    requiresInvoiceOrBox: false,
    requiresPhoneVerified: true,
    riskMultiplier: 0.5,
  },
  {
    slug: "other",
    label: "Everything Else",
    tier: "basic",
    minPricePaise: 50 * RUPEE,
    maxPricePaise: 10_00_000 * RUPEE,
    minImages: 3,
    maxImages: 10,
    requiredAttributes: ["title", "condition"],
    requiresSerial: false,
    requiresImei: false,
    requiresInvoiceOrBox: false,
    requiresPhoneVerified: true,
    riskMultiplier: 1.0,
  },
];

/**
 * Categories we refuse outright. Checked against title + description text.
 * Keeps us clear of regulated, prohibited and high-liability goods.
 */
export const PROHIBITED_PATTERNS: { pattern: RegExp; reason: string }[] = [
  { pattern: /\b(gun|pistol|rifle|ammunition|firearm)\b/i, reason: "Weapons are not permitted" },
  { pattern: /\b(drug|cocaine|ganja|charas|mdma)\b/i, reason: "Controlled substances are not permitted" },
  { pattern: /\b(aadhaar|pan\s*card|passport|voter\s*id|driving\s*licen[cs]e)\s*(card|copy|for sale)/i, reason: "Identity documents cannot be sold" },
  { pattern: /\b(medicine|tablet strip|injection|prescription drug|antibiotic)\b/i, reason: "Pharmaceuticals are not permitted" },
  { pattern: /\b(ivory|tortoise shell|pangolin|tiger|leopard)\s*(skin|nail|claw|scale)?\b/i, reason: "Wildlife products are prohibited" },
  { pattern: /\b(first copy|master copy|1st copy|replica watch|duplicate brand)\b/i, reason: "Counterfeit goods are prohibited" },
  { pattern: /\b(sim\s*card|pre[- ]?activated sim)\b/i, reason: "SIM cards cannot be resold" },
  { pattern: /\b(lottery|matka|betting|satta)\b/i, reason: "Gambling-related items are prohibited" },
];

export const categoryBySlug = new Map(CATEGORIES.map((c) => [c.slug, c]));

export function getCategory(slug: string): CategoryRule {
  const c = categoryBySlug.get(slug);
  if (!c) throw new Error(`Unknown category: ${slug}`);
  return c;
}
