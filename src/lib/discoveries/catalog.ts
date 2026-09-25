import type { EmbedRef } from "@/lib/embeds/providers";
import type { Language } from "@/types/shared";
import {
  formatProductionNameQuestion,
  formatProductionPosterAlt,
} from "@/lib/editorial/productionNameQuestion";
import { getLocalizedRoute } from "@/lib/routing";

export type DiscoverySubjectKind =
  "country" | "family" | "people" | "language" | "patronyme";

export interface DiscoverySubjectReference {
  kind: DiscoverySubjectKind;
  id: string;
}

export interface DiscoveryPublication {
  id: string;
  kind: "anecdote" | "proverb" | "carousel" | "image" | "video";
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
      kind: DiscoverySubjectKind;
      id: string;
      label: Record<Language, string>;
    }>;
    sources: Array<{ title: string; url: string }>;
    /**
     * A production about a word that is not a corpus entity (« zombie »): it
     * has no subject, and what finds it is the queries filed for it.
     */
    word?: { queries: readonly string[] };
  };
  /** A proverb's words in the language that says them, as its source prints them. */
  original?: { text: string; lang: string };
  /**
   * Required for every kind but `proverb`, which may wait for its photo. A
   * proverb's photo is a free-licence picture from the people's own world
   * (brand charter §9), never a generated one, and is cleared like any other.
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
    /**
     * The carousel's original soundtrack, self-hosted (DEC-064: the site
     * embeds no platform player for carousels — TikTok's own measured no
     * cleaner than the video embed DEC-059 already rejected). Absent when no
     * licence covers reusing the track here; REQ-185 requires that absence to
     * degrade to no control, never a broken one.
     */
    audio?: {
      src: string;
      credit: string;
      licenceUrl?: string;
    };
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
  /** Runtime metadata for a short; its title and poster alt are derived. */
  video?: {
    name: Record<Language, string>;
    publishedAt: string;
    durationSeconds: number;
    watchUrl: string;
    /**
     * Provider and identifier only, never a URL: a stored string that becomes an
     * iframe `src` is an unvalidated address. Optional, so a record without one
     * is the link out it was before.
     */
    embed?: EmbedRef;
    credit?: DiscoveryVideoCredit;
    poster: {
      src: string;
      alt: Record<Language, string>;
      width: number;
      height: number;
    };
    transcript?: Partial<Record<Language, string>>;
  };
  /**
   * Pre-rendered derived files under `public/`, by format. A format is
   * declared only once its file ships; `scripts/__tests__/generatedImageDownloads`
   * holds each declared file to its dimensions and its IPTC disclosure.
   */
  downloads?: Partial<Record<DownloadFormat, string>>;
}

/**
 * Who made a production and under what licence it is shown (REQ-128). It sits
 * beside the watch link rather than being derived from it: the platform's page
 * says who uploaded a piece, not who authored it or what it may be reused for.
 */
export interface DiscoveryVideoCredit {
  author: string;
  licence: "public-domain" | "cc0" | "cc-by" | "cc-by-sa";
  licenceUrl: string;
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
  // A proverb may wait for its photo, but one it carries is cleared like any.
  if (entry.kind === "proverb") {
    return (
      !entry.image ||
      (hasClearedPicture(entry) && hasText(entry.image.filePage))
    );
  }
  if (entry.kind === "image") return isDeclaredFiction(entry);
  if (entry.kind === "video") {
    const { video } = entry;
    return Boolean(
      video &&
      (entry.detail?.entities.length || entry.detail?.word?.queries.length) &&
      hasText(video.name.fr) &&
      hasText(video.name.en) &&
      entry.title.fr === formatProductionNameQuestion(video.name.fr, "fr") &&
      entry.title.en === formatProductionNameQuestion(video.name.en, "en") &&
      !Number.isNaN(Date.parse(video.publishedAt)) &&
      Number.isFinite(video.durationSeconds) &&
      video.durationSeconds > 0 &&
      hasText(video.poster.src) &&
      video.poster.alt.fr === formatProductionPosterAlt(video.name.fr, "fr") &&
      video.poster.alt.en === formatProductionPosterAlt(video.name.en, "en") &&
      video.poster.width > 0 &&
      video.poster.height > 0 &&
      isHttpsUrl(video.watchUrl)
    );
  }
  // A series has no original elsewhere — this publication is its file page —
  // so it owes a cleared cover and its frames, not an outside permalink.
  if (entry.kind === "carousel") {
    return hasClearedPicture(entry) && hasBrowsableSeries(entry);
  }
  return hasClearedPicture(entry) && hasText(entry.image?.filePage);
}

function isHttpsUrl(value: string): boolean {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
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

/**
 * Narrows the publishable Discovery catalog to exact typed subjects.
 * An absent scope keeps the existing unscoped catalog unchanged.
 *
 * @public Awaiting its caller: the production-history brief
 * (docs/plans/production-history-brief.md) attaches productions to fiches
 * through this filter, so it is kept, with its tests, until that work lands.
 */
// @req REQ-180
export function publicationsForSubjects(
  records: readonly DiscoveryPublication[],
  subjects: readonly DiscoverySubjectReference[] = []
): DiscoveryPublication[] {
  const eligible = eligiblePublications(records);
  if (subjects.length === 0) return eligible;

  return eligible.filter((entry) =>
    entry.detail?.entities.some((entity) =>
      subjects.some(
        (subject) => subject.kind === entity.kind && subject.id === entity.id
      )
    )
  );
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
