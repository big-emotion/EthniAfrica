import type { SearchEntityType } from "@/types/afrik-frontend";

export type CompanionSubjectType = Exclude<SearchEntityType, "person">;

export interface CompanionSubject {
  entityType: CompanionSubjectType;
  entityId: string;
}

export type CompanionRelation =
  "exact" | "linked-family" | "linked-people" | "linked-country" | "recent";

export interface CompanionMatch extends CompanionSubject {
  relation: CompanionRelation;
}

export type CompanionRelatedSubject = CompanionSubject & {
  relation: Exclude<CompanionRelation, "exact" | "recent">;
};

export type CompanionRelationMap = ReadonlyMap<
  string,
  readonly CompanionRelatedSubject[]
>;

export interface CompanionCatalogItem {
  id: string;
  subjects: readonly CompanionSubject[];
}

export interface ResolvedCompanionItem<Item extends CompanionCatalogItem> {
  item: Item;
  match: CompanionMatch;
}

const RELATED_RELATIONS: readonly CompanionRelatedSubject["relation"][] = [
  "linked-family",
  "linked-people",
  "linked-country",
];

// @req REQ-180
export function companionSubjectKey(subject: CompanionSubject): string {
  return `${subject.entityType}:${subject.entityId}`;
}

/**
 * Expand only the requested subjects. Related subjects are deliberately not
 * looked up again, which keeps the search feed at ring 1.
 */
// @req REQ-180
export function resolveCompanionTargets(
  subjects: readonly CompanionSubject[],
  relations: CompanionRelationMap
): CompanionMatch[] {
  const targets: CompanionMatch[] = [];
  const seen = new Set<string>();

  const add = (target: CompanionMatch) => {
    const key = companionSubjectKey(target);
    if (seen.has(key)) return;
    seen.add(key);
    targets.push(target);
  };

  subjects.forEach((subject) => add({ ...subject, relation: "exact" }));

  for (const relation of RELATED_RELATIONS) {
    for (const subject of subjects) {
      const related = relations.get(companionSubjectKey(subject)) ?? [];
      related.filter((target) => target.relation === relation).forEach(add);
    }
  }

  return targets;
}

/**
 * Pick the strongest target an item matches and retain editorial catalog order
 * between items with the same target.
 */
// @req REQ-180
export function orderCompanionMatches<Item extends CompanionCatalogItem>(
  items: readonly Item[],
  targets: readonly CompanionMatch[]
): Array<ResolvedCompanionItem<Item>> {
  const targetRanks = new Map(
    targets.map((target, index) => [companionSubjectKey(target), index])
  );

  const ranked = items
    .flatMap((item, catalogRank) => {
      const matchedTarget = item.subjects.reduce<
        { target: CompanionMatch; targetRank: number } | undefined
      >((best, subject) => {
        const targetRank = targetRanks.get(companionSubjectKey(subject));
        if (targetRank === undefined) return best;
        if (best && best.targetRank <= targetRank) return best;
        return { target: targets[targetRank], targetRank };
      }, undefined);

      return matchedTarget ? [{ item, catalogRank, ...matchedTarget }] : [];
    })
    .sort(
      (left, right) =>
        left.targetRank - right.targetRank ||
        left.catalogRank - right.catalogRank ||
        left.item.id.localeCompare(right.item.id)
    );
  const seenItems = new Set<string>();
  return ranked
    .filter(({ item }) => {
      if (seenItems.has(item.id)) return false;
      seenItems.add(item.id);
      return true;
    })
    .map(({ item, target }) => ({ item, match: target }));
}
