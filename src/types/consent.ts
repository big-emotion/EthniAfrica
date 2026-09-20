export type ConsentCategory =
  "essential" | "analytics" | "functional" | "embeds";

export interface ConsentPreferences {
  essential: boolean; // Always true, required
  analytics: boolean; // Plausible, etc.
  functional: boolean; // Sentry user context, etc.
  embeds: boolean; // Third-party players, chosen at the click that loads one
}

export interface ConsentState {
  hasConsented: boolean;
  preferences: ConsentPreferences;
  consentDate: string | null; // ISO date string
}
