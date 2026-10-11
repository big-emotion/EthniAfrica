import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

// The operator's rulings of 2026-10-11 on the questions left by waves 6
// (peoples) and 7 (family names) of the long tail (ETNI-2011), and the fiche
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
  birth?: true;
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

function accountsFrom(fiche: string, name: string, from: number) {
  return nameOf(readFiche(fiche), name).accounts.filter(
    (account) => account.period.from === from
  );
}

// [fiche, name, period.from, era]
const ERA_RULINGS: Array<[string, string, number, string]> = [
  // Wave 6: the interior before occupation.
  ["peuples/FLG_BANTU/PPL_RANGI", "Irangi", 1885, "polity"],
  ["peuples/FLG_BANTU/PPL_RANGI", "Warangi", 1894, "polity"],
  ["peuples/FLG_MANDE/PPL_GOURO", "Gouro", 1897, "polity"],
  ["peuples/FLG_NIGERCONGO/PPL_KWANYAMA", "Ovakwanyama", 1911, "polity"],
  ["peuples/FLG_NIGERCONGO/PPL_KWANYAMA", "Oukwanyama", 1911, "polity"],
  ["peuples/FLG_KROU/PPL_GUERE", "Guéré", 1904, "polity"],
  ["peuples/FLG_NIGERCONGO/PPL_SOLONGO", "Mussurongo", 1875, "polity"],
  // Wave 6: under the colonising state.
  ["peuples/FLG_KWA/PPL_SEFWI", "Sefwi", 1877, "colonial"],
  ["peuples/FLG_BENOUECONGO/PPL_EFIK", "Efik", 1890, "colonial"],
  ["peuples/FLG_AUSTRONESIENNE/PPL_TANOSY", "Antanosy", 1658, "colonial"],
  // Wave 6: the Liberian interior follows the Liberia ruling.
  ["peuples/FLG_MANDE/PPL_TOMA_LOMA", "Buzi", 1868, "modern"],
  ["peuples/FLG_MANDE/PPL_TOMA_LOMA", "Buzi", 1906, "modern"],
  // Wave 7: Samori's lands, Hausaland, the Dahra.
  ["patronymes/PAT_SIDIBE", "Sidibé", 1887, "polity"],
  ["patronymes/PAT_DEMBELE", "Dembélé", 1887, "polity"],
  ["patronymes/PAT_ABUBAKAR", "Abubakar", 1888, "polity"],
  ["patronymes/PAT_YUSUF", "Yusufu", 1876, "polity"],
  ["patronymes/PAT_ZEROUAL", "Zeroual", 1838, "polity"],
  // Wave 7: Rançon in the Haute-Gambie, a French protectorate.
  ["patronymes/PAT_SIDIBE", "Sidibé", 1891, "colonial"],
  ["patronymes/PAT_SISSOKO", "Sisoko", 1891, "colonial"],
  // Wave 7: Molinie in 1959, about places in French Sudan (Mali).
  ["patronymes/PAT_BERETE", "Bérété", 1959, "colonial"],
  ["patronymes/PAT_DIAKITE", "Diakité", 1959, "colonial"],
  ["patronymes/PAT_DOUMBIA", "Doumbia", 1959, "colonial"],
  ["patronymes/PAT_SISSOKO", "Sissoko", 1959, "colonial"],
];

// [fiche, name, period.from]: ruled to carry no era.
const NO_ERA: Array<[string, string, number]> = [
  ["peuples/FLG_MANDE/PPL_GOURO", "Gouro", 1904],
  ["peuples/FLG_MANDE/PPL_GOURO", "Kweni", 1904],
  ["peuples/FLG_MANDE/PPL_GOURO", "Lo", 1904],
  ["peuples/FLG_NIGERCONGO/PPL_KONGO_CABINDA", "Cabinda", 1963],
  ["peuples/FLG_CREOLE/PPL_ANAFRO_CRIOULO", "Crioulo", 1935],
  ["peuples/FLG_KWA/PPL_MINA", "Popo", 1680],
  ["peuples/FLG_MANDE/PPL_TOMA_LOMA", "Toma", 1854],
  ["peuples/FLG_MANDE/PPL_TOMA_LOMA", "Buzi", 1854],
  // Molinie's accounts that name no place.
  ["patronymes/PAT_BAMBA_CLAN", "Bamba", 1959],
  ["patronymes/PAT_CAMARA", "Camara", 1959],
  ["patronymes/PAT_DIABATE", "Diabaté", 1959],
  ["patronymes/PAT_DIARRA", "Diarra", 1959],
  ["patronymes/PAT_DEMBELE", "Dembélé", 1959],
];

