import { describe, expect, it } from "vitest";

import { CHAPITRE_LA_LANGUE } from "@/lib/dossiers/nommer/chapters/laLangue";
import { GLOSSARY_ENTRIES } from "@/lib/glossaire/entries";
import { DID_YOU_KNOW_FACTS } from "@/lib/home/didYouKnowFacts";

// Bleek wrote « aBa-ntu » in a 1857 manuscript and first printed it in 1858;
// the 1862 Comparative Grammar spread it. A sentence that gives 1862 as the
// year the word was forged states more than the sources establish.
const FLAT_1862_CLAIM =
  /(forg\w*|coined|devised|created|introduced)[^.]{0,80}1862|1862[^.]{0,40}(forg\w*|coined|devised)/i;

const bantuCopy = {
  "fr chapter": JSON.stringify(CHAPITRE_LA_LANGUE),
  "fr glossary": JSON.stringify(GLOSSARY_ENTRIES),
  "fr did-you-know": JSON.stringify(
    DID_YOU_KNOW_FACTS.find((f) => f.id === "bantou")
  ),
};

describe("dating of the word « Bantu »", () => {
  for (const [surface, text] of Object.entries(bantuCopy)) {
    // @req REQ-113
    it(`${surface} does not date the word's coining to 1862 alone`, () => {
      expect(text).not.toMatch(FLAT_1862_CLAIM);
    });
  }

  // @req REQ-113
  it("the reader-facing Bantu explanations name the earlier 1857/1858 use", () => {
    for (const surface of ["fr chapter", "fr did-you-know"] as const) {
      expect(bantuCopy[surface]).toMatch(/1857/);
      expect(bantuCopy[surface]).toMatch(/1858/);
    }
  });
});
