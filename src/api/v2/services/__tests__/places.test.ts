import { beforeEach, describe, expect, it, vi } from "vitest";

const fromMock = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createServerClient: () => ({ from: fromMock }),
}));

vi.mock("@/lib/api/logger", () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

import { getPlaceById, listPlaces } from "../places";

/** A chainable query whose terminal call resolves to `result`. */
function query(result: { data: unknown; error: unknown; count?: number }) {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {};
  for (const method of ["select", "eq", "in", "order"]) {
    chain[method] = vi.fn(() => chain);
  }
  chain.range = vi.fn(() => Promise.resolve(result));
  chain.maybeSingle = vi.fn(() => Promise.resolve(result));
  // `.in()` and `.eq()` end the join lookups: make the chain awaitable too.
  (chain as unknown as PromiseLike<unknown>).then = ((resolve: never) =>
    Promise.resolve(result).then(resolve)) as never;
  return chain;
}

const nameHistory = {
  summary: "Le nom Yamoussoukro est le nom actuel de ce lieu.",
  names: [{ nameText: "Yamoussoukro" }, { nameText: "N'Gokro" }],
};

const placeRow = {
  id: "LOC_YAMOUSSOUKRO",
  place_type: "ville",
  name_main: "Yamoussoukro",
  country_id: "CIV",
  summary: "Capitale politique de la Côte d'Ivoire.",
  content: { gaps: [], sources: [] },
  name_history: nameHistory,
};

function routeTables(tables: Record<string, ReturnType<typeof query>>) {
  fromMock.mockImplementation((table: string) => {
    const chain = tables[table];
    if (!chain) throw new Error(`unexpected table ${table}`);
    return chain;
  });
}

describe("place service", () => {
  beforeEach(() => {
    fromMock.mockReset();
  });

  // @req REQ-196
  it("reads one place with its nameHistory, its country and the peoples it names", async () => {
    routeTables({
      afrik_places: query({ data: placeRow, error: null }),
      afrik_place_peoples: query({
        data: [{ people_id: "PPL_BAOULE", relation: "Le village est akouè." }],
        error: null,
      }),
      afrik_peoples: query({
        data: [{ id: "PPL_BAOULE", name_main: "Baoulé" }],
        error: null,
      }),
      afrik_countries: query({
        data: { id: "CIV", name_fr: "Côte d'Ivoire" },
        error: null,
      }),
    });

    const place = await getPlaceById("LOC_YAMOUSSOUKRO");

    expect(place).toEqual({
      id: "LOC_YAMOUSSOUKRO",
      placeType: "ville",
      nameMain: "Yamoussoukro",
      summary: "Capitale politique de la Côte d'Ivoire.",
      country: { id: "CIV", name: "Côte d'Ivoire" },
      associatedPeoples: [
        { id: "PPL_BAOULE", name: "Baoulé", relation: "Le village est akouè." },
      ],
      content: { gaps: [], sources: [] },
      nameHistory,
    });
  });

  // @req REQ-196
  it("answers null for a place the table does not hold", async () => {
    routeTables({ afrik_places: query({ data: null, error: null }) });

    expect(await getPlaceById("LOC_NOWHERE")).toBeNull();
  });

  // @req REQ-196
  it("throws the database error rather than answering an empty place", async () => {
    routeTables({
      afrik_places: query({ data: null, error: { message: "down" } }),
    });

    await expect(getPlaceById("LOC_YAMOUSSOUKRO")).rejects.toEqual({
      message: "down",
    });
  });

  // @req REQ-196
  it("lists one page of places by name with the corpus-wide total", async () => {
    const places = query({
      data: [placeRow],
      error: null,
      count: 3,
    });
    routeTables({ afrik_places: places });

    const page = await listPlaces(2, 1);

    expect(page).toEqual({
      total: 3,
      data: [
        {
          id: "LOC_YAMOUSSOUKRO",
          placeType: "ville",
          nameMain: "Yamoussoukro",
          countryId: "CIV",
        },
      ],
    });
    expect(places.order).toHaveBeenCalledWith("name_main");
    expect(places.range).toHaveBeenCalledWith(1, 1);
  });
});
