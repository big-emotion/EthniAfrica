import { describe, expect, it } from "vitest";

import { DISCOVERY_VIDEOS } from "@/lib/discoveries/videos";
import { getFamilyRoute } from "@/lib/routing";
import { eligibleSearchShorts } from "@/lib/search/companionCatalogs";

import type { LedgerEntry } from "../ledger";
import { searchShortsFrom } from "../toSearchShort";

const complete: LedgerEntry = {
  campaign: "test-subject",
  typologie: "langue",
  episode: 1,
  question: {
    fr: "D'où vient le nom Test ?",
    en: "Where does Test come from?",
  },
  myth: null,
  subjects: [
    { kind: "family", id: "FLG_TEST", label: { fr: "Test", en: "Test" } },
  ],
  sitePath: getFamilyRoute("fr", "FLG_TEST"),
  publications: [
    {
      network: "youtube",
      format: "video",
      url: "https://www.youtube.com/shorts/abcdefghijk",
      publishedAt: "2026-09-15",
    },
  ],
  poster: {
    src: "/images/discoveries/videos/test.jpg",
    width: 540,
    height: 960,
  },
  durationSeconds: 90,
  sources: [
    { title: "Fiche", url: "https://example.org/fiche", tier: "referenced" },
  ],
};

describe("searchShortsFrom", () => {
  // @req REQ-180
  it("turns a finished ledger entry into a short the search can show", () => {
    const shorts = eligibleSearchShorts(searchShortsFrom([complete], []));

    expect(shorts).toHaveLength(1);
    expect(shorts[0].watchUrl).toBe(
      "https://www.youtube.com/shorts/abcdefghijk"
    );
    expect(shorts[0].subjects[0]).toMatchObject({
      kind: "family",
      id: "FLG_TEST",
    });
  });

  // @req REQ-180
  it.each([
    ["poster", { poster: undefined }],
    ["duration", { durationSeconds: undefined }],
    ["source", { sources: undefined }],
    ["video link", { publications: [] }],
  ])("keeps an entry without its %s out of the results", (_field, gap) => {
    const shorts = searchShortsFrom([{ ...complete, ...gap }], []);

    expect(eligibleSearchShorts(shorts)).toEqual([]);
  });

  // @req REQ-180
  it("ignores a production with no subject the search can match", () => {
    const wordOnly = { ...complete, subjects: [] };

    expect(searchShortsFrom([wordOnly], [])).toEqual([]);
  });

  // @req REQ-180
  it("shows a video once when the hand-authored catalog already holds it", () => {
    const [handAuthored] = DISCOVERY_VIDEOS;
    const twin: LedgerEntry = {
      ...complete,
      campaign: "twin-of-the-hand-authored-video",
      publications: [
        { network: "youtube", format: "video", url: handAuthored.watchUrl },
      ],
    };

    const shorts = searchShortsFrom([twin, complete], DISCOVERY_VIDEOS);

    expect(shorts.map((short) => short.id)).toEqual([
      handAuthored.id,
      "video:test-subject",
    ]);
  });
});
