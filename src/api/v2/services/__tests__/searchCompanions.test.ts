import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock(
  "@/lib/supabase/queries/afrik/searchCompanionRelations",
  async (importOriginal) => {
    const original =
      await importOriginal<
        typeof import("@/lib/supabase/queries/afrik/searchCompanionRelations")
      >();
    return { ...original, loadSearchCompanionRelations: vi.fn() };
  }
);

vi.mock("@/lib/supabase/queries/afrik/searchCompanionQuiz", () => ({
  loadSearchCompanionQuizCandidates: vi.fn(),
}));

vi.mock("@/lib/search/companionCatalogs", async (importOriginal) => {
  const original =
    await importOriginal<typeof import("@/lib/search/companionCatalogs")>();
  return {
    ...original,
    anecdotesForTargets: vi.fn(),
    imagesForTargets: vi.fn(),
    proverbsForTargets: vi.fn(),
    quizForTargets: vi.fn(),
    shortsForTargets: vi.fn(),
  };
});

import {
  anecdotesForTargets,
  imagesForTargets,
  proverbsForTargets,
  quizForTargets,
  shortsForTargets,
} from "@/lib/search/companionCatalogs";
import { loadSearchCompanionQuizCandidates } from "@/lib/supabase/queries/afrik/searchCompanionQuiz";
import { loadSearchCompanionRelations } from "@/lib/supabase/queries/afrik/searchCompanionRelations";
import { getSearchCompanionSelections } from "../searchCompanions";

const emptySelection = { count: 0, items: [] };

describe("search companions service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(shortsForTargets).mockReturnValue(emptySelection);
    vi.mocked(anecdotesForTargets).mockReturnValue(emptySelection);
    vi.mocked(proverbsForTargets).mockReturnValue(emptySelection);
    vi.mocked(imagesForTargets).mockReturnValue(emptySelection);
    vi.mocked(quizForTargets).mockReturnValue(emptySelection);
    vi.mocked(loadSearchCompanionQuizCandidates).mockResolvedValue([]);
  });

  // @req REQ-180
  it("loads one ring, selects every server-side catalog and preserves item counts", async () => {
    vi.mocked(loadSearchCompanionRelations).mockResolvedValue(
      new Map([
        [
          "people:PPL_EKPEYE",
          [
            {
              relation: "linked-country" as const,
              entityType: "country" as const,
              entityId: "NGA",
            },
          ],
        ],
      ])
    );
    const shortSelection = { count: 8, items: [] };
    const anecdoteSelection = { count: 4, items: [] };
    vi.mocked(shortsForTargets).mockReturnValue(shortSelection);
    vi.mocked(anecdotesForTargets).mockReturnValue(anecdoteSelection);

    const result = await getSearchCompanionSelections({
      lang: "fr",
      subjects: [{ type: "people", id: "PPL_EKPEYE" }],
    });

    const targets = [
      {
        relation: "exact",
        entityType: "people",
        entityId: "PPL_EKPEYE",
      },
      {
        relation: "linked-country",
        entityType: "country",
        entityId: "NGA",
      },
    ];
    expect(loadSearchCompanionRelations).toHaveBeenCalledWith([
      { type: "people", id: "PPL_EKPEYE" },
    ]);
    expect(loadSearchCompanionQuizCandidates).toHaveBeenCalledWith(
      targets,
      "fr"
    );
    expect(shortsForTargets).toHaveBeenCalledWith(
      targets,
      undefined,
      expect.objectContaining({ includeRecent: true })
    );
    expect(anecdotesForTargets).toHaveBeenCalledWith(targets);
    expect(proverbsForTargets).toHaveBeenCalledWith(targets);
    expect(imagesForTargets).toHaveBeenCalledWith(targets);
    expect(quizForTargets).toHaveBeenCalledWith(targets, []);
    expect(result).toMatchObject({
      subjects: [{ type: "people", id: "PPL_EKPEYE" }],
      targets,
      shorts: shortSelection,
      anecdotes: anecdoteSelection,
      proverbs: emptySelection,
      images: emptySelection,
      quiz: emptySelection,
    });
  });

  // @req REQ-180
  it("returns empty selections as a successful service result", async () => {
    vi.mocked(loadSearchCompanionRelations).mockResolvedValue(
      new Map([["country:NGA", []]])
    );

    await expect(
      getSearchCompanionSelections({
        lang: "en",
        subjects: [{ type: "country", id: "NGA" }],
      })
    ).resolves.toMatchObject({
      subjects: [{ type: "country", id: "NGA" }],
      shorts: emptySelection,
      anecdotes: emptySelection,
      proverbs: emptySelection,
      images: emptySelection,
      quiz: emptySelection,
    });
  });

  // @req REQ-180
  it("does not promote a well-formed unknown subject to an exact target", async () => {
    vi.mocked(loadSearchCompanionRelations).mockResolvedValue(new Map());

    const result = await getSearchCompanionSelections({
      lang: "fr",
      subjects: [{ type: "country", id: "ZZZ" }],
    });

    expect(result.targets).toEqual([]);
    expect(shortsForTargets).toHaveBeenCalledWith(
      [],
      undefined,
      expect.objectContaining({ includeRecent: true })
    );
    expect(anecdotesForTargets).toHaveBeenCalledWith([]);
    expect(proverbsForTargets).toHaveBeenCalledWith([]);
    expect(imagesForTargets).toHaveBeenCalledWith([]);
  });

  // @req REQ-180
  it("propagates relation and quiz failures instead of fabricating empty data", async () => {
    vi.mocked(loadSearchCompanionRelations).mockRejectedValueOnce(
      new Error("relations unavailable")
    );
    await expect(
      getSearchCompanionSelections({
        lang: "fr",
        subjects: [{ type: "country", id: "NGA" }],
      })
    ).rejects.toThrow("relations unavailable");

    vi.mocked(loadSearchCompanionRelations).mockResolvedValueOnce(
      new Map([["country:NGA", []]])
    );
    vi.mocked(loadSearchCompanionQuizCandidates).mockRejectedValueOnce(
      new Error("quiz unavailable")
    );
    await expect(
      getSearchCompanionSelections({
        lang: "fr",
        subjects: [{ type: "country", id: "NGA" }],
      })
    ).rejects.toThrow("quiz unavailable");
  });
});
