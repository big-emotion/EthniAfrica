import { describe, expect, it, vi } from "vitest";

import {
  loadSearchAnswerExtras,
  searchAnswerKey,
} from "@/lib/supabase/queries/afrik/searchAnswer";

function thenableQuery(result: { data: unknown; error: unknown }) {
  const query: Record<string, ReturnType<typeof vi.fn>> & {
    then?: PromiseLike<typeof result>["then"];
  } = { select: vi.fn(), in: vi.fn() };
  query.select.mockReturnValue(query);
  query.in.mockReturnValue(query);
  query.then = (resolve, reject) =>
    Promise.resolve(result).then(resolve, reject);
  return query;
}

describe("search answer extras", () => {
  // @req REQ-178
  it("does not query when no country or family is listed", async () => {
    const client = { from: vi.fn() };

    const extras = await loadSearchAnswerExtras(
      [{ type: "people", id: "PPL_FULA" }],
      client as never
    );

    expect(extras.size).toBe(0);
    expect(client.from).not.toHaveBeenCalled();
  });

  // @req REQ-178
  it("counts documented peoples per country and per family in two queries", async () => {
    const byCountry = thenableQuery({
      data: [
        { country_id: "AGO" },
        { country_id: "AGO" },
        { country_id: "COD" },
      ],
      error: null,
    });
    const byFamily = thenableQuery({
      data: [{ language_family_id: "FLG_BANTU" }],
      error: null,
    });
    const client = {
      from: vi.fn((table: string) =>
        table === "afrik_people_countries" ? byCountry : byFamily
      ),
    };

    const extras = await loadSearchAnswerExtras(
      [
        { type: "country", id: "AGO" },
        { type: "languageFamily", id: "FLG_BANTU" },
        { type: "language", id: "lin" },
      ],
      client as never
    );

    expect(client.from).toHaveBeenCalledTimes(2);
    expect(extras.get(searchAnswerKey("country", "AGO"))).toEqual({
      documentedPeopleCount: 2,
    });
    expect(extras.get(searchAnswerKey("languageFamily", "FLG_BANTU"))).toEqual({
      peopleCount: 1,
    });
    expect(extras.has(searchAnswerKey("language", "lin"))).toBe(false);
  });

  // @req REQ-178
  it("throws on a failed query instead of reading it as an empty country", async () => {
    const client = {
      from: vi.fn(() =>
        thenableQuery({ data: null, error: { message: "down" } })
      ),
    };

    await expect(
      loadSearchAnswerExtras([{ type: "country", id: "AGO" }], client as never)
    ).rejects.toThrow("down");
  });
});
