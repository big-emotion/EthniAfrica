import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { describe, expect, it } from "vitest";

const REPOSITORY_ROOT = process.cwd();
const EXPORTER = path.join(
  REPOSITORY_ROOT,
  "docs/design/mockups/search-feed/generator/export_fixture_cases.py"
);
const FIXTURE_SOURCE = path.join(
  REPOSITORY_ROOT,
  "src/lib/search/__fixtures__/feedBoardCases.json"
);

describe("the complete search-feed board fixture source", () => {
  // @req REQ-180
  it("is a deterministic byte-for-byte export of the approved board cases", () => {
    const exported = spawnSync("python3", [EXPORTER, "--stdout"], {
      cwd: REPOSITORY_ROOT,
      encoding: "utf8",
    });

    expect(exported.status, exported.stderr).toBe(0);
    expect(exported.stdout).toBe(fs.readFileSync(FIXTURE_SOURCE, "utf8"));
  });

  // @req REQ-180
  it("contains all ten cases and every authored top-level section", () => {
    const cases = JSON.parse(fs.readFileSync(FIXTURE_SOURCE, "utf8")) as Array<
      Record<string, unknown>
    >;

    expect(cases).toHaveLength(10);
    expect(cases.map(({ id }) => id)).toEqual([
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
    ]);
    for (const fixture of cases) {
      expect(fixture).toEqual(
        expect.objectContaining({
          id: expect.any(String),
          q: expect.any(String),
          result_state: expect.any(String),
          title: expect.any(String),
          verdict: expect.any(String),
          sub: expect.any(String),
          lens: expect.any(Array),
          shorts: expect.any(Object),
          order: expect.any(Array),
        })
      );
    }
  });
});
