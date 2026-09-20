import path from "node:path";
import sharp from "sharp";
import { describe, expect, it } from "vitest";

import {
  assertPixelParity,
  comparePngs,
  createSearchFeedDiffPng,
  loadSearchFeedManifest,
  parseSearchFeedManifest,
} from "../../../../e2e/support/search-feed-visual";

async function solidPng(
  width: number,
  height: number,
  changedPixels: number[] = []
): Promise<Buffer> {
  const channels = 4;
  const pixels = Buffer.alloc(width * height * channels, 255);

  for (const pixelIndex of changedPixels) {
    pixels[pixelIndex * channels] = 0;
  }

  return sharp(pixels, {
    raw: { width, height, channels },
  })
    .png()
    .toBuffer();
}

describe("search-feed visual parity helpers", () => {
  // @req REQ-180
  it("loads and validates the generated board manifest", () => {
    const manifest = loadSearchFeedManifest(
      path.join(process.cwd(), "docs/design/mockups/search-feed/manifest.json")
    );

    expect(manifest.schemaVersion).toBe(1);
    expect(manifest.entries).toHaveLength(40);
    expect(manifest.entries[0]).toMatchObject({
      case: "mande",
      variant: "mobile-day",
      width: 430,
      theme: "day",
    });
  });

  // @req REQ-180
  it("rejects an internally inconsistent manifest entry", () => {
    expect(() =>
      parseSearchFeedManifest({
        schemaVersion: 1,
        entries: [
          {
            case: "mande",
            variant: "mobile-day",
            file: "Mande.dc.html",
            query: "mandé",
            resultState: "exact",
            width: 1280,
            theme: "night",
            height: 3730,
            blocks: [{ id: "lenses", zone: "first" }],
            owedParts: [],
            firstPoster: null,
          },
        ],
      })
    ).toThrowError(
      "manifest.entries[0].width must be 430 for variant mobile-day"
    );
  });

  // @req REQ-180
  it("counts different pixels after normalizing both PNGs to sRGB RGBA", async () => {
    const reference = await solidPng(10, 10);
    const actual = await solidPng(10, 10, [0, 42]);

    await expect(comparePngs(reference, actual)).resolves.toEqual({
      width: 10,
      height: 10,
      totalPixels: 100,
      differentPixels: 2,
      differentPixelRatio: 0.02,
    });
  });

  // @req REQ-180
  it("ignores a one-level anti-aliasing difference but counts a two-level one", async () => {
    const channels = 4;
    const paint = async (red: number[]) => {
      const pixels = Buffer.alloc(red.length * channels, 255);
      red.forEach((value, index) => {
        pixels[index * channels] = value;
      });
      return sharp(pixels, { raw: { width: red.length, height: 1, channels } })
        .png()
        .toBuffer();
    };

    const reference = await paint([100, 100, 100]);
    const actual = await paint([101, 99, 102]);

    await expect(comparePngs(reference, actual)).resolves.toMatchObject({
      differentPixels: 1,
    });

    const { data } = await sharp(
      await createSearchFeedDiffPng(reference, actual)
    )
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    expect(Array.from(data.subarray(0, 3))).not.toEqual([255, 0, 0]);
    expect(Array.from(data.subarray(8, 11))).toEqual([255, 0, 0]);
  });

  // @req REQ-180
  it("renders changed pixels in red for review artifacts", async () => {
    const expected = await solidPng(2, 1);
    const actual = await solidPng(2, 1, [0]);

    const { data, info } = await sharp(
      await createSearchFeedDiffPng(expected, actual)
    )
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    expect(info).toMatchObject({ width: 2, height: 1, channels: 4 });
    expect(Array.from(data.subarray(0, 4))).toEqual([255, 0, 0, 255]);
    expect(Array.from(data.subarray(4, 8))).toEqual([255, 255, 255, 255]);
  });

  // @req REQ-180
  it("allows exactly one percent but rejects a deliberate mutation above it", async () => {
    const reference = await solidPng(10, 10);
    const atCeiling = await solidPng(10, 10, [0]);
    const aboveCeiling = await solidPng(10, 10, [0, 99]);

    await expect(
      assertPixelParity(reference, atCeiling)
    ).resolves.toMatchObject({ differentPixelRatio: 0.01 });
    await expect(
      assertPixelParity(reference, aboveCeiling)
    ).rejects.toThrowError(
      "Visual parity failed: 2/100 pixels differ (2.0000%), exceeding the 1.0000% ceiling"
    );
  });

  // @req REQ-180
  it("rejects a deliberate one-pixel height mutation before pixel comparison", async () => {
    const reference = await solidPng(10, 10);
    const onePixelTaller = await solidPng(10, 11);

    await expect(
      assertPixelParity(reference, onePixelTaller)
    ).rejects.toThrowError(
      "Screenshot height mismatch: expected 10px, received 11px; even a 1px height difference fails visual parity"
    );
  });
});
