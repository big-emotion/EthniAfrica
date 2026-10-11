import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

// The operator's rulings of 2026-10-11 on the questions left by waves 8
// (peoples) and 9 (family names) of the long tail (ETNI-2011), and the fiche
// errors those waves found. Each case reads the fiche a reader would get.

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

interface Account {
  period: { from: number | null; to: number | null };
  era?: string;
  statement: string;
}

interface NameEntry {
  nameText: string;
  accounts: Account[];
}

interface Fiche {
  nameHistory: { names: NameEntry[] };
}

function nameOf(fiche: Fiche, name: string) {
  const entry = fiche.nameHistory.names.find(
    (candidate) => candidate.nameText === name
  );
  if (!entry) throw new Error(`no name « ${name} »`);
  return entry;
}

function accountsFrom(fiche: string, name: string, from: number | null) {
  return nameOf(readFiche(fiche), name).accounts.filter(
    (account) => account.period.from === from
  );
}

// [fiche, name, period.from, era]. `null` era: ruled to stay without one.
const ERA_RULINGS: Array<[string, string, number | null, string | null]> = [
  // Under the colonising state.
  ["patronymes/PAT_NZINGA", "Ginga", 1626, "colonial"],
  ["patronymes/PAT_DANJUMA", "Danjuma", 1914, "colonial"],
  ["patronymes/PAT_TAIWO", "Taiwo", 1884, "colonial"],
  ["patronymes/PAT_SEERUTTUN", "Seeruttun", 1857, "colonial"],
  ["patronymes/PAT_SEERUTTUN", "Seeruttun", 1858, "colonial"],
  ["patronymes/PAT_PAYET", "Payet", 1674, "colonial"],
  ["peuples/FLG_KROU/PPL_DIDA", "Dida", 1904, "colonial"],
  ["peuples/FLG_KWA/PPL_KROBO", "Krobo", 1858, "colonial"],
  ["peuples/FLG_KWA/PPL_KROBO", "Klo", 1871, "colonial"],
  // Before colonial rule: a trading post does not make a coast colonial.
  ["peuples/FLG_ATLANTIQUE/PPL_MANJAK", "Kanyop", 1854, "polity"],
  ["peuples/FLG_GUR/PPL_KOULANGO", "Pakhalla", 1889, "polity"],
  ["peuples/FLG_GUR/PPL_KOULANGO", "Koulango", 1893, "polity"],
  ["peuples/FLG_AUSTRONESIENNE/PPL_ANTAKARANA", "Antakarana", 1845, "polity"],
  // Richardson's preface is dated 1 May 1885, before the treaty of 17 Dec.
  ["patronymes/PAT_ZAFY", "Zafy", 1885, "polity"],
  // No era.
  ["patronymes/PAT_TROVOADA", "Trovoada", 1975, null],
  ["patronymes/PAT_SALIFOU", "Salifou", 1885, null],
  ["peuples/FLG_KROU/PPL_GREBO", "Grebo", 1854, null],
  ["peuples/FLG_NILOSAHARIENNE/PPL_BERTA", "Berta", 1821, null],
  ["peuples/FLG_SAHARIEN/PPL_DAZA", "Gorane", null, null],
  ["peuples/FLG_SAHARIEN/PPL_TOUBOU", "Gorane", null, null],
];

describe("era rulings on waves 8 and 9", () => {
  // @req REQ-178
  it.each(ERA_RULINGS)("%s « %s » %s is %s", (fiche, name, from, era) => {
    const accounts = accountsFrom(fiche, name, from).filter(
      (account) => from !== null || /728/.test(JSON.stringify(account))
    );

    expect(accounts.length).toBeGreaterThan(0);
    for (const account of accounts) expect(account.era ?? null).toBe(era);
  });

  // @req REQ-178
  it("records the rulings and a Krobo row in the colonial-periods table", () => {
    const doc = readDoc("docs/editorial/strategy/colonial-periods.md");

    expect(doc).toMatch(/\| Krobo/);
    expect(doc).toMatch(/waves 8 and 9/);
    expect(doc).toContain("Richardson");
  });
});

