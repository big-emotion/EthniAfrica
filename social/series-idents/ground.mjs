// The animated parchment ground's motion, shared by the idents and, since
// Cartes 1.12.0, by the series video's parchment card: the grain jumps every
// frame and the glow drifts a few pixels a second. One function, so the card
// moves its ground exactly as the idents do.
import { FPS } from "./shots.mjs";

export function groundMotion(t) {
  const f = Math.floor(t * FPS);
  return {
    grain: [((f * 73) % 256) - 128, ((f * 151) % 256) - 128],
    glow: [Math.sin(t * 0.35) * 60, Math.cos(t * 0.27) * 50],
  };
}
