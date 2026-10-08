import { isLocale } from "@/lib/locale";
import type { Language } from "@/types/shared";

/**
 * The locale a request value may name. An alias of `Language` rather than a
 * second union, so the allow-list is never maintained in two places.
 */
export type TranslationLocale = Language;

/**
 * Whether a request value names a locale the site publishes. Delegates to
 * the one allow-list in src/lib/locale.ts so the API cannot accept a locale
 * the site does not serve.
 */
// @req REQ-140
export function isTranslationLocale(value: string): value is TranslationLocale {
  return isLocale(value);
}
