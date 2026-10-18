// @req REQ-200
import { describe, expect, it, vi } from "vitest";
import { nameSearchHref } from "@/lib/search/nameAddress";

vi.mock("@/api/v2/services/nameSuggestions", () => ({
  suggestNamesByPrefix: vi.fn(),
}));

import { suggestNamesByPrefix } from "@/api/v2/services/nameSuggestions";
import { nameSuggestionsHandler } from "@/api/v2/handlers/nameSuggestions";

describe("nameSuggestionsHandler", () => {
  // @req REQ-200
  it("returns the standard envelope with suggestions and query", async () => {
    vi.mocked(suggestNamesByPrefix).mockResolvedValue([
      {
        form: "Fulɓe",
        type: "people",
        id: "PPL_FULA",
        note: null,
        href: nameSearchHref("fr", "Fulɓe"),
      },
    ]);

    const response = await nameSuggestionsHandler("ful", 8);

    expect(suggestNamesByPrefix).toHaveBeenCalledWith("ful", 8);
    expect(response.data).toEqual({
      suggestions: [
        {
          form: "Fulɓe",
          type: "people",
          id: "PPL_FULA",
          note: null,
          href: nameSearchHref("fr", "Fulɓe"),
        },
      ],
      query: "ful",
    });
  });
});
