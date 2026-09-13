import { describe, expect, it } from "vitest";

import {
  HOME_HERO_IMAGES,
  drawHomeHeroVisual,
  drawHomeHeroVisualSide,
} from "@/lib/home/homeHeroVisuals";

function sequence(...values: number[]): () => number {
  let index = 0;
  return () => values[index++] ?? values.at(-1) ?? 0;
}

describe("drawHomeHeroVisual", () => {
  // Three kinds, no rule between them: the globe used to own half the draw
  // and the images shared the other half. An anecdote is now a third outcome
  // of the same roll, so no kind is the default a visitor mostly sees.
  // @req REQ-115
  it("gives the globe, an image and an anecdote one third of the draw each", () => {
    expect(drawHomeHeroVisual(() => 0)).toEqual({ kind: "globe" });
    expect(drawHomeHeroVisual(() => 1 / 3 - Number.EPSILON)).toEqual({
      kind: "globe",
    });
    expect(drawHomeHeroVisual(sequence(1 / 3, 0))).toEqual({
      kind: "image",
      image: HOME_HERO_IMAGES[0],
    });
    expect(drawHomeHeroVisual(() => 2 / 3 - Number.EPSILON).kind).toBe("image");
    expect(drawHomeHeroVisual(() => 2 / 3)).toEqual({ kind: "anecdote" });
    expect(drawHomeHeroVisual(() => 0.999999)).toEqual({ kind: "anecdote" });
  });

  // @req REQ-115
  it("can reach every curated image in the project stock", () => {
    const drawnIds = HOME_HERO_IMAGES.map((_, index) => {
      const imageRoll = (index + 0.25) / HOME_HERO_IMAGES.length;
      const visual = drawHomeHeroVisual(sequence(0.5, imageRoll));
      return visual.kind === "image" ? visual.image.id : null;
    });

    expect(drawnIds).toEqual(HOME_HERO_IMAGES.map((image) => image.id));
  });

  // @req REQ-115
  it("keeps every image accessible and visibly credited", () => {
    expect(HOME_HERO_IMAGES.length).toBeGreaterThan(1);

    for (const image of HOME_HERO_IMAGES) {
      expect(image.src).toMatch(/^\/images\//);
      expect(image.alt.trim()).not.toBe("");
      expect(image.credit.trim()).not.toBe("");
    }
  });
});

describe("drawHomeHeroVisualSide", () => {
  // @req REQ-115
  it("puts the visual on either side of the question with an even toss", () => {
    expect(drawHomeHeroVisualSide(() => 0)).toBe("start");
    expect(drawHomeHeroVisualSide(() => 0.5 - Number.EPSILON)).toBe("start");
    expect(drawHomeHeroVisualSide(() => 0.5)).toBe("end");
    expect(drawHomeHeroVisualSide(() => 0.999999)).toBe("end");
  });
});
