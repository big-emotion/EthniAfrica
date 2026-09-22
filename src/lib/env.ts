/**
 * Reading deployment-tunable numbers out of the environment.
 *
 * The rule these serve: a value that differs between deployments — a quota, a
 * request deadline, a host — belongs in configuration, not in a literal that
 * only a redeploy can change. A malformed value falls back to the documented
 * default rather than throwing, because a typo in an env var must not be able
 * to take a running deployment down.
 */

/**
 * A positive integer from `process.env`, or the fallback when the variable is
 * unset, unparseable, zero or negative.
 */
// @req REQ-110
export function positiveIntFromEnv(
  value: string | undefined,
  fallback: number
): number {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

type RateLimitWindow = `${number} ${"ms" | "s" | "m" | "h" | "d"}`;

/**
 * A sliding-window length in the spelling `@upstash/ratelimit` takes
 * (`"30 s"`, `"1 h"`), or the fallback when the variable is unset or the value
 * is one the library would reject — its constructor throws on a malformed
 * window, which here would be on the first request that needs the limiter.
 */
// @req REQ-110
export function rateLimitWindowFromEnv(
  value: string | undefined,
  fallback: RateLimitWindow
): RateLimitWindow {
  const candidate = value?.trim();
  if (!candidate || !/^[1-9]\d* (ms|s|m|h|d)$/.test(candidate)) {
    return fallback;
  }
  return candidate as RateLimitWindow;
}
