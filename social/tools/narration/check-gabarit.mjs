#!/usr/bin/env node
/**
 * node social/tools/narration/check-gabarit.mjs <narration.fr.txt> --type <type> [--cas transmission]
 * node social/tools/narration/check-gabarit.mjs <narration.fr.txt> --brief <brief.json>
 *
 * Refuses the narration of a reel « D'où vient le nom X ? » that leaves the
 * template of its type (see `gabarit-reel.mjs`). `type` is the typologie of the
 * production ledger: peuple, pays, patronyme, lieu or langue. `--cas
 * transmission` selects the patronyme sub-case that is not a form comparison
 * (`gabarit-reel-nom.md`, « Le patronyme a deux cas »); ignored for every other
 * type.
 *
 * `--brief` is the explicit route of a research-led narrative design
 * (`narrative-design.mjs`): the brief must carry a design ready for a writing
 * handoff, and the narration is held to the series' closing rather than to the
 * fixed scene list. A legacy narration keeps `--type` and is unchanged.
 * `ethniafrica-structure` runs it before showing a text to the operator, and
 * `ethniafrica-produire` before rendering a reel.
 */
import { readFileSync } from "node:fs";

import { TYPES, verifierGabarit } from "./gabarit-reel.mjs";
import {
  validateDesign,
  verifierNarrationConcue,
} from "./narrative-design.mjs";

const args = process.argv.slice(2);
const [chemin, drapeau, valeur] = args;
const indexCas = args.indexOf("--cas");
const cas = indexCas === -1 ? undefined : args[indexCas + 1];
if (!chemin || !["--type", "--brief"].includes(drapeau) || !valeur) {
  console.error(
    `usage : check-gabarit.mjs <narration.fr.txt> --type <${TYPES.join("|")}> [--cas transmission]\n        check-gabarit.mjs <narration.fr.txt> --brief <brief.json>`
  );
  process.exit(2);
}

const narration = readFileSync(chemin, "utf-8");
let trouvailles;
let route;
if (drapeau === "--brief") {
  const brief = JSON.parse(readFileSync(valeur, "utf-8"));
  if (brief.narrativeDesign?.format === "carrousel") {
    console.log(
      "✖ ce contrôleur lit la narration d'un reel ; un carrousel n'a pas de narration : ses cartes sont écrites et montrées par `structure`, et le moteur de rendu contrôle leur mise en page"
    );
    process.exit(2);
  }
  const { ok, errors } = validateDesign(brief.narrativeDesign, {
    mode: "handoff",
    brief,
  });
  if (!ok) {
    for (const error of errors) console.log(`✖ ${error}`);
    console.log(
      "\n✖ le plan détaillé doit être prêt et présenté avant toute narration"
    );
    process.exit(1);
  }
  trouvailles = verifierNarrationConcue(narration, {
    series: brief.edition?.series,
  });
  route = "route narrative-design";
} else {
  trouvailles = verifierGabarit(narration, valeur, cas);
  route = `gabarit « ${valeur} »`;
}
for (const t of trouvailles) {
  console.log(`scène ${t.paragraphe} · ${t.regle} · ${t.detail}`);
}
if (trouvailles.length) {
  console.log(`\n✖ ${trouvailles.length} écart(s) à la ${route}`);
  process.exit(1);
}
console.log(`✔ la narration suit la ${route}`);
