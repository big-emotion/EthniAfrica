import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

// The operator's rulings of 2026-10-12 on the questions left by waves 10
// (peoples) and 11 (family names) of the long tail (ETNI-2011). Each case
// reads the fiche a reader would get.

const ROOT = process.cwd();
const AFRIK = resolve(ROOT, "dataset/source/afrik");

function readFiche(relativePath: string) {
  return JSON.parse(
    readFileSync(resolve(AFRIK, `${relativePath}.json`), "utf8")
  );
}

function readDoc(relativePath: string) {
  return readFileSync(resolve(ROOT, relativePath), "utf8");
}

interface Source {
  title: string;
  url: string | null;
  page?: string;
}

interface Account {
  period: { from: number | null; to: number | null };
  era?: string;
  statement: string;
  birth?: true;
  formAsWritten?: string;
  sources: Source[];
}

interface NameEntry {
  nameText: string;
  selfGiven: boolean;
  accounts: Account[];
}

interface NameHistory {
  summary: string;
  selfNameUnknown?: true;
  names: NameEntry[];
}

function nameOf(nameHistory: NameHistory, name: string) {
  const entry = nameHistory.names.find(
    (candidate) => candidate.nameText === name
  );
  if (!entry) throw new Error(`no name « ${name} »`);
  return entry;
}

function accountsFrom(fiche: string, name: string, from: number | null) {
  return nameOf(readFiche(fiche).nameHistory, name).accounts.filter(
    (account) => account.period.from === from
  );
}

// [fiche, name, period.from, era]. `null` era: ruled to stay without one.
const ERA_RULINGS: Array<[string, string, number, string | null]> = [
  // Before colonial rule.
  ["peuples/FLG_TUU/PPL_NUU", "Nǀusan", 1861, "polity"],
  ["peuples/FLG_NIGERCONGO/PPL_BAFUTA", "Bafut", 1889, "polity"],
  // Rule 5: the Portuguese fort does not make Pate colonial.
  ["peuples/FLG_NIGERCONGO/PPL_SWAHILI_SOMALIE", "Gunya", 1598, "polity"],
  ["peuples/FLG_NIGERCONGO/PPL_SWAHILI_SOMALIE", "Bajuni", 1678, "polity"],
  // Gondokoro before 1871, as the 1877 Alur letter.
  ["patronymes/PAT_WANI", "Wani", 1864, "polity"],
  ["patronymes/PAT_WANI", "Wani", 1867, "polity"],
  // An Italian gazette takes the bearer's territory.
  ["patronymes/PAT_TADESSE", "Tadesse", 1936, "colonial"],
  ["patronymes/PAT_WABERI", "Waberi", 1964, "modern"],
  ["patronymes/PAT_TESFAYE", "Tesfaye", 1853, "polity"],
  ["patronymes/PAT_TESHOME", "Teshome", 1914, null],
  // Confirmed as they were.
  ["peuples/FLG_AUSTRONESIENNE/PPL_ANTAMBAHOAKA", "Zafiraminia", 1661, null],
  ["peuples/FLG_KROU/PPL_KROUMEN", "Kroumen", 1803, null],
  ["peuples/FLG_BANTU/PPL_FANG", "Pamue", 1965, null],
  ["patronymes/PAT_SOUMARE", "Soumaré", 1881, null],
  ["patronymes/PAT_TJIRIANGE", "Tjiriange", 1977, null],
  ["patronymes/PAT_WAFULA", "Wafula", 1961, null],
  ["patronymes/PAT_VAZ", "Vaz", 1463, null],
  ["patronymes/PAT_VAZ", "Vaz", 1928, null],
  ["patronymes/PAT_VIEIRA", "Vieira", 1601, null],
  ["patronymes/PAT_VIEIRA", "Vieira", 1928, null],
  ["peuples/FLG_BANTU/PPL_TWA", "Batwa", 1891, "colonial"],
];

