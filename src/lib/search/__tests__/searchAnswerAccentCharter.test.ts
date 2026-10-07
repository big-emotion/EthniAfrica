import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { ANSWER_ACCENT_CLASS } from "@/components/search/answer/answerStyle";
import { SEARCH_ENTITY_ACCENT } from "@/components/search/searchEntityAccent";

const charter = readFileSync(
  join(process.cwd(), "docs/design/search-result-charter.md"),
  "utf8"
);

// The ruling of search-result-charter §6: one accent per kind of subject,
// held in SEARCH_ENTITY_ACCENT and read by the answer blocks through it.
const RULING = {
  people: "afh-accent-ocre",
  country: "afh-accent-teal",
  language: "afh-accent-perv",
  languageFamily: "afh-accent-perv",
  patronyme: "afh-accent-terre",
  word: "afh-accent-ocre",
} as const;

// @req REQ-178
describe("the accent of each kind of answer", () => {
  // @req REQ-178
  it("follows the charter's ruling", () => {
    expect(ANSWER_ACCENT_CLASS).toEqual(RULING);
  });

  // @req REQ-178
  it("is the assignment the result cards use, for every kind a card carries", () => {
    for (const kind of [
      "people",
      "country",
      "language",
      "languageFamily",
    ] as const) {
      expect(SEARCH_ENTITY_ACCENT[kind].accentScopeClassName).toBe(
        ANSWER_ACCENT_CLASS[kind]
      );
    }
  });

  // The one declared difference: a card keeps a name neutral (ETNI-1463), a
  // page needs an accent.
  // @req REQ-178
  it("differs from the cards only for a family name", () => {
    expect(SEARCH_ENTITY_ACCENT.patronyme.accentScopeClassName).toBe(
      "afh-accent-neutral"
    );
    expect(ANSWER_ACCENT_CLASS.patronyme).toBe("afh-accent-terre");
  });

  // @req REQ-178
  it("names no colour literal: scopes are token classes", () => {
    for (const scope of Object.values(ANSWER_ACCENT_CLASS)) {
      expect(scope).toMatch(/^afh-accent-[a-z]+$/);
    }
  });

  // @req REQ-178
  it("is written in the charter, kind by kind", () => {
    expect(charter).toContain("## 6. The accent of each kind of answer");
    for (const [kind, scope] of Object.entries(RULING)) {
      expect(charter, `${kind} -> ${scope}`).toMatch(
        new RegExp(`\\|\\s*\`?${kind}\`?\\s*\\|[^\\n]*${scope}`)
      );
    }
  });
});
