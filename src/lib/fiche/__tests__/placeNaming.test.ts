import { describe, expect, it } from "vitest";

import { placeNaming } from "@/lib/fiche/placeNaming";
import { LINGALA_HISTORY } from "@/lib/search/__fixtures__/nameTimelineFixtures";

/*
 * A place keeps its names only in its nameHistory block (ETNI-2031). The
 * Lingala history is borrowed for its shape — a self-given current name
 * beside older forms — not because Lingala is a place.
 */

describe("placeNaming", () => {
  // @req REQ-196
  it("presents every form of the name history in the fiche's order, none promoted", () => {
    const naming = placeNaming("PLC_TEST", LINGALA_HISTORY);

    expect(naming.presentation.forms.map(({ form }) => form)).toEqual(
      LINGALA_HISTORY.names.map(({ nameText }) => nameText)
    );
    const lingala = naming.presentation.forms.find(
      ({ form }) => form === "Lingala"
    );
    expect(lingala?.selfGiven).toBe(true);
    // A place has no legacy prose shape: its names live in the presentation.
    expect(naming.selfGiven).toBeUndefined();
    expect(naming.forms).toEqual([]);
  });

  // @req REQ-196
  it("keeps the curator's summary as the origin, trimmed and never rewritten", () => {
    const naming = placeNaming("PLC_TEST", {
      ...LINGALA_HISTORY,
      summary: "  Le nom vient du fleuve.  ",
    });

    expect(naming.origin).toBe("Le nom vient du fleuve.");
  });

  // @req REQ-196
  it("states no origin when the summary is blank", () => {
    const naming = placeNaming("PLC_TEST", {
      ...LINGALA_HISTORY,
      summary: "   ",
    });

    expect(naming).not.toHaveProperty("origin");
  });

  // @req REQ-196
  it("answers an empty projection for a place with no name history", () => {
    const naming = placeNaming("PLC_TEST", null);

    expect(naming.presentation.forms).toEqual([]);
    expect(naming).not.toHaveProperty("origin");
    // Dated eras belong to countries alone.
    expect(naming.eras).toEqual([]);
  });
});
