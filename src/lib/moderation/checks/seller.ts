import type { Check, CheckResult } from "../types";

/**
 * Seller-side risk.
 *
 * Most fraud is not one bad listing — it is one bad account posting twenty
 * listings in an hour. These checks look at the human, not the item.
 */
export const sellerRiskCheck: Check = async (ctx) => {
  const out: CheckResult[] = [];
  const { seller, category, listing } = ctx;

  if (seller.bannedAt) {
    return [{
      key: "seller.banned", passed: false, severity: "blocker", scoreDelta: 100,
      message: "This account is banned.", sellerFixable: false,
    }];
  }

  if (category.requiresPhoneVerified && !seller.phoneVerifiedAt) {
    out.push({
      key: "seller.phone_unverified", passed: false, severity: "blocker", scoreDelta: 100,
      message: "Verify your phone number before publishing a listing.", sellerFixable: true,
    });
  }

  if (category.requiresKycAbovePaise && listing.pricePaise >= category.requiresKycAbovePaise && seller.kyc !== "verified") {
    out.push({
      key: "seller.kyc_required", passed: false, severity: "blocker", scoreDelta: 100,
      message: `Items above ₹${(category.requiresKycAbovePaise / 100).toLocaleString("en-IN")} need ID verification before they go live.`,
      sellerFixable: true,
    });
  }

  const accountAgeHours = (Date.now() - seller.createdAt.getTime()) / 3_600_000;
  if (accountAgeHours < 24) {
    out.push({
      key: "seller.new_account", passed: false, severity: "medium", scoreDelta: 15,
      message: `Account is ${Math.round(accountAgeHours)}h old. First listings always get a human review.`,
      detail: { accountAgeHours: Math.round(accountAgeHours) }, sellerFixable: false,
    });
  }

  const recent = await ctx.services.countRecentListings(seller.id, 24);
  const velocityLimit = seller.trustScore >= 70 ? 25 : seller.trustScore >= 40 ? 10 : 4;
  if (recent >= velocityLimit) {
    out.push({
      key: "seller.velocity", passed: false,
      severity: recent >= velocityLimit * 2 ? "blocker" : "high",
      scoreDelta: recent >= velocityLimit * 2 ? 100 : 30,
      message: `${recent} listings in the last 24 hours (limit ${velocityLimit} at your trust level).`,
      detail: { recent, velocityLimit, trustScore: seller.trustScore }, sellerFixable: false,
    });
  }

  const totalReviewed = seller.listingsApproved + seller.listingsRejected;
  if (totalReviewed >= 5) {
    const rejectRate = seller.listingsRejected / totalReviewed;
    if (rejectRate > 0.4) {
      out.push({
        key: "seller.high_reject_rate", passed: false, severity: "high", scoreDelta: 25,
        message: `${Math.round(rejectRate * 100)}% of this seller's listings have been rejected.`,
        detail: { rejectRate: Number(rejectRate.toFixed(2)), totalReviewed }, sellerFixable: false,
      });
    }
  }

  if (seller.disputesLost >= 2) {
    out.push({
      key: "seller.disputes", passed: false, severity: "high", scoreDelta: 30,
      message: `Seller has lost ${seller.disputesLost} buyer disputes.`,
      detail: { disputesLost: seller.disputesLost }, sellerFixable: false,
    });
  }

  if (out.length === 0) {
    out.push({
      key: "seller.risk", passed: true, severity: "info", scoreDelta: 0,
      message: `Seller trust score ${seller.trustScore}/100, ${seller.listingsApproved} listings approved.`,
    });
  }
  return out;
};
