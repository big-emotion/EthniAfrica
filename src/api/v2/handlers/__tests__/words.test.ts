import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/api/v2/services/words", () => ({
  getWordById: vi.fn(),
  listWords: vi.fn(),
}));

import { getWordById, listWords } from "@/api/v2/services/words";
import { getWordHandler, listWordsHandler } from "../words";

const record = {
  id: "WRD_RACE",
  nameMain: "race",
  wordLanguage: "fra",
  definition: "Un mot.",
  relatedSubjects: [],
  gaps: [],
  sources: [],
  nameHistory: {
    summary: "Le mot race…",
    names: [{ nameText: "race" }, { nameText: "rasse" }],
  },
};

describe("word handlers", () => {
  beforeEach(() => vi.clearAllMocks());

  // @req REQ-196
  it("serves every name the word answers to beside its nameHistory", async () => {
    vi.mocked(getWordById).mockResolvedValue(record as never);

    const outcome = await getWordHandler("WRD_RACE");

    expect(outcome.ok).toBe(true);
    const { data } = (outcome as { envelope: { data: unknown } }).envelope;
    expect(data).toEqual({ ...record, names: ["race", "rasse"] });
  });

  // @req REQ-196
  it("answers NOT_FOUND for an unknown word", async () => {
    vi.mocked(getWordById).mockResolvedValue(null);

    expect(await getWordHandler("WRD_NONE")).toEqual({
      ok: false,
      code: "NOT_FOUND",
      message: "Word not found: WRD_NONE",
    });
  });

  // @req REQ-196
  it("pages the word list in the list envelope", async () => {
    vi.mocked(listWords).mockResolvedValue({
      data: [{ id: "WRD_RACE", nameMain: "race", wordLanguage: "fra" }],
      total: 1,
    });

    const envelope = await listWordsHandler(1, 20);

    expect(listWords).toHaveBeenCalledWith(1, 20);
    expect(envelope.data).toHaveLength(1);
    expect(envelope.errors).toEqual([]);
  });
});
