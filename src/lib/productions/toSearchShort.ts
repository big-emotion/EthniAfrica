import type { DiscoveryVideoRecord } from "@/lib/discoveries/videos";

import type { LedgerEntry } from "./ledger";
import { toDiscoveryPublication } from "./toDiscoveryPublication";

/**
 * The search feed reads `DiscoveryVideoRecord`s, the ledger projects into
 * `DiscoveryPublication`s. This reads the second back into the first rather
 * than re-deriving the fields, so the two catalogs cannot disagree on a title,
 * a poster alt or a subject. An entry the ledger has not finished carries the
 * same empty sentinels as in the projection, and `eligibleSearchShorts` is the
 * one place that drops it.
 */
function toSearchShort(entry: LedgerEntry): DiscoveryVideoRecord[] {
  return toDiscoveryPublication(entry).flatMap((publication) => {
    const { video, detail } = publication;
    if (!video || !detail) return [];
    return [
      {
        id: publication.id,
        status: publication.status,
        slug: publication.slug,
        name: video.name,
        description: publication.description,
        publishedAt: video.publishedAt,
        durationSeconds: video.durationSeconds,
        poster: {
          src: video.poster.src,
          width: video.poster.width,
          height: video.poster.height,
        },
        watchUrl: video.watchUrl,
        embed: video.embed,
        credit: video.credit,
        source: publication.source ?? {
          title: "",
          url: "",
          tier: "unverified",
        },
        subjects: detail.entities.map((subject) => ({
          ...subject,
          label: subject.label ?? video.name,
        })),
      },
    ];
  });
}

/**
 * The hand-authored videos first, then every ledger production that is not
 * already one of them. The twin is recognised by its watch URL, the only field
 * both catalogs are certain to hold for the same upload: the ledger files
 * Mandé under its own campaign id, so an id comparison would show it twice.
 */
// @req REQ-180
export function searchShortsFrom(
  ledger: readonly LedgerEntry[],
  handAuthored: readonly DiscoveryVideoRecord[]
): DiscoveryVideoRecord[] {
  const seenWatchUrls = new Set(handAuthored.map((short) => short.watchUrl));
  const fromLedger = ledger.flatMap(toSearchShort).filter((short) => {
    if (!short.watchUrl) return true;
    if (seenWatchUrls.has(short.watchUrl)) return false;
    seenWatchUrls.add(short.watchUrl);
    return true;
  });
  return [...handAuthored, ...fromLedger];
}
