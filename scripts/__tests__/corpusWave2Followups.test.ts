import {
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { join, resolve } from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { loadNextSteps } from "../../src/lib/afrikLoader";
import { parseNameHistory } from "../../src/lib/afrik/parsers/nameHistoryParser";
import { firstSentence } from "../../src/lib/search/nameClosing";
import type { SearchResult } from "../../src/types/afrik-frontend";
import {
  checkNameHistoryBlocks,
  checkUnaccentedFrenchProse,
} from "../validateAfrikData";

// The corpus follow-ups of the 2026-10-17 triage: contradictions a reader
// meets on the result page, a vague period label, and French prose printed
// without its accents. Every case reads the fiches on disk.

const AFRIK = resolve(process.cwd(), "dataset/source/afrik");

const read = (relative: string) =>
  JSON.parse(readFileSync(join(AFRIK, relative), "utf8"));

const MANDE = "famille_linguistique/FLG_MANDE.json";
const ZARMA = "peuples/FLG_SONGHAY/PPL_ZARMA.json";
const FULA = "peuples/FLG_ATLANTIQUE/PPL_FULA.json";
const LINGALA = "peuples/FLG_NIGERCONGO/PPL_LINGALA.json";
const NGANGUELA = "peuples/FLG_NIGERCONGO/PPL_NGANGUELA.json";

interface HistoryAccount {
  period: { from: number | null; to: number | null; label: string };
  statement: string;
  hypothesisGroup?: string;
  birth?: true;
  sources: Array<{ author: string; year: number | null; source_kind: string }>;
}
interface HistoryName {
  nameText: string;
  selfGiven: boolean;
  namedBy: string | null;
  accounts: HistoryAccount[];
}

const namesOf = (relative: string): HistoryName[] =>
  read(relative).nameHistory.names;
const nameOf = (relative: string, nameText: string) =>
  namesOf(relative).find((name) => name.nameText === nameText);

function writeJson(root: string, relative: string, value: unknown) {
  const full = join(root, relative);
  mkdirSync(join(full, ".."), { recursive: true });
  writeFileSync(full, JSON.stringify(value));
}

function oralSource() {
  return {
    title: "Récit de fondation",
    author: "Chefferie de Kami",
    year: null,
    url: null,
    tier: "unverified",
    source_kind: "oral_tradition",
  };
}

function block(names: unknown[]) {
  return {
    summary: "Le nom Testa est porté depuis longtemps.",
    names,
  };
}

function name(nameText: string, selfGiven: boolean, label = "XVIe siècle") {
  return {
    nameText,
    nameStatus: "current",
    selfGiven,
    languageOfOrigin: null,
    namedBy: null,
    accounts: [
      {
        period: { from: 1500, to: 1599, label },
        era: "polity",
        statement: `Le nom ${nameText} apparaît au XVIe siècle selon le récit.`,
        sources: [oralSource()],
      },
    ],
  };
}

describe("validator — the hero and the name history agree on the self-name", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = join(
      __dirname,
      `tmp_test_wave2_${Date.now()}_${Math.random().toString(36).slice(2)}`
    );
    mkdirSync(tmpDir, { recursive: true });
  });

  afterEach(() => {
    if (existsSync(tmpDir)) rmSync(tmpDir, { recursive: true, force: true });
  });

  // @req REQ-178
  it("fails a family whose history marks a name self-given while its hero records none", () => {
    writeJson(tmpDir, "famille_linguistique/FLG_TEST.json", {
      id: "FLG_TEST",
      nameHistory: block([name("Testa", true)]),
      content: { decolonialHeader: { selfAppellation: null } },
    });

    expect(checkNameHistoryBlocks(tmpDir).errors).toEqual([
      expect.stringMatching(
        /FLG_TEST\.json.*"Testa" is self-given.*selfAppellation/
      ),
    ]);
  });

  // @req REQ-178
  it("fails a people whose appellations record no self-name beside a self-given name", () => {
    writeJson(tmpDir, "peuples/FLG_TEST/PPL_TEST.json", {
      id: "PPL_TEST",
      nameHistory: block([name("Testa", true)]),
      content: { appellations: { selfAppellation: "" } },
    });

    expect(checkNameHistoryBlocks(tmpDir).errors).toEqual([
      expect.stringMatching(/PPL_TEST\.json.*"Testa" is self-given/),
    ]);
  });

  // @req REQ-178
  it("passes the same history once the hero names the self-name", () => {
    writeJson(tmpDir, "famille_linguistique/FLG_TEST.json", {
      id: "FLG_TEST",
      nameHistory: block([name("Testa", true)]),
      content: { decolonialHeader: { selfAppellation: "Testa" } },
    });

    expect(checkNameHistoryBlocks(tmpDir).errors).toEqual([]);
  });

  // « au présent par l'auteur » places nothing: the author's present is the
  // year of the work, which the label should say, or what the account tells.
  // @req REQ-178
  it("fails a period label that dates an account by its author's present", () => {
    writeJson(tmpDir, "famille_linguistique/FLG_TEST.json", {
      id: "FLG_TEST",
      nameHistory: block([
        name("Testa", false, "Usage décrit au présent par l'auteur"),
        name("Testo", false, "Classification exposée au présent par l'auteur"),
      ]),
    });

    expect(checkNameHistoryBlocks(tmpDir).errors).toEqual([
      expect.stringMatching(/FLG_TEST\.json.*"Testa".*au présent par/),
      expect.stringMatching(/FLG_TEST\.json.*"Testo".*au présent par/),
    ]);
  });

  // @req REQ-178
  it("finds no such disagreement and no such label in the corpus", () => {
    const errors = checkNameHistoryBlocks(AFRIK).errors;

    expect(errors.filter((error) => /selfAppellation/.test(error))).toEqual([]);
    expect(errors.filter((error) => /au présent par/.test(error))).toEqual([]);
  });
});

