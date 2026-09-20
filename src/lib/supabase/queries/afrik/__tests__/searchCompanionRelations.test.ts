import { describe, expect, it, vi } from "vitest";

import {
  loadSearchCompanionRelations,
  searchCompanionSubjectKey,
  type SearchCompanionSubjectRef,
} from "@/lib/supabase/queries/afrik/searchCompanionRelations";

function thenableQuery(result: { data: unknown; error: unknown }) {
  const query: Record<string, ReturnType<typeof vi.fn>> & {
    then?: PromiseLike<typeof result>["then"];
  } = {
    select: vi.fn(),
    in: vi.fn(),
    order: vi.fn(),
  };
  query.select.mockReturnValue(query);
  query.in.mockReturnValue(query);
  query.order.mockReturnValue(query);
  query.then = (resolve, reject) =>
    Promise.resolve(result).then(resolve, reject);
  return query;
}

function subject(
  type: SearchCompanionSubjectRef["type"],
  id: string
): SearchCompanionSubjectRef {
  return { type, id };
}

function clientFor(
  results: Record<string, Array<{ data: unknown; error: unknown }>>
) {
  const queues = Object.fromEntries(
    Object.entries(results).map(([table, values]) => [
      table,
      values.map(thenableQuery),
    ])
  ) as Record<string, ReturnType<typeof thenableQuery>[]>;
  const from = vi.fn((table: string) => {
    const query = queues[table]?.shift();
    if (!query) throw new Error(`Unexpected query for ${table}`);
    return query;
  });
  return { client: { from }, from };
}

