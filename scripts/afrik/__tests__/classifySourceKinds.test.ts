import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  classifySource,
  insertSourceKinds,
  runSourceKindClassification,
} from "../classifySourceKinds";

/**
 * The readers see the kind as a label, so a wrong rule is a wrong label on
 * screen. These drive the rules and the fiche rewrite through the same entry
 * points the script uses on the corpus.
 */

let datasetRoot: string;

function writeFiche(relativePath: string, text: string): string {
  const file = path.join(datasetRoot, relativePath);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, text, "utf8");
  return file;
}

beforeEach(() => {
  datasetRoot = fs.mkdtempSync(path.join(os.tmpdir(), "source-kinds-"));
});

afterEach(() => {
  fs.rmSync(datasetRoot, { recursive: true, force: true });
});

describe("classifySource", () => {
  // @req REQ-161
  it("types a Glottolog page as a linguistic reference", () => {
    expect(
      classifySource({
        title: "Glottolog – Ewe",
        url: "https://glottolog.org/resource/languoid/id/ewee1241",
        tier: "referenced",
      })
    ).toEqual({ kind: "linguistic_reference", rule: "linguistic-reference" });
  });

  // @req REQ-161
  it("lets the most specific host win over a broader one", () => {
    expect(
      classifySource({
        title: "JSTOR Daily — a story",
        url: "https://daily.jstor.org/a-story/",
        tier: "unverified",
      }).kind
    ).toBe("press");
    expect(
      classifySource({
        title: "An article",
        url: "https://www.jstor.org/stable/123",
        tier: "referenced",
      }).kind
    ).toBe("academic");
  });

  // @req REQ-161
  it("types a national statistics office before the generic government domain", () => {
    expect(
      classifySource({
        title: "Census 2022",
        url: "https://census.statssa.gov.za/",
        tier: "official",
      }).kind
    ).toBe("official_statistics");
    expect(
      classifySource({
        title: "The World Factbook — Mali",
        url: "https://www.cia.gov/the-world-factbook/countries/mali/",
        tier: "official",
      }).kind
    ).toBe("government");
  });

  // @req REQ-161
  it("types a university domain as academic", () => {
    expect(
      classifySource({
        title: "A thesis",
        url: "https://repository.ju.edu.et/handle/1",
        tier: "referenced",
      }).kind
    ).toBe("academic");
  });

  // @req REQ-161
  it("holds a host whose kind depends on the work, naming why", () => {
    const result = classifySource({
      title: "Dictionnaire bambara-français",
      url: "https://archive.org/details/dictionnaire",
      tier: "referenced",
    });

    expect(result.kind).toBeNull();
    expect(result.rule).toBe("held:work-dependent");
  });

  // @req REQ-161
  it("types a mission people-group database, an edited encyclopedia and an NGO by their own kinds", () => {
    expect(
      classifySource({
        title: "Joshua Project – Dioula",
        url: "https://joshuaproject.net/people_groups/11590/IV",
        tier: "unverified",
      })
    ).toEqual({ kind: "missionary_database", rule: "missionary-database" });
    expect(
      classifySource({
        title: "Encyclopaedia Britannica – Dyula",
        url: "https://www.britannica.com/topic/Dyula",
        tier: "referenced",
      })
    ).toEqual({ kind: "encyclopedia", rule: "encyclopedia" });
    expect(
      classifySource({
        title: "Minority Rights Group – Batwa",
        url: "https://minorityrights.org/communities/batwa/",
        tier: "referenced",
      })
    ).toEqual({ kind: "ngo", rule: "ngo" });
  });

  // @req REQ-161
  it("types those families from an explicit title when the citation has no URL", () => {
    const kindOf = (title: string) =>
      classifySource({ title, url: null, tier: "unverified" }).kind;

    expect(kindOf("Joshua Project, Dioula of Côte d'Ivoire")).toBe(
      "missionary_database"
    );
    expect(kindOf("Encyclopaedia Britannica, « Dyula »")).toBe("encyclopedia");
    expect(kindOf("Minority Rights Group, World Directory")).toBe("ngo");
  });

  // @req REQ-161
  it("types Wikipedia as an encyclopedia, by its URL or by a title naming it", () => {
    expect(
      classifySource({
        title: "Wikipédia – Dioula",
        url: "https://fr.wikipedia.org/wiki/Dioula",
        tier: "unverified",
      })
    ).toEqual({ kind: "encyclopedia", rule: "encyclopedia-wikipedia" });
    expect(
      classifySource({
        title: "Wikipédia (anglais) — Mandinka people",
        url: null,
        tier: "unverified",
      })
    ).toEqual({ kind: "encyclopedia", rule: "title-encyclopedia-wikipedia" });
  });

  // @req REQ-161
  it("types Larousse's encyclopedia as an encyclopedia and keeps its dictionary a linguistic reference", () => {
    expect(
      classifySource({
        title: "Larousse — Sénégal",
        url: "https://www.larousse.fr/encyclopedie/pays/S%C3%A9n%C3%A9gal/143524",
        tier: "referenced",
      })
    ).toEqual({ kind: "encyclopedia", rule: "encyclopedia-larousse" });
    expect(
      classifySource({
        title: "Larousse — définition de griot",
        url: "https://www.larousse.fr/dictionnaires/francais/griot/38038",
        tier: "referenced",
      }).kind
    ).toBe("linguistic_reference");
  });

  // @req REQ-161
  it("types a page on a work-dependent host by the work a person ruled on", () => {
    expect(
      classifySource({
        title: "René Butaye, Dictionnaire kikongo-français, 1910",
        url: "https://archive.org/details/dictionnaire-butaye",
        tier: "referenced",
      })
    ).toEqual({ kind: "linguistic_reference", rule: "work-ruling" });
    expect(
      classifySource({
        title: "Encyclopædia Britannica, 11e édition (1911) — Krumen",
        url: "https://en.wikisource.org/wiki/1911_Encyclop%C3%A6dia_Britannica/Krumen",
        tier: "unverified",
      }).kind
    ).toBe("encyclopedia");
  });

  // @req REQ-161
  it("keeps holding a page on a work-dependent host that nobody ruled on", () => {
    expect(
      classifySource({
        title: "Scribd — Histoire et culture du peuple Krou",
        url: "https://fr.scribd.com/document/457402032/expose-sur-les-krou-docx",
        tier: "unverified",
      })
    ).toEqual({ kind: null, rule: "held:work-dependent" });
  });

  // @req REQ-161
  it("never guesses a host no rule names", () => {
    expect(
      classifySource({
        title: "A travel blog",
        url: "https://some-travel-blog.example/post",
        tier: "unverified",
      })
    ).toEqual({ kind: null, rule: null });
  });

  // @req REQ-161
  it("types a citation without a URL from an explicit title pattern", () => {
    expect(
      classifySource({
        title: "ONU – World Population Prospects 2025",
        url: null,
        tier: "official",
      }).kind
    ).toBe("intergovernmental");
    expect(
      classifySource({
        title:
          "Greenberg, Joseph H. (1963) – The Languages of Africa. Indiana University Press",
        url: null,
        tier: "referenced",
      }).kind
    ).toBe("academic");
  });

  // @req REQ-161
  it("types the long-tail hosts by who publishes them, read on their own pages", () => {
    const kindOf = (url: string) =>
      classifySource({ title: "A page", url, tier: "unverified" }).kind;

    // One photographer's non-profit site compiling other texts: a personal
    // site, which the operator ruling files with blogs.
    expect(kindOf("https://www.101lasttribes.com/tribes/baga.html")).toBe(
      "community"
    );
    expect(
      kindOf("https://www.citypopulation.de/en/ghana/admin/03__greater_accra/")
    ).toBe("discovery");
    expect(
      kindOf(
        "https://shabait.com/2016/08/26/the-animal-caretakers-the-saho-of-eritrea/"
      )
    ).toBe("government");
    expect(
      kindOf(
        "https://partnersinbibletranslation.org/wp-content/uploads/2018/03/Toka-Leya_Survey_2015.pdf"
      )
    ).toBe("missionary_database");
    expect(kindOf("https://kreolmagazine.com/krio/")).toBe("press");
    expect(
      kindOf("https://clearglobal.org/language-data-for-mozambique/")
    ).toBe("ngo");
  });

  // @req REQ-161
  it("types a social-media post or video by who published it, and holds the ones nobody identified", () => {
    const classify = (url: string) =>
      classifySource({ title: "A post", url, tier: "unverified" });

    expect(
      classify(
        "https://www.facebook.com/TanzaniaTouristBoard/posts/811743427661675/"
      ).kind
    ).toBe("government");
    expect(classify("https://www.youtube.com/watch?v=TJc4NjTFGiw").kind).toBe(
      "press"
    );
    expect(
      classify(
        "https://www.facebook.com/groups/batonga/posts/10161294996454258/"
      ).kind
    ).toBe("community");
    expect(classify("https://www.youtube.com/watch?v=bP0kGwHPQvk")).toEqual({
      kind: null,
      rule: "held:speaker-dependent",
    });
  });

  // @req REQ-161
  it("holds a commercial site on purpose, since no kind names a shop honestly", () => {
    expect(
      classifySource({
        title: "Kruger Park — Xhosa people",
        url: "https://www.krugerpark.co.za/africa_xhosa.html",
        tier: "unverified",
      })
    ).toEqual({ kind: null, rule: "held:commercial" });
  });

  // @req REQ-161
  it("types census and statistics-office citations without a URL as public statistics", () => {
    const kindOf = (title: string) =>
      classifySource({ title, url: null, tier: "official" }).kind;

    expect(kindOf("Recensements béninois")).toBe("official_statistics");
    expect(kindOf("Recensements nationaux sénégalais (ANSD)")).toBe(
      "official_statistics"
    );
    expect(
      kindOf(
        "Recensement national de la population et du logement de l'Éthiopie 2007 (CSA)"
      )
    ).toBe("official_statistics");
    expect(
      kindOf(
        "Institut National de la Statistique de Cote d'Ivoire (INS) — Recensement General de la Population et de l'Habitat 2021"
      )
    ).toBe("official_statistics");
  });

  // @req REQ-161
  it("types a URL-less citation whose title is a bare address by that address's host", () => {
    const classify = (title: string) =>
      classifySource({ title, url: null, tier: "referenced" });

    expect(
      classify("www.ethnologue.com/language/kab (consulté en 2024)")
    ).toEqual({
      kind: "linguistic_reference",
      rule: "title-address:linguistic-reference",
    });
    expect(classify("en.unesco.org").kind).toBe("intergovernmental");
    expect(
      classify("www.cia.gov/the-world-factbook/countries/algeria").kind
    ).toBe("government");
  });

  // @req REQ-161
  it("types URL-less citations naming SIL, an encyclopedia, an NGO, an official text or an academic press", () => {
    const kindOf = (title: string) =>
      classifySource({ title, url: null, tier: "referenced" }).kind;

    expect(
      kindOf("ISO 639-3: muz (Mursi) – SIL International / Ethnologue")
    ).toBe("linguistic_reference");
    expect(
      kindOf(
        "Ralph Siebert. 2002. Sociolinguistic survey report on the Dime language of Ethiopia. SIL Electronic Survey Reports 2002-043"
      )
    ).toBe("linguistic_reference");
    expect(kindOf("Encyclopaedia Aethiopica")).toBe("encyclopedia");
    expect(kindOf("Encyclopédie de Madagascar")).toBe("encyclopedia");
    expect(
      kindOf(
        "Amnesty International – Mauritania: Human Rights Abuses Against Black Africans, 1994"
      )
    ).toBe("ngo");
    expect(
      kindOf(
        "Federal Republic of Nigeria Official Gazette, 14 juillet 2022 — Orthographe officielle du nom Ebira"
      )
    ).toBe("government");
    expect(
      kindOf("Evans-Pritchard, E. E. The Nuer. Oxford: Clarendon Press, 1940")
    ).toBe("academic");
    expect(kindOf("Sorbonne Université – Les langues créoles")).toBe(
      "academic"
    );
  });

  // @req REQ-161
  it("leaves a URL-less citation that names no identifiable work, or a trade book", () => {
    const kindOf = (title: string) =>
      classifySource({ title, url: null, tier: "unverified" }).kind;

    expect(
      kindOf("Études anthropologiques sur les peuples du Bénin")
    ).toBeNull();
    expect(kindOf("Archives du Royaume d'Abomey")).toBeNull();
    expect(
      kindOf("Daoud Hari — The Translator. Random House, 2008")
    ).toBeNull();
  });

  // @req REQ-161
  it("does not read a title pattern into a citation that has a URL", () => {
    expect(
      classifySource({
        title: "Journal of a traveller",
        url: "https://some-travel-blog.example/journal",
        tier: "unverified",
      }).kind
    ).toBeNull();
  });
});