describe("eras ruled on 2026-10-11 for waves 6 and 7", () => {
  // @req REQ-196
  it.each(ERA_RULINGS)("%s « %s » (%i) is %s", (fiche, name, from, era) => {
    const accounts = accountsFrom(fiche, name, from);

    expect(accounts.length).toBeGreaterThan(0);
    for (const account of accounts) expect(account.era).toBe(era);
  });

  // @req REQ-196
  it.each(NO_ERA)("%s « %s » (%i) carries no era", (fiche, name, from) => {
    const accounts = accountsFrom(fiche, name, from);

    expect(accounts.length).toBeGreaterThan(0);
    for (const account of accounts) expect(account.era).toBeUndefined();
  });

  // Réunion has been a French department since 1946 and was never
  // independent: no account after 1946 carries an era.
  // @req REQ-196
  it("leaves every Réunion account after 1946 without an era", () => {
    const fiche = readFiche("peuples/FLG_CREOLE/PPL_CREOLE_REUNION") as Fiche;
    const accounts = fiche.nameHistory.names.flatMap((name) => name.accounts);
    const after1946 = accounts.filter(
      (account) => (account.period.from ?? 0) > 1946 || account.era === "modern"
    );

    for (const account of after1946) expect(account.era).toBeUndefined();
    expect(
      accounts.filter((account) => account.era === "colonial").length
    ).toBeGreaterThan(0);
  });

  // @req REQ-196
  it("records the rulings in the colonial-periods reference", () => {
    const periods = readDoc("docs/editorial/strategy/colonial-periods.md");

    expect(periods).toContain("| Réunion");
    expect(periods).toContain("Oil Rivers Protectorate");
    expect(periods).toContain(
      "## The rulings on waves 6 and 7, ruled 2026-10-11"
    );
  });
});

describe("births ruled on 2026-10-11 for wave 7", () => {
  const quranBirths = (fiche: string) =>
    (readFiche(fiche) as Fiche).nameHistory.names
      .flatMap((name) => name.accounts)
      .filter((account) => account.birth && /Coran/.test(account.statement));

  // The Quran is a birth only for Ahmed, where nothing older is known.
  // @req REQ-196
  it("keeps the Quran as Ahmed's birth only", () => {
    expect(quranBirths("patronymes/PAT_AHMED")).toHaveLength(1);
    expect(quranBirths("patronymes/PAT_ADAM")).toHaveLength(0);
    expect(quranBirths("patronymes/PAT_YUSUF")).toHaveLength(0);
  });

  // @req REQ-196
  it("keeps the Dâo kings of the Tarikh as an uncertain trace", () => {
    expect(accountsFrom("patronymes/PAT_DAO", "Dao", 1600)[0].birth).toBe(
      undefined
    );
  });
});

