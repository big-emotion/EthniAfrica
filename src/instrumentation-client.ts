/**
 * Browser instrumentation, run by Next after the document loads and before
 * hydration.
 *
 * Until this file existed nothing imported `sentry.client.config.ts`, so the
 * browser SDK never started. Kept in `src/`, beside `app/` and `middleware.ts`,
 * where `knip.json` already declares the convention as an entry point; the
 * 2026-09-14 production build was checked to ship the client config.
 */
import * as Sentry from "@sentry/nextjs";

import "../sentry.client.config";

// Opens a navigation trace on each App Router transition. Whether that trace
// is kept is still the consent-gated sampler in the client config.
// @req REQ-057
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
