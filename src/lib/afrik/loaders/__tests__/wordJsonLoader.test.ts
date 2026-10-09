import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "fs";
import { tmpdir } from "os";
import { join } from "path";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  loadAllWordFiches,
  loadWords,
  type WordFiche,
} from "../wordJsonLoader";

vi.mock("@/lib/api/logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

const race = JSON.parse(
  readFileSync(
    join(process.cwd(), "dataset/source/afrik/mots/WRD_RACE.json"),
    "utf8"
  )
) as Record<string, unknown>;

let datasetRoot: string;

function writeWord(fileName: string, fiche: Record<string, unknown>) {
  const dir = join(datasetRoot, "mots");
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, fileName), JSON.stringify(fiche));
}

beforeEach(() => {
  datasetRoot = mkdtempSync(join(tmpdir(), "word-loader-"));
});

afterEach(() => {
  rmSync(datasetRoot, { recursive: true, force: true });
});

describe("loadAllWordFiches", () => {
  // @req REQ-196
  it("reads the corpus word fiche WRD_RACE with its nameHistory", () => {
    writeWord("WRD_RACE.json", race);

    const { words, errors } = loadAllWordFiches(datasetRoot);

    expect(errors).toEqual([]);
    expect(words).toHaveLength(1);
    expect(words[0]).toMatchObject({
      id: "WRD_RACE",
      nameMain: "race",
      wordLanguage: "fra",
      definition: race.definition,
      nameHistory: race.nameHistory,
    });
    expect(words[0].content).toEqual({
      relatedSubjects: race.relatedSubjects,
      gaps: race.gaps,
      sources: race.sources,
    });
  });

  // A word fiche exists only to tell the history of the word.
  // @req REQ-196
  it("names a fiche without nameHistory instead of loading it", () => {
    const withoutHistory: Record<string, unknown> = {
      ...race,
      id: "WRD_EMPTY",
    };
    delete withoutHistory.nameHistory;
    writeWord("WRD_EMPTY.json", withoutHistory);

    const { words, errors } = loadAllWordFiches(datasetRoot);

    expect(words).toEqual([]);
    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain("WRD_EMPTY.json");
    expect(errors[0]).toContain("nameHistory");
  });

  // @req REQ-196
  it("refuses a key the word model does not declare", () => {
    writeWord("WRD_RACE.json", { ...race, names: [] });

    const { errors } = loadAllWordFiches(datasetRoot);

    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain("WRD_RACE.json");
  });

  // @req REQ-196
  it("answers an empty batch when the corpus has no mots directory", () => {
    expect(loadAllWordFiches(datasetRoot)).toEqual({ words: [], errors: [] });
  });
});

function fakeSupabase(failOn?: string) {
  const writes: Array<{ table: string; payload: unknown }> = [];
  const from = (table: string) => ({
    upsert: (payload: unknown) => {
      writes.push({ table, payload });
      return Promise.resolve({
        error: failOn === table ? { message: "boom" } : null,
      });
    },
  });
  return { client: { from } as never, writes };
}

function word(overrides: Partial<WordFiche> = {}): WordFiche {
  return {
    id: "WRD_RACE",
    nameMain: "race",
    wordLanguage: "fra",
    definition: "Un mot.",
    content: { relatedSubjects: [], gaps: [], sources: [] },
    nameHistory: race.nameHistory as WordFiche["nameHistory"],
    ...overrides,
  };
}

describe("loadWords", () => {
  // @req REQ-196
  it("writes the word row with its name_history", async () => {
    const { client, writes } = fakeSupabase();

    const report = await loadWords(client, [word()]);

    expect(report).toEqual({ total: 1, inserted: 1, errors: [] });
    expect(writes).toEqual([
      {
        table: "afrik_words",
        payload: expect.objectContaining({
          id: "WRD_RACE",
          name_main: "race",
          word_language: "fra",
          definition: "Un mot.",
          content: { relatedSubjects: [], gaps: [], sources: [] },
          name_history: race.nameHistory,
        }),
      },
    ]);
  });

  // @req REQ-196
  it("validates without writing on a dry run", async () => {
    const { client, writes } = fakeSupabase();

    const report = await loadWords(client, [word()], { dryRun: true });

    expect(report).toEqual({ total: 1, inserted: 0, errors: [] });
    expect(writes).toEqual([]);
  });

  // @req REQ-196
  it("reports a rejected row and goes on with the next fiche", async () => {
    const { client } = fakeSupabase("afrik_words");

    const report = await loadWords(client, [word()]);

    expect(report.errors).toEqual(["WRD_RACE: afrik_words — boom"]);
  });
});
