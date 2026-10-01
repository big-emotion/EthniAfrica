#!/usr/bin/env node
/**
 * node social/tools/narration/check-narrative-design.mjs <brief.json> [options]
 * node social/tools/narration/check-narrative-design.mjs --catalogue
 *
 *   --mode draft|selected|handoff   what to validate (default draft)
 *   --render proposals|plan         print the operator-facing French view
 *   --resume                        print the stage the piece is really at
 *   --record-shown proposals|outline --where <text> [--at YYYY-MM-DD]
 *                                   record that a stage was actually shown,
 *                                   digesting what was shown into the brief
 *   --catalogue                     print the pattern catalogue (the idee
 *                                   skill's reference file is this output)
 *
 * `ethniafrica-idee` runs it at each of its five stages; `structure` and the
 * coordinator run `--mode handoff` (through check-family-brief.mjs) before any
 * writing. It checks recorded evidence and structure only.
 */
import { readFileSync, writeFileSync } from "node:fs";

import {
  recordPresentation,
  renderCatalogue,
  renderPlan,
  renderProposals,
  resumeStep,
  validateDesign,
} from "./narrative-design.mjs";

const args = process.argv.slice(2);
const usage = () => {
  console.error(
    "usage : check-narrative-design.mjs <brief.json> [--mode draft|selected|handoff] [--render proposals|plan] [--resume] [--record-shown proposals|outline --where <text> [--at YYYY-MM-DD]]\n        check-narrative-design.mjs --catalogue"
  );
  process.exit(2);
};
const option = (name) => {
  const at = args.indexOf(name);
  return at === -1 ? undefined : args[at + 1];
};
const KNOWN = [
  "--mode",
  "--render",
  "--resume",
  "--record-shown",
  "--where",
  "--at",
  "--catalogue",
];
if (args.some((arg) => arg.startsWith("--") && !KNOWN.includes(arg))) usage();

if (args.includes("--catalogue")) {
  process.stdout.write(renderCatalogue());
  process.exit(0);
}

const path = args[0];
if (!path || path.startsWith("--")) usage();
const brief = JSON.parse(readFileSync(path, "utf-8"));

const shown = option("--record-shown");
if (shown) {
  const where = option("--where");
  if (!where || !brief.narrativeDesign) usage();
  const at = option("--at") ?? new Date().toISOString().slice(0, 10);
  recordPresentation(brief.narrativeDesign, shown, { where, at });
  writeFileSync(path, `${JSON.stringify(brief, null, 2)}\n`);
  console.log(`✔ recorded: ${shown} shown at ${at}, ${where}`);
  process.exit(0);
}

const render = option("--render");
if (render) {
  const design = brief.narrativeDesign;
  const mode = render === "plan" ? "selected" : "draft";
  const { ok, errors } = validateDesign(design, { mode, brief });
  if (!ok) {
    for (const error of errors) console.log(`✖ ${error}`);
    process.exit(1);
  }
  if (render === "plan" && !design.outline) {
    console.log("✖ no detailed outline to render yet (idee stage 5)");
    process.exit(1);
  }
  process.stdout.write(
    render === "plan" ? renderPlan(design) : renderProposals(design)
  );
  process.exit(0);
}

if (args.includes("--resume")) {
  const { stage, next } = resumeStep(brief);
  console.log(`stage ${stage}: ${next}`);
  process.exit(0);
}

const mode = option("--mode") ?? "draft";
if (!["draft", "selected", "handoff"].includes(mode)) usage();
const { ok, errors } = validateDesign(brief.narrativeDesign, { mode, brief });
if (!ok) {
  for (const error of errors) console.log(`✖ ${error}`);
  process.exit(1);
}
console.log(`✔ narrative design valid in ${mode} mode`);
