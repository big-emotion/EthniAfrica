import { test } from "node:test";
import assert from "node:assert/strict";
import {
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { FAMILIES } from "../contract/contract.mjs";
import { CLOTURE_UNIQUE } from "./gabarit-reel.mjs";
import {
  CLAIM_KINDS,
  SCENE_PROFILE_BY_FAMILY,
  planReviews,
  validateBrief,
} from "./family-routing.mjs";

const TODAY = "2026-09-29";
const fixtureDir = new URL("./families/fixtures/", import.meta.url);
const fixture = (name) =>
  JSON.parse(readFileSync(new URL(`${name}.brief.json`, fixtureDir), "utf-8"));

// A minimal sourced brief that passes; each test bends one thing.
function portraitBrief(overrides = {}) {
  const brief = structuredClone(fixture("historical-portrait"));
  return { ...brief, ...overrides };
}
const review = (plan, id) => plan.reviews.find((entry) => entry.id === id);

// @req REQ-186
test("legacy name-origin edition keeps name, myth, geography and the gabarit", () => {
  const brief = fixture("legacy-name-origin");
  const plan = planReviews(brief.edition);
  for (const id of ["name", "myth", "geography", "name-origin-gabarit"]) {
    assert.equal(review(plan, id).applicability, "required", id);
  }
  assert.equal(review(plan, "name").skill, "ethniafrica-onomastique");
  assert.equal(review(plan, "myth").skill, "ethniafrica-mythe");
  assert.deepEqual(plan.narrationGabarit, { applies: true, type: "langue" });
  assert.equal(validateBrief(brief, { today: TODAY }).ok, true);
});

// @req REQ-186
test("a sourced social-only portrait needs no myth, no name review, no gabarit", () => {
  const brief = fixture("historical-portrait");
  const plan = planReviews(brief.edition);
  assert.equal(review(plan, "myth").applicability, "not-applicable");
  assert.match(review(plan, "myth").reason, /belief/);
  assert.equal(review(plan, "name").applicability, "not-applicable");
  assert.equal(plan.narrationGabarit.applies, false);
  assert.equal(validateBrief(brief, { today: TODAY }).ok, true);
});

// @req REQ-186
test("a genuine name claim inside a portrait activates the onomastic review only", () => {
  const brief = portraitBrief();
  brief.edition.claims.push({
    id: "c-name",
    kind: "name-origin",
    sources: [{ tier: "referenced", ref: "fx-source-9" }],
  });
  const plan = planReviews(brief.edition);
  assert.equal(review(plan, "name").applicability, "required");
  assert.equal(review(plan, "name").skill, "ethniafrica-onomastique");
  assert.equal(plan.narrationGabarit.applies, false);
});

// @req REQ-186
test("a declared debunk activates the myth review", () => {
  const brief = portraitBrief();
  brief.edition.myth = { fr: "Le mythe attesté, posé en question ?" };
  const plan = planReviews(brief.edition);
  assert.equal(review(plan, "myth").applicability, "required");
  assert.equal(review(plan, "myth").skill, "ethniafrica-mythe");
});

// @req REQ-186
test("geographic and musical reviews follow the claims and media present", () => {
  const brief = portraitBrief();
  brief.edition.claims.push({
    id: "c-route",
    kind: "route",
    sources: [{ tier: "official", ref: "fx-source-8" }],
  });
  brief.edition.media = [{ kind: "audio-excerpt" }];
  const plan = planReviews(brief.edition);
  assert.equal(review(plan, "geography").applicability, "required");
  assert.equal(review(plan, "music").applicability, "required");

  const plain = planReviews(fixture("historical-portrait").edition);
  assert.equal(review(plain, "geography").applicability, "not-applicable");
  assert.equal(review(plain, "music").applicability, "not-applicable");
});

// @req REQ-186
test("a comparison is not held to the fixed name-origin wording", () => {
  const brief = fixture("comparison");
  assert.doesNotMatch(brief.question, /D'où vient le nom/);
  assert.equal(planReviews(brief.edition).narrationGabarit.applies, false);
  assert.equal(validateBrief(brief, { today: TODAY }).ok, true);
});

// @req REQ-186
test("a free scene profile bypasses no universal review and no provenance", () => {
  const brief = fixture("guided-listening");
  assert.equal(brief.sceneProfile, "free");
  brief.edition.claims[0].sources = [];
  const plan = planReviews(brief.edition);
  for (const id of [
    "provenance",
    "uncertainty",
    "attribution",
    "intelligibility",
    "non-essentialising",
  ]) {
    assert.equal(review(plan, id).applicability, "required", id);
  }
  const { ok, errors } = validateBrief(brief, { today: TODAY });
  assert.equal(ok, false);
  assert.ok(
    errors.some((error) => /no source/.test(error)),
    errors.join("\n")
  );
});

// @req REQ-186
test("every family keeps the five universal reviews whatever else is absent", () => {
  for (const family of FAMILIES) {
    const brief = fixture(family);
    const plan = planReviews(brief.edition);
    const universal = plan.reviews.filter((entry) => entry.universal);
    assert.equal(universal.length, 5, family);
    assert.ok(universal.every((entry) => entry.applicability === "required"));
  }
});

// @req REQ-186
test("an unknown family fails clearly and never falls back to a default", () => {
  const brief = portraitBrief();
  brief.edition.family = "portrait";
  assert.throws(
    () => planReviews(brief.edition),
    /unknown narrative family "portrait".*historical-portrait/
  );
  const { ok, errors } = validateBrief(brief, { today: TODAY });
  assert.equal(ok, false);
  assert.ok(
    errors.some((error) => /unknown narrative family "portrait"/.test(error))
  );
});

// @req REQ-186
test("a misspelled claim kind is refused instead of silently skipping a review", () => {
  const brief = portraitBrief();
  brief.edition.claims[0].kind = "nam-origin";
  const { ok, errors } = validateBrief(brief, { today: TODAY });
  assert.equal(ok, false);
  assert.ok(errors.some((error) => /claim kind "nam-origin"/.test(error)));
  assert.ok(CLAIM_KINDS.includes("name-origin"));
});

// @req REQ-186
test("a name investigation without a name-origin claim is refused", () => {
  const brief = fixture("name-investigation");
  brief.edition.claims = brief.edition.claims.filter(
    (claim) => claim.kind !== "name-origin"
  );
  assert.equal(validateBrief(brief, { today: TODAY }).ok, false);
});

// @req REQ-186
test("the name-origin series needs a typologie the gabarit knows", () => {
  const brief = fixture("legacy-name-origin");
  brief.edition.subject.key = "thing:FXL";
  const { ok, errors } = validateBrief(brief, { today: TODAY });
  assert.equal(ok, false);
  assert.ok(errors.some((error) => /typologie/.test(error)));
});

// A `mot` has no fiche to resolve (operator exception, 2026-09-21), so its
// subject key carries no corpusRef and the series still accepts it.
// @req REQ-186
test("the name-origin series accepts the mot exception", () => {
  const brief = fixture("legacy-name-origin");
  brief.edition.subject = { key: "mot:FXM", label: "Mot · Example" };
  assert.equal(validateBrief(brief, { today: TODAY }).ok, true);
});

// The reel gabarit has a skeleton per typologie but none for a word, so the
// fixed comparison checks cannot run on a mot; the single closing still binds.
// @req REQ-186
test("a mot in the series keeps the closing but no gabarit skeleton", () => {
  const brief = fixture("legacy-name-origin");
  brief.edition.subject = { key: "mot:FXM", label: "Mot · Example" };
  const { narrationGabarit } = planReviews(brief.edition);
  assert.equal(narrationGabarit.applies, false);
  assert.equal(narrationGabarit.closing, CLOTURE_UNIQUE);
});

// @req REQ-186
test("strategy basis: dated evidence must be fresh, exploratory must say why", () => {
  const dated = portraitBrief({
    strategy: { basis: "dated-evidence", reportDate: "2026-09-26" },
  });
  assert.equal(validateBrief(dated, { today: TODAY }).ok, true);

  const stale = portraitBrief({
    strategy: { basis: "dated-evidence", reportDate: "2026-07-01" },
  });
  const staleResult = validateBrief(stale, { today: TODAY });
  assert.equal(staleResult.ok, false);
  assert.ok(staleResult.errors.some((error) => /30 days/.test(error)));

  const exploratory = portraitBrief({
    strategy: { basis: "exploratory", reason: "no comparator exists" },
  });
  assert.equal(validateBrief(exploratory, { today: TODAY }).ok, true);

  const unexplained = portraitBrief({ strategy: { basis: "exploratory" } });
  assert.equal(validateBrief(unexplained, { today: TODAY }).ok, false);

  const missing = portraitBrief({ strategy: undefined });
  assert.equal(validateBrief(missing, { today: TODAY }).ok, false);
});

// @req REQ-186
test("a brief declares its uncertainties, beats that cite real claims, and its format's sequence", () => {
  const noUncertainties = portraitBrief();
  delete noUncertainties.uncertainties;
  assert.equal(validateBrief(noUncertainties, { today: TODAY }).ok, false);

  const declaredNone = portraitBrief({ uncertainties: [] });
  assert.equal(validateBrief(declaredNone, { today: TODAY }).ok, true);

  const ghostClaim = portraitBrief();
  ghostClaim.beats[0].claims = ["c-ghost"];
  assert.ok(
    validateBrief(ghostClaim, { today: TODAY }).errors.some((error) =>
      /c-ghost/.test(error)
    )
  );

  const noSequence = portraitBrief();
  delete noSequence.carouselSequence;
  assert.ok(
    validateBrief(noSequence, { today: TODAY }).errors.some((error) =>
      /carouselSequence/.test(error)
    )
  );
});

// @req REQ-186
test("the scene profile of each fixture is the family's default, from the contract table", () => {
  assert.deepEqual(SCENE_PROFILE_BY_FAMILY, {
    "name-investigation": "name-origin",
    "historical-portrait": "history-geography",
    "circulation-connections": "history-geography",
    comparison: "thematic-analysis",
    "material-biography": "thematic-analysis",
    "guided-listening": "free",
  });
  for (const family of FAMILIES) {
    assert.equal(
      fixture(family).sceneProfile,
      SCENE_PROFILE_BY_FAMILY[family],
      family
    );
  }
});

// @req REQ-186
test("every shipped fixture is a brief that passes and is marked synthetic", () => {
  const names = readdirSync(fixtureDir).filter((f) =>
    f.endsWith(".brief.json")
  );
  assert.equal(names.length, FAMILIES.length + 1);
  for (const name of names) {
    const brief = JSON.parse(readFileSync(new URL(name, fixtureDir), "utf-8"));
    assert.equal(brief.fixture, true, `${name} must say it is synthetic`);
    const { ok, errors } = validateBrief(brief, { today: TODAY });
    assert.ok(ok, `${name}: ${errors.join("; ")}`);
  }
});

// @req REQ-186
test("the CLI exits 0 on a valid brief and 1 on an unknown family, printing why", () => {
  const cli = new URL("./check-family-brief.mjs", import.meta.url).pathname;
  const good = new URL("historical-portrait.brief.json", fixtureDir).pathname;
  const passed = spawnSync("node", [cli, good, "--today", TODAY], {
    encoding: "utf-8",
  });
  assert.equal(passed.status, 0);
  assert.match(passed.stdout, /myth: not-applicable/);

  const bad = portraitBrief();
  bad.edition.family = "portrait";
  const dir = mkdtempSync(join(tmpdir(), "family-brief-"));
  try {
    const path = join(dir, "bad.brief.json");
    writeFileSync(path, JSON.stringify(bad));
    const failed = spawnSync("node", [cli, path, "--today", TODAY], {
      encoding: "utf-8",
    });
    assert.equal(failed.status, 1);
    assert.match(failed.stdout, /unknown narrative family "portrait"/);
  } finally {
    rmSync(dir, { recursive: true });
  }
});
