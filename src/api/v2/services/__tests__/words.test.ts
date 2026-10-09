import { beforeEach, describe, expect, it, vi } from "vitest";

const fromMock = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createServerClient: () => ({ from: fromMock }),
}));

vi.mock("@/lib/api/logger", () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

import { getWordById, listWords } from "../words";

function query(result: { data: unknown; error: unknown; count?: number }) {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {};
  for (const method of ["select", "eq", "order"]) {
    chain[method] = vi.fn(() => chain);
  }
  chain.range = vi.fn(() => Promise.resolve(result));
  chain.maybeSingle = vi.fn(() => Promise.resolve(result));
  return chain;
}

const nameHistory = {
  summary: "Le mot race a d'abord voulu dire la lignée.",
  names: [{ nameText: "race" }],
};

const wordRow = {
  id: "WRD_RACE",
  name_main: "race",
  word_language: "fra",
  definition: "Un mot qui a d'abord désigné une lignée.",
  content: {
    relatedSubjects: [{ id: "FLG_MANDE", relation: "r" }],
    gaps: ["g"],
    sources: [],
  },
  name_history: nameHistory,
};

describe("word service", () => {
  beforeEach(() => fromMock.mockReset());

  // @req REQ-196
  it("reads one word with its nameHistory and the rest of its fiche", async () => {
    const chain = query({ data: wordRow, error: null });
    fromMock.mockReturnValue(chain);

    const word = await getWordById("WRD_RACE");

    expect(fromMock).toHaveBeenCalledWith("afrik_words");
    expect(chain.eq).toHaveBeenCalledWith("id", "WRD_RACE");
    expect(word).toEqual({
      id: "WRD_RACE",
      nameMain: "race",
      wordLanguage: "fra",
      definition: "Un mot qui a d'abord désigné une lignée.",
      relatedSubjects: [{ id: "FLG_MANDE", relation: "r" }],
      gaps: ["g"],
      sources: [],
      nameHistory,
    });
  });

  // @req REQ-196
  it("answers null for an unknown word", async () => {
    fromMock.mockReturnValue(query({ data: null, error: null }));

    expect(await getWordById("WRD_NONE")).toBeNull();
  });

  // @req REQ-196
  it("throws a database failure rather than answering « no word »", async () => {
    fromMock.mockReturnValue(query({ data: null, error: { message: "down" } }));

    await expect(getWordById("WRD_RACE")).rejects.toEqual({ message: "down" });
  });

  // @req REQ-196
  it("lists one page of words, ordered by name, with the corpus total", async () => {
    const chain = query({
      data: [{ id: "WRD_RACE", name_main: "race", word_language: "fra" }],
      error: null,
      count: 1,
    });
    fromMock.mockReturnValue(chain);

    const page = await listWords(2, 5);

    expect(chain.order).toHaveBeenCalledWith("name_main");
    expect(chain.range).toHaveBeenCalledWith(5, 9);
    expect(page).toEqual({
      total: 1,
      data: [{ id: "WRD_RACE", nameMain: "race", wordLanguage: "fra" }],
    });
  });
});
