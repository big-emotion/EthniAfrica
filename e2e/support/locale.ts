// Relative rather than `@/`: playwright.config.ts imports this module, and
// knip loads that config at run time without the tsconfig path aliases — the
// same reason the config reaches `src/lib/consent` by a relative path.
import { FALLBACK_LOCALE } from "../../src/lib/locale";
import type { Language } from "../../src/types/shared";

/**
 * The locale the suite drives: French, the one locale the site publishes.
 * One constant rather than a literal in every spec, so a spec composes its
 * addresses from it through the routing helpers.
 */
// @req REQ-141
export const LOCALE: Language = FALLBACK_LOCALE;
