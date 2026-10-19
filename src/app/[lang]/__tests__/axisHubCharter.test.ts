import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { ACCESS_MODES } from "@/lib/hubs/moduleRegistry";
import { getLocalizedRoute } from "@/lib/routing";
import { routePageFile } from "@/test/routePageFile";

const fromRoot = (relativePath: string) => resolve(process.cwd(), relativePath);

/**
 * The route folder each axis's hub is served from.
 *
 * The French segment, because `[lang]` holds the French route tree.
 */
const HUB_ROUTE_DIR: Record<string, string> = Object.fromEntries(
  ACCESS_MODES.map((axis) => [
    axis,
    getLocalizedRoute("fr", `${axis}Hub` as never).slice("/fr/".length),
  ])
);

const NESTED_PAGES = [
  "src/app/[lang]/atlas/peuples/page.tsx",
  "src/app/[lang]/dossiers/anecdotes/page.tsx",
  "src/app/[lang]/jeux/[jeu]/page.tsx",
] as const;

/**
 * The three axis hubs, back on one spread (brand charter §8.6).
 *
 * This file replaces `axisHubRemovalCharter.test.ts`, which asserted that two
 * of these pages did *not* exist. ETNI-1555 removed them for a fault of the
 * band they carried — viewport-tall and bottom-aligned, so the title sat under
 * a screen of empty parchment — and the pages came back on 7 September 2026
 * once that band was replaced by a composition that fills the height it asks
 * for, and only asks where its axis has the tiles to fill it.
 *
 * Kept as a route-level file rather than folded into the component's contract
 * because what went wrong last time was a *page*: the hubs were reachable,
 * indexed and linked while being unreadable. A component test cannot see that.
 */
describe("the axis hubs — three addresses, one spread", () => {
  // @req REQ-114
  it("serves a page at every axis hub route", () => {
    for (const axis of ACCESS_MODES) {
      expect(routePageFile(HUB_ROUTE_DIR[axis]), axis).not.toBeNull();
    }
  });

  // @req REQ-114
  it("leaves the routes nested under each axis untouched", () => {
    for (const nested of NESTED_PAGES) {
      expect(existsSync(fromRoot(nested)), nested).toBe(true);
    }
  });

  /**
   * Every remaining spread hub reads the one page module, so a change to the
   * spread reaches all of them. Hand-written pages let retired hubs become
   * different surfaces sharing a name.
   *
   * The dossiers axis left the spread on 30 September 2026 for the Articles
   * listing. The Atlas left it on 18 October 2026 for the approved names hub
   * (brief 14). Each exception has its own route assertion below.
   */
  // @req REQ-114
  it("builds every spread hub from the shared axis-hub page", () => {
    for (const axis of ACCESS_MODES.filter(
      (mode) => mode !== "dossiers" && mode !== "atlas"
    )) {
      const source = readFileSync(routePageFile(HUB_ROUTE_DIR[axis]), "utf8");

      expect(source, axis).toContain("@/components/hubs/axisHubPage");
      expect(source, axis).toContain(`axis="${axis}"`);
    }
  });

  // @req REQ-114
  it("serves the approved names hub, not the spread, at the Atlas route", () => {
    const source = readFileSync(
      fromRoot("src/app/[lang]/atlas/(hub)/page.tsx"),
      "utf8"
    );
    expect(source).toContain("@/components/atlas/AtlasNamesHub");
    expect(source).not.toContain("@/components/hubs/axisHubPage");
  });

  // @req REQ-114
  it("serves the Articles listing, not the spread, at the dossiers hub", () => {
    const source = readFileSync(
      fromRoot(`src/app/[lang]/${HUB_ROUTE_DIR.dossiers}/page.tsx`),
      "utf8"
    );
    expect(source).toContain("@/components/articles/ArticleListing");
    expect(source).not.toContain("@/components/hubs/axisHubPage");
  });
});
