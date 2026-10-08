import { describe, expect, it } from "vitest";

import { HOME_HERO_IMAGES } from "@/lib/home/homeHeroVisuals";

describe("HOME_HERO_IMAGES", () => {
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
