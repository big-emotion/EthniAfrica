/**
 * The noms/ records now live in their fiches' nameHistory (ETNI-2021). These
 * tests hold the fold's promise against the records it replaced: the same
 * forms, written traces and answer-card fields, every source kept with a
 * source_kind.
 */
import { readFileSync } from "fs";
import { join } from "path";
import { describe, expect, it } from "vitest";

import { nameRecordsFromHistory } from "@/lib/afrik/nameHistoryRecords";
import { parseNameHistory } from "@/lib/afrik/parsers/nameHistoryParser";
import type { NameRecordEntry, NameRecordSource } from "@/types/names";

import {
  FOLDED_RECORD_FILES,
  enrichedLikeFiche,
  ficheNameHistory,
  foldedRecord,
} from "./fixtures/foldedNameRecords";

// The record's own source fields; the block adds a source_kind on top.
function recordSourceFields({
  title,
  author,
  year,
  url,
  tier,
  notes,
}: NameRecordSource) {
  return {
    title,
    author,
    year,
    url,
    tier,
    ...(notes !== undefined ? { notes } : {}),
  };
}

/**
 * What GET /v2/peoples/{id}/names serves for one name, with the defaults the
 * service applies to a row (`?? null`, `?? false`, `?? []`).
 */
function served(
  entry: Omit<NameRecordEntry, "sources"> & { sources: NameRecordSource[] }
) {
  return {
    nameText: entry.nameText,
    nameType: entry.nameType,
    languageOfOrigin: entry.languageOfOrigin,
    meaning: entry.meaning,
    periodLabel: entry.periodLabel,
    imposedBy: entry.imposedBy,
    impositionPeriod: entry.impositionPeriod,
    whyProblematic: entry.whyProblematic,
    contemporaryUsage: entry.contemporaryUsage,
    sortRank: entry.sortRank,
    sources: entry.sources.map(recordSourceFields),
    attestations: entry.attestations ?? [],
    shortLine: entry.shortLine ?? null,
    namedBy: entry.namedBy ?? null,
    originDebated: entry.originDebated ?? false,
    usedIn: entry.usedIn ?? [],
    pronunciation: entry.pronunciation ?? null,
  };
}

describe("the noms/ records folded into their people fiches", () => {
  // @req REQ-196
  it("covers the twelve records", () => {
    expect(FOLDED_RECORD_FILES).toHaveLength(12);
  });

  // @req REQ-196
  it.each(FOLDED_RECORD_FILES)(
    "%s: the fiche serves the forms, traces and answer-card fields the record served",
    (file) => {
      const folded = foldedRecord(file);
      const parsed = parseNameHistory(ficheNameHistory(folded.id));
      const record = enrichedLikeFiche(folded, parsed.data);

      expect(parsed.errors).toEqual([]);
      expect(nameRecordsFromHistory(parsed.data).map(served)).toEqual(
        record.names.map(served)
      );
    }
  );

  // @req REQ-196
  it("keeps every source with a source_kind, never ai_generated", () => {
    for (const file of FOLDED_RECORD_FILES) {
      const block = ficheNameHistory(foldedRecord(file).id);
      const kinds = block.names.flatMap((name) => [
        ...name.accounts.flatMap((account) =>
          account.sources.map((source) => source.source_kind)
        ),
        ...(name.pronunciation ? [name.pronunciation.source.source_kind] : []),
      ]);

      expect(kinds.length).toBeGreaterThan(0);
      expect(kinds).not.toContain(undefined);
      expect(kinds).not.toContain("ai_generated");
    }
  });

  // @req REQ-196
  it("tells each competing origin as its own account of one hypothesis group", () => {
    const fula = ficheNameHistory("PPL_FULA");
    const accountsOf = (nameText: string) =>
      fula.names.find((name) => name.nameText === nameText).accounts;
    const toucouleurOrigins = accountsOf("Toucouleur").filter(
      (account) => account.hypothesisGroup === "origine du nom Toucouleur"
    );

    expect(toucouleurOrigins.length).toBeGreaterThanOrEqual(2);
    // No origin is crowned: none of them is the account the answer card reads.
    expect(toucouleurOrigins.some((account) => account.aspect)).toBe(false);
    expect(accountsOf("Peul").some((account) => account.hypothesisGroup)).toBe(
      false
    );
  });

  // @req REQ-196
  it("tells each origin once: the meaning names the hypotheses, their tiles attribute them", () => {
    const toucouleur = ficheNameHistory("PPL_FULA").names.find(
      (name) => name.nameText === "Toucouleur"
    ).accounts;
    const meaning = toucouleur.find((account) => account.aspect === "meaning");
    const origins = toucouleur.filter((account) => account.hypothesisGroup);

    for (const author of ["Djibril Tamsir Niane", "Bérenger-Féraud", "Horta"]) {
      expect(meaning.statement).not.toContain(author);
      expect(origins.some((tile) => tile.statement.includes(author))).toBe(
        true
      );
    }
    // The tile that took over Horta's link to Tukulër cites him.
    expect(
      origins.some((tile) =>
        tile.sources.some((source) => source.author === "José da Silva Horta")
      )
    ).toBe(true);
  });

  // @req REQ-196
  it("keeps each written trace dated and cited at its page", () => {
    const fula = ficheNameHistory("PPL_FULA");
    const [trace] = fula.names
      .find((name) => name.nameText === "Fula")
      .accounts.filter((account) => account.formAsWritten);

    expect(trace).toMatchObject({
      formAsWritten: "Fulos",
      period: { from: 1594, to: 1594, label: "Manuscrit daté de 1594" },
    });
    expect(trace.statement).toMatch(/^Le nom Fula est écrit « Fulos »/);
    expect(trace.sources[0].page).toBe("p. 658");
  });

  // @req REQ-196
  it("opens each summary with the name the people gives itself", () => {
    expect(ficheNameHistory("PPL_HERERO").summary).toBe(
      "Le nom Ovaherero est celui que ce peuple se donne. On le connaît aussi sous le nom Herero. Leur histoire est présentée plus bas."
    );
    expect(ficheNameHistory("PPL_WOLOF").summary).toBe(
      "Le nom Wolof est celui que ce peuple se donne. Son histoire est présentée plus bas."
    );
  });
});

