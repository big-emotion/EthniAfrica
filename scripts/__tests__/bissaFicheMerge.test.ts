import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { RETIRED_PEOPLE_IDS } from "../../src/lib/afrik/retiredPeopleIds";

const CORPUS_ROOTS = ["dataset/source/afrik", "dataset/translations"];
// The redirect registry is the one file that must keep naming a retired id.
const REDIRECT_REGISTRY = "_retired-identifiers.json";
const RETIRED_IDS = ["PPL_BUSSA", "PPL_BUSANSI"];
const HOME_FACT_FILES = [
  "src/lib/home/didYouKnowFacts.ts",
  "src/lib/home/didYouKnowFacts.en.ts",
];

function corpusFiles(directory: string): string[] {
  return readdirSync(directory).flatMap((entry) => {
    const path = join(directory, entry);
    if (statSync(path).isDirectory()) return corpusFiles(path);
    return path.endsWith(".json") && entry !== REDIRECT_REGISTRY ? [path] : [];
  });
}

function readBissa() {
  return JSON.parse(
    readFileSync(
      resolve(
        process.cwd(),
        "dataset/source/afrik/peuples/FLG_MANDE/PPL_BISSA.json"
      ),
      "utf8"
    )
  );
}

describe("Bissa fiches merged into PPL_BISSA", () => {
  // @req REQ-178
  it("redirects both retired ids to PPL_BISSA in one hop, so an old link still lands", () => {
    for (const retired of RETIRED_IDS) {
      expect(RETIRED_PEOPLE_IDS[retired], retired).toBe("PPL_BISSA");
    }
    expect(RETIRED_PEOPLE_IDS["PPL_BISSA"]).toBeUndefined();
  });

  // @req REQ-178
  it("leaves no fiche file for a retired id, and none pointing at one", () => {
    const retired = new RegExp(`\\b(${RETIRED_IDS.join("|")})\\b`);
    const dangling: string[] = [];
    for (const root of CORPUS_ROOTS) {
      for (const file of corpusFiles(resolve(process.cwd(), root))) {
        if (retired.test(readFileSync(file, "utf8"))) dangling.push(file);
      }
    }
    expect(dangling).toEqual([]);
    for (const file of [
      "dataset/source/afrik/peuples/FLG_GUR/PPL_BUSSA.json",
      "dataset/source/afrik/peuples/FLG_NIGERCONGO/PPL_BUSANSI.json",
    ]) {
      expect(existsSync(resolve(process.cwd(), file)), file).toBe(false);
    }
  });

  // @req REQ-178
  it("points the home page's Bissa fact at the surviving fiche", () => {
    for (const file of HOME_FACT_FILES) {
      const text = readFileSync(resolve(process.cwd(), file), "utf8");
      expect(text, file).not.toMatch(/PPL_BUSANSI|PPL_BUSSA/);
    }
  });

  // @req REQ-178
  it("keeps the survivor under the Mande family its own text names", () => {
    const bissa = readBissa();
    expect(bissa.languageFamilyId).toBe("FLG_MANDE");
    expect(bissa.content.appellations.linguisticFamily).toBe("FLG_MANDE");
  });

  // @req REQ-178
  it("carries what only a retired fiche held: the Gormine dialect and the Busanga exonym of the Kusasi", () => {
    const bissa = readBissa();
    const dialects = bissa.content.languages.dialects.join(" ");
    const exonyms = bissa.content.appellations.exonyms.join(" ");
    expect(dialects).toContain("Gormine");
    expect(exonyms).toContain("Kusasi");
  });

  // @req REQ-178
  it("records every population estimate the three fiches gave instead of silently keeping one", () => {
    const source = readBissa().content.demography.source as string;
    for (const figure of ["1 206 000", "1 100 000", "600 000"]) {
      expect(source, figure).toContain(figure);
    }
  });

  // @req REQ-178
  it("keeps the sources each retired fiche cited, at the tier it gave them", () => {
    const sources = readBissa().content.sources as Array<{
      title: string;
      tier: string;
    }>;
    const titles = sources.map((s) => s.title).join(" | ");
    expect(titles).toContain("101 Last Tribes");
    expect(titles).toContain("Discover Burkina Faso");
    expect(sources.some((s) => s.tier === "needs_review")).toBe(true);
  });

  // @req REQ-178
  it("does not carry over the retired claim that Busa is a Nilo-Saharan language", () => {
    expect(JSON.stringify(readBissa())).not.toMatch(/nilo-saharienne/i);
  });
});
