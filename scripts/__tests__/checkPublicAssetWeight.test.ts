import { describe, expect, it } from "vitest";

import {
  judgeAssetWeight,
  readTrackedAssets,
  PUBLIC_ASSET_FILE_CEILING_BYTES,
  PUBLIC_ASSET_WEIGHT_CEILING_BYTES,
} from "../ci/checkPublicAssetWeight";

const MiB = 1024 * 1024;

describe("tracked asset weight", () => {
  // @req REQ-114
  it("passes a directory under both ceilings and reports what is left", () => {
    const verdict = judgeAssetWeight([
      { path: "public/a.jpg", bytes: 1 * MiB },
      { path: "public/b.jpg", bytes: 2 * MiB },
    ]);

    expect(verdict.ok).toBe(true);
    expect(verdict.errors).toEqual([]);
    expect(verdict.notices[0]).toContain("of headroom");
  });

  // @req REQ-114
  it("refuses a directory whose total passes the ceiling, and names the constant to raise", () => {
    const verdict = judgeAssetWeight([
      { path: "public/big.jpg", bytes: PUBLIC_ASSET_WEIGHT_CEILING_BYTES },
      { path: "public/one-more.jpg", bytes: 1 },
    ]);

    expect(verdict.ok).toBe(false);
    expect(verdict.errors[0]).toContain("PUBLIC_ASSET_WEIGHT_CEILING_BYTES");
  });

  // A single careless export is how a directory like this usually grows, and
  // it can sit well under the total while being the whole problem.
  // @req REQ-114
  it("names the one file that is too heavy even when the total is fine", () => {
    const verdict = judgeAssetWeight([
      { path: "public/heavy.png", bytes: PUBLIC_ASSET_FILE_CEILING_BYTES + 1 },
    ]);

    expect(verdict.ok).toBe(false);
    expect(verdict.errors).toHaveLength(1);
    expect(verdict.errors[0]).toContain("public/heavy.png");
  });

  // The gate exists to be measured against the repository, not against its
  // own fixtures: a ceiling already breached on the day it lands is a ceiling
  // nobody will believe.
  // @req REQ-114
  it("holds for the assets this repository actually tracks", () => {
    expect(judgeAssetWeight(readTrackedAssets()).errors).toEqual([]);
  });
});
