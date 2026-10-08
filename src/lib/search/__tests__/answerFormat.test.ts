import { describe, expect, it } from "vitest";

import {
  firstSentence,
  formatMillions,
  formatMillionsInWords,
  formatPercent,
  leadingSentences,
  sentences,
} from "@/lib/search/answerFormat";

// @req REQ-178
describe("formatMillions", () => {
  // @req REQ-178
  it("writes a person count in millions, never as a raw number", () => {
    expect(formatMillions(34_000_000, "fr")).toBe("34 M");
    expect(formatMillions(4_500_000, "fr")).toBe("4,5 M");
    expect(formatMillions(800_000, "fr")).toBe("0,8 M");
    expect(formatMillions(300_000, "fr")).toBe("0,3 M");
  });

  // @req REQ-178
  it("uses a decimal comma", () => {
    expect(formatMillions(3_500_000, "fr")).toBe("3,5 M");
  });

  // @req REQ-178
  it("does not print a false zero for a very small estimate", () => {
    expect(formatMillions(20_000, "fr")).toBe("< 0,1 M");
  });

  // @req REQ-178
  it("words a headline figure with the plural the language needs", () => {
    expect(formatMillionsInWords(40_000_000, "fr")).toBe("40 millions");
    expect(formatMillionsInWords(1_000_000, "fr")).toBe("1 million");
  });
});

// @req REQ-178
describe("formatPercent", () => {
  // @req REQ-178
  it("keeps one decimal when the share has one", () => {
    expect(formatPercent(2.5, "fr")).toBe("2,5 %");
    expect(formatPercent(18, "fr")).toBe("18 %");
  });
});

// @req REQ-178
describe("sentence splitting", () => {
  const text =
    "Le terme « bantou » a été introduit par Bleek, qui l'emploie dès 1857 ou 1858. Il a choisi ce mot. Autrement dit : un mot. Et une quatrième phrase.";

  // @req REQ-178
  it("splits between sentences, not inside a century or a date", () => {
    expect(sentences(text)).toHaveLength(4);
    expect(sentences("Au XIVe siècle avant notre ère. Puis ensuite.")).toEqual([
      "Au XIVe siècle avant notre ère.",
      "Puis ensuite.",
    ]);
  });

  // @req REQ-178
  it("returns the first sentence and the first n sentences", () => {
    expect(firstSentence(text)).toMatch(/^Le terme .* 1858\.$/);
    expect(leadingSentences(text, 3).rest).toBe("Et une quatrième phrase.");
  });

  // @req REQ-178
  it("reports no remainder when the text is short enough", () => {
    expect(leadingSentences("Une seule phrase.", 3)).toEqual({
      shown: "Une seule phrase.",
      rest: "",
    });
  });
});
