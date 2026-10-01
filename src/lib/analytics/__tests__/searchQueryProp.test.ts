import { describe, it, expect } from "vitest";
import { searchQueryProp } from "../searchQueryProp";

/**
 * What may leave the browser as the `query` property of a search event.
 *
 * The property is published: the Plausible dashboard is public, so anything
 * returned here is readable by anyone and cannot be recalled afterwards. The
 * function's job is to say "not this one" for text that looks like a person
 * rather than a name being looked up.
 */
describe("searchQueryProp", () => {
  // @req REQ-046
  it("returns a name as the reader typed it, lowercased so spellings group", () => {
    expect(searchQueryProp("Peul")).toBe("peul");
    expect(searchQueryProp("  Fulbe   du  Massina ")).toBe("fulbe du massina");
  });

  // Accents are part of the spelling a reader chose; folding them would merge
  // « dembélé » and « dembele », which is a fact worth seeing in the report.
  // @req REQ-046
  it("keeps accents and apostrophes", () => {
    expect(searchQueryProp("D’où vient le nom Dembélé ?")).toBe(
      "d’où vient le nom dembélé ?"
    );
  });

  // @req REQ-046
  it("returns nothing for an empty query", () => {
    expect(searchQueryProp("   ")).toBeUndefined();
  });

  // @req REQ-046
  it("refuses an email address", () => {
    expect(searchQueryProp("jean.dupont@example.com")).toBeUndefined();
  });

  // @req REQ-046
  it("refuses a URL", () => {
    expect(searchQueryProp("https://example.com/moi")).toBeUndefined();
    expect(searchQueryProp("www.example.com")).toBeUndefined();
  });

  // A year or a short number is a legitimate search; a phone or account
  // number is not, however it is spaced.
  // @req REQ-046
  it("refuses a long run of digits but keeps a year", () => {
    expect(searchQueryProp("1884")).toBe("1884");
    expect(searchQueryProp("06 12 34 56 78")).toBeUndefined();
    expect(searchQueryProp("+33612345678")).toBeUndefined();
  });

  // A paragraph pasted into the box is not a search, and is the likeliest
  // place for a personal story to travel.
  // @req REQ-046
  it("refuses a query longer than a question", () => {
    expect(searchQueryProp("a".repeat(81))).toBeUndefined();
    expect(searchQueryProp("a".repeat(80))).toBe("a".repeat(80));
  });
});