describe("insertSourceKinds", () => {
  // @req REQ-161
  it("adds the key after the tier at the fiche's own indentation and touches nothing else", () => {
    const original = [
      "{",
      '    "sources": [',
      "        {",
      '            "title": "Glottolog",',
      '            "url": "https://glottolog.org/x",',
      '            "tier": "referenced",',
      '            "notes": "Consulté en 2026."',
      "        },",
      "        {",
      '            "title": "Last",',
      '            "url": null,',
      '            "tier": "official"',
      "        }",
      "    ]",
      "}",
      "",
    ].join("\n");

    const updated = insertSourceKinds(original, [
      "linguistic_reference",
      "intergovernmental",
    ]);

    expect(updated.split("\n")).toEqual([
      "{",
      '    "sources": [',
      "        {",
      '            "title": "Glottolog",',
      '            "url": "https://glottolog.org/x",',
      '            "tier": "referenced",',
      '            "source_kind": "linguistic_reference",',
      '            "notes": "Consulté en 2026."',
      "        },",
      "        {",
      '            "title": "Last",',
      '            "url": null,',
      '            "tier": "official",',
      '            "source_kind": "intergovernmental"',
      "        }",
      "    ]",
      "}",
      "",
    ]);
  });

  // @req REQ-161
  it("leaves a source without an assigned kind, and one already typed, as they are", () => {
    const original = JSON.stringify(
      {
        names: [
          {
            sources: [
              { title: "a", tier: "unverified", source_kind: "ai_generated" },
              { title: "b", tier: "unverified" },
            ],
          },
        ],
      },
      null,
      2
    );

    expect(insertSourceKinds(original, [null, null])).toBe(original);
  });
});

