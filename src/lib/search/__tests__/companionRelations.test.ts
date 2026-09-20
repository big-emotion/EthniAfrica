import { describe, expect, it } from "vitest";

import {
  companionSubjectKey,
  orderCompanionMatches,
  resolveCompanionTargets,
  type CompanionCatalogItem,
  type CompanionRelationMap,
  type CompanionSubject,
} from "../companionRelations";

function subject(
  entityType: CompanionSubject["entityType"],
  entityId: string
): CompanionSubject {
  return { entityType, entityId };
}

const relations: CompanionRelationMap = new Map([
  [
    "people:PPL_EKPEYE",
    [
      {
        relation: "linked-family",
        entityType: "languageFamily",
        entityId: "FLG_BENUE_CONGO",
      },
      {
        relation: "linked-country",
        entityType: "country",
        entityId: "NGA",
      },
    ],
  ],
  [
    "country:NGA",
    [
      {
        relation: "linked-people",
        entityType: "people",
        entityId: "PPL_EKPEYE",
      },
    ],
  ],
  [
    "languageFamily:FLG_MANDE",
    [
      {
        relation: "linked-people",
        entityType: "people",
        entityId: "PPL_MANDE",
      },
    ],
  ],
  [
    "language:lin",
    [
      {
        relation: "linked-family",
        entityType: "languageFamily",
        entityId: "FLG_BANTU",
      },
      {
        relation: "linked-people",
        entityType: "people",
        entityId: "PPL_NGALA",
      },
    ],
  ],
  [
    "patronyme:traore",
    [
      {
        relation: "linked-people",
        entityType: "people",
        entityId: "PPL_MANDE",
      },
    ],
  ],
]);

describe("search companion relations", () => {
  // @req REQ-180
  it.each([
    ["people", "PPL_EKPEYE", ["exact", "linked-family", "linked-country"]],
    ["country", "NGA", ["exact", "linked-people"]],
    ["languageFamily", "FLG_MANDE", ["exact", "linked-people"]],
    ["language", "lin", ["exact", "linked-family", "linked-people"]],
    ["patronyme", "traore", ["exact", "linked-people"]],
  ] as const)(
    "resolves exact and ring-1 targets for %s",
    (entityType, entityId, expectedRelations) => {
      const targets = resolveCompanionTargets(
        [subject(entityType, entityId)],
        relations
      );

      expect(targets.map((target) => target.relation)).toEqual(
        expectedRelations
      );
      expect(targets[0]).toEqual({
        relation: "exact",
        entityType,
        entityId,
      });
    }
  );

  // @req REQ-180
  it("does not traverse ring-1 targets again", () => {
    const targets = resolveCompanionTargets(
      [subject("country", "NGA")],
      relations
    );

    expect(targets.map(companionSubjectKey)).toEqual([
      "country:NGA",
      "people:PPL_EKPEYE",
    ]);
    expect(targets).not.toContainEqual(
      expect.objectContaining({ entityId: "FLG_BENUE_CONGO" })
    );
  });

  // @req REQ-180
  it("keeps request order, relation order and the first occurrence of a target", () => {
    const targets = resolveCompanionTargets(
      [subject("country", "NGA"), subject("people", "PPL_EKPEYE")],
      relations
    );

    expect(targets.map(companionSubjectKey)).toEqual([
      "country:NGA",
      "people:PPL_EKPEYE",
      "languageFamily:FLG_BENUE_CONGO",
    ]);
    expect(targets.map((target) => target.relation)).toEqual([
      "exact",
      "exact",
      "linked-family",
    ]);
  });

  // @req REQ-180
  it("orders matches exact-first, remains stable and emits one match per item", () => {
    const items: CompanionCatalogItem[] = [
      {
        id: "shared",
        subjects: [subject("country", "NGA"), subject("people", "PPL_EKPEYE")],
      },
      {
        id: "ring-first-in-catalog",
        subjects: [subject("languageFamily", "FLG_BENUE_CONGO")],
      },
      {
        id: "exact-second-in-catalog",
        subjects: [subject("people", "PPL_EKPEYE")],
      },
      {
        id: "unrelated",
        subjects: [subject("country", "GHA")],
      },
    ];
    const targets = resolveCompanionTargets(
      [subject("people", "PPL_EKPEYE")],
      relations
    );

    expect(orderCompanionMatches(items, targets)).toEqual([
      {
        item: items[0],
        match: {
          relation: "exact",
          entityType: "people",
          entityId: "PPL_EKPEYE",
        },
      },
      {
        item: items[2],
        match: {
          relation: "exact",
          entityType: "people",
          entityId: "PPL_EKPEYE",
        },
      },
      {
        item: items[1],
        match: {
          relation: "linked-family",
          entityType: "languageFamily",
          entityId: "FLG_BENUE_CONGO",
        },
      },
    ]);
  });

  // @req REQ-180
  it("deduplicates repeated catalog items by stable identity", () => {
    const duplicate = {
      id: "same-item",
      subjects: [subject("people", "PPL_EKPEYE")],
    };
    const targets = resolveCompanionTargets(
      [subject("people", "PPL_EKPEYE")],
      relations
    );

    expect(
      orderCompanionMatches([duplicate, { ...duplicate }], targets)
    ).toHaveLength(1);
  });

  // @req REQ-180
  it("keeps the strongest match when duplicate identities disagree", () => {
    const targets = resolveCompanionTargets(
      [subject("people", "PPL_EKPEYE")],
      relations
    );
    const matches = orderCompanionMatches(
      [
        {
          id: "same-item",
          subjects: [subject("languageFamily", "FLG_BENUE_CONGO")],
        },
        {
          id: "same-item",
          subjects: [subject("people", "PPL_EKPEYE")],
        },
      ],
      targets
    );

    expect(matches).toHaveLength(1);
    expect(matches[0]?.match.relation).toBe("exact");
  });
});
