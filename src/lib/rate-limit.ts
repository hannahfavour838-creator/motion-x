import "server-only";
import { createHash } from "node:crypto";
import { headers } from "next/headers";

/**
 * Best-effort, per-instance sliding-window limiter for Server Actions. The
 * database enforces the authoritative per-email / per-account limits; this
 * layer adds a per-IP limit and absorbs bursts before they reach the DB.
 * For multi-region production traffic, back this with a shared store.
 */
const buckets = new Map<string, number[]>();

export async function clientKey(): Promise<string> {
  const h = await headers();
  // x-real-ip is set by the platform/proxy from the connection; the leftmost
  // x-forwarded-for entry can be supplied by the client outside Vercel.
  const ip = h.get("x-real-ip")?.trim() || h.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const salt = process.env.RATE_LIMIT_SALT || "motion-x";
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex").slice(0, 32);
}

export async function rateLimit(action: string, max: number, windowMs: number): Promise<boolean> {
  const key = `${action}:${await clientKey()}`;
  const now = Date.now();
  const hits = (buckets.get(key) ?? []).filter((t) => now - t < windowMs);
  if (hits.length >= max) {
    buckets.set(key, hits);
    return false;
  }
  hits.push(now);
  buckets.set(key, hits);
  if (buckets.size > 10_000) {
    for (const [k, v] of buckets) if (!v.some((t) => now - t < windowMs)) buckets.delete(k);
  }
  return true;
}

/** Simple bot checks: a hidden honeypot field and a minimum time-to-submit. */
export function looksAutomated(fd: FormData, minMs = 2500): boolean {
  if (String(fd.get("website") ?? "").length > 0) return true;
  const started = Number(fd.get("started_at"));
  return !Number.isFinite(started) || Date.now() - started < minMs;
}