describe("fiche errors found by waves 8 and 9", () => {
  const text = (id: string) => JSON.stringify(readFiche(`patronymes/${id}`));

  // @req REQ-133
  it("PAT_COMPAORE no longer says the lineage was once called Savadogo", () => {
    expect(text("PAT_COMPAORE")).not.toContain("Savadogo");
  });

  // @req REQ-133
  it("PAT_GHEBREMICHAEL_PATRONYMIC cites only what its sources say", () => {
    const fiche = readFiche("patronymes/PAT_GHEBREMICHAEL_PATRONYMIC");
    const serialized = JSON.stringify(fiche);

    expect(fiche.patronymicChainDepth).toBeUndefined();
    expect(serialized).not.toContain("familysearch");
    expect(serialized).not.toMatch(/grand-père servant/);
    expect(fiche.origin.linguisticReconstructions[0].claimStatus).not.toBe(
      "established"
    );
  });

  // @req REQ-133
  it("PAT_DIOMANDE points at the Malinké, not at the Dan", () => {
    const peoples = readFiche("patronymes/PAT_DIOMANDE").peoples.map(
      (entry: { peopleId: string }) => entry.peopleId
    );

    expect(peoples).toEqual(["PPL_MALINKE"]);
  });

  // @req REQ-133
  it("PAT_IDRISSA drops the unsourced spelling Idrissou", () => {
    expect(text("PAT_IDRISSA")).not.toContain("Idrissou");
  });

  // @req REQ-133
  it("PAT_NYOBE drops the Wikipedia-only note on Um Nyobè's father", () => {
    expect(text("PAT_NYOBE")).not.toMatch(/wikip/i);
  });

  // @req REQ-133
  it.each(["PAT_SORO", "PAT_SILUE"])(
    "%s dates Tauxier's manuscript to 1921–1922, first printed in 2003",
    (id) => {
      expect(text(id)).not.toContain("publiée en 1921");
    }
  );

  // @req REQ-133
  it("PAT_RAMGOOLAM is a name that was first a given name", () => {
    const fiche = readFiche("patronymes/PAT_RAMGOOLAM");

    expect(fiche.nameSystem).toBe("non_hereditary_patronymic");
    expect(fiche.transmissionMode).toBe("other");
  });

  // The model has no `other` name system: the closest class is the one
  // PAT_NYOBE already uses for a personal name become a family name.
  // @req REQ-133
  it.each(["PAT_SOKOINE", "PAT_NZINGA", "PAT_NGOLA"])(
    "%s is no longer filed as a clan name",
    (id) => {
      const fiche = readFiche(`patronymes/${id}`);

      expect(fiche.nameSystem).not.toBe("clan_name");
      expect(
        fiche.gaps.some(
          (gap: { fieldPath: string }) => gap.fieldPath === "nameSystem"
        )
      ).toBe(true);
    }
  );

  // @req REQ-178
  it("PPL_EKET speaks Ekit, ISO eke", () => {
    expect(
      readFiche("peuples/FLG_NIGERCONGO/PPL_EKET").content.languages.isoCodes
    ).toEqual(["eke"]);
  });

  // @req REQ-178
  it("dates Abayneh's Tembaro thesis to 2019", () => {
    const titles = readFiche(
      "peuples/FLG_COUCHITIQUE/PPL_TIMBARO"
    ).content.sources.map((source: { title: string }) => source.title);

    expect(titles.some((title: string) => /Abayneh.*2019/.test(title))).toBe(
      true
    );
    expect(titles.some((title: string) => /Abayneh.*2014/.test(title))).toBe(
      false
    );
  });
});

describe("lists kept for waves 8 and 9", () => {
  // @req REQ-178
  it("adds Ekid and Ngbanya to the oral verification list", () => {
    const doc = readDoc(
      "docs/editorial/strategy/self-names-to-verify-orally.md"
    );

    expect(doc).toContain("`PPL_EKET`");
    expect(doc).toContain("`PPL_GONJA`");
  });

  // @req REQ-178
  it("records the source rulings and the Berta follow-up", () => {
    const doc = readDoc(
      "docs/editorial/strategy/name-history-priority-core.md"
    );

    expect(doc).toMatch(/Waves 8 and 9 of the long tail/);
    expect(doc).toContain("Wikinames");
    expect(doc).toContain("Benishangul");
  });
});
