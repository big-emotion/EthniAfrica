import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/api/v2/services/places", () => ({
  getPlaceById: vi.fn(),
  listPlaces: vi.fn(),
}));

import { getPlaceById, listPlaces } from "@/api/v2/services/places";
import { getPlaceHandler, listPlacesHandler } from "../places";

const nameHistory = {
  summary: "Le nom Yamoussoukro a d'abord été N'Gokro.",
  names: [
    { nameText: "Yamoussoukro", nameStatus: "current" },
    { nameText: "N'Gokro", nameStatus: "former" },
  ],
};

const record = {
  id: "LOC_YAMOUSSOUKRO",
  placeType: "ville",
  nameMain: "Yamoussoukro",
  summary: "Capitale politique.",
  country: { id: "CIV", name: "Côte d'Ivoire" },
  associatedPeoples: [{ id: "PPL_BAOULE", name: "Baoulé", relation: null }],
  content: { gaps: [], sources: [{ title: "t" }] },
  nameHistory,
};

describe("place handlers", () => {
  beforeEach(() => vi.clearAllMocks());

  // @req REQ-196
  it("serves a place's names and its nameHistory in the licensed envelope", async () => {
    vi.mocked(getPlaceById).mockResolvedValue(record as never);

    const outcome = await getPlaceHandler("LOC_YAMOUSSOUKRO");

    expect(outcome.ok).toBe(true);
    const { data } = (outcome as { envelope: { data: unknown } }).envelope;
    expect(data).toEqual({
      id: "LOC_YAMOUSSOUKRO",
      placeType: "ville",
      nameMain: "Yamoussoukro",
      names: ["Yamoussoukro", "N'Gokro"],
      summary: "Capitale politique.",
      country: { id: "CIV", name: "Côte d'Ivoire" },
      associatedPeoples: [{ id: "PPL_BAOULE", name: "Baoulé", relation: null }],
      gaps: [],
      sources: [{ title: "t" }],
      nameHistory,
    });
  });

  // A place filed before its nameHistory is written still answers to its name.
  // @req REQ-196
  it("names a place by its filed name when it declares no nameHistory", async () => {
    vi.mocked(getPlaceById).mockResolvedValue({
      ...record,
      nameHistory: null,
    } as never);

    const outcome = await getPlaceHandler("LOC_YAMOUSSOUKRO");

    expect(outcome).toMatchObject({
      ok: true,
      envelope: { data: { names: ["Yamoussoukro"], nameHistory: null } },
    });
  });

  // @req REQ-196
  it("answers NOT_FOUND for an unknown place", async () => {
    vi.mocked(getPlaceById).mockResolvedValue(null);

    expect(await getPlaceHandler("LOC_NOWHERE")).toEqual({
      ok: false,
      code: "NOT_FOUND",
      message: "Place not found: LOC_NOWHERE",
    });
  });

  // @req REQ-196
  it("pages the list with the corpus-wide total", async () => {
    vi.mocked(listPlaces).mockResolvedValue({
      total: 41,
      data: [
        {
          id: "LOC_YAMOUSSOUKRO",
          placeType: "ville",
          nameMain: "Yamoussoukro",
          countryId: "CIV",
        },
      ],
    });

    const envelope = await listPlacesHandler(3, 20);

    expect(listPlaces).toHaveBeenCalledWith(3, 20);
    expect(envelope.data).toHaveLength(1);
    expect(envelope.meta.pagination).toEqual({
      total: 41,
      page: 3,
      perPage: 20,
      totalPages: 3,
    });
  });
});
