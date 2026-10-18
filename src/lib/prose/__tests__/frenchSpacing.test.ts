// @req REQ-122
import { describe, expect, it } from "vitest";

import { normalizeFrenchSpacing } from "../frenchSpacing";

describe("normalizeFrenchSpacing", () => {
  // @req REQ-122
  it.each([";", ":", "?", "!"])(
    "uses a no-break space before %s",
    (punctuation) => {
      expect(normalizeFrenchSpacing(`mot ${punctuation} suite`)).toBe(
        `mot\u00a0${punctuation} suite`
      );
    }
  );

  // @req REQ-122
  it("adds no-break spaces inside French guillemets", () => {
    expect(normalizeFrenchSpacing("« citation »")).toBe(
      "«\u00a0citation\u00a0»"
    );
  });

  // @req REQ-122
  it("changes punctuation spacing only when the next character permits it", () => {
    expect(normalizeFrenchSpacing("mot :suite")).toBe("mot :suite");
    expect(normalizeFrenchSpacing("mot !3")).toBe("mot !3");
    expect(normalizeFrenchSpacing("mot ?*")).toBe("mot\u00a0?*");
    expect(normalizeFrenchSpacing("mot !")).toBe("mot\u00a0!");
  });

  // @req REQ-122
  it("preserves existing non-breaking spaces and is idempotent", () => {
    const input = `mot\u00a0: autre\u202f! et «\u202fcitation\u00a0»`;

    expect(normalizeFrenchSpacing(input)).toBe(input);
    expect(
      normalizeFrenchSpacing(normalizeFrenchSpacing("mot : « citation » !"))
    ).toBe("mot\u00a0: «\u00a0citation\u00a0»\u00a0!");
  });

  // @req REQ-122
  it("does not treat exclamation marks in African names as punctuation", () => {
    expect(normalizeFrenchSpacing("Les !Kung et !Xun sont cités.")).toBe(
      "Les !Kung et !Xun sont cités."
    );
  });

  // @req REQ-122
  it("leaves URLs, times, and ratios intact", () => {
    const input = "https://example.org/a:b?x=1 12:30 3:1";

    expect(normalizeFrenchSpacing(input)).toBe(input);
  });

  // @req REQ-122
  it("keeps punctuation before Markdown emphasis markers", () => {
    expect(normalizeFrenchSpacing("C’est vrai !**Vraiment**")).toBe(
      "C’est vrai\u00a0!**Vraiment**"
    );
  });

  // @req REQ-122
  it("does not change line markers", () => {
    const input = "- !Kung\n1. !Xun\n> Citation : texte";

    expect(normalizeFrenchSpacing(input)).toBe(
      "- !Kung\n1. !Xun\n> Citation\u00a0: texte"
    );
  });
});
