import { describe, expect, it } from "vitest";

import { DISCOVERY_SLUGS } from "@/lib/discoveries/slugs";

import { LIVE_ROUTES } from "../a11yRoutes";

// eslint-disable-next-line @typescript-eslint/no-require-imports -- the lhci CLI itself loads this file as CommonJS
const gateConfig = require("../../.lighthouserc.gate.js");

/**
 * DEC-054: the Lighthouse gate used to assert `categories:accessibility`
 * itself, duplicating axe's own live-route audit on the same routes. This
 * holds the precondition that makes dropping it safe — every URL the
 * Lighthouse gate visits must already be one axe audits — so the removal
 * in .lighthouserc.gate.js never runs ahead of this test proving it true.
 */
describe("the Lighthouse gate visits no route outside axe's own coverage", () => {
  const gateRoutes: string[] = gateConfig.ci.collect.url.map(
    (url: string) => new URL(url).pathname
  );

  for (const route of gateRoutes) {
    // @req REQ-176
    it(`${route} is in scripts/a11yRoutes.ts's LIVE_ROUTES`, () => {
      expect(LIVE_ROUTES).toContain(route);
    });
  }

  // The Lighthouse gate never clicks, so it cannot see the mounted player; what
  // it can hold is the page that carries the facade, at the same 0.95.
  // @req REQ-181
  it("visits the Découvertes entry that carries the player facade, not the index that redirects", () => {
    const entry = `/fr/decouvertes/${DISCOVERY_SLUGS["video:origine-du-nom-mande"].fr}`;
    expect(gateRoutes).toContain(entry);
    // The index answers a 307 to the deck's first entry, an unrelated piece
    // whose identity moves with the catalogue's order: auditing it would audit
    // whatever happens to be first.
    expect(gateRoutes).not.toContain("/fr/decouvertes");
    expect(gateRoutes).toHaveLength(5);
  });

  // @req REQ-181
  it("holds best-practices at 0.95 as a blocking assertion on all five routes", () => {
    expect(
      gateConfig.ci.assert.assertions["categories:best-practices"]
    ).toEqual(["error", { minScore: 0.95 }]);
  });

  // @req REQ-176
  it("names at least one route, so the assertions above are not vacuous", () => {
    expect(gateRoutes.length).toBeGreaterThan(0);
  });
});
