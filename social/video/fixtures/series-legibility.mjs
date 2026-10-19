// The series 1 demonstration (fixtures/series-pays.mjs) with every card's
// picture replaced by one plain picture, for the legibility checks of
// Cartes 1.9.0 (handoff, « Renderer integration of 1.9.0 », checks 3 to 5):
// on pure white the text must stand on its own double outline; on pure black
// the second contour must not show. The picture's file is the caller's: the
// engine reads pictures from the design system's assets folder, as an
// episode's own pictures are read (assets/Piece/).
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { CARDS, seriesDemo } from "./series-pays.mjs";

export const PICTURE = { w: 1080, h: 1920 };

// The cover, each card while its longest subtitle is fully drawn (the
// ending's chunks are voiced, not read) and the last frame.
export function legibilityFrames(seq) {
  const read = seq.cards.flatMap((_, card) => {
    const chunks = seq.chunks.filter((c) => c.card === card && !c.hidden);
    if (!chunks.length) return [];
    const longest = chunks.reduce((a, b) =>
      b.lines.length > a.lines.length ? b : a
    );
    return [Math.round((longest.fullFrom + longest.fullTo) / 2)];
  });
  return [0, ...read, seq.frames - 1];
}

// `change(deck)` edits the cards after their pictures are replaced (1.10.0:
// a card's own `image.calm`, a longer title or foot).
export function plainPictureDemo(dir, src, change = () => {}) {
  return seriesDemo(dir, {
    edit: (input) => {
      const deck = JSON.parse(readFileSync(CARDS, "utf8"));
      deck.cards = deck.cards.map((c) =>
        c.image ? { ...c, image: { src, ...PICTURE, focus: [0.5, 0.5] } } : c
      );
      change(deck);
      writeFileSync(join(dir, "cards.json"), JSON.stringify(deck));
      input.cards = "cards.json";
    },
  });
}