describe("FLG_MANDE — the self-name is the people's, Manden is their country", () => {
  // Koelle (1854), read in the Lexibank transcription: « the natives plainly
  // say Mánde and Mandén·ga »; Niane (1985, p. 141) writes the people mandenka.
  // @req REQ-178
  it("prints Mandenka as the self-name in the hero, as the sources write it", () => {
    expect(read(MANDE).content.decolonialHeader.selfAppellation).toBe(
      "Mandenka"
    );
  });

  // @req REQ-178
  it("tells Mandenka as a self-given name, born in Koelle's notes and used by Niane", () => {
    const mandenka = nameOf(MANDE, "Mandenka");

    expect(mandenka?.selfGiven).toBe(true);
    const authors = mandenka.accounts.flatMap((account) =>
      account.sources.map((source) => source.author)
    );
    expect(authors).toEqual(
      expect.arrayContaining([
        "Sigismund Wilhelm Koelle",
        "Djibril Tamsir Niane",
      ])
    );
    const birth = mandenka.accounts.find((account) => account.birth);
    expect(birth?.period.from).toBe(1854);
  });

  // @req REQ-178
  it("no longer marks Manden, the name of a country, as the name they give themselves", () => {
    const manden = nameOf(MANDE, "Manden");

    expect(manden.selfGiven).toBe(false);
    expect(manden.accounts[0].statement).toMatch(/désigne un pays/);
  });

  // The fiche's sources hold one explanation of Manden, the griot Babou
  // Condé's as Camara Laye transcribed it: the history tells it as a
  // hypothesis instead of saying no source explains the name.
  // @req REQ-178
  it("tells the lamantin explanation of Manden as a hypothesis with its source", () => {
    const manden = nameOf(MANDE, "Manden");
    const reading = manden.accounts.find((account) =>
      /lamantin/.test(account.statement)
    );

    expect(reading?.hypothesisGroup).toBeDefined();
    expect(reading.statement).toMatch(/viendrait/);
    expect(reading.sources.map((source) => source.author)).toContain(
      "Camara Laye"
    );
    const prose = JSON.stringify(read(MANDE).nameHistory);
    expect(prose).not.toMatch(/n'expliquent pas le sens premier/);
  });
});

describe("two peoples whose hero and history disagreed on the self-name", () => {
  // Mpoke Mimpongo (2024) is the source the history cites for the name.
  // @req REQ-178
  it("PPL_LINGALA prints « Bato ya mangala » as the self-name its history tells", () => {
    const lingala = read(LINGALA);

    expect(lingala.content.appellations.selfAppellation).toBe(
      "Bato ya mangala"
    );
    expect(nameOf(LINGALA, "Bato ya mangala")?.selfGiven).toBe(true);
  });

  // The source calls Nganguela a term the Ovimbundu applied; the fiche keeps
  // no name of its own (ganguelaNganguela.test.ts), so no name is self-given.
  // @req REQ-178
  it("PPL_NGANGUELA says no common self-name is known instead of marking the Ovimbundu term", () => {
    const history = read(NGANGUELA).nameHistory;

    expect(history.selfNameUnknown).toBe(true);
    expect(
      history.names.filter((entry: HistoryName) => entry.selfGiven)
    ).toEqual([]);
    expect(nameOf(NGANGUELA, "Nganguela").namedBy).toMatch(/Ovimbundu/);
  });
});

describe("PPL_ZARMA — one account of where the name Zarma comes from", () => {
  // No source the fiche cites carries « Za-Hama, the descendants of Za »:
  // not the pages it lists, not the works its history reads. The history
  // says the sources read do not explain the name, and that stays true.
  // @req REQ-178
  it("drops the unsourced Za-Hama derivation that contradicted its history", () => {
    const zarma = read(ZARMA);
    const prose = JSON.stringify({ ...zarma.content, sources: [] });

    expect(prose).not.toMatch(/Za-Hama/);
    expect(zarma.nameHistory.summary).toMatch(
      /ne disent pas d'où vient le nom Zarma/
    );
  });

  // @req REQ-178
  it("attributes the Hausa origin of Zabarma to the source its history cites", () => {
    const origin = read(ZARMA).content.appellations.originOfExonyms;

    expect(origin).not.toMatch(/viendrait de Zabarma \(pays zarma\)/);
    expect(origin).toMatch(/Zabarma[^.]*haoussa[^.]*Monique Bertrand/);
  });
});

describe("« peul » — the Wolof card gives the naming relation as its reason", () => {
  const fula: SearchResult = {
    type: "people",
    id: "PPL_FULA",
    name: "Peul",
    languageFamilyId: "FLG_ATLANTIQUE" as SearchResult["languageFamilyId"],
    languageFamilyName: "Atlantique",
  };

  // The fiches on disk, served in the envelope /api/v2 gives them. A language
  // is served with the name and speaking peoples its serializer adds.
  const corpus = async (path: string) => {
    const envelope = (data: unknown) =>
      new Response(JSON.stringify({ data }), { status: 200 });
    if (path === "/api/v2/languages/wol") {
      const wol = read("langues/wol.json");
      return envelope({
        id: wol.id,
        name: wol.nameFr,
        speakingPeoples: wol.peoples.map(
          (people: { peopleId: string; name: string }) => ({
            id: people.peopleId,
            name: people.name,
          })
        ),
        nameHistory: wol.nameHistory,
      });
    }
    if (path === "/api/v2/peoples/PPL_WOLOF") {
      return envelope(read("peuples/FLG_ATLANTIQUE/PPL_WOLOF.json"));
    }
    if (path === "/api/v2/language-families/FLG_ATLANTIQUE") {
      return envelope(read("famille_linguistique/FLG_ATLANTIQUE.json"));
    }
    return new Response("{}", { status: 404 });
  };

  // @req REQ-178
  it("reads the reason from the Peul account that names the Wolof", async () => {
    const history = parseNameHistory(read(FULA).nameHistory).data;
    const peulAccount = history.names
      .find((entry) => entry.nameText === "Peul")
      .accounts.find((account) => /wolof/i.test(account.statement));

    const [card] = await loadNextSteps(
      [fula],
      "fr",
      undefined,
      [{ subject: fula, nameHistory: history }],
      "peul",
      corpus
    );

    expect(card).toMatchObject({
      relation: "namer",
      kind: "Peuple",
      name: "Wolof",
    });
    expect(card.reason).toMatch(/wolof/);
    expect(peulAccount.statement.startsWith(card.reason)).toBe(true);
    expect(card.reason).not.toBe(
      firstSentence(
        read("peuples/FLG_ATLANTIQUE/PPL_WOLOF.json").nameHistory.summary
      )
    );
  });
});

describe("period labels say when the account was written, or what it tells", () => {
  const ficheFiles = [
    "famille_linguistique/FLG_NILOSAHARIENNE.json",
    "famille_linguistique/FLG_NILOTIQUE.json",
    "famille_linguistique/FLG_SAHARIEN.json",
    "famille_linguistique/FLG_SONGHAY.json",
    "famille_linguistique/FLG_SOUDANIQUECENTRAL.json",
    "peuples/FLG_GUR/PPL_LOBI.json",
    "peuples/FLG_GUR/PPL_LOBI_BIRIFOR.json",
    "peuples/FLG_MANDE/PPL_DIOULA.json",
  ];
  const accounts = () =>
    ficheFiles.flatMap((file) =>
      namesOf(file).flatMap((entry) => entry.accounts)
    );

  // @req REQ-178
  it("keeps no « au présent par » label in the fiches that carried one", () => {
    expect(
      accounts()
        .map((account) => account.period.label)
        .filter((label) => /au présent par/.test(label))
    ).toEqual([]);
  });

  // The precedent of PPL_FULA (2026-10-17): a usage an author describes is
  // dated by the year of the work that describes it.
  // @req REQ-178
  it("dates by its work every account whose single source has a year", () => {
    const dated = accounts().filter((account) =>
      /^(Usage décrit|Classification exposée) en \d{4}$/.test(
        account.period.label
      )
    );

    expect(dated.length).toBeGreaterThanOrEqual(8);
    for (const account of dated) {
      const [source] = account.sources;
      expect(account.period.label.endsWith(String(source.year))).toBe(true);
      expect(account.period.from).toBe(source.year);
      expect(account.period.to).toBe(source.year);
    }
  });
});

describe("French prose keeps its accents", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = join(
      __dirname,
      `tmp_test_accents_${Date.now()}_${Math.random().toString(36).slice(2)}`
    );
    mkdirSync(tmpDir, { recursive: true });
  });

  afterEach(() => {
    if (existsSync(tmpDir)) rmSync(tmpDir, { recursive: true, force: true });
  });

  const people = (overrides: Record<string, unknown>) => ({
    id: "PPL_TEST",
    nameHistory: block([name("Testa", true)]),
    content: {
      appellations: { selfAppellation: "Testa" },
      origins: { ancientOrigins: "Le royaume est fondé au XVIe siècle." },
      sources: [],
      ...overrides,
    },
  });
  const FICHE = "peuples/FLG_TEST/PPL_TEST.json";

  // @req REQ-178
  it("flags a French word printed without its accent in the fiche's history", () => {
    writeJson(
      tmpDir,
      FICHE,
      people({
        origins: {
          ancientOrigins: "Au XIe siecle, la region passe sous un Etat voisin.",
        },
      })
    );

    const result = checkUnaccentedFrenchProse(tmpDir, {});

    expect(result.ok).toBe(false);
    expect(result.errors.join("\n")).toMatch(
      /PPL_TEST\.json.*content\.origins\.ancientOrigins.*siecle.*region.*Etat/
    );
  });

  // @req REQ-178
  it("leaves names, quotations, sources and addresses as they are written", () => {
    writeJson(
      tmpDir,
      FICHE,
      people({
        appellations: { selfAppellation: "Testa", exonyms: ["Benin"] },
        culture: {
          symbols:
            "Il cite « the region of Benin » sur https://example.org/Senegal-region.",
        },
        sources: [{ title: "Histoire de la region du Senegal", url: null }],
      })
    );

    expect(checkUnaccentedFrenchProse(tmpDir, {})).toEqual({
      ok: true,
      errors: [],
      warnings: [],
    });
  });

  // @req REQ-178
  it("holds the backlog as a two-edge ratchet, fiche by fiche", () => {
    writeJson(
      tmpDir,
      FICHE,
      people({ origins: { ancientOrigins: "Au XIe siecle, deja." } })
    );

    expect(checkUnaccentedFrenchProse(tmpDir, { [FICHE]: 2 }).ok).toBe(true);
    expect(
      checkUnaccentedFrenchProse(tmpDir, { [FICHE]: 1 }).errors.join("\n")
    ).toMatch(/PPL_TEST\.json.*2.*1/);
    expect(
      checkUnaccentedFrenchProse(tmpDir, { [FICHE]: 3 }).errors.join("\n")
    ).toMatch(/PPL_TEST\.json.*lower/);
  });

  // The thirty most-read entities: the audit of 2026-10-13 ranks ten, the
  // visit counts of 2026-10-12 the rest. These thirteen of them had words to
  // fix; every flagged sentence was reread and its accents restored.
  // @req REQ-178
  it("prints the most-read fiches with their accents", () => {
    const fixed = [
      "peuples/FLG_ATLANTIQUE/PPL_FULA.json",
      "peuples/FLG_MANDE/PPL_SONINKE.json",
      "peuples/FLG_MANDE/PPL_DIOULA.json",
      "peuples/FLG_MANDE/PPL_TOMA_LOMA.json",
      "peuples/FLG_MANDE/PPL_BAMBARA.json",
      "peuples/FLG_NIGERCONGO/PPL_NZEBI.json",
      "peuples/FLG_BANTU/PPL_MANJA.json",
      "peuples/FLG_KWA/PPL_ADIOUKROU.json",
      "peuples/FLG_BANTU/PPL_YAKA.json",
      "peuples/FLG_KROU/PPL_BASSA.json",
      "peuples/FLG_NILOTIQUE/PPL_ALUR.json",
      "peuples/FLG_NIGERCONGO/PPL_MUCUVAL.json",
      "peuples/FLG_KWA/PPL_NZEMA.json",
    ];
    const errors = checkUnaccentedFrenchProse(AFRIK, {}).errors;

    for (const file of fixed) {
      expect(
        errors.filter((error) => error.includes(file)),
        file
      ).toEqual([]);
    }
  });

  // @req REQ-178
  it("passes the corpus against its recorded backlog", () => {
    expect(checkUnaccentedFrenchProse(AFRIK).errors).toEqual([]);
  });
});
