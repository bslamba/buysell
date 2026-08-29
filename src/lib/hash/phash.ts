import sharp from "sharp";
import { createHash } from "node:crypto";

/**
 * Image fingerprinting.
 *
 * Three fingerprints per image, each catching a different cheat:
 *
 *  sha256  — byte-identical re-upload. Free, instant, catches the lazy copier.
 *  dHash   — gradient hash. Robust to resize/compression, cheap. Catches
 *            "I saved the photo and re-uploaded it".
 *  pHash   — DCT hash. Robust to resize, compression, small crops, brightness
 *            and mild colour shifts. Catches "I screenshotted it, cropped a
 *            border and added a filter" — the actual behaviour we're defending
 *            against.
 *
 * Both perceptual hashes are 64-bit, returned as a 64-character '0'/'1' string
 * so they drop straight into a Postgres `bit(64)` column, where pgvector's
 * `bit_hamming_ops` gives us an indexed nearest-neighbour search.
 *
 * Typical Hamming distances between a 64-bit pHash pair:
 *    0      identical image
 *    1-6    same photo, re-encoded / resized / lightly edited   <- treat as duplicate
 *    7-12   same scene or same product shot, different frame    <- flag for human
 *    >12    unrelated images
 */

export interface Fingerprints {
  sha256: string;
  phash: string; // 64 chars of '0'|'1'
  dhash: string; // 64 chars of '0'|'1'
  width: number;
  height: number;
  bytes: number;
  format: string;
}

/** Precomputed 32x32 DCT-II cosine table. */
const N = 32;
const COS: number[][] = Array.from({ length: N }, (_, u) =>
  Array.from({ length: N }, (_, x) => Math.cos(((2 * x + 1) * u * Math.PI) / (2 * N))),
);

function dct2d(pixels: number[][]): number[][] {
  // Rows, then columns. O(2 * N^3) but N=32 so this is ~65k ops — microseconds.
  const rows: number[][] = Array.from({ length: N }, () => new Array(N).fill(0));
  for (let y = 0; y < N; y++) {
    for (let u = 0; u < N; u++) {
      let sum = 0;
      for (let x = 0; x < N; x++) sum += pixels[y][x] * COS[u][x];
      rows[y][u] = sum * (u === 0 ? Math.SQRT1_2 : 1);
    }
  }
  const out: number[][] = Array.from({ length: N }, () => new Array(N).fill(0));
  for (let u = 0; u < N; u++) {
    for (let v = 0; v < N; v++) {
      let sum = 0;
      for (let y = 0; y < N; y++) sum += rows[y][u] * COS[v][y];
      out[v][u] = sum * (v === 0 ? Math.SQRT1_2 : 1);
    }
  }
  return out;
}

function median(values: number[]): number {
  const s = [...values].sort((a, b) => a - b);
  const mid = s.length >> 1;
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

export async function computePHash(input: Buffer): Promise<string> {
  const raw = await sharp(input).greyscale().resize(N, N, { fit: "fill" }).raw().toBuffer();
  const px: number[][] = [];
  for (let y = 0; y < N; y++) {
    const row: number[] = [];
    for (let x = 0; x < N; x++) row.push(raw[y * N + x]);
    px.push(row);
  }
  const d = dct2d(px);

  // Low-frequency 8x8 block, skipping the DC term (index 0,0) which only
  // encodes overall brightness and would make the hash sensitive to exposure.
  const coeffs: number[] = [];
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      if (x === 0 && y === 0) continue;
      coeffs.push(d[y][x]);
    }
  }
  const med = median(coeffs);
  const bits = coeffs.map((c) => (c > med ? "1" : "0"));
  bits.push("0"); // pad 63 -> 64
  return bits.join("");
}

export async function computeDHash(input: Buffer): Promise<string> {
  const w = 9, h = 8;
  const raw = await sharp(input).greyscale().resize(w, h, { fit: "fill" }).raw().toBuffer();
  let bits = "";
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w - 1; x++) {
      bits += raw[y * w + x] < raw[y * w + x + 1] ? "1" : "0";
    }
  }
  return bits; // 8 * 8 = 64
}

export async function fingerprint(input: Buffer): Promise<Fingerprints> {
  const meta = await sharp(input).metadata();
  const [phash, dhash] = await Promise.all([computePHash(input), computeDHash(input)]);
  return {
    sha256: createHash("sha256").update(input).digest("hex"),
    phash,
    dhash,
    width: meta.width ?? 0,
    height: meta.height ?? 0,
    bytes: input.byteLength,
    format: meta.format ?? "unknown",
  };
}

/** Hamming distance between two equal-length bit strings. */
export function hamming(a: string, b: string): number {
  if (a.length !== b.length) throw new Error("hash length mismatch");
  let d = 0;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) d++;
  return d;
}

/**
 * Blur estimate via variance of the Laplacian. Low variance = out of focus.
 * Blurry photos are both a quality problem and a classic way to hide defects.
 */
export async function blurScore(input: Buffer): Promise<number> {
  const size = 256;
  const raw = await sharp(input).greyscale().resize(size, size, { fit: "fill" }).raw().toBuffer();
  const lap: number[] = [];
  for (let y = 1; y < size - 1; y++) {
    for (let x = 1; x < size - 1; x++) {
      const i = y * size + x;
      lap.push(-4 * raw[i] + raw[i - 1] + raw[i + 1] + raw[i - size] + raw[i + size]);
    }
  }
  const mean = lap.reduce((s, v) => s + v, 0) / lap.length;
  return lap.reduce((s, v) => s + (v - mean) ** 2, 0) / lap.length;
}

/**
 * Fraction of pixels that are near-white. Catalogue and stock product shots sit
 * on a pure white cyclorama; a real photo taken on a desk almost never does.
 */
export async function whiteBackgroundRatio(input: Buffer): Promise<number> {
  const size = 128;
  const raw = await sharp(input).greyscale().resize(size, size, { fit: "fill" }).raw().toBuffer();
  let white = 0;
  for (let i = 0; i < raw.length; i++) if (raw[i] > 245) white++;
  return white / raw.length;
}
