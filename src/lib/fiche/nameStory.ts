import type { PeopleNamesDossier } from "@/api/v2/schemas/names";
import { readNaming, type NamingProjection } from "@/lib/search/naming";

/**
 * A people's naming for the fiche: its appellations rubric, plus what the
 * names dossier states about each form.
 *
 * The dossier rows are re-shaped into the records `readNaming` already takes
 * for the result page, so the fiche and the search feed read a form's origin
 * through one door. They carry no evidence here: the fiche prints its sources
 * in its own chapter.
 */
// @req REQ-178
export function peopleNamingOf(
  appellations: unknown,
  dossier: PeopleNamesDossier | null | undefined
): NamingProjection {
  const records = (dossier?.names ?? []).map((name) => ({
    id: name.id,
    entityType: "people",
    entityId: dossier!.peopleId,
    form: name.nameText,
    kind: name.nameType,
    languageOfOrigin: name.languageOfOrigin ?? undefined,
    meaning: name.meaning ?? undefined,
    periodLabel: name.periodLabel ?? undefined,
    imposedBy: name.imposition?.imposedBy ?? undefined,
    impositionPeriod: name.imposition?.impositionPeriod ?? undefined,
    problematic: Boolean(name.imposition?.whyProblematic),
    usedToday: Boolean(name.imposition?.contemporaryUsage),
    evidence: [],
  }));
  return readNaming("people", { appellations }, {}, records);
}
