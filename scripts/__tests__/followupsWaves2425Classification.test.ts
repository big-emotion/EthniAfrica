import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { parsePatronymeFile } from "../../src/lib/afrik/parsers/patronymeParser";

// The classification questions that wave 25 of the long tail left (ETNI-2011),
// approved by the operator on 2026-10-18, and the other approved answers that
// edit the same fiches. Each fiche moves on what its own nameHistory, written
// from opened sources, shows: a name borne as a family name and no clan
// (hereditary_family_name), or a personal name (the nearest box,
// non_hereditary_patronymic). The earlier passes are pinned in
// patronymeNameSystemReclassification.test.ts.

type Gap = { fieldPath: string; reason: string };
type Account = {
  era?: string;
  period?: { from?: number | null; label?: string };
  statement: string;
  sources?: Array<{ title: string; page?: string }>;
};
type Fiche = {
  id: string;
  nameMain: string;
  nameSystem: string;
  designatedSocialUnit: string;
  transmissionMode: string;
  spellings: Array<{
    spelling: string;
    attestations: Array<{ countryId: string; sourceRefs: string[] }>;
  }>;
  countries: Array<{ countryId: string; sourceRefs: string[] }>;
  sources: Array<{
    sourceKey: string;
    url: string | null;
    title: string;
    tier: string;
    source_kind?: string;
    notes?: string;
  }>;
  gaps: Gap[];
  nameHistory?: {
    names: Array<{ nameText: string; accounts: Account[] }>;
  };
};

const SELIGMAN_1932_URL = "https://archive.org/details/in.ernet.dli.2015.57118";

function readFiche(id: string): Fiche {
  return JSON.parse(
    readFileSync(
      resolve(process.cwd(), `dataset/source/afrik/patronymes/${id}.json`),
      "utf8"
    )
  );
}

const gapsOn = (fiche: Fiche, fieldPath: string) =>
  fiche.gaps.filter((gap) => gap.fieldPath === fieldPath);

const citesPage = (fiche: Fiche, title: RegExp, page: RegExp) =>
  (fiche.nameHistory?.names ?? [])
    .flatMap((name) => name.accounts)
    .flatMap((account) => account.sources ?? [])
    .some((source) => title.test(source.title) && page.test(source.page ?? ""));

// The 2026-10-14 implementation ruling: a fiche left in its nearest box says
// that the hereditary_family_name box exists and why it is not used.
const HEREDITARY_BOX_NAMED =
  /Le modèle a une case pour un nom de famille héréditaire/;

// w25-A q4, w25-B q2, w25-C q2, w25-D q5, w25-F q3: the history shows the name
// borne as a family name (a marriage table, a family-name dictionary, a family
// of Lesotho, the Krio surname passed from father to children) and tells no
// clan. None shows one family line, so the unit is `other`.
const HEREDITARY_FAMILY_NAMES = [
  "PAT_MICHEL",
  "PAT_FAURE",
  "PAT_LARUE",
  "PAT_BARBE",
  "PAT_JULIE",
  "PAT_HOAREAU",
  "PAT_LOUSTAU_LALANNE",
  "PAT_DUVAL",
  "PAT_BERENGER",
  "PAT_GOPAUL",
  "PAT_BEEHARRY",
  "PAT_APPADOO",
  "PAT_KANE",
  "PAT_BONGO",
  "PAT_DO_ESPIRITO_SANTO",
  "PAT_LETSIE",
  "PAT_COLE",
  "PAT_COKER",
  "PAT_COOPER",
  "PAT_FREEMAN",
] as const;

// w25-B q2, w25-E q1, w25-F q3: personal names filed as clan names. Lado has
// no history; on p. 270 the Seligmans name two Bari called Lado alone and give
// their clan apart, so the fiche now cites them.
const PERSONAL_NAMES = [
  "PAT_LADO",
  "PAT_KOUNTCHE",
  "PAT_BWALYA",
  "PAT_CHANDA",
  "PAT_MULENGA",
  "PAT_MUSONDA",
] as const;

// w25-C q1 and q2, under the Fang ruling of 2026-10-14: Fang names, and the
// Ewondo names of their neighbours told the same way, are personal names.
const FANG_BETI_PERSONAL_NAMES = [
  "PAT_OBAME",
  "PAT_OBIANG",
  "PAT_NCHAMA",
  "PAT_NSUE",
  "PAT_ELA",
  "PAT_MENGUE",
  "PAT_NZUE",
  "PAT_NDONGO",
  "PAT_ONANA",
] as const;

