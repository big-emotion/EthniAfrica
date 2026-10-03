import { describe, expect, it } from "vitest";

import {
  MAX_SEARCH_COMPANION_SUBJECTS,
  searchCompanionsDataSchema,
  searchCompanionsQuerySchema,
} from "@/api/v2/schemas/searchCompanions";

describe("search companions schema", () => {
  // @req REQ-180
  it("parses, trims and de-duplicates typed subjects in request order", () => {
    expect(
      searchCompanionsQuerySchema.parse({
        subjects:
          "people:PPL_BASSA, country:CMR,people:PPL_BASSA,language:bas,languageFamily:FLG_BANTU,patronyme:PAT_KEITA",
      })
    ).toEqual({
      lang: "fr",
      subjects: [
        { type: "people", id: "PPL_BASSA" },
        { type: "country", id: "CMR" },
        { type: "language", id: "bas" },
        { type: "languageFamily", id: "FLG_BANTU" },
        { type: "patronyme", id: "PAT_KEITA" },
      ],
    });
  });

  // @req REQ-180
  it("accepts the two published locales and rejects an unknown locale", () => {
    expect(
      searchCompanionsQuerySchema.parse({
        subjects: "country:NGA",
        lang: "en",
      }).lang
    ).toBe("en");
    expect(
      searchCompanionsQuerySchema.safeParse({
        subjects: "country:NGA",
        lang: "es",
      }).success
    ).toBe(false);
  });

  // The word is what the reader typed. It is kept as typed and trimmed: the
  // catalog folds it, so the API does not decide what counts as the same word.
  // @req REQ-180
  it("accepts the reader's word, trimmed, next to or instead of subjects", () => {
    expect(searchCompanionsQuerySchema.parse({ word: "  Zombie " }).word).toBe(
      "Zombie"
    );
    expect(
      searchCompanionsQuerySchema.parse({
        subjects: "country:NGA",
        word: "nigeria",
      })
    ).toMatchObject({
      subjects: [{ type: "country", id: "NGA" }],
      word: "nigeria",
    });
  });

  // @req REQ-180
  it("rejects a word too long to be a name", () => {
    expect(
      searchCompanionsQuerySchema.safeParse({ word: "a".repeat(81) }).success
    ).toBe(false);
  });

  // @req REQ-180
  it("accepts an absent subject list for the recent-content fallback", () => {
    expect(searchCompanionsQuerySchema.parse({})).toEqual({
      lang: "fr",
      subjects: [],
    });
    expect(
      searchCompanionsQuerySchema.parse({ subjects: "" }).subjects
    ).toEqual([]);
  });

  // @req REQ-180
  it.each([
    ["person:PRS_1", "an unsupported subject type"],
    ["people:NGA", "a malformed people id"],
    ["country:Nigeria", "a malformed country id"],
    ["languageFamily:BANTU", "a malformed family id"],
    ["language:LINGALA", "a malformed language id"],
    ["patronyme:KEITA", "a malformed patronyme id"],
  ])("rejects %s (%s)", (subjects) => {
    expect(searchCompanionsQuerySchema.safeParse({ subjects }).success).toBe(
      false
    );
  });

  // @req REQ-180
  it("accepts at most twenty unique typed subjects", () => {
    const atLimit = Array.from(
      { length: MAX_SEARCH_COMPANION_SUBJECTS },
      (_, index) => `people:PPL_${index}`
    ).join(",");
    const overLimit = `${atLimit},country:NGA`;
    const duplicates = `${atLimit},people:PPL_0,people:PPL_1`;

    expect(
      searchCompanionsQuerySchema.safeParse({ subjects: atLimit }).success
    ).toBe(true);
    expect(
      searchCompanionsQuerySchema.safeParse({ subjects: duplicates }).success
    ).toBe(true);
    expect(
      searchCompanionsQuerySchema.safeParse({ subjects: overLimit }).success
    ).toBe(false);
  });

  // @req REQ-180
  it("requires every returned item to carry typed widening provenance", () => {
    const parsed = searchCompanionsDataSchema.parse({
      subjects: [{ entityType: "country", entityId: "NGA" }],
      shorts: {
        count: 1,
        items: [
          {
            id: "short-nigeria",
            href: "/fr/decouvertes/nigeria",
            name: "Nigeria",
            description: "A sourced production.",
            publishedAt: "2026-09-01",
            durationSeconds: 47,
            watchUrl: "https://www.youtube.com/watch?v=test",
            poster: {
              src: "/posters/nigeria.jpg",
              alt: "Affiche : D’où vient le nom « Nigeria » ?",
              width: 270,
              height: 480,
            },
            source: {
              title: "Source",
              url: "https://example.org/source",
              tier: "referenced",
            },
            match: {
              relation: "exact",
              entityType: "country",
              entityId: "NGA",
            },
          },
        ],
      },
      anecdotes: { count: 0, items: [] },
      proverbs: { count: 0, items: [] },
      images: { count: 0, items: [] },
      quiz: { count: 0, item: null },
    });

    expect(parsed.shorts.items[0].match).toEqual({
      relation: "exact",
      entityType: "country",
      entityId: "NGA",
    });
    const withoutMatch: Partial<(typeof parsed.shorts.items)[number]> = {
      ...parsed.shorts.items[0],
    };
    delete withoutMatch.match;
    expect(
      searchCompanionsDataSchema.safeParse({
        ...parsed,
        shorts: {
          ...parsed.shorts,
          items: [withoutMatch],
        },
      }).success
    ).toBe(false);
  });

  // @req REQ-180
  it("accepts ISO dates and offset date-times for published shorts", () => {
    const base = {
      subjects: [],
      shorts: { count: 0, items: [] },
      anecdotes: { count: 0, items: [] },
      proverbs: { count: 0, items: [] },
      images: { count: 0, items: [] },
      quiz: { count: 0, item: null },
    };
    const short = {
      id: "short-nigeria",
      href: "/fr/decouvertes/nigeria",
      name: "Nigeria",
      description: "A sourced production.",
      publishedAt: "2026-09-01T18:30:00+02:00",
      durationSeconds: 47,
      watchUrl: "https://www.youtube.com/watch?v=test",
      poster: {
        src: "/posters/nigeria.jpg",
        alt: "Affiche : D’où vient le nom « Nigeria » ?",
        width: 270,
        height: 480,
      },
      source: {
        title: "Source",
        url: "https://example.org/source",
        tier: "referenced" as const,
      },
      match: {
        relation: "exact" as const,
        entityType: "country" as const,
        entityId: "NGA",
      },
    };

    expect(
      searchCompanionsDataSchema.safeParse({
        ...base,
        shorts: { count: 1, items: [short] },
      }).success
    ).toBe(true);
    expect(
      searchCompanionsDataSchema.safeParse({
        ...base,
        shorts: {
          count: 1,
          items: [{ ...short, publishedAt: "September 1, 2026" }],
        },
      }).success
    ).toBe(false);
  });

  // @req REQ-180
  it("rejects unknown quiz templates and out-of-range answers", () => {
    const quiz = {
      id: "quiz-nigeria",
      templateId: "T1",
      contentLanguage: "fr" as const,
      prompt: "Quel nom ?",
      stimulus: null,
      options: ["Nigeria", "Niger"],
      correctOption: 0,
      explanation: "La réponse est Nigeria.",
      assertionId: "AST_NGA_NAME",
      source: {
        title: "Source",
        url: "https://example.org/source",
        tier: "referenced" as const,
      },
      entity: { type: "country" as const, id: "NGA" },
      match: {
        relation: "exact" as const,
        entityType: "country" as const,
        entityId: "NGA",
      },
    };
    const data = {
      subjects: [],
      shorts: { count: 0, items: [] },
      anecdotes: { count: 0, items: [] },
      proverbs: { count: 0, items: [] },
      images: { count: 0, items: [] },
      quiz: { count: 1, item: quiz },
    };

    expect(searchCompanionsDataSchema.safeParse(data).success).toBe(true);
    expect(
      searchCompanionsDataSchema.safeParse({
        ...data,
        quiz: { count: 1, item: { ...quiz, templateId: "T5" } },
      }).success
    ).toBe(false);
    expect(
      searchCompanionsDataSchema.safeParse({
        ...data,
        quiz: { count: 1, item: { ...quiz, correctOption: 2 } },
      }).success
    ).toBe(false);
  });
});
