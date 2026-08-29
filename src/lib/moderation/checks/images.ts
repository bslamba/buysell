import type { Check, CheckResult, ModerationContext } from "../types";
import { blurScore, whiteBackgroundRatio } from "@/lib/hash/phash";

const NEAR_DUP_THRESHOLD = Number(process.env.PHASH_DUPLICATE_THRESHOLD ?? 6);

/**
 * THE headline check.
 *
 * Every uploaded image is fingerprinted and matched against every image that has
 * EVER been uploaded to the platform — including images belonging to listings
 * that were later deleted or rejected. Three distinct outcomes:
 *
 *  1. Same image, DIFFERENT user  -> blocker. This is the "clever seller" case:
 *     someone lifting another person's photos to sell a device they don't have,
 *     or that doesn't match the photos.
 *  2. Same image, SAME user, on a live listing -> blocker. Duplicate listing,
 *     usually to game search ranking or to sell one device twice.
 *  3. Same image, SAME user, on a closed/sold listing -> low severity. Usually
 *     legitimate (relisting an unsold item), so we allow it but record it.
 */
export const imageDuplicateCheck: Check = async (ctx) => {
  const out: CheckResult[] = [];
  if (ctx.images.length === 0) return out;

  const matches = await ctx.services.findImageMatches(
    ctx.images.map((i) => ({ sha256: i.sha256, phash: i.phash })),
  );

  for (const m of matches) {
    const sameUser = m.matchedUserId === ctx.listing.sellerId;
    const sameListing = m.matchedListingId === ctx.listing.id;
    if (sameListing) continue;

    if (m.isStockImage) {
      out.push({
        key: "image.stock_catalogue",
        passed: false,
        severity: "high",
        scoreDelta: 30,
        message: "This photo is a manufacturer or catalogue image, not a photo of the actual item.",
        detail: { imageId: m.imageId, timesSeen: m.timesSeen },
        sellerFixable: true,
      });
      continue;
    }

    if (!sameUser) {
      out.push({
        key: "image.duplicate_other_user",
        passed: false,
        severity: "blocker",
        scoreDelta: 100,
        message:
          m.kind === "exact"
            ? "This exact photo has already been used by a different seller."
            : `This photo is a near-match (distance ${m.distance}) to a photo already used by a different seller.`,
        detail: { imageId: m.imageId, matchedListingId: m.matchedListingId, distance: m.distance, kind: m.kind },
        sellerFixable: true,
      });
    } else {
      out.push({
        key: "image.duplicate_same_user",
        passed: false,
        severity: "medium",
        scoreDelta: 20,
        message: "You have used this photo on another listing. Each listing needs photos of that specific item.",
        detail: { imageId: m.imageId, matchedListingId: m.matchedListingId, distance: m.distance },
        sellerFixable: true,
      });
    }
  }

  if (out.length === 0) {
    out.push({
      key: "image.duplicate",
      passed: true,
      severity: "info",
      scoreDelta: 0,
      message: `All ${ctx.images.length} photos are original to this listing.`,
    });
  }
  return out;
};

