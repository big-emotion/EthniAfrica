import type { ConsentPreferences, ConsentState } from "@/types/consent";

// @req REQ-046
export const CONSENT_STORAGE_KEY = "ethni-consent";
// @req REQ-046
export const CONSENT_EXPIRY_MONTHS = 12;

// @req REQ-046
export const DEFAULT_PREFERENCES: ConsentPreferences = {
  essential: true,
  analytics: false,
  functional: false,
  embeds: false,
};

// @req REQ-046
export function getStoredConsent(): ConsentState | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const stored = localStorage.getItem(CONSENT_STORAGE_KEY);
    if (!stored) {
      return null;
    }
    const parsed = JSON.parse(stored) as ConsentState;
    // A record written before a category existed lacks its key; that reads as
    // refused, which is what the default says, rather than as undefined.
    return {
      ...parsed,
      preferences: { ...DEFAULT_PREFERENCES, ...parsed.preferences },
    };
  } catch {
    return null;
  }
}

// @req REQ-046
export function saveConsent(state: ConsentState): void {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(state));
}

// @req REQ-046
export function isConsentExpired(consentDate: string): boolean {
  const consentTime = new Date(consentDate).getTime();
  const now = Date.now();
  const expiryMs = CONSENT_EXPIRY_MONTHS * 30 * 24 * 60 * 60 * 1000; // ~12 months in ms

  return now - consentTime > expiryMs;
}
