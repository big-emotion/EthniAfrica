// @req REQ-114
import { beforeEach, describe, expect, it, vi } from "vitest";

const { getSitemapEntityIdsMock, listPatronymesMock } = vi.hoisted(() => ({
  getSitemapEntityIdsMock: vi.fn(),
  listPatronymesMock: vi.fn(),
}));

vi.mock("next/cache", () => ({
  unstable_cache: (callback: () => unknown) => callback,
}));
vi.mock("@/lib/supabase/queries/afrik/sitemapEntries", () => ({
  getSitemapEntityIds: getSitemapEntityIdsMock,
}));
vi.mock("@/api/v2/services/patronymes", () => ({
  listPatronymes: listPatronymesMock,
}));

import { getAtlasHubCounts } from "../atlasHub";

describe("getAtlasHubCounts", () => {
  beforeEach(() => {
    getSitemapEntityIdsMock.mockReset();
    listPatronymesMock.mockReset();
  });

  // @req REQ-114
  it("returns current totals for each browse category", async () => {
    getSitemapEntityIdsMock.mockResolvedValue({
      peoples: ["PPL_A", "PPL_B"],
      countries: ["BEN", "CIV", "TCD"],
      families: ["FLG_A"],
      languages: ["lan-a", "lan-b"],
    });
    listPatronymesMock.mockResolvedValue({ total: 4, data: [] });

    await expect(getAtlasHubCounts()).resolves.toEqual({
      peoples: 2,
      patronymes: 4,
      countries: 3,
      languages: 2,
      families: 1,
    });
    expect(listPatronymesMock).toHaveBeenCalledWith({ page: 1, perPage: 1 });
  });
});
