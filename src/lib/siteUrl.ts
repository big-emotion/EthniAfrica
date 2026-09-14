import { PHASE_PRODUCTION_BUILD } from "next/constants";

import { isProductionDeployment } from "@/lib/deployment";

const DEVELOPMENT_SITE_URL = "http://localhost:3000";

/**
 * The public origin of the site, for the places that must print an absolute
 * URL: the root layout's `metadataBase`, the Atom feed, the flag-resolution
 * email and the OpenAPI server.
 *
 * Unset, it answers the local dev server — except on a production deployment,
 * where it throws. Each caller used to fall back to localhost on its own, so a
 * deployment missing the variable mailed and published links nobody could
 * open, and nothing reported it.
 *
 * `next build` is let through with the local fallback. The build runs with
 * `NODE_ENV=production`, and CI's build check has no reason to know the public
 * URL; failing there would block every pull request without protecting the
 * site. The running server evaluates the same modules again, and that is where
 * a missing value must surface.
 *
 * Canonical links and the sitemap do not come from here: they are built from
 * `CANONICAL_DOMAIN`, which has a production default.
 */
// @req REQ-044
export function resolveSiteUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configured) {
    return /^https?:\/\//i.test(configured)
      ? configured
      : `http://${configured}`;
  }

  if (
    process.env.NEXT_PHASE === PHASE_PRODUCTION_BUILD ||
    !isProductionDeployment()
  ) {
    return DEVELOPMENT_SITE_URL;
  }

  throw new Error(
    "NEXT_PUBLIC_SITE_URL is not set. A production deployment needs the public site URL (for example https://ethniafrica.com) to build metadata, feed links and emails."
  );
}
