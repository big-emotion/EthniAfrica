import { readFileSync } from "node:fs";
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
  "PAT_KAZADI",
  "PAT_MOBUTU",
  "PAT_JOHNSON",
  "PAT_HAMDI",
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
  "PAT_KACI",
  "PAT_KOLLIE",
  "PAT_LUMBALA",
  "PAT_POHAMBA",
  "PAT_RITA",
  "PAT_RODRIGUES",
  "PAT_SEBASTIAO",
  "PAT_SEERUTTUN",
  "PAT_SHENOUDA",
  "PAT_SHIKONGO",
  "PAT_TOE",
  "PAT_WEAH",
  "PAT_DOSSOU",
  "PAT_BAPTISTA",
  "PAT_DOMINGOS",
  "PAT_GONCALVES",
  "PAT_LOURENCO",
  "PAT_KALALA",
  "PAT_ADEBAYO",
  "PAT_ADEYEMI",
  "PAT_BABATUNDE",
  "PAT_KEHINDE",
  "PAT_TAIWO",
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
  "PAT_EYOUM",
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

// Hereditary Ben / Bou / Ait + name, titles and given names used as family
// names: no box of the model fits, so they stay nisba with the gap that says
// the nisba class is provisional. A new value is proposed in the ruling, not
// implemented.
const KEPT_MAGHREB_FAMILY_NAMES = [
  "PAT_BELKACEM",
  "PAT_BENALI",
  "PAT_BOUMEDIENE",
  "PAT_BOUZID",
  "PAT_BENYOUCEF",
  "PAT_BEN_BADIS",
  "PAT_AMARA",
  "PAT_AMRANI",
  "PAT_CHERIF",
] as const;

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
