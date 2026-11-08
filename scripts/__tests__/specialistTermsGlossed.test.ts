import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const read = (path: string) =>
  readFileSync(resolve(process.cwd(), `dataset/source/afrik/${path}`), "utf8");

/**
 * The reader of a fiche is not assumed to have studied linguistics. A term
 * of the discipline carries its plain meaning where it first stands in a
 * field, unless that field already says it.
 */
describe("specialist terms in the fiches", () => {
  // @req REQ-143
  it("explains ATR where a vowel system is described with it", () => {
    for (const file of [
      "famille_linguistique/FLG_GUR.json",
      "peuples/FLG_KWA/PPL_NKONYA.json",
    ]) {
      expect(read(file), file).toContain("racine de la langue");
    }
    // The Mande, Niger-Congo and Nilo-Saharan fiches were rewritten from the
    // sources they cite on 2026-11-03 and no longer describe vowels with ATR;
    // if the term comes back there, it comes back with its gloss.
    for (const file of [
      "famille_linguistique/FLG_MANDE.json",
      "famille_linguistique/FLG_NIGERCONGO.json",
      "famille_linguistique/FLG_NILOSAHARIENNE.json",
    ]) {
      const text = read(file);
      if (/\bATR\b/.test(text)) {
        expect(text, file).toContain("racine de la langue");
      }
    }
  });

  // @req REQ-143
  it("does not leave « ATR » to mean two things: in the Hausa fiche it is a religion", () => {
    const hausa = read("peuples/FLG_TCHADIQUE/PPL_HAUSA.json");
    expect(hausa).not.toContain("(ATR)");
    expect(hausa).toContain("religion traditionnelle africaine");
  });

  // @req REQ-143
  it("explains glottochronology where it dates a separation", () => {
    for (const file of [
      "famille_linguistique/FLG_BERBERE.json",
      "peuples/FLG_BANTU/PPL_FANG.json",
    ]) {
      expect(read(file), file).toMatch(/glottochronologie \(méthode/);
    }
  });

  // @req REQ-143
  it("explains « agglutinant » in the Bantu family's typology", () => {
    // The premium rewrite of 2026-11-03 dropped the word with the unsourced
    // typology it belonged to; wherever it returns, it carries its gloss.
    const text = read("famille_linguistique/FLG_BANTU.json");
    const uses = text.match(/agglutinant\w*/g) ?? [];
    const glossed =
      text.match(/agglutinant\w* \(les mots se construisent/g) ?? [];
    expect(glossed.length).toBe(uses.length);
  });

  // @req REQ-143
  it("says « au fil du temps » where a fiche wrote « en diachronie »", () => {
    const text = read("peuples/FLG_KWA/PPL_EHOTILE.json");
    expect(text).not.toContain("en diachronie");
  });
});
