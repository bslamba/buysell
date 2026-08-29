import { randomUUID } from "node:crypto";
import type { Check, CheckResult, Decision, ModerationContext, ModerationRun } from "./types";
import { imageDuplicateCheck, imageQualityCheck, exifCheck } from "./checks/images";
import { contactLeakCheck, scamPhraseCheck, prohibitedCheck, textQualityCheck } from "./checks/text";
import { priceCheck, attributeCheck } from "./checks/pricing";
import { deviceIdentityCheck } from "./checks/device";
import { sellerRiskCheck } from "./checks/seller";

/**
 * The review pipeline.
 *
 * Every listing submission runs every check. Checks are pure functions of the
 * context, run in parallel, and never throw — a check that fails to execute
 * degrades to "couldn't verify" rather than taking the pipeline down, because a
 * vision API outage must not stop the marketplace.
 *
 * Outcome is decided by two things:
 *   • Any BLOCKER  -> reject. No score arithmetic, no human queue.
 *   • Otherwise a summed risk score, category-weighted, decides
 *     auto-approve / human-review.
 *
 * Every result is persisted to moderation_events, so any decision — machine or
 * human — can be reconstructed months later. That audit trail is what lets you
 * safely raise the auto-approve rate over time.
 */

export const ALL_CHECKS: { key: string; fn: Check }[] = [
  { key: "seller", fn: sellerRiskCheck },
  { key: "attributes", fn: attributeCheck },
  { key: "prohibited", fn: prohibitedCheck },
  { key: "contact", fn: contactLeakCheck },
  { key: "scam", fn: scamPhraseCheck },
  { key: "textQuality", fn: textQualityCheck },
  { key: "price", fn: priceCheck },
  { key: "device", fn: deviceIdentityCheck },
  { key: "imageDuplicate", fn: imageDuplicateCheck },
  { key: "imageQuality", fn: imageQualityCheck },
  { key: "exif", fn: exifCheck },
];

const AUTO_APPROVE_MAX = Number(process.env.AUTOAPPROVE_MAX_RISK_SCORE ?? 25);
const AUTO_REJECT_MIN = Number(process.env.AUTOREJECT_MIN_RISK_SCORE ?? 80);

export async function runModeration(ctx: ModerationContext): Promise<ModerationRun> {
  const startedAt = new Date();
  const runId = randomUUID();

  const settled = await Promise.all(
    ALL_CHECKS.map(async ({ key, fn }) => {
      const t0 = Date.now();
      try {
        const results = await fn(ctx);
        return results.map((r) => ({ ...r, detail: { ...r.detail, _ms: Date.now() - t0 } }));
      } catch (err) {
        // A check that crashes is treated as "unverified", never as "passed".
        return [{
          key: `${key}.error`,
          passed: false,
          severity: "medium" as const,
          scoreDelta: 10,
          message: `Automated check "${key}" could not run and needs a manual look.`,
          detail: { error: err instanceof Error ? err.message : String(err) },
        }];
      }
    }),
  );

  const results: CheckResult[] = settled.flat();
  const blockers = results.filter((r) => !r.passed && r.severity === "blocker");

  const rawScore = results.filter((r) => !r.passed).reduce((s, r) => s + r.scoreDelta, 0);
  const weighted = Math.round(rawScore * ctx.category.riskMultiplier);
  const trustRelief = Math.round(Math.max(0, ctx.seller.trustScore - 50) / 5); // up to -10
  const riskScore = Math.max(0, Math.min(100, weighted - trustRelief));

  let decision: Decision;
  if (blockers.length > 0 || riskScore >= AUTO_REJECT_MIN) decision = "reject";
  else if (riskScore <= AUTO_APPROVE_MAX && isAutoApproveEligible(ctx)) decision = "approve";
  else decision = "flag";

  return {
    runId,
    listingId: ctx.listing.id,
    decision,
    riskScore,
    results,
    blockers,
    reviewPriority: computePriority(ctx, riskScore, decision),
    startedAt,
    durationMs: Date.now() - startedAt.getTime(),
  };
}

/**
 * Auto-approve is a privilege, not a default. A listing skips the human queue
 * only when the seller has a track record AND the category tolerates it.
 * Everything from a brand-new account gets human eyes, always.
 */
export function isAutoApproveEligible(ctx: ModerationContext): boolean {
  const { seller, category, listing } = ctx;
  if (!seller.phoneVerifiedAt) return false;
  if (seller.listingsApproved < 3) return false;
  if (seller.trustScore < 60) return false;
  if (category.tier === "certified" && listing.pricePaise > 75_000 * 100) return false;
  const ageDays = (Date.now() - seller.createdAt.getTime()) / 86_400_000;
  if (ageDays < 7) return false;
  return true;
}

/**
 * Queue ordering. Moderator time is the scarce resource, so the queue is sorted
 * by where a human adds the most value — not first-in-first-out.
 *   • High-value items first (a wrong call costs more).
 *   • Genuinely ambiguous scores (40-70) before obvious ones.
 *   • Trusted sellers first, so good supply goes live fast.
 */
export function computePriority(ctx: ModerationContext, riskScore: number, decision: Decision): number {
  let p = 50;
  const rupees = ctx.listing.pricePaise / 100;
  if (rupees >= 100_000) p += 25;
  else if (rupees >= 40_000) p += 15;
  else if (rupees >= 10_000) p += 5;

  if (riskScore >= 40 && riskScore <= 70) p += 15;   // the ambiguous middle
  if (decision === "reject") p -= 20;                 // already decided
  if (ctx.seller.trustScore >= 70) p += 10;
  if (ctx.seller.listingsApproved === 0) p += 8;      // first impressions matter
  if (ctx.category.tier === "certified") p += 8;

  return Math.max(0, Math.min(100, p));
}

/** SLA target by priority. Shown in the admin queue and tracked as a KPI. */
export function slaHours(priority: number): number {
  if (priority >= 80) return 2;
  if (priority >= 60) return 6;
  if (priority >= 40) return 12;
  return 24;
}

/** The seller-facing summary. Never leaks detection thresholds or internals. */
export function sellerFeedback(run: ModerationRun): { headline: string; items: string[] } {
  const failures = run.results.filter((r) => !r.passed && r.sellerFixable);
  if (run.decision === "approve") return { headline: "Your listing is live.", items: [] };
  if (run.decision === "flag") {
    return {
      headline: "Your listing is being reviewed. This usually takes a few hours.",
      items: failures.map((f) => f.message),
    };
  }
  return {
    headline: failures.length > 0
      ? "Your listing could not be published. Fix the points below and resubmit."
      : "Your listing could not be published. Contact support if you think this is wrong.",
    items: failures.map((f) => f.message),
  };
}
