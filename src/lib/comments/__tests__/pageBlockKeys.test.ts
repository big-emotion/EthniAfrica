import { describe, expect, it } from "vitest";

import { pageBlockKeys } from "../pageBlockKeys";

describe("pageBlockKeys", () => {
  // One request per page (REQ-212): the page asks, up front, for every block
  // it can draw a footer on.
  // @req REQ-212
  it("asks for the five passages of each subject, and the verdict of the name", () => {
    expect(
      pageBlockKeys([{ type: "languageFamily", id: "FLG_MANDE" }], "mande")
    ).toEqual([
      "search-query:mande:verdict",
      "language_family:FLG_MANDE:what",
      "language_family:FLG_MANDE:origin",
      "language_family:FLG_MANDE:naming",
      "language_family:FLG_MANDE:where",
      "language_family:FLG_MANDE:sources",
    ]);
  });

  // @req REQ-212
  it("skips a subject the vocabulary has no key for", () => {
    expect(pageBlockKeys([{ type: "word", id: "w-1" }], "zz")).toEqual([
      "search-query:zz:verdict",
    ]);
  });

  // The API reads at most thirty keys; a longer list would be refused whole.
  // @req REQ-212
  it("stays within the thirty keys the API reads", () => {
    const subjects = Array.from({ length: 8 }, (_, index) => ({
      type: "people",
      id: `PPL_${index}`,
    }));
    expect(pageBlockKeys(subjects, "q")).toHaveLength(30);
  });
});
