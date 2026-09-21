import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { RETIRED_PEOPLE_IDS } from "../../src/lib/afrik/retiredPeopleIds";
import { resolveAfrikFiche } from "../resolveAfrikFiche";

const CORPUS_ROOTS = ["dataset/source/afrik", "dataset/translations"];
// The redirect registry is the one file that must keep naming a retired id.
const REDIRECT_REGISTRY = "_retired-identifiers.json";
const RETIRED_IDS = ["PPL_FULANI", "PPL_FULA_SAHEL"];
const KEPT_SUBGROUP_FILES = [
  "peuples/FLG_ATLANTIQUE/PPL_FULANI_MASSINA.json",
  "peuples/FLG_NIGERCONGO/PPL_FULA_NOMADES.json",
  "peuples/FLG_NIGERCONGO/PPL_FULA_FORET.json",
];

function corpusFiles(directory: string): string[] {
  return readdirSync(directory).flatMap((entry) => {
    const path = join(directory, entry);
    if (statSync(path).isDirectory()) return corpusFiles(path);
    return path.endsWith(".json") && entry !== REDIRECT_REGISTRY ? [path] : [];
  });
}

function readFula() {
  return JSON.parse(
    readFileSync(
      resolve(
        process.cwd(),
        "dataset/source/afrik/peuples/FLG_ATLANTIQUE/PPL_FULA.json"
      ),
      "utf8"
    )
  );
}

describe("Fula fiches merged into PPL_FULA", () => {
  // @req REQ-178
  it("answers to « Peul » with exactly one people fiche, so the result page has nothing to disambiguate", () => {
    const exactPeopleMatches = resolveAfrikFiche("Peul")
      .filter((match) => match.kind === "people" && match.matchType === "exact")
      .map((match) => match.id);

    expect(exactPeopleMatches).toEqual(["PPL_FULA"]);
  });

  // @req REQ-178
  it("redirects both retired ids to PPL_FULA in one hop, so an old link or bookmark still lands", () => {
    for (const retired of RETIRED_IDS) {
      expect(RETIRED_PEOPLE_IDS[retired], retired).toBe("PPL_FULA");
    }
    expect(RETIRED_PEOPLE_IDS["PPL_FULA"]).toBeUndefined();
  });

  // @req REQ-178
  it("keeps the Massina, nomad and forest fiches as separate sub-groups", () => {
    for (const file of KEPT_SUBGROUP_FILES) {
      expect(
        existsSync(resolve(process.cwd(), "dataset/source/afrik", file)),
        file
      ).toBe(true);
    }
  });

  // @req REQ-178
  it("leaves no fiche, relation, family or translation pointing at a retired id", () => {
    const dangling: string[] = [];
    const retired = new RegExp(`\\b(${RETIRED_IDS.join("|")})\\b`);

    for (const root of CORPUS_ROOTS) {
      for (const file of corpusFiles(resolve(process.cwd(), root))) {
        if (retired.test(readFileSync(file, "utf8"))) dangling.push(file);
      }
    }

    expect(dangling).toEqual([]);
  });

  // @req REQ-178
  it("carries the historical events, sub-groups, sources and exonym that only the retired fiches held", () => {
    const fula = readFula();
    const { origins, ethnicities, sources, appellations } = fula.content;
    const sourceUrls = sources.map(
      (source: { url: string | null }) => source.url
    );

    expect(origins.majorHistoricalEvents).toContain("Sokoto");
    expect(ethnicities.some((line: string) => line.includes("Jelgooji"))).toBe(
      true
    );
    expect(
      ethnicities.some((line: string) => line.includes("Haalpulaar"))
    ).toBe(true);
    expect(
      appellations.exonyms.some((form: string) => form.startsWith("Toucouleur"))
    ).toBe(true);
    expect(sourceUrls).toEqual(
      expect.arrayContaining([
        "https://joshuaproject.net/people_groups/11773/ml",
        "https://www.sciencedirect.com/science/article/pii/S0002929724004579",
        "https://www.britannica.com/place/Fulani-Empire",
        "https://www.britannica.com/place/western-Africa/The-jihad-of-Usman-dan-Fodio",
      ])
    );
  });

  // @req REQ-178
  it("cites each locator once", () => {
    const urls = readFula()
      .content.sources.map((source: { url: string | null }) => source.url)
      .filter(Boolean);

    expect(new Set(urls).size).toBe(urls.length);
  });
});