describe("batched search companion relations", () => {
  // @req REQ-180
  it("loads deterministic ring-1 relations for all five subject classes without traversing them", async () => {
    const { client, from } = clientFor({
      afrik_peoples: [
        {
          data: [
            {
              id: "PPL_EKPEYE",
              name_main: "Ekpeye",
              language_family_id: "FLG_BENOUECONGO",
            },
          ],
          error: null,
        },
        {
          data: [
            {
              id: "PPL_BAMBARA",
              name_main: "Bambara",
              language_family_id: "FLG_MANDE",
            },
            {
              id: "PPL_MALINKE",
              name_main: "Malinké",
              language_family_id: "FLG_MANDE",
            },
          ],
          error: null,
        },
      ],
      afrik_people_countries: [
        {
          data: [
            { people_id: "PPL_EKPEYE", country_id: "NGA" },
            { people_id: "PPL_EKPEYE", country_id: "NGA" },
          ],
          error: null,
        },
      ],
      afrik_language_families: [
        {
          data: [
            {
              id: "FLG_MANDE",
              content: {
                associatedPeoples: [
                  { peopleId: "PPL_MALINKE" },
                  { peopleId: "PPL_BAMBARA" },
                  { peopleId: "PPL_SONINKE" },
                ],
              },
            },
          ],
          error: null,
        },
      ],
      afrik_countries: [
        {
          data: [
            {
              id: "NGA",
              content: {
                majorPeoples: [
                  { peopleId: "PPL_HAUSA" },
                  { peopleId: "PPL_YORUBA" },
                  { peopleId: "PPL_HAUSA" },
                ],
              },
            },
          ],
          error: null,
        },
      ],
      afrik_languages: [
        {
          data: [{ id: "lin", family_id: "FLG_BANTU" }],
          error: null,
        },
      ],
      afrik_people_languages: [
        {
          data: [
            { language_id: "lin", people_id: "PPL_NGALA" },
            { language_id: "lin", people_id: "PPL_BANGALA" },
          ],
          error: null,
        },
      ],
      afrik_patronyme_peoples: [
        {
          data: [
            { patronyme_id: "PAT_TRAORE", people_id: "PPL_MALINKE" },
            { patronyme_id: "PAT_TRAORE", people_id: "PPL_BAMBARA" },
          ],
          error: null,
        },
      ],
      afrik_patronymes: [
        {
          data: [{ id: "PAT_TRAORE" }],
          error: null,
        },
      ],
    });

    const graph = await loadSearchCompanionRelations(
      [
        subject("people", "PPL_EKPEYE"),
        subject("country", "NGA"),
        subject("languageFamily", "FLG_MANDE"),
        subject("language", "lin"),
        subject("patronyme", "PAT_TRAORE"),
        subject("people", "PPL_EKPEYE"),
      ],
      client as never
    );

    expect(from.mock.calls.map(([table]) => table)).toEqual([
      "afrik_peoples",
      "afrik_people_countries",
      "afrik_peoples",
      "afrik_language_families",
      "afrik_countries",
      "afrik_languages",
      "afrik_people_languages",
      "afrik_patronyme_peoples",
      "afrik_patronymes",
    ]);
    expect([...graph.keys()]).toEqual([
      "people:PPL_EKPEYE",
      "country:NGA",
      "languageFamily:FLG_MANDE",
      "language:lin",
      "patronyme:PAT_TRAORE",
    ]);
    expect(
      graph.get(searchCompanionSubjectKey("people", "PPL_EKPEYE"))
    ).toEqual([
      {
        relation: "linked-family",
        entityType: "languageFamily",
        entityId: "FLG_BENOUECONGO",
      },
      {
        relation: "linked-country",
        entityType: "country",
        entityId: "NGA",
      },
    ]);
    expect(graph.get(searchCompanionSubjectKey("country", "NGA"))).toEqual([
      {
        relation: "linked-people",
        entityType: "people",
        entityId: "PPL_HAUSA",
      },
      {
        relation: "linked-people",
        entityType: "people",
        entityId: "PPL_YORUBA",
      },
    ]);
    expect(
      graph.get(searchCompanionSubjectKey("languageFamily", "FLG_MANDE"))
    ).toEqual([
      {
        relation: "linked-people",
        entityType: "people",
        entityId: "PPL_MALINKE",
      },
      {
        relation: "linked-people",
        entityType: "people",
        entityId: "PPL_BAMBARA",
      },
      {
        relation: "linked-people",
        entityType: "people",
        entityId: "PPL_SONINKE",
      },
    ]);
    expect(graph.get(searchCompanionSubjectKey("language", "lin"))).toEqual([
      {
        relation: "linked-family",
        entityType: "languageFamily",
        entityId: "FLG_BANTU",
      },
      {
        relation: "linked-people",
        entityType: "people",
        entityId: "PPL_BANGALA",
      },
      {
        relation: "linked-people",
        entityType: "people",
        entityId: "PPL_NGALA",
      },
    ]);
    expect(
      graph.get(searchCompanionSubjectKey("patronyme", "PAT_TRAORE"))
    ).toEqual([
      {
        relation: "linked-people",
        entityType: "people",
        entityId: "PPL_BAMBARA",
      },
      {
        relation: "linked-people",
        entityType: "people",
        entityId: "PPL_MALINKE",
      },
    ]);

    // None of Nigeria's major peoples is traversed to its own family/countries,
    // and none of Mandé's peoples is traversed to its countries.
    expect(
      graph.get(searchCompanionSubjectKey("country", "NGA"))
    ).not.toContainEqual(
      expect.objectContaining({ entityType: "languageFamily" })
    );
    expect(
      graph.get(searchCompanionSubjectKey("languageFamily", "FLG_MANDE"))
    ).not.toContainEqual(expect.objectContaining({ entityType: "country" }));
  });

  // @req REQ-180
  it("does no work for an empty input and omits unknown subjects", async () => {
    const emptyClient = { from: vi.fn() };
    expect(
      await loadSearchCompanionRelations([], emptyClient as never)
    ).toEqual(new Map());
    expect(emptyClient.from).not.toHaveBeenCalled();

    const { client } = clientFor({
      afrik_countries: [{ data: [], error: null }],
    });
    const graph = await loadSearchCompanionRelations(
      [subject("country", "ZZZ")],
      client as never
    );
    expect(graph.has("country:ZZZ")).toBe(false);
  });

  // @req REQ-180
  it("rejects more than twenty unique typed subjects before querying", async () => {
    const client = { from: vi.fn() };
    const subjects = Array.from({ length: 21 }, (_, index) =>
      subject("country", `X${String(index).padStart(2, "0")}`)
    );

    await expect(
      loadSearchCompanionRelations(subjects, client as never)
    ).rejects.toThrow("at most 20 unique subjects");
    expect(client.from).not.toHaveBeenCalled();
  });

  // @req REQ-180
  it("propagates a table failure instead of turning it into an empty relation", async () => {
    const { client } = clientFor({
      afrik_languages: [
        { data: null, error: { message: "languages unavailable" } },
      ],
      afrik_people_languages: [{ data: [], error: null }],
    });

    await expect(
      loadSearchCompanionRelations(
        [subject("language", "lin")],
        client as never
      )
    ).rejects.toThrow(
      "Failed to load search companion relations from afrik_languages: languages unavailable"
    );
  });
});
