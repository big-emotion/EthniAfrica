import type { Language } from "@/types/shared";
import { getLocalizedRoute } from "@/lib/routing";

export interface DiscoveryPublication {
  id: string;
  kind: "anecdote" | "proverb" | "carousel";
  status: "draft" | "published";
  slug: Record<Language, string>;
  title: Record<Language, string>;
  description: Record<Language, string>;
  source?: {
    title: string;
    shortTitle?: string;
    url: string;
    tier: "official" | "referenced" | "unverified";
  };
  detail?: {
    body: Record<Language, string[]>;
    entities: Array<{
      kind: "country" | "family" | "people";
      id: string;
      label: Record<Language, string>;
    }>;
    sources: Array<{ title: string; url: string }>;
  };
  /** A proverb's words in the language that says them, as its source prints them. */
  original?: { text: string; lang: string };
  /**
   * Required for every kind but `proverb`. A proverb is words rather than a
   * scene, and a photo placed beside it would be decoration we chose, not a
   * document the publication is about.
   */
  image?: {
    src: string;
    filePage: string;
    credit: string;
    shortCredit?: Record<Language, string>;
    alt?: Record<Language, string>;
    focus?: string;
    licenceUrl?: string;
    licence: "public-domain" | "cc0" | "cc-by" | "cc-by-sa" | "unknown";
  };
}

function hasText(value: string | undefined): boolean {
  return Boolean(value?.trim());
}

// @req REQ-157
export function eligiblePublications(
  records: readonly DiscoveryPublication[]
): DiscoveryPublication[] {
  const seenIds = new Set<string>();
  const seenPaths = new Set<string>();
  return records.filter((entry) => {
    const paths = [entry.slug.fr, entry.slug.en];
    const ready =
      entry.status === "published" &&
      hasText(entry.id) &&
      paths.every(hasText) &&
      paths.every((path) => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(path)) &&
      hasText(entry.title.fr) &&
      hasText(entry.title.en) &&
      hasText(entry.description.fr) &&
      hasText(entry.description.en) &&
      hasText(entry.source?.title) &&
      hasText(entry.source?.url) &&
      entry.source?.tier !== "unverified" &&
      (entry.kind === "proverb" ||
        (hasText(entry.image?.src) &&
          hasText(entry.image?.filePage) &&
          hasText(entry.image?.credit) &&
          entry.image?.licence !== "unknown")) &&
      !seenIds.has(entry.id) &&
      paths.every((path) => !seenPaths.has(path));
    if (ready) {
      seenIds.add(entry.id);
      paths.forEach((path) => seenPaths.add(path));
    }
    return ready;
  });
}

// @req REQ-158
export function discoveryPath(
  language: Language,
  entry: DiscoveryPublication
): string {
  return `${getLocalizedRoute(language, "discoveries")}/${encodeURIComponent(entry.slug[language])}`;
}

// @req REQ-158
export function resolvePublication(
  records: readonly DiscoveryPublication[],
  language: Language,
  slug: string
): DiscoveryPublication | null {
  return (
    eligiblePublications(records).find(
      (entry) => entry.slug[language] === slug
    ) ?? null
  );
}

// @req REQ-156
export function orderedDeck(
  records: readonly DiscoveryPublication[],
  leadingId: string | null = null,
  random: () => number = Math.random
): string[] {
  const ids = eligiblePublications(records).map((entry) => entry.id);
  for (let index = ids.length - 1; index > 0; index -= 1) {
    const target = Math.floor(random() * (index + 1));
    [ids[index], ids[target]] = [ids[target], ids[index]];
  }
  if (leadingId) {
    const index = ids.indexOf(leadingId);
    if (index > 0) [ids[0], ids[index]] = [ids[index], ids[0]];
  }
  return ids;
}
