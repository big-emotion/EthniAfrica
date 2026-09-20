import { describe, expect, it, vi } from "vitest";

import { loadSearchCompanionQuizCandidates } from "@/lib/supabase/queries/afrik/searchCompanionQuiz";

function thenableQuery(result: { data: unknown; error: unknown }) {
  const query: Record<string, ReturnType<typeof vi.fn>> & {
    then?: PromiseLike<typeof result>["then"];
  } = {
    select: vi.fn(),
    eq: vi.fn(),
    is: vi.fn(),
    in: vi.fn(),
    order: vi.fn(),
  };
  for (const method of ["select", "eq", "is", "in", "order"] as const) {
    query[method].mockReturnValue(query);
  }
  query.then = (resolve, reject) =>
    Promise.resolve(result).then(resolve, reject);
  return query;
}

function clientFor(results: Record<string, { data: unknown; error: unknown }>) {
  const queries = Object.fromEntries(
    Object.entries(results).map(([table, result]) => [
      table,
      thenableQuery(result),
    ])
  );
  const from = vi.fn((table: string) => {
    const query = queries[table];
    if (!query) throw new Error(`Unexpected query for ${table}`);
    return query;
  });
  return { client: { from }, from, queries };
}

const question = {
  id: "quiz-nigeria",
  template_id: "T1",
  difficulty: 1,
  entity_type: "country",
  entity_id: "NGA",
  field_path: "identite.nom",
  prompt_fr: "Quel nom ?",
  stimulus_fr: null,
  options_fr: ["Nigeria", "Niger"],
  correct_option: 0,
  explanation_fr: "La réponse est Nigeria.",
  assertion_id: "AST_NGA_NAME",
  source_ids: ["SRC_NGA"],
};

