import type { SearchResult } from "@/types/afrik-frontend";
import { selectNameSubject } from "@/lib/search/nameSubject";
import type { Language } from "@/types/shared";

import type { DiscoverySubjectKind } from "./catalog";

export interface RelatedEntityReference {
  kind: DiscoverySubjectKind;
  id: string;
}

export interface RelatedEntityAssociation {
  entity: RelatedEntityReference;
  /** The documented relation that connects the entity to the origin. */
  relation: string;
}

export type RelatedEntityIndex = ReadonlyMap<
  string,
  readonly RelatedEntityAssociation[]
>;

export interface ResolvedRelatedEntity extends RelatedEntityAssociation {
  origin: RelatedEntityReference;
}

export interface RelatedProductionCandidate {
  productionId: string;
  subjects: readonly RelatedEntityReference[];
}

export interface ResolvedRelatedProduction extends ResolvedRelatedEntity {
  productionId: string;
}

const SUBJECT_KIND_BY_SEARCH_TYPE: Partial<
  Record<SearchResult["type"], DiscoverySubjectKind>
> = {
  country: "country",
  languageFamily: "family",
  language: "language",
  people: "people",
  patronyme: "patronyme",
};

/** A typed key keeps identical IDs from different entity classes separate. */
// @req REQ-183
export function relatedEntityKey(entity: RelatedEntityReference): string {
  return `${entity.kind}:${entity.id}`;
}

/**
 * Resolve each entity that answers to the searched name, then return only its
 * recorded one-hop associations. Related nodes are never traversed, and a
 * target reached through multiple paths is returned once per origin.
 */
// @req REQ-183
export function resolveRelatedEntities(
  results: readonly SearchResult[],
  query: string,
  index: RelatedEntityIndex,
  language: Language = "fr"
): ResolvedRelatedEntity[] {
  const origins = selectNameSubject([...results], query, language).flatMap(
    (result) => {
      const kind = SUBJECT_KIND_BY_SEARCH_TYPE[result.type];
      return kind ? [{ kind, id: result.id }] : [];
    }
  );

  return origins.flatMap((origin) => {
    const originKey = relatedEntityKey(origin);
    const seen = new Set<string>([originKey]);

    return (index.get(originKey) ?? []).flatMap(({ entity, relation }) => {
      const targetKey = relatedEntityKey(entity);
      if (seen.has(targetKey)) return [];
      seen.add(targetKey);
      return [{ origin, entity, relation }];
    });
  });
}

/**
 * Match production IDs to associated subjects and retain the first documented
 * path per origin. The caller can join these IDs to full publication records.
 */
// @req REQ-183
export function resolveRelatedProductions(
  results: readonly SearchResult[],
  query: string,
  index: RelatedEntityIndex,
  candidates: readonly RelatedProductionCandidate[],
  language: Language = "fr"
): ResolvedRelatedProduction[] {
  const targets = resolveRelatedEntities(results, query, index, language);
  const seenByOrigin = new Map<string, Set<string>>();

  return targets.flatMap((target) => {
    const originKey = relatedEntityKey(target.origin);
    const seen = seenByOrigin.get(originKey) ?? new Set<string>();
    seenByOrigin.set(originKey, seen);

    return candidates.flatMap(({ productionId, subjects }) => {
      const matches = subjects.some(
        (subject) =>
          relatedEntityKey(subject) === relatedEntityKey(target.entity)
      );
      if (!matches || seen.has(productionId)) return [];
      seen.add(productionId);
      return [{ ...target, productionId }];
    });
  });
}
