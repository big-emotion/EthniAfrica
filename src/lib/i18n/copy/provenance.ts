import type { Language } from "@/types/shared";

/**
 * What the provenance banner says, in the two published languages.
 *
 * No standing name appears here: the reader never sees a source's tier
 * (doctrine §1.1).
 */
const fr = {
  region: "Sources des informations de cette fiche",
  // True by construction: the census skips an assertion that cites no source.
  assertionCount: (count: number) =>
    count === 1
      ? "1 information, avec sa source"
      : `${count} informations, chacune avec sa source`,
  lastHumanAudit: (date: string) =>
    `Nous avons relu cette fiche pour la dernière fois le ${date}.`,
  // A missing stamp says no review was recorded, not that nobody read it.
  neverAudited:
    "Nous n'avons encore enregistré aucune relecture de cette fiche.",
  viewSources: "Voir les sources",
};

type ProvenanceCopy = typeof fr;

// @req REQ-145
export const provenanceCopy: Record<Language, ProvenanceCopy> = { fr };
