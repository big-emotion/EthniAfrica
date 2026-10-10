import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { readNaming } from "@/lib/search/naming";
import { selectNameSubject } from "@/lib/search/nameSubject";
import type { SearchResult } from "@/types/afrik-frontend";

// PPL_JOLA was folded into PPL_DIOLA (#1629) and its row pruned, so the
// Diola fiche is now the only place « Jola » can lead. Reads the real fiche:
// a fixture would keep passing if the fiche stopped recording the form.
const DIOLA = JSON.parse(
  readFileSync(
    join(
      process.cwd(),
      "dataset/source/afrik/peuples/FLG_ATLANTIQUE/PPL_DIOLA.json"
    ),
    "utf8"
  )
);

const diolaResult: SearchResult = {
  type: "people",
  id: DIOLA.id,
  name: DIOLA.nameMain,
  languageFamilyId: DIOLA.languageFamilyId,
  relevance: 1,
  naming: readNaming("people", DIOLA.content),
};

describe("the English and Joola spellings still lead to the Diola", () => {
  // @req REQ-178
  it.each(["jola", "Jola", "joola", "Joola"])(
    "answers « %s » with PPL_DIOLA",
    (query) => {
      expect(
        selectNameSubject([diolaResult], query).map((subject) => subject.id)
      ).toEqual(["PPL_DIOLA"]);
    }
  );
});
