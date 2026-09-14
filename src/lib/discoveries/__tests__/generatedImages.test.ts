import { describe, expect, it } from "vitest";

import {
  downloadChoices,
  eligiblePublications,
  type DiscoveryPublication,
} from "../catalog";
import { getDiscoveryPublications } from "../entries";
import { galleryCollections } from "../gallery";
import { generatedImagePublications } from "../generatedImages";

const CAPTIONS_WITH_THEIR_OWN_SOURCE = ["image:kongo", "image:njinga"];

describe("the generated images of Découvertes", () => {
  const publications = generatedImagePublications();

  // @req REQ-164
  it("publishes all twelve in the feed, each with its picture and its three downloads", () => {
    expect(publications).toHaveLength(12);
    expect(eligiblePublications(getDiscoveryPublications())).toEqual(
      expect.arrayContaining(publications)
    );
    for (const entry of publications) {
      expect(entry.image?.src, entry.id).toBe(entry.downloads?.["4:5"]);
    }
    expect(publications.flatMap(downloadChoices)).toHaveLength(36);
  });

  // @req REQ-167
  it("shelves the twelve in the gallery, four per collection, in the fixed order", () => {
    expect(
      galleryCollections(getDiscoveryPublications()).map((group) => [
        group.collection,
        group.publications.map((entry) => entry.id),
      ])
    ).toEqual([
      [
        "autonymes",
        ["image:basotho", "image:amazigh", "image:ewe", "image:swahili"],
      ],
      [
        "traversees",
        ["image:kongo", "image:somali", "image:hausa", "image:swazi"],
      ],
      [
        "figures-et-moments",
        [
          "image:njinga",
          "image:mansa-musa",
          "image:grand-zimbabwe",
          "image:marrakech",
        ],
      ],
    ]);
  });

  // A caption stating what no linked fiche states must not reach a reader
  // without its own source, even with every other field in place.
  // @req REQ-164
  it("refuses a caption beyond the corpus once its own source is removed", () => {
    const unsourcedCaptions: DiscoveryPublication[] = publications.map(
      (entry) => ({ ...entry, captionSource: undefined })
    );
    const admitted = eligiblePublications(unsourcedCaptions).map(
      (entry) => entry.id
    );
    expect(admitted).toHaveLength(12 - CAPTIONS_WITH_THEIR_OWN_SOURCE.length);
    for (const id of CAPTIONS_WITH_THEIR_OWN_SOURCE) {
      expect(admitted).not.toContain(id);
    }
  });

  // @req REQ-164
  it("declares a caption beyond the corpus for Kongo and Njinga only", () => {
    expect(
      publications
        .filter((entry) => entry.captionExceedsCorpus)
        .map((entry) => entry.id)
    ).toEqual(CAPTIONS_WITH_THEIR_OWN_SOURCE);
  });

  // The subject rests on a source with authority; the detail sheet lists it
  // first, then the supporting ones, then the caption's own.
  // @req REQ-164
  it("cites the subject source first in the detail sheet, and the caption source last", () => {
    for (const entry of publications) {
      expect(["official", "referenced"], entry.id).toContain(
        entry.source?.tier
      );
      const cited = entry.detail.sources.map((source) => source.url);
      expect(cited[0], entry.id).toBe(entry.source.url);
      if (entry.captionSource) {
        expect(cited.at(-1), entry.id).toBe(entry.captionSource.url);
      }
      expect(new Set(cited).size, entry.id).toBe(cited.length);
    }
  });

  // @req REQ-164
  it("gives each one its localized address, text, generation record and one or two atlas entities", () => {
    for (const entry of publications) {
      expect(entry.slug.fr, entry.id).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
      expect(entry.slug.en, entry.id).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
      for (const text of [entry.title, entry.description, entry.caption]) {
        expect(text.fr.trim(), entry.id).not.toBe("");
        expect(text.en.trim(), entry.id).not.toBe("");
      }
      expect(entry.generation).toMatchObject({
        tool: "Higgsfield",
        model: "nano_banana_2",
        generatedOn: "2026-09-13",
        sourceKind: "ai_generated",
      });
      expect(entry.generation.jobId, entry.id).toMatch(/^[0-9a-f-]{36}$/);
      expect(entry.detail.entities.length).toBeGreaterThanOrEqual(1);
      expect(entry.detail.entities.length).toBeLessThanOrEqual(2);
      expect(entry.collection).toBeDefined();
    }
  });
});
