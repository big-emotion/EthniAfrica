import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { parsePatronymeFile } from "../../src/lib/afrik/parsers/patronymeParser";

// ETNI-2011 open questions: fiches typed as clan names (or as totemic clans,
// praise names, nisbas) whose own nameHistory, written from opened sources,
// tells a personal name and no account tells a clan name. They follow the
// PAT_OWUSU ruling: the nearest box of the model, with a gap saying that no
// source classifies the name.

const RECLASSIFIED = [
  "PAT_ADDO",
  "PAT_AGYEMANG",
  "PAT_AMOAH",
  "PAT_ANSAH",
  "PAT_ASANTE",
  "PAT_KAGGWA",
  "PAT_MUKASA",
  "PAT_LUBEGA",
  "PAT_OGUNLEYE",
  "PAT_OJO",
  "PAT_OLAWALE",
  "PAT_BIYA",
  "PAT_KASONGO",
  "PAT_MOBUTU",
  "PAT_EL_SAYED",
  "PAT_MUSEVENI",
] as const;

// Clans and tribal nisbas the sweep must leave alone, and the ones whose
// own accounts call them a clan, a tribe or a group.
const KEPT = [
  ["PAT_LUGAVE", "totemic_clan"],
  ["PAT_NGONGE", "totemic_clan"],
  ["PAT_MAGHRAWA", "nisba"],
  ["PAT_CHIRINDZA", "clan_name"],
  ["PAT_COSSA", "clan_name"],
  ["PAT_NYAKUNDI", "clan_name"],
  ["PAT_NGOY", "clan_name"],
  ["PAT_MWAMBA", "clan_name"],
] as const;

// Second pass (same rule), from the open questions of waves 14-21: the
// fiches typed as clan names whose own nameHistory tells a personal name, a
// given name used as a surname, a birth name or a title, and no clan.
const RECLASSIFIED_SECOND_PASS = [
  "PAT_AONDOAKAA",
  "PAT_APPIAH",
  "PAT_EKPO",
  "PAT_KOLLIE",
  "PAT_LUMBALA",
  "PAT_SEBASTIAO",
  "PAT_SEERUTTUN",
  "PAT_SHENOUDA",
  "PAT_DOSSOU",
  "PAT_DOMINGOS",
  "PAT_KALALA",
  "PAT_ADEBAYO",
  "PAT_ADEYEMI",
  "PAT_BABATUNDE",
  "PAT_KEHINDE",
  "PAT_BALOGUN",
] as const;

// Plain hereditary family names: no source classifies them. They follow the
// PAT_AKHANNOUCH precedent (nearest box, lineage as unit, a gap saying so).
const HEREDITARY_FAMILY_NAMES = [
  "PAT_CHISSANO",
  "PAT_CHIZIANE",
  "PAT_DHLAKAMA",
  "PAT_GUEBUZA",
  "PAT_KANYINDA",
  "PAT_KAYEMBE",
  "PAT_LUTULA",
  "PAT_DJOUMESSI",
  "PAT_FOTSO",
  "PAT_CHIRWA",
] as const;

// Kept on purpose: an account tells a family of chiefs, an ancestor, a clan
// or a clan-based transmission, or the personal-name claim rests only on a
// reading of the project. Listed in the pull request as open questions.
const KEPT_SECOND_PASS = [
  ["PAT_SEKHONYANA", "clan_name"],
  ["PAT_MEZIANE", "clan_name"],
  ["PAT_TAPSOBA", "clan_name"],
  ["PAT_YEBOAH", "clan_name"],
  ["PAT_PHIRI", "clan_name"],
  ["PAT_MWINYI", "clan_name"],
  ["PAT_CHERIF", "nisba"],
  ["PAT_BENALI", "nisba"],
  ["PAT_AIT_AHMED", "clan_name"],
] as const;

// Ruling of 2026-10-14 on Fang naming: Tessmann (1913, vol. 2, p. 285) says a
// Fang child gets a name from his father, the father's name is then added to
// it, Fang have no family names in the European sense, and a stranger is told
// the name of the kin group instead. The kin group has its own name (Omwang,
// Essauong); Esono, Mba, Nguema and Ondo are personal names that pass from
// father to child, not clan names.
const FANG_PERSONAL_NAMES = [
  "PAT_ESONO",
  "PAT_MBA",
  "PAT_NGUEMA",
  "PAT_ONDO",
] as const;

