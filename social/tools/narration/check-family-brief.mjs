#!/usr/bin/env node
/**
 * node social/tools/narration/check-family-brief.mjs <brief.json> [--today YYYY-MM-DD]
 *
 * Validates a narrative brief and prints which reviews it owes, each with the
 * skill that answers it or the reason it does not apply. `ethniafrica-idee`
 * writes the brief, `ethniafrica-structure` runs this before writing any card,
 * `ethniafrica-produire` reads the plan to know which reviews to look for.
 * A name-origin production that predates briefs needs none: it keeps
 * `check-gabarit.mjs` and its ledger.
 */
import { readFileSync } from "node:fs";

import { planReviews, validateBrief } from "./family-routing.mjs";

const args = process.argv.slice(2);
const path = args[0];
const todayFlag = args.indexOf("--today");
const today =
  todayFlag === -1
    ? new Date().toISOString().slice(0, 10)
    : args[todayFlag + 1];
if (!path) {
  console.error(
    "usage : check-family-brief.mjs <brief.json> [--today YYYY-MM-DD]"
  );
  process.exit(2);
}

const brief = JSON.parse(readFileSync(path, "utf-8"));
const { ok, errors } = validateBrief(brief, { today });
if (!ok) {
  for (const error of errors) console.log(`✖ ${error}`);
  process.exit(1);
}

const plan = planReviews(brief.edition, {
  narrativeDesign: brief.narrativeDesign,
});
console.log(`family: ${plan.family}`);
for (const review of plan.reviews) {
  const detail =
    review.applicability === "required"
      ? `required · ${review.skill}`
      : `not-applicable · ${review.reason}`;
  console.log(`  ${review.id}: ${detail}`);
}
console.log(
  plan.narrationGabarit.route === "narrative-design" &&
    brief.narrativeDesign?.format === "carrousel"
    ? "✔ brief valid; the carousel narrative-design route applies: structure writes the card copy from the shown outline, and the renderer checks the layout"
    : plan.narrationGabarit.route === "narrative-design"
      ? "✔ brief valid; the narrative-design route applies: check the narration with check-gabarit.mjs <narration> --brief <brief.json>"
      : plan.narrationGabarit.applies
        ? `✔ brief valid; the name-origin gabarit « ${plan.narrationGabarit.type} » applies to the narration`
        : "✔ brief valid; no fixed name-origin wording applies"
);
