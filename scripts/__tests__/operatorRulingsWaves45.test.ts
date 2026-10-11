import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

// The operator's rulings of 2026-10-11 on the questions left by waves 4 and 5
// of the long tail (ETNI-2011). Each case reads the fiche a reader would get.

const AFRIK = resolve(process.cwd(), "dataset/source/afrik");

function readFiche(relativePath: string) {
  return JSON.parse(
    readFileSync(resolve(AFRIK, `${relativePath}.json`), "utf8")
  );
}

interface Account {
  period: { from: number | null; to: number | null };
  era?: string;
  statement: string;
  birth?: true;
}

interface NameEntry {
  nameText: string;
  selfGiven: boolean;
  accounts: Account[];
}

function nameOf(fiche: { nameHistory: { names: NameEntry[] } }, name: string) {
  const entry = fiche.nameHistory.names.find(
    (candidate) => candidate.nameText === name
  );
  if (!entry) throw new Error(`no name « ${name} »`);
  return entry;
}

function accountsFrom(fiche: string, name: string, from: number) {
  return nameOf(readFiche(fiche), name).accounts.filter(
    (account) => account.period.from === from
  );
}

// [fiche, name, period.from, era]
const ERA_RULINGS: Array<[string, string, number, string]> = [
  ["peuples/FLG_BANTU/PPL_OVAMBO", "Ovambo", 1891, "polity"],
  ["peuples/FLG_BANTU/PPL_OVAMBO", "Ovambo", 1894, "polity"],
  ["peuples/FLG_BANTU/PPL_CHAGA", "Wachagga", 1884, "polity"],
  ["peuples/FLG_BANTU/PPL_MERU", "Ameru", 1893, "polity"],
  ["langues/wol", "Wolof", 1826, "polity"],
  ["langues/wol", "Jolof", 1854, "polity"],
  ["langues/yor", "Yoruba", 1854, "polity"],
  ["peuples/FLG_MANDE/PPL_DAN", "Gio", 1854, "polity"],
  ["peuples/FLG_MANDE/PPL_MENDE", "Nongoba", 1854, "polity"],
  ["peuples/FLG_BANTU/PPL_GBAYA", "Baya", 1893, "polity"],
  ["peuples/FLG_BANTU/PPL_NYATURU", "Nyaturu", 1870, "polity"],
  ["peuples/FLG_BANTU/PPL_IRAMBA", "Iramba", 1893, "polity"],
  ["peuples/FLG_BANTU/PPL_IRAMBA", "Nyiramba", 1894, "polity"],
  ["peuples/FLG_COUCHITIQUE/PPL_IRAQW", "Iraqw", 1893, "polity"],
  ["peuples/FLG_COUCHITIQUE/PPL_IRAQW", "Mbulu", 1894, "polity"],
  ["peuples/FLG_BANTU/PPL_HAVU", "Bahavu", 1894, "polity"],
  ["langues/grb", "Grebo", 1850, "colonial"],
  ["langues/plt", "Malagasy", 1658, "colonial"],
  ["peuples/FLG_BANTU/PPL_BATOORO", "Toro", 1891, "colonial"],
];

describe("eras ruled on 2026-10-11 for waves 4 and 5", () => {
  // @req REQ-196
  it.each(ERA_RULINGS)("%s « %s » (%i) is %s", (fiche, name, from, era) => {
    const accounts = accountsFrom(fiche, name, from);

    expect(accounts.length).toBeGreaterThan(0);
    for (const account of accounts) expect(account.era).toBe(era);
  });

  // Marno's Bertat country was taxed by Egypt only in its northern part; none
  // of these accounts says which part it is about, so none carries an era.
  // @req REQ-196
  it("leaves Marno's Bertat accounts without an era", () => {
    const wti = readFiche("langues/wti");
    const marno = wti.nameHistory.names.flatMap((name: NameEntry) =>
      name.accounts.filter((account) => account.period.from === 1869)
    );

    expect(marno.length).toBeGreaterThan(0);
    for (const account of marno) expect(account.era).toBeUndefined();
  });

  // @req REQ-196
  it("keeps the uncertain older traces of Suso and Mendi as traces, not births", () => {
    expect(
      accountsFrom("peuples/FLG_MANDE/PPL_SOUSSOU", "Soso", 1376)[0].birth
    ).toBeUndefined();
    expect(
      accountsFrom("peuples/FLG_MANDE/PPL_MENDE", "Mende", 1668)[0].birth
    ).toBeUndefined();
  });
});

describe("names and links ruled on 2026-10-11", () => {
  // Werther, 1898: a people east of Lake Eyasi « se nomme Watindiga ».
  // @req REQ-196
  it("marks Tindiga as a name the Hadza gave themselves", () => {
    expect(nameOf(readFiche("langues/hts"), "Tindiga").selfGiven).toBe(true);
  });

  // @req REQ-178
  it.each([
    ["mos", "PPL_MOSSI"],
    ["wol", "PPL_WOLOF"],
    ["som", "PPL_SOMALI"],
    ["naq", "PPL_NAMA"],
    ["tuq", "PPL_TOUBOU"],
    ["wal", "PPL_WOLAYTA"],
    ["plt", "PPL_MERINA"],
  ])("links the language %s to %s", (iso, peopleId) => {
    const language = readFiche(`langues/${iso}`);

    expect(
      language.peoples.map((people: { peopleId: string }) => people.peopleId)
    ).toContain(peopleId);
  });

  // Sebat Bet Gurage (sgw) is an Ethio-Semitic language.
  // @req REQ-178
  it("files the Sebat Bet Gurage under the Semitic family", () => {
    expect(
      existsSync(resolve(AFRIK, "peuples/FLG_COUCHITIQUE/PPL_SEBATBET.json"))
    ).toBe(false);
    const fiche = readFiche("peuples/FLG_SEMITIQUE/PPL_SEBATBET");

    expect(fiche.languageFamilyId).toBe("FLG_SEMITIQUE");
    expect(fiche.content.appellations.linguisticFamily).toBe("FLG_SEMITIQUE");
  });
});