// Fang and Beti fiches the ruling does not move: no nameHistory of their own
// (the rule needs one), a lineage or clan told by an account, or no Fang
// account at all.
const KEPT_FANG_BETI = [
  ["PAT_OVONO", "clan_name"],
  ["PAT_ESSOMBA", "clan_name"],
  ["PAT_MVONDO", "clan_name"],
  ["PAT_NDONG", "clan_name"],
  ["PAT_OBIANG", "clan_name"],
  ["PAT_ONANA", "clan_name"],
] as const;

// Ruling of 2026-10-14 on Maghreb names: Ould + the father's name, in
// Mauritania, says whose son a person is, not which family; Basset (1910) and
// Jeune Afrique (2005) say so. That is a patronymic chain, so the box is the
// non-hereditary patronymic.
const MAURITANIAN_FILIATION = ["PAT_OULD_CHEIKH", "PAT_OULD_MOHAMED"] as const;

// Maghreb family names whose own nameHistory does not show the transmission
// as a surname (Benali, Amrani: no account; Cherif: a title, and the family
// names built on it are other names). They stay nisba with the gap that says
// the nisba class is provisional.
const KEPT_MAGHREB_FAMILY_NAMES = [
  "PAT_BENALI",
  "PAT_AMRANI",
  "PAT_CHERIF",
] as const;

// Sixth value, hereditary_family_name (ETNI-2011, ruling of 2026-10-14): the
// fiches whose own nameHistory shows the name borne as a family name and
// tells no clan. Each one is backed by an account of the fiche: the 1882
// civil-status law for Algerian names, a family line (Akhannouch, Eyoum,
// Ben Badis, Benyoucef), a transmission told by the source (Taiwo, Shikongo,
// Pohamba) or a source that labels the name a family name.
const HEREDITARY_FAMILY_NAME_FICHES = [
  "PAT_AKHANNOUCH",
  "PAT_AMARA",
  "PAT_BANDEIRA",
  "PAT_BAPTISTA",
  "PAT_BELKACEM",
  "PAT_BENYOUCEF",
  "PAT_BEN_BADIS",
  "PAT_BOUMEDIENE",
  "PAT_BOUZID",
  "PAT_CARVALHO",
  "PAT_CHINEDU",
  "PAT_COSTA",
  "PAT_DUARTE",
  "PAT_EYOUM",
  "PAT_FERNANDES",
  "PAT_FERREIRA",
  "PAT_GONCALVES",
  "PAT_GUIRGUIS",
  "PAT_HAMDI",
  "PAT_JOHNSON",
  "PAT_KACI",
  "PAT_KAZADI",
  "PAT_LIMA",
  "PAT_LOPES",
  "PAT_LOURENCO",
  "PAT_MENEZES",
  "PAT_MONTEIRO",
  "PAT_NASCIMENTO",
  "PAT_NETO",
  "PAT_NEVES",
  "PAT_NWACHUKWU",
  "PAT_OKORO",
  "PAT_POHAMBA",
  "PAT_RAMGOOLAM",
  "PAT_RITA",
  "PAT_RODRIGUES",
  "PAT_SHIKONGO",
  "PAT_TAIWO",
  "PAT_TOE",
  "PAT_WEAH",
  "PAT_ZADI",
] as const;

// Of those, the ones whose accounts show a family line.
const HEREDITARY_FAMILY_NAME_LINEAGE = new Set<string>([
  "PAT_AKHANNOUCH",
  "PAT_BEN_BADIS",
  "PAT_EYOUM",
]);

// Third pass (ruling of 2026-10-16, waves 21 to 23): Portuguese family names
// whose own nameHistory, written from Leite de Vasconcelos (1928) and the
// Dictionary of American Family Names, shows the name borne as a family name
// and tells no clan. They took the sixth value through the same rule as the
// 28 above. The unit is `other`: no account shows a family line.
const THIRD_PASS_PORTUGUESE = [
  "PAT_MONTEIRO",
  "PAT_BANDEIRA",
  "PAT_MENEZES",
  "PAT_FERNANDES",
  "PAT_LOPES",
  "PAT_DUARTE",
  "PAT_COSTA",
  "PAT_LIMA",
  "PAT_NEVES",
  "PAT_CARVALHO",
  "PAT_FERREIRA",
  "PAT_NASCIMENTO",
  "PAT_NETO",
] as const;