describe("runSourceKindClassification", () => {
  const fiche = JSON.stringify(
    {
      id: "PPL_A",
      sources: [
        {
          title: "Glottolog – A",
          url: "https://glottolog.org/a",
          tier: "referenced",
        },
        {
          title: "A travel blog",
          url: "https://some-travel-blog.example/a",
          tier: "unverified",
        },
        {
          title: "Machine text",
          url: null,
          tier: "unverified",
          source_kind: "ai_generated",
        },
      ],
    },
    null,
    2
  );

  // @req REQ-161
  it("proposes kinds on a dry run and changes no file", () => {
    const file = writeFiche("peuples/PPL_A.json", fiche);

    const report = runSourceKindClassification({ datasetRoot, apply: false });

    expect(report.byKind).toEqual({ linguistic_reference: 1 });
    expect(report.byRule).toEqual({ "linguistic-reference": 1 });
    expect(fs.readFileSync(file, "utf8")).toBe(fiche);
  });

  // @req REQ-161
  it("lists an unmatched source for review and never assigns it a kind", () => {
    const file = writeFiche("peuples/PPL_A.json", fiche);

    const report = runSourceKindClassification({ datasetRoot, apply: true });
    const written = JSON.parse(fs.readFileSync(file, "utf8"));

    expect(report.unmatched).toEqual([
      expect.objectContaining({
        fiche: "peuples/PPL_A.json",
        title: "A travel blog",
        host: "some-travel-blog.example",
        rule: null,
      }),
    ]);
    expect(written.sources[0].source_kind).toBe("linguistic_reference");
    expect(written.sources[1]).not.toHaveProperty("source_kind");
    expect(written.sources[2].source_kind).toBe("ai_generated");
  });

  // @req REQ-161
  it("moves a source already typed when an operator ruling moves its rule's kind, and nothing else", () => {
    const typed = [
      "{",
      '  "id": "PPL_B",',
      '  "sources": [',
      "    {",
      '      "title": "Wikipédia – B",',
      '      "url": "https://fr.wikipedia.org/wiki/B",',
      '      "tier": "unverified",',
      '      "source_kind": "community",',
      '      "notes": "Lue le 9 octobre 2026."',
      "    },",
      '    { "title": "Larousse — B", "url": "https://www.larousse.fr/encyclopedie/divers/B/1", "tier": "referenced", "source_kind": "linguistic_reference" },',
      "    {",
      '      "title": "Behind the Name — B",',
      '      "url": "https://www.behindthename.com/name/b",',
      '      "tier": "unverified",',
      '      "source_kind": "community"',
      "    },",
      "    {",
      '      "title": "Machine text about Wikipedia",',
      '      "url": "https://en.wikipedia.org/wiki/B",',
      '      "tier": "unverified",',
      '      "source_kind": "ai_generated"',
      "    }",
      "  ]",
      "}",
      "",
    ].join("\n");
    const file = writeFiche("peuples/PPL_B.json", typed);

    const report = runSourceKindClassification({ datasetRoot, apply: true });

    expect(report.moved).toEqual({
      "community → encyclopedia": 1,
      "linguistic_reference → encyclopedia": 1,
    });
    expect(fs.readFileSync(file, "utf8")).toBe(
      typed
        .replace(
          '"source_kind": "community",',
          '"source_kind": "encyclopedia",'
        )
        .replace(
          '"source_kind": "linguistic_reference" }',
          '"source_kind": "encyclopedia" }'
        )
    );
  });

  // @req REQ-161
  it("reports a ruled move on a dry run without writing it", () => {
    const typed = JSON.stringify(
      {
        id: "PPL_C",
        sources: [
          {
            title: "Wikipédia – C",
            url: "https://fr.wikipedia.org/wiki/C",
            tier: "unverified",
            source_kind: "community",
          },
        ],
      },
      null,
      2
    );
    const file = writeFiche("peuples/PPL_C.json", typed);

    const report = runSourceKindClassification({ datasetRoot, apply: false });

    expect(report.moved).toEqual({ "community → encyclopedia": 1 });
    expect(fs.readFileSync(file, "utf8")).toBe(typed);
  });
});