describe("the Hutu fiches, one per country", () => {
  const burundi = () => readFiche("peuples/FLG_NIGERCONGO/PPL_KIRUNDI_HUTU");
  const rwanda = () => readFiche("peuples/FLG_BANTU/PPL_RWANDAIS_HUTU");
  const countriesOf = (fiche: {
    content: { demography: { distributionByCountry: { country: string }[] } };
  }) =>
    fiche.content.demography.distributionByCountry.map((row) => row.country);

  // @req REQ-178
  it("keeps PPL_KIRUNDI_HUTU to Burundi and Kirundi", () => {
    const fiche = burundi();

    expect(fiche.currentCountries).toEqual(["BDI"]);
    expect(fiche.content.appellations.currentCountries).toEqual(["BDI"]);
    expect(countriesOf(fiche)).toEqual(["BDI"]);
    expect(fiche.content.languages.isoCodes).toEqual(["run"]);
  });

  // The Kinyarwanda-speaking Hutu of Kivu and Kisoro stay with the Rwandan
  // fiche: they speak its language, and COD's country fiche links it.
  // @req REQ-178
  it("keeps PPL_RWANDAIS_HUTU to Rwanda and its Kinyarwanda-speaking communities", () => {
    const fiche = rwanda();

    expect(fiche.currentCountries).not.toContain("BDI");
    expect(fiche.currentCountries).not.toContain("TZA");
    expect(countriesOf(fiche)).not.toContain("BDI");
    expect(fiche.content.languages.isoCodes).toEqual(["kin"]);
  });

  // Moved, not dropped: what one fiche said about the other country is now
  // on the fiche for that country.
  // @req REQ-178
  it("moves each country's content to its own fiche", () => {
    const rwandan = JSON.stringify(rwanda().content);
    const burundian = JSON.stringify(burundi().content);

    expect(rwandan).toContain("Kinyabwisha");
    expect(rwandan).toContain("Dialectes régionaux du Kivu");
    expect(burundian).toContain("Tanzanie");
    expect(burundian).not.toContain("Kinyarwanda standard");
    expect(
      rwanda().content.ethnicities.filter((line: string) =>
        line.includes("Burundi")
      )
    ).toEqual([]);
  });
});

describe("Toucouleur, told once", () => {
  // PPL_FULA carries the full accounts; the Futa Toro sub-group points to it.
  // @req REQ-196
  it("keeps the full Toucouleur history on PPL_FULA and a pointer on PPL_HALPULAAR", () => {
    const fula = nameOf(
      readFiche("peuples/FLG_ATLANTIQUE/PPL_FULA"),
      "Toucouleur"
    );
    const halpulaar = nameOf(
      readFiche("peuples/FLG_NIGERCONGO/PPL_HALPULAAR"),
      "Toucouleur"
    );

    expect(fula.accounts.some((account) => account.birth)).toBe(true);
    expect(halpulaar.accounts).toHaveLength(1);
    expect(halpulaar.accounts[0].statement).toMatch(/fiche des Peuls/);
  });
});

describe("the operator's lists", () => {
  const read = (path: string) =>
    readFileSync(resolve(process.cwd(), path), "utf8");

  // @req REQ-196
  it.each([
    "PPL_BEROM",
    "PPL_BONO",
    "PPL_TSWA",
    "PPL_BANTOUS_SOMALIENS",
    "PPL_AGAW",
    "PPL_NYATURU",
    "PPL_LUNGU",
    "PPL_TABWA",
    "PPL_FRAFRA",
    "PPL_DAWRO",
    "PPL_IRAMBA",
    "PPL_GUAN",
    "PPL_NGANGUELA",
    "PPL_TEKE",
    "PPL_HAYA",
    "PPL_HARATINE",
    "PPL_HADIYA",
    "PPL_AKYE",
  ])("lists %s for the oral check", (id) => {
    expect(
      read("docs/editorial/strategy/self-names-to-verify-orally.md")
    ).toContain(`\`${id}\``);
  });

  // @req REQ-196
  it("records the wave 4 and 5 era rulings and the sources to upgrade", () => {
    expect(read("docs/editorial/strategy/colonial-periods.md")).toMatch(
      /waves 4 and 5[^\n]*2026-10-11/i
    );
    const core = read("docs/editorial/strategy/name-history-priority-core.md");
    for (const id of [
      "PPL_FRAFRA",
      "PPL_ANAGO",
      "PPL_EBIRA",
      "PPL_MAKONDE",
      "PPL_HADIYA",
    ]) {
      expect(core, id).toContain(`\`${id}\``);
    }
  });
});
