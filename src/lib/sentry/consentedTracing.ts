import { getStoredConsent, isConsentExpired } from "@/lib/consent";

/**
 * The trace sample rate the reader's stored choice allows: `rate` under an
 * unexpired analytics acceptance, 0 otherwise.
 *
 * Read from storage on every call rather than from React state, because the
 * Sentry SDK asks before each pageload and navigation trace, outside the
 * component tree. A refusal made on one page therefore already holds on the
 * next. A choice with no date is honoured the way `ConsentProvider` honours
 * it, so the banner and the sampler never disagree.
 */
// @req REQ-046
export function traceSampleRateUnderConsent(rate: number): number {
  const stored = getStoredConsent();
  if (!stored?.preferences?.analytics) return 0;
  if (stored.consentDate && isConsentExpired(stored.consentDate)) return 0;
  return rate;
}
