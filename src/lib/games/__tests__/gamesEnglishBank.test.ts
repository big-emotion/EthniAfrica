import { describe, expect, it } from "vitest";

import { RELATION_TYPE_LABEL_FR } from "@/lib/games/corpus";
import { RELATION_TYPE_LABEL_EN } from "@/lib/games/corpus.en";
import { GAME_DEFINITIONS } from "@/lib/games/gameRegistry";
import { GAME_DEFINITIONS_EN } from "@/lib/games/gameRegistry.en";
import { LANDMARKS } from "@/lib/games/landmarks";
import { LANDMARK_NAMES_EN } from "@/lib/games/landmarks.en";
import {
  frenchResidue,
  glossaryBreaches,
  readsAsUntranslated,
} from "@/test/englishBankParity";

/**
 * The three small banks the games read beside the scale facts: places, the
 * one registered game and relation labels. Each is
 * a record keyed by the French record's id, so a key added on one side and
 * not the other fails here rather than rendering a hole.
 */
describe("the English landmarks", () => {
  // @req REQ-145
  it("names every landmark the French table holds, and no other", () => {
    expect(Object.keys(LANDMARK_NAMES_EN).sort()).toEqual(
      Object.keys(LANDMARKS).sort()
    );
  });

  // @req REQ-145
  it("gives every landmark its English name, keeping a proper name verbatim", () => {
    for (const [id, landmark] of Object.entries(LANDMARKS)) {
      const counterpart = LANDMARK_NAMES_EN[id];
      expect(readsAsUntranslated(landmark.nameFr, counterpart.nameEn)).toBe(
        false
      );
      expect(
        frenchResidue(counterpart.nameEn, ["Pointe des Almadies"])
      ).toBeNull();
      expect(counterpart.provenance).toBe("machine");
    }
    expect(LANDMARK_NAMES_EN.KINSHASA.nameEn).toBe("Kinshasa");
    expect(LANDMARK_NAMES_EN.LE_CAP.nameEn).toBe("Cape Town");
  });
});

describe("the English game registry", () => {
  // @req REQ-145
  it("names and prompts every registered game, and no other", () => {
    expect(Object.keys(GAME_DEFINITIONS_EN).sort()).toEqual(
      GAME_DEFINITIONS.map((game) => game.id).sort()
    );
    for (const game of GAME_DEFINITIONS) {
      const counterpart = GAME_DEFINITIONS_EN[game.id];
      expect(readsAsUntranslated(game.nameFr, counterpart.nameEn)).toBe(false);
      expect(readsAsUntranslated(game.promptFr, counterpart.promptEn)).toBe(
        false
      );
      expect(frenchResidue(counterpart.nameEn)).toBeNull();
      expect(frenchResidue(counterpart.promptEn)).toBeNull();
      expect(glossaryBreaches(counterpart.promptEn)).toEqual([]);
      expect(counterpart.provenance).toBe("machine");
    }
  });
});

describe("the English relation labels", () => {
  // @req REQ-145
  it("labels every stored relation type, and no other", () => {
    expect(Object.keys(RELATION_TYPE_LABEL_EN).sort()).toEqual(
      Object.keys(RELATION_TYPE_LABEL_FR).sort()
    );
    for (const entry of Object.values(RELATION_TYPE_LABEL_EN)) {
      expect(entry.labelEn.length).toBeGreaterThan(0);
      expect(frenchResidue(entry.labelEn)).toBeNull();
      expect(entry.provenance).toBe("machine");
    }
  });
});
