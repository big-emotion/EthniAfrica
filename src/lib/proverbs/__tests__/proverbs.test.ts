import { describe, expect, it } from "vitest";

import { violatesReaderRegister } from "@/lib/editorial/readerRegister";
import {
  PROVERBS,
  findProverb,
  proverbEntities,
  proverbsConcerning,
  type Proverb,
} from "@/lib/proverbs/proverbs";
import { afrikCorpusIds } from "@/test/afrikCorpusIds";

const proverb = (id: string, entities: Proverb["entities"] = []): Proverb => ({
  id,
  text: `Texte ${id}`,
  meaning: `Sens ${id}`,
  origin: { status: entities.length ? "attested" : "unestablished", note: "" },
  entities,
  sources: [
    {
      title: `Recueil ${id}`,
      url: `https://example.org/${id}`,
      tier: "referenced",
    },
  ],
});

describe("the proverb bank — what a chip may claim", () => {
  // A chip pointing at a fiche the corpus does not hold is a 404 the reader
  // finds before we do.
  // @req REQ-113
  it("names only corpus entities on its chips", () => {
    const corpus = afrikCorpusIds();
    const dangling: string[] = [];

    for (const entry of PROVERBS) {
      for (const entity of entry.entities) {
        expect(entity.label.trim(), `${entry.id} ${entity.id}`).not.toBe("");
        if (!corpus[entity.kind].has(entity.id)) {
          dangling.push(`${entry.id} → ${entity.kind} ${entity.id}`);
        }
      }
    }

    expect(dangling).toEqual([]);
  });

  // « Proverbe africain » with no people behind it is the flattening the atlas
  // exists to undo; a chip added to such a proverb would invent the people
  // instead. An unestablished origin therefore carries no chip at all.
  // @req REQ-113
  it("links no entity to a proverb whose origin is unestablished", () => {
    for (const entry of PROVERBS.filter(
      (candidate) => candidate.origin.status === "unestablished"
    )) {
      expect(entry.entities, entry.id).toEqual([]);
    }
  });

  // @req REQ-113
  it("links at least one entity to a proverb whose origin is attested or estimated", () => {
    for (const entry of PROVERBS.filter(
      (candidate) => candidate.origin.status !== "unestablished"
    )) {
      expect(entry.entities.length, entry.id).toBeGreaterThan(0);
    }
  });

  // "Attested" is the one status a reader takes at its word, so it has to be
  // earned by a source that carries authority. An attribution only aggregators
  // make stays "estimated" — published, and labelled for what it is.
  // @req REQ-113
  it("calls an origin attested only when an official or referenced source backs it", () => {
    for (const entry of PROVERBS.filter(
      (candidate) => candidate.origin.status === "attested"
    )) {
      expect(
        entry.sources.some((source) => source.tier !== "unverified"),
        entry.id
      ).toBe(true);
    }
  });

  // The reader is told why the atlas hesitates; a status with no explanation
  // is a verdict nobody can check.
  // @req REQ-113
  it("explains every origin that is not attested", () => {
    for (const entry of PROVERBS.filter(
      (candidate) => candidate.origin.status !== "attested"
    )) {
      expect(entry.origin.note.trim(), entry.id).not.toBe("");
    }
  });
});