describe("fiche errors found by waves 6 and 7", () => {
  // kdi is Kumam, a Nilotic language of Uganda (Glottolog kuma1275).
  // @req REQ-178
  it("drops Kumam's ISO code from the Diola fiche", () => {
    const diola = readFiche("peuples/FLG_ATLANTIQUE/PPL_DIOLA");

    expect(diola.content.languages.isoCodes).not.toContain("kdi");
    expect(
      readFiche("peuples/FLG_NILOTIQUE/PPL_KUMAM").content.languages.isoCodes
    ).toContain("kdi");
  });

  // Lukpa (dop) is a language of its own beside Kabiyè (kbp), Glottolog
  // lukp1238: the Lokpa are not the Kabiyè of Benin.
  // @req REQ-178
  it("no longer gives the Lokpa as Kabiyè of Benin", () => {
    const kabye = readFiche("peuples/FLG_NIGERCONGO/PPL_KABYE");

    expect(kabye.content.ethnicities).not.toContain("Lokpa");
    expect(kabye.content.languages.dialects.join(" ")).not.toMatch(/Lokpa/);
    expect(kabye.content.appellations.exonyms).not.toContain("Lokpa");
    expect(kabye.content.appellations.exonyms).not.toContain("Lukpa");
  });

  // The copy on Internet Archive shows Siara Kouman Konaté on page 102 and
  // the Konaté of the Toron as cadets of the Keïta on page 141.
  // @req REQ-133
  it("gives the pages of the Niane copy that PAT_KONATE's account reads", () => {
    const konate = readFiche("patronymes/PAT_KONATE");
    const niane = konate.sources.find(
      (source: { sourceKey: string }) => source.sourceKey === "niane-1960"
    );

    expect(niane.notes).toContain("(p. 102)");
    expect(niane.notes).toContain("(p. 141)");
    expect(niane.notes).not.toMatch(/\(p\. 10[1]\)|\(p\. 140\)/);
  });

  // Mage (1868, p. 354) and Binger (1892, t. 1 pp. 133, 211) write Diakhité.
  // @req REQ-133
  it("attests the Diakhité spelling of Diakité", () => {
    const diakite = readFiche("patronymes/PAT_DIAKITE");
    const diakhite = diakite.spellings.find(
      (spelling: { spelling: string }) => spelling.spelling === "Diakhité"
    );

    expect(diakhite).toBeDefined();
    expect(diakhite.attestations[0].sourceRefs).toEqual(
      expect.arrayContaining(["mage-1868-soudan", "binger-1892-kong"])
    );
    expect(JSON.stringify(diakite.gaps)).not.toContain("Diakhité");
  });

  // Notre Voie, 19 July 2006: « directeur du développement régional et de
  // l'aménagement du territoire ».
  // @req REQ-133
  it("gives Maurice Lohourignon the job title the article prints", () => {
    const fiche = readFiche("patronymes/PAT_LOHOURIGNON");
    const note = fiche.sources.find(
      (source: { sourceKey: string }) =>
        source.sourceKey === "allafrica-2006-lohourignon"
    ).notes;

    expect(note).toContain(
      "directeur du développement régional et de l'aménagement du territoire"
    );
    expect(note).not.toContain("construction et de l'urbanisme");
  });

  // The Kongo lineage rests only on a list read through Wikipedia.
  // @req REQ-133
  it("no longer links Nkala to the Kongo people", () => {
    const nkala = readFiche("patronymes/PAT_NKALA");

    expect(nkala.peoples).toEqual([]);
    expect(
      nkala.gaps.map((gap: { fieldPath: string }) => gap.fieldPath)
    ).toContain("peoples");
  });

  // @req REQ-133
  it("attaches Sow to the Fulɓe and the Toucouleur, not to the Wolof", () => {
    const sow = readFiche("patronymes/PAT_SOW");
    const peopleIds = sow.peoples.map(
      (people: { peopleId: string }) => people.peopleId
    );

    expect(peopleIds).toContain("PPL_FULA");
    expect(peopleIds).toContain("PPL_HALPULAAR");
    expect(peopleIds).not.toContain("PPL_WOLOF");
    expect(JSON.stringify(sow)).not.toContain("corpus-ppl-wolof");
  });

  // A text WardheerNews published is a press text, not an academic one.
  // @req REQ-133
  it.each(["PAT_NUR", "PAT_AHMED"])(
    "types Mansuur's WardheerNews text as press in %s",
    (id) => {
      const text = JSON.stringify(readFiche(`patronymes/${id}`));
      const kinds = [
        ...text.matchAll(
          /"title":"Somali names and individual identity"[^}]*?"source_kind":"([a-z_]+)"/g
        ),
      ].map((match) => match[1]);

      expect(kinds.length).toBeGreaterThan(0);
      for (const kind of kinds) expect(kind).toBe("press");
    }
  );
});

describe("lists kept for the operator", () => {
  // @req REQ-196
  it("lists the wave-6 self-names that wait for an oral check", () => {
    const selfNames = readDoc(
      "docs/editorial/strategy/self-names-to-verify-orally.md"
    );

    for (const entry of [
      "`PPL_TEKE_NORD`",
      "`PPL_TOPOSA`",
      "`PPL_LALA`",
      "`PPL_KALAIBARI`",
      "nsolotu",
    ])
      expect(selfNames).toContain(entry);
  });

  // @req REQ-196
  it("lists the births read through a catalogue record as to upgrade", () => {
    const core = readDoc(
      "docs/editorial/strategy/name-history-priority-core.md"
    );

    expect(core).toContain("Waves 6 and 7 of the long tail");
    for (const entry of ["Gamst", "Welch", "Hrbek", "Kollo"])
      expect(core).toContain(entry);
  });
});
