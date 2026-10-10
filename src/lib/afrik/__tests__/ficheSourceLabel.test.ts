import { expect, it } from "vitest";

import {
  ficheSourceEntries,
  ficheSourceLabel,
} from "@/lib/afrik/ficheSourceLabel";

// @req REQ-092
it("hides an old source-title tier suffix while stored fiches are refreshed", () => {
  expect(
    ficheSourceLabel({
      title: "UNSD M49 – Codes normalisés – [tier 1]",
      url: "https://unstats.un.org/unsd/methodology/m49/",
      tier: "official",
    })
  ).toBe("UNSD M49 – Codes normalisés");
});

/**
 * Doctrine §1.1: every reader-facing source shows its type. A fiche that
 * declares `source_kind` hands it to the list; a value outside the vocabulary
 * is dropped rather than printed as a type nobody defined.
 */
// @req REQ-161
it("carries a declared source kind and drops one outside the vocabulary", () => {
  const entries = ficheSourceEntries([
    {
      title: "Ethnologue",
      url: null,
      tier: "official",
      source_kind: "linguistic_reference",
    },
    {
      title: "A blog",
      url: null,
      tier: "unverified",
      source_kind: "blog" as never,
    },
    { title: "Undeclared", url: null, tier: "referenced" },
  ]);

  expect(entries.map((entry) => entry.kind)).toEqual([
    "linguistic_reference",
    undefined,
    undefined,
  ]);
});
