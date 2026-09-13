import { describe, expect, it } from "vitest";

import {
  discoveryPath,
  eligiblePublications,
  orderedDeck,
  resolvePublication,
  type DiscoveryPublication,
} from "../catalog";

const photo = {
  src: "/images/anecdotes/burkina-faso.jpg",
  filePage: "https://commons.wikimedia.org/wiki/File:Example.jpg",
  credit: "Example, public domain",
  licence: "public-domain" as const,
};

function item(
  id: string,
  overrides: Partial<DiscoveryPublication> = {}
): DiscoveryPublication {
  return {
    id,
    kind: "anecdote",
    status: "published",
    slug: { fr: `${id}-fr`, en: `${id}-en` },
    title: { fr: `Titre ${id}`, en: `Title ${id}` },
    description: { fr: `Résumé ${id}`, en: `Summary ${id}` },
    source: {
      title: "Source",
      url: "https://example.org/source",
      tier: "referenced",
    },
    image: photo,
    ...overrides,
  };
}

describe("Découvertes publication contracts", () => {
  // @req REQ-158
  it("keeps immutable identities and localized exact paths separate", () => {
    const publication = item("anecdote:burkina-faso", {
      slug: {
        fr: "burkina-faso-trois-langues",
        en: "burkina-faso-three-languages",
      },
    });
    expect(discoveryPath("fr", publication)).toBe(
      "/fr/decouvertes/burkina-faso-trois-langues"
    );
    expect(discoveryPath("en", publication)).toBe(
      "/en/discoveries/burkina-faso-three-languages"
    );
  });

  // @req REQ-157
  it("excludes draft, unpaired, unsourced and uncleared items independently", () => {
    const ready = item("ready");
    const records = [
      ready,
      item("draft", { status: "draft" }),
      item("unpaired", { title: { fr: "Titre", en: "" } }),
      item("unsourced", { source: undefined }),
      item("no-original", {
        image: { ...photo, filePage: "" },
      }),
      item("no-rights", {
        image: { ...photo, licence: "unknown" },
      }),
    ];
    expect(eligiblePublications(records).map((entry) => entry.id)).toEqual([
      "ready",
    ]);
  });

  // A proverb is words, not a scene: a photo beside it would be decoration
  // chosen by us. The photo requirement stays whole for every other kind.
  // @req REQ-157
  it("lets a proverb stand without a photo and still refuses an anecdote without one", () => {
    const records = [
      item("proverb", { kind: "proverb", image: undefined }),
      item("anecdote-no-photo", { image: undefined }),
    ];
    expect(eligiblePublications(records).map((entry) => entry.id)).toEqual([
      "proverb",
    ]);
  });

  // @req REQ-158
  it("resolves only the requested locale and never substitutes an unknown item", () => {
    const records = [item("one"), item("two")];
    expect(resolvePublication(records, "en", "one-en")?.id).toBe("one");
    expect(resolvePublication(records, "fr", "one-en")).toBeNull();
    expect(resolvePublication(records, "fr", "missing")).toBeNull();
  });

  // @req REQ-156
  it("draws every eligible ID once and pins a direct-entry item first", () => {
    const records = [item("a"), item("b"), item("c")];
    const deck = orderedDeck(records, "b", () => 0);
    expect(deck[0]).toBe("b");
    expect(new Set(deck).size).toBe(3);
    expect(deck).toHaveLength(3);
  });

  // DEC-053: a generated image is declared fiction. Its subject rests on the
  // linked fiche's own source; its generation record is provenance, never a
  // source, so it cannot vouch for the subject.
  describe("generated images", () => {
    const generated: DiscoveryPublication = item("image:hausa-autonym", {
      kind: "image",
      collection: "autonymes",
      slug: { fr: "hausa-autonyme", en: "hausa-autonym" },
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
        src: "/images/discoveries/hausa-autonym.webp",
        credit: "EthniAfrica, CC BY-SA 4.0",
        licence: "cc-by-sa",
        alt: { fr: "Illustration stylisée", en: "Stylised illustration" },
      },
      caption: { fr: "Légende", en: "Caption" },
      generation: {
        tool: "Higgsfield",
        model: "nano_banana_2",
        jobId: "job-123",
        generatedOn: "2026-09-12",
        sourceKind: "ai_generated",
      },
    });

    function eligibleIds(records: DiscoveryPublication[]): string[] {
      return eligiblePublications(records).map((entry) => entry.id);
    }

    // @req REQ-164
    it("admits a complete generated image and resolves its localized permalink", () => {
      const records = [generated];
      expect(eligibleIds(records)).toEqual(["image:hausa-autonym"]);
      const resolved = resolvePublication(records, "en", "hausa-autonym");
      expect(resolved?.id).toBe("image:hausa-autonym");
      expect(discoveryPath("fr", resolved)).toBe(
        "/fr/decouvertes/hausa-autonyme"
      );
    });

    // @req REQ-164
    it("excludes a generated image missing its generation model and keeps the anecdotes", () => {
      const records = [
        item("anecdote"),
        { ...generated, generation: { ...generated.generation, model: "" } },
      ];
      expect(eligibleIds(records)).toEqual(["anecdote"]);
    });

    // @req REQ-164
    it("never lets the image's own provenance stand in for its subject source", () => {
      expect(eligibleIds([{ ...generated, source: undefined }])).toEqual([]);
    });

    // @req REQ-164
    it("admits a caption beyond the corpus only when it cites its own source", () => {
      const exceeding = { ...generated, captionExceedsCorpus: true };
      expect(eligibleIds([exceeding])).toEqual([]);
      expect(
        eligibleIds([
          {
            ...exceeding,
            captionSource: {
              title: "Caption source",
              url: "https://example.org/caption",
            },
          },
        ])
      ).toEqual(["image:hausa-autonym"]);
    });
  });

  // @req REQ-158
  it("rejects ambiguous or unsafe publication slugs before exposing a deck", () => {
    const entries = [
      item("safe"),
      item("duplicate", { slug: { fr: "safe-fr", en: "duplicate-en" } }),
      item("nested", { slug: { fr: "nested/path", en: "nested-en" } }),
      item("reserved", { slug: { fr: "..", en: "reserved-en" } }),
    ];
    expect(eligiblePublications(entries).map((entry) => entry.id)).toEqual([
      "safe",
    ]);
  });
});