// Of those, the ones whose own history says the father's name follows the
// child's: the ruling makes their transmission patrilineal. Ela was already
// patrilineal before its history was written and is left as it was.
const FATHERS_NAME_PASSED_ON = [
  "PAT_OBAME",
  "PAT_OBIANG",
  "PAT_NSUE",
  "PAT_NDONGO",
] as const;

// Kept on purpose by the approved answers: Ndong is also a Fang clan in
// Tessmann and Obiang-Mikue (w25-C q1); the Swazi and Tsonga names are clans,
// Moyo a totemic clan (w25-D q5); Mabiala stays a personal name (w25-C q2).
const KEPT = [
  ["PAT_NDONG", "clan_name"],
  ["PAT_GAMEDZE", "clan_name"],
  ["PAT_GININDZA", "clan_name"],
  ["PAT_HLOPHE", "clan_name"],
  ["PAT_MAGAGULA", "clan_name"],
  ["PAT_MATSEBULA", "clan_name"],
  ["PAT_MABUZA", "clan_name"],
  ["PAT_BALOYI", "clan_name"],
  ["PAT_MACUACUA", "clan_name"],
  ["PAT_MONDLANE", "clan_name"],
  ["PAT_MABOTE", "clan_name"],
  ["PAT_MOYO", "totemic_clan"],
  ["PAT_MABIALA", "non_hereditary_patronymic"],
] as const;

describe("wave 25 family names borne as family names (ETNI-2011, 2026-10-18)", () => {
  // @req REQ-133
  it.each(HEREDITARY_FAMILY_NAMES)(
    "%s is a hereditary family name, unit `other`, with no clan wording left",
    (id) => {
      const fiche = readFiche(id);

      expect(parsePatronymeFile(fiche).success).toBe(true);
      expect(fiche.nameSystem).toBe("hereditary_family_name");
      expect(fiche.designatedSocialUnit).toBe("other");
      expect(fiche.nameHistory, `${id}: nameHistory`).toBeDefined();
      expect(gapsOn(fiche, "nameSystem")).toHaveLength(0);
      expect(JSON.stringify(gapsOn(fiche, "transmissionMode"))).not.toMatch(
        /Le nom de clan ne détermine/
      );
      expect(JSON.stringify(fiche.nameHistory)).not.toMatch(/nom de clan/);
    }
  );

  // @req REQ-133
  it("keeps the transmission each history or law gives: the Krio name from the father, Mauritius by law", () => {
    for (const id of ["PAT_COLE", "PAT_COKER", "PAT_DUVAL", "PAT_GOPAUL"]) {
      expect(readFiche(id).transmissionMode, id).toBe("patrilineal");
    }
    expect(readFiche("PAT_MICHEL").transmissionMode).toBe("elective");
    expect(readFiche("PAT_DO_ESPIRITO_SANTO").transmissionMode).toBe(
      "bilateral"
    );
  });
});

