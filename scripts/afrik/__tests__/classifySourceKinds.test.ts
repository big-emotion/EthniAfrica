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
});
