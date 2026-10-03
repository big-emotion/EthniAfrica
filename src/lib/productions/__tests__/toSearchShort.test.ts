import { existsSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { DISCOVERY_VIDEOS } from "@/lib/discoveries/videos";
import { getFamilyRoute } from "@/lib/routing";
import {
  eligibleSearchShorts,
  shortsForWord,
} from "@/lib/search/companionCatalogs";

import { loadProductionLedger, type LedgerEntry } from "../ledger";
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
  it("ignores a production with neither a subject nor a word the search can match", () => {
    const unmatched = { ...complete, subjects: [] };

    expect(searchShortsFrom([unmatched], [])).toEqual([]);
  });

  // @req REQ-180
  it("keeps a word piece, which the search finds by the queries filed for it", () => {
    const zombie: LedgerEntry = {
      ...complete,
      campaign: "zombie",
      subjects: [],
      word: { label: { fr: "zombie", en: "zombie" }, queries: ["zombie"] },
    };

    const [short] = searchShortsFrom([zombie], []);

    expect(short.word?.queries).toEqual(["zombie"]);
    expect(short.subjects).toEqual([]);
    expect(eligibleSearchShorts([short])).toHaveLength(1);
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

describe("the filed production ledger", () => {
  const filed = loadProductionLedger().filter(
    (entry) => entry.poster && entry.durationSeconds && entry.sources?.length
  );

  // A poster path with a typo, or a source with no tier, would otherwise drop a
  // filed production from the results without a word.
  // @req REQ-180
  it("shows every production that files a poster, a duration and a source", () => {
    expect(filed.length).toBeGreaterThan(0);

    const shown = eligibleSearchShorts(searchShortsFrom(filed, []));

    expect(shown.map((short) => short.id).sort()).toEqual(
      filed.map((entry) => `video:${entry.campaign}`).sort()
    );
  });

  // The word is what a reader types; a filed query that no longer reaches its
  // piece would silently send that reader to the confession.
  // @req REQ-180
  it("finds every filed word piece by each of its own queries", () => {
    const pieces = filed.filter((entry) => entry.word);
    expect(pieces.length).toBeGreaterThan(0);

    const shorts = searchShortsFrom(pieces, []);
    for (const entry of pieces) {
      for (const query of entry.word!.queries) {
        const found = shortsForWord(query, shorts).items;
        expect(
          found.map(({ item }) => item.id),
          `${entry.campaign} by "${query}"`
        ).toContain(`video:${entry.campaign}`);
      }
    }
  });

  // @req REQ-180
  it("points every filed poster at a file that exists", () => {
    for (const entry of filed) {
      const file = path.join(process.cwd(), "public", entry.poster!.src);
      expect(existsSync(file), entry.campaign).toBe(true);
    }
  });
});
