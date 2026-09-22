import {
  discoveryPath,
  eligiblePublications,
  type DiscoveryPublication,
} from "@/lib/discoveries/catalog";
import { getDiscoveryPublications } from "@/lib/discoveries/entries";
import type { Language } from "@/types/shared";

/**
 * The home's « Des histoires à découvrir » section: a static list, reviewed
 * by hand, of discoveries already published elsewhere on the site.
 *
 * Static rather than drawn, because the section carries a title that has to
 * be true of what is under it (brand charter §8.5): three stories chosen for
 * starting from a familiar word are what the intro promises, and a random
 * draw from the whole deck — proverbs, generated images — would not keep it.
 */
// @req REQ-115
export const HOME_STORY_IDS: readonly string[] = [
  "anecdote:burkina-faso",
  "anecdote:guere-wobe",
  "video:origine-du-nom-mande",
];

export interface HomeStory {
  id: string;
  /** The discovery's own title in the reader's locale, never a home rewrite. */
  title: string;
  href: string;
}

/**
 * Resolves the list through the discoveries catalog's own eligibility rule,
 * so a story that loses its licence, source or translation leaves the home
 * the same day it leaves the deck.
 */
// @req REQ-115
export function resolveHomeStories(
  language: Language,
  ids: readonly string[] = HOME_STORY_IDS,
  records: readonly DiscoveryPublication[] = getDiscoveryPublications()
): HomeStory[] {
  const published = eligiblePublications(records);
  return ids.flatMap((id) => {
    const entry = published.find((record) => record.id === id);
    return entry
      ? [
          {
            id,
            title: entry.title[language],
            href: discoveryPath(language, entry),
          },
        ]
      : [];
  });
}
