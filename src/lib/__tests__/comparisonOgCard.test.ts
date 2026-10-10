import { describe, it, expect } from "vitest";
import {
  buildComparisonOgCard,
  AUTONYM_CHAR_BUDGET,
} from "../comparisonOgCard";
import { PRODUCT_NAME, ATTRIBUTION_STRING } from "@/lib/brand";
import type { ComparisonPageData } from "@/types/compare";

// ==========================================
// ILLUSTRATIVE FIXTURES (not AFRIK data)
// ==========================================

const peuplePageData: ComparisonPageData = {
  type: "peuple",
  columns: [
    {
      id: "PPL_ILLUSTRATIVE_ONE",
      label: "Peuple Illustratif Un",
      type: "peuple",
    },
    {
      id: "PPL_ILLUSTRATIVE_TWO",
      label: "Peuple Illustratif Deux",
      type: "peuple",
    },
  ],
  rows: [
    {
      key: "appellations",
      values: {
        PPL_ILLUSTRATIVE_ONE: {
          mainName: "Peuple Illustratif Un",
          selfAppellation: "Endonyme Un",
          exonyms: ["Exonyme Un"],
        },
        PPL_ILLUSTRATIVE_TWO: null,
      },
    },
  ],
};

const famillePageData: ComparisonPageData = {
  type: "famille",
  columns: [
    { id: "FLG_ILLUSTRATIVE", label: "Famille Illustrative", type: "famille" },
  ],
  rows: [
    {
      key: "decolonialHeader",
      values: {
        FLG_ILLUSTRATIVE: {
          selfAppellation: "Endonyme Famille",
          historicalAppellations: ["Ancien nom", "Autre ancien nom"],
        },
      },
    },
  ],
};

const paysPageData: ComparisonPageData = {
  type: "pays",
  columns: [{ id: "COM", label: "Comores", type: "pays" }],
  rows: [],
};

describe("buildComparisonOgCard", () => {
  // @req REQ-097
  it("resolves the autonym and exonym from the appellations row for peuple", () => {
    const card = buildComparisonOgCard(peuplePageData);

    expect(card.entities[0]).toEqual({
      id: "PPL_ILLUSTRATIVE_ONE",
      autonym: "Endonyme Un",
      exonym: "Exonyme Un",
    });
  });

  // @req REQ-097
  it("falls back to the column label when the appellations row is missing for that entity", () => {
    const card = buildComparisonOgCard(peuplePageData);

    expect(card.entities[1].autonym).toBe("Peuple Illustratif Deux");
    expect(card.entities[1].exonym).toBeNull();
  });

  // @req REQ-097
  it("resolves the autonym and exonym from the decolonialHeader row for famille", () => {
    const card = buildComparisonOgCard(famillePageData);

    expect(card.entities[0]).toEqual({
      id: "FLG_ILLUSTRATIVE",
      autonym: "Endonyme Famille",
      exonym: "Ancien nom",
    });
  });

  // @req REQ-097
  it("uses the column label as the autonym for pays, with no exonym", () => {
    const card = buildComparisonOgCard(paysPageData);

    expect(card.entities[0]).toEqual({
      id: "COM",
      autonym: "Comores",
      exonym: null,
    });
  });

  // A shared card is a reader surface too: it names the entities and nothing
  // about how far to trust their pages.
  // @req REQ-194
  it("prints no confidence score or review status on any entity", () => {
    const card = buildComparisonOgCard(peuplePageData);

    expect(JSON.stringify(card)).not.toMatch(/confiance|pas encore relue|%/i);
  });

  // @req REQ-097
  it("leaves an autonym at exactly the character budget untouched", () => {
    const exact = "x".repeat(AUTONYM_CHAR_BUDGET);
    const data: ComparisonPageData = {
      type: "pays",
      columns: [{ id: "X", label: exact, type: "pays" }],
      rows: [],
    };

    expect(buildComparisonOgCard(data).entities[0].autonym).toBe(exact);
  });

  // @req REQ-097
  it("truncates an autonym past the character budget with an ellipsis", () => {
    const long = "x".repeat(AUTONYM_CHAR_BUDGET + 10);
    const data: ComparisonPageData = {
      type: "pays",
      columns: [{ id: "X", label: long, type: "pays" }],
      rows: [],
    };

    const autonym = buildComparisonOgCard(data).entities[0].autonym;
    expect(autonym).toHaveLength(AUTONYM_CHAR_BUDGET);
    expect(autonym.endsWith("…")).toBe(true);
  });

  // @req REQ-097
  it("carries the entity-type label, product name, and attribution from the brand source of truth", () => {
    const card = buildComparisonOgCard(paysPageData);

    expect(card.entityTypeLabel).toBe("Pays");
    expect(card.productName).toBe(PRODUCT_NAME);
    expect(card.attribution).toBe(ATTRIBUTION_STRING);
  });

  // @req REQ-097
  it("maps entity-type labels for peuple and famille", () => {
    expect(buildComparisonOgCard(peuplePageData).entityTypeLabel).toBe(
      "Peuples"
    );
    expect(buildComparisonOgCard(famillePageData).entityTypeLabel).toBe(
      "Familles linguistiques"
    );
  });

  // @req REQ-097
  it("produces exactly one card entity per column, nothing beyond page data", () => {
    const card = buildComparisonOgCard(peuplePageData);

    expect(card.entities).toHaveLength(2);
    expect(Object.keys(card.entities[0]).sort()).toEqual(
      ["autonym", "exonym", "id"].sort()
    );
  });
});
