// Derives a board's night variant from its day one.
//
// The charter's rule is that the two versions stay the same mockup — substitution,
// never a rewrite — because comparing a hand-drawn night board with its day board
// proves nothing about the theme. This makes the rule executable instead of
// hoping somebody remembers it.
//
//   node derive-night.mjs Fang.dc.html FangNuit.dc.html
//
// Every value on the right comes from the --afh-night-* group of
// src/styles/tokens/color.css, or from an accent ink the night theme rebinds.
import { readFileSync, writeFileSync } from "node:fs";

// Ordered: the longer, more specific patterns first.
const SWAPS = [
  // The page ground and the surfaces sitting on it.
  ["background: #fbf7f2", "background: #120e0a"], // --afh-night-ground
  ["background: #ffffff", "background: #1d1710"], // --afh-night-surface
  ["background: #f5ede0", "background: #271e14"], // --afh-night-surface-2
  ["#e8dfd3", "#3a2e1f"], // --afh-night-line
  // The inks.
  ["color: #2c2018", "color: #f1e7d8"], // --afh-night-ink
  ["color: #746557", "color: #c9b99f"], // --afh-night-ink-2
  ['stroke="#746557"', 'stroke="#c9b99f"'],
  // The accent inks the night theme flips.
  ["color: #835514", "color: #e8b96a"], // --afh-night-ocre-soft
  ["#974331", "#cd725e"], // --afh-cat-terre-ink-night
  ["#9b3030", "#d98a7a"], // --afh-night-colonial
  // A pale tint has no night twin, so each becomes the dark surface its accent
  // belongs to rather than a lightened hex.
  ["background: #f0d2c8", "background: #2f201a"],
  ["background: #f1d9ae", "background: #33281a"],
  ["background: #fce8e8", "background: #301c1c"],
  // The dashed rule of a declared silence.
  ["#cfc3b4", "#5a4a37"],
  // Link colours in the helmet.
  [
    "a { color: #835514; } a:hover { color: #5c3b0e; }",
    "a { color: #e8b96a; } a:hover { color: #f1d9ae; }",
  ],
];

const [source, target] = process.argv.slice(2);
if (!source || !target) {
  console.error("usage: node derive-night.mjs <Day.dc.html> <DayNuit.dc.html>");
  process.exit(1);
}

let html = readFileSync(new URL(source, import.meta.url), "utf8");
let hits = 0;
for (const [from, to] of SWAPS) {
  hits += html.split(from).length - 1;
  html = html.split(from).join(to);
}

// A light value left behind means the swap list has fallen behind the board.
for (const leftover of ["#fbf7f2", "#e8dfd3"]) {
  if (html.includes(leftover)) {
    console.error(`${target}: ${leftover} survived the substitution`);
    process.exit(1);
  }
}

writeFileSync(new URL(target, import.meta.url), html);
console.log(`${source} -> ${target}  ${hits} substitutions`);
