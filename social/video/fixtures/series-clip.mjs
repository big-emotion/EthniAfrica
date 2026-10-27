// The series 1 demonstration (fixtures/series-pays.mjs) with one content card
// turned into an external clip (Cartes 1.15.0-proposition), for the checks of
// the clip card: loaded, framed and drawn frame by frame. The source file is
// the caller's, relative to the piece folder like an episode's own media.
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { CARDS, seriesDemo } from "./series-pays.mjs";

export const CLIP_CARD = "serie-pays-02";
export const RIGHTS = {
  author: "Chaîne d'essai",
  licence: "licence d'essai",
  sourceUrl: "https://example.org/essai",
};

// `clip` overrides the clip's fields; `change(deck)` edits the cards after.
export function clipDemo(
  dir,
  { clip = {}, clips = null, change = () => {} } = {}
) {
  return seriesDemo(dir, {
    edit: (input) => {
      const deck = JSON.parse(readFileSync(CARDS, "utf8"));
      const card = deck.cards.find((c) => c.id === CLIP_CARD);
      card.image = clips
        ? { clips }
        : {
            clip: {
              src: "source.mp4",
              in: 0,
              out: 8,
              fx: 0.5,
              audio: { mode: "off", speech: false },
              place: "ESSAI, TOGO",
              rights: RIGHTS,
              ...clip,
            },
          };
      change(deck);
      writeFileSync(join(dir, "cards.json"), JSON.stringify(deck));
      input.cards = "cards.json";
    },
  });
}
