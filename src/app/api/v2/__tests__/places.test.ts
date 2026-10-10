import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/api/v2/handlers/places", () => ({
  getPlaceHandler: vi.fn(),
  listPlacesHandler: vi.fn(),
}));

vi.mock("@/lib/api/cors", () => ({
  jsonWithCors: vi.fn((data, init) => new Response(JSON.stringify(data), init)),
  corsOptionsResponse: vi.fn(() => new Response(null, { status: 204 })),
}));

vi.mock("@/lib/api/logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

import { getPlaceHandler, listPlacesHandler } from "@/api/v2/handlers/places";
import { GET as listGET } from "../places/route";
import { GET as detailGET } from "../places/[id]/route";

const envelope = (data: unknown) => ({
  data,
  meta: { license: "CC-BY-SA-4.0", attribution: "x" },
  errors: [],
});

function detail(id: string) {
  return detailGET(new NextRequest(`http://localhost/api/v2/places/${id}`), {
    params: Promise.resolve({ id }),
  });
}

describe("GET /api/v2/places", () => {
  beforeEach(() => vi.clearAllMocks());

  // @req REQ-196
  it("pages the places with the requested page and size", async () => {
    vi.mocked(listPlacesHandler).mockResolvedValue(envelope([]) as never);

    const response = await listGET(
      new NextRequest("http://localhost/api/v2/places?page=2&perPage=5")
    );

    expect(response.status).toBe(200);
    expect(listPlacesHandler).toHaveBeenCalledWith(2, 5);
  });

  // @req REQ-196
  it("answers 500 with the error envelope when the handler throws", async () => {
    vi.mocked(listPlacesHandler).mockRejectedValue(new Error("down"));

    const response = await listGET(
      new NextRequest("http://localhost/api/v2/places")
    );

    expect(response.status).toBe(500);
    expect((await response.json()).errors[0].code).toBe("INTERNAL_ERROR");
  });
});

describe("GET /api/v2/places/[id]", () => {
  beforeEach(() => vi.clearAllMocks());

  // @req REQ-196
  it("returns the place with its names and nameHistory", async () => {
    const place = {
      id: "LOC_YAMOUSSOUKRO",
      names: ["Yamoussoukro", "N'Gokro"],
      nameHistory: { summary: "s", names: [] },
    };
    vi.mocked(getPlaceHandler).mockResolvedValue({
      ok: true,
      envelope: envelope(place) as never,
    });

    const response = await detail("LOC_YAMOUSSOUKRO");

    expect(response.status).toBe(200);
    expect((await response.json()).data).toEqual(place);
    expect(response.headers.get("Cache-Control")).toMatch(/^s-maxage=/);
  });

  // @req REQ-196
  it("refuses an id that is not a place identifier with 400", async () => {
    const response = await detail("PPL_BAOULE");

    expect(response.status).toBe(400);
    expect(getPlaceHandler).not.toHaveBeenCalled();
  });

  // @req REQ-196
  it("answers 404 for an unknown place", async () => {
    vi.mocked(getPlaceHandler).mockResolvedValue({
      ok: false,
      code: "NOT_FOUND",
      message: "Place not found: LOC_NOWHERE",
    });

    expect((await detail("LOC_NOWHERE")).status).toBe(404);
  });
});
