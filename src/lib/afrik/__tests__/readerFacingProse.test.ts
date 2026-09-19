import { describe, expect, it } from "vitest";

import { readerFacingProse } from "@/lib/afrik/readerFacingProse";

describe("readerFacingProse", () => {
  // @req REQ-091
  it("turns residual AFRIK identifiers into readable entity labels", () => {
    expect(
      readerFacingProse(
        "PPL_LUNDA_CHOKWE complète PPL_CHOKWE, tandis que FLG_NIGERCONGO/PPL_LUO_BANTU décrit une autre fiche."
      )
    ).toBe(
      "Lunda Chokwe complète Chokwe, tandis que Luo Bantu décrit une autre fiche."
    );
  });

  // @req REQ-091
  it("leaves ordinary editorial prose unchanged", () => {
    const prose = "Les Chokwe sont traités dans leur propre fiche.";

    expect(readerFacingProse(prose)).toBe(prose);
  });
});
