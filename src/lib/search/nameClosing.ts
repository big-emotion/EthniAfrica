import { FALLBACK_SEED_WORDS } from "@/lib/home/seedWords";
import { nameClosingCopy } from "@/lib/i18n/copy/nameClosing";
import type {
  NameHistoryAccount,
  TimelineName,
} from "@/lib/search/nameTimeline";
import {
  SOURCE_KIND_FAMILIES,
  sourceKindFamily,
  type SourceKindFamily,
} from "@/lib/sources/sourceKindFamily";
import type { SearchEntityType, SearchResult } from "@/types/afrik-frontend";
import type { Language } from "@/types/shared";

/**
 * The blocks under the timeline (brief 1, boards in
 * docs/design/mockups/site/search-peul-*.dc.html): who tells the open name,
 * what the project does not know, and where to go next. Pure functions; the
 * components only lay them out.
 */

export type NameHistorySource = NameHistoryAccount["sources"][number];

export interface SourceFamilyGroup {
  family: SourceKindFamily;
  /** Distinct sources of this family across the open name's accounts. */
  sourceCount: number;
  /** Each account this family backs, with only this family's sources. */
  accounts: Array<{
    account: NameHistoryAccount;
    sources: NameHistorySource[];
  }>;
}

/**
 * The open name's accounts, regrouped by the family of their sources, in the
 * fixed order of `SOURCE_KIND_FAMILIES`: an order of kinds, never of trust
 * (doctrine §1.1). An account two families back appears under both.
 */
// @req REQ-198
// @req REQ-161
export function groupAccountsBySourceFamily(
  name: TimelineName
): SourceFamilyGroup[] {
  const accounts = name.tiles.flatMap((tile) => tile.accounts);
  return SOURCE_KIND_FAMILIES.flatMap((family) => {
    const backed = accounts.flatMap((account) => {
      const sources = account.sources.filter(
        (source) => sourceKindFamily(source.source_kind) === family
      );
      return sources.length > 0 ? [{ account, sources }] : [];
    });
    if (backed.length === 0) return [];
    const titles = new Set(
      backed.flatMap(({ sources }) => sources.map((source) => source.title))
    );
    return [{ family, sourceCount: titles.size, accounts: backed }];
  });
}

/** The first sentence of a summary: a reason line, not a paragraph. */
// @req REQ-198
export function firstSentence(text: string): string {
  const match = text.match(/^.+?[.!?](?=\s|$)/u);
  return (match ? match[0] : text).trim();
}

export interface UnwrittenSubject {
  /** The kind of the subject, as the page labels it (« Langue »). */
  label: string;
  name: string;
}

/**
 * What the page does not know, one line each, deduced from the data only: a
 * page never declares a silence its data does not support. An open name with
 * no oral source, a name with no dated origin (or what lies before its oldest
 * trace), a subject whose history is not written yet.
 */
// @req REQ-198
export function deduceSilences(
  subjects: ReadonlyArray<{ name: TimelineName }>,
  unwritten: readonly UnwrittenSubject[] = [],
  language: Language = "fr"
): string[] {
  const copy = nameClosingCopy[language].silence;
  const lines: string[] = [];
  for (const { name } of subjects) {
    const sources = name.tiles.flatMap((tile) =>
      tile.accounts.flatMap((account) => account.sources)
    );
    if (
      !sources.some((source) => sourceKindFamily(source.source_kind) === "oral")
    ) {
      lines.push(copy.noOral(name.nameText));
    }
    // A birth dated by a plain year is named; any other label (« Vers
    // 1505-1508 ») reads badly after « plus ancienne que ».
    const birth = name.tiles.find((tile) => tile.placement === "birth");
    const year = birth?.periodLabel?.match(/^\d{3,4}$/)?.[0];
    lines.push(
      !name.hasBirth
        ? copy.noBirth(name.nameText)
        : year
          ? copy.beforeYear(name.nameText, year)
          : copy.beforeBirth(name.nameText)
    );
  }
  for (const subject of unwritten) {
    lines.push(copy.unwritten(subject.label, subject.name));
  }
  return [...new Set(lines)];
}

export type NextStepRelation = "family" | "people";

export interface NextStepTarget {
  type: SearchEntityType;
  id: string;
  name: string;
  relation: NextStepRelation;
}

/**
 * One or two names the data already links to the page's subjects: a people's
 * or a language's family, a family name's peoples. Never a subject of the
 * page itself, never more than two (brief 1, block 8).
 */
// @req REQ-198
export function nextStepTargets(
  subjects: readonly SearchResult[],
  limit = 2
): NextStepTarget[] {
  const onPage = new Set(subjects.map((subject) => subject.id));
  const targets: NextStepTarget[] = [];
  const add = (target: NextStepTarget) => {
    if (onPage.has(target.id)) return;
    if (targets.some((known) => known.id === target.id)) return;
    targets.push(target);
  };
  for (const subject of subjects) {
    if (
      (subject.type === "people" || subject.type === "language") &&
      subject.languageFamilyId &&
      subject.languageFamilyName
    ) {
      add({
        type: "languageFamily",
        id: subject.languageFamilyId,
        name: subject.languageFamilyName,
        relation: "family",
      });
    }
    if (subject.type === "patronyme") {
      for (const people of subject.associatedPeoples ?? []) {
        add({
          type: "people",
          id: people.id,
          name: people.name,
          relation: "people",
        });
      }
    }
  }
  return targets.slice(0, limit);
}

/** A card of the next step: the relation as eyebrow, the name, the reason. */
export interface NextStepCard {
  kind: string;
  name: string;
  reason: string;
}

/**
 * The next step of a page with no subject (an unknown name): two of the
 * home's seed names, a people and a country, with a plain reason. Nothing is
 * related to a name the atlas does not know, so the step is an invitation to
 * read one it does.
 */
// @req REQ-198
export function seedNextSteps(language: Language = "fr"): NextStepCard[] {
  const copy = nameClosingCopy[language];
  const seeds = FALLBACK_SEED_WORDS[language];
  return [
    {
      kind: copy.nextRelation.seed.people,
      name: seeds.people[0],
      reason: copy.seedReason.people,
    },
    {
      kind: copy.nextRelation.seed.country,
      name: seeds.country[0],
      reason: copy.seedReason.country,
    },
  ];
}
