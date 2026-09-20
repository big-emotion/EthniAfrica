import type {
  DiscoveryPublication,
  DiscoverySubjectReference,
} from "@/lib/discoveries/catalog";
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
 */
// @req REQ-180
export const DISCOVERY_VIDEOS: readonly DiscoveryVideoRecord[] = [];

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
