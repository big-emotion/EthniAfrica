import { existsSync, mkdtempSync, mkdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import sharp from "sharp";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import type {
  DiscoveryPublication,
  DownloadFormat,
} from "@/lib/discoveries/catalog";
import { GENERATED_IMAGE_MANIFEST } from "@/lib/discoveries/generatedImages";

import {
  AUTONYM_RING,
  deriveGeneratedImage,
  fitPlan,
  markPlacement,
  medianColour,
  resolveMastersDir,
} from "../lib/generatedImageDerivation";
import { checkDeclaredDownloads } from "../lib/generatedImageDownloads";

const FRAMES: Record<DownloadFormat, { width: number; height: number }> = {
  "9:16": { width: 1080, height: 1920 },
  "4:5": { width: 1080, height: 1350 },
  "1:1": { width: 1080, height: 1080 },
};

const MARK_SIZES = [
  { width: 120, height: 24 },
  { width: 182, height: 32 },
  { width: 320, height: 48 },
];

const repositoryRoot = path.resolve(__dirname, "../..");

describe("where the generated-image mark is burned", () => {
  // The platform draws its own interface over a story: the caption and
  // buttons along the bottom, the action rail along the right.
  // @req REQ-166
  it("keeps the 9:16 mark top-left, inside its margins and out of the platform interface", () => {
    for (const mark of MARK_SIZES) {
      const box = markPlacement("9:16", mark);
      expect(box.left).toBeGreaterThanOrEqual(84);
      expect(box.top).toBeGreaterThanOrEqual(124);
      expect(box.left + box.width).toBeLessThanOrEqual(1080 - 180);
      expect(box.top + box.height).toBeLessThanOrEqual(1920 - 300);
      expect(box.top).toBeLessThan(1920 / 2);
    }
  });

  // @req REQ-166
  it("keeps the 4:5 mark bottom-left inside 84 px margins", () => {
    for (const mark of MARK_SIZES) {
      const box = markPlacement("4:5", mark);
      expect(box.left).toBeGreaterThanOrEqual(84);
      expect(box.top + box.height).toBeLessThanOrEqual(1350 - 84);
      expect(box.top).toBeGreaterThan(1350 / 2);
      expect(box.left).toBeLessThan(1080 / 2);
    }
  });

  // A profile picture is cropped to a circle: a corner of the mark outside it
  // would be cut from the disclosure on every avatar.
  // @req REQ-166
  it("centres the 1:1 mark at the bottom with every corner inside the inscribed circle", () => {
    const radius = 540;
    for (const mark of MARK_SIZES) {
      const box = markPlacement("1:1", mark);
      expect(box.left + box.width / 2).toBeCloseTo(540, 0);
      expect(box.top).toBeGreaterThan(540);
      const corners = [
        [box.left, box.top],
        [box.left + box.width, box.top],
        [box.left, box.top + box.height],
        [box.left + box.width, box.top + box.height],
      ];
      for (const [x, y] of corners) {
        expect(Math.hypot(x - 540, y - 540)).toBeLessThan(radius);
      }
    }
  });
});

describe("the mark on an autonym's avatar", () => {
  // The portrait is painted inside a gold ring. A mark across the ring
  // collides with the painting, and one below it in the cream band is cut by
  // a round avatar crop, so it must sit wholly inside the ring's inner edge.
  // @req REQ-166
  it("keeps every corner inside the painted ring's inner edge, clear of its band", () => {
    const scale = 1080 / AUTONYM_RING.masterSize;
    const ringInner = AUTONYM_RING.innerRadius * scale;
    const ringOuter = AUTONYM_RING.outerRadius * scale;
    for (const mark of MARK_SIZES) {
      const box = markPlacement("1:1", mark, "autonymes");
      expect(box.left + box.width / 2).toBeCloseTo(540, 0);
      const corners = [
        [box.left, box.top],
        [box.left + box.width, box.top],
        [box.left, box.top + box.height],
        [box.left + box.width, box.top + box.height],
      ];
      for (const [x, y] of corners) {
        const distance = Math.hypot(x - 540, y - 540);
        expect(distance).toBeLessThan(ringInner);
        expect(distance < ringInner || distance > ringOuter).toBe(true);
      }
      // Still the bottom of the avatar, not drifted towards the face.
      expect(box.top + box.height).toBeGreaterThan(540 + ringInner * 0.8);
    }
  });

  // @req REQ-166
  it("leaves a scene's 1:1 mark on the avatar's own circle", () => {
    const mark = { width: 182, height: 32 };
    expect(markPlacement("1:1", mark, "traversees")).toEqual(
      markPlacement("1:1", mark)
    );
  });
});

describe("how each collection fits a format", () => {
  // @req REQ-166
  it("never crops an autonym's painted circle: square as is, taller formats extended", () => {
    const entry = { collection: "autonymes" as const, master: "a.png" };
    expect(fitPlan(entry, "1:1")).toEqual({ master: "a.png", fit: "resize" });
    expect(fitPlan(entry, "4:5")).toEqual({ master: "a.png", fit: "extend" });
    expect(fitPlan(entry, "9:16")).toEqual({ master: "a.png", fit: "extend" });
  });

  // @req REQ-166
  it("cover-fits a scene, and draws 9:16 only from an outpainted master", () => {
    const scene = { collection: "traversees" as const, master: "s.png" };
    expect(fitPlan(scene, "4:5")).toEqual({ master: "s.png", fit: "cover" });
    expect(fitPlan(scene, "1:1")).toEqual({ master: "s.png", fit: "cover" });
    expect(fitPlan(scene, "9:16")).toBeNull();
    expect(
      fitPlan(
        {
          collection: "figures-et-moments",
          master: "s.png",
          master9x16: "s-9x16.png",
        },
        "9:16"
      )
    ).toEqual({ master: "s-9x16.png", fit: "cover" });
  });

  // One stray dark pixel in a corner must not tint the whole extension.
  // @req REQ-166
  it("takes the paper colour as the per-channel median of the corner samples", () => {
    expect(
      medianColour([
        [240, 232, 214],
        [242, 230, 216],
        [10, 10, 10],
        [241, 231, 215],
        [239, 233, 213],
      ])
    ).toEqual([240, 231, 214]);
  });
});

describe("where the approved masters are read from", () => {
  // @req REQ-166
  it("prefers the flag, then the workshop variable, then the checkout's output folder", () => {
    expect(
      resolveMastersDir(["--masters", "/elsewhere/masters"], {}, "/repo")
    ).toBe(path.resolve("/elsewhere/masters"));
    expect(
      resolveMastersDir(
        [],
        { ETHNIAFRICA_SOCIAL_PROJECTS: "/workshop" },
        "/repo"
      )
    ).toBe(path.join(path.resolve("/workshop"), "decouvertes-images"));
    expect(resolveMastersDir([], {}, "/repo")).toBe(
      path.join("/repo", "output", "social", "decouvertes-images")
    );
  });
});

describe("the derived files", () => {
  let workDir: string;
  let mastersDir: string;
  let publicDir: string;
  const paper = { r: 244, g: 236, b: 220 };

  beforeAll(async () => {
    workDir = mkdtempSync(path.join(tmpdir(), "generated-derivation-"));
    mastersDir = path.join(workDir, "masters");
    publicDir = path.join(workDir, "public");
    mkdirSync(path.join(mastersDir, "autonymes"), { recursive: true });
    mkdirSync(path.join(mastersDir, "traversees"), { recursive: true });
    const circle = Buffer.from(
      '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400"><circle cx="200" cy="200" r="180" fill="#6a3b2a"/></svg>'
    );
    await sharp({
      create: { width: 400, height: 400, channels: 3, background: paper },
    })
      .composite([{ input: circle }])
      .png()
      .toFile(path.join(mastersDir, "autonymes", "portrait.png"));
    await sharp({
      create: { width: 464, height: 576, channels: 3, background: "#3b6a8a" },
    })
      .png()
      .toFile(path.join(mastersDir, "traversees", "scene.png"));
    await sharp({
      create: { width: 540, height: 960, channels: 3, background: "#8a6a3b" },
    })
      .png()
      .toFile(path.join(mastersDir, "traversees", "scene-9x16.png"));
  });

  afterAll(() => {
    rmSync(workDir, { recursive: true, force: true });
  });

  function publicationDeclaring(
    downloads: DiscoveryPublication["downloads"]
  ): DiscoveryPublication {
    return {
      id: "image:fixture",
      kind: "image",
      status: "published",
      slug: { fr: "fixture", en: "fixture" },
      title: { fr: "Fixture", en: "Fixture" },
      description: { fr: "Fixture", en: "Fixture" },
      downloads,
    };
  }

  // @req REQ-166
  it("writes all three formats for an autonym, sized, tagged and extended with its paper", async () => {
    const derived = await deriveGeneratedImage(
      {
        slug: "portrait",
        collection: "autonymes",
        master: "autonymes/portrait.png",
      },
      { mastersDir, publicDir, repositoryRoot }
    );
    expect(Object.keys(derived).sort()).toEqual(["1:1", "4:5", "9:16"]);
    expect(
      await checkDeclaredDownloads([publicationDeclaring(derived)], publicDir)
    ).toEqual([]);

    // The band added above the square is paper, not a stretched or cropped portrait.
    const story = path.join(publicDir, derived["9:16"]);
    const { data } = await sharp(story)
      .extract({ left: 540, top: 20, width: 1, height: 1 })
      .raw()
      .toBuffer({ resolveWithObject: true });
    for (const [channel, expected] of [paper.r, paper.g, paper.b].entries()) {
      expect(Math.abs(data[channel] - expected)).toBeLessThanOrEqual(3);
    }
  });

  // @req REQ-166
  it("writes no 9:16 file for a scene that has no outpainted master", async () => {
    const derived = await deriveGeneratedImage(
      {
        slug: "scene",
        collection: "traversees",
        master: "traversees/scene.png",
      },
      { mastersDir, publicDir, repositoryRoot }
    );
    expect(Object.keys(derived).sort()).toEqual(["1:1", "4:5"]);
    expect(
      existsSync(
        path.join(publicDir, "images/discoveries/generated/scene/9x16.jpg")
      )
    ).toBe(false);
    expect(
      await checkDeclaredDownloads([publicationDeclaring(derived)], publicDir)
    ).toEqual([]);
  });

  // @req REQ-166
  it("draws a scene's 9:16 from its outpainted master when one exists", async () => {
    const derived = await deriveGeneratedImage(
      {
        slug: "scene-outpainted",
        collection: "traversees",
        master: "traversees/scene.png",
        master9x16: "traversees/scene-9x16.png",
      },
      { mastersDir, publicDir, repositoryRoot }
    );
    expect(Object.keys(derived).sort()).toEqual(["1:1", "4:5", "9:16"]);
    const { width, height } = await sharp(
      path.join(publicDir, derived["9:16"])
    ).metadata();
    expect([width, height]).toEqual([
      FRAMES["9:16"].width,
      FRAMES["9:16"].height,
    ]);
    expect(
      await checkDeclaredDownloads([publicationDeclaring(derived)], publicDir)
    ).toEqual([]);
  });

  // The burned mark is the disclosure that survives the caption being left
  // behind; a derivation that silently skipped it would still pass the checks
  // above.
  // @req REQ-166
  it("burns the mark into the pixels where the placement says", async () => {
    const derived = await deriveGeneratedImage(
      {
        slug: "marked",
        collection: "traversees",
        master: "traversees/scene.png",
      },
      { mastersDir, publicDir, repositoryRoot }
    );
    const file = path.join(publicDir, derived["4:5"]);
    expect(
      await channelSpread(file, {
        left: 84,
        top: 1350 - 84 - 32,
        width: 180,
        height: 32,
      })
    ).toBeGreaterThan(10);
    expect(
      await channelSpread(file, { left: 700, top: 100, width: 180, height: 32 })
    ).toBeLessThan(3);
  });

  // A scene is rarely one tone: the ink must be chosen from the ground under
  // the mark, or a pale corner of a dark picture gets pale ink.
  // @req REQ-166
  it("inks the mark for the ground beneath it, not for the frame's average", async () => {
    const lightBand = Buffer.from(
      '<svg xmlns="http://www.w3.org/2000/svg" width="464" height="576"><rect y="460" width="464" height="116" fill="#f4ecdc"/></svg>'
    );
    await sharp({
      create: { width: 464, height: 576, channels: 3, background: "#141414" },
    })
      .composite([{ input: lightBand }])
      .png()
      .toFile(path.join(mastersDir, "traversees", "dark-with-light-foot.png"));
    const derived = await deriveGeneratedImage(
      {
        slug: "dark-with-light-foot",
        collection: "traversees",
        master: "traversees/dark-with-light-foot.png",
      },
      { mastersDir, publicDir, repositoryRoot }
    );
    const { data } = await sharp(path.join(publicDir, derived["4:5"]))
      .extract({ left: 84, top: 1350 - 84 - 32, width: 180, height: 32 })
      .removeAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    expect(Math.min(...data)).toBeLessThan(90);
  });
});

async function channelSpread(
  file: string,
  region: { left: number; top: number; width: number; height: number }
): Promise<number> {
  // `stats()` reads the input, not the extracted output, so the region is
  // materialised before it is measured.
  const extracted = await sharp(file).extract(region).png().toBuffer();
  const { channels } = await sharp(extracted).stats();
  return Math.max(...channels.slice(0, 3).map((channel) => channel.stdev));
}

describe("the shipped manifest", () => {
  // @req REQ-164
  it("names twelve distinct images, each with a master and a known collection", () => {
    expect(GENERATED_IMAGE_MANIFEST).toHaveLength(12);
    expect(
      new Set(GENERATED_IMAGE_MANIFEST.map((entry) => entry.slug)).size
    ).toBe(12);
    for (const entry of GENERATED_IMAGE_MANIFEST) {
      expect(entry.master.startsWith(`${entry.collection}/`), entry.slug).toBe(
        true
      );
      expect(entry.slug).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    }
  });
});
