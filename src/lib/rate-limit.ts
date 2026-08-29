import { env } from "@/env";

/**
 * Rate limiting.
 *
 * Upstash when configured, a bounded in-memory window otherwise so local
 * development works with no accounts. The in-memory path is explicitly NOT
 * safe across serverless instances — `assertProductionEnv()` refuses to start
 * production without Upstash for exactly that reason.
 */

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  resetAt: number;
}

type Bucket = { count: number; resetAt: number };
const memory = new Map<string, Bucket>();

function memoryLimit(key: string, limit: number, windowSec: number): RateLimitResult {
  const now = Date.now();
  const existing = memory.get(key);
  if (!existing || existing.resetAt <= now) {
    const bucket = { count: 1, resetAt: now + windowSec * 1000 };
    memory.set(key, bucket);
    if (memory.size > 10_000) {
      for (const [k, v] of memory) if (v.resetAt <= now) memory.delete(k);
    }
    return { ok: true, remaining: limit - 1, resetAt: bucket.resetAt };
  }
  existing.count += 1;
  return { ok: existing.count <= limit, remaining: Math.max(0, limit - existing.count), resetAt: existing.resetAt };
}

async function upstashLimit(key: string, limit: number, windowSec: number): Promise<RateLimitResult> {
  const url = env().UPSTASH_REDIS_REST_URL!;
  const token = env().UPSTASH_REDIS_REST_TOKEN!;
  const res = await fetch(`${url}/pipeline`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify([["INCR", key], ["EXPIRE", key, windowSec, "NX"], ["TTL", key]]),
    cache: "no-store",
  });
  if (!res.ok) {
    // Fail open on a limiter outage — better a brief loss of throttling than a
    // total outage of sign-in. The attempt is still logged upstream.
    return { ok: true, remaining: limit, resetAt: Date.now() + windowSec * 1000 };
  }
  const body = (await res.json()) as { result: number }[];
  const count = Number(body[0]?.result ?? 1);
  const ttl = Number(body[2]?.result ?? windowSec);
  return { ok: count <= limit, remaining: Math.max(0, limit - count), resetAt: Date.now() + ttl * 1000 };
}

export async function rateLimit(
  namespace: string,
  identifier: string,
  limit: number,
  windowSec: number,
): Promise<RateLimitResult> {
  const key = `rl:${namespace}:${identifier}`;
  const e = env();
  if (e.UPSTASH_REDIS_REST_URL && e.UPSTASH_REDIS_REST_TOKEN) {
    return upstashLimit(key, limit, windowSec);
  }
  return memoryLimit(key, limit, windowSec);
}

/** Named policies, so limits live in one place instead of scattered magic numbers. */
export const LIMITS = {
  otpRequestPerPhone: { limit: 3, windowSec: 3600 },
  otpRequestPerIp: { limit: 10, windowSec: 3600 },
  otpVerifyPerPhone: { limit: 10, windowSec: 900 },
  listingCreatePerUser: { limit: 20, windowSec: 3600 },
  bidPerUser: { limit: 60, windowSec: 60 },
  messagePerUser: { limit: 30, windowSec: 300 },
} as const;
