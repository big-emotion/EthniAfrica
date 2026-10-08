import { describe, expect, it } from "vitest";

import { LOCALES } from "@/lib/locale";
import { ACCESS_MODE_LABELS } from "@/lib/hubs/moduleRegistry";
import {
  COMPARE_ENTITY_SEGMENTS,
  NOMMER_CHAPTER_KEYS,
  PAGE_TYPES,
  STATIC_PAGE_SLUGS,
  getNommerChapterRoute,
  getPeopleLinksRoute,
} from "@/lib/routing";
import {
  classificationLabels,
  getTranslation,
  translations,
} from "@/lib/translations";

/** What only the composed façade can answer. */
describe("the UI dictionary (REQ-145)", () => {
  // @req REQ-145
  it("publishes a dictionary for every locale", () => {
    for (const locale of LOCALES) {
      expect(getTranslation(locale)).toBeDefined();
      expect(getTranslation(locale)).toBe(translations[locale]);
    }
  });

  // @req REQ-023
  it("keeps the classification labels on the French dictionary", () => {
    expect(classificationLabels).toBe(translations.fr.classification);
  });
});

describe("the trail's words follow the URLs (REQ-141)", () => {
  // @req REQ-145
  it("keeps the hub titles on the canonical access-mode map", () => {
    expect(translations.fr.hubs.atlas.title).toBe(ACCESS_MODE_LABELS.atlas);
  });

  // @req REQ-141
  it("names every page type", () => {
    for (const page of PAGE_TYPES) {
      expect(translations.fr.trail.pages[page], page).toBeTruthy();
    }
  });

  // `deriveTrail` looks a segment up by the word in the URL, so the map has
  // to be keyed by the URLs' own tails or the trail truncates.
  // @req REQ-141
  it("keys the segment map by the tails of the URLs", () => {
    const segments = translations.fr.trail.segments;
    const linksTail = getPeopleLinksRoute("fr", "PPL_X").split("/").pop();
    expect(segments[linksTail], linksTail).toBeTruthy();

    for (const chapter of NOMMER_CHAPTER_KEYS) {
      const tail = getNommerChapterRoute("fr", chapter).split("/").pop();
      expect(segments[tail], tail).toBeTruthy();
    }
    for (const slug of Object.values(STATIC_PAGE_SLUGS.fr)) {
      expect(segments[slug], slug).toBeTruthy();
    }
    for (const segment of Object.values(COMPARE_ENTITY_SEGMENTS.fr)) {
      expect(segments[segment], segment).toBeTruthy();
    }
    expect(translations.fr.trail.segments.liens).toBe("Liens");
  });
});
