import { OG_TITLE, PRODUCT_NAME } from "@/lib/brand";
import type { Language } from "@/types/shared";

/**
 * The line every mail the product sends signs off with.
 *
 * It was a literal in four files — the flag notification and the moderation
 * sign-in link, each in both locales — and all four still read « Atlas des
 * Peuples d'Afrique », the qualifier retired on 2026-09-17 when the site turned
 * on the question it answers. Brand charter §1 forbids exactly this: the
 * product name and its qualifier come from `src/lib/brand.ts` and from nowhere
 * else, because a name spelled in five places is a name spelled five ways.
 *
 * A mail is the one surface a reader keeps. It outlives the page it came from,
 * so a stale qualifier there is a stale qualifier in somebody's inbox for
 * years.
 */

/**
 * The English qualifier has no constant, and deliberately so: `brand.ts` holds
 * identity strings that are the same in every locale, and a qualifier is a
 * sentence — it translates. `PRODUCT_NAME` still comes from there, so the name
 * itself is never spelled twice.
 */
const ENGLISH_QUALIFIER = "Africa through its names";

// @req REQ-019
export function emailSignature(language: Language): string {
  return language === "en"
    ? `${PRODUCT_NAME} — ${ENGLISH_QUALIFIER}`
    : OG_TITLE;
}
