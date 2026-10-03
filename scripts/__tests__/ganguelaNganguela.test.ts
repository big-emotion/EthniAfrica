import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { resolveAfrikFiche } from "../resolveAfrikFiche";

const read = (path: string) =>
  JSON.parse(readFileSync(resolve(process.cwd(), path), "utf8"));
const NGANGUELA =
  "dataset/source/afrik/peuples/FLG_NIGERCONGO/PPL_NGANGUELA.json";

describe("Ganguela and Nganguela are one name written two ways", () => {
  // @req REQ-178
  it("has no separate Ganguela fiche, so the same peoples are not listed twice", () => {
    const files = [
      "dataset/source/afrik/peuples/FLG_NIGERCONGO/PPL_GANGUELA.json",
      "dataset/source/afrik/peuples/FLG_BANTU/PPL_GANGUELA.json",
    ];
    for (const file of files) {
      expect(existsSync(resolve(process.cwd(), file)), file).toBe(false);
    }
  });

  // @req REQ-178
  it("answers to « Ganguela » with the one fiche, so the reader who types the Portuguese spelling arrives", () => {
    const matches = resolveAfrikFiche("Ganguela")
      .filter((match) => match.kind === "people")
      .map((match) => match.id);
    expect(matches).toContain("PPL_NGANGUELA");
    expect(matches).not.toContain("PPL_GANGUELA");
  });

  // @req REQ-178
  it("no longer tells the reader to merge with a fiche that was never published", () => {
    const text = JSON.stringify(read(NGANGUELA));
    expect(text).not.toMatch(/PPL_GANGUELA|doublon/i);
  });

  // @req REQ-178
  it("says what the name is: one spelling pair, a term the Ovimbundu applied, a census category", () => {
    const argument = read(NGANGUELA).content.appellations
      .whyProblematic as string;
    expect(argument).toContain("deux façons");
    expect(argument).toContain("Ovimbundu");
    expect(argument).toContain("recensement");
  });

  // @req REQ-178
  it("compares its population figure with nothing that does not exist", () => {
    const source = read(NGANGUELA).content.demography.source as string;
    expect(source).not.toContain("1 500 000");
  });

  // @req REQ-178
  it("cites the page of its source that carries the claim", () => {
    const sources = read(NGANGUELA).content.sources as Array<{
      title: string;
      url: string;
    }>;
    expect(
      sources.some((s) => s.url === "https://countrystudies.us/angola/63.htm")
    ).toBe(true);
  });

  // @req REQ-178
  it("lets the Angola fiche say what the Nganguela fiche says about the term", () => {
    const ago = read("dataset/source/afrik/pays/AGO.json");
    const entry = ago.content.majorPeoples.find(
      (p: { peopleId: string }) => p.peopleId === "PPL_NGANGUELA"
    );
    expect(entry.appellationRemarks).not.toMatch(
      /Pas de terme péjoratif connu/
    );
    expect(entry.appellationRemarks).toContain("Ovimbundu");
  });

  // @req REQ-095
  it("declares no name of its own, because its source calls the term an outsiders' category and the groups independent", () => {
    const appellations = read(NGANGUELA).content.appellations;
    expect(appellations.selfAppellation).toBeNull();
    // The meaning a blog gives the word in Luchazi is not lost: it stays in the origin text.
    expect(JSON.stringify(read(NGANGUELA).content.origins)).toContain(
      "lieu du soleil levant"
    );
  });
});
