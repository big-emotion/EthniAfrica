import {
  eligiblePublications,
  type DiscoveryPublication,
} from "@/lib/discoveries/catalog";
import { generatedImagePublications } from "@/lib/discoveries/generatedImages";
import {
  DISCOVERY_VIDEOS,
  videoPublications,
  type DiscoveryVideoRecord,
} from "@/lib/discoveries/videos";
import {
  formatProductionNameQuestion,
  formatProductionPosterAlt,
} from "@/lib/editorial/productionNameQuestion";
import {
  DID_YOU_KNOW_FACTS,
  type DidYouKnowFact,
} from "@/lib/home/didYouKnowFacts";
import {
  illustrationFor as defaultIllustrationFor,
  type DidYouKnowIllustration,
} from "@/lib/home/didYouKnowIllustrations";
import { loadProductionLedger } from "@/lib/productions/ledger";
import { searchShortsFrom } from "@/lib/productions/toSearchShort";
import { PROVERBS, type Proverb } from "@/lib/proverbs/proverbs";
import type { Language } from "@/types/shared";
import type { QuizTemplateId } from "@/types/quiz";

import {
  orderCompanionMatches,
  type CompanionCatalogItem,
  type CompanionMatch,
  type CompanionSubject,
  type ResolvedCompanionItem,
} from "./companionRelations";

export interface CompanionSelection<Item extends CompanionCatalogItem> {
  /** Eligible unique matches before the presentation limit is applied. */
  count: number;
  items: Array<ResolvedCompanionItem<Item>>;
}

export interface CompanionAnecdote extends CompanionCatalogItem {
  fact: DidYouKnowFact;
  illustration: DidYouKnowIllustration;
}

export interface CompanionProverb extends CompanionCatalogItem {
  proverb: Proverb;
}

export interface CompanionImage extends CompanionCatalogItem {
  publication: DiscoveryPublication;
}

export type SearchShort = DiscoveryVideoRecord;

export interface CompanionShort extends CompanionCatalogItem {
  video: SearchShort;
  publishedAt: string;
}

export interface CompanionQuizCandidate extends CompanionCatalogItem {
  eligible: boolean;
  difficulty: number;
  templateId: QuizTemplateId;
}

// @req REQ-180
export const SEARCH_SHORTS: readonly SearchShort[] = searchShortsFrom(
  loadProductionLedger(),
  DISCOVERY_VIDEOS
);

function hasText(value: string | undefined): boolean {
  return Boolean(value?.trim());
}

export { formatProductionNameQuestion };

// @req REQ-180
export function searchShortPosterAlt(
  short: Pick<SearchShort, "name">,
  language: Language
): string {
  return formatProductionPosterAlt(short.name[language], language);
}

// @req REQ-180
export function searchShortDiscoveryPublication(
  short: SearchShort
): DiscoveryPublication {
  return videoPublications([short])[0];
}

function subjectForEntity(entity: {
  kind: "people" | "country" | "family" | "language" | "patronyme";
  id: string;
}): CompanionSubject {
  return {
    entityType: entity.kind === "family" ? "languageFamily" : entity.kind,
    entityId: entity.id,
  };
}

function select<Item extends CompanionCatalogItem>(
  items: readonly Item[],
  targets: readonly CompanionMatch[],
  limit: number
): CompanionSelection<Item> {
  const matches = orderCompanionMatches(items, targets);
  return { count: matches.length, items: matches.slice(0, limit) };
}

// @req REQ-180
export function anecdotesForTargets(
  targets: readonly CompanionMatch[],
  options: {
    facts?: readonly DidYouKnowFact[];
    illustrationFor?: (factId: string) => DidYouKnowIllustration | undefined;
    limit?: number;
  } = {}
): CompanionSelection<CompanionAnecdote> {
  const facts = options.facts ?? DID_YOU_KNOW_FACTS;
  const illustrationFor = options.illustrationFor ?? defaultIllustrationFor;
  const items = facts.flatMap<CompanionAnecdote>((fact) => {
    const illustration = illustrationFor(fact.id);
    if (!fact.sources?.length || !illustration) return [];
    return [
      {
        id: fact.id,
        fact,
        illustration,
        subjects: fact.entities.map(subjectForEntity),
      },
    ];
  });

  return select(items, targets, options.limit ?? 3);
}

// @req REQ-180
export function proverbsForTargets(
  targets: readonly CompanionMatch[],
  options: { proverbs?: readonly Proverb[]; limit?: number } = {}
): CompanionSelection<CompanionProverb> {
  const items = (options.proverbs ?? PROVERBS).flatMap<CompanionProverb>(
    (proverb) => {
      const hasAuthority = proverb.sources.some(
        (source) => source.tier !== "unverified" && hasText(source.title)
      );
      if (proverb.origin.status !== "attested" || !hasAuthority) return [];

      const subjects = proverb.entities.map(subjectForEntity);
      if (proverb.original?.lang) {
        subjects.push({
          entityType: "language",
          entityId: proverb.original.lang,
        });
      }
      return [{ id: proverb.id, proverb, subjects }];
    }
  );

  return select(items, targets, options.limit ?? 2);
}

// @req REQ-180
export function imagesForTargets(
  targets: readonly CompanionMatch[],
  publications: readonly DiscoveryPublication[] = generatedImagePublications(),
  limit = 1
): CompanionSelection<CompanionImage> {
  const items = eligiblePublications(publications).flatMap<CompanionImage>(
    (publication) => {
      if (publication.kind !== "image" || !publication.detail) return [];
      return [
        {
          id: publication.id,
          publication,
          subjects: publication.detail.entities.map(subjectForEntity),
        },
      ];
    }
  );

  return select(items, targets, limit);
}

// @req REQ-180
export function eligibleSearchShorts(
  shorts: readonly SearchShort[] = SEARCH_SHORTS
): SearchShort[] {
  const publications = shorts.map(searchShortDiscoveryPublication);
  const eligible = new Set(eligiblePublications(publications));
  return shorts.filter((_short, index) => eligible.has(publications[index]));
}

function companionShort(short: SearchShort): CompanionShort {
  return {
    id: short.id,
    video: short,
    publishedAt: short.publishedAt,
    subjects: short.subjects.map((subject) => ({
      entityType: subject.kind === "family" ? "languageFamily" : subject.kind,
      entityId: subject.id,
    })),
  };
}

// @req REQ-180
export function shortsForTargets(
  targets: readonly CompanionMatch[],
  shorts: readonly SearchShort[] = SEARCH_SHORTS,
  options: { limit?: number } = {}
): CompanionSelection<CompanionShort> {
  const eligible = eligibleSearchShorts(shorts).map(companionShort);
  const matched = orderCompanionMatches(eligible, targets);
  return {
    count: matched.length,
    items: matched.slice(0, options.limit ?? 6),
  };
}

// @req REQ-180
export function quizForTargets<Item extends CompanionQuizCandidate>(
  targets: readonly CompanionMatch[],
  candidates: readonly Item[],
  limit = 1
): CompanionSelection<Item> {
  const eligible = candidates
    .filter((candidate) => candidate.eligible)
    .slice()
    .sort(
      (left, right) =>
        left.difficulty - right.difficulty ||
        left.templateId.localeCompare(right.templateId) ||
        left.id.localeCompare(right.id)
    );
  return select(eligible, targets, limit);
}
