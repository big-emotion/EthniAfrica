import type { Language } from "@/types/shared";

/**
 * What the provenance banner says, in the two published languages.
 *
 * No standing name appears here: the reader never sees a source's tier
 * (doctrine §1.1).
 */
const fr = {
  region: "Sources des informations de cette fiche",
  assertionCount: (count: number) =>
    `${count} information${count > 1 ? "s" : ""} présentée${count > 1 ? "s" : ""}`,
  lastHumanAudit: (date: string) => `Dernière relecture humaine : ${date}`,
  neverAudited: "Aucune relecture humaine enregistrée à ce jour",
  viewSources: "Voir les sources",
};

type ProvenanceCopy = typeof fr;

// @req REQ-145
export const provenanceCopy: Record<Language, ProvenanceCopy> = { fr };
