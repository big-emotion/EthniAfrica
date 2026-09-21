#!/usr/bin/env node
/**
 * node social/tools/narration/check-narration.mjs <narration.fr.txt>
 *
 * Refuses a narration that breaks the plain-language rule (see
 * `plain-language.mjs`). `ethniafrica-structure` runs it before showing a text
 * to the operator; a text that fails is rewritten first, not shown.
 */
import { readFileSync } from "node:fs";

import { verifierNarration } from "./plain-language.mjs";

const chemin = process.argv[2];
if (!chemin) {
  console.error("usage : check-narration.mjs <narration.fr.txt>");
  process.exit(2);
}

const trouvailles = verifierNarration(readFileSync(chemin, "utf-8"));
for (const t of trouvailles) {
  console.log(
    `scène ${t.paragraphe} · ${t.regle} · ${t.detail}\n  ${t.phrase}`
  );
}
if (trouvailles.length) {
  console.log(`\n✖ ${trouvailles.length} phrase(s) à réécrire`);
  process.exit(1);
}
console.log("✔ narration lisible : sujet en premier, phrases courtes");
