import { readdirSync, readFileSync } from "fs";
import { join } from "path";
import { describe, expect, it } from "vitest";

import { parseNameHistory } from "@/lib/afrik/parsers/nameHistoryParser";
import { parseNameRecordFile } from "@/lib/afrik/parsers/nameRecordParser";
import { nameRecordsFromHistory } from "@/lib/afrik/nameHistoryRecords";
import type {
  NameRecordDossier,
  NameRecordEntry,
  NameRecordSource,
} from "@/types/names";

import {
  foldNameRecordDossier,
  sourceKindOf,
  withNameHistory,
} from "../foldNameRecords";

const NOMS_ROOT = join(
  __dirname,
  "..",
  "..",
  "dataset",
  "source",
  "afrik",
  "noms"
);
const NOMS_FILES = readdirSync(NOMS_ROOT).filter((file) =>
  file.endsWith(".json")
);

function dossierOf(file: string): NameRecordDossier {
  const parsed = parseNameRecordFile(
    JSON.parse(readFileSync(join(NOMS_ROOT, file), "utf-8"))
  );
  if (!parsed.success) throw new Error(JSON.stringify(parsed.errors));
  return parsed.data;
}

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
 * service applies to a row (`?? null`, `?? false`, `?? []`). Comparing at this
 * level is the fold's promise: the reader sees the same names after it.
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

describe("folding the noms/ records into nameHistory", () => {
  // @req REQ-196
  it("has the twelve records to fold", () => {
    expect(NOMS_FILES).toHaveLength(12);
  });

  // @req REQ-196
  it.each(NOMS_FILES)(
    "%s folds into a block the shared schema accepts",
    (file) => {
      const parsed = parseNameHistory(foldNameRecordDossier(dossierOf(file)));

      expect(parsed.errors).toEqual([]);
    }
  );

  // @req REQ-196
  it.each(NOMS_FILES)(
    "%s serves the same forms, attestations and answer-card fields once folded",
    (file) => {
      const dossier = dossierOf(file);
      const history = parseNameHistory(foldNameRecordDossier(dossier)).data;

      expect(nameRecordsFromHistory(history).map(served)).toEqual(
        dossier.names.map(served)
      );
    }
  );

  // @req REQ-196
  it("keeps every source, each with a source_kind and never ai_generated", () => {
    for (const file of NOMS_FILES) {
      const block = foldNameRecordDossier(dossierOf(file));
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
  it("maps a debated origin onto a hypothesis group on the name's meaning", () => {
    const fula = foldNameRecordDossier(dossierOf("PPL_FULA.json"));
    const toucouleur = fula.names.find(
      (name) => name.nameText === "Toucouleur"
    );
    const peul = fula.names.find((name) => name.nameText === "Peul");

    expect(
      toucouleur.accounts.find((account) => account.aspect === "meaning")
        .hypothesisGroup
    ).toBeDefined();
    expect(peul.accounts.some((account) => account.hypothesisGroup)).toBe(
      false
    );
  });

  // @req REQ-196
  it("turns each written trace into a dated account that keeps its page", () => {
    const fula = foldNameRecordDossier(dossierOf("PPL_FULA.json"));
    const fulaName = fula.names.find((name) => name.nameText === "Fula");
    const traces = fulaName.accounts.filter((account) => account.formAsWritten);

    expect(traces[0]).toMatchObject({
      formAsWritten: "Fulos",
      period: { from: null, to: null, label: "Manuscrit daté de 1594" },
      actors: [
        {
          name: "André Álvares de Almada, Tratado breve dos Rios de Guiné do Cabo Verde",
        },
      ],
    });
    expect(traces[0].statement).toMatch(/^Le nom Fula est écrit « Fulos »/);
    expect(traces[0].sources[0].page).toBe("p. 658");
  });

  // @req REQ-196
  it("opens the summary with the name the people gives itself", () => {
    const igbo = foldNameRecordDossier(dossierOf("PPL_IGBO.json"));

    expect(igbo.summary).toBe(
      "Le nom Ndi Igbo est celui que ce peuple se donne. On le connaît aussi sous les noms Ibo et Union Ibo. Leur histoire est présentée plus bas."
    );
    expect(foldNameRecordDossier(dossierOf("PPL_WOLOF.json")).summary).toBe(
      "Le nom Wolof est celui que ce peuple se donne. Son histoire est présentée plus bas."
    );
    expect(foldNameRecordDossier(dossierOf("PPL_FULA.json")).summary).toMatch(
      /L'origine des noms Fulɓe, Fula, Fellata et Toucouleur est débattue\./
    );
  });

  // @req REQ-196
  it("refuses to fold a record it could not serve back whole", () => {
    const dossier = dossierOf("PPL_IGBO.json");
    dossier.names[1] = { ...dossier.names[1], impositionPeriod: null };

    expect(() => foldNameRecordDossier(dossier)).toThrow(/PPL_IGBO.*Ibo/);
  });
});

describe("classifying a folded source", () => {
  // @req REQ-196
  it("reads the kind from where the source lives", () => {
    expect(
      sourceKindOf({ url: "https://www.ethnologue.com/language/wol/" })
    ).toBe("linguistic_reference");
    expect(sourceKindOf({ url: "https://fr.wikipedia.org/wiki/Peuls" })).toBe(
      "community"
    );
    expect(
      sourceKindOf({
        url: "https://unesdoc.unesco.org/ark:/48223/pf0000184312",
      })
    ).toBe("intergovernmental");
  });

  // @req REQ-196
  it("refuses to guess a kind for a source it does not know", () => {
    expect(() =>
      sourceKindOf({ url: "https://unknown.example.org/x" })
    ).toThrow(/unknown\.example\.org/);
  });
});

describe("writing the block into a fiche", () => {
  // @req REQ-196
  it("appends nameHistory last, keeping the file's indentation and key order", () => {
    const fiche = '{\n    "id": "PPL_X",\n    "content": { "a": 1 }\n}\n';

    const written = withNameHistory(fiche, { summary: "Le nom X.", names: [] });

    expect(written).toBe(
      '{\n    "id": "PPL_X",\n    "content": { "a": 1 },\n    "nameHistory": {\n        "summary": "Le nom X.",\n        "names": []\n    }\n}\n'
    );
  });

  // @req REQ-196
  it("refuses to overwrite a block the fiche already carries", () => {
    expect(() =>
      withNameHistory('{\n  "nameHistory": {}\n}\n', {
        summary: "x",
        names: [],
      })
    ).toThrow(/already/);
  });
});
