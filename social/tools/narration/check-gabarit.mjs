#!/usr/bin/env node
/**
 * node social/tools/narration/check-gabarit.mjs <narration.fr.txt> --type <type>
 *
 * Refuses the narration of a reel « D'où vient le nom X ? » that leaves the
 * template of its type (see `gabarit-reel.mjs`). `type` is the typologie of the
 * production ledger: peuple, pays, patronyme, lieu or langue.
 * `ethniafrica-structure` runs it before showing a text to the operator, and
 * `ethniafrica-produire` before rendering a reel.
 */
import { readFileSync } from "node:fs";

import { TYPES, verifierGabarit } from "./gabarit-reel.mjs";

const [chemin, drapeau, type] = process.argv.slice(2);
if (!chemin || drapeau !== "--type" || !type) {
  console.error(
    `usage : check-gabarit.mjs <narration.fr.txt> --type <${TYPES.join("|")}>`
  );
  process.exit(2);
}

const trouvailles = verifierGabarit(readFileSync(chemin, "utf-8"), type);
for (const t of trouvailles) {
  console.log(`scène ${t.paragraphe} · ${t.regle} · ${t.detail}`);
}
if (trouvailles.length) {
  console.log(`\n✖ ${trouvailles.length} écart(s) au gabarit « ${type} »`);
  process.exit(1);
}
console.log(`✔ la narration suit le gabarit « ${type} »`);
