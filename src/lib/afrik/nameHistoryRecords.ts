/**
 * Reads a fiche's `nameHistory` back as the name records the answer card, the
 * search sheet and `GET /v2/peoples/{id}/names` already consume (REQ-196,
 * ARCH-028).
 *
 * The block is the source of truth; the record shape is what the readers were
 * built on. Projecting here, once, is what lets the twelve `noms/` files fold
 * into their fiches without any reader losing a form, a written trace or an
 * answer-card field — the fold test holds this projection against the
 * records it replaces.
 */

import type { NameHistory } from "@/lib/afrik/parsers/nameHistoryParser";
import type {
  NameAttestation,
  NamePronunciation,
  NameRecordEntry,
  NameRecordSource,
  NameRecordType,
} from "@/types/names";
import type { SourceKind } from "@/types/sources";

type HistoryName = NameHistory["names"][number];
type HistoryAccount = HistoryName["accounts"][number];
type HistorySource = HistoryAccount["sources"][number];

/**
 * A name record as the block tells it. Its sources keep the `source_kind`
 * the block requires, which a record never had: readers that show a source's
 * kind (the search sheet, REQ-161) gain it, the others ignore it.
 */
export type HistoryNameRecord = Omit<NameRecordEntry, "sources"> & {
  sources: Array<NameRecordSource & { source_kind: SourceKind }>;
};

// The record shape predates source_kind and the oral fields; a reader of it
// gets exactly what a record carried.
function recordSource(source: HistorySource): NameRecordSource {
  return {
    title: source.title,
    author: source.author,
    year: source.year,
    url: source.url,
    tier: source.tier,
    ...(source.notes !== undefined ? { notes: source.notes } : {}),
  };
}

function nameTypeOf(name: HistoryName): NameRecordType {
  if (name.selfGiven) return "endonym";
  return name.variantSpelling ? "historical_spelling" : "exonym";
}

function attestationOf(account: HistoryAccount): NameAttestation {
  const [source] = account.sources;
  return {
    formAsWritten: account.formAsWritten,
    year: account.period.from,
    periodLabel: account.period.label,
    attestedBy: account.actors?.[0]?.name ?? account.sources[0].author,
    source: { ...recordSource(source), page: source.page },
  };
}

function pronunciationOf(
  pronunciation: HistoryName["pronunciation"]
): NamePronunciation | undefined {
  if (!pronunciation) return undefined;
  const { source } = pronunciation;
  return {
    respelling: pronunciation.respelling,
    audio: pronunciation.audio,
    source: {
      ...recordSource(source),
      ...(source.page !== undefined ? { page: source.page } : {}),
    },
  };
}

// @req REQ-196
export function nameRecordsFromHistory(
  history: NameHistory | null | undefined
): HistoryNameRecord[] {
  return (history?.names ?? []).map((name, index) => {
    const aspect = (wanted: HistoryAccount["aspect"]) =>
      name.accounts.find((account) => account.aspect === wanted);
    const meaning = aspect("meaning");
    const imposition = aspect("imposition");
    const usage = aspect("usage");
    // A folded record copies its sources onto each account it becomes, so the
    // first of them carries the name's sources whole.
    const described = meaning ?? imposition ?? usage;
    const pronunciation = pronunciationOf(name.pronunciation);

    return {
      nameText: name.nameText,
      nameType: nameTypeOf(name),
      languageOfOrigin: name.languageOfOrigin,
      meaning: meaning?.statement ?? null,
      periodLabel: name.periodLabel ?? null,
      imposedBy: imposition?.actors?.[0]?.name ?? null,
      impositionPeriod: imposition?.period.label ?? null,
      whyProblematic: imposition?.statement ?? null,
      contemporaryUsage: usage?.statement ?? null,
      sortRank: index,
      sources: (described?.sources ?? []).map((source) => ({
        ...recordSource(source),
        source_kind: source.source_kind,
      })),
      attestations: name.accounts
        .filter((account) => account.formAsWritten !== undefined)
        .map(attestationOf),
      ...(name.shortLine !== undefined ? { shortLine: name.shortLine } : {}),
      namedBy: name.namedBy,
      originDebated: name.accounts.some(
        (account) => account.hypothesisGroup !== undefined
      ),
      ...(name.usedIn !== undefined ? { usedIn: name.usedIn } : {}),
      ...(pronunciation ? { pronunciation } : {}),
    };
  });
}
