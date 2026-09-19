import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/queries/afrik/search", () => ({
  ftsSearchEntities: vi.fn(),
}));

vi.mock("@/lib/supabase/queries/afrik/searchNaming", async (importOriginal) => {
  const actual =
    await importOriginal<
      typeof import("@/lib/supabase/queries/afrik/searchNaming")
    >();
  return { ...actual, loadSearchNamingData: vi.fn() };
});

import { ftsSearch } from "@/api/v2/services/searchService";
import { ftsSearchEntities } from "@/lib/supabase/queries/afrik/search";
import {
  loadSearchNamingData,
  searchNamingKey,
} from "@/lib/supabase/queries/afrik/searchNaming";
import type { FtsSearchResponse } from "@/types/afrik";

function response(): FtsSearchResponse {
  return {
    peoples: [
      {
        id: "PPL_FANG",
        nameMain: "Fang",
        languageFamilyId: "FLG_BANTU",
        currentCountries: ["GAB"],
        classificationStatus: null,
        content: {
          appellations: {
            mainName: "Fang",
            selfAppellation: "Fang",
            exonyms: ["Pahouin"],
          },
        },
        languageFamilyName: "Bantu",
        languageFamilyNameEn: "Bantu",
        confidence: 0.8,
        relevance: 1,
        exactMatch: true,
        normalizedScore: 1,
        snippet: null,
      },
    ],
    countries: [
      {
        id: "NGA",
        nameFr: "Nigeria",
        nameEn: "Nigeria",
        etymology: "Niger and -ia.",
        nameOriginActor: "Flora Shaw.",
        content: { historicalNames: { formerNames: ["Niger Area"] } },
        relevance: 0.9,
        exactMatch: true,
        normalizedScore: 0.9,
        snippet: null,
      },
    ],
    families: [
      {
        id: "FLG_BANTU",
        nameFr: "Bantu",
        nameEn: "Bantu",
        classificationStatus: null,
        content: {
          decolonialHeader: { historicalAppellations: ["Bantou"] },
        },
        relevance: 0.8,
        exactMatch: true,
        normalizedScore: 0.8,
        snippet: null,
      },
    ],
    persons: [
      {
        id: "PER_ONE",
        fullName: "One Person",
        roleCategory: "historian",
        relevance: 0.7,
        exactMatch: false,
        normalizedScore: 0.7,
        snippet: null,
        peopleLinks: [],
      },
    ],
    patronymes: [
      {
        id: "PAT_TRAORE",
        nameMain: "Traoré",
        nameSystem: "clan_name",
        casteOrSocialFunction: null,
        content: { spellings: [{ spelling: "Traoré", attestations: [] }] },
        relevance: 0.6,
        exactMatch: true,
        normalizedScore: 0.6,
        snippet: null,
      },
    ],
    quizzes: [
      {
        id: "quiz-one",
        prompt: "Question?",
        entityType: "people",
        entityId: "PPL_FANG",
        subjectName: "Fang",
        relevance: 0.5,
        exactMatch: false,
        normalizedScore: 0.5,
        snippet: null,
      },
    ],
    languages: [
      {
        id: "lin",
        name: "Lingala",
        nameEn: "Lingala",
        familyId: "FLG_BANTU",
        familyName: "Bantu",
        familyNameEn: "Bantu",
        content: { alternateNames: ["Bangala"] },
        relevance: 0.4,
        exactMatch: true,
        snippet: null,
      },
    ],
    results: [],
    peoplesTotal: 1,
    countriesTotal: 1,
    familiesTotal: 1,
    personsTotal: 1,
    patronymesTotal: 1,
    quizzesTotal: 1,
    languagesTotal: 1,
    total: 7,
    leads: [],
  };
}

describe("search naming projection", () => {
  beforeEach(() => vi.clearAllMocks());

  // @req REQ-180
  it("enriches the five naming classes once and leaves ranking untouched", async () => {
    const raw = response();
    vi.mocked(ftsSearchEntities).mockResolvedValue(raw);
    vi.mocked(loadSearchNamingData).mockResolvedValue(
      new Map([
        [
          searchNamingKey("people", "PPL_FANG"),
          {
            records: [
              {
                id: "name-pahouin",
                entityType: "people",
                entityId: "PPL_FANG",
                form: "Pahouin",
                kind: "exonym",
                problematic: true,
                usedToday: false,
                evidence: [],
              },
            ],
            evidence: [],
          },
        ],
      ])
    );

    const result = await ftsSearch({ q: "fang", limit: 10, offset: 0 });

    expect(loadSearchNamingData).toHaveBeenCalledTimes(1);
    expect(loadSearchNamingData).toHaveBeenCalledWith([
      { type: "people", id: "PPL_FANG" },
      { type: "country", id: "NGA" },
      { type: "languageFamily", id: "FLG_BANTU" },
      { type: "patronyme", id: "PAT_TRAORE" },
      { type: "language", id: "lin" },
    ]);
    expect(result.peoples[0].naming?.presentation.forms[1]).toMatchObject({
      form: "Pahouin",
      problematic: "recorded",
    });
    expect(result.countries[0].naming?.presentation.forms[0].form).toBe(
      "Niger Area"
    );
    expect(result.families[0].naming?.presentation.forms[0].form).toBe(
      "Bantou"
    );
    expect(result.patronymes[0].naming?.presentation.forms[0].selfGiven).toBe(
      null
    );
    expect(result.languages[0].naming?.presentation.forms[0].form).toBe(
      "Bangala"
    );
    expect(result.persons[0]).not.toHaveProperty("naming");
    expect(result.quizzes[0]).not.toHaveProperty("naming");
    expect(result.total).toBe(7);
    expect(result.results).toBe(raw.results);
  });

  // @req REQ-180
  it("fails the request when naming hydration fails instead of reporting false silences", async () => {
    vi.mocked(ftsSearchEntities).mockResolvedValue(response());
    vi.mocked(loadSearchNamingData).mockRejectedValue(
      new Error("naming evidence unavailable")
    );

    await expect(
      ftsSearch({ q: "fang", limit: 10, offset: 0 })
    ).rejects.toThrow("naming evidence unavailable");
  });
});
