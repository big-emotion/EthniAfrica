import { createHash } from "node:crypto";

import { Redis } from "@upstash/redis";

/**
 * A daily ceiling on new proposal issues per caller. The rate limit in the
 * proxy bounds bursts; this bounds what a patient caller can pile up in a
 * private repository a human has to review.
 *
 * The counter is keyed by a digest of the API key id (or one shared
 * "anonymous" bucket), under a day-stamped name that expires on its own: no
 * identifier is kept beyond the day.
 */
const DAY_SECONDS = 24 * 60 * 60;
const ANONYMOUS = "anonymous";

const memory = new Map<string, number>();

// @req REQ-178
export function _resetDailyCapForTest(): void {
  memory.clear();
}

function counterName(callerKey: string | null, now: Date): string {
  const digest = createHash("sha256")
    .update(callerKey ?? ANONYMOUS)
    .digest("hex")
    .slice(0, 16);
  return `agent-proposals:${now.toISOString().slice(0, 10)}:${digest}`;
}

async function increment(name: string): Promise<number> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (url && token) {
    const redis = new Redis({ url, token });
    const count = await redis.incr(name);
    if (count === 1) await redis.expire(name, DAY_SECONDS);
    return count;
  }
  // Without a shared store a serverless instance counts alone, so the cap
  // would silently leak: refuse rather than pretend, outside development.
  if (process.env.NODE_ENV === "production") {
    throw new Error("Daily cap needs UPSTASH_REDIS_REST_URL and token");
  }
  const count = (memory.get(name) ?? 0) + 1;
  memory.set(name, count);
  return count;
}

/** True when the caller may open one more issue today (and counts it). */
// @req REQ-178
export async function takeDailyAllowance(
  callerKey: string | null,
  cap: number,
  now: Date = new Date()
): Promise<boolean> {
  return (await increment(counterName(callerKey, now))) <= cap;
}
