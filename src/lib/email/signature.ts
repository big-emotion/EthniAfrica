import { OG_TITLE } from "@/lib/brand";

/**
 * The line every mail the product sends signs off with.
 *
 * It was a literal in four files — the flag notification and the moderation
 * sign-in link, as the site then wrote them — and all four still read « Atlas des
 * Peuples d'Afrique », the qualifier retired on 2026-09-17 when the site turned
 * on the question it answers. Brand charter §1 forbids exactly this: the
 * product name and its qualifier come from `src/lib/brand.ts` and from nowhere
 * else, because a name spelled in five places is a name spelled five ways.
 *
 * A mail is the one surface a reader keeps. It outlives the page it came from,
 * so a stale qualifier there is a stale qualifier in somebody's inbox for
 * years.
 */

// @req REQ-019
export function emailSignature(): string {
  return OG_TITLE;
}
