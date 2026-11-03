import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  searchCompanionsDataSchema,
  type SearchCompanionsData,
} from "@/api/v2/schemas/searchCompanions";
import type { SearchWithLeads } from "@/lib/afrikLoader";
import type { SearchResult } from "@/types/afrik-frontend";

const loader = vi.hoisted(() => ({
  searchWithLeads: vi.fn(),
  loadSearchCompanions: vi.fn(),
  loadSubjectNameHistories: vi.fn(),
}));

vi.mock("@/lib/afrikLoader", () => loader);

import { loadSearchReading } from "@/lib/search/searchReading";

/**
 * `loadSearchReading` is the one composition behind both the `?q=` page and a
 * name's address page. These pin its order of reads through the loader it
 * calls: the search first, the subjects next, the feed's companions only once
 * the search has answered, and nothing more for a superseded query.
 */

const lingalaPeople: SearchResult = {
  type: "people",
  id: "PPL_LINGALA",
  name: "Lingala",
  exactMatch: true,
  relevance: 0.9,
};
const lingalaLanguage: SearchResult = {
  type: "language",
  id: "lin",
  name: "Lingala",
  exactMatch: true,
  relevance: 0.8,
};
const kongo: SearchResult = {
  type: "people",
  id: "PPL_KONGO",
  name: "Kongo",
  relevance: 0.2,
};

// A valid, empty companions payload: the feed has no shorts, tales, proverbs
// or quiz to show, which is enough to classify it.
const emptyCompanions: SearchCompanionsData = searchCompanionsDataSchema.parse({
  subjects: [],
  shorts: { count: 0, items: [] },
  anecdotes: { count: 0, items: [] },
  proverbs: { count: 0, items: [] },
  quiz: { count: 0, item: null },
});

function envelope(overrides: Partial<SearchWithLeads> = {}): SearchWithLeads {
  return {
    results: [kongo, lingalaPeople, lingalaLanguage],
    leads: [],
    nearNames: [],
    counts: {} as SearchWithLeads["counts"],
    answered: true,
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  loader.loadSearchCompanions.mockResolvedValue(emptyCompanions);
  loader.loadSubjectNameHistories.mockResolvedValue([]);
});

describe("loadSearchReading", () => {
  // @req REQ-180
  it("returns an empty reading and reads nothing more when the API did not answer", async () => {
    loader.searchWithLeads.mockResolvedValue(
      envelope({ results: [], answered: false })
    );
    const onAnswered = vi.fn();

    const reading = await loadSearchReading("lingala", {
      language: "fr",
      onAnswered,
    });

    expect(reading).toMatchObject({
      query: "lingala",
      answered: false,
      subjects: [],
      companions: null,
      nameHistories: [],
      feedState: null,
      nextSteps: [],
      nearNames: [],
      nameAnswers: [],
      wordAnswers: [],
      nameSuggestions: [],
    });
    expect(onAnswered).not.toHaveBeenCalled();
    expect(loader.loadSearchCompanions).not.toHaveBeenCalled();
    expect(loader.loadSubjectNameHistories).not.toHaveBeenCalled();
  });

  // @req REQ-180
  it("passes the query, language and result ceiling to the search", async () => {
    loader.searchWithLeads.mockResolvedValue(envelope());

    await loadSearchReading("lingala", { language: "fr" });

    expect(loader.searchWithLeads).toHaveBeenCalledWith(
      "lingala",
      expect.objectContaining({ limit: 20, lang: "fr" })
    );
  });

  // @req REQ-180
  it("scopes the search to a relation's family or country", async () => {
    loader.searchWithLeads.mockResolvedValue(envelope());

    await loadSearchReading("", {
      language: "fr",
      relation: { kind: "family", id: "FLG_BANTU" },
    });
    await loadSearchReading("", {
      language: "fr",
      relation: { kind: "country", id: "COD" },
    });

    expect(loader.searchWithLeads.mock.calls[0][1]).toMatchObject({
      familyId: "FLG_BANTU",
    });
    expect(loader.searchWithLeads.mock.calls[1][1]).toMatchObject({
      countryId: "COD",
    });
  });

  // @req REQ-200
  it("keeps every entity answering to the name as a subject, none crowned", async () => {
    loader.searchWithLeads.mockResolvedValue(envelope());
    const onAnswered = vi.fn();

    const reading = await loadSearchReading("lingala", {
      language: "fr",
      onAnswered,
    });

    const subjectIds = reading.subjects.map((subject) => subject.id).sort();
    expect(subjectIds).toEqual(["PPL_LINGALA", "lin"].sort());
    expect(reading.subjects.map((subject) => subject.id)).not.toContain(
      "PPL_KONGO"
    );
    expect(onAnswered).toHaveBeenCalledTimes(1);
    expect(onAnswered).toHaveBeenCalledWith(
      envelope().results,
      reading.subjects
    );
  });

  // @req REQ-200
  it("loads the companions and name histories of the subjects and builds the feed", async () => {
    const companions = { ...emptyCompanions, subjects: [] };
    const histories = [{ subject: lingalaPeople, nameHistory: {} as never }];
    loader.searchWithLeads.mockResolvedValue(envelope());
    loader.loadSearchCompanions.mockResolvedValue(companions);
    loader.loadSubjectNameHistories.mockResolvedValue(histories);

    const reading = await loadSearchReading("lingala", { language: "fr" });

    expect(loader.loadSubjectNameHistories).toHaveBeenCalledWith(
      reading.subjects,
      undefined,
      undefined
    );
    const [companionSubjects, language, , query] =
      loader.loadSearchCompanions.mock.calls[0];
    expect(language).toBe("fr");
    expect(query).toBe("lingala");
    expect(companionSubjects).toContainEqual(
      expect.objectContaining({ entityId: "PPL_LINGALA" })
    );
    expect(reading.companions).toBe(companions);
    expect(reading.nameHistories).toBe(histories);
    // Exact matches with no companion found by a wider relation read as exact.
    expect(reading.feedState).toBe("exact");
    expect(reading.answered).toBe(true);
  });

  // @req REQ-180
  it("stops after the search when the query was superseded", async () => {
    const controller = new AbortController();
    loader.searchWithLeads.mockImplementation(async () => {
      controller.abort();
      return envelope();
    });
    const onAnswered = vi.fn();

    await expect(
      loadSearchReading("lingala", {
        language: "fr",
        signal: controller.signal,
        onAnswered,
      })
    ).rejects.toBeDefined();
    expect(onAnswered).not.toHaveBeenCalled();
    expect(loader.loadSearchCompanions).not.toHaveBeenCalled();
  });

  // @req REQ-180
  it("rejects when the companions cannot be read, after reporting the search", async () => {
    loader.searchWithLeads.mockResolvedValue(envelope());
    loader.loadSearchCompanions.mockRejectedValue(new Error("outage"));
    const onAnswered = vi.fn();

    await expect(
      loadSearchReading("lingala", { language: "fr", onAnswered })
    ).rejects.toThrow("outage");
    expect(onAnswered).toHaveBeenCalledTimes(1);
  });
});
