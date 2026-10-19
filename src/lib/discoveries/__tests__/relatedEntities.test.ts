import { describe, expect, it } from "vitest";

import type { SearchResult } from "@/types/afrik-frontend";
import {
  relatedEntityKey,
  resolveRelatedEntities,
  resolveRelatedProductions,
} from "../catalog";
import type {
  RelatedEntityAssociation,
  RelatedEntityIndex,
} from "../relatedEntities";

function result(
  type: SearchResult["type"],
  id: string,
  name: string,
  forms: string[] = []
): SearchResult {
  return {
    type,
    id,
    name,
    naming: {
      forms: forms.map((form) => ({ form, kind: "exonym" as const })),
      eras: [],
      presentation: {} as SearchResult["naming"]["presentation"],
    },
  } as SearchResult;
}

function association(
  kind: RelatedEntityAssociation["entity"]["kind"],
  id: string,
  relation: string
): RelatedEntityAssociation {
  return { entity: { kind, id }, relation };
}

describe("related production entities", () => {
  // @req REQ-183
  it("returns the documented one-hop Mandé entities with their relation labels", () => {
    const index: RelatedEntityIndex = new Map([
      [
        "family:FLG_MANDE",
        [
          association("language", "bm", "family-language"),
          association("people", "PPL_MALINKE", "family-people"),
          association("country", "MLI", "family-country"),
          association("patronyme", "PAT_TRAORE", "family-patronyme"),
        ],
      ],
    ]);

    expect(
      resolveRelatedEntities(
        [result("languageFamily", "FLG_MANDE", "Mandé")],
        "Mandé",
        index
      )
    ).toEqual([
      {
        origin: { kind: "family", id: "FLG_MANDE" },
        ...association("language", "bm", "family-language"),
      },
      {
        origin: { kind: "family", id: "FLG_MANDE" },
        ...association("people", "PPL_MALINKE", "family-people"),
      },
      {
        origin: { kind: "family", id: "FLG_MANDE" },
        ...association("country", "MLI", "family-country"),
      },
      {
        origin: { kind: "family", id: "FLG_MANDE" },
        ...association("patronyme", "PAT_TRAORE", "family-patronyme"),
      },
    ]);
  });

  // @req REQ-183
  it("resolves Fula through a recognised appellation before following its relations", () => {
    const index: RelatedEntityIndex = new Map([
      ["people:PPL_FULA", [association("language", "ful", "people-language")]],
    ]);

    expect(
      resolveRelatedEntities(
        [result("people", "PPL_FULA", "Fula", ["Peul", "Fulbe"])],
        "Peul",
        index
      )
    ).toEqual([
      {
        origin: { kind: "people", id: "PPL_FULA" },
        ...association("language", "ful", "people-language"),
      },
    ]);
  });

  // @req REQ-183
  it("keeps homonymous origins separate and never crosses their associations", () => {
    const index: RelatedEntityIndex = new Map([
      [
        "people:PPL_BASSA_CAM",
        [association("country", "CMR", "people-country")],
      ],
      [
        "people:PPL_BASSA_NGA",
        [association("country", "NGA", "people-country")],
      ],
    ]);

    expect(
      resolveRelatedEntities(
        [
          result("people", "PPL_BASSA_CAM", "Bassa"),
          result("people", "PPL_BASSA_NGA", "Bassa"),
        ],
        "Bassa",
        index
      )
    ).toEqual([
      {
        origin: { kind: "people", id: "PPL_BASSA_CAM" },
        ...association("country", "CMR", "people-country"),
      },
      {
        origin: { kind: "people", id: "PPL_BASSA_NGA" },
        ...association("country", "NGA", "people-country"),
      },
    ]);
  });

  // @req REQ-183
  it("returns no guessed targets when the origin has no recorded association", () => {
    expect(
      resolveRelatedEntities(
        [result("people", "PPL_ISOLATED", "Isolé")],
        "Isolé",
        new Map()
      )
    ).toEqual([]);
  });

  // @req REQ-183
  it("deduplicates a target reached by multiple documented paths from one origin", () => {
    const index: RelatedEntityIndex = new Map([
      [
        "family:FLG_MANDE",
        [
          association("people", "PPL_MALINKE", "family-people"),
          association("people", "PPL_MALINKE", "family-language-people"),
        ],
      ],
    ]);

    expect(
      resolveRelatedEntities(
        [result("languageFamily", "FLG_MANDE", "Mandé")],
        "Mandé",
        index
      )
    ).toHaveLength(1);
  });

  // @req REQ-183
  it("returns a production once when its subjects match two related entities", () => {
    const index: RelatedEntityIndex = new Map([
      [
        "family:FLG_MANDE",
        [
          association("people", "PPL_MALINKE", "family-people"),
          association("language", "bm", "family-language"),
        ],
      ],
    ]);

    expect(
      resolveRelatedProductions(
        [result("languageFamily", "FLG_MANDE", "Mandé")],
        "Mandé",
        index,
        [
          {
            productionId: "video:mande",
            subjects: [
              { kind: "people", id: "PPL_MALINKE" },
              { kind: "language", id: "bm" },
            ],
          },
        ]
      )
    ).toEqual([
      {
        productionId: "video:mande",
        origin: { kind: "family", id: "FLG_MANDE" },
        ...association("people", "PPL_MALINKE", "family-people"),
      },
    ]);
  });

  // @req REQ-183
  it("does not traverse through a country reached from the origin", () => {
    const index: RelatedEntityIndex = new Map([
      ["people:PPL_A", [association("country", "MLI", "people-country")]],
      ["country:MLI", [association("people", "PPL_B", "country-people")]],
    ]);

    expect(
      resolveRelatedEntities([result("people", "PPL_A", "A")], "A", index)
    ).toEqual([
      {
        origin: { kind: "people", id: "PPL_A" },
        ...association("country", "MLI", "people-country"),
      },
    ]);
  });

  // @req REQ-183
  it("uses typed keys so equal IDs from different entity classes remain distinct", () => {
    expect(relatedEntityKey({ kind: "language", id: "bm" })).not.toBe(
      relatedEntityKey({ kind: "people", id: "bm" })
    );
  });
});
