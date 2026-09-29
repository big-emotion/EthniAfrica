/**
 * The reviewed answer reaches the page through the ordinary v2 search
 * response — no `feedPresentation` fixture is involved. The service is mocked
 * because ranking is proven elsewhere; what is under test is that the handler
 * resolves the searched term to its reviewed answer.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/api/v2/services/searchService", () => ({
  ftsSearch: vi.fn(),
}));

import { ftsSearch } from "@/api/v2/services/searchService";
import { ftsSearchHandler } from "../search";
import type { FtsSearchResponse } from "@/types/afrik";

function emptyResponse(): FtsSearchResponse {
  return {
    peoples: [],
    countries: [],
    families: [],
    persons: [],
    patronymes: [],
    quizzes: [],
    languages: [],
    results: [],
    peoplesTotal: 0,
    countriesTotal: 0,
    familiesTotal: 0,
    personsTotal: 0,
    patronymesTotal: 0,
    quizzesTotal: 0,
    languagesTotal: 0,
    total: 0,
    leads: [],
    nearNames: [],
  } as unknown as FtsSearchResponse;
}

beforeEach(() => {
  vi.mocked(ftsSearch).mockResolvedValue(emptyResponse());
});

describe("search response name answers", () => {
  // @req REQ-178
  it.each(["Lingala", "lingala", " LINGALA "])(
    "attaches the reviewed answer for %s",
    async (q) => {
      const { data } = (await ftsSearchHandler({
        q,
        limit: 20,
        offset: 0,
      })) as unknown as { data: { nameAnswers?: unknown[] } };

      expect(data.nameAnswers).toHaveLength(1);
      expect(data.nameAnswers?.[0]).toMatchObject({
        term: "Lingala",
        subjects: expect.arrayContaining([
          { type: "people", id: "PPL_LINGALA" },
        ]),
      });
    }
  );

  // @req REQ-178
  it("attaches nothing for a name nobody has reviewed", async () => {
    const { data } = (await ftsSearchHandler({
      q: "kossiwa",
      limit: 20,
      offset: 0,
    })) as unknown as { data: { nameAnswers?: unknown[] } };

    expect(data.nameAnswers ?? []).toEqual([]);
  });
});