describe("search companion quiz query", () => {
  // @req REQ-180
  it("returns only currently playable people or country questions with their best source", async () => {
    const { client, from } = clientFor({
      quiz_questions: { data: [question], error: null },
      confidence_scores: {
        data: [
          {
            entity_type: "country",
            entity_id: "NGA",
            score: 0.8,
            last_human_audit_at: null,
          },
        ],
        error: null,
      },
      flags: { data: [], error: null },
      sources: {
        data: [
          {
            id: "SRC_NGA",
            title: "A referenced source",
            url: "https://example.org/nigeria",
            tier: "referenced",
            verified_at: null,
            source_kind: "written",
            oral_narratives: null,
          },
        ],
        error: null,
      },
    });

    const candidates = await loadSearchCompanionQuizCandidates(
      [
        { relation: "exact", entityType: "country", entityId: "NGA" },
        {
          relation: "linked-family",
          entityType: "languageFamily",
          entityId: "FLG_BANTU",
        },
      ],
      "fr",
      client as never
    );

    expect(from.mock.calls.map(([table]) => table)).toEqual([
      "quiz_questions",
      "confidence_scores",
      "flags",
      "sources",
    ]);
    expect(candidates).toEqual([
      {
        id: "quiz-nigeria",
        eligible: true,
        difficulty: 1,
        templateId: "T1",
        subjects: [{ entityType: "country", entityId: "NGA" }],
        contentLanguage: "fr",
        prompt: "Quel nom ?",
        stimulus: null,
        options: ["Nigeria", "Niger"],
        correctOption: 0,
        explanation: "La réponse est Nigeria.",
        assertionId: "AST_NGA_NAME",
        source: {
          title: "A referenced source",
          url: "https://example.org/nigeria",
          tier: "referenced",
        },
        entity: { type: "country", id: "NGA" },
      },
    ]);
  });

  // @req REQ-180
  it("fails closed when confidence, sources or flags no longer satisfy the quiz gate", async () => {
    const { client } = clientFor({
      quiz_questions: {
        data: [
          question,
          { ...question, id: "quiz-flagged", entity_id: "GHA" },
          { ...question, id: "quiz-unverified", entity_id: "BEN" },
        ],
        error: null,
      },
      confidence_scores: {
        data: [
          { entity_type: "country", entity_id: "NGA", score: 0.59 },
          { entity_type: "country", entity_id: "GHA", score: 0.8 },
          { entity_type: "country", entity_id: "BEN", score: 0.8 },
        ],
        error: null,
      },
      flags: {
        data: [{ entity_id: "GHA", status: "open" }],
        error: null,
      },
      sources: {
        data: [
          {
            id: "SRC_NGA",
            title: "Unverified source",
            url: null,
            tier: "unverified",
            verified_at: null,
            source_kind: "written",
            oral_narratives: null,
          },
        ],
        error: null,
      },
    });

    await expect(
      loadSearchCompanionQuizCandidates(
        [
          { relation: "exact", entityType: "country", entityId: "NGA" },
          { relation: "exact", entityType: "country", entityId: "GHA" },
          { relation: "exact", entityType: "country", entityId: "BEN" },
        ],
        "fr",
        client as never
      )
    ).resolves.toEqual([]);
  });

  // @req REQ-180
  it.each(["accepted", "rejected", "withdrawn", "duplicate"])(
    "treats the terminal %s flag status as closed",
    async (status) => {
      const { client } = clientFor({
        quiz_questions: { data: [question], error: null },
        confidence_scores: {
          data: [
            {
              entity_type: "country",
              entity_id: "NGA",
              score: 0.8,
              last_human_audit_at: null,
            },
          ],
          error: null,
        },
        flags: {
          data: [{ entity_type: "country", entity_id: "NGA", status }],
          error: null,
        },
        sources: {
          data: [
            {
              id: "SRC_NGA",
              title: "A referenced source",
              url: "https://example.org/nigeria",
              tier: "referenced",
              verified_at: null,
              source_kind: "written",
              oral_narratives: null,
            },
          ],
          error: null,
        },
      });

      await expect(
        loadSearchCompanionQuizCandidates(
          [{ relation: "exact", entityType: "country", entityId: "NGA" }],
          "fr",
          client as never
        )
      ).resolves.toHaveLength(1);
    }
  );

  // @req REQ-180
  it("queries and counts only open flags", async () => {
    const { client, queries } = clientFor({
      quiz_questions: { data: [question], error: null },
      confidence_scores: {
        data: [
          {
            entity_type: "country",
            entity_id: "NGA",
            score: 0.8,
            last_human_audit_at: null,
          },
        ],
        error: null,
      },
      flags: {
        data: [{ entity_type: "country", entity_id: "NGA", status: "open" }],
        error: null,
      },
      sources: {
        data: [
          {
            id: "SRC_NGA",
            title: "A referenced source",
            url: "https://example.org/nigeria",
            tier: "referenced",
            verified_at: null,
            source_kind: "written",
            oral_narratives: null,
          },
        ],
        error: null,
      },
    });

    await expect(
      loadSearchCompanionQuizCandidates(
        [{ relation: "exact", entityType: "country", entityId: "NGA" }],
        "fr",
        client as never
      )
    ).resolves.toEqual([]);
    expect(queries.flags.eq).toHaveBeenCalledWith("status", "open");
  });

  // @req REQ-180
  it("chunks large ring-1 target sets before the question filter", async () => {
    const targets = Array.from({ length: 1_000 }, (_, index) => ({
      relation: "linked-people" as const,
      entityType: "people" as const,
      entityId: `PPL_${String(index).padStart(5, "0")}`,
    }));
    const { client, from, queries } = clientFor({
      quiz_questions: { data: [], error: null },
    });

    await expect(
      loadSearchCompanionQuizCandidates(targets, "fr", client as never)
    ).resolves.toEqual([]);

    expect(
      from.mock.calls.filter(([table]) => table === "quiz_questions")
    ).toHaveLength(2);
    const chunks = queries.quiz_questions.in.mock.calls.map(
      ([, ids]) => ids as string[]
    );
    expect(chunks.flat()).toEqual(targets.map(({ entityId }) => entityId));
    expect(chunks.every((ids) => ids.length < targets.length)).toBe(true);
  });

  // @req REQ-180
  it("chunks confidence, open-flag and source filters by their URL budget", async () => {
    const targets = Array.from({ length: 1_000 }, (_, index) => ({
      relation: "linked-people" as const,
      entityType: "people" as const,
      entityId: `PPL_${String(index).padStart(5, "0")}`,
    }));
    const sourceIds = Array.from(
      { length: 300 },
      (_, index) => `00000000-0000-0000-0000-${String(index).padStart(12, "0")}`
    );
    const firstEntity = targets[0].entityId;
    const row = {
      ...question,
      entity_type: "people",
      entity_id: firstEntity,
      source_ids: sourceIds,
    };
    const { client, queries } = clientFor({
      quiz_questions: { data: [row], error: null },
      confidence_scores: {
        data: [
          {
            entity_type: "people",
            entity_id: firstEntity,
            score: 0.8,
            last_human_audit_at: null,
          },
        ],
        error: null,
      },
      flags: { data: [], error: null },
      sources: {
        data: sourceIds.map((id) => ({
          id,
          title: `Source ${id}`,
          url: `https://example.org/${id}`,
          tier: "referenced",
          verified_at: null,
          source_kind: "written",
          oral_narratives: null,
        })),
        error: null,
      },
    });

    await loadSearchCompanionQuizCandidates(targets, "fr", client as never);

    for (const table of ["confidence_scores", "flags", "sources"] as const) {
      const chunks = queries[table].in.mock.calls.map(
        ([, ids]) => ids as string[]
      );
      expect(chunks.length, table).toBeGreaterThan(1);
      expect(
        chunks.every(
          (ids) => ids.reduce((sum, id) => sum + id.length + 3, 0) <= 8_000
        ),
        table
      ).toBe(true);
    }
    expect(queries.flags.eq).toHaveBeenCalledWith("status", "open");
  });

  // @req REQ-180
  it("does not query the database when no target can carry a quiz", async () => {
    const from = vi.fn();
    await expect(
      loadSearchCompanionQuizCandidates(
        [
          {
            relation: "exact",
            entityType: "patronyme",
            entityId: "PAT_KEITA",
          },
        ],
        "fr",
        { from } as never
      )
    ).resolves.toEqual([]);
    expect(from).not.toHaveBeenCalled();
  });

  // @req REQ-180
  it("propagates database failures with the failing table", async () => {
    const { client } = clientFor({
      quiz_questions: {
        data: null,
        error: { message: "questions unavailable" },
      },
    });

    await expect(
      loadSearchCompanionQuizCandidates(
        [{ relation: "exact", entityType: "country", entityId: "NGA" }],
        "fr",
        client as never
      )
    ).rejects.toThrow(
      "Failed to load search companion quiz candidates from quiz_questions: questions unavailable"
    );
  });
});
