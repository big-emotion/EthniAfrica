import { describe, it, expect } from "vitest";

import { classifyChanges } from "../classifyChanges";

describe("classifyChanges", () => {
  // @req REQ-054
  it("calls a change to production ledgers and guides documentation only", () => {
    expect(
      classifyChanges([
        "docs/productions/peuple/ledger.json",
        "docs/editorial/reader-facing-register.md",
        "CLAUDE.md",
      ])
    ).toBe("docs");
  });

  // @req REQ-054
  it("calls a change confined to the corpus a corpus change", () => {
    expect(
      classifyChanges([
        "dataset/source/afrik/peuples/FLG_KROU/PPL_BETE.json",
        "dataset/translations/en/PPL_BETE.json",
      ])
    ).toBe("corpus");
  });

  // @req REQ-054
  it("calls a mix of corpus and documentation a corpus change, since the corpus gates are the stricter set", () => {
    expect(
      classifyChanges(["dataset/source/afrik/pays/CIV.json", "docs/a.md"])
    ).toBe("corpus");
  });

  // @req REQ-054
  it("runs everything as soon as one path is code", () => {
    expect(
      classifyChanges([
        "dataset/source/afrik/pays/CIV.json",
        "src/lib/search/naming.ts",
      ])
    ).toBe("code");
  });

  // @req REQ-054
  it("treats a path it does not recognise as code rather than skipping a gate", () => {
    expect(classifyChanges(["Dockerfile"])).toBe("code");
    expect(classifyChanges([".github/workflows/ci.yml"])).toBe("code");
    expect(classifyChanges(["package-lock.json"])).toBe("code");
  });

  // @req REQ-054
  it("runs everything when the diff is empty or could not be read", () => {
    expect(classifyChanges([])).toBe("code");
  });
});
