import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { logger } from "@/lib/api/logger";

export type ContactRateLimitResult =
  { allowed: true } | { allowed: false; retryAfter: number };

/**
 * A reader with a correction to send writes once or twice; five in an hour
 * from one address is already a flood for a form that lands in a human
 * mailbox, and the honeypot alone does nothing against a script that leaves
 * the hidden field empty.
 */
const MESSAGES_PER_HOUR = 5;

let limiter: Ratelimit | null = null;

function getLimiter(url: string, token: string): Ratelimit {
  if (limiter) return limiter;
  limiter = new Ratelimit({
    redis: new Redis({ url, token }),
    limiter: Ratelimit.slidingWindow(MESSAGES_PER_HOUR, "1 h"),
    prefix: "contact:rate-limit",
  });
  return limiter;
}

/**
 * Fails open, as the report limiter does (`flagRateLimit.ts`): an Upstash
 * outage should not silence readers writing in, and the mailbox is the only
 * thing a flood reaches — nothing is persisted.
 */
// @req REQ-045
export async function checkContactRateLimit(
  clientIp: string
): Promise<ContactRateLimitResult> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    logger.warn(
      "Contact rate limit disabled because Upstash is not configured",
      { tag: "contact_rate_limit_unavailable" }
    );
    return { allowed: true };
  }

  try {
    const result = await getLimiter(url, token).limit(`contact:ip:${clientIp}`);
    if (result.success) return { allowed: true };

    return {
      allowed: false,
      retryAfter: Math.max(0, Math.ceil((result.reset - Date.now()) / 1000)),
    };
  } catch (error) {
    logger.warn("Contact rate limit check failed; allowing the message", {
      error,
      tag: "contact_rate_limit_unavailable",
    });
    return { allowed: true };
  }
}
