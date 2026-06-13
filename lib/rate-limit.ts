// Lightweight in-memory rate limiter for login endpoints.
// Note: per serverless instance. Good enough to blunt brute-force; for a hard
// global guarantee use a shared store (Upstash/Redis). Failures fail-open.

type Hit = { count: number; resetAt: number };
const buckets = new Map<string, Hit>();

// Opportunistic cleanup so the map doesn't grow unbounded.
function sweep(now: number) {
  if (buckets.size < 5000) return;
  for (const [k, v] of buckets) if (v.resetAt <= now) buckets.delete(k);
}

export interface RateResult {
  allowed: boolean;
  remaining: number;
  retryAfterSec: number;
}

/**
 * @param key       unique identifier (e.g. `login:<ip>:<employeeId>`)
 * @param limit     max attempts per window (default 5)
 * @param windowMs  window length in ms (default 15 min)
 */
export function rateLimit(key: string, limit = 5, windowMs = 15 * 60_000): RateResult {
  const now = Date.now();
  sweep(now);

  const hit = buckets.get(key);
  if (!hit || hit.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, retryAfterSec: 0 };
  }

  if (hit.count >= limit) {
    return { allowed: false, remaining: 0, retryAfterSec: Math.ceil((hit.resetAt - now) / 1000) };
  }

  hit.count += 1;
  return { allowed: true, remaining: limit - hit.count, retryAfterSec: 0 };
}

/** Clear a key's attempts (call on successful login). */
export function rateLimitReset(key: string) {
  buckets.delete(key);
}

/** Best-effort client IP from common proxy headers. */
export function clientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return req.headers.get("x-real-ip") || "unknown";
}
