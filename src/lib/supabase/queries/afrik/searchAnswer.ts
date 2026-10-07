import { createServerClient } from "@/lib/supabase/server";
import type { SearchNamingSubjectRef } from "@/lib/supabase/queries/afrik/searchNaming";

/**
 * The aggregates the answer page needs and a search row does not carry: how
 * many peoples the corpus documents in a country, and how many belong to a
 * family. A language gets none — the people–language relation is
 * many-to-many, so a count of peoples would misstate who speaks it.
 */
export interface SearchAnswerExtrasRow {
  documentedPeopleCount?: number;
  peopleCount?: number;
}

type SearchClient = ReturnType<typeof createServerClient>;

// @req REQ-178
export function searchAnswerKey(type: string, id: string): string {
  return `${type}:${id}`;
}

function tally(values: unknown[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const value of values) {
    if (typeof value === "string") {
      counts.set(value, (counts.get(value) ?? 0) + 1);
    }
  }
  return counts;
}

function failure(table: string, error: unknown): Error {
  const message =
    error && typeof error === "object" && "message" in error
      ? String((error as { message: unknown }).message)
      : String(error);
  return new Error(`Failed to load search answer ${table}: ${message}`);
}

/**
 * One query per kind of aggregate, whatever the number of rows. A failed
 * query throws: a database outage must not read as "no peoples documented".
 */
// @req REQ-178
export async function loadSearchAnswerExtras(
  subjects: readonly SearchNamingSubjectRef[],
  client: SearchClient = createServerClient()
): Promise<Map<string, SearchAnswerExtrasRow>> {
  const countryIds = subjects
    .filter(({ type }) => type === "country")
    .map(({ id }) => id);
  const familyIds = subjects
    .filter(({ type }) => type === "languageFamily")
    .map(({ id }) => id);
  const extras = new Map<string, SearchAnswerExtrasRow>();

  const [countryResult, familyResult] = await Promise.all([
    countryIds.length
      ? client
          .from("afrik_people_countries")
          .select("country_id")
          .in("country_id", countryIds)
      : Promise.resolve({ data: [], error: null }),
    familyIds.length
      ? client
          .from("afrik_peoples")
          .select("language_family_id")
          .in("language_family_id", familyIds)
      : Promise.resolve({ data: [], error: null }),
  ]);
  if (countryResult.error) throw failure("countries", countryResult.error);
  if (familyResult.error) throw failure("families", familyResult.error);

  const perCountry = tally(
    (countryResult.data ?? []).map(
      (row: { country_id?: string }) => row.country_id
    )
  );
  const perFamily = tally(
    (familyResult.data ?? []).map(
      (row: { language_family_id?: string }) => row.language_family_id
    )
  );
  for (const [id, documentedPeopleCount] of perCountry) {
    extras.set(searchAnswerKey("country", id), { documentedPeopleCount });
  }
  for (const [id, peopleCount] of perFamily) {
    extras.set(searchAnswerKey("languageFamily", id), { peopleCount });
  }
  return extras;
}
