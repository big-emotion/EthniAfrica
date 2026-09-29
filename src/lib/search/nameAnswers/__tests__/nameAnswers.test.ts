import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { findNameAnswers, suggestNameTerms } from "@/lib/search/nameAnswers";
import { violatesReaderRegister } from "@/lib/editorial/readerRegister";

const DATASET = join(process.cwd(), "dataset/source/afrik");

function ficheExists(type: string, id: string): boolean {
  if (type === "language")
    return existsSync(join(DATASET, "langues", `${id}.json`));
  if (type === "country")
    return existsSync(join(DATASET, "pays", `${id}.json`));
  if (type === "people")
    return readdirSync(join(DATASET, "peuples"), { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .some((family) =>
        existsSync(join(DATASET, "peuples", family.name, `${id}.json`))
      );
  return false;
}

const TERMS = ["Lingala", "Bambara", "Mali", "Pygmée"];

describe("reviewed name answers", () => {
  // @req REQ-178
  it.each(TERMS)(
    "%s resolves, in both locales, on accents and case",
    (term) => {
      for (const language of ["fr", "en"] as const) {
        const answers = findNameAnswers(` ${term.toUpperCase()} `, language);
        expect(answers.length).toBeGreaterThan(0);
        for (const answer of answers) {
          expect(answer.paragraphs.length).toBeLessThanOrEqual(2);
          expect(answer.sources.length).toBeGreaterThan(0);
        }
      }
      expect(
        findNameAnswers(term.normalize("NFD").replace(/\p{M}/gu, ""))
      ).not.toEqual([]);
    }
  );

  // @req REQ-178
  it("keeps the Bambara people and language as two answers", () => {
    const answers = findNameAnswers("Bambara");
    expect(
      answers.map(({ subjects }) => subjects.map(({ type }) => type))
    ).toEqual([["people"], ["language"]]);
  });

  // @req REQ-178
  it("names only fiches that exist in the corpus", () => {
    for (const term of TERMS) {
      for (const { subjects } of findNameAnswers(term)) {
        for (const { type, id } of subjects) {
          expect(ficheExists(type, id), `${type}:${id}`).toBe(true);
        }
      }
    }
  });

  // A reviewed term is suggested for a near spelling, never substituted for it:
  // the reader picks it, and the page never claims « pigmée » was « Pygmée ».
  // @req REQ-125
  it.each([
    ["pigmée", ["Pygmée"]],
    ["Pigmee", ["Pygmée"]],
    ["bambra", ["Bambara"]],
    ["lingla", ["Lingala"]],
  ])(
    "suggests the reviewed term for a near spelling: %s",
    (query, expected) => {
      expect(suggestNameTerms(query)).toEqual(expected);
    }
  );

  // @req REQ-125
  it.each(["pygmée", "zzzzzz", "mal", "", "kossiwa"])(
    "suggests nothing for an exact match or a distant one: %s",
    (query) => {
      expect(suggestNameTerms(query)).toEqual([]);
    }
  );

  // @req REQ-125
  it("localizes the suggested term", () => {
    expect(suggestNameTerms("pigmy", "en")).toEqual(["Pygmy"]);
  });

  // @req REQ-178
  it("never matches on part of a name", () => {
    expect(findNameAnswers("mal")).toEqual([]);
    expect(findNameAnswers("")).toEqual([]);
  });

  // @req REQ-178
  it("keeps the workshop's vocabulary and identifiers off the page", () => {
    for (const term of TERMS) {
      for (const answer of findNameAnswers(term)) {
        const text = [...answer.paragraphs, answer.uncertainty ?? ""].join(" ");
        expect(text).not.toMatch(/\b(PPL|FLG|PAT)_/);
        expect(text).not.toMatch(/\batlas\b/i);
        expect(violatesReaderRegister(text)).toBe(false);
      }
    }
  });
});
