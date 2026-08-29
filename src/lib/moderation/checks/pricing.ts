import type { Check, CheckResult } from "../types";

/** Normalised key used to group comparable devices for price statistics. */
export function variantKey(categorySlug: string, attrs: Record<string, unknown>): string {
  const part = (k: string) => String(attrs[k] ?? "").toLowerCase().replace(/\s+/g, "");
  return [categorySlug, part("brand"), part("model"), part("ram_gb"), part("storage_gb")]
    .filter(Boolean).join("|");
}

/**
 * Price sanity.
 *
 * Underpricing is the single strongest fraud signal in Indian classifieds — the
 * scammer needs the deal to look irresistible, because they are never going to
 * ship anything. A phone priced at 35% of its market median is far more likely to
 * be bait than a bargain.
 */
export const priceCheck: Check = async (ctx) => {
  const out: CheckResult[] = [];
  const { pricePaise } = ctx.listing;
  const { category } = ctx;

  if (pricePaise < category.minPricePaise || pricePaise > category.maxPricePaise) {
    out.push({
      key: "price.out_of_band",
      passed: false, severity: "blocker", scoreDelta: 100,
      message: `Price must be between ₹${(category.minPricePaise / 100).toLocaleString("en-IN")} and ₹${(category.maxPricePaise / 100).toLocaleString("en-IN")} for ${category.label}.`,
      sellerFixable: true,
    });
    return out;
  }

  const key = variantKey(ctx.listing.categorySlug, ctx.listing.attributes);
  const stats = await ctx.services.getPriceStats(key, ctx.listing.condition);

  if (!stats || stats.sampleSize < 5) {
    out.push({
      key: "price.no_baseline", passed: true, severity: "info", scoreDelta: 0,
      message: "Not enough comparable sales yet to price-check this model.",
      detail: { variantKey: key, sampleSize: stats?.sampleSize ?? 0 },
    });
    return out;
  }

  const ratio = pricePaise / stats.medianPaise;

  if (ratio < 0.4) {
    out.push({
      key: "price.suspiciously_low",
      passed: false, severity: "blocker", scoreDelta: 100,
      message: `Priced at ${Math.round(ratio * 100)}% of the market median (₹${(stats.medianPaise / 100).toLocaleString("en-IN")}). Listings this far below market are almost always fraudulent.`,
      detail: { ratio, medianPaise: stats.medianPaise, sampleSize: stats.sampleSize },
      sellerFixable: false,
    });
  } else if (ratio < 0.6) {
    out.push({
      key: "price.below_market",
      passed: false, severity: "high", scoreDelta: 30,
      message: `Priced ${Math.round((1 - ratio) * 100)}% below the market median. Needs a human look.`,
      detail: { ratio, medianPaise: stats.medianPaise },
      sellerFixable: false,
    });
  } else if (ratio > 1.6) {
    out.push({
      key: "price.above_market",
      passed: false, severity: "low", scoreDelta: 5,
      message: `Priced ${Math.round((ratio - 1) * 100)}% above the market median — it will be slow to sell.`,
      detail: { ratio, medianPaise: stats.medianPaise },
      sellerFixable: true,
    });
  } else {
    out.push({
      key: "price.in_band", passed: true, severity: "info", scoreDelta: 0,
      message: `Priced within the normal range (median ₹${(stats.medianPaise / 100).toLocaleString("en-IN")}, n=${stats.sampleSize}).`,
      detail: { ratio: Number(ratio.toFixed(2)) },
    });
  }
  return out;
};

/** Every required attribute for the category must be present and non-empty. */
export const attributeCheck: Check = async (ctx) => {
  const missing = ctx.category.requiredAttributes.filter((a) => {
    const v = ctx.listing.attributes[a];
    return v === undefined || v === null || String(v).trim() === "";
  });
  if (missing.length > 0) {
    return [{
      key: "attr.required_missing",
      passed: false, severity: "blocker", scoreDelta: 100,
      message: `Missing required details: ${missing.join(", ")}.`,
      detail: { missing }, sellerFixable: true,
    }];
  }
  return [{ key: "attr.required", passed: true, severity: "info", scoreDelta: 0, message: "All required details provided." }];
};
