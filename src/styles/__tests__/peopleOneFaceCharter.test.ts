import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

/**
 * REQ-190 / DEC-068: the people fiche's text uses one font family.
 *
 * The rule is held on the stylesheet rather than on a rendered DOM: happy-dom
 * computes no CSS, so a test asking it for computed font families would pass
 * on any page. Redefining the two other face tokens to the body face inside
 * the fiche is what makes every component that reads them — chapter titles,
 * uppercase mono labels — fall back to one face without being edited.
 */
const css = readFileSync(
  join(process.cwd(), "src/styles/fiche-parchment.css"),
  "utf8"
);

function ruleBody(selector: string): string {
  const start = css.indexOf(`${selector} {`);
  expect(start, `${selector} is declared`).toBeGreaterThanOrEqual(0);
  return css.slice(start, css.indexOf("}", start));
}

describe("the people fiche speaks in one face", () => {
  // @req REQ-190
  it("points the display and mono faces at the body face inside the fiche", () => {
    const body = ruleBody(".afh-one-face");
    expect(body).toContain("--afh-font-display: var(--afh-font-body)");
    expect(body).toContain("--afh-font-mono: var(--afh-font-body)");
  });

  // @req REQ-190
  it("colours every badge from a token, never a literal", () => {
    const badgeRules = css
      .split("}")
      .filter((rule) => rule.includes(".afh-name-badge"));
    expect(badgeRules.length).toBeGreaterThan(0);
    for (const rule of badgeRules)
      expect(rule).not.toMatch(/#[0-9a-f]{3,8}\b/i);
  });
});
