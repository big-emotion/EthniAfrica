#!/usr/bin/env node
/**
 * node social/tools/narration/check-narration.mjs <narration.fr.txt>
 *
 * Refuses a narration that breaks the plain-language rule (see
 * `plain-language.mjs`). `ethniafrica-structure` runs it before showing a text
 * to the operator; a text that fails is rewritten first, not shown.
 */
import { readFileSync } from "node:fs";

import { appliquerRevues, verifierNarration } from "./plain-language.mjs";

const [chemin, option, cheminRevues] = process.argv.slice(2);
if (!chemin || (option && (option !== "--revues" || !cheminRevues))) {
  console.error(
    "usage : check-narration.mjs <narration.fr.txt> [--revues <revues.json>]"
  );
  process.exit(2);
}

// A review is a JSON list of {phrase, regle, raison}: the one way a lexical
// finding on an ambiguous sentence is accepted (see `appliquerRevues`).
const revues = cheminRevues
  ? JSON.parse(readFileSync(cheminRevues, "utf-8"))
  : [];
const {
  bloquantes,
  revues: relues,
  invalides,
  perimees,
} = appliquerRevues(verifierNarration(readFileSync(chemin, "utf-8")), revues);

for (const t of bloquantes) {
  console.log(
    `scène ${t.paragraphe} · ${t.regle} · ${t.detail}\n  ${t.phrase}`
  );
}
for (const t of relues) {
  console.log(
    `scène ${t.paragraphe} · ${t.regle} · relue : ${t.raison}\n  ${t.phrase}`
  );
}
for (const r of invalides) {
  console.log(`revue sans raison écrite, ignorée : ${JSON.stringify(r)}`);
}
for (const r of perimees) {
  console.log(`revue périmée, aucune phrase ne correspond : ${r.phrase}`);
}

const echecs = bloquantes.length + invalides.length + perimees.length;
if (echecs) {
  console.log(`\n✖ ${echecs} point(s) à corriger`);
  process.exit(1);
}
console.log("✔ narration lisible : sujet en premier, phrases courtes");