describe("wave 25 personal names filed as clan names (ETNI-2011, 2026-10-18)", () => {
  // @req REQ-133
  it.each(PERSONAL_NAMES)(
    "%s is filed as a personal name, with one gap and no leftover clan or unit wording",
    (id) => {
      const fiche = readFiche(id);

      expect(parsePatronymeFile(fiche).success).toBe(true);
      expect(fiche.nameSystem).toBe("non_hereditary_patronymic");
      expect(fiche.designatedSocialUnit).toBe("individual");
      const gaps = gapsOn(fiche, "nameSystem");
      expect(gaps, `${id}: one nameSystem gap`).toHaveLength(1);
      expect(gaps[0].reason).toMatch(/aucune source/i);
      expect(gaps[0].reason).toMatch(/nom de clan/);
      expect(gaps[0].reason).not.toMatch(
        /provisoire|hypothèse de classement|choix par défaut/
      );
      expect(gapsOn(fiche, "designatedSocialUnit")).toHaveLength(0);
      expect(JSON.stringify(gapsOn(fiche, "transmissionMode"))).not.toMatch(
        /Le nom de clan ne détermine/
      );
    }
  );

  // @req REQ-133
  it("files Ould Ahmed as a filiation, like Ould Cheikh, with no nisba gap left", () => {
    const fiche = readFiche("PAT_OULD_AHMED");

    expect(parsePatronymeFile(fiche).success).toBe(true);
    expect(fiche.nameSystem).toBe("non_hereditary_patronymic");
    expect(fiche.designatedSocialUnit).toBe("individual");
    expect(gapsOn(fiche, "nameSystem")).toHaveLength(0);
    expect(gapsOn(fiche, "designatedSocialUnit")).toHaveLength(0);
    expect(JSON.stringify(fiche.gaps)).not.toMatch(/La nisba ne détermine/);
    expect(gapsOn(fiche, "transmissionMode")[0].reason).toMatch(
      /de qui la personne est le fils/
    );
  });

  // @req REQ-133
  it("says on each Bemba fiche that Bemba names became family names without showing it for this one", () => {
    for (const id of [
      "PAT_BWALYA",
      "PAT_CHANDA",
      "PAT_MULENGA",
      "PAT_MUSONDA",
    ]) {
      const [gap] = gapsOn(readFiche(id), "nameSystem");
      expect(gap.reason, id).toMatch(/bemba/);
      expect(gap.reason, id).toMatch(/père/);
    }
  });

  // @req REQ-133
  it("bases the Lado classification on the Seligmans, read at pp. 268 and 270", () => {
    const lado = readFiche("PAT_LADO");
    const seligman = lado.sources.filter(
      (source) => source.url === SELIGMAN_1932_URL
    );

    expect(seligman).toHaveLength(1);
    expect(seligman[0]).toMatchObject({
      title: "Pagan Tribes of the Nilotic Sudan",
      tier: "referenced",
      source_kind: "academic",
    });
    expect(seligman[0].notes).toMatch(/268/);
    expect(seligman[0].notes).toMatch(/270/);
    expect(seligman[0].notes).toMatch(/Bekat/);
    const key = seligman[0].sourceKey;
    expect(
      lado.spellings[0].attestations.find((a) => a.countryId === "SSD")
        ?.sourceRefs
    ).toContain(key);
    expect(
      lado.countries.find((c) => c.countryId === "SSD")?.sourceRefs
    ).toContain(key);
    expect(gapsOn(lado, "nameSystem")[0].reason).toMatch(/Bari/);
    expect(gapsOn(lado, "peoples")[0].reason).toMatch(/Bari/);
  });

  // The chief of p. 268 is « Laro Lado » throughout, and Lado may be his
  // father's name; only the two people of p. 270 are called Lado alone, and
  // only they are given a clan.
  // @req REQ-133
  it("names the Mongalla chief as the Seligmans write him and reads Lado as a personal name from p. 270 only", () => {
    const lado = readFiche("PAT_LADO");
    const [nameSystemGap] = gapsOn(lado, "nameSystem");

    for (const gap of lado.gaps.filter((g) => /chef|Mongalla/.test(g.reason))) {
      expect(gap.reason, gap.fieldPath).toMatch(/Laro Lado/);
    }
    expect(nameSystemGap.reason).toMatch(/Molodiong/);
    expect(nameSystemGap.reason).not.toMatch(/chef/);
  });
});

describe("wave 25 personal names say why the hereditary box is not used (ETNI-2011)", () => {
  // @req REQ-133
  it.each([...PERSONAL_NAMES, ...FANG_BETI_PERSONAL_NAMES])(
    "%s names the hereditary_family_name box in its nameSystem gap",
    (id) => {
      const [gap] = gapsOn(readFiche(id), "nameSystem");

      expect(gap.reason).toMatch(HEREDITARY_BOX_NAMED);
    }
  );

  // Their histories say every child of the man bears his name as a family
  // name, so « no source shows the transmission » would contradict them: the
  // gap says instead that each child takes his own father's name.
  // @req REQ-133
  it.each(["PAT_NSUE", "PAT_OBIANG"])(
    "%s gives the reason the box is not used instead of denying the transmission",
    (id) => {
      const [gap] = gapsOn(readFiche(id), "nameSystem");

      expect(gap.reason).not.toMatch(/aucune source lue ne montre/i);
      expect(gap.reason).toMatch(/son propre père/);
    }
  );
});

