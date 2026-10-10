import { describe, expect, it } from "vitest";

import {
  didYouKnowEntityHref,
  drawAnecdoteImageSide,
} from "@/lib/home/didYouKnowPresentation";
import { getCountryRoute, getFamilyRoute, getPeopleRoute } from "@/lib/routing";

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
  it("sends each entity kind to its own fiche route", () => {
    expect(
      didYouKnowEntityHref("fr", { kind: "country", id: "GIN", label: "" })
    ).toBe(getCountryRoute("fr", "GIN"));
    expect(
      didYouKnowEntityHref("fr", { kind: "family", id: "FLG_MANDE", label: "" })
    ).toBe(getFamilyRoute("fr", "FLG_MANDE"));
    expect(
      didYouKnowEntityHref("fr", { kind: "people", id: "PPL_FULA", label: "" })
    ).toBe(getPeopleRoute("fr", "PPL_FULA"));
  });
});