describe("Yamoussoukro's names folded into its own nameHistory", () => {
  // The legacy names[] as they stood before DEC-071 retired them from the
  // fiche; kept only as the evidence the fold is checked against.
  const LEGACY_NAMES = JSON.parse(
    readFileSync(
      join(__dirname, "fixtures", "foldedPlaceNames.LOC_YAMOUSSOUKRO.json"),
      "utf-8"
    )
  ).names;
  const PLACE = JSON.parse(
    readFileSync(
      join(
        process.cwd(),
        "dataset",
        "source",
        "afrik",
        "lieux",
        "LOC_YAMOUSSOUKRO.json"
      ),
      "utf-8"
    )
  );

  // @req REQ-196
  it("keeps every statement and source of every name the legacy block listed", () => {
    expect(LEGACY_NAMES.length).toBeGreaterThan(0);
    LEGACY_NAMES.forEach((name, index) => {
      const folded = PLACE.nameHistory.names[index];
      expect(folded).toMatchObject({
        nameText: name.nameText,
        shortLine: name.shortLine,
        namedBy: name.namedBy,
        periodLabel: name.periodLabel,
        languageOfOrigin: name.languageOfOrigin,
      });
      expect(folded.accounts.map((account) => account.statement)).toEqual(
        expect.arrayContaining(
          [
            name.meaning,
            name.contemporaryUsage,
            ...name.accounts.map((account) => account.statement),
          ].filter(Boolean)
        )
      );
      const titles = new Set(
        folded.accounts.flatMap((account) =>
          account.sources.map((source) => source.title)
        )
      );
      for (const source of [
        ...name.sources,
        ...name.accounts.flatMap((account) => account.sources),
      ]) {
        expect(titles).toContain(source.title);
      }
    });
  });

  // @req REQ-196
  it("keeps nameHistory as the place's only list of names", () => {
    expect(PLACE).not.toHaveProperty("names");
    expect(PLACE).not.toHaveProperty("accounts");
    expect(PLACE).not.toHaveProperty("attestations");
  });

  // @req REQ-196
  it("shows the competing origins of Yamoussoukro as one unranked hypothesis group", () => {
    const [yamoussoukro, ngokro] = PLACE.nameHistory.names;
    const narratives = yamoussoukro.accounts.filter(
      (account) => account.aspect === undefined
    );

    expect(yamoussoukro.nameStatus).toBe("current");
    expect(ngokro.nameStatus).toBe("former");
    expect(narratives).toHaveLength(3);
    expect(
      new Set(narratives.map((account) => account.hypothesisGroup))
    ).toEqual(new Set(["origine du nom"]));
  });

  // @req REQ-196
  it("dates an account only when its label is a year or a decade", () => {
    const periods = PLACE.nameHistory.names
      .flatMap((name) => name.accounts)
      .filter((account) => account.aspect === undefined)
      .map(({ period }) => period);

    expect(periods).toEqual([
      { from: 1904, to: 1904, label: "1904" },
      { from: null, to: null, label: "Après 1909 ; 1910 selon la Fondation" },
      { from: null, to: null, label: "Début du XXe siècle" },
      { from: 1848, to: 1848, label: "1848" },
      { from: 1860, to: 1869, label: "Années 1860" },
    ]);
  });
});
