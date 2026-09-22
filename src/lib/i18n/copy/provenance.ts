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
const en = {
  region: "Provenance of this fiche's assertions",
  assertionCount: (count: number) =>
    `${count} recorded ${count === 1 ? "assertion" : "assertions"}`,
  lastHumanAudit: (date: string) => `Last human review: ${date}`,
  neverAudited: "No human review recorded to date",
  /**
   * The declarative line the loud state carries instead of an alert glyph. It
   * states the policy rather than warning about it: an atlas that labels a
   * community or oral account and then flags it has re-imposed the filter the
   * tier policy exists to refuse.
   */
  unverifiedNotice:
    "Unverified assertions are published and labelled as such. We do not withdraw them.",
  viewSources: "See the sources",
};

type ProvenanceCopy = typeof en;

const fr: ProvenanceCopy = {
  region: "Provenance des assertions de cette fiche",
  assertionCount: (count) =>
    `${count} assertion${count > 1 ? "s" : ""} recensée${count > 1 ? "s" : ""}`,
  lastHumanAudit: (date) => `Dernière relecture humaine : ${date}`,
  neverAudited: "Aucune relecture humaine enregistrée à ce jour",
  unverifiedNotice:
    "Les assertions non vérifiées sont publiées et signalées comme telles. Nous ne les retirons pas.",
  viewSources: "Voir les sources",
};

// @req REQ-145
export const provenanceCopy: Record<Language, ProvenanceCopy> = { en, fr };
