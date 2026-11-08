import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/*
 * The address page of a name reads the corpus through its own handlers
 * (REQ-200). Only the handler layer — the one that would reach Supabase — is
 * stubbed; the in-process transport, its routing and the shared loaders run
 * as they do in production.
 */

const handlers = vi.hoisted(() => ({
  search: vi.fn(),
  companions: vi.fn(),
  people: vi.fn(),
}));

vi.mock("@/api/v2/handlers/search", () => ({
  ftsSearchHandler: handlers.search,
}));
vi.mock("@/api/v2/handlers/searchCompanions", () => ({
  getSearchCompanionsHandler: handlers.companions,
}));
vi.mock("@/api/v2/handlers/peoples", () => ({
  getPeopleHandler: handlers.people,
}));
vi.mock("@/api/v2/handlers/countries", () => ({
  getCountryHandler: vi.fn(async () => null),
}));
vi.mock("@/api/v2/handlers/languageFamilies", () => ({
  getLanguageFamilyHandler: vi.fn(async () => null),
}));
vi.mock("@/api/v2/handlers/languages", () => ({
  getLanguageHandler: vi.fn(async () => ({ ok: false })),
}));
vi.mock("@/api/v2/handlers/patronymes", () => ({
  getPatronymeHandler: vi.fn(async () => ({ ok: false })),
}));
vi.mock("@/lib/api/logger", () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

import { readAddressedName } from "@/lib/search/serverSearchReading";

const SHONA_SEARCH = {
  data: {
    peoples: [
      {
        id: "PPL_SHONA",
        nameMain: "Shona",
        languageFamilyId: "FLG_BANTU",
        currentCountries: ["ZWE"],
        content: {},
      },
    ],
    countries: [],
    families: [],
    total: 1,
  },
};

const NO_COMPANIONS = {
  data: {
    subjects: [],
    shorts: { count: 0, items: [] },
    anecdotes: { count: 0, items: [] },
    proverbs: { count: 0, items: [] },
    quiz: { count: 0, item: null },
  },
};

describe("readAddressedName", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("the address page must not reach the network");
      })
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  // @req REQ-200
  it("answers from the handlers, never the network, with the ?q= reading", async () => {
    handlers.search.mockResolvedValue(SHONA_SEARCH);
    handlers.companions.mockResolvedValue(NO_COMPANIONS);
    handlers.people.mockResolvedValue({ data: { id: "PPL_SHONA" } });

    const reading = await readAddressedName("Shona", "fr");

    expect(reading.answered).toBe(true);
    expect(reading.subjects.map(({ type, id }) => `${type}:${id}`)).toEqual([
      "people:PPL_SHONA",
    ]);
    expect(handlers.search).toHaveBeenCalledWith(
      expect.objectContaining({ q: "Shona", offset: 0, lang: "fr" })
    );
    expect(handlers.companions).toHaveBeenCalledWith(
      expect.objectContaining({
        subjects: [{ type: "people", id: "PPL_SHONA" }],
        word: "Shona",
      })
    );
    expect(handlers.people).toHaveBeenCalledWith("PPL_SHONA");
    expect(fetch).not.toHaveBeenCalled();
  });

  // @req REQ-200
  it("rejects when the search handler fails, so the address answers 5xx rather than an indexable outage page", async () => {
    handlers.search.mockRejectedValue(new Error("database unreachable"));

    await expect(readAddressedName("Shona", "fr")).rejects.toThrow(
      /did not answer Shona/
    );
    expect(handlers.companions).not.toHaveBeenCalled();
  });
});
