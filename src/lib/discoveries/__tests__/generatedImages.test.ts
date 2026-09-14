import { describe, expect, it } from "vitest";

import { eligiblePublications, type DiscoveryPublication } from "../catalog";
import { getDiscoveryPublications } from "../entries";
import {
  generatedDownloadPath,
  generatedImagePublications,
} from "../generatedImages";

const CAPTIONS_WITH_THEIR_OWN_SOURCE = ["image:kongo", "image:njinga"];

function withShippedFiles(
  publication: DiscoveryPublication
): DiscoveryPublication {
  const slug = publication.id.replace("image:", "");
  return {
    ...publication,
    image: {
      src: generatedDownloadPath(slug, "4:5"),
      credit: "EthniAfrica",
      alt: { fr: "Texte", en: "Text" },
      licence: "cc-by-sa",
    },
  };
}

describe("the generated images of Découvertes", () => {
  const publications = generatedImagePublications();

  // Their derived files are not committed yet: a card with no picture would
  // be a caption about an image nobody can see.
  // @req REQ-164
  it("keeps all twelve out of the feed and the gallery until their files ship", () => {
    expect(publications).toHaveLength(12);
    expect(eligiblePublications(publications)).toEqual([]);
    expect(
      getDiscoveryPublications().filter((entry) => entry.kind === "image")
    ).toHaveLength(12);
  });

  // Proves the sources recorded today are complete: shipping the files is
  // the only step left, and a caption beyond the corpus still needs its own.
  // @req REQ-164
  it("admits every image once its files ship, and no caption beyond the corpus without its source", () => {
    const shipped = publications.map(withShippedFiles);
    expect(eligiblePublications(shipped).map((entry) => entry.id)).toEqual(
      publications.map((entry) => entry.id)
    );
    const unsourcedCaptions = shipped.map((entry) => ({
      ...entry,
      captionSource: undefined,
    }));
    const admitted = eligiblePublications(unsourcedCaptions).map(
      (entry) => entry.id
    );
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
