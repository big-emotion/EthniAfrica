import type {
  DiscoveryPublication,
  DiscoverySubjectReference,
  DiscoveryVideoCredit,
} from "@/lib/discoveries/catalog";
import type { EmbedRef } from "@/lib/embeds/providers";
import { discoveryVideosCopy } from "@/lib/i18n/copy/discoveryVideos";
import {
  formatProductionNameQuestion,
  formatProductionPosterAlt,
} from "@/lib/editorial/productionNameQuestion";
import type { SourceTier } from "@/types/sources";
import type { Language } from "@/types/shared";

export interface DiscoveryVideoSubject extends DiscoverySubjectReference {
  label: Record<Language, string>;
}

export interface DiscoveryVideoRecord {
  id: string;
  status: "draft" | "published";
  slug: Record<Language, string>;
  name: Record<Language, string>;
  description: Record<Language, string>;
  publishedAt: string;
  durationSeconds: number;
  poster: {
    src: string;
    width: number;
    height: number;
  };
  watchUrl: string;
  embed?: EmbedRef;
  credit?: DiscoveryVideoCredit;
  source: {
    title: string;
    url: string;
    tier: SourceTier;
  };
  subjects: readonly DiscoveryVideoSubject[];
  transcript?: Partial<Record<Language, string>>;
}

/**
 * Real reviewed videos belong here. Board titles and durations are illustrative
 * fixtures and must never be copied into this production catalog.
 *
 * The first record is the one production that proves the embed contract end to
 * end; its words are in `i18n/copy/discoveryVideos.ts`, with the reason they
 * say no more than the fiche does. Author and licence are the production's own
 * (the project; CC BY-SA 4.0, its output licence).
 */
// @req REQ-180
// @req REQ-181
export const DISCOVERY_VIDEOS: readonly DiscoveryVideoRecord[] = [
  {
    id: "video-origine-du-nom-mande",
    status: "published",
    slug: {
      fr: "origine-du-nom-mande",
      en: "origin-of-the-name-mande",
    },
    name: {
      fr: discoveryVideosCopy.fr.mande.name,
      en: discoveryVideosCopy.en.mande.name,
    },
    description: {
      fr: discoveryVideosCopy.fr.mande.description,
      en: discoveryVideosCopy.en.mande.description,
    },
    publishedAt: "2026-09-16",
    durationSeconds: 121,
    poster: {
      src: "/images/discoveries/videos/mande-nest-pas-un-peuple.jpg",
      width: 540,
      height: 960,
    },
    watchUrl: "https://www.youtube.com/shorts/vESK91smqxQ",
    embed: { provider: "youtube", id: "vESK91smqxQ" },
    credit: {
      author: "EthniAfrica",
      licence: "cc-by-sa",
      licenceUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
    },
    source: {
      title: discoveryVideosCopy.fr.mande.sourceTitle,
      url: "https://ethniafrica.com/fr/atlas/familles/FLG_MANDE",
      tier: "referenced",
    },
    subjects: [
      {
        kind: "family",
        id: "FLG_MANDE",
        label: {
          fr: discoveryVideosCopy.fr.mande.name,
          en: discoveryVideosCopy.en.mande.name,
        },
      },
    ],
  },
];

// @req REQ-180
export function videoPublications(
  records: readonly DiscoveryVideoRecord[] = DISCOVERY_VIDEOS
): DiscoveryPublication[] {
  return records.map((record) => ({
    id: record.id,
    kind: "video",
    status: record.status,
    slug: record.slug,
    title: {
      fr: formatProductionNameQuestion(record.name.fr, "fr"),
      en: formatProductionNameQuestion(record.name.en, "en"),
    },
    description: record.description,
    source: record.source,
    detail: {
      body: {
        fr: [record.description.fr],
        en: [record.description.en],
      },
      entities: record.subjects.map((subject) => ({ ...subject })),
      sources: [{ title: record.source.title, url: record.source.url }],
    },
    video: {
      name: record.name,
      publishedAt: record.publishedAt,
      durationSeconds: record.durationSeconds,
      watchUrl: record.watchUrl,
      embed: record.embed,
      credit: record.credit,
      poster: {
        ...record.poster,
        alt: {
          fr: formatProductionPosterAlt(record.name.fr, "fr"),
          en: formatProductionPosterAlt(record.name.en, "en"),
        },
      },
      transcript: record.transcript,
    },
  }));
}
