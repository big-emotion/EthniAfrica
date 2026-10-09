import { describe, it, expect, vi, beforeEach } from "vitest";

const fromMock = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createServerClient: () => ({ from: fromMock }),
}));

vi.mock("@/lib/api/logger", () => ({
  logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

import { getQuizRevealSources, getQuizSubjectNames } from "../quizReveal";

function inQuery(result: { data: unknown; error: unknown }) {
  const query = {
    select: vi.fn(() => query),
    in: vi.fn(() => Promise.resolve(result)),
  };
  return query;
}

beforeEach(() => {
  fromMock.mockReset();
});

describe("getQuizRevealSources", () => {
  // @req REQ-194
  it("reads each source's kind beside its title, year and tier", async () => {
    const query = inQuery({
      data: [
        {
          id: "source-1",
          title: "Ethnologue",
          url: "https://example.org/eth",
          year: 2020,
          tier: "official",
          source_kind: "linguistic_reference",
        },
      ],
      error: null,
    });
    fromMock.mockReturnValue(query);

    const sources = await getQuizRevealSources(["source-1"]);

    expect(fromMock).toHaveBeenCalledWith("sources");
    expect(query.select).toHaveBeenCalledWith(
      expect.stringContaining("source_kind")
    );
    expect(sources.get("source-1")).toEqual({
      id: "source-1",
      title: "Ethnologue",
      url: "https://example.org/eth",
      year: 2020,
      tier: "official",
      sourceKind: "linguistic_reference",
    });
  });

  /**
   * A kind outside the vocabulary must not reach a label lookup, where it
   * would read as « Type non précisé » — it is dropped instead.
   */
  // @req REQ-194
  it("drops a kind the vocabulary does not hold", async () => {
    fromMock.mockReturnValue(
      inQuery({
        data: [
          {
            id: "source-1",
            title: "Ethnologue",
            url: null,
            year: null,
            tier: "official",
            source_kind: "podcast",
          },
        ],
        error: null,
      })
    );

    const sources = await getQuizRevealSources(["source-1"]);

    expect(sources.get("source-1").sourceKind).toBeNull();
  });

  // @req REQ-194
  it("asks the database nothing for an empty list", async () => {
    const sources = await getQuizRevealSources([]);

    expect(sources.size).toBe(0);
    expect(fromMock).not.toHaveBeenCalled();
  });

  // @req REQ-194
  it("answers an empty map when the query fails", async () => {
    fromMock.mockReturnValue(
      inQuery({ data: null, error: { message: "boom" } })
    );

    const sources = await getQuizRevealSources(["source-1"]);

    expect(sources.size).toBe(0);
  });
});

describe("getQuizSubjectNames", () => {
  // @req REQ-194
  it("names a people by its autonym and first exonym, a country by its French name", async () => {
    fromMock.mockImplementation((table: string) =>
      table === "afrik_peoples"
        ? inQuery({
            data: [
              {
                id: "PPL_A",
                content: {
                  appellations: {
                    selfAppellation: "Shona",
                    exonyms: ["Mashona"],
                  },
                },
              },
            ],
            error: null,
          })
        : inQuery({ data: [{ id: "GHA", name_fr: "Ghana" }], error: null })
    );

    const names = await getQuizSubjectNames(["PPL_A"], ["GHA"]);

    expect(names.get("PPL_A")).toEqual({
      type: "people",
      id: "PPL_A",
      autonym: "Shona",
      exonym: "Mashona",
    });
    expect(names.get("GHA")).toEqual({
      type: "country",
      id: "GHA",
      autonym: "Ghana",
      exonym: null,
    });
  });
});
