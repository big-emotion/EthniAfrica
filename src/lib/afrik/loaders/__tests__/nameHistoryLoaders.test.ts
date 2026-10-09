import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { loadLanguageFiches } from "../languageFicheLoader";

// The people, family and country loaders read the corpus under
// `process.cwd()` and memoise per process, so each test imports a fresh
// module pointed at a temp tree.
let workdir: string;
let afrikRoot: string;

const nameHistory = {
  summary: "Le nom Kongo a plusieurs origines possibles, présentées plus bas.",
  names: [
    {
      nameText: "Kongo",
      nameStatus: "current",
      selfGiven: true,
      languageOfOrigin: "kon",
      namedBy: null,
      accounts: [
        {
          period: { from: 1482, to: null, label: "Depuis 1482" },
          statement: "Le nom Kongo est attesté par les Portugais en 1482.",
          birth: true,
          sources: [
            {
              title: "Récit des anciens",
              author: "Conteurs du Mbanza Kongo",
              year: null,
              url: null,
              tier: "unverified",
              source_kind: "oral_tradition",
            },
          ],
        },
      ],
    },
  ],
};

const brokenNameHistory = { summary: "", names: [] };

function writeFiche(relativePath: string, fiche: Record<string, unknown>) {
  const filePath = path.join(afrikRoot, relativePath);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(fiche));
}

beforeEach(() => {
  workdir = fs.mkdtempSync(path.join(os.tmpdir(), "name-history-loaders-"));
  afrikRoot = path.join(workdir, "dataset", "source", "afrik");
  vi.spyOn(process, "cwd").mockReturnValue(workdir);
  vi.resetModules();
});

afterEach(() => {
  vi.restoreAllMocks();
  fs.rmSync(workdir, { recursive: true, force: true });
});

describe("people loader", () => {
  // @req REQ-196
  it("keeps the nameHistory block a people fiche declares", async () => {
    writeFiche("peuples/FLG_BANTU/PPL_KONGO.json", {
      id: "PPL_KONGO",
      nameMain: "Kongo",
      content: {},
      nameHistory,
    });
    const { loadPeople } = await import("../peopleJsonLoader");

    const result = await loadPeople("PPL_KONGO");

    expect(result.success).toBe(true);
    expect(result.data?.nameHistory).toEqual(nameHistory);
  });

  // @req REQ-196
  it("refuses a people fiche whose block breaks the shared schema", async () => {
    writeFiche("peuples/FLG_BANTU/PPL_KONGO.json", {
      id: "PPL_KONGO",
      nameMain: "Kongo",
      content: {},
      nameHistory: brokenNameHistory,
    });
    const { loadPeople } = await import("../peopleJsonLoader");

    const result = await loadPeople("PPL_KONGO");

    expect(result.success).toBe(false);
    expect(result.errors?.[0].message).toMatch(/^PPL_KONGO: nameHistory/);
  });
});

describe("language family loader", () => {
  // @req REQ-196
  it("keeps the nameHistory block a family fiche declares", async () => {
    writeFiche("famille_linguistique/FLG_BANTU.json", {
      id: "FLG_BANTU",
      nameFr: "Bantou",
      content: {},
      nameHistory,
    });
    const { loadLanguageFamily } = await import("../familyJsonLoader");

    const result = await loadLanguageFamily("FLG_BANTU");

    expect(result.data?.nameHistory).toEqual(nameHistory);
  });

  // @req REQ-196
  it("refuses a family fiche whose block breaks the shared schema", async () => {
    writeFiche("famille_linguistique/FLG_BANTU.json", {
      id: "FLG_BANTU",
      nameFr: "Bantou",
      content: {},
      nameHistory: brokenNameHistory,
    });
    const { loadLanguageFamily } = await import("../familyJsonLoader");

    const result = await loadLanguageFamily("FLG_BANTU");

    expect(result.success).toBe(false);
    expect(result.errors?.[0].message).toMatch(/^FLG_BANTU: nameHistory/);
  });
});

describe("country loader", () => {
  // @req REQ-196
  it("keeps the nameHistory block a country fiche declares", async () => {
    writeFiche("pays/COG.json", {
      id: "COG",
      nameFr: "Congo",
      content: {},
      nameHistory,
    });
    const { loadCountry } = await import("../countryJsonLoader");

    const result = await loadCountry("COG");

    expect(result.data?.nameHistory).toEqual(nameHistory);
  });

  // @req REQ-196
  it("refuses a country fiche whose block breaks the shared schema", async () => {
    writeFiche("pays/COG.json", {
      id: "COG",
      nameFr: "Congo",
      content: {},
      nameHistory: brokenNameHistory,
    });
    const { loadCountry } = await import("../countryJsonLoader");

    const result = await loadCountry("COG");

    expect(result.success).toBe(false);
    expect(result.errors?.[0].message).toMatch(/^COG: nameHistory/);
  });
});

describe("language fiche loader", () => {
  // @req REQ-196
  it("keeps the nameHistory block a language fiche declares", () => {
    writeFiche("langues/kon.json", {
      id: "kon",
      isoCode639_3: "kon",
      nameFr: "Kikongo",
      nameHistory,
    });

    const [record] = loadLanguageFiches(path.join(afrikRoot, "langues"));

    expect(record.nameHistory).toEqual(nameHistory);
  });

  // @req REQ-196
  it("leaves a language fiche without a block without one", () => {
    writeFiche("langues/kon.json", {
      id: "kon",
      isoCode639_3: "kon",
      nameFr: "Kikongo",
    });

    const [record] = loadLanguageFiches(path.join(afrikRoot, "langues"));

    expect(record).not.toHaveProperty("nameHistory");
  });

  // @req REQ-196
  it("refuses a language fiche whose block breaks the shared schema", () => {
    writeFiche("langues/kon.json", {
      id: "kon",
      isoCode639_3: "kon",
      nameFr: "Kikongo",
      nameHistory: brokenNameHistory,
    });

    expect(() => loadLanguageFiches(path.join(afrikRoot, "langues"))).toThrow(
      /^kon: nameHistory/
    );
  });
});
