import fs from "fs";
import os from "os";
import path from "path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  ASSERTIVE_ETYMOLOGY_RATCHET,
  checkEtymologyHypotheses,
} from "../checkEtymologyHypotheses";

let datasetRoot: string;

function writeCountry(id: string, etymology: string): void {
  const filePath = path.join(datasetRoot, "pays", `${id}.json`);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify({ id, etymology }), "utf8");
}

beforeEach(() => {
  datasetRoot = fs.mkdtempSync(path.join(os.tmpdir(), "etymology-gate-"));
});

afterEach(() => {
  fs.rmSync(datasetRoot, { recursive: true, force: true });
});

describe("checkEtymologyHypotheses", () => {
  // @req REQ-178
  it("holds when the count of asserting fields equals the ratchet", () => {
    writeCountry("CMR", "Le nom dérive du portugais Rio dos Camarões.");
    writeCountry("UGA", "Le nom viendrait du royaume du Buganda.");

    const result = checkEtymologyHypotheses(datasetRoot, 1);

    expect(result.ok).toBe(true);
    expect(result.count).toBe(1);
  });

  // @req REQ-178
  it("fails when a new etymology states an origin as fact", () => {
    writeCountry("CMR", "Le nom dérive du portugais Rio dos Camarões.");

    const result = checkEtymologyHypotheses(datasetRoot, 0);

    expect(result.ok).toBe(false);
    expect(result.error).toContain("pays/CMR.json");
    expect(result.error).toContain("viendrait de");
  });

  // @req REQ-178
  it("fails when the count drops below the ratchet, naming the line to lower", () => {
    writeCountry("UGA", "Le nom viendrait du royaume du Buganda.");

    const result = checkEtymologyHypotheses(datasetRoot, 2);

    expect(result.ok).toBe(false);
    expect(result.error).toContain(
      "lower ASSERTIVE_ETYMOLOGY_RATCHET to 0 in scripts/ci/checkEtymologyHypotheses.ts"
    );
  });

  // @req REQ-178
  it("holds on the real fiches", () => {
    const result = checkEtymologyHypotheses(
      "dataset/source/afrik",
      ASSERTIVE_ETYMOLOGY_RATCHET
    );

    expect(result.error).toBeNull();
  });
});
