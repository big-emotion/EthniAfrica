import type { Language } from "@/types/shared";
import { getLocalizedRoute } from "@/lib/routing";

export interface DiscoveryPublication {
  id: string;
  kind: "anecdote" | "proverb" | "carousel" | "image";
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
    /**
     * Required for every kind but `image`: a generated picture has no
     * original elsewhere, so the publication's own permalink is its file page.
     */
    filePage?: string;
    credit: string;
    shortCredit?: Record<Language, string>;
    alt?: Record<Language, string>;
    focus?: string;
    licenceUrl?: string;
    licence: "public-domain" | "cc0" | "cc-by" | "cc-by-sa" | "unknown";
  };
  /**
   * A series' frames, in reading order, served from `public/`. They are the
   * project's own render rather than a platform's copy of it: the files exist
   * before the post does, so embedding one to show them back would route our
   * output through a third party to retrieve it. `image` above stays the
   * cover, and carries the credit and licence for the whole series.
   */
  carousel?: {
    frames: ReadonlyArray<{
      src: string;
      width: number;
      height: number;
      alt: Record<Language, string>;
    }>;
  };
  // The fields below belong to `image` publications only (DEC-053).
  collection?: "autonymes" | "traversees" | "figures-et-moments";
  /**
   * How the picture was made. This is provenance, never a source: it cannot
   * vouch for the subject, which rests on `source` alone.
   */
  generation?: {
    tool: string;
    model: string;
    jobId: string;
    generatedOn: string;
    sourceKind: "ai_generated";
  };
  caption?: Record<Language, string>;
  /**
   * An editorial declaration that the caption states a place, date or pairing
   * no linked fiche states. Such a caption must then cite `captionSource`.
   */
  captionExceedsCorpus?: boolean;
  captionSource?: { title: string; url: string };
  /**
   * Pre-rendered derived files under `public/`, by format. A format is
   * declared only once its file ships; `scripts/__tests__/generatedImageDownloads`
   * holds each declared file to its dimensions and its IPTC disclosure.
   */
  downloads?: Partial<Record<DownloadFormat, string>>;
}

export type DownloadFormat = "9:16" | "4:5" | "1:1";

function hasText(value: string | undefined): boolean {
  return Boolean(value?.trim());
}

function hasClearedPicture(entry: DiscoveryPublication): boolean {
  return (
    hasText(entry.image?.src) &&
    hasText(entry.image?.credit) &&
    entry.image?.licence !== "unknown"
  );
}

// @req REQ-164
function isDeclaredFiction(entry: DiscoveryPublication): boolean {
  const { generation, caption, captionSource } = entry;
  const entityCount = entry.detail?.entities?.length ?? 0;
  return (
    entityCount >= 1 &&
    entityCount <= 2 &&
    hasClearedPicture(entry) &&
    hasText(entry.image?.alt?.fr) &&
    hasText(entry.image?.alt?.en) &&
    hasText(caption?.fr) &&
    hasText(caption?.en) &&
    hasText(generation?.tool) &&
    hasText(generation?.model) &&
    hasText(generation?.jobId) &&
    hasText(generation?.generatedOn) &&
    generation?.sourceKind === "ai_generated" &&
    (!entry.captionExceedsCorpus ||
      (hasText(captionSource?.title) && hasText(captionSource?.url)))
  );
}

// Two frames is the floor rather than one: a track with nowhere to go is an
// `image` publication filed under the wrong kind, and it promises the reader a
// series the publication does not have.
function hasBrowsableSeries(entry: DiscoveryPublication): boolean {
  const frames = entry.carousel?.frames ?? [];
  return (
    frames.length >= 2 &&
    frames.every(
      (frame) =>
        hasText(frame.src) &&
        frame.width > 0 &&
        frame.height > 0 &&
        hasText(frame.alt?.fr) &&
        hasText(frame.alt?.en)
    )
  );
}

function hasPublishableVisual(entry: DiscoveryPublication): boolean {
  if (entry.kind === "proverb") return true;
  if (entry.kind === "image") return isDeclaredFiction(entry);
  // A series has no original elsewhere — this publication is its file page —
  // so it owes a cleared cover and its frames, not an outside permalink.
  if (entry.kind === "carousel") {
    return hasClearedPicture(entry) && hasBrowsableSeries(entry);
  }
  return hasClearedPicture(entry) && hasText(entry.image?.filePage);
}

// @req REQ-157
// @req REQ-164
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
      hasPublishableVisual(entry) &&
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

const DOWNLOAD_FORMATS = [
  { format: "9:16", width: 1080, height: 1920 },
  { format: "4:5", width: 1080, height: 1350 },
  { format: "1:1", width: 1080, height: 1080 },
] as const;

// Only a generated image ships derived files carrying its disclosure; a
// photographed anecdote's picture belongs to its author and is linked instead.
// @req REQ-166
export function downloadChoices(entry: DiscoveryPublication): Array<{
  format: DownloadFormat;
  src: string;
  width: number;
  height: number;
}> {
  if (entry.kind !== "image") return [];
  return DOWNLOAD_FORMATS.flatMap(({ format, width, height }) => {
    const src = entry.downloads?.[format];
    return hasText(src) ? [{ format, src, width, height }] : [];
  });
}
