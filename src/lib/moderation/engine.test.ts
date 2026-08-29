import { describe, it, expect } from "vitest";
import { normaliseForContactScan, textSimilarity } from "./checks/text";
import { isValidImei } from "./checks/device";
import { hamming } from "@/lib/hash/phash";

describe("contact-leak normalisation", () => {
  it("unmasks separated digits", () => {
    expect(normaliseForContactScan("call 98 76-54.32 10")).toContain("9876543210");
  });
  it("unmasks spelled-out digits", () => {
    expect(normaliseForContactScan("nine eight seven six five four three two one zero"))
      .toContain("9876543210");
  });
  it("unmasks romanised Hindi digits", () => {
    expect(normaliseForContactScan("nau aath saat chhe paanch char teen do ek shunya"))
      .toContain("9876543210");
  });
  it("leaves ordinary prose alone", () => {
    expect(normaliseForContactScan("Excellent condition laptop")).not.toMatch(/\d{10}/);
  });
});

describe("IMEI validation", () => {
  it("accepts a Luhn-valid IMEI", () => expect(isValidImei("490154203237518")).toBe(true));
  it("rejects a bad checksum", () => expect(isValidImei("490154203237519")).toBe(false));
  it("rejects wrong length", () => expect(isValidImei("12345")).toBe(false));
});

describe("text similarity", () => {
  it("detects a near-copy", () => {
    const a = "Selling my MacBook Air M2 in excellent condition with box and charger included";
    const b = "Selling my MacBook Air M2 in excellent condition with box and charger included today";
    expect(textSimilarity(a, b)).toBeGreaterThan(0.6);
  });
  it("scores unrelated text low", () => {
    expect(textSimilarity("Wooden dining table seats six", "iPhone 14 Pro 256GB purple")).toBeLessThan(0.1);
  });
});

describe("hamming distance", () => {
  it("is zero for identical hashes", () => expect(hamming("1".repeat(64), "1".repeat(64))).toBe(0));
  it("counts differing bits", () => expect(hamming("0000", "0011")).toBe(2));
});
