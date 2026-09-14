/**
 * True only for a real production deployment.
 *
 * Vercel compiles every deployment with `NODE_ENV=production` — previews and
 * per-PR deployments included — so `NODE_ENV` alone cannot tell a preview from
 * the real site. `VERCEL_ENV` makes that distinction (`production` / `preview`
 * / `development`) and takes precedence whenever it is set. Outside Vercel
 * (self-hosted, local, CI) it is absent and `NODE_ENV` remains the authority,
 * which is why the CI jobs that run `next start` set `VERCEL_ENV: preview`.
 *
 * A leaf module so that asking the question does not import the rate
 * limiter's Upstash and Sentry clients.
 */
// @req REQ-059
export function isProductionDeployment(): boolean {
  const vercelEnv = process.env.VERCEL_ENV;
  if (vercelEnv) return vercelEnv === "production";
  return process.env.NODE_ENV === "production";
}
