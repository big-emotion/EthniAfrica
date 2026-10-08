/**
 * A published word is answered from the envelope, not from a row: « pharaon »
 * matches no fiche, so there is no row to carry the answer. The registry is
 * replaced by a fixture record — the real one is filed in a data session.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/api/v2/services/searchService", () => ({ ftsSearch: vi.fn() }));
vi.mock("@/lib/productions/ledger", () => ({
  loadProductionLedger: () => [
    {
      campaign: "pharaon-d-ou-vient-le-nom",
      typologie: "mot",
      episode: 18,
      question: { fr: "D'où vient le nom pharaon ?" },
      myth: null,
      subjects: [],
      sitePath: "/fr/about",
      word: {
        label: { fr: "pharaon", en: "pharaoh" },
        queries: ["pharaon", "pharaons", "pharaoh"],
      },
      answer: {
        origin: [
          {
            text: {
              fr: "De l'égyptien per-aa, « la grande maison ».",
              en: "From Egyptian per-aa, “the great house”.",
            },
          },
        ],
      },
      publications: [],
    },
  ],
}));

import { ftsSearch } from "@/api/v2/services/searchService";
import type { FtsSearchResponse } from "@/types/afrik";

import { ftsSearchHandler } from "../search";

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

type Data = {
  wordAnswers?: Array<{ title: string; kind: string }>;
  results: unknown[];
};

async function search(q: string, lang?: "fr", lens?: "quiz") {
  const { data } = (await ftsSearchHandler({
    q,
    limit: 20,
    offset: 0,
    ...(lang ? { lang } : {}),
    ...(lens ? { lens } : {}),
  })) as unknown as { data: Data };
  return data;
}

beforeEach(() => {
  vi.mocked(ftsSearch).mockResolvedValue(emptyResponse());
});

describe("search response word answers", () => {
  // @req REQ-184
  it("carries the answer of a published word with no result row at all", async () => {
    const data = await search("pharaoh");

    expect(data.results).toEqual([]);
    expect(data.wordAnswers).toHaveLength(1);
    expect(data.wordAnswers?.[0]).toMatchObject({
      kind: "word",
      title: "pharaon",
    });
  });

  // @req REQ-184
  it("is an empty list for a word nobody published, and for the quiz lens", async () => {
    expect((await search("zombi")).wordAnswers).toEqual([]);
    expect((await search("pharaon", "fr", "quiz")).wordAnswers).toEqual([]);
  });
});
