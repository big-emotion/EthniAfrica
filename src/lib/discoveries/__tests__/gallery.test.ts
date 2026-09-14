import { describe, expect, it } from "vitest";

import { eligiblePublications, type DiscoveryPublication } from "../catalog";
import { galleryCollections } from "../gallery";

type Collection = NonNullable<DiscoveryPublication["collection"]>;

function generatedImage(
  id: string,
  collection: Collection,
  overrides: Partial<DiscoveryPublication> = {}
): DiscoveryPublication {
  return {
    id,
    kind: "image",
    status: "published",
    collection,
    slug: { fr: `${id}-fr`, en: `${id}-en` },
    title: { fr: `Titre ${id}`, en: `Title ${id}` },
    description: { fr: `Résumé ${id}`, en: `Summary ${id}` },
    source: {
      title: "Source",
      url: "https://example.org/source",
      tier: "referenced",
    },
    detail: {
      body: { fr: ["Texte"], en: ["Text"] },
      entities: [
        {
          kind: "people",
          id: "PPL_HAUSA",
          label: { fr: "Haoussa", en: "Hausa" },
        },
      ],
      sources: [],
    },
    image: {
      src: `/images/discoveries/${id}.webp`,
      credit: "EthniAfrica, CC BY-SA 4.0",
      licence: "cc-by-sa",
      alt: { fr: `Illustration ${id}`, en: `Illustration ${id}` },
    },
    caption: { fr: "Légende", en: "Caption" },
    generation: {
      tool: "Higgsfield",
      model: "nano_banana_2",
      jobId: `job-${id}`,
      generatedOn: "2026-09-12",
      sourceKind: "ai_generated",
    },
    ...overrides,
  };
}

const anecdote: DiscoveryPublication = {
  id: "anecdote-burkina",
  kind: "anecdote",
  status: "published",
  slug: { fr: "burkina-fr", en: "burkina-en" },
  title: { fr: "Burkina", en: "Burkina" },
  description: { fr: "Résumé", en: "Summary" },
  source: {
    title: "Source",
    url: "https://example.org/source",
    tier: "referenced",
  },
  image: {
    src: "/images/anecdotes/burkina-faso.jpg",
    filePage: "https://commons.wikimedia.org/wiki/File:Example.jpg",
    credit: "Example, public domain",
    licence: "public-domain",
  },
};

// Declared out of collection order, so grouping cannot pass by accident.
const fourEligible = [
  generatedImage("moment-one", "figures-et-moments"),
  generatedImage("autonym-one", "autonymes"),
  generatedImage("crossing-one", "traversees"),
  generatedImage("autonym-two", "autonymes"),
];
const withoutProvenance = generatedImage("no-provenance", "traversees", {
  generation: undefined,
});
const records = [...fourEligible, withoutProvenance, anecdote];

describe("the gallery reads the feed's own resolver (REQ-167)", () => {
  // @req REQ-167
  it("shows exactly the image publications the feed shows", () => {
    const feedImages = eligiblePublications(records)
      .filter((entry) => entry.kind === "image")
      .map((entry) => entry.id);
    const galleryImages = galleryCollections(records).flatMap((group) =>
      group.publications.map((entry) => entry.id)
    );

    expect(feedImages.sort()).toEqual(
      fourEligible.map((entry) => entry.id).sort()
    );
    expect(galleryImages.sort()).toEqual(feedImages);
  });

  // @req REQ-167
  it("groups by collection in a fixed order and leaves out empty collections", () => {
    const groups = galleryCollections([
      generatedImage("moment-one", "figures-et-moments"),
      generatedImage("autonym-one", "autonymes"),
      generatedImage("autonym-two", "autonymes"),
    ]);

    expect(
      groups.map((group) => [
        group.collection,
        group.publications.map((entry) => entry.id),
      ])
    ).toEqual([
      ["autonymes", ["autonym-one", "autonym-two"]],
      ["figures-et-moments", ["moment-one"]],
    ]);
  });

  // @req REQ-167
  it("lists nothing when no image publication is eligible", () => {
    expect(galleryCollections([anecdote, withoutProvenance])).toEqual([]);
  });
});