describe("the proverb bank — provenance", () => {
  // @req REQ-113
  it("gives every proverb an id of its own that can sit in a URL", () => {
    const ids = PROVERBS.map((entry) => entry.id);

    expect(ids.length).toBeGreaterThan(0);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(id).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
  });

  // Wikipedia is not a source in this corpus: a primary source found through
  // it is cited by its own address.
  // @req REQ-113
  it("cites at least one source for every proverb, at an https address that is not Wikipedia", () => {
    for (const entry of PROVERBS) {
      expect(entry.sources.length, `${entry.id} cites nothing`).toBeGreaterThan(
        0
      );
      for (const source of entry.sources) {
        expect(source.title.trim(), entry.id).not.toBe("");
        if (source.url !== undefined) {
          expect(source.url.startsWith("https://"), source.url).toBe(true);
          expect(source.url, entry.id).not.toMatch(/wikipedia\.org/);
        }
      }
    }
  });

  // An original text with no language is a string of letters the page cannot
  // declare, so assistive technology reads it with French phonetics.
  // @req REQ-113
  it("records an original text only together with the ISO 639-3 code of its language", () => {
    for (const entry of PROVERBS) {
      if (!entry.original) continue;
      expect(entry.original.text.trim(), entry.id).not.toBe("");
      expect(entry.original.lang, entry.id).toMatch(/^[a-z]{3}$/);
      expect(entry.original.language.trim(), entry.id).not.toBe("");
    }
  });

  // Every string below is printed to the reader verbatim.
  // @req REQ-143
  it("keeps workshop vocabulary out of every string a reader sees", () => {
    const leaks: string[] = [];

    for (const entry of PROVERBS) {
      const printed = [
        entry.text,
        entry.meaning,
        entry.origin.note,
        ...entry.sources.flatMap((source) => [
          source.title,
          source.notes ?? "",
        ]),
      ];
      for (const text of printed) {
        if (violatesReaderRegister(text)) leaks.push(`${entry.id}: ${text}`);
      }
    }

    expect(leaks).toEqual([]);
  });
});

describe("proverbsConcerning — the filter the dossier page applies", () => {
  const bank = [
    proverb("a", [{ kind: "people", id: "PPL_YORUBA", label: "Yoruba" }]),
    proverb("b", [
      { kind: "country", id: "NGA", label: "Nigeria" },
      { kind: "people", id: "PPL_YORUBA", label: "Yoruba" },
    ]),
    proverb("c"),
  ];

  // @req REQ-113
  it("returns the whole bank when no entity is named", () => {
    expect(proverbsConcerning(null, bank).map((entry) => entry.id)).toEqual([
      "a",
      "b",
      "c",
    ]);
  });

  // @req REQ-113
  it("returns the proverbs whose chips name the entity", () => {
    expect(
      proverbsConcerning("people:PPL_YORUBA", bank).map((entry) => entry.id)
    ).toEqual(["a", "b"]);
    expect(
      proverbsConcerning("country:NGA", bank).map((entry) => entry.id)
    ).toEqual(["b"]);
  });

  // A filter link kept from a retired proverb lands on an empty result the
  // page can say something about, not on an error.
  // @req REQ-113
  it("returns nothing for an entity no proverb names", () => {
    expect(proverbsConcerning("people:PPL_ZULU", bank)).toEqual([]);
  });
});

describe("proverbEntities — the choices the filter offers", () => {
  // @req REQ-113
  it("lists each entity once, countries first, then peoples, then families", () => {
    const bank = [
      proverb("a", [
        { kind: "family", id: "FLG_BANTU", label: "Langues bantoues" },
        { kind: "people", id: "PPL_ZULU", label: "Zoulou" },
      ]),
      proverb("b", [
        { kind: "people", id: "PPL_ZULU", label: "Zoulou" },
        { kind: "country", id: "ZAF", label: "Afrique du Sud" },
        { kind: "people", id: "PPL_XHOSA", label: "Xhosa" },
      ]),
    ];

    expect(
      proverbEntities(bank).map((entity) => `${entity.kind}:${entity.id}`)
    ).toEqual([
      "country:ZAF",
      "people:PPL_XHOSA",
      "people:PPL_ZULU",
      "family:FLG_BANTU",
    ]);
  });
});

describe("findProverb — the proverb a shared link names", () => {
  const bank = [proverb("a"), proverb("b")];

  // @req REQ-113
  it("resolves the id a link carries, and nothing for a retired one", () => {
    expect(findProverb("b", bank)?.id).toBe("b");
    expect(findProverb("gone", bank)).toBeNull();
    expect(findProverb(undefined, bank)).toBeNull();
  });
});
