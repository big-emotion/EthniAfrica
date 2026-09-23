import { describe, expect, it } from "vitest";

import {
  peopleDisplayLabel,
  peopleDisplayNames,
  searchResultDisplayLabel,
  searchResultDisplayNames,
} from "@/lib/search/peopleDisplayNames";
import type { SearchResult } from "@/types/afrik-frontend";

/**
 * Operator ruling, 2026-09-22: the name a people gives itself comes first,
 * then the filed name. These pin the three cases the ruling names — both
 * present, no self-name, the same name twice — and the qualifier rule: the
 * self-name is shown verbatim, never split on its parenthesis.
 */
describe("peopleDisplayNames", () => {
  // @req REQ-178
  it("opens on the self-name and keeps the filed name second", () => {
    expect(
      peopleDisplayNames(
        "Fulbe (pluriel), Pullo (singulier)",
        "Fula (Fulbe / Peul)"
      )
    ).toEqual({
      primary: "Fulbe (pluriel), Pullo (singulier)",
      secondary: "Fula (Fulbe / Peul)",
    });
  });

  // @req REQ-178
  it("falls back to the filed name alone when no self-name is recorded", () => {
    expect(peopleDisplayNames(undefined, "Baka")).toEqual({ primary: "Baka" });
    expect(peopleDisplayNames("   ", "Baka")).toEqual({ primary: "Baka" });
  });

  // @req REQ-178
  it("shows a name once when the self-name is the filed name", () => {
    expect(peopleDisplayNames("Wolof", "Wolof")).toEqual({ primary: "Wolof" });
    expect(peopleDisplayNames("wolof ", "Wolof")).toEqual({ primary: "wolof" });
    // A tone mark is information, not noise: it keeps both names.
    expect(peopleDisplayNames("Wolòf", "Wolof").secondary).toBe("Wolof");
  });

  // @req REQ-178
  it("joins both names on one line for single-line surfaces", () => {
    expect(peopleDisplayLabel("Fulbe", "Fula (Fulbe / Peul)")).toBe(
      "Fulbe — Fula (Fulbe / Peul)"
    );
    expect(peopleDisplayLabel(null, "Baka")).toBe("Baka");
  });
});

describe("searchResultDisplayNames", () => {
  const fula = {
    type: "people",
    id: "PPL_FULA",
    name: "Fula (Fulbe / Peul)",
    nameEn: "Fula",
    autonym: "Fulbe (pluriel), Pullo (singulier)",
  } as SearchResult;

  // @req REQ-178
  it("puts a people's autonym before its localized filed name", () => {
    expect(searchResultDisplayNames(fula, "fr")).toEqual({
      primary: "Fulbe (pluriel), Pullo (singulier)",
      secondary: "Fula (Fulbe / Peul)",
    });
    expect(searchResultDisplayNames(fula, "en").secondary).toBe("Fula");
    expect(searchResultDisplayLabel(fula, "fr")).toBe(
      "Fulbe (pluriel), Pullo (singulier) — Fula (Fulbe / Peul)"
    );
  });

  // @req REQ-178
  it("leaves every other class on its localized name", () => {
    const country = {
      type: "country",
      id: "SEN",
      name: "Sénégal",
      autonym: "should never be read",
    } as SearchResult;
    expect(searchResultDisplayNames(country, "fr")).toEqual({
      primary: "Sénégal",
    });
  });
});
