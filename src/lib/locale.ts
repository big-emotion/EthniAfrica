import type { Language } from "@/types/shared";

/**
 * The site publishes in French only (operator decision, October 2026: no
 * English launch is planned).
 *
 * The `[lang]` route segment and every `/fr/...` address are kept as they
 * are, so `Language` survives as the one-member union derived from this
 * tuple. Retired English addresses are redirected by the proxy, through
 * `src/lib/legacyEnglishPaths.ts`.
 */
// @req REQ-140
export const LOCALES = ["fr"] as const;

// @req REQ-140
export const FALLBACK_LOCALE: Language = "fr";

// @req REQ-140
export const isLocale = (value: unknown): value is Language =>
  typeof value === "string" && (LOCALES as readonly string[]).includes(value);
