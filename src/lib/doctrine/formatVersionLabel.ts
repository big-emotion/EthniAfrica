import { localeTag } from "@/lib/languageTag";
import type { Language } from "@/types/shared";

/**
 * Formats the doctrine version label as:
 *   "v{n} · publiée le {long French date}"
 *
 * Story ETNI-30 — version label AC.
 *
 * @req REQ-025
 */
export function formatVersionLabel(
  version: number,
  publishedAt: string,
  language: Language = "fr"
): string {
  const date = new Date(publishedAt);
  const longDate = date.toLocaleDateString(localeTag(language), {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
  return `v${version} · publiée le ${longDate}`;
}
