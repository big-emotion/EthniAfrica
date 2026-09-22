import { afterEach, describe, expect, it } from "vitest";

import { CONSENT_STORAGE_KEY, saveConsent } from "@/lib/consent";
import { traceSampleRateUnderConsent } from "@/lib/sentry/consentedTracing";

const RATE = 0.1;
const MONTH_MS = 30 * 24 * 60 * 60 * 1000;

function storeChoice(analytics: boolean, consentDate = new Date()) {
  saveConsent({
    hasConsented: true,
    preferences: {
      essential: true,
      analytics,
      functional: false,
      embeds: false,
    },
    consentDate: consentDate.toISOString(),
  });
}

describe("traceSampleRateUnderConsent", () => {
  afterEach(() => {
    localStorage.removeItem(CONSENT_STORAGE_KEY);
  });

  // @req REQ-046
  it("samples nothing before the reader has chosen", () => {
    expect(traceSampleRateUnderConsent(RATE)).toBe(0);
  });

  // @req REQ-046
  it("samples nothing when the reader refused analytics", () => {
    storeChoice(false);

    expect(traceSampleRateUnderConsent(RATE)).toBe(0);
  });

  // @req REQ-046
  it("samples at the configured rate once analytics are accepted", () => {
    storeChoice(true);

    expect(traceSampleRateUnderConsent(RATE)).toBe(RATE);
  });

  // @req REQ-046
  it("samples nothing on an acceptance that has expired", () => {
    storeChoice(true, new Date(Date.now() - 13 * MONTH_MS));

    expect(traceSampleRateUnderConsent(RATE)).toBe(0);
  });
});
