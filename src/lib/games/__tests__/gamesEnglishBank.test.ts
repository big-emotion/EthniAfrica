import { describe, expect, it } from "vitest";

import { GAME_DEFINITIONS } from "@/lib/games/gameRegistry";
import { GAME_DEFINITIONS_EN } from "@/lib/games/gameRegistry.en";
import { frenchResidue, readsAsUntranslated } from "@/test/englishBankParity";

/**
 * The registered game's English bank is keyed by the French registry's ids,
 * so a game added on one side and not the other fails here rather than
 * rendering a hole.
 */
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
      expect(counterpart.provenance).toBe("machine");
    }
  });
});
