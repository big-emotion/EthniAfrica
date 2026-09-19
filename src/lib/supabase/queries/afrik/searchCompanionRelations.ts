import { createServerClient } from "@/lib/supabase/server";
import type { CompanionRelatedSubject } from "@/lib/search/companionRelations";

export type SearchCompanionSubjectType =
  "people" | "country" | "languageFamily" | "language" | "patronyme";

export interface SearchCompanionSubjectRef {
  type: SearchCompanionSubjectType;
  id: string;
}

export type SearchCompanionRelatedSubject = CompanionRelatedSubject;

type SearchClient = ReturnType<typeof createServerClient>;

const MAX_UNIQUE_SUBJECTS = 20;
const EMPTY_RESULT = { data: [], error: null } as const;

// @req REQ-180
export function searchCompanionSubjectKey(
  type: SearchCompanionSubjectType,
  id: string
): string {
  return `${type}:${id}`;
}

function uniqueSubjects(
  subjects: readonly SearchCompanionSubjectRef[]
): SearchCompanionSubjectRef[] {
  return Array.from(
    new Map(
      subjects.map((subject) => [
        searchCompanionSubjectKey(subject.type, subject.id),
        subject,
      ])
    ).values()
  );
}

function idsOf(
  subjects: readonly SearchCompanionSubjectRef[],
  type: SearchCompanionSubjectType
): string[] {
  return subjects
    .filter((subject) => subject.type === type)
    .map((subject) => subject.id);
}

function asRows(value: unknown): Record<string, unknown>[] {
  return Array.isArray(value)
    ? value.filter(
        (row): row is Record<string, unknown> =>
          Boolean(row) && typeof row === "object" && !Array.isArray(row)
      )
    : [];
}

function failure(table: string, error: unknown): Error {
  const message =
    error && typeof error === "object" && "message" in error
      ? String((error as { message: unknown }).message)
      : String(error);
  return new Error(
    `Failed to load search companion relations from ${table}: ${message}`
  );
}

function text(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value : undefined;
}

function contentOf(row: Record<string, unknown>): Record<string, unknown> {
  return row.content &&
    typeof row.content === "object" &&
    !Array.isArray(row.content)
    ? (row.content as Record<string, unknown>)
    : {};
}

function relatedPeopleFrom(
  value: unknown,
  field: "associatedPeoples" | "majorPeoples"
): string[] {
  const entries = (value as Record<string, unknown> | undefined)?.[field];
  if (!Array.isArray(entries)) return [];
  return entries.flatMap((entry) => {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) return [];
    const id = text((entry as Record<string, unknown>).peopleId);
    return id ? [id] : [];
  });
}

function compareText(left: unknown, right: unknown): number {
  const a = String(left ?? "");
  const b = String(right ?? "");
  return a === b ? 0 : a < b ? -1 : 1;
}

function addRelated(
  graph: Map<string, SearchCompanionRelatedSubject[]>,
  subjectKey: string,
  related: SearchCompanionRelatedSubject
): void {
  const held = graph.get(subjectKey);
  if (!held) return;
  const duplicate = held.some(
    (candidate) =>
      candidate.entityType === related.entityType &&
      candidate.entityId === related.entityId
  );
  if (!duplicate) held.push(related);
}

/**
 * Load the direct corpus neighbours of at most twenty typed search subjects.
 * Returned nodes are ring 1 only: this function never follows a related node.
 */
