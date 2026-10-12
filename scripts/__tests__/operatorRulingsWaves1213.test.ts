import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";

import { describe, expect, it } from "vitest";

// The operator's rulings of 2026-10-12 on the questions left by waves 12
// (peoples) and 13 (family names) of the long tail (ETNI-2011), and the
// source errors those waves found. Each case reads the fiche a reader would get.

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

interface Source {
  title?: string;
  url?: string | null;
  year?: number;
}

function nameOf(fiche: Fiche, name: string) {
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

function corpusFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    if (entry === "archive") return [];
    if (statSync(path).isDirectory()) return corpusFiles(path);
    return path.endsWith(".json") ? [path] : [];
  });
}

// Every source citation in the corpus, wherever a fiche nests it.
function corpusSources(): Source[] {
  const found: Source[] = [];
  const visit = (node: unknown) => {
    if (Array.isArray(node)) return node.forEach(visit);
    if (typeof node !== "object" || node === null) return;
    for (const [key, value] of Object.entries(node)) {
      if (key === "sources" && Array.isArray(value)) found.push(...value);
      visit(value);
    }
  };
  for (const file of corpusFiles(AFRIK)) {
    try {
      visit(JSON.parse(readFileSync(file, "utf8")));
    } catch {
      // Non-fiche JSON (CSV companions, malformed drafts) carries no source.
    }
  }
  return found;
}

// [fiche, name, period.from, era]. `null` era: ruled to stay without one.
const ERA_RULINGS: Array<[string, string, number, string | null]> = [
  // Petherick's Moru of 1862, before Egyptian rule reached them.
  ["peuples/FLG_SOUDANIQUECENTRAL/PPL_MORU", "Moru", 1862, "polity"],
  ["peuples/FLG_SOUDANIQUECENTRAL/PPL_MORU", "Madi", 1862, "polity"],
  // The 1693 Cape register names a people beyond the colony (Ogilby/Namaqua).
  ["peuples/FLG_CREOLE/PPL_KHOISAN_CREOLE", "Griqua", 1693, "polity"],
  ["peuples/FLG_CREOLE/PPL_KHOISAN_CREOLE", "Baster", 1790, "colonial"],
  ["peuples/FLG_CREOLE/PPL_KHOISAN_CREOLE", "Bastaard", 1786, "colonial"],
  // Von Höhnel at Lake Rudolf, 1888–1894.
  ["peuples/FLG_NILOTIQUE/PPL_EL_MOLO", "El Molo", 1888, "polity"],
  ["peuples/FLG_NILOTIQUE/PPL_SAMBURU", "Samburu", 1887, "polity"],
  ["peuples/FLG_NILOTIQUE/PPL_TURKANA", "Turkana", 1888, "polity"],
  ["patronymes/PAT_SHONGWE", "Shongwe", 1856, "polity"],
  // Fieldwork in Northern Rhodesia 1958–1961 decides, not the 1965 record.
  ["patronymes/PAT_SAKALA", "Sakala", 1958, "colonial"],
  ["patronymes/PAT_PHIRI", "Phiri", 1400, "polity"],
  ["patronymes/PAT_SAVIMBI", "Savimbi", 1902, "colonial"],
  ["patronymes/PAT_SAVIMBI", "Savimbi", 1987, null],
  // Confirmed as they are.
  ["patronymes/PAT_SHENOUDA", "Shenouda", 400, "polity"],
  ["patronymes/PAT_SHENOUDA", "Shenouda", 550, "polity"],
  ["peuples/FLG_MANDE/PPL_VAI", "Vai", 1820, null],
  ["peuples/FLG_ATLANTIQUE/PPL_GOLA", "Gola", 1854, null],
  ["peuples/FLG_ATLANTIQUE/PPL_DIAWAMBE", "Diawambé", 1856, null],
  ["patronymes/PAT_OWUSU", "Owusu", 1847, null],
  ["peuples/FLG_BERBERE/PPL_MOZABITE", "Mozabites", 1845, "polity"],
];

