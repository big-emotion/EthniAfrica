/**
 * The one place that decides which address a request "came from".
 *
 * The left-most `X-Forwarded-For` entry is whatever the client wrote: a proxy
 * appends the address it saw to the END of the chain, so anything before its
 * own hop is unauthenticated. Reading the left-most entry let a caller mint an
 * unlimited supply of "IPs" and walk around the per-IP quota and the
 * one-key-per-IP rule. We count from the right instead, skipping only the
 * proxies we operate.
 *
 * `TRUSTED_PROXY_HOPS` is how many of them there are (default 1: Traefik on
 * the production VPS, Vercel on the recette preview). Raise it only when
 * another proxy or CDN is put in front, otherwise every visitor is attributed
 * to that proxy and shares one quota.
 *
 * Kept free of Node built-ins: `src/middleware.ts` imports this through
 * `rate-limit.ts` and runs on the edge runtime.
 */

const DEFAULT_TRUSTED_PROXY_HOPS = 1;

function trustedProxyHops(): number {
  const declared = parseInt(process.env.TRUSTED_PROXY_HOPS ?? "", 10);
  return Number.isFinite(declared) && declared > 0
    ? declared
    : DEFAULT_TRUSTED_PROXY_HOPS;
}

/**
 * The client address the trusted proxies vouch for, or null when the request
 * carries none — callers decide whether that is refusable or shares a bucket.
 *
 * `X-Real-IP` is consulted only when there is no `X-Forwarded-For` at all,
 * which no proxy in front of this app ever produces; it is a fallback for
 * local development, not a second opinion, because a client can write it.
 */
// @req REQ-059
export function clientIp(request: { headers: Headers }): string | null {
  const hops = trustedProxyHops();
  const chain = (request.headers.get("x-forwarded-for") ?? "")
    .split(",")
    .map((hop) => hop.trim())
    .filter(Boolean);

  if (chain.length > 0) {
    return chain.length >= hops ? chain[chain.length - hops] : null;
  }

  return request.headers.get("x-real-ip")?.trim() || null;
}
