/**
 * Which reviews a narrative brief owes, decided by the claims and media it
 * actually carries, and whether the brief is complete enough to hand to
 * `structure`. Pure functions: the contract (`../contract/contract.mjs`) says
 * what a family and a check *mean*; this module says which skill answers each
 * check and refuses the shapes that would silently switch a review off.
 *
 * A family never appears in a condition below except to look up its scene
 * profile. Reviews follow claims, not families: a portrait that states where a
 * name comes from owes the onomastic review, a name investigation that states
 * nothing about a route owes no geography review.
 */
import {
  FAMILIES,
  applicableChecks,
  validateEdition,
} from "../contract/contract.mjs";
import { CLOTURE_UNIQUE, TYPES } from "./gabarit-reel.mjs";
import { validateDesign } from "./narrative-design.mjs";

// The contract's default table (EDITORIAL-CONTRACT.md §2). `free` is a
// rendering fact for guided listening; it is not a way out of any review.
export const SCENE_PROFILE_BY_FAMILY = Object.freeze({
  "name-investigation": "name-origin",
  "historical-portrait": "history-geography",
  "circulation-connections": "history-geography",
  comparison: "thematic-analysis",
  "material-biography": "thematic-analysis",
  "guided-listening": "free",
});

// The trigger vocabulary of applicableChecks. A claim kind outside this list is
// almost always a typo, and a typo on `name-origin` would switch the onomastic
// review off without a sound, so it is refused rather than tolerated.
export const CLAIM_KINDS = Object.freeze([
  "name-origin",
  "place",
  "route",
  "map",
  "music",
  "event",
  "person",
  "artifact",
  "comparison",
  "language",
  "correction",
]);

const REVIEWER = {
  provenance: "ethniafrica-structure",
  uncertainty: "ethniafrica-message",
  attribution: "ethniafrica-produire",
  intelligibility: "ethniafrica-message",
  "non-essentialising": "ethniafrica-message",
  name: "ethniafrica-onomastique",
  myth: "ethniafrica-mythe",
  geography: "ethniafrica-structure",
  music: "ethniafrica-produire",
  "name-origin-gabarit": "social/tools/narration/check-gabarit.mjs",
};

const UNIVERSAL = [
  "provenance",
  "uncertainty",
  "attribution",
  "intelligibility",
  "non-essentialising",
];
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const STALE_AFTER_DAYS = 30;

// "peuple:Fula" -> "peuple". The gabarit is written per typologie of the
// production ledger, so the series cannot run without one.
const typologieOf = (edition) => edition.subject?.key?.split(":")[0];

// `narrativeDesign` is the explicit switch of the research-led route: the
// series keeps its closing, but the fixed scene list, name count and
// explanation ceiling of the legacy gabarit stop applying. Never inferred from
// the family or the series, so neither can be relabelled to skip a check.
export function planReviews(edition, { narrativeDesign } = {}) {
  // No default to fall back to: an unknown family stops here, and says which
  // ones exist, because the fix is always a rename.
  if (!FAMILIES.includes(edition?.family)) {
    throw new Error(
      `unknown narrative family "${edition?.family}"; expected one of ${FAMILIES.join(", ")}`
    );
  }
  const checks = applicableChecks(edition);
  const reviews = checks
    .filter((check) => check.id !== "name-origin-gabarit")
    .map((check) => ({
      ...check,
      skill: REVIEWER[check.id],
      universal: UNIVERSAL.includes(check.id),
    }));
  const inSeries = edition.series === "name-origin";
  const type = typologieOf(edition);
  const gabaritCheck = checks.find(
    (check) => check.id === "name-origin-gabarit"
  );
  reviews.push({
    ...gabaritCheck,
    skill: REVIEWER["name-origin-gabarit"],
    universal: false,
  });
  const narrationGabarit = narrativeDesign
    ? {
        applies: false,
        route: "narrative-design",
        ...(inSeries ? { closing: CLOTURE_UNIQUE } : {}),
      }
    : inSeries
      ? { applies: true, type }
      : { applies: false };
  return { family: edition.family, reviews, narrationGabarit };
}

const daysBetween = (from, to) =>
  (Date.parse(to) - Date.parse(from)) / 86_400_000;

function strategyErrors(strategy, today) {
  if (!strategy) {
    return ["brief has no strategy basis (dated-evidence or exploratory)"];
  }
  if (strategy.basis === "exploratory") {
    return strategy.reason
      ? []
      : ["an exploratory brief must say why no dated evidence backs it"];
  }
  if (strategy.basis === "dated-evidence") {
    if (!DATE.test(strategy.reportDate ?? "")) {
      return ["dated-evidence needs a reportDate (YYYY-MM-DD)"];
    }
    return daysBetween(strategy.reportDate, today) > STALE_AFTER_DAYS
      ? [
          `the report of ${strategy.reportDate} is older than ${STALE_AFTER_DAYS} days; refresh it or label the brief exploratory`,
        ]
      : [];
  }
  return [`unknown strategy basis "${strategy.basis}"`];
}

function sequenceErrors(brief) {
  const needed = { carrousel: "carouselSequence", video: "videoSequence" }[
    brief.edition?.format
  ];
  const errors = [];
  for (const key of ["carouselSequence", "videoSequence"]) {
    const sequence = brief[key];
    if (sequence === undefined && key !== needed) continue;
    if (!Array.isArray(sequence) || sequence.length === 0) {
      errors.push(`${key} is required for a ${brief.edition?.format} edition`);
    } else if (sequence.some((step) => !step?.step)) {
      errors.push(`${key} has a step without a name`);
    }
  }
  return errors;
}

export function validateBrief(brief, { today }) {
  const errors = [];
  const edition = brief?.edition;
  // A brief that carries a design is held to the handoff: a draft or an
  // unshown plan is not executable, and never falls back to the legacy path.
  if (brief && "narrativeDesign" in brief) {
    const design = validateDesign(brief.narrativeDesign, {
      mode: "handoff",
      brief,
    });
    if (!design.ok) {
      errors.push(
        "narrative design is not ready for structure (node social/tools/narration/check-narrative-design.mjs <brief> --mode handoff)",
        ...design.errors
      );
    }
  }
  if (!edition) {
    return { ok: false, errors: [...errors, "brief has no edition"] };
  }

  errors.push(...validateEdition(edition).errors);

  for (const claim of edition.claims ?? []) {
    if (!CLAIM_KINDS.includes(claim.kind)) {
      errors.push(
        `claim kind "${claim.kind}" on ${claim.id} is not in the vocabulary`
      );
    }
  }
  if (
    edition.series === "name-origin" &&
    !TYPES.includes(typologieOf(edition))
  ) {
    errors.push(
      `the name-origin series needs a subject key typed by a typologie (${TYPES.join(", ")})`
    );
  }
  errors.push(...strategyErrors(brief.strategy, today));

  if (!brief.question) errors.push("brief has no question");
  if (!Array.isArray(brief.uncertainties)) {
    // An empty list is a declared silence; an absent key is an unanswered question.
    errors.push(
      "brief must declare its uncertainties (an empty list is a declaration)"
    );
  }
  const claimIds = new Set((edition.claims ?? []).map((claim) => claim.id));
  if (!Array.isArray(brief.beats) || brief.beats.length === 0) {
    errors.push("brief has no beats");
  }
  for (const beat of brief.beats ?? []) {
    for (const id of beat.claims ?? []) {
      if (!claimIds.has(id))
        errors.push(`beat ${beat.id} cites unknown claim ${id}`);
    }
  }
  errors.push(...sequenceErrors(brief));

  return { ok: errors.length === 0, errors };
}

export { FAMILIES };
