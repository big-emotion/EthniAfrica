/**
 * Name-record types - TypeScript definitions for AFRIK name records (Epic 8, FR55-FR57)
 *
 * Mirrors public/modele-nom.json exactly.
 */

import type { PeopleId } from "@/types/afrik";
import type { SourceTier } from "@/types/sources";

// @req REQ-135
export const NAME_RECORD_ENTITY_TYPES = ["people", "patronyme"] as const;

export type NameRecordEntityType = (typeof NAME_RECORD_ENTITY_TYPES)[number];

export type PatronymeId = `PAT_${string}`;

export type NameRecordType =
  "endonym" | "exonym" | "historical_spelling" | "surname";

export interface NameRecordSource {
  title: string;
  author: string;
  year: number;
  url: string;
  tier: SourceTier;
  notes?: string;
}

export interface NameRecordEntry {
  nameText: string;
  nameType: NameRecordType;
  languageOfOrigin: string | null;
  meaning: string | null;
  periodLabel: string | null;
  imposedBy: string | null;
  impositionPeriod: string | null;
  whyProblematic: string | null;
  contemporaryUsage: string | null;
  sortRank: number;
  sources: NameRecordSource[];
  /** The form's history: each time it was written down, by whom, where (REQ-189). */
  attestations?: NameAttestation[];
  /** What the answer card reads (REQ-191). */
  shortLine?: string;
  namedBy?: string | null;
  originDebated?: boolean;
  usedIn?: string[];
  pronunciation?: NamePronunciation;
}

export interface NamePronunciation {
  respelling: string;
  audio: { url: string; consent: string } | null;
  source: NameRecordSource & { page?: string };
}

export interface NameAttestation {
  formAsWritten: string;
  /** Machine bound for ordering; null when only a period is known. */
  year: number | null;
  periodLabel: string | null;
  attestedBy: string;
  source: NameRecordSource & { page: string };
}

export interface NameRecordDossier {
  id: PeopleId | PatronymeId;
  entityType: NameRecordEntityType;
  names: NameRecordEntry[];
}

/**
 * The rendering-facing shape of a single name record. Deliberately excludes
 * `sortRank` and `sources`: ordering and source evidence are the caller's
 * concern.
 */
export type NameRecordView = Omit<NameRecordEntry, "sortRank" | "sources">;