describe("wave 25 Fang and Ewondo names (ETNI-2011, Fang ruling)", () => {
  // @req REQ-133
  it.each(FANG_BETI_PERSONAL_NAMES)(
    "%s is a personal name, with one gap naming the Fang rule",
    (id) => {
      const fiche = readFiche(id);

      expect(parsePatronymeFile(fiche).success).toBe(true);
      expect(fiche.nameSystem).toBe("non_hereditary_patronymic");
      expect(fiche.designatedSocialUnit).toBe("individual");
      const gaps = gapsOn(fiche, "nameSystem");
      expect(gaps, `${id}: one nameSystem gap`).toHaveLength(1);
      expect(gaps[0].reason).toMatch(/aucune source/i);
      expect(gaps[0].reason).toMatch(/nom de clan/);
      expect(gaps[0].reason).toMatch(/Fang/);
      expect(gaps[0].reason).not.toMatch(/provisoire|hypothèse de classement/);
      expect(JSON.stringify(fiche.gaps)).not.toMatch(
        /catégorie provisoire|Le nom de clan ne détermine/
      );
    }
  );

  // A gap that credits Tessmann needs the fiche to cite the page where he
  // says it: Die Pangwe, vol. 2, p. 285.
  // @req REQ-133
  it.each(FANG_BETI_PERSONAL_NAMES)(
    "%s credits Tessmann in a gap only if it cites Die Pangwe at p. 285",
    (id) => {
      const fiche = readFiche(id);
      const creditsTessmann = fiche.gaps.some((gap) =>
        /Tessmann/.test(gap.reason)
      );

      expect(
        !creditsTessmann || citesPage(fiche, /^Die Pangwe.*tome 2$/, /\b285\b/)
      ).toBe(true);
    }
  );

  // @req REQ-133
  it.each(FATHERS_NAME_PASSED_ON)(
    "%s takes the father's name after the child's, so its transmission is patrilineal",
    (id) => {
      const fiche = readFiche(id);

      expect(fiche.transmissionMode).toBe("patrilineal");
      expect(gapsOn(fiche, "transmissionMode")).toHaveLength(0);
    }
  );

  // @req REQ-133
  it("keeps Ndong a clan name, with a gap saying it is also a Fang man's name", () => {
    const fiche = readFiche("PAT_NDONG");
    const gaps = gapsOn(fiche, "nameSystem");

    expect(fiche.nameSystem).toBe("clan_name");
    expect(fiche.designatedSocialUnit).toBe("clan");
    expect(gaps).toHaveLength(1);
    expect(gaps[0].reason).toMatch(/clan/);
    expect(gaps[0].reason).toMatch(/nom d'homme/);
    expect(gaps[0].reason).toMatch(/Tessmann/);
    expect(gaps[0].reason).not.toMatch(
      /provisoire|hypothèse de classement|catégorie/
    );
  });
});

describe("wave 25 classifications kept on purpose (ETNI-2011)", () => {
  // @req REQ-133
  it.each(KEPT)("%s keeps its %s typing", (id, nameSystem) => {
    expect(readFiche(id).nameSystem).toBe(nameSystem);
  });
});

describe("the other approved answers on the same fiches (ETNI-2011)", () => {
  // @req REQ-136
  it("drops the unsourced spelling Berenger: the Assembly page writes Bérenger", () => {
    const fiche = readFiche("PAT_BERENGER");

    expect(fiche.spellings.map((entry) => entry.spelling)).toEqual([
      "Bérenger",
    ]);
    expect(fiche.nameMain).toBe("Bérenger");
  });

  // @req REQ-136
  it("drops the unsourced spelling Barbé and files the name as its sources write it", () => {
    const fiche = readFiche("PAT_BARBE");

    expect(fiche.spellings.map((entry) => entry.spelling)).toEqual(["Barbe"]);
    expect(fiche.nameMain).toBe("Barbe");
    expect(fiche.gaps.map((gap) => gap.reason).join(" ")).not.toMatch(
      /(porteurs de|reliant) Barbé/
    );
  });

  // @req REQ-178
  it("gives the Letsie Moshesh tile of 1847 the era of the Basotho kingdom", () => {
    const tile = readFiche("PAT_LETSIE").nameHistory?.names[0].accounts.find(
      (account) => account.period?.from === 1847
    );

    expect(tile?.statement).toMatch(/Letsie Moshesh/);
    expect(tile?.era).toBe("polity");
  });

  // @req REQ-178
  it("leaves the Pointe Larue account without an era", () => {
    const tile = readFiche("PAT_LARUE").nameHistory?.names[0].accounts.find(
      (account) => /Pointe Larue/.test(account.statement)
    );

    expect(tile).toBeDefined();
    expect(tile?.era).toBeUndefined();
  });
});