describe("era rulings on waves 10 and 11", () => {
  // @req REQ-178
  it.each(ERA_RULINGS)("%s « %s » %s is %s", (fiche, name, from, era) => {
    const accounts = accountsFrom(fiche, name, from);

    expect(accounts.length).toBeGreaterThan(0);
    for (const account of accounts) expect(account.era ?? null).toBe(era);
  });

  // @req REQ-178
  it("records the rulings and a Fouta-Djalon row in the colonial-periods table", () => {
    const doc = readDoc("docs/editorial/strategy/colonial-periods.md");

    expect(doc).toMatch(/\| Fouta-Djalon/);
    // The ruling wrote 14 July; every source opened gives 5 July.
    expect(doc).toContain("5 July 1881");
    expect(doc).toContain("6 February 1897");
    expect(doc).toMatch(/## The rulings on waves 10 and 11, ruled 2026-10-12/);
    expect(doc).toContain("Gondokoro");
  });
});

describe("a people whose self-name no source gives", () => {
  // @req REQ-196
  it("PPL_SHUA says it does not know the self-name instead of hedging one", () => {
    const { nameHistory } = readFiche("peuples/FLG_KHOE/PPL_SHUA");

    expect(nameHistory.selfNameUnknown).toBe(true);
    expect(nameHistory.names.some((name: NameEntry) => name.selfGiven)).toBe(
      false
    );
    expect(JSON.stringify(nameHistory)).not.toContain("se nommerait");
    expect(nameHistory.summary).toMatch(
      /ne sait pas comment ce peuple se nomme/
    );
  });

  // @req REQ-196
  it("PPL_HOA carries a name history that says the self-name is unknown", () => {
    const { nameHistory } = readFiche("peuples/FLG_KXA/PPL_HOA");

    expect(nameHistory.selfNameUnknown).toBe(true);
    expect(nameHistory.names.some((name: NameEntry) => name.selfGiven)).toBe(
      false
    );
    expect(nameHistory.summary).toMatch(
      /ne sait pas comment ce peuple se nomme/
    );
    expect(nameHistory.names.map((name: NameEntry) => name.nameText)).toEqual(
      expect.arrayContaining(["ǂHoan", "ǂ'Amkoe"])
    );
  });
});

describe("self-names checked on waves 10 and 11", () => {
  // @req REQ-178
  it("PPL_MANIANGA keeps BaManianga as the name the people gives itself", () => {
    const { nameHistory } = readFiche("peuples/FLG_NIGERCONGO/PPL_MANIANGA");

    expect(nameOf(nameHistory, "BaManianga").selfGiven).toBe(true);
  });

  // Neither Laman (1936) nor Van Bulck (1948) says the Manianga call
  // themselves Basundi.
  // @req REQ-178
  it("PPL_MANIANGA no longer marks Basundi as self-given", () => {
    const { nameHistory } = readFiche("peuples/FLG_NIGERCONGO/PPL_MANIANGA");

    expect(nameOf(nameHistory, "Basundi").selfGiven).toBe(false);
    expect(nameHistory.summary).toMatch(/Basundi, mais aucune source/);
  });

  // @req REQ-178
  it("PPL_BAKWE keeps Bakwé and adds Srigbe on Schwartz", () => {
    const { nameHistory } = readFiche("peuples/FLG_KROU/PPL_BAKWE");
    const srigbe = nameOf(nameHistory, "Srigbe");

    expect(nameOf(nameHistory, "Bakwé").selfGiven).toBe(true);
    expect(srigbe.selfGiven).toBe(true);
    expect(srigbe.accounts[0].sources[0]).toMatchObject({
      url: expect.stringContaining("37792.pdf"),
      page: "p. 88",
    });
  });
});

describe("family-name classification on waves 10 and 11", () => {
  // Personal and birth names, filed as clan names before the waves: the
  // PAT_NYOBE / PAT_RAMGOOLAM precedent (#1665).
  // @req REQ-133
  it.each([
    "PAT_ZINSOU",
    "PAT_YAO",
    "PAT_YOHANNES",
    "PAT_TADROS",
    "PAT_WANI",
    "PAT_TSHISEKEDI",
  ])("%s is filed as a personal name, not a clan name", (id) => {
    const fiche = readFiche(`patronymes/${id}`);

    expect(fiche.nameSystem).toBe("non_hereditary_patronymic");
    expect(fiche.designatedSocialUnit).toBe("individual");
    expect(JSON.stringify(fiche.gaps)).not.toMatch(/Le nom de clan ne/);
  });

  // The model has no class for a hereditary family name of European origin:
  // it keeps the closest one, says why, and drops the clan as its unit.
  // @req REQ-133
  it("PAT_VIEIRA is a family name of Portuguese origin, not a Pepel clan", () => {
    const fiche = readFiche("patronymes/PAT_VIEIRA");

    expect(fiche.designatedSocialUnit).not.toBe("clan");
    expect(
      fiche.gaps.find(
        (gap: { fieldPath: string }) => gap.fieldPath === "nameSystem"
      )?.reason
    ).toMatch(/portugais/);
  });
});

describe("source rulings on wave 11", () => {
  const nameHistoryOf = (id: string): NameHistory =>
    readFiche(`patronymes/${id}`).nameHistory;

  // @req REQ-133
  it.each([
    ["PAT_WOLDE", "Wolde"],
    ["PAT_TESHOME", "Teshome"],
  ])(
    "%s drops the hypothesis that rests only on our own reading of Leslau",
    (id, name) => {
      const accounts = nameOf(nameHistoryOf(id), name).accounts;

      expect(
        accounts.some((account) =>
          /lecture que nous faisons/.test(account.statement)
        )
      ).toBe(false);
      expect(JSON.stringify(accounts)).not.toContain("Leslau");
    }
  );

  // @req REQ-133
  it("PAT_WABERI keeps its only origin, labelled as our own reading", () => {
    const accounts = nameOf(nameHistoryOf("PAT_WABERI"), "Waberi").accounts;

    expect(
      accounts.some((account) =>
        /lecture que nous faisons/.test(account.statement)
      )
    ).toBe(true);
  });

  // @req REQ-133
  it("PAT_VIEIRA no longer rests an account on our own Papel fiche", () => {
    expect(JSON.stringify(nameHistoryOf("PAT_VIEIRA"))).not.toContain(
      "fiche EthniAfrica"
    );
  });

  // @req REQ-133
  it("PAT_YOHANNES is born, as a close form in Ge'ez script, in Dillmann 1865", () => {
    const birth = nameOf(
      nameHistoryOf("PAT_YOHANNES"),
      "Yohannes"
    ).accounts.find((account) => account.birth);

    expect(birth.formAsWritten).toBe("ዮሐንስ");
    expect(birth.statement).toMatch(/une forme proche/);
    expect(birth.sources[0]).toMatchObject({
      url: "https://archive.org/details/lexiconlinguaeae00dilluoft",
      page: "col. 1421",
    });
  });

  // @req REQ-133
  it("PAT_SOUMANOU no longer cites the ministry list that no longer opens", () => {
    expect(JSON.stringify(readFiche("patronymes/PAT_SOUMANOU"))).not.toMatch(
      /travail\.gouv\.bj|benin-mtfp/
    );
  });

  // @req REQ-133
  it("PAT_MUKASA cites Roscoe 1911 at the corpus locator", () => {
    const roscoe = readFiche("patronymes/PAT_MUKASA").sources.find(
      (source: { sourceKey: string }) =>
        source.sourceKey === "roscoe-1911-baganda"
    );

    expect(roscoe.title).toBe(
      "The Baganda: An Account of their Native Customs and Beliefs"
    );
    expect(roscoe.url).toBe(
      "https://archive.org/details/bagandaaccountof00roscuoft"
    );
  });
});

describe("lists kept for waves 10 and 11", () => {
  // @req REQ-178
  it("records the source and classification rulings", () => {
    const doc = readDoc(
      "docs/editorial/strategy/name-history-priority-core.md"
    );

    expect(doc).toMatch(/Waves 10 and 11 of the long tail/);
    expect(doc).toContain("`PAT_YALINGA`");
    expect(doc).toContain("`PAT_YAKITE`");
    expect(doc).toContain("selfNameUnknown");
  });
});
