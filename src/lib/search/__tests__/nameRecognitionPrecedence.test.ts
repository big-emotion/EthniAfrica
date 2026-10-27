import { describe, expect, it } from "vitest";

import { FEED_CASES } from "@/lib/search/__fixtures__/feedCases";
import { classifySearchFeed } from "@/lib/search/searchFeedPlan";
import { selectNameSubject } from "@/lib/search/nameSubject";
import type { SearchResult } from "@/types/afrik-frontend";

/**
 * Phase 1 of the name search plan: the failures reported on the live site,
 * written as expectations before any behaviour changes. The fixtures are small
 * and copied from the examined source data (PPL_AMAZIGH_MACRO is filed as
 * « Amazigh (Berbères) » and registers Imazighen, Berbères and Libyens).
 */

const amazighMacro: SearchResult = {
  type: "people",
  id: "PPL_AMAZIGH_MACRO",
  name: "Amazigh (Berbères)",
  relevance: 1,
  naming: {
    forms: [{ form: "Imazighen" }, { form: "Berbères" }, { form: "Libyens" }],
  },
} as unknown as SearchResult;

const proseOnly: SearchResult = {
  type: "country",
  id: "CTR_ALGERIA",
  name: "Algérie",
  relevance: 1,
  recordedIn: [
    {
      fieldPath: "content.organization.clanOrganization",
      text: "organisation tribale (Sahara), structures étatiques modernes",
    },
  ],
} as unknown as SearchResult;

describe("a recognised name outranks prose occurrences", () => {
  // @req REQ-178
  it("answers « amazigh » with the people whose registered name holds that whole word", () => {
    const subjects = selectNameSubject([amazighMacro, proseOnly], "amazigh");

    expect(subjects.map(({ id }) => id)).toEqual(["PPL_AMAZIGH_MACRO"]);
  });

  // @req REQ-178
  it("does not read a typo-length fragment as a recognised name", () => {
    expect(selectNameSubject([amazighMacro, proseOnly], "amazig")).toEqual([]);
  });

  // @req REQ-178
  it("never lets a text occurrence displace a subject that answers the name", () => {
    const exact = FEED_CASES.find(({ id }) => id === "mande")!;
    const [result] = exact.production.search.results;

    expect(
      classifySearchFeed({
        ...exact.production,
        subjects: [result],
        search: {
          ...exact.production.search,
          results: [
            {
              ...result,
              recordedIn: [
                {
                  fieldPath: "content.organization.clanOrganization",
                  text: "Les clans Kagbo, Sanoh, Kaloko et Koroma.",
                },
              ],
            },
          ],
        },
      })
    ).not.toBe("recorded");
  });
});
