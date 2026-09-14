/**
 * Sentry Client-Side Configuration
 *
 * EU Data Region: DSN must use ingest.de.sentry.io for EU data residency
 * SENTRY_AUTH_TOKEN: Required for build-step source-map uploads (set in CI/CD)
 * Retention: 30-day retention should be configured in Sentry dashboard settings
 */
import * as Sentry from "@sentry/nextjs";

import { assertEuDsn, beforeSend } from "@/lib/sentry/pii-scrubber";
import { traceSampleRateUnderConsent } from "@/lib/sentry/consentedTracing";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

// Web Vitals need a sample, not a census, and the ingest quota is shared with
// error events.
const CONSENTED_TRACE_SAMPLE_RATE = 0.1;

// Enforce EU data residency at startup (GDPR NFR34/AR28/AR38).
// Production builds will throw if the DSN does not target ingest.de.sentry.io.
assertEuDsn(dsn);

Sentry.init({
  dsn,

  // Browser tracing is what carries Core Web Vitals, and measuring readers is
  // analytics: a trace is kept only under the consent that loads Plausible.
  // A sampler rather than a fixed rate, because it is asked again before every
  // pageload and navigation, so a choice changed mid-session holds on the next.
  tracesSampler: () => traceSampleRateUnderConsent(CONSENTED_TRACE_SAMPLE_RATE),

  // Debug mode for development
  debug: process.env.NODE_ENV === "development",

  // Stated rather than inherited: the SDK default has changed between majors,
  // and an upgrade must not start attaching IPs, cookies and bodies.
  sendDefaultPii: false,

  // PII scrubbing via beforeSend hook
  beforeSend: beforeSend as Parameters<typeof Sentry.init>[0]["beforeSend"],

  // A transaction carries the same request shape as an error — the URL with
  // its query string, the headers — so it goes through the same scrubber.
  beforeSendTransaction: beforeSend as Parameters<
    typeof Sentry.init
  >[0]["beforeSendTransaction"],

  // Only enable in production
  enabled:
    process.env.NODE_ENV === "production" ||
    !!process.env.NEXT_PUBLIC_SENTRY_DSN,
});
