import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { RETIRED_PEOPLE_IDS } from "../../src/lib/afrik/retiredPeopleIds";
import { resolveAfrikFiche } from "../resolveAfrikFiche";

const CORPUS_ROOT = "dataset/source/afrik";
// The redirect registry is the one file that must keep naming a retired id.
const REDIRECT_REGISTRY = "_retired-identifiers.json";

function corpusFiles(directory: string): string[] {
  return readdirSync(directory).flatMap((entry) => {
    const path = join(directory, entry);
    if (statSync(path).isDirectory()) return corpusFiles(path);
    return path.endsWith(".json") && entry !== REDIRECT_REGISTRY ? [path] : [];
  });
}

function readDiola() {
  return JSON.parse(
    readFileSync(
      resolve(
        process.cwd(),
        CORPUS_ROOT,
        "peuples/FLG_ATLANTIQUE/PPL_DIOLA.json"
      ),
      "utf8"
    )
  );
}

describe("PPL_JOLA folded into PPL_DIOLA", () => {
  // @req REQ-178
  it("answers to « Jola » with exactly one people fiche, the one that carries the name history", () => {
    const exactPeopleMatches = resolveAfrikFiche("Jola")
      .filter((match) => match.kind === "people" && match.matchType === "exact")
      .map((match) => match.id);

    expect(exactPeopleMatches).toEqual(["PPL_DIOLA"]);
  });

  // @req REQ-178
  it("redirects the retired id to PPL_DIOLA in one hop, so an old link or bookmark still lands", () => {
    expect(RETIRED_PEOPLE_IDS["PPL_JOLA"]).toBe("PPL_DIOLA");
    expect(RETIRED_PEOPLE_IDS["PPL_DIOLA"]).toBeUndefined();
  });

  // @req REQ-178
  it("leaves no fiche, family name or patronyme pointing at PPL_JOLA", () => {
    const dangling = corpusFiles(resolve(process.cwd(), CORPUS_ROOT)).filter(
      (file) => /\bPPL_JOLA\b/.test(readFileSync(file, "utf8"))
    );

    expect(dangling).toEqual([]);
  });

  // @req REQ-178
  it("carries the sources, sub-groups and language code only the retired fiche held", () => {
    const { sources, ethnicities, languages } = readDiola().content;
    const titles = sources.map((source: { title: string }) => source.title);

    expect(titles).toEqual(
      expect.arrayContaining([
        "Glottolog — Jola",
        "Sage Reference — Encyclopedia of African Religion: Diola",
        "Academia.edu — Ritual and Masking Traditions in Jola Men's Initiation",
        "Baum, Robert M. — Shrines of the Slave Trade: Diola Religion and Society in Precolonial Senegambia. Oxford University Press, 1999",
        "Mark, Peter — A Cultural, Economic and Religious History of the Basse Casamance since 1500. Franz Steiner Verlag, 1985",
      ])
    );
    expect(ethnicities.some((line: string) => line.includes("Kuwaataay"))).toBe(
      true
    );
    expect(languages.isoCodes).toContain("csk");
  });

  // @req REQ-178
  it("cites each title and each locator once", () => {
    const { sources } = readDiola().content;
    const titles = sources.map((source: { title: string }) => source.title);
    const urls = sources
      .map((source: { url: string | null }) => source.url)
      .filter(Boolean);

    expect(new Set(titles).size).toBe(titles.length);
    expect(new Set(urls).size).toBe(urls.length);
  });
});