// @req REQ-180
export async function loadSearchCompanionRelations(
  subjects: readonly SearchCompanionSubjectRef[],
  client: SearchClient = createServerClient()
): Promise<Map<string, SearchCompanionRelatedSubject[]>> {
  const unique = uniqueSubjects(subjects);
  if (unique.length > MAX_UNIQUE_SUBJECTS) {
    throw new RangeError(
      `Search companion relations accept at most ${MAX_UNIQUE_SUBJECTS} unique subjects`
    );
  }
  if (unique.length === 0) return new Map();

  const graph = new Map<string, SearchCompanionRelatedSubject[]>(
    unique.map((subject) => [
      searchCompanionSubjectKey(subject.type, subject.id),
      [],
    ])
  );
  const peopleIds = idsOf(unique, "people");
  const countryIds = idsOf(unique, "country");
  const familyIds = idsOf(unique, "languageFamily");
  const languageIds = idsOf(unique, "language");
  const patronymeIds = idsOf(unique, "patronyme");

  const peoplePromise =
    peopleIds.length > 0
      ? client
          .from("afrik_peoples")
          .select("id, name_main, language_family_id")
          .in("id", peopleIds)
          .order("id", { ascending: true })
      : Promise.resolve(EMPTY_RESULT);
  const peopleCountriesPromise =
    peopleIds.length > 0
      ? client
          .from("afrik_people_countries")
          .select("people_id, country_id")
          .in("people_id", peopleIds)
          .order("country_id", { ascending: true })
      : Promise.resolve(EMPTY_RESULT);
  const familyMembersPromise =
    familyIds.length > 0
      ? client
          .from("afrik_peoples")
          .select("id, name_main, language_family_id")
          .in("language_family_id", familyIds)
          .order("name_main", { ascending: true })
          .order("id", { ascending: true })
      : Promise.resolve(EMPTY_RESULT);
  const familiesPromise =
    familyIds.length > 0
      ? client
          .from("afrik_language_families")
          .select("id, content")
          .in("id", familyIds)
          .order("id", { ascending: true })
      : Promise.resolve(EMPTY_RESULT);
  const countriesPromise =
    countryIds.length > 0
      ? client
          .from("afrik_countries")
          .select("id, content")
          .in("id", countryIds)
          .order("id", { ascending: true })
      : Promise.resolve(EMPTY_RESULT);
  const languagesPromise =
    languageIds.length > 0
      ? client
          .from("afrik_languages")
          .select("id, family_id")
          .in("id", languageIds)
          .order("id", { ascending: true })
      : Promise.resolve(EMPTY_RESULT);
  const languagePeoplesPromise =
    languageIds.length > 0
      ? client
          .from("afrik_people_languages")
          .select("language_id, people_id")
          .in("language_id", languageIds)
          .order("people_id", { ascending: true })
      : Promise.resolve(EMPTY_RESULT);
  const patronymePeoplesPromise =
    patronymeIds.length > 0
      ? client
          .from("afrik_patronyme_peoples")
          .select("patronyme_id, people_id")
          .in("patronyme_id", patronymeIds)
          .order("people_id", { ascending: true })
      : Promise.resolve(EMPTY_RESULT);

  const [
    peopleResult,
    peopleCountriesResult,
    familyMembersResult,
    familiesResult,
    countriesResult,
    languagesResult,
    languagePeoplesResult,
    patronymePeoplesResult,
  ] = await Promise.all([
    peoplePromise,
    peopleCountriesPromise,
    familyMembersPromise,
    familiesPromise,
    countriesPromise,
    languagesPromise,
    languagePeoplesPromise,
    patronymePeoplesPromise,
  ]);

  const results = [
    ["afrik_peoples", peopleResult],
    ["afrik_people_countries", peopleCountriesResult],
    ["afrik_peoples", familyMembersResult],
    ["afrik_language_families", familiesResult],
    ["afrik_countries", countriesResult],
    ["afrik_languages", languagesResult],
    ["afrik_people_languages", languagePeoplesResult],
    ["afrik_patronyme_peoples", patronymePeoplesResult],
  ] as const;
  for (const [table, result] of results) {
    if (result.error) throw failure(table, result.error);
  }

  for (const row of asRows(peopleResult.data)) {
    const id = text(row.id);
    const familyId = text(row.language_family_id);
    if (!id || !familyId) continue;
    addRelated(graph, searchCompanionSubjectKey("people", id), {
      relation: "linked-family",
      entityType: "languageFamily",
      entityId: familyId,
    });
  }
  for (const row of asRows(peopleCountriesResult.data).sort((left, right) =>
    compareText(left.country_id, right.country_id)
  )) {
    const peopleId = text(row.people_id);
    const countryId = text(row.country_id);
    if (!peopleId || !countryId) continue;
    addRelated(graph, searchCompanionSubjectKey("people", peopleId), {
      relation: "linked-country",
      entityType: "country",
      entityId: countryId,
    });
  }

  const familyRows = new Map(
    asRows(familiesResult.data).flatMap((row) => {
      const id = text(row.id);
      return id ? [[id, row] as const] : [];
    })
  );
  const directMembers = asRows(familyMembersResult.data).sort(
    (left, right) =>
      compareText(left.name_main, right.name_main) ||
      compareText(left.id, right.id)
  );
  for (const familyId of familyIds) {
    const key = searchCompanionSubjectKey("languageFamily", familyId);
    const family = familyRows.get(familyId);
    for (const peopleId of relatedPeopleFrom(
      family ? contentOf(family) : {},
      "associatedPeoples"
    )) {
      addRelated(graph, key, {
        relation: "linked-people",
        entityType: "people",
        entityId: peopleId,
      });
    }
    for (const row of directMembers) {
      if (row.language_family_id !== familyId) continue;
      const peopleId = text(row.id);
      if (!peopleId) continue;
      addRelated(graph, key, {
        relation: "linked-people",
        entityType: "people",
        entityId: peopleId,
      });
    }
  }

  for (const row of asRows(countriesResult.data)) {
    const countryId = text(row.id);
    if (!countryId) continue;
    const key = searchCompanionSubjectKey("country", countryId);
    for (const peopleId of relatedPeopleFrom(contentOf(row), "majorPeoples")) {
      addRelated(graph, key, {
        relation: "linked-people",
        entityType: "people",
        entityId: peopleId,
      });
    }
  }

  for (const row of asRows(languagesResult.data)) {
    const languageId = text(row.id);
    const familyId = text(row.family_id);
    if (!languageId || !familyId) continue;
    addRelated(graph, searchCompanionSubjectKey("language", languageId), {
      relation: "linked-family",
      entityType: "languageFamily",
      entityId: familyId,
    });
  }
  for (const row of asRows(languagePeoplesResult.data).sort((left, right) =>
    compareText(left.people_id, right.people_id)
  )) {
    const languageId = text(row.language_id);
    const peopleId = text(row.people_id);
    if (!languageId || !peopleId) continue;
    addRelated(graph, searchCompanionSubjectKey("language", languageId), {
      relation: "linked-people",
      entityType: "people",
      entityId: peopleId,
    });
  }
  for (const row of asRows(patronymePeoplesResult.data).sort((left, right) =>
    compareText(left.people_id, right.people_id)
  )) {
    const patronymeId = text(row.patronyme_id);
    const peopleId = text(row.people_id);
    if (!patronymeId || !peopleId) continue;
    addRelated(graph, searchCompanionSubjectKey("patronyme", patronymeId), {
      relation: "linked-people",
      entityType: "people",
      entityId: peopleId,
    });
  }

  return graph;
}
