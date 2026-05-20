import { eq } from "drizzle-orm";
import type { Db } from "@/db";
import { ttsRateLimit } from "@/db/schema";

export type RateLimitResult =
  | { ok: true; remaining: number; resetAt: number }
  | { ok: false; retryAfterSeconds: number };

export type RateLimitOptions = {
  /** Subject identifier (e.g. user id, IP). */
  subject: string;
  /** Window length in seconds. */
  windowSeconds: number;
  /** Max requests allowed in the window. */
  max: number;
  /** Optional tag to separate counters (e.g. "tts:gen" vs "tts:read"). */
  scope?: string;
};

/**
 * Fixed-window limiter backed by D1. Each (subject, scope, window) combination is a row.
 * Old rows are not actively cleaned — they're harmless and the bucket key changes every window,
 * so they age out naturally. A periodic cleanup job can be added if the table grows large.
 */
export async function checkRateLimit(
  db: Db,
  opts: RateLimitOptions,
): Promise<RateLimitResult> {
  const nowSec = Math.floor(Date.now() / 1000);
  const windowStart = nowSec - (nowSec % opts.windowSeconds);
  const resetAt = windowStart + opts.windowSeconds;
  const scope = opts.scope ?? "default";
  const bucketKey = `${scope}:${opts.subject}:${windowStart}`;

  const existing = await db
    .select()
    .from(ttsRateLimit)
    .where(eq(ttsRateLimit.bucketKey, bucketKey))
    .get();

  if (!existing) {
    await db
      .insert(ttsRateLimit)
      .values({ bucketKey, count: 1, windowStart })
      .onConflictDoNothing();
    // Race-safe re-read in case two requests inserted simultaneously.
    const after = await db
      .select()
      .from(ttsRateLimit)
      .where(eq(ttsRateLimit.bucketKey, bucketKey))
      .get();
    const count = after?.count ?? 1;
    if (count > opts.max) {
      return { ok: false, retryAfterSeconds: Math.max(1, resetAt - nowSec) };
    }
    return { ok: true, remaining: Math.max(0, opts.max - count), resetAt };
  }

  if (existing.count >= opts.max) {
    return { ok: false, retryAfterSeconds: Math.max(1, resetAt - nowSec) };
  }

  const nextCount = existing.count + 1;
  await db
    .update(ttsRateLimit)
    .set({ count: nextCount })
    .where(eq(ttsRateLimit.bucketKey, bucketKey));
  return { ok: true, remaining: Math.max(0, opts.max - nextCount), resetAt };
}
