import { listPlacesOfCountry } from "@/api/v2/services/places";
import { ficheNextSteps, toldNames } from "@/lib/fiche/ficheNameClosing";
import { loadPeopleFiche } from "@/lib/fiche/ficheExistence";
import type { NextStepCard } from "@/lib/search/nameClosing";
import { getAfrikCountryNameRows } from "@/lib/supabase/queries/afrik/countries";
import type { Language } from "@/types/shared";

/** A country as the shared-name rule reads it. */
export interface CountryNameRow {
  id: string;
  nameFr: string;
  nameOfficial: string | null;
  firstName: string | null;
  summary: string | null;
}

/** Two countries share a name when one's first name is a word of the other's. */
function within(short: string, long: string): boolean {
  const escaped = short.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(?<![\\p{L}-])${escaped}(?![\\p{L}-])`, "u").test(long);
}

/**
 * The other countries that bear this country's name, or whose name this one
 * bears (brief 5, decided in review on 2026-10-15): Congo and the Democratic
 * Republic of the Congo, Guinée and Guinée équatoriale, Soudan and Soudan du
 * Sud. The rule reads the first names of the name histories, nothing else.
 */
// @req REQ-198
export function sharedNameCountries(
  self: CountryNameRow,
  rows: readonly CountryNameRow[]
): CountryNameRow[] {
  const mine = self.firstName;
  if (!mine) return [];
  return rows.filter(
    (row) =>
      row.id !== self.id &&
      row.firstName &&
      (within(mine, row.firstName) || within(row.firstName, mine))
  );
}

/** « la République du Congo »: the official name, its translations dropped. */
function officialWithArticle(row: CountryNameRow): string {
  const official = (row.nameOfficial ?? row.nameFr)
    .replace(/\s*\(.*\)\s*$/u, "")
    .trim();
  return /^République\b/u.test(official) ? `la ${official}` : official;
}

export interface SharedName {
  name: string;
  self: string;
  other: string;
}

/** What the note under the names says, for the first country sharing it. */
// @req REQ-198
export function sharedNameNote(
  self: CountryNameRow,
  rows: readonly CountryNameRow[]
): SharedName | null {
  const [other] = sharedNameCountries(self, rows);
  if (!other || !self.firstName || !other.firstName) return null;
  const name =
    self.firstName.length <= other.firstName.length
      ? self.firstName
      : other.firstName;
  return {
    name,
    self: officialWithArticle(self),
    other: officialWithArticle(other),
  };
}

/** Everything the country fiche needs from the other countries, read once. */
// @req REQ-198
export async function loadCountryNameRows(): Promise<CountryNameRow[]> {
  return getAfrikCountryNameRows().catch(() => []);
}

/**
 * « Poursuivre avec un autre nom » on a country fiche (brief 5, boards
 * country-*.dc.html): a country that shares the name, then the largest
 * people, then the first place from A to Z, then the next people, each kept
 * only when its own fiche has a summary to give the reason. Two at most.
 */
// @req REQ-198
export async function loadCountryNextSteps({
  self,
  rows,
  peoples,
  language,
}: {
  self: CountryNameRow;
  rows: readonly CountryNameRow[];
  /** The country's peoples with a fiche, the largest share first. */
  peoples: ReadonlyArray<{ id: string; name: string }>;
  language: Language;
}): Promise<NextStepCard[]> {
  const candidates = peoples.slice(0, 3);
  const [peopleFiches, places] = await Promise.all([
    Promise.all(
      candidates.map((people) => loadPeopleFiche(people.id).catch(() => null))
    ),
    listPlacesOfCountry(self.id).catch(() => []),
  ]);
  const peopleCards = ficheNextSteps(
    candidates.map((people, index) => ({
      relation: "people" as const,
      // The target fiche's own name: « Kongo », not the share's
      // « Kongo (Brazzaville) ».
      name: peopleFiches[index]?.nameMain ?? people.name,
      summary: peopleFiches[index]?.nameHistory?.summary ?? null,
      names: toldNames(peopleFiches[index]),
    })),
    candidates.length,
    language
  );
  const [place] = ficheNextSteps(
    places.map((entry) => ({
      relation: "place" as const,
      name: entry.nameMain,
      summary: entry.summary,
    })),
    1,
    language
  );
  const shared = ficheNextSteps(
    sharedNameCountries(self, rows).map((row) => ({
      relation: "country" as const,
      name: row.nameFr,
      summary: row.summary,
    })),
    1,
    language
  );
  return [
    ...shared,
    ...peopleCards.slice(0, 1),
    ...(place ? [place] : []),
    ...peopleCards.slice(1),
  ].slice(0, 2);
}
