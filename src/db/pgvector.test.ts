import { describe, it, expect } from "vitest";
import { atLeast, MIN_PGVECTOR } from "../../scripts/pgvector-version.mjs";

describe("pgvector version gate", () => {
  it("rejects the 0.6.0 Ubuntu ships, which lacks bit_hamming_ops", () => {
    expect(atLeast("0.6.0", MIN_PGVECTOR)).toBe(false);
  });

  it("accepts the minimum and anything newer", () => {
    for (const v of ["0.7.0", "0.8.0", "1.0.0"]) expect(atLeast(v, MIN_PGVECTOR)).toBe(true);
  });

  it("compares numerically, not as text — 0.10 is newer than 0.9", () => {
    expect(atLeast("0.10.0", "0.9.0")).toBe(true);
    expect(atLeast("0.9.0", "0.10.0")).toBe(false);
  });

  it("treats a missing patch segment as zero", () => {
    expect(atLeast("0.7", "0.7.0")).toBe(true);
    expect(atLeast("0.7", "0.7.1")).toBe(false);
  });
});
