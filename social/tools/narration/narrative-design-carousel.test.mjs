import { test } from "node:test";
import assert from "node:assert/strict";
import {
  copyFileSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { planReviews, validateBrief } from "./family-routing.mjs";
import {
  CAROUSEL_READING,
  PATTERNS,
  recordPresentation,
  renderCatalogue,
  renderPlan,
  renderProposals,
  resumeStep,
  validateDesign,
} from "./narrative-design.mjs";

const TODAY = "2026-09-30";
const fixtureUrl = (name) =>
  new URL(`./narrative-design/fixtures/${name}.brief.json`, import.meta.url);
const load = (name) => JSON.parse(readFileSync(fixtureUrl(name), "utf-8"));
const single = () => load("single-origin-carousel");
const lingala = () => load("lingala-carousel-demo");
const design = (brief) => brief.narrativeDesign;
const errorsOf = (brief, mode) =>
  validateDesign(brief.narrativeDesign, { mode, brief }).errors;
const has = (errors, pattern) => errors.some((error) => pattern.test(error));
const proposalOf = (brief, id = "p1") =>
  design(brief).proposals.find((p) => p.id === id);
const cardsOf = (brief) => design(brief).outline.cards;

// A real operator choice as a live run would record it; the fixtures on disk
// carry `kind: "synthetic"` and never pass a handoff.
function handoffReady(brief = single()) {
  const ready = structuredClone(brief);
  const d = ready.narrativeDesign;
  d.selection = {
    proposalId: "p1",
    kind: "operator",
    statement: "Test stand-in for the operator's spoken choice.",
    locator: "unit test",
    date: TODAY,
  };
  recordPresentation(d, "proposals", { where: "unit test", at: TODAY });
  recordPresentation(d, "outline", { where: "unit test", at: TODAY });
  return ready;
}

// @req REQ-188
test("a carousel design is a draft with evidence-based proposals and no selection, and needs no timing or video sequence", () => {
  const draft = single();
  draft.narrativeDesign.selection = null;
  draft.narrativeDesign.outline = null;
  assert.deepEqual(errorsOf(draft, "draft"), []);
  assert.deepEqual(errorsOf(lingala(), "draft"), []);
  assert.equal(design(lingala()).proposals.length, 3);
  assert.equal(draft.videoSequence, undefined);
  assert.equal(proposalOf(draft).durationSeconds, undefined);
  // it cannot pass as a writing handoff, and never falls back to the old route
  assert.ok(has(errorsOf(draft, "handoff"), /no selection/));
  const refused = validateBrief(draft, { today: TODAY });
  assert.equal(refused.ok, false);
  assert.ok(has(refused.errors, /narrative design is not ready/));
});

// @req REQ-188
test("an unknown format fails, an absent format stays the reel, and the design and the edition must agree on the format", () => {
  const unknown = single();
  unknown.narrativeDesign.format = "texte";
  assert.ok(has(errorsOf(unknown, "draft"), /format "texte"/));

  // a reel design without `format` is validated as a reel, so it wants a duration
  const reel = single();
  delete reel.narrativeDesign.format;
  assert.ok(has(errorsOf(reel, "draft"), /durationSeconds/));

  // choosing a reel pattern never approves a carousel adaptation
  const mismatch = handoffReady();
  mismatch.edition.format = "video";
  assert.ok(has(errorsOf(mismatch, "handoff"), /edition format/));
  const reelForCarousel = handoffReady();
  reelForCarousel.narrativeDesign.format = "video";
  assert.ok(has(errorsOf(reelForCarousel, "handoff"), /edition format/));
});

// @req REQ-188
test("a carousel proposal declares its series and a real reading profile; other routes keep their own contract", () => {
  const noSeries = single();
  delete proposalOf(noSeries).series;
  assert.ok(has(errorsOf(noSeries, "draft"), /series/));

  for (const profile of ["memoires-sonores", "lectures-afrique"]) {
    const brief = single();
    proposalOf(brief).profile = profile;
    assert.ok(has(errorsOf(brief, "draft"), /keeps its own contract/), profile);
  }
  const unknown = single();
  proposalOf(unknown).profile = "reading-nothing";
  assert.ok(has(errorsOf(unknown, "draft"), /unknown profile/));
  const missing = single();
  proposalOf(missing).profile = null;
  assert.ok(has(errorsOf(missing, "draft"), /needs a reading profile/));

  const series = single();
  proposalOf(series).series = "memoires-sonores";
  assert.ok(has(errorsOf(series, "draft"), /series/));
});

// @req REQ-188
test("the card count is checked against the profile descriptor, with a reason, and equals the preview", () => {
  const range = (id) =>
    JSON.parse(
      readFileSync(
        new URL(`../../harness/carousel-profiles/${id}.json`, import.meta.url),
        "utf-8"
      )
    ).reading;
  assert.deepEqual(
    [range("reading-story").min, range("reading-story").max],
    [4, 9]
  );

  const tooMany = single();
  proposalOf(tooMany).cardCount = range("reading-story").max + 1;
  assert.ok(has(errorsOf(tooMany, "draft"), /outside reading-story's 4–9/));

  const tooFew = single();
  proposalOf(tooFew).cardCount = range("reading-story").min - 1;
  assert.ok(has(errorsOf(tooFew, "draft"), /outside reading-story's 4–9/));

  const comparison = lingala();
  proposalOf(comparison, "C3").cardCount = range("reading-comparison").max + 1;
  assert.ok(has(errorsOf(comparison, "draft"), /reading-comparison's 4–7/));

  const preview = single();
  proposalOf(preview).cardCount = 6;
  assert.ok(has(errorsOf(preview, "draft"), /5 cards in the preview/));

  const reason = single();
  proposalOf(reason).countReason = " ";
  assert.ok(has(errorsOf(reason, "draft"), /countReason/));
});

// @req REQ-188
test("a carousel carries no duration: seconds, targets and time reasons are refused rather than ignored", () => {
  const seconds = single();
  proposalOf(seconds).durationSeconds = 180;
  assert.ok(has(errorsOf(seconds, "draft"), /no timing/));
  const card = single();
  cardsOf(card)[1].seconds = 15;
  assert.ok(has(errorsOf(card, "selected"), /no timing/));
  const reason = single();
  design(reason).outline.durationReason = "three minutes";
  assert.ok(has(errorsOf(reason, "selected"), /no timing/));
});

// @req REQ-188
test("six functions can span nine cards: merged, repeated and interleaved, with B1 first, B5 before B6 and B6 last", () => {
  const brief = lingala();
  const steps = proposalOf(brief, "C1").arrangement.steps;
  assert.equal(steps.length, 9);
  assert.ok(steps.filter((s) => s.functions.includes("B2")).length >= 3);
  assert.deepEqual(errorsOf(brief, "selected"), []);

  const noB6 = single();
  proposalOf(noB6).arrangement.steps.at(-1).functions = ["B5"];
  assert.ok(has(errorsOf(noB6, "draft"), /B6/));

  const omitted = single();
  const p = proposalOf(omitted);
  p.arrangement.steps[3].functions = ["B5"];
  p.arrangement.omitted = [
    { function: "B4", reason: "No route of the name is documented." },
  ];
  assert.deepEqual(errorsOf(omitted, "draft"), []);
});

// @req REQ-188
test("the name-origin series keeps its own legacy route: no profile, a declared myth, and the 8–14 name template count", () => {
  const legacyDoc = readFileSync(
    new URL(
      "../../../.claude/skills/ethniafrica-structure/references/gabarit-carrousel-nom.md",
      import.meta.url
    ),
    "utf-8"
  );
  assert.match(legacyDoc, /8 à 14/, "the range this module cites still stands");

  const brief = single();
  const p = proposalOf(brief);
  p.series = "name-origin";
  // a reading profile must not be added to the historical series
  assert.ok(has(errorsOf(brief, "draft"), /name-origin.*no reading profile/));
  p.profile = null;
  p.cardCount = 5;
  assert.ok(has(errorsOf(brief, "draft"), /8–14/));
  // no myth declared: the series never loses its myth rule
  assert.ok(has(errorsOf(brief, "draft"), /myth/));

  p.myth = { claimRef: "c1" };
  p.arrangement.steps = Array.from({ length: 8 }, (_, i) => ({
    move: `move ${i + 1}`,
    functions: [["B1"], ["B2"], ["B3"], ["B3"], ["B4"], ["B4"], ["B5"], ["B6"]][
      i
    ],
    purpose: `purpose of card ${i + 1} in this synthetic route`,
    claimRefs: ["c1"],
    composition: "template",
  }));
  p.cardCount = 8;
  assert.deepEqual(errorsOf(brief, "draft"), []);

  p.family = "comparison";
  assert.ok(has(errorsOf(brief, "draft"), /name-origin.*name-investigation/));
});

// @req REQ-188
test("guided listening owes a music claim, so the music review can never be skipped by the plan", () => {
  const brief = single();
  const p = proposalOf(brief);
  p.profile = "reading-listening";
  assert.ok(has(errorsOf(brief, "draft"), /music/));
  design(brief).research.claims[0].kind = "music";
  assert.ok(!has(errorsOf(brief, "draft"), /music/));
});

// @req REQ-188
test("the selected plan fits the profile: cover first, credits last, foreign compositions refused, no timeline without dates", () => {
  const foreign = single();
  cardsOf(foreign)[2].composition = "comparison";
  assert.ok(has(errorsOf(foreign, "selected"), /not in reading-story/));

  const notCover = single();
  cardsOf(notCover)[0].composition = "portrait";
  assert.ok(has(errorsOf(notCover, "selected"), /first card must be a cover/));

  const notCredits = single();
  cardsOf(notCredits).at(-1).composition = "document";
  assert.ok(has(errorsOf(notCredits, "selected"), /last card must be credits/));

  const timeline = single();
  cardsOf(timeline)[2].composition = "timeline";
  assert.ok(has(errorsOf(timeline, "selected"), /2–4 dated entries/));
  cardsOf(timeline)[2].datedEntries = 2;
  assert.ok(!has(errorsOf(timeline, "selected"), /dated entries/));

  const map = single();
  cardsOf(map)[2].composition = "map";
  assert.ok(has(errorsOf(map, "selected"), /map card needs a place/));

  const outOfRange = single();
  const extra = cardsOf(outOfRange);
  for (let i = 0; i < 5; i++) extra.splice(2, 0, { ...extra[2], id: `x${i}` });
  assert.ok(has(errorsOf(outOfRange, "selected"), /outside reading-story/));
});

// @req REQ-188
test("a comparison card names its relation as comparaison, never the derivation arrow or a ranking", () => {
  // C3 has no outline in the demo, so the rule is exercised on a synthetic card
  const c3 = proposalOf(lingala(), "C3");
  const synthetic = single();
  const p = proposalOf(synthetic);
  p.profile = "reading-comparison";
  p.cardCount = 5;
  cardsOf(synthetic)[2].composition = "comparison";
  cardsOf(synthetic)[2].pairs = 2;
  assert.ok(has(errorsOf(synthetic, "selected"), /relation "comparaison"/));
  cardsOf(synthetic)[2].relation = "comparaison";
  assert.ok(!has(errorsOf(synthetic, "selected"), /relation/));
  cardsOf(synthetic)[2].relation = "derivation";
  assert.ok(has(errorsOf(synthetic, "selected"), /relation/));
  assert.ok(c3.arrangement.steps.some((s) => s.composition === "comparison"));
});

// @req REQ-188
test("every takeaway and criterion is reached by a card, and every statement is filled", () => {
  const unsupported = single();
  for (const card of cardsOf(unsupported)) {
    card.supports.criterionIds = card.supports.criterionIds.filter(
      (id) => id !== "sc2"
    );
  }
  assert.ok(has(errorsOf(unsupported, "selected"), /criterion sc2/));

  const foreign = single();
  cardsOf(foreign)[1].supports.takeawayIds.push("t9");
  assert.ok(has(errorsOf(foreign, "selected"), /unknown takeaway t9/));

  const ellipsis = single();
  design(ellipsis).outline.successStatements[0].statement = "Le nom vient de…";
  assert.ok(has(errorsOf(ellipsis, "selected"), /placeholder/));

  const noStatement = single();
  design(noStatement).outline.successStatements.pop();
  assert.ok(has(errorsOf(noStatement, "selected"), /no reader success/));
});

// @req REQ-188
test("each card carries its qualification and source locally, and the heading stays honest when read alone", () => {
  const noQualification = single();
  cardsOf(noQualification)[1].qualification = " ";
  assert.ok(has(errorsOf(noQualification, "selected"), /qualification/));

  const noSource = single();
  cardsOf(noSource)[2].sourceLine = "";
  assert.ok(has(errorsOf(noSource, "selected"), /source line/));

  // a flat factual headline over a qualified claim: the caveat may not hide in the body
  const flat = single();
  cardsOf(flat)[1].headingKind = "claim";
  assert.ok(has(errorsOf(flat, "selected"), /flat factual heading/));
  cardsOf(flat)[1].headingKind = "qualified-claim";
  assert.ok(!has(errorsOf(flat, "selected"), /flat factual heading/));

  const badKind = single();
  cardsOf(badKind)[1].headingKind = "shout";
  assert.ok(has(errorsOf(badKind, "selected"), /headingKind/));

  // workshop diagnostics never reach the reader
  for (const [field, text] of [
    ["heading", "B3 : les traces"],
    ["qualification", "claim ID k2, inventaire non vérifié"],
    ["sourceLine", "livre C manquant"],
  ]) {
    const leaked = single();
    cardsOf(leaked)[2][field] = text;
    assert.ok(has(errorsOf(leaked, "selected"), /workshop/), field);
  }
});

// @req REQ-188
test("a card cannot rest on a gap, and an unresolved reference fails", () => {
  const gap = single();
  design(gap).research.claims[1].status = "gap";
  assert.ok(has(errorsOf(gap, "selected"), /is a gap/));
  const ghost = single();
  cardsOf(ghost)[2].evidence.claimRefs.push("c99");
  assert.ok(has(errorsOf(ghost, "selected"), /unknown reference c99/));
});

// @req REQ-188
test("the outline must explain its count, its pattern fit and its order, and declare what is unresolved", () => {
  for (const field of ["countReason"]) {
    const brief = single();
    design(brief).outline[field] = "";
    assert.ok(has(errorsOf(brief, "selected"), new RegExp(field)), field);
  }
  const rationale = single();
  design(rationale).outline.rationale.orderLogic = "";
  assert.ok(has(errorsOf(rationale, "selected"), /orderLogic/));
  const unresolved = single();
  delete design(unresolved).outline.unresolved;
  assert.ok(has(errorsOf(unresolved, "selected"), /unresolved/));
});

// @req REQ-188
test("a recommendation is not a selection, a synthetic choice never opens a handoff, and a file alone proves nothing", () => {
  const brief = single();
  design(brief).selection = null;
  assert.ok(has(errorsOf(brief, "selected"), /a recommendation is not/));
  assert.ok(has(errorsOf(single(), "handoff"), /synthetic/));
  assert.equal(resumeStep(single()).stage, "3-present");

  const unshown = single();
  design(unshown).selection.kind = "operator";
  assert.ok(has(errorsOf(unshown, "handoff"), /never shown/));

  const stale = handoffReady();
  design(stale).outline.cards[1].message += " Changed after it was shown.";
  assert.ok(has(errorsOf(stale, "handoff"), /outline changed/));
});

// @req REQ-188
test("a valid carousel handoff derives carouselSequence, keeps claim IDs and uncertainty, and asks for no video sequence", () => {
  const brief = handoffReady();
  assert.deepEqual(errorsOf(brief, "handoff"), []);
  assert.equal(brief.videoSequence, undefined);
  const result = validateBrief(brief, { today: TODAY });
  assert.deepEqual(result.errors, []);
  assert.deepEqual(
    brief.carouselSequence.map((s) => s.step),
    cardsOf(brief).map((c) => c.id)
  );
  // uncertainty travels with the claims the cards cite
  const cited = new Set(cardsOf(brief).flatMap((c) => c.evidence.claimRefs));
  for (const claim of design(brief).research.claims) {
    if (cited.has(claim.id)) assert.equal(typeof claim.uncertainty, "string");
  }
});

// @req REQ-188
test("the handoff edition is a snapshot of the design: sequence, format, profile, question and series agree", () => {
  const sequence = handoffReady();
  sequence.carouselSequence.pop();
  assert.ok(has(errorsOf(sequence, "handoff"), /carouselSequence/));

  const question = handoffReady();
  question.edition.angle.question = "Another question ?";
  assert.ok(has(errorsOf(question, "handoff"), /edition question/));

  const profile = handoffReady();
  profile.carouselProfile = "reading-comparison";
  assert.ok(has(errorsOf(profile, "handoff"), /carouselProfile/));

  // an existing series edition is never silently reclassified as social-only
  const relabelled = handoffReady();
  relabelled.edition.series = "name-origin";
  assert.ok(has(errorsOf(relabelled, "handoff"), /edition series/));

  // and a social-only design is never smuggled into the historical series
  const stealth = handoffReady();
  proposalOf(stealth).series = "name-origin";
  assert.ok(has(errorsOf(stealth, "handoff"), /name-origin/));
});

// @req REQ-186
test("a name-origin carousel edition needs its myth in the brief, and a social-only name investigation still owes the name review", () => {
  const brief = handoffReady();
  const plan = planReviews(brief.edition, { narrativeDesign: design(brief) });
  const review = (id) => plan.reviews.find((r) => r.id === id);
  assert.equal(review("name").applicability, "required");
  assert.equal(review("provenance").applicability, "required");
  assert.equal(review("myth").applicability, "not-applicable");
  assert.equal(review("name-origin-gabarit").applicability, "not-applicable");
  // no name-origin series, no fixed closing, no invented episode
  assert.equal(plan.narrationGabarit.closing, undefined);

  const withMyth = handoffReady();
  withMyth.edition.myth = { question: "Le nom vient-il du fleuve ?" };
  const mythPlan = planReviews(withMyth.edition, {
    narrativeDesign: design(withMyth),
  });
  assert.equal(
    mythPlan.reviews.find((r) => r.id === "myth").applicability,
    "required"
  );
});

// @req REQ-188
test("an approved legacy carousel resumes without the new intake, and Mémoires sonores keeps its own route", () => {
  const legacy = JSON.parse(
    readFileSync(
      new URL(
        "./families/fixtures/legacy-name-origin.brief.json",
        import.meta.url
      ),
      "utf-8"
    )
  );
  assert.equal(resumeStep(legacy).stage, "legacy");
  assert.equal(validateBrief(legacy, { today: TODAY }).ok, true);
  // the profile descriptors are read, never rewritten by this feature
  const profiles = readdirSync(
    new URL("../../harness/carousel-profiles/", import.meta.url)
  );
  assert.ok(profiles.includes("memoires-sonores.json"));
  assert.ok(profiles.includes("lectures-afrique.json"));
});

// @req REQ-188
test("the three Lingala proposals differ in question, learning and card sequence, and their examples are labelled", () => {
  const proposals = design(lingala()).proposals;
  assert.deepEqual(
    proposals.map((p) => p.id),
    ["C1", "C2", "C3"]
  );
  for (const key of ["question", "patternId", "profile"]) {
    const values = new Set(proposals.map((p) => p[key]));
    if (key !== "profile") assert.equal(values.size, 3, key);
  }
  const sequences = proposals.map((p) =>
    p.arrangement.steps.map((s) => s.move).join("|")
  );
  assert.equal(new Set(sequences).size, 3);
  const learning = proposals.map((p) =>
    p.takeaways.map((t) => t.text).join("|")
  );
  assert.equal(new Set(learning).size, 3);
  assert.deepEqual(
    proposals.map((p) => p.cardCount),
    [9, 6, 7]
  );
  assert.ok(
    proposals.every((p) => p.referenceExample.status === "hypothetical")
  );
  assert.ok(design(lingala()).selection.kind === "synthetic");
});

// @req REQ-188
test("proposal cards show every field of the specification, a card preview mapped to B1–B6, and no duration", () => {
  const text = renderProposals(design(lingala()));
  for (const label of [
    "Question",
    "Trame",
    "Application au sujet",
    "Recherche",
    "Acquis",
    "Critère de réussite",
    "Exemple de référence",
    "Agencement",
    "Profil et nombre",
    "Particularité",
    "Statut",
  ]) {
    assert.equal(
      text.split(`**${label}**`).length - 1,
      3,
      `${label} on each of 3 cards`
    );
  }
  assert.match(text, /B2\+B3/);
  assert.match(text, /reading-story/);
  assert.match(text, /reading-comparison/);
  assert.match(text, /hypothétique/i);
  assert.match(text, /Recommandation/);
  assert.doesNotMatch(text, /\*\*Durée\*\*/);
  assert.doesNotMatch(text, /secondes|minutes?\b/i);
  for (const pattern of PATTERNS) assert.ok(text.includes(pattern.id));
  const previews = text
    .split("**Agencement**")
    .slice(1)
    .map((chunk) => chunk.split("\n\n")[0]);
  assert.equal(new Set(previews).size, 3);
});

// @req REQ-188
test("the chosen plan is shown as a card table with count, rationale, completed statements and unresolved needs", () => {
  const text = renderPlan(design(lingala()));
  assert.match(text, /\| C1-01 \| B1 \|/);
  assert.match(text, /\| C1-09 \| B6 \|/);
  assert.equal(
    text.split("\n").filter((l) => /^\| C1-\d\d /.test(l)).length,
    9
  );
  assert.match(text, /Neuf cartes|9 cartes/);
  assert.match(text, /Pourquoi cette trame/);
  assert.match(text, /Pourquoi cet ordre/);
  assert.match(text, /Ce que le lecteur doit pouvoir dire/);
  assert.match(text, /Reste à établir/);
  assert.match(text, /SYNTHÉTIQUE/);
  assert.match(text, /n'est pas le texte des cartes/);
  assert.doesNotMatch(text, /…/);
  assert.doesNotMatch(text, /Durée|secondes|minut/i);
});

// @req REQ-188
test("the committed carousel demonstration is what the tool renders, and shares the reel demonstration's research verbatim", () => {
  const d = design(lingala());
  assert.equal(
    readFileSync(
      new URL(
        "../../../docs/design/gabarits-social/NARRATIVE-DESIGN-CAROUSEL-LINGALA-DEMO.md",
        import.meta.url
      ),
      "utf-8"
    ),
    `${renderProposals(d)}\n---\n\n${renderPlan(d)}`
  );
  assert.deepEqual(d.research, load("lingala-demo").narrativeDesign.research);
});

// @req REQ-188
test("one catalogue serves both formats: every pattern has a carousel reading, and the rendered reference includes it", () => {
  assert.deepEqual(
    Object.keys(CAROUSEL_READING).sort(),
    PATTERNS.map((p) => p.id).sort()
  );
  const catalogue = renderCatalogue();
  for (const [id, reading] of Object.entries(CAROUSEL_READING)) {
    assert.ok(catalogue.includes(reading.arrangement), id);
    assert.ok(catalogue.includes(reading.success), id);
  }
  assert.equal(PATTERNS.length, 10, "no second catalogue was added");
  assert.equal(
    readFileSync(
      new URL(
        "../../../.claude/skills/ethniafrica-idee/references/narrative-patterns.md",
        import.meta.url
      ),
      "utf-8"
    ),
    catalogue
  );
});

// @req REQ-188
test("the CLI validates, renders, records presentation and resumes a carousel design", () => {
  const cli = new URL("./check-narrative-design.mjs", import.meta.url).pathname;
  const dir = mkdtempSync(join(tmpdir(), "narrative-carousel-"));
  try {
    const file = join(dir, "brief.json");
    copyFileSync(fixtureUrl("lingala-carousel-demo").pathname, file);
    const run = (...args) =>
      spawnSync("node", [cli, file, ...args], { encoding: "utf-8" });
    assert.equal(run("--mode", "draft").status, 0);
    assert.equal(run("--mode", "selected").status, 0);
    const handoff = run("--mode", "handoff");
    assert.equal(handoff.status, 1);
    assert.match(handoff.stdout, /synthetic/);
    assert.match(run("--render", "proposals").stdout, /\*\*Agencement\*\*/);
    assert.match(run("--render", "plan").stdout, /\| C1-01 \|/);
    assert.match(run("--resume").stdout, /3-present/);
    assert.equal(
      run(
        "--record-shown",
        "proposals",
        "--where",
        "conversation",
        "--at",
        TODAY
      ).status,
      0
    );
    const written = JSON.parse(readFileSync(file, "utf-8"));
    assert.equal(written.narrativeDesign.format, "carrousel");
    assert.match(
      written.narrativeDesign.presentation.proposals.digest,
      /^[0-9a-f]{64}$/
    );
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

// @req REQ-188
test("the reel narration checker refuses a carousel brief instead of grading cards as narration", () => {
  const dir = mkdtempSync(join(tmpdir(), "narrative-carousel-"));
  try {
    const briefFile = join(dir, "brief.json");
    const narrationFile = join(dir, "narration.fr.txt");
    writeFileSync(briefFile, JSON.stringify(handoffReady()));
    writeFileSync(narrationFile, "Une scène.");
    const gabarit = new URL("./check-gabarit.mjs", import.meta.url).pathname;
    const run = spawnSync(
      "node",
      [gabarit, narrationFile, "--brief", briefFile],
      { encoding: "utf-8" }
    );
    assert.equal(run.status, 2);
    assert.match(run.stdout, /un carrousel n'a pas de narration/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

// @req REQ-188
test("check-family-brief refuses a carousel draft and accepts a shown handoff with the card-copy route", () => {
  const dir = mkdtempSync(join(tmpdir(), "narrative-carousel-"));
  try {
    const briefFile = join(dir, "brief.json");
    const familyCli = new URL("./check-family-brief.mjs", import.meta.url)
      .pathname;
    const draft = single();
    draft.narrativeDesign.selection = null;
    draft.narrativeDesign.outline = null;
    writeFileSync(briefFile, JSON.stringify(draft));
    const refused = spawnSync(
      "node",
      [familyCli, briefFile, "--today", TODAY],
      {
        encoding: "utf-8",
      }
    );
    assert.equal(refused.status, 1);
    assert.match(refused.stdout, /narrative design is not ready/);

    writeFileSync(briefFile, JSON.stringify(handoffReady()));
    const accepted = spawnSync(
      "node",
      [familyCli, briefFile, "--today", TODAY],
      { encoding: "utf-8" }
    );
    assert.equal(accepted.status, 0, accepted.stdout + accepted.stderr);
    assert.match(accepted.stdout, /carousel/i);
    assert.doesNotMatch(accepted.stdout, /check-gabarit\.mjs <narration>/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
