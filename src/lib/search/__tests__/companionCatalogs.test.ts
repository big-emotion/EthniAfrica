import { describe, expect, it } from "vitest";

import { eligiblePublications } from "@/lib/discoveries/catalog";
import type { DidYouKnowFact } from "@/lib/home/didYouKnowFacts";
import type { DidYouKnowIllustration } from "@/lib/home/didYouKnowIllustrations";
import type { Proverb } from "@/lib/proverbs/proverbs";

import {
  anecdotesForTargets,
  eligibleSearchShorts,
  formatProductionNameQuestion,
  proverbsForTargets,
  quizForTargets,
  searchShortPosterAlt,
  searchShortDiscoveryPublication,
  shortsForTargets,
  shortsForWord,
  type SearchShort,
} from "../companionCatalogs";
import type { CompanionMatch, CompanionSubject } from "../companionRelations";

const exactPeople: CompanionMatch[] = [
  { relation: "exact", entityType: "people", entityId: "PPL_TEST" },
];

const peopleSubject: CompanionSubject = {
  entityType: "people",
  entityId: "PPL_TEST",
};

const picture: DidYouKnowIllustration = {
  kind: "picture",
  src: "/images/test.jpg",
  alt: "Test picture",
  credit: "Example, public domain",
  filePage: "https://commons.wikimedia.org/wiki/File:Test.jpg",
};

function fact(
  id: string,
  overrides: Partial<DidYouKnowFact> = {}
): DidYouKnowFact {
  return {
    id,
    headline: `Headline ${id}`,
    body: [`Body ${id}`],
    entities: [{ kind: "people", id: "PPL_TEST", label: "Test" }],
    tier: "referenced",
    sources: [
      {
        title: "Source",
        url: "https://example.org/source",
        tier: "referenced",
      },
    ],
    ...overrides,
  };
}

function proverb(id: string, overrides: Partial<Proverb> = {}): Proverb {
  return {
    id,
    text: `Proverb ${id}`,
    meaning: "Meaning",
    origin: { status: "attested", note: "" },
    entities: [{ kind: "people", id: "PPL_TEST", label: "Test" }],
    sources: [
      {
        title: "Source",
        url: "https://example.org/source",
        tier: "referenced",
      },
    ],
    ...overrides,
  };
}

function short(id: string, overrides: Partial<SearchShort> = {}): SearchShort {
  return {
    id,
    status: "published",
    slug: { fr: `${id}-fr` },
    publishedAt: "2026-09-01T00:00:00.000Z",
    name: { fr: `Nom ${id}` },
    description: { fr: `Description ${id}` },
    durationSeconds: 38,
    poster: {
      src: `/images/shorts/${id}.jpg`,
      width: 1080,
      height: 1920,
    },
    watchUrl: "https://youtube.com/shorts/example",
    source: {
      title: "Source",
      url: "https://example.org/source",
      tier: "referenced",
    },
    subjects: [
      {
        kind: "people",
        id: "PPL_TEST",
        label: { fr: "Test" },
      },
    ],
    ...overrides,
  };
}

