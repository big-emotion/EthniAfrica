import { describe, expect, it } from "vitest";

import {
  namesForCountry,
  namesForPeople,
} from "@/components/fiche/__tests__/corpusRecords";
import {
  NAME_INDEX_THRESHOLD,
  groupNamesBySystem,
  namesChapterTitle,
} from "@/lib/fiche/names";

// @req REQ-133
describe("namesChapterTitle", () => {
  // @req REQ-133
  it.each([
    ["people", "Noms de personnes associés à ce peuple"],
    ["country", "Noms de personnes rattachés à ce pays"],
    ["language", "Noms de personnes associés à cette langue"],
  ] as const)(
    "uses the approved plain-language title for %s",
    (scope, title) => {
      expect(namesChapterTitle(scope, "fr")).toBe(title);
    }
  );
});

describe("groupNamesBySystem", () => {
  // @req REQ-133
  it("files names under their system, the largest group first, each A–Z", () => {
    const groups = groupNamesBySystem(namesForPeople("PPL_SOMALI"), "fr");
    // 16 -> 15 on 2026-10-11: Youssouf was folded into Yusuf, and its
    // Somali link, which rested on the candidate queue, was not carried.
    expect(groups.map((group) => [group.system, group.names.length])).toEqual([
      ["non_hereditary_patronymic", 15],
      ["clan_name", 4],
    ]);
    for (const group of groups) {
      const sorted = [...group.names].sort((a, b) =>
        a.nameMain.localeCompare(b.nameMain, "fr", { sensitivity: "base" })
      );
      expect(group.names).toEqual(sorted);
    }
  });

  // Nine countries hold more than 24 attested names; below that an index of
  // 26 letters is longer than the list it indexes.
  // @req REQ-133
  it("indexes only past 24 names, which the largest country lists reach", () => {
    expect(NAME_INDEX_THRESHOLD).toBe(24);
    expect(namesForCountry("NGA").length).toBeGreaterThan(NAME_INDEX_THRESHOLD);
    expect(namesForCountry("NAM").length).toBeLessThanOrEqual(
      NAME_INDEX_THRESHOLD
    );
  });
});
