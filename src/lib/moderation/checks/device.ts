import type { Check, CheckResult } from "../types";
import { createHash } from "node:crypto";

/** Luhn checksum — a valid IMEI always passes this. Free, instant, catches typos and fakes. */
export function isValidImei(imei: string): boolean {
  const digits = imei.replace(/\D/g, "");
  if (digits.length !== 15) return false;
  let sum = 0;
  for (let i = 0; i < 15; i++) {
    let d = Number(digits[i]);
    if (i % 2 === 1) { d *= 2; if (d > 9) d -= 9; }
    sum += d;
  }
  return sum % 10 === 0;
}

export function hashDeviceId(value: string, pepper = process.env.AUTH_SECRET ?? ""): string {
  return createHash("sha256").update(value.replace(/\s/g, "").toUpperCase() + pepper).digest("hex");
}

/**
 * Device identity checks.
 *
 * The IMEI is the closest thing to a passport a phone has. Three things matter:
 *   1. Is it structurally valid (Luhn)?
 *   2. Is it on the government's CEIR / Sanchar Saathi stolen-and-blocked list?
 *   3. Has it already been listed or sold on WorthIt?
 *
 * Check 2 is the one no competitor does at listing time, and it is the difference
 * between a marketplace and a fence.
 */
export const deviceIdentityCheck: Check = async (ctx) => {
  const out: CheckResult[] = [];
  const { category, listing } = ctx;

  if (category.requiresImei) {
    const imei = listing.imei?.trim();
    if (!imei) {
      out.push({
        key: "device.imei_missing", passed: false, severity: "blocker", scoreDelta: 100,
        message: "An IMEI is required for phone listings. Dial *#06# on the device to see it.",
        sellerFixable: true,
      });
      return out;
    }
    if (!isValidImei(imei)) {
      out.push({
        key: "device.imei_invalid", passed: false, severity: "blocker", scoreDelta: 100,
        message: "That IMEI fails its checksum, so it is not a real IMEI. Please re-enter it.",
        sellerFixable: true,
      });
      return out;
    }

    const ceir = await ctx.services.checkCeir(imei);
    if (ceir.status === "blocked") {
      out.push({
        key: "device.ceir_blocked", passed: false, severity: "blocker", scoreDelta: 100,
        message: "This IMEI is on the Government of India CEIR blocked list — the device is reported lost or stolen.",
        detail: { ceirStatus: ceir.status }, sellerFixable: false,
      });
      return out;
    }
    out.push({
      key: "device.ceir", passed: true, severity: "info", scoreDelta: ceir.status === "unknown" ? 5 : 0,
      message: ceir.status === "clean"
        ? "IMEI is not on the CEIR blocked list."
        : "CEIR lookup was unavailable; recheck before the item ships.",
      detail: { ceirStatus: ceir.status },
    });
  }

  if (category.requiresSerial && !listing.serial?.trim()) {
    out.push({
      key: "device.serial_missing", passed: false, severity: "blocker", scoreDelta: 100,
      message: `A serial number is required for ${category.label}.`, sellerFixable: true,
    });
  }

  const imeiHash = listing.imei ? hashDeviceId(listing.imei) : undefined;
  const serialHash = listing.serial ? hashDeviceId(listing.serial) : undefined;
  if (imeiHash || serialHash) {
    const dupes = await ctx.services.findDeviceIdMatches(imeiHash, serialHash);
    for (const d of dupes) {
      if (d.listingId === listing.id) continue;
      const sameSeller = d.sellerId === listing.sellerId;
      out.push({
        key: sameSeller ? "device.relisted" : "device.id_other_seller",
        passed: false,
        severity: sameSeller ? "medium" : "blocker",
        scoreDelta: sameSeller ? 15 : 100,
        message: sameSeller
          ? "You already have a live listing for this exact device."
          : "This device identifier is already listed by a different seller. One of the two listings is not genuine.",
        detail: { matchedListingId: d.listingId, status: d.status },
        sellerFixable: sameSeller,
      });
    }
  }

  if (out.length === 0) {
    out.push({ key: "device.identity", passed: true, severity: "info", scoreDelta: 0, message: "Device identity checks passed." });
  }
  return out;
};