// Personal names told by the sources of the Ambo and Tswana studies, with no
// account showing the name passed from parent to child as a surname: the
// nearest box, like the second pass.
const PERSONAL_NAMES_THIRD_PASS = [
  "PAT_AMADHILA",
  "PAT_HAMUTENYA",
  "PAT_IIPUMBU",
  "PAT_KGOSI",
  "PAT_MOTHIBI",
] as const;

// Kept on purpose in the third pass: a clan told by the source (Ngcobo,
// Madiba), a house of chiefs whose history is not yet in the fiche's own
// nameHistory (Khama, Mahlangu), a regnal name taken by kings (Gbaguidi), or a
// praise name. Listed in the pull request as open questions.
const KEPT_THIRD_PASS = [
  ["PAT_NGCOBO", "clan_name"],
  ["PAT_MADIBA", "clan_name"],
  ["PAT_KHAMA", "clan_name"],
  ["PAT_MAHLANGU", "clan_name"],
  ["PAT_GBAGUIDI", "clan_name"],
  ["PAT_MNTUNGWA_PRAISE", "praise_name"],
] as const;

function everyFiche() {
  const dir = resolve(process.cwd(), "dataset/source/afrik/patronymes");
  return readdirSync(dir)
    .filter((name) => /^PAT_.*\.json$/.test(name))
    .map((name) => readFiche(name.replace(/\.json$/, "")));
}

function nameSystemGaps(fiche: {
  gaps: { fieldPath: string; reason: string }[];
}) {
  return fiche.gaps.filter(({ fieldPath }) => fieldPath === "nameSystem");
}

function transmissionGaps(fiche: {
  gaps: { fieldPath: string; reason: string }[];
}) {
  return fiche.gaps.filter(({ fieldPath }) => fieldPath === "transmissionMode");
}

function readFiche(id: string) {
  return JSON.parse(
    readFileSync(
      resolve(process.cwd(), `dataset/source/afrik/patronymes/${id}.json`),
      "utf8"
    )
  );
}

