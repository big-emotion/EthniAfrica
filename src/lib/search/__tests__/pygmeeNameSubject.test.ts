import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { readNaming } from "@/lib/search/naming";
import { selectNameSubject } from "@/lib/search/nameSubject";
import type { SearchResult } from "@/types/afrik-frontend";

const FICHES_DIR = join(
  process.cwd(),
  "dataset/source/afrik/peuples/FLG_BANTU"
);

// Reads the corpus fiche itself: the defect was in the data, so a fixture
// written by hand here would keep passing while the fiche stayed unsearchable.
function searchResultFromFiche(id: string): SearchResult {
  const fiche = JSON.parse(
    readFileSync(join(FICHES_DIR, `${id}.json`), "utf8")
  );
  return {
    type: "people",
    id,
    name: fiche.nameMain,
    relevance: 1,
    naming: readNaming("people", fiche.content),
  };
}

const FICHES_CARRYING_THE_WORD = [
  "PPL_PYGMEES_AUTOCHTONES",
  "PPL_TWA",
  "PPL_AKA",
];

describe("a search for « pygmée »", () => {
  const results = [
    ...FICHES_CARRYING_THE_WORD,
    // A neighbour that must not be dragged in by the word.
    "PPL_YAKA",
  ].map(searchResultFromFiche);

  // The exonym used to be filed « Pygmees (terme anthropologique colonial) »;
  // forms are compared whole, so no spelling of the bare word reached a subject.
  // @req REQ-178
  it.each(["pygmée", "pygmee", "Pygmées", "PYGMEES"])(
    "answers with every fiche that records the word, for %s",
    (query) => {
      const subjects = selectNameSubject(results, query);

      expect(subjects.map((entity) => entity.id).sort()).toEqual(
        [...FICHES_CARRYING_THE_WORD].sort()
      );
    }
  );

  // DEC-057: several entities answer to the name, so the page asks which one
  // rather than crowning the entry with the highest relevance.
  // @req REQ-178
  it("crowns none of them", () => {
    const ranked = results.map((entity, index) => ({
      ...entity,
      relevance: 100 - index * 40,
    }));

    expect(selectNameSubject(ranked, "pygmée")).toHaveLength(3);
  });
});
