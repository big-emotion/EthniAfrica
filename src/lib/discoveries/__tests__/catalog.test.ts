import { describe, expect, it } from "vitest";

import {
  discoveryPath,
  eligiblePublications,
  orderedDeck,
  publicationsForSubjects,
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

  // A proverb may stand while its photo is still being sourced, but a photo it
  // does carry is held to the same clearance as every other kind's.
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

  // @req REQ-157
  it("refuses a proverb whose photo has no cleared licence or no file page", () => {
    const records = [
      item("cleared", { kind: "proverb", image: photo }),
      item("unknown-licence", {
        kind: "proverb",
        image: { ...photo, licence: "unknown" },
      }),
      item("no-file-page", {
        kind: "proverb",
        image: { ...photo, filePage: undefined },
      }),
    ];
    expect(eligiblePublications(records).map((entry) => entry.id)).toEqual([
      "cleared",
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

  describe("subject scope", () => {
    const records = [
      item("country", {
        detail: {
          body: { fr: ["Texte"], en: ["Text"] },
          entities: [
            {
              kind: "country",
              id: "NGA",
              label: { fr: "Nigeria", en: "Nigeria" },
            },
          ],
          sources: [],
        },
      }),
      item("family", {
        detail: {
          body: { fr: ["Texte"], en: ["Text"] },
          entities: [
            {
              kind: "family",
              id: "FLG_MANDE",
              label: { fr: "Mandé", en: "Mande" },
            },
            {
              kind: "people",
              id: "PPL_BAMBARA",
              label: { fr: "Bambara", en: "Bambara" },
            },
          ],
          sources: [],
        },
      }),
      item("people", {
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
      }),
      item("language", {
        detail: {
          body: { fr: ["Texte"], en: ["Text"] },
          entities: [
            {
              kind: "language",
              id: "lin",
              label: { fr: "Lingala", en: "Lingala" },
            },
          ],
          sources: [],
        },
      }),
      item("patronyme", {
        detail: {
          body: { fr: ["Texte"], en: ["Text"] },
          entities: [
            {
              kind: "patronyme",
              id: "PAT_TRAORE",
              label: { fr: "Traoré", en: "Traore" },
            },
          ],
          sources: [],
        },
      }),
      item("draft-country", {
        status: "draft",
        detail: {
          body: { fr: ["Texte"], en: ["Text"] },
          entities: [
            {
              kind: "country",
              id: "NGA",
              label: { fr: "Nigeria", en: "Nigeria" },
            },
          ],
          sources: [],
        },
      }),
    ];

    // @req REQ-180
    it("keeps eligible catalog order while matching exact typed subjects", () => {
      expect(
        publicationsForSubjects(records, [
          { kind: "people", id: "PPL_HAUSA" },
          { kind: "country", id: "NGA" },
          { kind: "people", id: "PPL_BAMBARA" },
          { kind: "language", id: "lin" },
          { kind: "patronyme", id: "PAT_TRAORE" },
        ]).map((entry) => entry.id)
      ).toEqual(["country", "family", "people", "language", "patronyme"]);

      expect(
        publicationsForSubjects(records, [
          { kind: "family", id: "PPL_BAMBARA" },
        ])
      ).toEqual([]);
    });

    // @req REQ-180
    it("leaves the unscoped catalog, current item and deck behavior unchanged", () => {
      const eligible = eligiblePublications(records);
      const unscoped = publicationsForSubjects(records, []);

      expect(publicationsForSubjects(records)).toEqual(eligible);
      expect(unscoped).toEqual(eligible);
      expect(resolvePublication(unscoped, "fr", "country-fr")?.id).toBe(
        "country"
      );
      expect(orderedDeck(unscoped, "family", () => 0)).toEqual([
        "family",
        "people",
        "language",
        "patronyme",
        "country",
      ]);
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

const frames = [
  {
    src: "/images/discoveries/carousel/exemple/1.jpg",
    width: 1080,
    height: 1350,
    alt: { fr: "Première carte", en: "First card" },
  },
  {
    src: "/images/discoveries/carousel/exemple/2.jpg",
    width: 1080,
    height: 1350,
    alt: { fr: "Deuxième carte", en: "Second card" },
  },
];

// The cover carries the credit and the licence, as it does for an anecdote;
// what a carousel does not have is a file page, because the frames are the
// project's own render and their original is this publication.
const cover = {
  src: "/images/discoveries/carousel/exemple/1.jpg",
  credit: "EthniAfrica, CC BY-SA 4.0",
  licence: "cc-by-sa" as const,
};

describe("Découvertes carousels", () => {
  // @req REQ-157
  it("publishes a carousel on its own frames, without the file page an outside photo owes", () => {
    const entry = item("carousel:exemple", {
      kind: "carousel",
      slug: { fr: "serie-exemple-fr", en: "serie-exemple-en" },
      image: cover,
      carousel: { frames },
    });

    expect(eligiblePublications([entry]).map((one) => one.id)).toEqual([
      "carousel:exemple",
    ]);
  });

  // A single frame renders a track with nowhere to go, and publishing it
  // would promise the reader a series the publication does not have.
  // @req REQ-157
  it("withholds a carousel of one frame", () => {
    const entry = item("carousel:seule", {
      kind: "carousel",
      slug: { fr: "serie-seule-fr", en: "serie-seule-en" },
      image: cover,
      carousel: { frames: [frames[0]] },
    });

    expect(eligiblePublications([entry])).toEqual([]);
  });

  // @req REQ-157
  it("withholds a carousel whose frames are not described in both languages", () => {
    const entry = item("carousel:muet", {
      kind: "carousel",
      slug: { fr: "serie-muet-fr", en: "serie-muet-en" },
      image: cover,
      carousel: {
        frames: [frames[0], { ...frames[1], alt: { fr: "Deuxième", en: "" } }],
      },
    });

    expect(eligiblePublications([entry])).toEqual([]);
  });

  // @req REQ-157
  it("withholds a carousel that declares the kind and carries no frames at all", () => {
    const entry = item("carousel:vide", {
      kind: "carousel",
      slug: { fr: "serie-vide-fr", en: "serie-vide-en" },
      image: cover,
    });

    expect(eligiblePublications([entry])).toEqual([]);
  });
});
