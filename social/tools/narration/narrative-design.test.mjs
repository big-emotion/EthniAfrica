import { test } from "node:test";
import assert from "node:assert/strict";
import {
  copyFileSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { FAMILIES } from "../contract/contract.mjs";
import { planReviews, validateBrief } from "./family-routing.mjs";
import { CLOTURE_UNIQUE, verifierGabarit } from "./gabarit-reel.mjs";
import {
  BLOCKS,
  PATTERNS,
  DEFAULT_TARGET_SECONDS,
  recordPresentation,
  renderCatalogue,
  renderPlan,
  renderProposals,
  resumeStep,
  timeline,
  validateDesign,
  verifierNarrationConcue,
} from "./narrative-design.mjs";

const TODAY = "2026-09-30";
const fixtureUrl = (name) =>
  new URL(`./narrative-design/fixtures/${name}.brief.json`, import.meta.url);
const load = (name) => JSON.parse(readFileSync(fixtureUrl(name), "utf-8"));
const single = () => load("single-origin");
const lingala = () => load("lingala-demo");
const design = (brief) => brief.narrativeDesign;
const errorsOf = (brief, mode, extra) =>
  validateDesign(brief.narrativeDesign, { mode, brief, ...extra }).errors;

// A real operator choice as it would be recorded in a live run. Only tests
// build it: the fixtures on disk carry `kind: "synthetic"` and never pass a
// handoff.
function handoffReady(brief = single()) {
  const ready = structuredClone(brief);
  const d = ready.narrativeDesign;
  d.selection = {
    proposalId: "p1",
    kind: "operator",
    statement: "Test stand-in for the operator's spoken choice.",
    locator: "unit test",
    date: "2026-09-30",
  };
  recordPresentation(d, "proposals", { where: "unit test", at: "2026-09-30" });
  recordPresentation(d, "outline", { where: "unit test", at: "2026-09-30" });
  return ready;
}
const has = (errors, pattern) => errors.some((error) => pattern.test(error));

// @req REQ-188
test("the catalogue has ten stable patterns and six common functions, distinct from the six families", () => {
  assert.equal(PATTERNS.length, 10);
  assert.equal(new Set(PATTERNS.map((p) => p.id)).size, 10);
  for (const pattern of PATTERNS) {
    assert.ok(pattern.moves.length >= 3, `${pattern.id} has ordered moves`);
    assert.ok(pattern.question && pattern.success && pattern.label);
    assert.ok(!FAMILIES.includes(pattern.id), "a pattern is not a family");
    for (const family of pattern.families ?? []) {
      assert.ok(FAMILIES.includes(family), `${pattern.id} → ${family}`);
    }
  }
  assert.deepEqual(
    BLOCKS.map((b) => b.id),
    ["B1", "B2", "B3", "B4", "B5", "B6"]
  );
  assert.equal(DEFAULT_TARGET_SECONDS, 180);
});

// @req REQ-188
test("the reference catalogue in the idee skill is the rendered catalogue, never a second list", () => {
  const skillDir = new URL(
    "../../../.claude/skills/ethniafrica-idee/",
    import.meta.url
  );
  assert.equal(
    readFileSync(
      new URL("references/narrative-patterns.md", skillDir),
      "utf-8"
    ),
    renderCatalogue()
  );
});

// @req REQ-188
test("valid synthetic and Lingala designs pass in draft mode, with one or three proposals", () => {
  assert.deepEqual(errorsOf(single(), "draft"), []);
  assert.equal(design(single()).proposals.length, 1);
  assert.deepEqual(errorsOf(lingala(), "draft"), []);
  assert.equal(design(lingala()).proposals.length, 3);
});

// @req REQ-188
test("a draft with no selection and no outline is valid but cannot be handed to structure", () => {
  const draft = single();
  draft.narrativeDesign.selection = null;
  draft.narrativeDesign.outline = null;
  assert.deepEqual(errorsOf(draft, "draft"), []);
  assert.ok(has(errorsOf(draft, "handoff"), /no selection/));
  // the ordinary ready-brief checker refuses it as well
  assert.equal(validateBrief(draft, { today: TODAY }).ok, false);
  assert.ok(
    has(
      validateBrief(draft, { today: TODAY }).errors,
      /narrative design is not ready/
    )
  );
});

// @req REQ-188
test("an unknown version or a missing design fails; it never falls back to the legacy path", () => {
  const brief = single();
  brief.narrativeDesign.version = 2;
  assert.ok(has(errorsOf(brief, "draft"), /version/));
  assert.ok(
    has(
      validateDesign(undefined, { mode: "draft" }).errors,
      /no narrativeDesign/
    )
  );
  assert.equal(validateBrief(brief, { today: TODAY }).ok, false);
});

// @req REQ-188
test("each named proposal field is required and substantive", () => {
  for (const field of ["question", "application", "intention", "rationale"]) {
    const brief = single();
    brief.narrativeDesign.proposals[0][field] = "  ";
    assert.ok(has(errorsOf(brief, "draft"), new RegExp(field)), field);
  }
  const noTakeaway = single();
  noTakeaway.narrativeDesign.proposals[0].takeaways = [];
  assert.ok(has(errorsOf(noTakeaway, "draft"), /takeaway/));
  const noCriterion = single();
  noCriterion.narrativeDesign.proposals[0].successCriteria = [];
  assert.ok(has(errorsOf(noCriterion, "draft"), /success criterion/));
});

// @req REQ-188
test("a success criterion needs a prompt, an expected answer or limit, and resolving links", () => {
  const vague = single();
  Object.assign(vague.narrativeDesign.proposals[0].successCriteria[0], {
    prompt: "Understand the subject",
    expected: "",
  });
  assert.ok(has(errorsOf(vague, "draft"), /expected/));
  const dangling = single();
  dangling.narrativeDesign.proposals[0].successCriteria[0].takeawayIds = ["t9"];
  assert.ok(has(errorsOf(dangling, "draft"), /takeaway t9/));
  const orphanTakeaway = single();
  orphanTakeaway.narrativeDesign.proposals[0].successCriteria.pop();
  assert.ok(
    has(errorsOf(orphanTakeaway, "draft"), /takeaway t2 .*no success criterion/)
  );
});

// @req REQ-188
test("claim references must resolve; an explicit unknown is a valid reference", () => {
  const brief = single();
  brief.narrativeDesign.proposals[0].claimRefs.push("c99");
  assert.ok(has(errorsOf(brief, "draft"), /c99/));
  // u1 is an unknown, cited by the fixture's proposal and criteria, and passes
  assert.deepEqual(errorsOf(single(), "draft"), []);
});

// @req REQ-188
test("a claim marked sourced must rest on a source actually read", () => {
  const brief = single();
  brief.narrativeDesign.research.sources[0].access = "indirect";
  assert.ok(has(errorsOf(brief, "draft"), /sourced.*read/));
  const unknownSource = single();
  unknownSource.narrativeDesign.research.claims[0].sources = ["s404"];
  assert.ok(has(errorsOf(unknownSource, "draft"), /s404/));
  const silent = single();
  delete silent.narrativeDesign.research.claims[0].uncertainty;
  assert.ok(has(errorsOf(silent, "draft"), /uncertainty/));
});

// @req REQ-188
test("all ten patterns are assessed, none twice, and only real ones", () => {
  const missing = single();
  missing.narrativeDesign.patternAssessment.pop();
  assert.ok(
    has(errorsOf(missing, "draft"), /received-claim-examined.*not assessed/)
  );
  const invented = single();
  invented.narrativeDesign.patternAssessment[1].patternId = "big-reveal";
  assert.ok(has(errorsOf(invented, "draft"), /unknown pattern "big-reveal"/));
  const twice = single();
  twice.narrativeDesign.patternAssessment.push({
    ...twice.narrativeDesign.patternAssessment[0],
  });
  assert.ok(has(errorsOf(twice, "draft"), /assessed twice/));
});

// @req REQ-188
test("an unproposed pattern needs a reason; a proposal needs an offered or conditional assessment", () => {
  const noReason = single();
  delete noReason.narrativeDesign.patternAssessment[1].reason;
  assert.ok(has(errorsOf(noReason, "draft"), /competing-explanations.*reason/));
  const unsupported = single();
  unsupported.narrativeDesign.proposals[0].patternId = "competing-explanations";
  assert.ok(has(errorsOf(unsupported, "draft"), /not offered|not listed/));
  const offeredEmpty = single();
  offeredEmpty.narrativeDesign.patternAssessment[0].proposals = [];
  assert.ok(
    has(errorsOf(offeredEmpty, "draft"), /origin-explained.*no proposal/)
  );
});

// @req REQ-188
test("every function B1–B6 is in the arrangement or omitted with a reason; order is B1 first, B5 before B6 last", () => {
  const dropped = single();
  dropped.narrativeDesign.proposals[0].arrangement.steps.splice(3, 1);
  assert.ok(has(errorsOf(dropped, "draft"), /B4.*neither/));

  const explained = structuredClone(dropped);
  explained.narrativeDesign.proposals[0].arrangement.omitted = [
    {
      function: "B4",
      reason: "No circulation is documented; B3 states the gap.",
    },
  ];
  assert.deepEqual(errorsOf(explained, "draft"), []);

  const misplaced = single();
  const steps = misplaced.narrativeDesign.proposals[0].arrangement.steps;
  [steps[4], steps[5]] = [steps[5], steps[4]];
  assert.ok(has(errorsOf(misplaced, "draft"), /B5 .*before B6|B6 .*last/));
});

// @req REQ-188
test("functions may be merged or repeated; an off-family proposal must say how it adapted the name wording", () => {
  // Lingala L1 merges B2+B3 twice and passes
  assert.deepEqual(errorsOf(lingala(), "draft"), []);
  const unadapted = lingala();
  const l2 = design(unadapted).proposals.find((p) => p.id === "L2");
  l2.arrangement.adaptations = [];
  assert.ok(has(errorsOf(unadapted, "draft"), /L2.*adapt/));
});

// @req REQ-188
test("a recommendation is not a selection; a synthetic selection never opens a handoff", () => {
  const recommendedOnly = single();
  recommendedOnly.narrativeDesign.selection = null;
  assert.ok(has(errorsOf(recommendedOnly, "selected"), /no selection/));
  assert.deepEqual(errorsOf(single(), "selected"), []);
  assert.ok(has(errorsOf(single(), "handoff"), /synthetic/));
  const fake = handoffReady();
  fake.narrativeDesign.selection.kind = "approved";
  assert.ok(has(errorsOf(fake, "handoff"), /selection kind/));
  const ghost = handoffReady();
  ghost.narrativeDesign.selection.proposalId = "p9";
  assert.ok(has(errorsOf(ghost, "selected"), /p9/));
  const noStatement = handoffReady();
  noStatement.narrativeDesign.selection.statement = "";
  assert.ok(has(errorsOf(noStatement, "selected"), /statement/));
});

// @req REQ-188
test("a handoff needs the selection, the outline, and proof both were actually shown", () => {
  const ready = handoffReady();
  assert.deepEqual(errorsOf(ready, "handoff"), []);
  assert.equal(validateBrief(ready, { today: TODAY }).ok, true);

  const unshown = handoffReady();
  unshown.narrativeDesign.presentation = null;
  assert.ok(has(errorsOf(unshown, "handoff"), /never shown/));

  const noOutline = handoffReady();
  noOutline.narrativeDesign.outline = null;
  noOutline.narrativeDesign.presentation.outline = undefined;
  assert.ok(has(errorsOf(noOutline, "handoff"), /no detailed outline/));
});

// @req REQ-188
test("editing the outline or the proposals after they were shown makes the presentation stale", () => {
  const editedOutline = handoffReady();
  editedOutline.narrativeDesign.outline.blocks[1].seconds = 41;
  assert.ok(
    has(
      errorsOf(editedOutline, "handoff"),
      /outline changed since it was shown/
    )
  );
  const editedProposals = handoffReady();
  editedProposals.narrativeDesign.proposals[0].application += " (edited)";
  assert.ok(
    has(
      errorsOf(editedProposals, "handoff"),
      /proposals changed since they were shown/
    )
  );
});

// @req REQ-188
test("the outline is shown after the choice, and the choice comes after the proposals were shown", () => {
  const early = handoffReady();
  early.narrativeDesign.presentation.outline.at = "2026-09-29";
  assert.ok(has(errorsOf(early, "handoff"), /outline .*before the selection/));
  const blind = handoffReady();
  blind.narrativeDesign.presentation.proposals.at = "2026-10-01";
  assert.ok(
    has(errorsOf(blind, "handoff"), /selection .*before the proposals/)
  );
});

// @req REQ-188
test("outline timing is derived from per-block seconds and closes the piece", () => {
  const { blocks, totalSeconds } = timeline(design(single()).outline);
  assert.equal(totalSeconds, 180);
  assert.deepEqual(
    blocks.map((b) => [b.start, b.end]),
    [
      [0, 15],
      [15, 55],
      [55, 95],
      [95, 125],
      [125, 160],
      [160, 180],
    ]
  );
  const zero = single();
  zero.narrativeDesign.outline.blocks[0].seconds = 0;
  assert.ok(has(errorsOf(zero, "selected"), /seconds/));
  const noClose = single();
  noClose.narrativeDesign.outline.blocks.pop();
  assert.ok(has(errorsOf(noClose, "selected"), /last block .*B6|B6/));
});

// @req REQ-188
test("a longer target needs a visible reason, and the overrun is reported rather than silently trimmed", () => {
  const long = single();
  long.narrativeDesign.outline.blocks[1].seconds = 70;
  assert.ok(has(errorsOf(long, "selected"), /over 180 s.*durationReason/));
  long.narrativeDesign.outline.durationReason =
    "Three accounts are indispensable and cannot be compressed intelligibly.";
  assert.deepEqual(errorsOf(long, "selected"), []);
  const proposalLong = single();
  proposalLong.narrativeDesign.proposals[0].durationSeconds = 230;
  assert.ok(has(errorsOf(proposalLong, "draft"), /durationReason/));
});

// @req REQ-188
test("the outline must cover the six functions, cover every takeaway and criterion, and resolve its references", () => {
  const noB4 = single();
  noB4.narrativeDesign.outline.blocks.splice(3, 1);
  assert.ok(has(errorsOf(noB4, "selected"), /B4/));
  const unsupported = single();
  for (const block of unsupported.narrativeDesign.outline.blocks) {
    block.supports.criterionIds = block.supports.criterionIds.filter(
      (id) => id !== "sc2"
    );
  }
  assert.ok(has(errorsOf(unsupported, "selected"), /criterion sc2 .*no block/));
  const dangling = single();
  dangling.narrativeDesign.outline.blocks[2].evidence.claimRefs = ["c77"];
  assert.ok(has(errorsOf(dangling, "selected"), /c77/));
  const wrongProposal = single();
  wrongProposal.narrativeDesign.outline.proposalId = "p2";
  assert.ok(
    has(errorsOf(wrongProposal, "selected"), /outline .*selected proposal/)
  );
});

// @req REQ-188
test("generic outline blocks are refused: same text pasted, empty limits, role repeated as content", () => {
  const pasted = single();
  const blocks = pasted.narrativeDesign.outline.blocks;
  blocks[2].content = blocks[1].content;
  assert.ok(has(errorsOf(pasted, "selected"), /same content/));
  const generic = single();
  generic.narrativeDesign.outline.blocks[1].content = "Explain the origin.";
  assert.ok(has(errorsOf(generic, "selected"), /too generic|content/));
  const noLimits = single();
  noLimits.narrativeDesign.outline.blocks[1].evidence.limits = "";
  assert.ok(has(errorsOf(noLimits, "selected"), /limits/));
  const noTransition = single();
  noTransition.narrativeDesign.outline.blocks[1].transition = "";
  assert.ok(has(errorsOf(noTransition, "selected"), /transition/));
});

// @req REQ-188
test("viewer success statements are filled, one per criterion, and never formula-only", () => {
  const blank = single();
  blank.narrativeDesign.outline.successStatements[0].statement =
    "Le nom vient de … ; il ne prouve pas …";
  assert.ok(has(errorsOf(blank, "selected"), /placeholder|ellipsis/));
  const missing = single();
  missing.narrativeDesign.outline.successStatements.pop();
  assert.ok(has(errorsOf(missing, "selected"), /sc2.*statement/));
  const rationale = single();
  rationale.narrativeDesign.outline.rationale.orderLogic = "";
  assert.ok(has(errorsOf(rationale, "selected"), /orderLogic|rationale/));
});

// @req REQ-188
test("a claim that is a gap cannot be cited by the handoff outline, but a qualified one can", () => {
  const brief = lingala();
  const d = design(brief);
  d.outline.blocks[4].evidence.claimRefs = ["k7"];
  assert.ok(has(errorsOf(brief, "selected"), /k7 .*gap/));
  const conditionalCard = lingala();
  assert.deepEqual(errorsOf(conditionalCard, "selected"), []);
});

// @req REQ-188
test("a reference example is real with a locator, or explicitly hypothetical", () => {
  const brief = single();
  brief.narrativeDesign.proposals[0].referenceExample = {
    status: "real",
    text: "A published reel",
  };
  assert.ok(has(errorsOf(brief, "draft"), /real .*locator/));
  brief.narrativeDesign.proposals[0].referenceExample = {
    status: "success-story",
    text: "x",
  };
  assert.ok(has(errorsOf(brief, "draft"), /reference example status/));
});

// @req REQ-188
test("three documented explanations pass on the new route, where the old gabarit caps at two", () => {
  const brief = single();
  const d = design(brief);
  const [, , o3] = d.outline.blocks;
  d.outline.blocks.splice(2, 0, { ...o3, id: "o2b" }, { ...o3, id: "o2c" });
  // three explanation blocks, no ceiling: the only complaints are about pasted text
  const errors = errorsOf(brief, "selected");
  assert.ok(!has(errors, /ceiling|at most|two explanations/));

  const narration = [
    "Ce nom pose une question.",
    "Une lecture le relie aux marchés.",
    "Une deuxième lecture le relie à un groupe.",
    "Une troisième lecture le relie à une mission.",
    "Les documents ne tranchent pas.",
    CLOTURE_UNIQUE,
  ].join("\n\n");
  assert.deepEqual(
    verifierNarrationConcue(narration, { series: "name-origin" }),
    []
  );
  assert.ok(
    verifierGabarit(narration, "peuple").length > 0,
    "legacy path still strict"
  );
});

// @req REQ-188
test("on the new route the name-origin closing stays mandatory, and other series keep their own ending", () => {
  const wrong = "Une scène.\n\nAppelez-nous.";
  const findings = verifierNarrationConcue(wrong, { series: "name-origin" });
  assert.ok(findings.some((f) => f.regle === "gabarit-cloture"));
  assert.deepEqual(verifierNarrationConcue(wrong, { series: undefined }), []);
});

// @req REQ-186
test("the new route keeps name, geography and universal reviews, and never turns the series off", () => {
  const brief = handoffReady();
  const plan = planReviews(brief.edition, { narrativeDesign: design(brief) });
  const review = (id) => plan.reviews.find((r) => r.id === id);
  assert.equal(review("name").applicability, "required");
  assert.equal(review("provenance").applicability, "required");
  assert.deepEqual(plan.narrationGabarit, {
    applies: false,
    route: "narrative-design",
    closing: CLOTURE_UNIQUE,
  });
  // the series typologie is still demanded
  const disguised = handoffReady();
  disguised.edition.subject.key = "FXP";
  assert.ok(
    has(validateBrief(disguised, { today: TODAY }).errors, /typologie/)
  );
  // no design: unchanged legacy answer
  const legacy = planReviews(brief.edition);
  assert.deepEqual(legacy.narrationGabarit, { applies: true, type: "peuple" });
});

// @req REQ-188
test("a handoff brief's edition is a snapshot of the design: question, family, claims and video steps agree", () => {
  const question = handoffReady();
  question.edition.angle.question = "Another question ?";
  assert.ok(has(errorsOf(question, "handoff"), /edition question/));
  const family = handoffReady();
  family.edition.family = "comparison";
  assert.ok(has(errorsOf(family, "handoff"), /edition family/));
  const claim = handoffReady();
  claim.edition.claims.push({
    id: "c50",
    kind: "name-origin",
    sources: [{ tier: "referenced", ref: "s1" }],
  });
  assert.ok(has(errorsOf(claim, "handoff"), /c50/));
  const steps = handoffReady();
  steps.videoSequence.pop();
  assert.ok(has(errorsOf(steps, "handoff"), /videoSequence/));
});

// @req REQ-188
test("legacy briefs without narrativeDesign follow their established path untouched", () => {
  const legacy = JSON.parse(
    readFileSync(
      new URL(
        "./families/fixtures/legacy-name-origin.brief.json",
        import.meta.url
      ),
      "utf-8"
    )
  );
  assert.equal(validateBrief(legacy, { today: TODAY }).ok, true);
  assert.deepEqual(resumeStep(legacy), {
    stage: "legacy",
    next: "no narrative-design intake is required; resume the missing visual or production work",
  });
});

// @req REQ-188
test("resumption names the real missing step for every state, and never selects for the operator", () => {
  const stage = (brief) => resumeStep(brief).stage;
  assert.equal(stage({}), "1-2");
  const researched = {
    narrativeDesign: {
      version: 1,
      research: single().narrativeDesign.research,
    },
  };
  assert.equal(stage(researched), "3");
  const draft = single();
  draft.narrativeDesign.selection = null;
  draft.narrativeDesign.outline = null;
  assert.equal(stage(draft), "3-present");
  recordPresentation(draft.narrativeDesign, "proposals", {
    where: "chat",
    at: TODAY,
  });
  const waiting = resumeStep(draft);
  assert.equal(waiting.stage, "4");
  assert.match(waiting.next, /wait for the operator/);
  assert.equal(
    draft.narrativeDesign.selection,
    null,
    "the coordinator never selects"
  );

  const chosen = structuredClone(draft);
  chosen.narrativeDesign.selection = single().narrativeDesign.selection;
  chosen.narrativeDesign.selection.kind = "operator";
  assert.equal(stage(chosen), "5");
  chosen.narrativeDesign.outline = single().narrativeDesign.outline;
  assert.equal(stage(chosen), "5-present");
  recordPresentation(chosen.narrativeDesign, "outline", {
    where: "chat",
    at: TODAY,
  });
  assert.equal(stage(chosen), "handoff");

  const changed = structuredClone(chosen);
  changed.narrativeDesign.proposals[0].application += " changed";
  assert.equal(stage(changed), "3-refresh");
});

// @req REQ-188
test("a file alone proves nothing: an unshown design with a synthetic choice is not a handoff", () => {
  assert.equal(resumeStep(single()).stage, "3-present");
});

// @req REQ-188
test("proposal cards carry the five French fields, each proposal its own arrangement, and label examples", () => {
  const text = renderProposals(design(lingala()));
  for (const label of [
    "Question",
    "Trame",
    "Application au sujet",
    "Acquis",
    "Critère de réussite",
  ]) {
    assert.equal(
      text.split(`**${label}**`).length - 1,
      3,
      `${label} on each of 3 cards`
    );
  }
  assert.match(text, /hypothétique/i);
  assert.match(text, /Recommandation/);
  assert.doesNotMatch(text, /choisi par l'opérateur/);
  const arrangements = text
    .split("**Arrangement**")
    .slice(1)
    .map((chunk) => chunk.split("\n\n")[0]);
  assert.equal(
    new Set(arrangements).size,
    3,
    "no arrangement pasted across candidates"
  );
  assert.match(text, /B2\+B3/);
});

// @req REQ-188
test("the coverage table lists all ten patterns with a disposition and a reason", () => {
  const text = renderProposals(design(lingala()));
  for (const pattern of PATTERNS) {
    assert.ok(text.includes(pattern.id), pattern.id);
  }
  assert.match(text, /Boundji|épisode de Boundji/);
  assert.match(text, /conditionnel/i);
});

// @req REQ-188
test("the chosen plan renders the timed table, the reasons and filled viewer statements", () => {
  const text = renderPlan(design(lingala()));
  assert.match(text, /\| 0:00–0:15 \| B1 \|/);
  assert.match(text, /\| 2:40–3:00 \| B6 \|/);
  assert.match(text, /Durée totale estimée : 3:00/);
  assert.match(text, /Pourquoi cette trame/);
  assert.match(text, /Pourquoi cet ordre/);
  assert.match(text, /Ce que le spectateur doit pouvoir dire/);
  assert.match(text, /1901/);
  assert.match(text, /SYNTHÉTIQUE/);
  assert.doesNotMatch(text, /…/, "no formula-only statement");
});

// @req REQ-188
test("the committed Lingala demonstration is what the tool renders from its fixture", () => {
  const d = design(lingala());
  assert.equal(
    readFileSync(
      new URL(
        "../../../docs/design/gabarits-social/NARRATIVE-DESIGN-LINGALA-DEMO.md",
        import.meta.url
      ),
      "utf-8"
    ),
    `${renderProposals(d)}\n---\n\n${renderPlan(d)}`
  );
});

// @req REQ-188
test("the CLI validates by mode, renders, records presentation and prints the resume step", () => {
  const cli = new URL("./check-narrative-design.mjs", import.meta.url).pathname;
  const dir = mkdtempSync(join(tmpdir(), "narrative-design-"));
  try {
    const file = join(dir, "brief.json");
    copyFileSync(fixtureUrl("lingala-demo").pathname, file);
    const run = (...args) =>
      spawnSync("node", [cli, file, ...args], { encoding: "utf-8" });

    assert.equal(run("--mode", "draft").status, 0);
    assert.equal(run("--mode", "selected").status, 0);
    const handoff = run("--mode", "handoff");
    assert.equal(handoff.status, 1);
    assert.match(handoff.stdout, /synthetic/);
    assert.match(run("--render", "proposals").stdout, /\*\*Trame\*\*/);
    assert.match(run("--render", "plan").stdout, /\| 0:00–0:15 \|/);
    assert.match(run("--resume").stdout, /3-present/);

    const stamp = run(
      "--record-shown",
      "proposals",
      "--where",
      "conversation",
      "--at",
      TODAY
    );
    assert.equal(stamp.status, 0);
    const written = JSON.parse(readFileSync(file, "utf-8"));
    assert.equal(
      written.narrativeDesign.presentation.proposals.where,
      "conversation"
    );
    assert.match(
      written.narrativeDesign.presentation.proposals.digest,
      /^[0-9a-f]{64}$/
    );
    assert.equal(run("--bogus").status, 2);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

// @req REQ-188
test("check-family-brief refuses a design draft, and check-gabarit routes by brief on request", () => {
  const dir = mkdtempSync(join(tmpdir(), "narrative-design-"));
  try {
    const briefFile = join(dir, "brief.json");
    writeFileSync(briefFile, JSON.stringify(handoffReady()));
    const narrationFile = join(dir, "narration.fr.txt");
    writeFileSync(narrationFile, `Une scène.\n\n${CLOTURE_UNIQUE}`);
    const gabarit = new URL("./check-gabarit.mjs", import.meta.url).pathname;
    const routed = spawnSync(
      "node",
      [gabarit, narrationFile, "--brief", briefFile],
      { encoding: "utf-8" }
    );
    assert.equal(routed.status, 0, routed.stdout + routed.stderr);
    assert.match(routed.stdout, /narrative-design/);
    const legacy = spawnSync(
      "node",
      [gabarit, narrationFile, "--type", "peuple"],
      { encoding: "utf-8" }
    );
    assert.equal(
      legacy.status,
      1,
      "the legacy checker still refuses this text"
    );

    const familyCli = new URL("./check-family-brief.mjs", import.meta.url)
      .pathname;
    const draft = single();
    draft.narrativeDesign.selection = null;
    draft.narrativeDesign.outline = null;
    writeFileSync(briefFile, JSON.stringify(draft));
    const refused = spawnSync(
      "node",
      [familyCli, briefFile, "--today", TODAY],
      { encoding: "utf-8" }
    );
    assert.equal(refused.status, 1);
    assert.match(refused.stdout, /narrative design is not ready/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
