import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdirSync, writeFileSync, readFileSync, rmSync, existsSync } from "fs";
import { join } from "path";

import {
  checkNameHistoryBlocks,
  checkStrictModelKeys,
  checkLanguageStrictSchema,
} from "../validateAfrikData";
import { parseNameHistory } from "../../src/lib/afrik/parsers/nameHistoryParser";
import { parsePatronymeFile } from "../../src/lib/afrik/parsers/patronymeParser";
import { parsePlaceFile } from "../../src/lib/afrik/parsers/placeParser";

const PUBLIC_ROOT = join(__dirname, "..", "..", "public");

function writeJson(root: string, relative: string, value: unknown) {
  const full = join(root, relative);
  mkdirSync(join(full, ".."), { recursive: true });
  writeFileSync(full, JSON.stringify(value));
}

function readJson(path: string) {
  return JSON.parse(readFileSync(path, "utf-8"));
}

function oralSource() {
  return {
    title: "Récit de fondation",
    author: "Chefferie de Kami",
    year: null,
    url: null,
    tier: "unverified",
    source_kind: "oral_tradition",
    carrier: "Porte-parole du chef de Kami",
    place: "Kami",
  };
}

function nameHistory(accounts: unknown[]) {
  return {
    summary:
      "Le nom Testa est porté depuis longtemps ; son origine est présentée plus bas.",
    names: [
      {
        nameText: "Testa",
        nameStatus: "current",
        selfGiven: true,
        languageOfOrigin: null,
        namedBy: null,
        accounts,
      },
    ],
  };
}

function account(overrides: Record<string, unknown> = {}) {
  return {
    period: { from: 1500, to: 1599, label: "XVIe siècle" },
    era: "polity",
    statement: "Le nom Testa apparaît au XVIe siècle selon le récit.",
    sources: [oralSource()],
    ...overrides,
  };
}

const VALID_BLOCK = nameHistory([account({ birth: true })]);

// One fiche per named-subject class, at the path the corpus keeps it.
const FICHE_PATHS = [
  "peuples/FLG_TEST/PPL_TEST.json",
  "pays/TST.json",
  "langues/tst.json",
  "famille_linguistique/FLG_TEST.json",
  "patronymes/PAT_TEST.json",
  "lieux/LOC_TEST.json",
  "mots/WRD_TEST.json",
];

describe("checkNameHistoryBlocks", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = join(
      __dirname,
      `tmp_test_nh_${Date.now()}_${Math.random().toString(36).slice(2)}`
    );
    mkdirSync(tmpDir, { recursive: true });
  });

  afterEach(() => {
    if (existsSync(tmpDir)) rmSync(tmpDir, { recursive: true, force: true });
  });

  // @req REQ-196
  it("passes the same block in a people, country, language, family, family-name, place and word fiche", () => {
    for (const relative of FICHE_PATHS) {
      writeJson(tmpDir, relative, { id: "X", nameHistory: VALID_BLOCK });
    }

    expect(checkNameHistoryBlocks(tmpDir)).toEqual({
      ok: true,
      errors: [],
      warnings: [],
    });
  });

  // @req REQ-196
  it("ignores fiches that do not carry the block yet", () => {
    writeJson(tmpDir, "pays/TST.json", { id: "TST" });

    expect(checkNameHistoryBlocks(tmpDir).ok).toBe(true);
  });

  // @req REQ-196
  it("fails a people fiche whose block names no name the people gives itself", () => {
    const block = nameHistory([account()]);
    block.names[0].selfGiven = false;
    writeJson(tmpDir, "peuples/FLG_TEST/PPL_TEST.json", {
      id: "PPL_TEST",
      nameHistory: block,
    });
    writeJson(tmpDir, "pays/TST.json", { id: "TST", nameHistory: block });

    const result = checkNameHistoryBlocks(tmpDir);

    expect(result.errors).toEqual([
      expect.stringMatching(/PPL_TEST\.json.*name the people gives itself/),
    ]);
  });

  // @req REQ-196
  it("fails a block that tells the same name twice", () => {
    const block = nameHistory([account()]);
    block.names.push({ ...block.names[0], selfGiven: false });
    writeJson(tmpDir, "pays/TST.json", { id: "TST", nameHistory: block });

    expect(checkNameHistoryBlocks(tmpDir).errors).toEqual([
      expect.stringMatching(/TST\.json.*"Testa".*twice/),
    ]);
  });

  // @req REQ-196
  it("fails a name with two birth accounts, naming the fiche and the name", () => {
    writeJson(tmpDir, "pays/TST.json", {
      id: "TST",
      nameHistory: nameHistory([
        account({ birth: true }),
        account({ birth: true }),
      ]),
    });

    const result = checkNameHistoryBlocks(tmpDir);

    expect(result.ok).toBe(false);
    expect(result.errors).toContainEqual(
      expect.stringMatching(/pays\/TST\.json.*name "Testa".*at most one birth/)
    );
  });

  // @req REQ-196
  it("warns, without failing, about the accounts that declare no era", () => {
    // writeJson drops an undefined key, as a fiche without the field.
    const undecided = account({ era: undefined });
    writeJson(tmpDir, "pays/TST.json", {
      id: "TST",
      nameHistory: nameHistory([
        account({ birth: true }),
        undecided,
        undecided,
      ]),
    });

    expect(checkNameHistoryBlocks(tmpDir)).toEqual({
      ok: true,
      errors: [],
      warnings: [
        'REQ-196: pays/TST.json: 2 nameHistory account(s) declare no era (docs/editorial/strategy/colonial-periods.md): "Testa" #1, #2',
      ],
    });
  });

  // @req REQ-195
  it("passes an account whose only source is an oral tradition with no URL", () => {
    writeJson(tmpDir, "peuples/FLG_TEST/PPL_TEST.json", {
      id: "PPL_TEST",
      nameHistory: nameHistory([account({ sources: [oralSource()] })]),
    });

    expect(checkNameHistoryBlocks(tmpDir).ok).toBe(true);
  });
});

