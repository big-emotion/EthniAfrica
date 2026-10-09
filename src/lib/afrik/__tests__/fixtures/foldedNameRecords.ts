/**
 * The twelve noms/ records as they stood when they were folded into their
 * people fiches' nameHistory (ETNI-2021, REQ-196).
 *
 * They live on only as test evidence: the fold promised that every reader
 * serves the same forms, written traces and answer-card fields from the
 * fiche as it did from the record, and these copies are what that promise
 * is checked against.
 */
import { readdirSync, readFileSync } from "fs";
import { join } from "path";

import type { NameHistory } from "@/lib/afrik/parsers/nameHistoryParser";
import type { NameRecordDossier } from "@/types/names";

const RECORDS_ROOT = join(__dirname, "foldedNameRecords");
const PEOPLES_ROOT = join(
  process.cwd(),
  "dataset",
  "source",
  "afrik",
  "peuples"
);

// @req REQ-196
export const FOLDED_RECORD_FILES = readdirSync(RECORDS_ROOT).filter((file) =>
  file.endsWith(".json")
);

// @req REQ-196
export function foldedRecord(file: string): NameRecordDossier {
  return JSON.parse(readFileSync(join(RECORDS_ROOT, file), "utf-8"));
}

/** The nameHistory the people fiche carries today. */
// @req REQ-196
export function ficheNameHistory(peopleId: string): NameHistory {
  for (const family of readdirSync(PEOPLES_ROOT)) {
    try {
      const fiche = JSON.parse(
        readFileSync(join(PEOPLES_ROOT, family, `${peopleId}.json`), "utf-8")
      );
      return fiche.nameHistory;
    } catch {
      continue;
    }
  }
  throw new Error(`${peopleId}: no people fiche`);
}

/**
 * The record, with its undated written traces dated as the fiche dates them.
 *
 * Enrichment after the fold (ETNI-2008) dates traces the record left undated.
 * That adds to what the record served rather than changing it, so the year is
 * taken from the fiche only where the record had none: a dated trace that
 * moves, or a trace that disappears, still fails the comparison.
 */
// @req REQ-196
export function datedLikeFiche(
  record: NameRecordDossier,
  history: NameHistory
): NameRecordDossier {
  return {
    ...record,
    names: record.names.map((name) => {
      // The fold turned each attestation into one account, in order.
      const traces = (
        history.names.find((entry) => entry.nameText === name.nameText)
          ?.accounts ?? []
      ).filter((account) => account.formAsWritten !== undefined);
      return {
        ...name,
        attestations: name.attestations?.map((attestation, index) => {
          const trace = traces[index];
          if (
            attestation.year !== null ||
            trace?.formAsWritten !== attestation.formAsWritten
          )
            return attestation;
          return { ...attestation, year: trace.period.from };
        }),
      };
    }),
  };
}