describe("personal names filed as clan names (ETNI-2011)", () => {
  // @req REQ-133
  it.each(RECLASSIFIED)(
    "%s is filed as a personal name, with a gap saying no source classifies it",
    (id) => {
      const fiche = readFiche(id);

      expect(parsePatronymeFile(fiche).success).toBe(true);
      expect(fiche.nameSystem).toBe("non_hereditary_patronymic");
      expect(fiche.designatedSocialUnit).toBe("individual");
      const gap = fiche.gaps.find(
        ({ fieldPath }: { fieldPath: string }) => fieldPath === "nameSystem"
      );
      expect(gap, `${id}: nameSystem gap`).toBeDefined();
      expect(gap.reason).toMatch(/aucune source/i);
      expect(gap.reason).toMatch(/nom de clan/);
      expect(gap.reason).not.toMatch(/provisoire|hypothèse de classement/);
      expect(
        fiche.gaps.filter(
          ({ fieldPath }: { fieldPath: string }) => fieldPath === "nameSystem"
        )
      ).toHaveLength(1);
    }
  );

  // @req REQ-133
  it.each(KEPT)("%s keeps its %s typing", (id, nameSystem) => {
    expect(readFiche(id).nameSystem).toBe(nameSystem);
  });

  // @req REQ-133
  it.each(RECLASSIFIED_SECOND_PASS)(
    "%s is filed as a personal name, with one gap and no leftover unit gap",
    (id) => {
      const fiche = readFiche(id);

      expect(parsePatronymeFile(fiche).success).toBe(true);
      expect(fiche.nameSystem).toBe("non_hereditary_patronymic");
      expect(fiche.designatedSocialUnit).toBe("individual");
      const gaps = nameSystemGaps(fiche);
      expect(gaps, `${id}: one nameSystem gap`).toHaveLength(1);
      expect(gaps[0].reason).toMatch(/aucune source/i);
      expect(gaps[0].reason).toMatch(/nom de clan/);
      expect(gaps[0].reason).not.toMatch(
        /provisoire|hypothèse de classement|choix par défaut/
      );
      expect(
        fiche.gaps.some(
          ({ fieldPath }: { fieldPath: string }) =>
            fieldPath === "designatedSocialUnit"
        )
      ).toBe(false);
      expect(JSON.stringify(transmissionGaps(fiche))).not.toMatch(
        /Le nom de clan ne détermine/
      );
    }
  );

  // @req REQ-133
  it.each(HEREDITARY_FAMILY_NAMES)(
    "%s keeps the clan box with the lineage as unit, and a gap saying no source calls it a clan",
    (id) => {
      const fiche = readFiche(id);

      expect(parsePatronymeFile(fiche).success).toBe(true);
      expect(fiche.nameSystem).toBe("clan_name");
      expect(fiche.designatedSocialUnit).toBe("lineage");
      const gaps = nameSystemGaps(fiche);
      expect(gaps, `${id}: one nameSystem gap`).toHaveLength(1);
      expect(gaps[0].reason).toMatch(/aucune source/i);
      expect(gaps[0].reason).toMatch(/nom de famille/);
      expect(gaps[0].reason).toMatch(/sans dire/);
      expect(gaps[0].reason).not.toMatch(/choix par défaut/);
      expect(JSON.stringify(transmissionGaps(fiche))).not.toMatch(
        /Le nom de clan ne détermine/
      );
    }
  );

  // @req REQ-133
  it("PAT_BYARUHANGA keeps its typing and admits that no source classifies it", () => {
    const fiche = readFiche("PAT_BYARUHANGA");

    expect(fiche.nameSystem).toBe("clan_name");
    const gaps = nameSystemGaps(fiche);
    expect(gaps).toHaveLength(1);
    expect(gaps[0].reason).toMatch(/aucune source/i);
    expect(gaps[0].reason).toMatch(/sans dire/);
  });

  // @req REQ-133
  it.each(KEPT_SECOND_PASS)("%s keeps its %s typing", (id, nameSystem) => {
    expect(readFiche(id).nameSystem).toBe(nameSystem);
  });

  // @req REQ-133
  it.each(FANG_PERSONAL_NAMES)(
    "%s is a personal name passed from father to child, with one gap",
    (id) => {
      const fiche = readFiche(id);

      expect(parsePatronymeFile(fiche).success).toBe(true);
      expect(fiche.nameSystem).toBe("non_hereditary_patronymic");
      expect(fiche.designatedSocialUnit).toBe("individual");
      const gaps = nameSystemGaps(fiche);
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

  // @req REQ-133
  it.each(["PAT_MBA", "PAT_NGUEMA"])(
    "%s takes its father's name as second name, so its transmission is patrilineal",
    (id) => {
      const fiche = readFiche(id);

      expect(fiche.transmissionMode).toBe("patrilineal");
      expect(transmissionGaps(fiche)).toHaveLength(0);
    }
  );

  // @req REQ-133
  it.each(KEPT_FANG_BETI)("%s keeps its %s typing", (id, nameSystem) => {
    expect(readFiche(id).nameSystem).toBe(nameSystem);
  });

  // @req REQ-133
  it.each(MAURITANIAN_FILIATION)(
    "%s names the father of a person, so it is a patronymic and needs no nameSystem gap",
    (id) => {
      const fiche = readFiche(id);

      expect(parsePatronymeFile(fiche).success).toBe(true);
      expect(fiche.nameSystem).toBe("non_hereditary_patronymic");
      expect(fiche.designatedSocialUnit).toBe("individual");
      expect(nameSystemGaps(fiche)).toHaveLength(0);
      expect(JSON.stringify(fiche.gaps)).not.toMatch(/La nisba ne détermine/);
      expect(
        fiche.gaps.some(
          ({ fieldPath }: { fieldPath: string }) =>
            fieldPath === "designatedSocialUnit"
        )
      ).toBe(false);
    }
  );

  // @req REQ-133
  it.each(KEPT_MAGHREB_FAMILY_NAMES)(
    "%s stays a nisba and says the class is provisional",
    (id) => {
      const fiche = readFiche(id);

      expect(fiche.nameSystem).toBe("nisba");
      expect(nameSystemGaps(fiche)).toHaveLength(1);
      expect(nameSystemGaps(fiche)[0].reason).toMatch(/provisoire/);
    }
  );
});

describe("hereditary family names (ETNI-2011, sixth value)", () => {
  // @req REQ-133
  it.each(HEREDITARY_FAMILY_NAME_FICHES)(
    "%s is a hereditary family name, with no leftover box-is-missing gap",
    (id) => {
      const fiche = readFiche(id);

      expect(parsePatronymeFile(fiche).success).toBe(true);
      expect(fiche.nameSystem).toBe("hereditary_family_name");
      expect(fiche.designatedSocialUnit).toBe(
        HEREDITARY_FAMILY_NAME_LINEAGE.has(id) ? "lineage" : "other"
      );
      expect(nameSystemGaps(fiche)).toHaveLength(0);
      expect(fiche.nameHistory, `${id}: nameHistory`).toBeDefined();
    }
  );

  // @req REQ-133
  it("moves exactly the fiches listed above and no other", () => {
    const moved = everyFiche()
      .filter((fiche) => fiche.nameSystem === "hereditary_family_name")
      .map((fiche) => fiche.id)
      .sort();

    expect(moved).toEqual([...HEREDITARY_FAMILY_NAME_FICHES].sort());
  });

  // @req REQ-133
  it("leaves no fiche saying that the model has no box for a family name", () => {
    const stale = everyFiche().filter((fiche) =>
      fiche.gaps.some(
        ({ fieldPath, reason }: { fieldPath: string; reason: string }) =>
          fieldPath === "nameSystem" &&
          /n'a pas de case pour (un|ce) (nom|genre)[^.]*(famille)/.test(reason)
      )
    );

    expect(stale.map((fiche) => fiche.id)).toEqual([]);
  });

  // @req REQ-133
  it("keeps Taiwo's transmission coherent with a family name taken from the father", () => {
    expect(readFiche("PAT_TAIWO").transmissionMode).toBe("patrilineal");
  });
});

describe("third pass: waves 21 to 23 (ETNI-2011)", () => {
  // @req REQ-133
  it.each(THIRD_PASS_PORTUGUESE)(
    "%s is a hereditary family name, with the unit `other` and no clan wording left",
    (id) => {
      const fiche = readFiche(id);

      expect(parsePatronymeFile(fiche).success).toBe(true);
      expect(fiche.nameSystem).toBe("hereditary_family_name");
      expect(fiche.designatedSocialUnit).toBe("other");
      expect(nameSystemGaps(fiche)).toHaveLength(0);
      expect(JSON.stringify(transmissionGaps(fiche))).not.toMatch(
        /Le nom de clan ne détermine/
      );
      expect(JSON.stringify(fiche.nameHistory)).not.toMatch(/nom de clan/);
    }
  );

  // @req REQ-133
  it.each(PERSONAL_NAMES_THIRD_PASS)(
    "%s is filed as a personal name, with one gap and no leftover provisional wording",
    (id) => {
      const fiche = readFiche(id);

      expect(parsePatronymeFile(fiche).success).toBe(true);
      expect(fiche.nameSystem).toBe("non_hereditary_patronymic");
      expect(fiche.designatedSocialUnit).toBe("individual");
      const gaps = nameSystemGaps(fiche);
      expect(gaps, `${id}: one nameSystem gap`).toHaveLength(1);
      expect(gaps[0].reason).toMatch(/aucune source/i);
      expect(gaps[0].reason).toMatch(/nom de clan/);
      expect(gaps[0].reason).not.toMatch(
        /provisoire|hypothèse de classement|choix par défaut/
      );
      expect(
        fiche.gaps.some(
          ({ fieldPath }: { fieldPath: string }) =>
            fieldPath === "designatedSocialUnit"
        )
      ).toBe(false);
      expect(JSON.stringify(transmissionGaps(fiche))).not.toMatch(
        /Le nom de clan ne détermine/
      );
    }
  );

  // @req REQ-133
  it.each(KEPT_THIRD_PASS)("%s keeps its %s typing", (id, nameSystem) => {
    expect(readFiche(id).nameSystem).toBe(nameSystem);
  });

  // @req REQ-133
  it("keeps the bilateral transmission of the Portuguese names whose source gives it", () => {
    for (const id of [
      "PAT_MONTEIRO",
      "PAT_FERNANDES",
      "PAT_LOPES",
      "PAT_DUARTE",
      "PAT_NEVES",
    ]) {
      expect(readFiche(id).transmissionMode, id).toBe("bilateral");
    }
  });
});
