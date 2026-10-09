import { describe, expect, it } from "vitest";
import { sourceKindLabel } from "@/lib/glossaire/vocabularies";
import { SOURCE_KINDS } from "@/types/sources";

describe("sourceKindLabel", () => {
  // @req REQ-161
  it("gives every source kind a French reader label", () => {
    for (const kind of SOURCE_KINDS) {
      expect(sourceKindLabel(kind, "fr")).toMatch(/\S/);
    }
  });

  // @req REQ-161
  it("names oral tradition as such, on the same footing as written kinds", () => {
    expect(sourceKindLabel("oral_tradition", "fr")).toBe("Tradition orale");
    expect(sourceKindLabel("academic", "fr")).toBe("Publication académique");
  });

  // @req REQ-161
  it("reads machine-written text as a synthesis still to check", () => {
    expect(sourceKindLabel("ai_generated", "fr")).toBe("Synthèse à vérifier");
  });

  // @req REQ-194
  it("names a press article as such, not as an unspecified or community source", () => {
    expect(sourceKindLabel("press", "fr")).toBe("Article de presse");
  });

  // @req REQ-161
  it("never answers with a tier word", () => {
    const tierWords = /officiel|référencée|non vérifiée|palier|autorité/i;
    for (const kind of SOURCE_KINDS) {
      expect(sourceKindLabel(kind, "fr")).not.toMatch(tierWords);
    }
  });

  // @req REQ-161
  it("falls back to an unspecified type rather than a blank", () => {
    expect(sourceKindLabel(undefined, "fr")).toBe("Type non précisé");
    expect(sourceKindLabel("nonsense" as never, "fr")).toBe("Type non précisé");
  });
});
