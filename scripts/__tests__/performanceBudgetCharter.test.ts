import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * The lab performance floor is a decision, so it is written where decisions
 * about the whole site live — the brand charter — and the config enforces the
 * number the charter records. Either one moving alone fails here: a floor
 * lowered in `.lighthouserc.js` to absorb a regression has to be argued in the
 * charter in the same change.
 */

const require = createRequire(import.meta.url);
const lighthouseConfig = require("../../.lighthouserc.js");

const CHARTER_PATH = "docs/design/brand-charter.md";
const charter = readFileSync(resolve(process.cwd(), CHARTER_PATH), "utf8");

type MatrixEntry = {
  matchingUrlPattern: string;
  assertions: Record<string, [string, { minScore?: number }]>;
};

const assertMatrix = lighthouseConfig.ci.assert.assertMatrix as MatrixEntry[];

function performanceAssertionFor(url: string) {
  const found = assertMatrix
    .filter((entry) => new RegExp(entry.matchingUrlPattern).test(url))
    .map((entry) => entry.assertions["categories:performance"])
    .filter(Boolean);
  expect(found, `${url} must carry exactly one performance floor`).toHaveLength(
    1
  );
  return found[0];
}

function charterScore(label: string): number {
  const match = charter.match(
    new RegExp(`\\*\\*${label}:\\s*(0\\.\\d+)\\*\\*`)
  );
  expect(
    match,
    `${CHARTER_PATH} must state "**${label}: 0.xx**"`
  ).not.toBeNull();
  return Number(match![1]);
}

describe("performance budget charter", () => {
  // @req REQ-091
  it("enforces, as an error, the lab floor the charter accepts off the fiches", () => {
    const [level, { minScore }] = performanceAssertionFor(
      "http://localhost:3000/fr"
    );

    expect(level).toBe("error");
    expect(minScore).toBe(charterScore("Accepted lab floor off the fiches"));
  });

  // @req REQ-091
  it("keeps the charter's target as the level every fiche is warned against", () => {
    const [level, { minScore }] = performanceAssertionFor(
      "http://localhost:3000/fr/atlas/peuples/PPL_WOLOF"
    );

    expect(level).toBe("warn");
    expect(minScore).toBe(charterScore("Target"));
    expect(charterScore("Target")).toBeGreaterThan(
      charterScore("Accepted lab floor off the fiches")
    );
  });

  // @req REQ-091
  it("points the Lighthouse config at the charter that owns its budget", () => {
    const config = readFileSync(
      resolve(process.cwd(), ".lighthouserc.js"),
      "utf8"
    );

    expect(config).toContain(CHARTER_PATH);
  });
});
