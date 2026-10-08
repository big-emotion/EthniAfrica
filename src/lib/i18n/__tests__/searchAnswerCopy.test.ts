import { describe, expect, it } from "vitest";

import { searchAnswerCopy } from "@/lib/i18n/copy/searchAnswer";
import { searchAnswerSentenceProblems } from "@/lib/search/answer";

const SCHOLARLY =
  /\b(?:ex[oô]nym|end[oô]nym|auto[nm]ym|ethnonym|[ée]tymolog|glottochronolog|corpus)\w*/i;

function strings(value: unknown): string[] {
  if (typeof value === "string") return [value];
  if (typeof value === "function") {
    return strings(value("Sénégal", 3, "Soudan"));
  }
  if (typeof value === "object" && value !== null) {
    return Object.values(value).flatMap(strings);
  }
  return [];
}

// @req REQ-178
describe("the answer page's own words", () => {
  // @req REQ-178
  it("uses ordinary words only", () => {
    const all = strings(searchAnswerCopy.fr);
    expect(all.length).toBeGreaterThan(40);
    for (const text of all) {
      expect(text, text).not.toMatch(SCHOLARLY);
      expect(
        searchAnswerSentenceProblems("lead", text.replace(/<\/?strong>/g, ""))
      ).not.toContain("register");
    }
  });
});
