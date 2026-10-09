import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/api/v2/handlers/words", () => ({
  getWordHandler: vi.fn(),
  listWordsHandler: vi.fn(),
}));

vi.mock("@/lib/api/cors", () => ({
  jsonWithCors: vi.fn((data, init) => new Response(JSON.stringify(data), init)),
  corsOptionsResponse: vi.fn(() => new Response(null, { status: 204 })),
}));

vi.mock("@/lib/api/logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

import { getWordHandler, listWordsHandler } from "@/api/v2/handlers/words";
import { GET as listGET } from "../words/route";
import { GET as detailGET } from "../words/[id]/route";

const envelope = (data: unknown) => ({
  data,
  meta: { license: "CC-BY-SA-4.0", attribution: "x" },
  errors: [],
});

function detail(id: string) {
  return detailGET(new NextRequest(`http://localhost/api/v2/words/${id}`), {
    params: Promise.resolve({ id }),
  });
}

describe("GET /api/v2/words", () => {
  beforeEach(() => vi.clearAllMocks());

  // @req REQ-196
  it("pages the words with the requested page and size", async () => {
    vi.mocked(listWordsHandler).mockResolvedValue(envelope([]) as never);

    const response = await listGET(
      new NextRequest("http://localhost/api/v2/words?page=2&perPage=5")
    );

    expect(response.status).toBe(200);
    expect(listWordsHandler).toHaveBeenCalledWith(2, 5);
  });

  // @req REQ-196
  it("answers 500 with the error envelope when the handler throws", async () => {
    vi.mocked(listWordsHandler).mockRejectedValue(new Error("down"));

    const response = await listGET(
      new NextRequest("http://localhost/api/v2/words")
    );

    expect(response.status).toBe(500);
    expect((await response.json()).errors[0].code).toBe("INTERNAL_ERROR");
  });
});

describe("GET /api/v2/words/[id]", () => {
  beforeEach(() => vi.clearAllMocks());

  // @req REQ-196
  it("returns the word with its names and nameHistory", async () => {
    const word = {
      id: "WRD_RACE",
      names: ["race"],
      nameHistory: { summary: "s", names: [] },
    };
    vi.mocked(getWordHandler).mockResolvedValue({
      ok: true,
      envelope: envelope(word) as never,
    });

    const response = await detail("WRD_RACE");

    expect(response.status).toBe(200);
    expect((await response.json()).data).toEqual(word);
    expect(response.headers.get("Cache-Control")).toMatch(/^s-maxage=/);
  });

  // @req REQ-196
  it("refuses an id that is not a word identifier with 400", async () => {
    const response = await detail("PPL_BAOULE");

    expect(response.status).toBe(400);
    expect(getWordHandler).not.toHaveBeenCalled();
  });

  // @req REQ-196
  it("answers 404 for an unknown word", async () => {
    vi.mocked(getWordHandler).mockResolvedValue({
      ok: false,
      code: "NOT_FOUND",
      message: "Word not found: WRD_NONE",
    });

    expect((await detail("WRD_NONE")).status).toBe(404);
  });
});