describe("search companion catalogs", () => {
  // @req REQ-180
  it("uses the canonical name question for every production", () => {
    expect(formatProductionNameQuestion("Nigeria", "fr")).toBe(
      "D’où vient le nom « Nigeria » ?"
    );
    expect(searchShortPosterAlt(short("nigeria"), "fr")).toBe(
      "Couverture : D’où vient le nom « Nom nigeria » ?"
    );
  });

  // @req REQ-180
  it("keeps sourced unverified anecdotes and excludes legacy bare-tier facts", () => {
    const sourced = fact("sourced", {
      tier: "unverified",
      sources: [{ title: "Community note", tier: "unverified" }],
    });
    const selection = anecdotesForTargets(exactPeople, {
      facts: [sourced, fact("bare", { sources: undefined })],
      illustrationFor: () => picture,
    });

    expect(selection.count).toBe(1);
    expect(selection.items[0]?.item.fact.id).toBe("sourced");
    expect(selection.items[0]?.item.fact.sources?.[0]?.tier).toBe("unverified");
  });

  // @req REQ-180
  it("admits only attested proverbs and matches their original language", () => {
    const languageTargets: CompanionMatch[] = [
      { relation: "exact", entityType: "language", entityId: "twi" },
    ];
    const selection = proverbsForTargets(languageTargets, {
      proverbs: [
        proverb("attested", {
          entities: [],
          original: { text: "Asɛm", lang: "twi", language: "Twi" },
        }),
        proverb("estimated", {
          origin: { status: "estimated", note: "Uncertain" },
          original: { text: "Asɛm", lang: "twi", language: "Twi" },
        }),
      ],
    });

    expect(selection.items.map(({ item }) => item.proverb.id)).toEqual([
      "attested",
    ]);
    expect(selection.items[0]?.match).toEqual(languageTargets[0]);
  });

  // @req REQ-180
  it("keeps an attested proverb cited by an offline referenced work", () => {
    const selection = proverbsForTargets(exactPeople, {
      proverbs: [
        proverb("offline", {
          sources: [{ title: "Printed monograph", tier: "referenced" }],
        }),
      ],
    });

    expect(selection.items.map(({ item }) => item.proverb.id)).toEqual([
      "offline",
    ]);
  });

  // Standing alone decides nothing about whether a sourced, attested proverb is
  // worth suggesting: it is shown with its label, as the anecdotes beside it are
  // (DEC-055, audit finding T03). What still counts is that the citation can be
  // read, and that the origin is attested.
  // @req REQ-180
  it("keeps an attested proverb whose only citation is unverified but readable", () => {
    const selection = proverbsForTargets(exactPeople, {
      proverbs: [
        proverb("community", {
          sources: [{ title: "Recueil communautaire", tier: "unverified" }],
        }),
      ],
    });

    expect(selection.items.map(({ item }) => item.proverb.id)).toEqual([
      "community",
    ]);
  });

  // @req REQ-180
  it("still refuses a proverb whose citation cannot be read", () => {
    const selection = proverbsForTargets(exactPeople, {
      proverbs: [
        proverb("untitled", {
          sources: [{ title: "  ", tier: "referenced" }],
        }),
        proverb("no-source", { sources: [] }),
      ],
    });

    expect(selection.items).toEqual([]);
  });

  // @req REQ-180
  it("rejects incomplete shorts, reports pre-limit count and keeps exact order", () => {
    const selection = shortsForTargets(
      exactPeople,
      [
        short("first"),
        short("second"),
        short("no-name", { name: { fr: "" } }),
        short("unverified", {
          source: {
            title: "Claim",
            url: "https://example.org/claim",
            tier: "unverified",
          },
        }),
      ],
      { limit: 1 }
    );

    expect(selection.count).toBe(2);
    expect(selection.items.map(({ item }) => item.id)).toEqual(["first"]);
    expect(selection.items[0]?.match.relation).toBe("exact");
  });

  // @req REQ-180
  it.each([
    ["poster", { poster: { src: "", width: 1080, height: 1920 } }],
    ["subjects", { subjects: [] }],
    ["watch URL", { watchUrl: "http://example.org/video" }],
  ] as const)(
    "rejects a video missing its %s contract",
    (_field, overrides) => {
      const records = [short("incomplete", overrides as Partial<SearchShort>)];
      expect(
        eligiblePublications([searchShortDiscoveryPublication(records[0])])
      ).toEqual([]);
    }
  );

  // @req REQ-180
  it.each([
    ["invalid first", [short("same", { watchUrl: "" }), short("same")]],
    ["valid first", [short("same"), short("same", { watchUrl: "" })]],
  ] as const)(
    "never resurrects an invalid duplicate: %s",
    (_label, records) => {
      expect(
        eligibleSearchShorts(records).map((record) => record.watchUrl)
      ).toEqual(["https://youtube.com/shorts/example"]);
    }
  );

  // Until shorts are mapped to results, a query that matches no short shows
  // none: offering "the most recent one" put the same unrelated video under
  // every name.
  // @req REQ-180
  it("offers no short to a target nothing is mapped to", () => {
    const selection = shortsForTargets(
      [],
      [
        short("older", { publishedAt: "2026-08-01T00:00:00.000Z" }),
        short("newer", { publishedAt: "2026-09-02T00:00:00.000Z" }),
      ]
    );

    expect(selection).toEqual({ count: 0, items: [] });
  });

  // @req REQ-180
  it("chooses one eligible quiz deterministically", () => {
    const selection = quizForTargets(exactPeople, [
      {
        id: "hard",
        subjects: [peopleSubject],
        eligible: true,
        difficulty: 3,
        templateId: "T2",
      },
      {
        id: "easy-b",
        subjects: [peopleSubject],
        eligible: true,
        difficulty: 1,
        templateId: "T1",
      },
      {
        id: "easy-a",
        subjects: [peopleSubject],
        eligible: false,
        difficulty: 1,
        templateId: "T1",
      },
    ]);

    expect(selection.count).toBe(2);
    expect(selection.items.map(({ item }) => item.id)).toEqual(["easy-b"]);
  });
});

describe("shortsForWord", () => {
  const zombie = short("zombie", {
    subjects: [],
    word: { queries: ["zombie", "mami wata"] },
  });

  // A word is not an entity: the query itself, folded the way the search folds
  // every name, is what finds the piece.
  // @req REQ-180
  it.each(["zombie", "  Zombie ", "ZOMBIE?", "mami-wata", "Mami  Wata"])(
    "finds the piece for %j",
    (query) => {
      const selection = shortsForWord(query, [zombie]);

      expect(selection.count).toBe(1);
      expect(selection.items[0].item.id).toBe("zombie");
      expect(selection.items[0].match.relation).toBe("word");
    }
  );

  // @req REQ-180
  it("returns the query as the reader's word folded, so the page can name it", () => {
    const [{ match }] = shortsForWord("Mami-Wata", [zombie]).items;

    expect(match).toEqual({ relation: "word", word: "mami wata" });
  });

  // @req REQ-180
  it.each(["", "   ", "zomb", "zombies", "kongo"])(
    "finds nothing for %j: a word matches whole, never by prefix",
    (query) => {
      expect(shortsForWord(query, [zombie]).items).toEqual([]);
    }
  );

  // @req REQ-180
  it("drops a piece that is not eligible, like every other short", () => {
    const incomplete = short("zombie", {
      subjects: [],
      word: { queries: ["zombie"] },
      poster: { src: "", width: 0, height: 0 },
    });

    expect(shortsForWord("zombie", [incomplete]).items).toEqual([]);
  });

  // @req REQ-180
  it("does not find an entity piece by its word", () => {
    expect(shortsForWord("test", [short("entity-only")]).items).toEqual([]);
  });
});
