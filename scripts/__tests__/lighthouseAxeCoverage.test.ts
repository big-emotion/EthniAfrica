import { describe, expect, it } from "vitest";

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

  // @req REQ-176
  it("names at least one route, so the assertions above are not vacuous", () => {
    expect(gateRoutes.length).toBeGreaterThan(0);
  });
});
