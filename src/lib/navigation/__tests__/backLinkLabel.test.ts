import { describe, expect, it } from "vitest";

import { backLinkLabel } from "@/lib/navigation/deriveTrail";
import { getTranslation } from "@/lib/translations";

/** The return link names where the reader came from. */
describe("backLinkLabel", () => {
  // @req REQ-091
  it("prefixes the label with the dictionary's return phrase", () => {
    expect(backLinkLabel("fr", "Yoruba")).toBe(
      `${getTranslation("fr").trail.backTo} Yoruba`
    );
  });
});
