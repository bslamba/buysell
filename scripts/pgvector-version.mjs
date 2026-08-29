/**
 * The pgvector version floor.
 *
 * The schema builds an HNSW index using `bit_hamming_ops` — that is how
 * duplicate-image search finds near-matching perceptual hashes. The operator
 * class arrived in pgvector 0.7.0. On anything older the migration dies with
 * `operator class "bit_hamming_ops" does not exist for access method "hnsw"`,
 * which mentions neither pgvector nor versions and leaves the schema
 * half-applied. Ubuntu still ships 0.6.0, so this is not hypothetical.
 *
 * Plain .mjs rather than .ts: check-db.mjs runs under bare `node`, before any
 * build step and on whatever Node the developer happens to have, so it must not
 * depend on TypeScript being loadable at runtime. The test suite imports this
 * same file, so the logic below is still covered.
 */
export const MIN_PGVECTOR = "0.7.0";

/** Compare the dotted version strings Postgres reports. Numeric, not textual:
 *  as text "0.10.0" sorts before "0.9.0", which would reject a newer build. */
export function atLeast(version, minimum) {
  const parts = (v) => String(v).split(".").map((n) => parseInt(n, 10) || 0);
  const a = parts(version), b = parts(minimum);
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    const d = (a[i] ?? 0) - (b[i] ?? 0);
    if (d !== 0) return d > 0;
  }
  return true;
}
