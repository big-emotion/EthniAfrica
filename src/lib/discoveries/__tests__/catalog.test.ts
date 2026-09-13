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
