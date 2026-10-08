import { getLocalizedRoute } from "@/lib/routing";
import type { Language } from "@/types/shared";

/**
 * Where an article lives, and how its dates read.
 *
 * Articles keep the section's existing address (`/fr/dossiers/<slug>`), so
 * the listing and every card compose their links from the hub route rather
 * than spelling it: a rename of the section is then one entry in the routing
 * table, not a search through the components.
 *
 * Kept here, beside the UI, until the navigation lane decides whether article
 * routes belong in `routing.ts`.
 */
// @req REQ-114
export function articleHref(language: Language, slug: string): string {
  return `${getLocalizedRoute(language, "dossiersHub")}/${slug}`;
}

// @req REQ-108
export function articleListingHref(language: Language, page: number): string {
  const hub = getLocalizedRoute(language, "dossiersHub");
  return page > 1 ? `${hub}?page=${page}` : hub;
}

const DATE_LOCALES: Record<Language, string> = { fr: "fr-FR" };

/**
 * `YYYY-MM-DD` as a reader writes it. Read in UTC: the stored value is a
 * calendar day, and a server west of Greenwich would otherwise print the day
 * before.
 */
// @req REQ-114
export function formatArticleDate(isoDate: string, language: Language): string {
  return new Intl.DateTimeFormat(DATE_LOCALES[language], {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${isoDate}T00:00:00Z`));
}
