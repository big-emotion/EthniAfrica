// @req REQ-084
import { describe, expect, it } from "vitest";

import { guardRawDiff } from "../../propositions/guard";

const modified = (path: string, mode = "100644") =>
  `:${mode} ${mode} aaaaaaa bbbbbbb M\t${path}`;

// @req REQ-084

describe("guardRawDiff", () => {
  // @req REQ-084
  it("accepts a diff confined to AFRIK json fiches", () => {
    const diff = [
      modified("dataset/source/afrik/peuples/FLG_X/PPL_X.json"),
      modified("dataset/source/afrik/langues/xyz.json"),
    ].join("\n");
    expect(guardRawDiff(diff)).toEqual({ ok: true, errors: [] });
  });

  // @req REQ-084

  it.each([
    ["a workflow", ".github/workflows/ci.yml"],
    ["a script", "scripts/validateAfrikData.ts"],
    ["a non-json file in the corpus", "dataset/source/afrik/peuples/x.md"],
    ["a path climbing out", "dataset/source/afrik/../../../package.json"],
    ["a lookalike directory", "dataset/source/afrik-evil/x.json"],
    ["a quoted unusual path", '"dataset/source/afrik/\\303\\251.json"'],
  ])("fails on %s", (_label, path) => {
    const result = guardRawDiff(modified(path));
    expect(result.ok).toBe(false);
    expect(result.errors.join()).toContain(path);
  });

  // @req REQ-084

  it("fails on a symlink even inside the corpus", () => {
    expect(
      guardRawDiff(modified("dataset/source/afrik/x.json", "120000")).ok
    ).toBe(false);
  });

  // @req REQ-084

  it("fails when the diff is empty, since there is nothing to propose", () => {
    expect(guardRawDiff("").ok).toBe(false);
  });
});