describe("the models declare the shared block", () => {
  const MODELS = [
    "modele-peuple.json",
    "modele-langue.json",
    "modele-linguistique.json",
    "modele-pays.json",
    "modele-nom-patronyme.json",
    "modele-lieu.json",
    "modele-mot.json",
  ];

  // @req REQ-196
  it.each(MODELS)(
    "%s carries a nameHistory example the shared schema accepts",
    (model) => {
      const { nameHistory: example } = readJson(join(PUBLIC_ROOT, model));

      expect(parseNameHistory(example).errors).toEqual([]);
    }
  );

  // @req REQ-196
  it("gives every model the identical nameHistory example", () => {
    const examples = MODELS.map((model) =>
      JSON.stringify(readJson(join(PUBLIC_ROOT, model)).nameHistory)
    );

    expect(new Set(examples).size).toBe(1);
  });
});

describe("the per-class parsers accept the block", () => {
  // @req REQ-196
  it("a family-name fiche keeps passing its strict parser with nameHistory", () => {
    const fiche = readJson(join(PUBLIC_ROOT, "modele-nom-patronyme.json"));
    const real = readJson(
      join(
        __dirname,
        "..",
        "..",
        "dataset",
        "source",
        "afrik",
        "patronymes",
        "PAT_TRAORE.json"
      )
    );

    expect(
      parsePatronymeFile({ ...real, nameHistory: fiche.nameHistory }).success
    ).toBe(true);
    expect(
      parsePatronymeFile({ ...real, nameHistory: { summary: "" } }).success
    ).toBe(false);
  });

  // @req REQ-196
  it("a place fiche keeps the block through its parser and refuses a broken one", () => {
    const real = readJson(
      join(
        __dirname,
        "..",
        "..",
        "dataset",
        "source",
        "afrik",
        "lieux",
        "LOC_YAMOUSSOUKRO.json"
      )
    );

    const parsed = parsePlaceFile({ ...real, nameHistory: VALID_BLOCK });
    expect(parsed.success).toBe(true);
    expect(parsed.data?.nameHistory).toEqual(VALID_BLOCK);
    expect(
      parsePlaceFile({ ...real, nameHistory: { summary: "" } }).success
    ).toBe(false);
  });
});

describe("strict-model key checks treat nameHistory as optional", () => {
  let tmpDir: string;
  let datasetRoot: string;
  let modelsRoot: string;

  beforeEach(() => {
    tmpDir = join(
      __dirname,
      `tmp_test_nhkeys_${Date.now()}_${Math.random().toString(36).slice(2)}`
    );
    datasetRoot = join(tmpDir, "afrik");
    modelsRoot = join(tmpDir, "public");
    writeJson(modelsRoot, "modele-pays.json", {
      _meta: {},
      id: "XXX",
      nameHistory: VALID_BLOCK,
      content: { culture: { mainLanguages: [] }, sources: [] },
    });
    writeJson(modelsRoot, "modele-langue.json", {
      _meta: {},
      id: "xxx",
      nameHistory: VALID_BLOCK,
      content: { sources: [] },
    });
  });

  afterEach(() => {
    if (existsSync(tmpDir)) rmSync(tmpDir, { recursive: true, force: true });
  });

  // @req REQ-196
  it("counts no drift for a country fiche with or without the block", () => {
    const content = { culture: { mainLanguages: [] }, sources: [] };
    writeJson(datasetRoot, "pays/AAA.json", { id: "AAA", content });
    writeJson(datasetRoot, "pays/BBB.json", {
      id: "BBB",
      nameHistory: VALID_BLOCK,
      content,
    });

    expect(checkStrictModelKeys(datasetRoot, modelsRoot, "pays", 0).ok).toBe(
      true
    );
  });

  // @req REQ-196
  it("accepts a language fiche with or without the block", () => {
    writeJson(datasetRoot, "langues/aaa.json", {
      id: "aaa",
      content: { sources: [] },
    });
    writeJson(datasetRoot, "langues/bbb.json", {
      id: "bbb",
      nameHistory: VALID_BLOCK,
      content: { sources: [] },
    });

    const result = checkLanguageStrictSchema(
      datasetRoot,
      join(modelsRoot, "modele-langue.json")
    );

    expect(result.errors).toEqual([]);
  });
});