describe("era rulings on waves 12 and 13", () => {
  // @req REQ-178
  it.each(ERA_RULINGS)("%s « %s » %s is %s", (fiche, name, from, era) => {
    const accounts = accountsFrom(fiche, name, from);

    expect(accounts.length).toBeGreaterThan(0);
    for (const account of accounts) expect(account.era ?? null).toBe(era);
  });

  // @req REQ-178
  it.each(["PPL_BELANDA", "PPL_BONGO", "PPL_KRESH"])(
    "%s leaves the Bahr el-Ghazal zariba country of 1858–1874 without an era",
    (id) => {
      const fiche: Fiche = readFiche(`peuples/FLG_SOUDANIQUECENTRAL/${id}`);
      const zariba = fiche.nameHistory.names
        .flatMap((entry) => entry.accounts)
        .filter(
          ({ period }) =>
            period.from !== null && period.from >= 1858 && period.from <= 1874
        );

      expect(zariba.length).toBeGreaterThan(0);
      for (const account of zariba) expect(account.era).toBeUndefined();
    }
  );

  // Both Sakala accounts rest on the Petauke record of that fieldwork.
  // @req REQ-178
  it("dates both Sakala accounts by the Petauke fieldwork", () => {
    const fiche: Fiche = readFiche("patronymes/PAT_SAKALA");
    const accounts = fiche.nameHistory.names.flatMap((entry) => entry.accounts);

    expect(accounts).toHaveLength(2);
    for (const account of accounts) expect(account.era).toBe("colonial");
  });

  // @req REQ-178
  it("leaves Mayotte after 1975 without an era, like Réunion", () => {
    const fiche: Fiche = readFiche("patronymes/PAT_SOILIHI");
    const accounts = fiche.nameHistory.names.flatMap((entry) => entry.accounts);

    expect(accounts.length).toBeGreaterThan(0);
    for (const account of accounts) expect(account.era).toBeUndefined();
  });

  // @req REQ-178
  it("records a Mzab row, Mayotte and the rulings in the colonial-periods table", () => {
    const doc = readDoc("docs/editorial/strategy/colonial-periods.md");

    expect(doc).toMatch(/\| Mzab/);
    expect(doc).toContain("29 April 1853");
    expect(doc).toMatch(/Mayotte[^\n]*no era/);
    expect(doc).toMatch(/The rulings on waves 12 and 13, ruled 2026-10-12/);
  });
});

describe("fiche and source fixes found by waves 12 and 13", () => {
  // @req REQ-178
  it("files PPL_KAKWA under the Nilotic family", () => {
    const oldPath = "peuples/FLG_SOUDANIQUECENTRAL/PPL_KAKWA.json";
    const fiche = readFiche("peuples/FLG_NILOTIQUE/PPL_KAKWA");

    expect(existsSync(resolve(AFRIK, oldPath))).toBe(false);
    expect(fiche.languageFamilyId).toBe("FLG_NILOTIQUE");
    expect(fiche.content.appellations.linguisticFamily).toBe("FLG_NILOTIQUE");
  });

  // @req REQ-133
  it("cites each Basutoland Records volume under one title", () => {
    const records = corpusSources().filter((source) =>
      /basutolandrecor/.test(source.url ?? "")
    );
    const titlesByUrl = new Map<string, Set<string>>();
    for (const { url, title } of records) {
      titlesByUrl.set(url, (titlesByUrl.get(url) ?? new Set()).add(title));
    }

    expect(
      titlesByUrl.get("https://archive.org/details/basutolandrecor00theagoog")
    ).toEqual(new Set(["Basutoland Records, vol. II (1853-1861)"]));
    expect(
      titlesByUrl.get("https://archive.org/details/basutolandrecord01basu")
    ).toEqual(new Set(["Basutoland Records, vol. I (1833-1852)"]));
  });

  // @req REQ-133
  it("cites Edhina Ekogidho only through the open UNAM copy", () => {
    const ekogidho = corpusSources().filter((source) =>
      /Ekogidho/.test(source.title ?? "")
    );

    expect(ekogidho.length).toBeGreaterThan(0);
    for (const source of ekogidho) {
      expect(source.url).toBe(
        "https://digital.unam.edu.na/bitstream/handle/11070.1/21230/Ekogidho_2003.pdf?isAllowed=y&sequence=1"
      );
    }
    expect(JSON.stringify(corpusSources())).not.toContain("10138/151197");
  });

  // @req REQ-133
  it("dates Ibn Battûta's tome II to its second printing of 1877", () => {
    const tomeTwo = corpusSources().filter(
      (source) => source.url === "https://archive.org/details/ldpd_5998008_001"
    );

    expect(tomeTwo.length).toBeGreaterThan(0);
    for (const source of tomeTwo) expect(source.year).toBe(1877);
  });

  // @req REQ-133
  it("files PAT_OWUSU as a personal name, not a clan name", () => {
    const fiche = readFiche("patronymes/PAT_OWUSU");

    expect(fiche.nameSystem).toBe("non_hereditary_patronymic");
    expect(fiche.designatedSocialUnit).toBe("individual");
    expect(JSON.stringify(fiche.gaps)).not.toContain("nom de clan");
  });
});

describe("lists kept for waves 12 and 13", () => {
  // @req REQ-178
  it("adds Tajuasohn, Marva and Margyi to the oral verification list", () => {
    const doc = readDoc(
      "docs/editorial/strategy/self-names-to-verify-orally.md"
    );

    for (const id of ["`PPL_TAIZI`", "`PPL_GIZIGA`", "`PPL_MARGI`"]) {
      expect(doc).toContain(id);
    }
    expect(doc).toContain("Tajuasohn");
  });

  // @req REQ-178
  it("records the source rulings of waves 12 and 13", () => {
    const doc = readDoc(
      "docs/editorial/strategy/name-history-priority-core.md"
    );

    expect(doc).toMatch(/Waves 12 and 13 of the long tail/);
    expect(doc).toContain("mandaras.info");
    expect(doc).toContain("Verswijver");
    expect(doc).toContain("PAT_SANKARA");
  });
});