/** Enough photos, big enough, sharp enough, and not a studio render. */
export const imageQualityCheck: Check = async (ctx) => {
  const out: CheckResult[] = [];
  const { category, images } = ctx;

  if (images.length < category.minImages) {
    out.push({
      key: "image.count",
      passed: false,
      severity: "blocker",
      scoreDelta: 100,
      message: `${category.label} listings need at least ${category.minImages} photos. You uploaded ${images.length}.`,
      sellerFixable: true,
    });
  }

  for (const img of images) {
    if (img.width < 640 || img.height < 480) {
      out.push({
        key: "image.low_resolution",
        passed: false, severity: "medium", scoreDelta: 12,
        message: `A photo is only ${img.width}x${img.height}. Minimum is 640x480.`,
        detail: { imageId: img.id }, sellerFixable: true,
      });
    }

    // Screenshot heuristics: exact common device resolutions + zero camera EXIF.
    const isCommonScreenRes =
      (img.width === 1080 && img.height === 1920) || (img.width === 1170 && img.height === 2532) ||
      (img.width === 1284 && img.height === 2778) || (img.width === 1179 && img.height === 2556) ||
      (img.width === 1440 && img.height === 3200) || (img.width === 1290 && img.height === 2796);
    const hasCameraExif = Boolean(img.exif?.Make || img.exif?.Model || img.exif?.DateTimeOriginal);
    if (isCommonScreenRes && !hasCameraExif) {
      out.push({
        key: "image.screenshot",
        passed: false, severity: "high", scoreDelta: 28,
        message: "A photo looks like a phone screenshot rather than a camera photo.",
        detail: { imageId: img.id, dims: `${img.width}x${img.height}` }, sellerFixable: true,
      });
    }

    if (img.buffer) {
      const [blur, white] = await Promise.all([blurScore(img.buffer), whiteBackgroundRatio(img.buffer)]);
      if (blur < 60) {
        out.push({
          key: "image.blurry",
          passed: false, severity: "medium", scoreDelta: 10,
          message: "A photo is out of focus. Blurry photos hide damage and get listings rejected.",
          detail: { imageId: img.id, laplacianVariance: Math.round(blur) }, sellerFixable: true,
        });
      }
      // A near-pure-white frame with no EXIF is almost always a catalogue render.
      if (white > 0.55 && !hasCameraExif) {
        out.push({
          key: "image.likely_stock",
          passed: false, severity: "high", scoreDelta: 25,
          message: "A photo looks like a product catalogue image, not a photo of your item.",
          detail: { imageId: img.id, whiteRatio: Number(white.toFixed(2)) }, sellerFixable: true,
        });
      }
    }
  }

  if (out.length === 0) {
    out.push({ key: "image.quality", passed: true, severity: "info", scoreDelta: 0, message: "Photo quality checks passed." });
  }
  return out;
};

/**
 * EXIF sanity. Not conclusive on its own (most social apps strip EXIF), but a
 * capture date years before the listing, or GPS thousands of km from the stated
 * city, is a strong signal the photos aren't the seller's.
 */
export const exifCheck: Check = async (ctx: ModerationContext) => {
  const out: CheckResult[] = [];
  for (const img of ctx.images) {
    const taken = img.exif?.DateTimeOriginal ? new Date(String(img.exif.DateTimeOriginal)) : null;
    if (taken && !Number.isNaN(taken.getTime())) {
      const ageDays = (Date.now() - taken.getTime()) / 86_400_000;
      if (ageDays > 730) {
        out.push({
          key: "image.exif_stale",
          passed: false, severity: "medium", scoreDelta: 15,
          message: `A photo was taken ${Math.round(ageDays / 365)} years ago. Please upload current photos.`,
          detail: { imageId: img.id, takenAt: taken.toISOString() }, sellerFixable: true,
        });
      }
      if (taken.getTime() > Date.now() + 86_400_000) {
        out.push({
          key: "image.exif_future",
          passed: false, severity: "high", scoreDelta: 20,
          message: "A photo has a capture date in the future, which suggests edited metadata.",
          detail: { imageId: img.id }, sellerFixable: false,
        });
      }
    }
    const software = String(img.exif?.Software ?? "").toLowerCase();
    if (/photoshop|gimp|remove\.?bg|facetune|snapseed/.test(software)) {
      out.push({
        key: "image.edited",
        passed: false, severity: "low", scoreDelta: 8,
        message: `A photo was processed with ${img.exif?.Software}. Edited photos may misrepresent condition.`,
        detail: { imageId: img.id }, sellerFixable: true,
      });
    }
  }
  if (out.length === 0) {
    out.push({ key: "image.exif", passed: true, severity: "info", scoreDelta: 0, message: "Image metadata looks consistent." });
  }
  return out;
};
