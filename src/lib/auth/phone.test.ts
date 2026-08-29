import { describe, it, expect } from "vitest";
import { normalisePhone, formatPhone, maskPhone } from "./phone";

describe("normalisePhone", () => {
  it("accepts a bare 10-digit number", () => {
    expect(normalisePhone("9876543210")).toBe("+919876543210");
  });
  it("accepts the common written forms", () => {
    for (const input of [
      "+91 98765 43210", "+919876543210", "09876543210",
      "919876543210", "(+91)-98765-43210", "98765 43210", "+91-9876543210",
    ]) {
      expect(normalisePhone(input), input).toBe("+919876543210");
    }
  });
  it("rejects numbers that do not start 6-9", () => {
    expect(normalisePhone("1234567890")).toBeNull();
    expect(normalisePhone("5876543210")).toBeNull();
  });
  it("rejects wrong lengths", () => {
    expect(normalisePhone("98765")).toBeNull();
    expect(normalisePhone("98765432101234")).toBeNull();
    expect(normalisePhone("")).toBeNull();
  });
  it("rejects a US number", () => {
    expect(normalisePhone("+1 415 555 0132")).toBeNull();
  });
});

describe("formatPhone / maskPhone", () => {
  it("formats for display", () => {
    expect(formatPhone("+919876543210")).toBe("+91 98765 43210");
  });
  it("masks the middle for logs", () => {
    const masked = maskPhone("+919876543210");
    expect(masked).not.toContain("876543");
    expect(masked).toContain("98");
    expect(masked).toContain("210");
  });
});
