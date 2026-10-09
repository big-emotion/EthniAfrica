import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { checkSourceKindCoverage } from "../checkSourceKindCoverage";

let datasetRoot: string;

function writeFiche(relativePath: string, fiche: unknown): void {
  const file = path.join(datasetRoot, relativePath);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(fiche, null, 2), "utf8");
}

beforeEach(() => {
  datasetRoot = fs.mkdtempSync(path.join(os.tmpdir(), "kind-coverage-"));
  writeFiche("peuples/PPL_A.json", {
    id: "PPL_A",
    sources: [
      { title: "typed", tier: "referenced", source_kind: "academic" },
      { title: "untyped", tier: "unverified" },
    ],
    names: [{ sources: [{ title: "nested untyped", tier: "unverified" }] }],
  });
});

afterEach(() => {
  fs.rmSync(datasetRoot, { recursive: true, force: true });
});

describe("checkSourceKindCoverage", () => {
  // @req REQ-161
  it("holds when the untyped count equals the ratchet", () => {
    const result = checkSourceKindCoverage(datasetRoot, 2);

    expect(result.ok).toBe(true);
    expect(result.untyped.map((source) => source.title)).toEqual([
      "untyped",
      "nested untyped",
    ]);
  });

  // @req REQ-161
  it("fails when a new fiche source arrives without a source_kind", () => {
    writeFiche("pays/BEN.json", {
      id: "BEN",
      sources: [{ title: "new", tier: "official" }],
    });

    const result = checkSourceKindCoverage(datasetRoot, 2);

    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/3 sources without source_kind exceed/);
  });

  // @req REQ-161
  it("fails when the count drops below the ratchet, so the line is lowered", () => {
    const result = checkSourceKindCoverage(datasetRoot, 5);

    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/lower UNTYPED_SOURCE_RATCHET to 2/);
  });
});
