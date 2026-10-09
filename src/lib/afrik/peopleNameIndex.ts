/**
 * The name index of one people fiche, as the loader projects it onto
 * `afrik_peoples.name_index` (REQ-196, ARCH-028).
 *
 * It replaces the `name_records` table, whose rows came from two writers: the
 * folded noms/ records (now the fiche's nameHistory) and the names derived
 * from the fiche's appellations prose. Both stay in the index, built here in
 * one place so the SQL view over the column only unpacks it and never
 * re-derives a name type or an imposition.
 *
 * The block is the source of truth: a derived name whose (name, type) pair the
 * block already tells is left out, as the readers did with name_records rows.
 */

import { nameRecordsFromHistory } from "@/lib/afrik/nameHistoryRecords";
import { deriveAppellations } from "@/lib/afrik/parsers/appellationGrammar";
import type { NameRecordType } from "@/api/v2/schemas/names";
import type { FicheSource, People } from "@/types/afrik";
import { isSourceTier, type SourceKind } from "@/types/sources";

export interface NameIndexSource {
  title: string;
  url: string | null;
  year: number | null;
  tier: string | null;
  source_kind?: SourceKind;
}

export interface PeopleNameIndexEntry {
  nameText: string;
  nameType: NameRecordType;
  /** Which part of the fiche told the name: the block, or the appellations prose. */
  origin: "nameHistory" | "appellation";
  languageOfOrigin: string | null;
  meaning: string | null;
  periodLabel: string | null;
  imposedBy: string | null;
  impositionPeriod: string | null;
  whyProblematic: string | null;
  contemporaryUsage: string | null;
  sortRank: number;
  sources: NameIndexSource[];
}

export interface PeopleNameIndex {
  entries: PeopleNameIndexEntry[];
  /** Appellation segments the grammar declined to read as a name. */
  rejected: string[];
  /** The fiche yields derived names but cites no source with a tier. */
  unsourced: boolean;
}

/**
 * A derived name needs one source that carries a tier, whatever its kind
 * (REQ-195, doctrine §1.1): an oral account or an EthniAfrica synthesis is
 * cited at its own tier, never refused for being oral or offline. The retired
 * name_records trigger admitted a people name only on official or referenced
 * evidence; that restriction is deliberately not carried over. Consent to an
 * oral narrative is still gated where the narrative itself is loaded.
 */
function mayCarryAName(source: FicheSource): boolean {
  return isSourceTier(source.tier);
}

/**
 * The fiche's sources, one per title and sorted by it, as the retired
 * appellation loader cited them.
 */
function ficheSources(sources: FicheSource[] | undefined): FicheSource[] {
  const byTitle = new Map<string, FicheSource>();
  for (const source of sources ?? []) {
    if (source?.title && !byTitle.has(source.title)) {
      byTitle.set(source.title, source);
    }
  }
  return [...byTitle.values()].sort((a, b) => a.title.localeCompare(b.title));
}

function pairKey(nameText: string, nameType: string): string {
  return `${nameType}\u0000${nameText}`;
}

// @req REQ-196
export function peopleNameIndex(
  people: Pick<People, "nameHistory" | "content">
): PeopleNameIndex {
  const told: PeopleNameIndexEntry[] = nameRecordsFromHistory(
    people.nameHistory
  ).map((record) => ({
    nameText: record.nameText,
    nameType: record.nameType,
    origin: "nameHistory",
    languageOfOrigin: record.languageOfOrigin,
    meaning: record.meaning,
    periodLabel: record.periodLabel,
    imposedBy: record.imposedBy,
    impositionPeriod: record.impositionPeriod,
    whyProblematic: record.whyProblematic,
    contemporaryUsage: record.contemporaryUsage,
    sortRank: record.sortRank,
    sources: record.sources.map((source) => ({
      title: source.title,
      url: source.url,
      year: source.year,
      tier: source.tier,
      source_kind: source.source_kind,
    })),
  }));

  const appellations = people.content?.appellations;
  const { entries: derivedNames, rejected } = deriveAppellations({
    selfAppellation: appellations?.selfAppellation,
    exonyms: appellations?.exonyms,
  });

  const sources = ficheSources(people.content?.sources);
  const unsourced =
    derivedNames.length > 0 && !sources.some((source) => mayCarryAName(source));
  if (unsourced) return { entries: told, rejected, unsourced };

  const toldPairs = new Set(
    told.map((entry) => pairKey(entry.nameText, entry.nameType))
  );
  const derived: PeopleNameIndexEntry[] = derivedNames
    .filter((name) => !toldPairs.has(pairKey(name.nameText, name.nameType)))
    .map((name) => ({
      nameText: name.nameText,
      nameType: name.nameType,
      origin: "appellation",
      languageOfOrigin: null,
      meaning: null,
      periodLabel: null,
      imposedBy: null,
      impositionPeriod: null,
      // The fiche explains its exonyms once, for all of them at once.
      whyProblematic:
        name.nameType === "endonym"
          ? null
          : (appellations?.whyProblematic ?? null),
      contemporaryUsage: name.gloss,
      sortRank: name.sortRank,
      sources: sources.map((source) => ({
        title: source.title,
        url: source.url,
        // A fiche source declares no year, and inventing one would be a
        // fabricated citation.
        year: null,
        // NULL rather than `needs_review` folded onto a tier: a ruling nobody
        // made is not published.
        tier: isSourceTier(source.tier) ? source.tier : null,
        ...(source.source_kind ? { source_kind: source.source_kind } : {}),
      })),
    }));

  return { entries: [...told, ...derived], rejected, unsourced: false };
}
