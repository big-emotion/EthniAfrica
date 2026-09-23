import { describe, expect, it } from "vitest";
import { drawSeedWords } from "../seedWords";

describe("search example draws", () => {
  // @req REQ-002
  it("deduplicates names and preserves diacritics without truncating qualifiers", () => {
    expect(
      drawSeedWords(
        [
          " Iteso ",
          "Iteso",
          "ǂNukhoen",
          "",
          "Fulbe (pluriel), Pullo (singulier)",
        ],
        ["Fulbe"],
        () => 0.99
      )
    ).toEqual(["Iteso", "ǂNukhoen"]);
  });
  // @req REQ-002
  it("draws different orders and keeps the supplied corpus unchanged", () => {
    const names = ["Iteso", "Suri", "Murle"];
    expect(drawSeedWords(names, [], () => 0)).not.toEqual(
      drawSeedWords(names, [], () => 0.99)
    );
    expect(names).toEqual(["Iteso", "Suri", "Murle"]);
  });
  // @req REQ-002
  it("also shuffles the fallback when the data source is unavailable", () => {
    expect(drawSeedWords([], ["Fulbe", "Iteso"], () => 0)).toEqual([
      "Iteso",
      "Fulbe",
    ]);
  });
});
