import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, test } from "vitest";

/**
 * ETNI-1378 / ETNI-1478 — the three fiche routes (familles, pays, peuples)
 * statically imported AtlasGlobe, so its whole client bundle (marker
 * placement, camera hooks, target picker, facts panel, SVG fallback — every
 * effect it runs) evaluated and hydrated as one synchronous task with the
 * rest of the page. Loading it through `next/dynamic` in the server route
 * split the file but still scheduled the client chunk before the browser had
 * painted the server response. The mobile Lighthouse runner consequently did
 * roughly seven seconds of main-thread work before it could paint the fiche
 * lede (reference run: github.com/big-emotion/ethniafrica/actions/runs/35433936660).
 *
 * FicheAtlasGlobeIsland keeps a zero-dependency Africa map in the server
 * response and upgrades it only when the reader asks to interact. The map
 * therefore still leads the fiche while a GPU-less audit — or a reader who
 * only wants the record — never pays the globe's JavaScript cost.
 */
const FICHE_PAGES = [
  "familles/[slug]/page.tsx",
  "pays/[slug]/page.tsx",
  "peuples/[slug]/page.tsx",
] as const;

const ATLAS_GLOBE_IMPORT_PATTERN = /@\/components\/atlas\/AtlasGlobe/;
const FICHE_ISLAND_IMPORT_PATTERN =
  /import\s*\{\s*FicheAtlasGlobeIsland\s*\}\s*from\s*["']@\/components\/atlas\/FicheAtlasGlobeIsland["']/;

describe("fiche routes defer the interactive AtlasGlobe until reader intent", () => {
  for (const relativePath of FICHE_PAGES) {
    // @req REQ-112
    test(`${relativePath} does not statically import AtlasGlobe`, () => {
      const source = readFileSync(
        path.join(__dirname, "..", relativePath),
        "utf8"
      );
      expect(source).not.toMatch(ATLAS_GLOBE_IMPORT_PATTERN);
    });

    // @req REQ-112
    test(`${relativePath} mounts the fiche globe island`, () => {
      const source = readFileSync(
        path.join(__dirname, "..", relativePath),
        "utf8"
      );
      expect(source).toMatch(FICHE_ISLAND_IMPORT_PATTERN);
      expect(source).toContain("<FicheAtlasGlobeIsland");
    });
  }
});
