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
});
