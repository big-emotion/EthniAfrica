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
      "famille_linguistique/FLG_MANDE.json",
      "famille_linguistique/FLG_NIGERCONGO.json",
      "famille_linguistique/FLG_NILOSAHARIENNE.json",
      "peuples/FLG_KWA/PPL_NKONYA.json",
    ]) {
      expect(read(file), file).toContain("racine de la langue");
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
      "peuples/FLG_NIGERCONGO/PPL_KIKONGO.json",
    ]) {
      expect(read(file), file).toMatch(/glottochronologie \(méthode/);
    }
  });

  // @req REQ-143
  it("explains « agglutinant » in the Bantu family's typology", () => {
    expect(read("famille_linguistique/FLG_BANTU.json")).toMatch(
      /agglutinantes \(les mots se construisent/
    );
  });

  // @req REQ-143
  it("says « au fil du temps » where a fiche wrote « en diachronie »", () => {
    const text = read("peuples/FLG_KWA/PPL_EHOTILE.json");
    expect(text).not.toContain("en diachronie");
  });
});
