import type { Language } from "@/types/shared";

/**
 * What the provenance banner says, in the two published languages.
 *
 * The four standing names are deliberately absent: they belong to the
 * controlled vocabulary in `src/lib/glossaire/vocabularies.ts`, which is the
 * one place the atlas labels a tier. Restating « Officielle » here would give
 * the scale a second spelling, and a scale with two spellings is a scale the
 * reader cannot trust across two pages.
 */
const fr = {
  region: "Provenance des assertions de cette fiche",
  assertionCount: (count: number) =>
    `${count} assertion${count > 1 ? "s" : ""} recensée${count > 1 ? "s" : ""}`,
  lastHumanAudit: (date: string) => `Dernière relecture humaine : ${date}`,
  neverAudited: "Aucune relecture humaine enregistrée à ce jour",
  unverifiedNotice:
    "Les assertions non vérifiées sont publiées et signalées comme telles. Nous ne les retirons pas.",
  viewSources: "Voir les sources",
};

type ProvenanceCopy = typeof fr;

// @req REQ-145
export const provenanceCopy: Record<Language, ProvenanceCopy> = { fr };
