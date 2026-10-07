import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

function readJson<T>(relativePath: string): T {
  return JSON.parse(
    readFileSync(resolve(process.cwd(), relativePath), "utf8")
  ) as T;
}

interface PeopleFiche {
  content: {
    languages: { isoCodes: string[] };
    sources: Array<{
      title: string;
      url: string | null;
      tier: string;
    }>;
  };
}

const tetela = readJson<PeopleFiche>(
  "dataset/source/afrik/peuples/FLG_NIGERCONGO/PPL_TETELA.json"
);

describe("DRC Tetela language identifier", () => {
  // @req REQ-032
  it("uses the Tetela ISO 639-3 code instead of the unrelated Tetum code", () => {
    expect(tetela.content.languages.isoCodes).toEqual(["tll"]);
  });

  // @req REQ-032
  it("cites the exact Glottolog Tetela record", () => {
    expect(tetela.content.sources).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          title: "Glottolog 5.3 — Tetela (tete1250)",
          url: "https://glottolog.org/resource/languoid/id/tete1250",
          tier: "official",
        }),
      ])
    );
  });
});
