import fs from "fs";
import os from "os";
import path from "path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  findAssertiveEtymologies,
  findAssertiveSentences,
} from "../findAssertiveEtymologies";

describe("findAssertiveSentences", () => {
  // @req REQ-178
  it.each([
    'Le nom "Cameroun" dérive du portugais "Rio dos Camarões".',
    "Le nom Ouganda vient du royaume du Buganda.",
    "Le terme signifie litteralement les nombreux invincibles.",
    "Il derive de Watetera, terme arabe.",
    "Les orthographes variantes proviennent des transcriptions coloniales.",
    "Le nom est issu du mot bantou -ntu.",
    "Le peuple tire son nom de la riviere Kasai.",
    "Kakwa Salia Musala, qui se traduit par Kakwa trois pays.",
    "Fulɓe, signifiant les dispersés, est le nom qu'ils se donnent.",
    "Le nom vient probablement du mot wolof jolof.",
  ])("flags an origin stated as fact: %s", (sentence) => {
    expect(findAssertiveSentences(sentence)).toEqual([sentence]);
  });

  // @req REQ-178
  it.each([
    "Le nom viendrait du portugais Rio dos Camarões.",
    "Le terme signifierait les nombreux invincibles.",
    "Selon Delafosse, le nom vient du mot malinké.",
    "Le nom vient du mot jolof, d'après la tradition orale.",
    "Une hypothèse fait dériver le nom du mot kasai.",
    "Le nom pourrait venir du mot kasai, qui signifie rivière.",
    "Le terme Pygmées est un terme colonial aujourd'hui considéré péjoratif.",
    "Les Aka préfèrent être désignés par leur nom propre.",
    "Les Anyi sont des groupes issus de l'État Aowin après 1715.",
  ])("leaves a hypothesis, an attribution or a usage alone: %s", (sentence) => {
    expect(findAssertiveSentences(sentence)).toEqual([]);
  });

  // @req REQ-178
  it("reports only the asserting sentence of a longer field", () => {
    const text =
      "Le nom Ouganda vient du royaume du Buganda. Les Britanniques l'emploient depuis 1894. Selon Roscoe, ganda signifie frère.";
    expect(findAssertiveSentences(text)).toEqual([
      "Le nom Ouganda vient du royaume du Buganda.",
    ]);
  });

  // @req REQ-178
  it("does not mistake « portrait » for a conditional", () => {
    expect(
      findAssertiveSentences("Le nom vient d'un portrait colonial du peuple.")
    ).toHaveLength(1);
  });
});

describe("findAssertiveEtymologies", () => {
  let datasetRoot: string;

  function writeFiche(relativePath: string, fiche: unknown): void {
    const filePath = path.join(datasetRoot, relativePath);
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(fiche, null, 2), "utf8");
  }

  beforeEach(() => {
    datasetRoot = fs.mkdtempSync(path.join(os.tmpdir(), "etymologies-"));
  });

  afterEach(() => {
    fs.rmSync(datasetRoot, { recursive: true, force: true });
  });

  // @req REQ-178
  it("reads the people exonym origin and the country etymology, and nothing else", () => {
    writeFiche("peuples/FLG_BANTU/PPL_A.json", {
      id: "PPL_A",
      content: {
        appellations: { originOfExonyms: "Le nom vient du mot a." },
        origins: { ancientOrigins: "Le peuple vient du nord." },
      },
    });
    writeFiche("peuples/FLG_BANTU/PPL_B.json", {
      id: "PPL_B",
      content: {
        appellations: { originOfExonyms: "Le nom viendrait du mot b." },
      },
    });
    writeFiche("pays/CMR.json", {
      id: "CMR",
      etymology: "Le nom dérive du portugais Rio dos Camarões.",
      nameOriginActor: "Le nom provient des navigateurs portugais.",
    });

    const found = findAssertiveEtymologies(datasetRoot);

    expect(
      found.map(({ fiche, field, sentences }) => ({ fiche, field, sentences }))
    ).toEqual([
      {
        fiche: "pays/CMR.json",
        field: "etymology",
        sentences: ["Le nom dérive du portugais Rio dos Camarões."],
      },
      {
        fiche: "peuples/FLG_BANTU/PPL_A.json",
        field: "content.appellations.originOfExonyms",
        sentences: ["Le nom vient du mot a."],
      },
    ]);
  });
});
