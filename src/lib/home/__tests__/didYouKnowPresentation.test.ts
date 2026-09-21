import { describe, expect, it } from "vitest";

import { SOURCE_TIER_LABELS } from "@/lib/glossaire/vocabularies";
import {
  DID_YOU_KNOW_TIER_LABEL,
  didYouKnowEntityHref,
  drawAnecdoteImageSide,
} from "@/lib/home/didYouKnowPresentation";
import { getCountryRoute, getFamilyRoute, getPeopleRoute } from "@/lib/routing";
import { SOURCE_TIERS } from "@/types/sources";

describe("The anecdote band's source phrasing (REQ-113)", () => {
  // The band says « Source officielle » where a badge says « Officielle ».
  // That is one vocabulary read in a sentence, not a third wording of the
  // tiers — and this is what keeps it so: the literal stays (five consumers
  // index its `as const` type) but it may not drift from the glossary.
  // @req REQ-144
  it("is the tier vocabulary's own label, read in a sentence", () => {
    for (const tier of SOURCE_TIERS) {
      expect(DID_YOU_KNOW_TIER_LABEL[tier]).toBe(
        `Source ${SOURCE_TIER_LABELS.fr[tier].toLowerCase()}`
      );
    }
  });
});

describe("The anecdote band's opening side (REQ-113)", () => {
  // A `<` slipped to `<=`, or a comparison against the wrong bound, leaves
  // one of the two sides unreachable — and the band then looks fixed rather
  // than drawn, which is exactly what it exists not to be.
  // @req REQ-113
  it("can land on either half", () => {
    expect(drawAnecdoteImageSide(() => 0)).toBe("start");
    expect(drawAnecdoteImageSide(() => 0.499)).toBe("start");
    expect(drawAnecdoteImageSide(() => 0.5)).toBe("end");
    expect(drawAnecdoteImageSide(() => 0.999)).toBe("end");
  });
});

describe("The anecdote entity chips' destinations (REQ-113)", () => {
  // The three anecdote surfaces (page card, home hero, proverb card) each held
  // their own copy of this switch; a kind added to one and not the others
  // would send the same chip to different pages depending on where it was read.
  // @req REQ-113
  it("sends each entity kind to its own fiche route, in either language", () => {
    for (const language of ["fr", "en"] as const) {
      expect(
        didYouKnowEntityHref(language, {
          kind: "country",
          id: "GIN",
          label: "",
        })
      ).toBe(getCountryRoute(language, "GIN"));
      expect(
        didYouKnowEntityHref(language, {
          kind: "family",
          id: "FLG_MANDE",
          label: "",
        })
      ).toBe(getFamilyRoute(language, "FLG_MANDE"));
      expect(
        didYouKnowEntityHref(language, {
          kind: "people",
          id: "PPL_FULA",
          label: "",
        })
      ).toBe(getPeopleRoute(language, "PPL_FULA"));
    }
  });
});
