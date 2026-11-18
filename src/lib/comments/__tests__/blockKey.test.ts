import { describe, expect, it } from "vitest";

import {
  BLOCK_SECTIONS,
  BLOCK_SUBJECTS,
  buildBlockKey,
  normalizeBlockSubject,
  parseBlockKey,
} from "../blockKey";

describe("normalizeBlockSubject", () => {
  // The search feed, the API and the fiches spell a language family three
  // different ways; a comment must land on one key whichever page wrote it.
  // @req REQ-212
  it.each(["languageFamily", "language_family", "language-family"])(
    "reads %s as language_family",
    (spelling) => {
      expect(normalizeBlockSubject(spelling)).toBe("language_family");
    }
  );

  // @req REQ-212
  it("keeps every canonical subject as it is", () => {
    for (const subject of BLOCK_SUBJECTS) {
      expect(normalizeBlockSubject(subject)).toBe(subject);
    }
  });

  // @req REQ-212
  it("refuses a subject outside the vocabulary", () => {
    expect(normalizeBlockSubject("region")).toBeNull();
    expect(normalizeBlockSubject("")).toBeNull();
  });
});

describe("buildBlockKey", () => {
  // @req REQ-212
  it("anchors a block to the data: subject, id, section", () => {
    expect(
      buildBlockKey({ subject: "people", id: "PPL_PEUL", section: "naming" })
    ).toBe("people:PPL_PEUL:naming");
  });

  // @req REQ-212
  it("normalises the subject spelling before building", () => {
    expect(
      buildBlockKey({
        subject: "languageFamily",
        id: "FLG_BANTU",
        section: "origin",
      })
    ).toBe("language_family:FLG_BANTU:origin");
  });

  // @req REQ-212
  it("returns null when a part would not round-trip", () => {
    expect(
      buildBlockKey({ subject: "people", id: "", section: "naming" })
    ).toBeNull();
    expect(
      buildBlockKey({ subject: "people", id: "a:b", section: "naming" })
    ).toBeNull();
    expect(
      buildBlockKey({ subject: "people", id: "PPL_PEUL", section: "intro" })
    ).toBeNull();
    expect(
      buildBlockKey({ subject: "tribe", id: "PPL_PEUL", section: "naming" })
    ).toBeNull();
  });
});

describe("parseBlockKey", () => {
  // @req REQ-212
  it("reads back every key buildBlockKey writes", () => {
    for (const subject of BLOCK_SUBJECTS) {
      for (const section of BLOCK_SECTIONS) {
        const key = buildBlockKey({ subject, id: "X_1", section });
        expect(parseBlockKey(key)).toEqual({ subject, id: "X_1", section });
      }
    }
  });

  // @req REQ-212
  it("reads a search-query verdict key", () => {
    expect(parseBlockKey("search-query:bambara:verdict")).toEqual({
      subject: "search-query",
      id: "bambara",
      section: "verdict",
    });
  });

  // @req REQ-212
  it("refuses a key that is not in the canonical form", () => {
    for (const key of [
      "",
      "people:PPL_PEUL",
      "people:PPL_PEUL:naming:extra",
      "languageFamily:FLG_BANTU:origin",
      "people::naming",
      "people:PPL_PEUL:intro",
    ]) {
      expect(parseBlockKey(key)).toBeNull();
    }
  });
});
