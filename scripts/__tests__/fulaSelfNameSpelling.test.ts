import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { transformPeopleHero } from "../../src/lib/peopleDataTransformer";
import { readAnswer } from "../../src/lib/search/answer";
import { selfNameLead } from "../../src/lib/search/searchedName";
import type { PeopleDetail } from "../../src/types/afrik-frontend";

// Seen on recette at 430 px on 2026-10-18: the Peul fiche's head wrote its
// self-name « Fulbe » without the ɓ its own name history writes, and its
// branch label and lede dropped the accents of « sénégambienne » and
// « sahélienne ». African spellings stay as the people write them, French
// prose carries its accents (doctrine; reader-facing register). Every case
// reads the fiches on disk.

const AFRIK = resolve(process.cwd(), "dataset/source/afrik");
const FULA = "peuples/FLG_ATLANTIQUE/PPL_FULA.json";

const read = (path: string) => JSON.parse(readFileSync(path, "utf8"));

function jsonFilesUnder(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) return jsonFilesUnder(path);
    return entry.endsWith(".json") && !entry.startsWith("_") ? [path] : [];
  });
}

// The fiche as /api/v2/peoples serves it: the content's chapters beside the
// root identifiers.
function asPeopleDetail(fiche: Record<string, unknown>): PeopleDetail {
  return {
    ...(fiche.content as object),
    id: fiche.id,
    nameMain: fiche.nameMain,
    languageFamilyId: fiche.languageFamilyId,
    currentCountries: fiche.currentCountries,
  } as PeopleDetail;
}

describe("PPL_FULA — the head and the result page write the self-name Fulɓe", () => {
  const fula = read(join(AFRIK, FULA));

  // @req REQ-178
  it("titles the fiche head with Fulɓe, and Pullo as written", () => {
    const hero = transformPeopleHero(asPeopleDetail(fula));

    expect(hero.selfAppellation).toBe("Fulɓe (pluriel), Pullo (singulier)");
  });

  // « Vous avez cherché peul. Ce peuple se nomme lui-même … »: the line reads
  // the first self-given form of the answer, which is the hero's.
  // @req REQ-178
  it("leads a search for « peul » to Fulɓe", () => {
    const answer = readAnswer("people", fula.content, fula);
    const lead = selfNameLead(answer.names, "peul");

    expect(lead?.self).toMatch(/^Fulɓe/);
    expect(lead?.self).not.toMatch(/Fulbe/);
  });

  // The authors' own spellings are what the history quotes: they keep the b.
  // @req REQ-178
  it("keeps the spellings the name history records as written by an author", () => {
    const written = fula.nameHistory.names
      .flatMap(
        (name: { accounts: Array<{ formAsWritten?: string }> }) => name.accounts
      )
      .map((account: { formAsWritten?: string }) => account.formAsWritten)
      .filter(Boolean);

    expect(written).toEqual(
      expect.arrayContaining([
        "Pullo (au singulier) et Fulbe (au pluriel)",
        "Fulbe, qui fait au singulier Pullo",
      ])
    );
  });
});

describe("the fiche heads write « sénégambienne » and « sahélienne » with their accents", () => {
  // The head's overline prints the branch label (ethnoLinguisticGroup), its
  // lede the historical region.
  const UNACCENTED = /(?<![\p{L}\p{N}])(?:senegambien|sahelien)/iu;

  // @req REQ-178
  it("finds no branch label or head lede in the corpus without those accents", () => {
    const faults = jsonFilesUnder(join(AFRIK, "peuples")).flatMap((path) => {
      const appellations = read(path).content?.appellations ?? {};
      return ["ethnoLinguisticGroup", "historicalRegion"]
        .filter((field) => UNACCENTED.test(appellations[field] ?? ""))
        .map((field) => `${relative(AFRIK, path)} ${field}`);
    });

    expect(faults).toEqual([]);
  });

  // @req REQ-178
  it("prints the Peul head's branch and region accented", () => {
    const hero = transformPeopleHero(asPeopleDetail(read(join(AFRIK, FULA))));

    expect(hero.ethnoLinguisticGroup).toBe(
      "Atlantique (branche sénégambienne)"
    );
    expect(hero.historicalRegion).toBe(
      "Bande sahélienne de l'Atlantique au Tchad"
    );
  });
});
