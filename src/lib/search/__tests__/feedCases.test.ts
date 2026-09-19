import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { searchCompanionsDataSchema } from "@/api/v2/schemas/searchCompanions";
import {
  FEED_CASE_IDS,
  FEED_BOARD_AUTHORING,
  FEED_CASES,
  feedCaseFixturesSchema,
} from "@/lib/search/__fixtures__/feedCases";
import {
  formatProductionNameQuestion,
  formatProductionPosterAlt,
} from "@/lib/editorial/productionNameQuestion";
import {
  loadSearchFeedManifest,
  type SearchFeedManifestEntry,
} from "../../../../e2e/support/search-feed-visual";
import { resolveSearchFeedAssetPath } from "../../../../e2e/support/search-feed-browser";

const EXPECTED_CASE_IDS = [
  "mande",
  "peul",
  "fang",
  "bassa",
  "ekpeye",
  "nigeria",
  "lingala",
  "traore",
  "introuvable",
  "inconnu",
] as const;

function structuralShape(entry: SearchFeedManifestEntry) {
  return {
    query: entry.query,
    resultState: entry.resultState,
    blocks: entry.blocks,
    owedParts: entry.owedParts,
  };
}

describe("search-feed case fixtures", () => {
  // @req REQ-180
  it("exports exactly the ten canonical cases in board order", () => {
    expect(FEED_CASE_IDS).toEqual(EXPECTED_CASE_IDS);
    expect(FEED_CASES.map(({ id }) => id)).toEqual(EXPECTED_CASE_IDS);
    expect(new Set(FEED_CASES.map(({ id }) => id)).size).toBe(10);
    expect(FEED_CASES.every(({ fixture }) => fixture)).toBe(true);
    expect(FEED_BOARD_AUTHORING.map(({ id }) => id)).toEqual(EXPECTED_CASE_IDS);
  });

  // @req REQ-180
  it("validates every companions projection with the public API schema", () => {
    expect(feedCaseFixturesSchema.parse(FEED_CASES)).toEqual(FEED_CASES);
    for (const fixture of FEED_CASES) {
      expect(
        searchCompanionsDataSchema.safeParse(fixture.production.companions)
          .success,
        fixture.id
      ).toBe(true);
      expect(fixture.production.search.answered, fixture.id).toBe(true);
    }
  });

  // @req REQ-180
  it("matches one structural fixture to all four generated variants", () => {
    const manifest = loadSearchFeedManifest(
      path.join(process.cwd(), "docs/design/mockups/search-feed/manifest.json")
    );

    for (const fixture of FEED_CASES) {
      const variants = manifest.entries.filter(
        (entry) => entry.case === fixture.id
      );
      expect(variants, fixture.id).toHaveLength(4);
      for (const variant of variants) {
        expect(structuralShape(variant), variant.file).toEqual({
          query: fixture.query,
          resultState: fixture.resultState,
          blocks:
            fixture.board.blocks[
              variant.variant.startsWith("mobile") ? "mobile" : "desktop"
            ],
          owedParts: fixture.board.owedParts,
        });
      }
    }
  });

  // @req REQ-180
  it("reproduces every board count and empty short slot", () => {
    for (const fixture of FEED_CASES) {
      const authoring = FEED_BOARD_AUTHORING.find(
        ({ id }) => id === fixture.id
      )!;
      const lens = Object.fromEntries(authoring.lens);
      expect(fixture.board.lenses, fixture.id).toEqual({
        shorts: lens.Shorts,
        ...(typeof lens.Images === "number" ? { images: lens.Images } : {}),
        ...(typeof lens.Jeux === "boolean" ? { quiz: lens.Jeux } : {}),
        ...(typeof lens.Fiches === "number" ? { fiches: lens.Fiches } : {}),
      });
      expect(fixture.board.shorts.items, fixture.id).toHaveLength(lens.Shorts);
    }
    expect(
      FEED_CASES.filter(({ board }) => board.shorts.emptySlot).map(
        ({ id }) => id
      )
    ).toEqual(["bassa", "ekpeye", "inconnu"]);
  });

  // @req REQ-180
  it("projects copy, counts and productions from the complete authoring source", () => {
    for (const fixture of FEED_CASES) {
      const authoring = FEED_BOARD_AUTHORING.find(
        ({ id }) => id === fixture.id
      )!;
      expect(fixture.board.copy, fixture.id).toMatchObject({
        title: authoring.title,
        verdict: authoring.verdict,
        summary: authoring.sub,
      });
      expect(
        fixture.board.shorts.items.map(({ name, durationSeconds, label }) => [
          name,
          durationSeconds,
          label ?? null,
        ]),
        fixture.id
      ).toEqual(
        authoring.shorts.items.map(([name, duration, label]) => {
          const [minutes, seconds] = duration.split(":").map(Number);
          return [name, minutes * 60 + seconds, label];
        })
      );
      expect(
        fixture.board.shorts.emptySlot
          ? [
              fixture.board.shorts.emptySlot.question,
              fixture.board.shorts.emptySlot.body,
              fixture.board.shorts.emptySlot.action,
            ]
          : undefined,
        fixture.id
      ).toEqual(authoring.shorts.empty);
    }
  });

  // @req REQ-180
  it("derives every production title and poster alt from its subject name", () => {
    for (const fixture of FEED_CASES) {
      for (const short of fixture.board.shorts.items) {
        expect(formatProductionNameQuestion(short.name, "fr")).toBe(
          `D’où vient le nom « ${short.name} » ?`
        );
        expect(formatProductionPosterAlt(short.name, "fr")).toBe(
          `Couverture : D’où vient le nom « ${short.name} » ?`
        );
      }
      const empty = fixture.board.shorts.emptySlot;
      if (empty) {
        expect(empty.question).toBe(
          formatProductionNameQuestion(empty.name, "fr")
        );
      }
    }
  });

  // @req REQ-180
  it("routes every fixture asset to an existing committed regular file", () => {
    const requestPaths = new Set<string>();
    for (const fixture of FEED_CASES) {
      const authoring = FEED_BOARD_AUTHORING.find(
        ({ id }) => id === fixture.id
      )!;
      const boardMarkup = fs.readFileSync(
        path.join(
          process.cwd(),
          "docs/design/mockups/search-feed",
          `${authoring.file}Desktop.dc.html`
        ),
        "utf8"
      );
      const renderedPosters = [
        ...boardMarkup.matchAll(/src="posters\/([^"']+\.jpg)"/g),
      ].map((match) => match[1]);
      expect(renderedPosters, fixture.id).toEqual(
        fixture.board.shorts.items.map(({ poster }) =>
          path.basename(poster.repositoryPath)
        )
      );
      const renderedEditorialImages = [
        ...boardMarkup.matchAll(
          /src="\.\.\/\.\.\/\.\.\/\.\.\/public\/images\/([^"']+)"/g
        ),
      ].map((match) => `/public/images/${match[1]}`);
      expect([...new Set(renderedEditorialImages)], fixture.id).toEqual(
        fixture.board.editorialImages.map(({ requestPath }) => requestPath)
      );

      const assets = [
        ...fixture.board.shorts.items.map(({ poster }) => poster),
        ...fixture.board.editorialImages,
      ];
      for (const asset of assets) {
        expect(asset.repositoryPath, fixture.id).not.toContain("..");
        expect(asset.repositoryPath, fixture.id).not.toMatch(/^\//);
        const resolved = resolveSearchFeedAssetPath(asset.requestPath);
        expect(resolved, `${fixture.id}: ${asset.requestPath}`).toBe(
          path.join(process.cwd(), asset.repositoryPath)
        );
        requestPaths.add(asset.requestPath);
      }
    }
    expect(requestPaths.size).toBeGreaterThan(20);
  });
});
