/**
 * Research-led narrative design for a reel: the five stages `ethniafrica-idee`
 * owns (frame, research, propose, record the choice, develop the chosen plan),
 * made checkable. Pure functions over the brief's `narrativeDesign` section.
 *
 * What this module can verify is recorded evidence and structure: that the
 * ten patterns were examined, that every reference resolves, that the choice
 * and the plan were actually shown, that the timings add up. It cannot tell
 * whether a human statement is genuine, whether a historical claim is true or
 * whether a story is compelling. Those stay with the operator and the reviews
 * (`family-routing.mjs`); a green run here is never editorial approval.
 *
 * Boundaries: the six families (`../contract/contract.mjs`) classify the kind
 * of investigation; the ten patterns below say how an argument unfolds; the six
 * functions B1–B6 are the jobs a reel must do; scene profiles are a rendering
 * matter and are not touched here.
 */
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

import { FAMILIES } from "../contract/contract.mjs";
import { CLOTURE_UNIQUE } from "./gabarit-reel.mjs";

export const DESIGN_VERSION = 1;
// A design without `format` is a reel: the field was added for carousels, and
// every brief written before it must keep validating as it did.
export const DESIGN_FORMATS = Object.freeze(["video", "carrousel"]);
export const DEFAULT_TARGET_SECONDS = 180;
const MIN_CONTENT_CHARS = 40;

/**
 * The single authority for pattern ids and their readable definitions. The
 * reference file in the idee skill is this list rendered by `renderCatalogue`,
 * and a test holds the two equal, so no second list can drift.
 */
export const PATTERNS = Object.freeze([
  {
    id: "origin-explained",
    label: "origin explained",
    labelFr: "Origine expliquée",
    question: "D'où vient ce nom ?",
    moves: [
      "forme et sens à la source",
      "contexte dans lequel le nom a été donné",
      "transmission de la forme jusqu'à aujourd'hui",
    ],
    families: ["name-investigation"],
    success:
      "Le spectateur énonce l'explication, la forme, la langue et le contexte concernés, et son degré d'incertitude.",
  },
  {
    id: "competing-explanations",
    label: "competing explanations",
    labelFr: "Explications concurrentes",
    question: "Pourquoi y a-t-il plusieurs lectures de ce nom ?",
    moves: [
      "poser les mêmes questions à chaque lecture : forme, sens, usagers, période",
      "comparer ce que chacune explique réellement",
      "dire ce que les preuves tranchent et ce qui reste ouvert",
    ],
    families: ["name-investigation"],
    success:
      "Le spectateur distingue les lectures, leurs appuis et ce qui reste ouvert, sans couronner une lecture que rien ne soutient.",
  },
  {
    id: "chronological-trajectory",
    label: "chronological trajectory",
    labelFr: "Trajectoire chronologique",
    question: "Qu'est-ce qui a changé au fil du temps ?",
    moves: [
      "premier état attesté",
      "les tournants documentés et leurs transitions",
      "l'état actuel et ce qui relie les deux",
    ],
    families: ["name-investigation", "circulation-connections"],
    success:
      "Le spectateur ordonne les changements documentés et distingue usage simultané, première attestation et création.",
  },
  {
    id: "naming-perspectives",
    label: "naming perspectives",
    labelFr: "Points de vue de nomination",
    question: "Qui appelle qui par ce nom ?",
    moves: [
      "qui emploie le nom",
      "qui il désigne et dans quel contexte",
      "ce que chaque relation de nomination dit et ne dit pas",
    ],
    families: ["name-investigation"],
    success:
      "Le spectateur identifie les relations de nomination distinctes sans déclarer irréelle une identité vécue.",
  },
  {
    id: "name-circulation",
    label: "circulation",
    labelFr: "Circulation",
    question: "Comment le nom ou son usage a-t-il voyagé ?",
    moves: [
      "le point de départ documenté",
      "les porteurs, lieux et canaux attestés",
      "les liens seulement déduits, dits comme tels",
    ],
    families: ["circulation-connections", "name-investigation"],
    success:
      "Le spectateur reconnaît les étapes attestées et les distingue des liens déduits.",
  },
  {
    id: "turning-point",
    label: "turning point",
    labelFr: "Point de bascule",
    question: "Qu'est-ce qui a changé à ce moment ?",
    moves: [
      "la situation avant",
      "l'événement ou l'action",
      "les conséquences",
      "la portée du changement, bornée",
    ],
    families: ["historical-portrait"],
    success:
      "Le spectateur explique un avant et un après documentés, et les limites des effets de l'événement.",
  },
  {
    id: "historical-actor",
    label: "historical actor",
    labelFr: "Acteur historique",
    question: "Quel rôle cette personne a-t-elle joué ?",
    moves: [
      "la situation de départ",
      "l'action documentée",
      "les effets",
      "la contribution bornée face à celle des autres",
    ],
    families: ["historical-portrait"],
    success:
      "Le spectateur distingue l'action de la personne de l'invention, de la codification, de la nomination ou de la diffusion par d'autres.",
  },
  {
    id: "clarifying-comparison",
    label: "clarifying comparison",
    labelFr: "Comparaison éclairante",
    question: "Qu'est-ce qui diffère entre ces cas ?",
    moves: [
      "définir chaque cas dans sa source",
      "les comparer sur les mêmes critères explicites",
      "dire la relation entre eux et les limites de la comparaison",
    ],
    families: ["comparison"],
    success:
      "Le spectateur énonce une ressemblance ou une différence soutenue, sans classer des peuples ni des locuteurs.",
  },
  {
    id: "anecdote-entry",
    label: "anecdote as entry",
    labelFr: "Anecdote comme entrée",
    question: "Que révèle cette scène concrète ?",
    moves: [
      "la scène",
      "la question qu'elle pose",
      "l'explication plus large",
      "le retour à la scène",
    ],
    families: [],
    success:
      "Le spectateur explique le mécanisme que la scène illustre et ce que l'anecdote seule ne peut pas établir.",
  },
  {
    id: "received-claim-examined",
    label: "received claim examined",
    labelFr: "Idée reçue examinée",
    question: "Cette idée réellement tenue est-elle exacte ?",
    moves: [
      "définir les termes de l'idée",
      "les preuves",
      "la qualification ou la correction",
      "la réponse précise",
    ],
    families: [],
    success:
      "Le spectateur reformule l'idée reçue et la réponse appuyée par les preuves, sans la remplacer par une autre affirmation sans appui.",
  },
]);

export const BLOCKS = Object.freeze([
  {
    id: "B1",
    labelFr: "Poser la question",
    function: "State a precise promise and locate the name or use.",
    question: "Quel nom et quel usage discute-t-on ?",
  },
  {
    id: "B2",
    labelFr: "Expliquer l'origine ou les origines proposées",
    function: "Give the core explanation.",
    question: "De quelle forme et de quel sens le nom pourrait-il venir ?",
  },
  {
    id: "B3",
    labelFr: "Situer les traces et les acteurs",
    function: "Anchor the explanation in attestations and actors.",
    question:
      "Depuis quand est-il attesté ? Qui l'emploie, le transmet ou le formalise ?",
  },
  {
    id: "B4",
    labelFr: "Raconter son parcours",
    function: "Explain the movement towards current usage.",
    question: "Comment s'est-il diffusé ou transformé ?",
  },
  {
    id: "B5",
    labelFr: "Répondre clairement",
    function: "State what the audience can retain.",
    question: "Qu'est-ce qui est établi, proposé ou encore inconnu ?",
  },
  {
    id: "B6",
    labelFr: "Fermer le récit",
    function: "Connect to the project and invite contributions.",
    question:
      "Quelle source ou quel récit transmis pourrait compléter l'histoire ?",
  },
]);

/**
 * How each catalogue pattern reads as a carousel. The ten ids are the reel's:
 * this is a second reading of the same pattern, never a second catalogue. The
 * arrangement is a starting shape; a proposal's own preview overrides it with
 * the subject's material.
 */
export const CAROUSEL_READING = Object.freeze({
  "origin-explained": {
    arrangement: "B1 → B2 → B3 → B4 → B5 → B6",
    success:
      "Le lecteur explique la forme et le sens proposés, dit quel est leur degré de certitude et distingue une attestation d'une création.",
  },
  "competing-explanations": {
    arrangement:
      "B1 → B5 (limite dès le début) → B2+B3 répétés par explication → B4 si étayé → B5 → B6",
    success:
      "Le lecteur reformule les explications et le point précis qu'on ne peut pas trancher, sans accorder une crédibilité égale par défaut.",
  },
  "chronological-trajectory": {
    arrangement: "B1 → B2 au besoin → B3+B4 en alternance → B5 → B6",
    success:
      "Le lecteur remet dans l'ordre les jalons étayés et dit ce qui a changé, sans transformer un intervalle vide en continuité inventée.",
  },
  "naming-perspectives": {
    arrangement: "B1 → B2+B3 par point de vue de nomination → B4 → B5 → B6",
    success:
      "Le lecteur rattache chaque usage attesté à son contexte documenté, sans faire d'une étiquette historique l'identité permanente de tous les locuteurs.",
  },
  "name-circulation": {
    arrangement: "B1 → B2+B3 du point de départ → B4 répété → B5 → B6",
    success:
      "Le lecteur décrit un trajet et un mécanisme étayés, et distingue la diffusion d'un nom de celle d'une langue ou d'une chanson.",
  },
  "turning-point": {
    arrangement:
      "B1 → B2+B3 du contexte → B3 de l'événement → B4 du changement → B5 → B6",
    success:
      "Le lecteur dit la différence avant et après, et ce que l'événement explique ou n'explique pas.",
  },
  "historical-actor": {
    arrangement:
      "B1 → B2 du contexte antérieur → B3 des actes → B4 des suites → B5 → B6",
    success:
      "Le lecteur nomme la contribution étayée sans faire de la codification, de l'enseignement ou de la circulation une invention.",
  },
  "clarifying-comparison": {
    arrangement: "B1 → B2 des définitions → B3+B4 par critère commun → B5 → B6",
    success:
      "Le lecteur donne deux distinctions étayées et un trait ou une limite communs, sans classement pur ou dégradé.",
  },
  "anecdote-entry": {
    arrangement: "B1 par la scène → B3 → B2+B4 → B5 → B6",
    success:
      "Le lecteur explique la portée de l'anecdote et pourquoi un épisode ne décrit pas tout un continent ou un siècle.",
  },
  "received-claim-examined": {
    arrangement:
      "B1 de l'affirmation en question → B5 précoce → B2+B3 → B4 si utile → B5 → B6",
    success:
      "Le lecteur corrige l'affirmation précise à l'aide des preuves, sans la remplacer par une exagération inverse.",
  },
});

const BLOCK_IDS = BLOCKS.map((block) => block.id);
const PATTERN_IDS = PATTERNS.map((pattern) => pattern.id);
const DISPOSITIONS = ["offered", "conditional", "unsupported", "inapplicable"];
const CLAIM_STATUSES = ["sourced", "qualified", "gap"];
const SOURCE_ACCESS = ["read", "indirect", "unavailable"];
// `needs_review` is the corpus's transitional marker; a design may rest on a
// source nobody has ruled on yet, and says so rather than promoting it.
const SOURCE_TIERS = ["official", "referenced", "unverified", "needs_review"];
const SELECTION_KINDS = ["operator", "delegated", "synthetic"];
const OMITTABLE = ["B2", "B3", "B4"];
const DATE = /^\d{4}-\d{2}-\d{2}$/;

const formatOf = (design) => design?.format ?? "video";

const PROFILE_DIR = new URL(
  "../../harness/carousel-profiles/",
  import.meta.url
);
// The historical name-origin carousel has no profile descriptor: its count is
// the template's own (gabarit-carrousel-nom.md, « 8 à 14 »), and a test holds
// this copy to that sentence.
const NAME_CAROUSEL = Object.freeze({ min: 8, max: 14 });
const HEADING_KINDS = ["question", "label", "qualified-claim", "claim"];
// What only the workshop should read; a card that prints it leaks the tooling.
const WORKSHOP_NOTATION =
  /\bB[1-6]\b|\bclaim ID\b|\binventaire non vérifié\b|\bunverified inventory\b|\b(?:livre|book|ouvrage) [A-C]\b|\b[ku]\d+\b/i;
const TIMING_KEYS = ["seconds", "durationSeconds", "durationReason"];

/**
 * What the renderer's own profile descriptor says, so counts and compositions
 * are never copied into Node. `own` marks the routes that keep their contract
 * (Mémoires sonores, Lectures d'Afrique): a plan may not reshape them.
 */
function readProfile(id) {
  if (typeof id !== "string" || !/^[a-z][a-z-]*$/.test(id)) return null;
  let descriptor;
  try {
    descriptor = JSON.parse(
      readFileSync(new URL(`${id}.json`, PROFILE_DIR), "utf-8")
    );
  } catch {
    return null;
  }
  if (!descriptor.reading) return { kind: "own", id };
  return {
    kind: "reading",
    id,
    label: id,
    min: descriptor.reading.min,
    max: descriptor.reading.max,
    compositions: descriptor.reading.compositions,
    music: descriptor.music === true,
  };
}

/** The count and composition contract a carousel proposal is planned under. */
function carouselRoute(proposal) {
  if (proposal.series === "name-origin") {
    return {
      kind: "name-origin",
      label: "the name-origin template",
      ...NAME_CAROUSEL,
      compositions: null,
    };
  }
  const profile = readProfile(proposal.profile);
  return profile?.kind === "reading" ? profile : null;
}

const blank = (value) => typeof value !== "string" || value.trim() === "";
const ids = (list) => (Array.isArray(list) ? list.map((item) => item?.id) : []);
const list = (value) => (Array.isArray(value) ? value : []);

function stable(value) {
  if (Array.isArray(value)) return `[${value.map(stable).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stable(value[key])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value) ?? "null";
}
const digest = (value) =>
  createHash("sha256").update(stable(value)).digest("hex");

// What the operator compares at stage 3: change any of it and the shown set is
// stale. The outline is digested on its own, because it is shown later.
export const proposalsDigest = (design) =>
  digest({
    research: design.research,
    patternAssessment: design.patternAssessment,
    proposals: design.proposals,
    recommendation: design.recommendation,
  });
export const outlineDigest = (design) => digest(design.outline ?? null);

/** Records that a stage was actually shown; a file existing proves nothing. */
export function recordPresentation(design, which, { where, at }) {
  if (!["proposals", "outline"].includes(which)) {
    throw new Error(`cannot record presentation of "${which}"`);
  }
  design.presentation = design.presentation ?? {};
  design.presentation[which] = {
    where,
    at,
    digest:
      which === "proposals" ? proposalsDigest(design) : outlineDigest(design),
  };
  return design;
}

export function timeline(outline) {
  let elapsed = 0;
  const blocks = list(outline?.blocks).map((block) => {
    const start = elapsed;
    elapsed += Number.isInteger(block.seconds) ? block.seconds : 0;
    return { ...block, start, end: elapsed };
  });
  return { blocks, totalSeconds: elapsed };
}

const clock = (seconds) =>
  `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;

function researchErrors(research, push) {
  const sourceIds = new Set(ids(research?.sources));
  for (const source of list(research?.sources)) {
    if (blank(source.id) || blank(source.locator)) {
      push("every research source needs an id and a locator");
    }
    if (!SOURCE_TIERS.includes(source.tier)) {
      push(`source ${source.id} has no valid tier`);
    }
    if (!SOURCE_ACCESS.includes(source.access)) {
      push(`source ${source.id} access must be read, indirect or unavailable`);
    }
  }
  const claims = list(research?.claims);
  if (claims.length === 0) push("research holds no claim");
  for (const claim of claims) {
    if (blank(claim.id) || blank(claim.text)) {
      push("every research claim needs an id and a text");
    }
    if (!CLAIM_STATUSES.includes(claim.status)) {
      push(`claim ${claim.id} status must be sourced, qualified or gap`);
    }
    // An absent key reads as a forgotten field; an empty string is a declared
    // silence, as everywhere else in the briefs.
    if (typeof claim.uncertainty !== "string") {
      push(`claim ${claim.id} must declare its uncertainty (a string)`);
    }
    const cited = list(claim.sources);
    if (cited.length === 0) push(`claim ${claim.id} cites no source`);
    for (const id of cited) {
      if (!sourceIds.has(id))
        push(`claim ${claim.id} cites unknown source ${id}`);
    }
    if (
      claim.status === "sourced" &&
      !cited.some((id) =>
        list(research.sources).some(
          (source) => source.id === id && source.access === "read"
        )
      )
    ) {
      push(
        `claim ${claim.id} is marked sourced but no source was actually read`
      );
    }
  }
  for (const unknown of list(research?.unknowns)) {
    if (blank(unknown.id) || blank(unknown.text)) {
      push("every unknown needs an id and a text");
    }
  }
  const all = [...ids(claims), ...ids(research?.unknowns)];
  const seen = new Set();
  for (const id of all) {
    if (seen.has(id)) push(`research id ${id} is used twice`);
    seen.add(id);
  }
  return {
    refs: seen,
    gaps: new Set(claims.filter((c) => c.status === "gap").map((c) => c.id)),
  };
}

function arrangementErrors(where, arrangement, family, refs, push) {
  const steps = list(arrangement?.steps);
  if (steps.length === 0) return push(`${where} has no arrangement steps`);
  const covered = new Set();
  steps.forEach((step, index) => {
    if (blank(step.move) || blank(step.purpose)) {
      push(
        `${where} step ${index + 1} needs a move and a subject-specific purpose`
      );
    }
    if (list(step.functions).length === 0) {
      push(`${where} step ${index + 1} maps no function`);
    }
    for (const fn of list(step.functions)) {
      if (BLOCK_IDS.includes(fn)) covered.add(fn);
      else push(`${where} step ${index + 1} names unknown function ${fn}`);
    }
    for (const ref of list(step.claimRefs)) {
      if (!refs.has(ref))
        push(`${where} step ${index + 1} cites unknown reference ${ref}`);
    }
  });
  for (const omission of list(arrangement.omitted)) {
    if (!OMITTABLE.includes(omission.function)) {
      push(
        `${where} may not omit ${omission.function}: only ${OMITTABLE.join(", ")}`
      );
    } else if (blank(omission.reason)) {
      push(`${where} omits ${omission.function} without a reason`);
    }
    covered.add(omission.function);
  }
  for (const fn of BLOCK_IDS) {
    if (!covered.has(fn)) {
      push(
        `${where}: ${fn} appears neither in the arrangement nor in omitted with a reason`
      );
    }
  }
  orderErrors(
    where,
    steps.map((step) => list(step.functions)),
    push,
    "step"
  );
  if (family !== "name-investigation") {
    const adaptations = list(arrangement.adaptations);
    if (
      adaptations.length === 0 ||
      adaptations.some((a) => !BLOCK_IDS.includes(a.function) || blank(a.note))
    ) {
      push(
        `${where} (family ${family}) must explain how it adapts the name-specific functions (adaptations: function + note)`
      );
    }
  }
}

// B1 opens, B6 closes, and the answer (B5) is given before the closing.
function orderErrors(where, groups, push, unit) {
  const at = (fn) => groups.findIndex((functions) => functions.includes(fn));
  if (at("B1") > 0) push(`${where}: B1 must be in the first ${unit}`);
  const last = groups.length - 1;
  if (at("B6") !== last) push(`${where}: B6 must be in the last ${unit}`);
  if (at("B5") !== -1 && at("B6") !== -1 && at("B5") >= at("B6")) {
    push(`${where}: B5 must come before B6, the answer before the closing`);
  }
}

function proposalErrors(proposal, refs, push, { format, research }) {
  const where = `proposal ${proposal.id}`;
  if (blank(proposal.id)) push("a proposal has no id");
  if (!PATTERN_IDS.includes(proposal.patternId)) {
    push(`${where} names unknown pattern "${proposal.patternId}"`);
  }
  if (!FAMILIES.includes(proposal.family)) {
    push(`${where} has unknown family "${proposal.family}"`);
  }
  for (const field of ["question", "intention", "application", "rationale"]) {
    if (blank(proposal[field])) push(`${where} has no ${field}`);
  }
  if (list(proposal.claimRefs).length === 0)
    push(`${where} cites no claim or unknown`);
  for (const ref of list(proposal.claimRefs)) {
    if (!refs.has(ref)) push(`${where} cites unknown reference ${ref}`);
  }

  const takeaways = list(proposal.takeaways);
  if (takeaways.length === 0) push(`${where} has no takeaway`);
  for (const takeaway of takeaways) {
    if (blank(takeaway.id) || blank(takeaway.text))
      push(`${where} has an empty takeaway`);
  }
  const takeawayIds = new Set(ids(takeaways));

  const criteria = list(proposal.successCriteria);
  if (criteria.length === 0) push(`${where} has no success criterion`);
  const criterionTakeaways = new Set();
  for (const criterion of criteria) {
    const label = `success criterion ${criterion.id}`;
    if (blank(criterion.prompt) || criterion.prompt.trim().length < 15) {
      push(`${label} needs a concrete prompt for the viewer`);
    }
    if (blank(criterion.expected)) {
      push(`${label} needs an expected answer or limit (expected)`);
    }
    if (list(criterion.takeawayIds).length === 0)
      push(`${label} links no takeaway`);
    for (const id of list(criterion.takeawayIds)) {
      if (takeawayIds.has(id)) criterionTakeaways.add(id);
      else push(`${label} cites unknown takeaway ${id}`);
    }
    if (list(criterion.claimRefs).length === 0)
      push(`${label} links no claim or unknown`);
    for (const ref of list(criterion.claimRefs)) {
      if (!refs.has(ref)) push(`${label} cites unknown reference ${ref}`);
    }
  }
  for (const takeaway of takeaways) {
    if (!criterionTakeaways.has(takeaway.id)) {
      push(`takeaway ${takeaway.id} of ${where} has no success criterion`);
    }
  }

  const example = proposal.referenceExample;
  if (!["real", "hypothetical"].includes(example?.status)) {
    push(
      `${where} reference example status "${example?.status}" must be real or hypothetical`
    );
  } else if (blank(example.text)) {
    push(`${where} reference example has no text`);
  } else if (example.status === "real" && blank(example.locator)) {
    push(`${where}: a real reference example needs a locator`);
  }

  if (format === "carrousel") {
    carouselProposalErrors(proposal, research, push);
  } else if (
    !Number.isInteger(proposal.durationSeconds) ||
    proposal.durationSeconds <= 0
  ) {
    push(`${where} needs a durationSeconds`);
  } else if (
    proposal.durationSeconds > DEFAULT_TARGET_SECONDS &&
    blank(proposal.durationReason)
  ) {
    push(
      `${where} targets ${proposal.durationSeconds} s, over ${DEFAULT_TARGET_SECONDS} s: it needs a durationReason`
    );
  }
  arrangementErrors(where, proposal.arrangement, proposal.family, refs, push);
}

// The carousel's own promises: which route it is planned under (a series or a
// reading profile), how many cards that route allows, and that no time enters.
function carouselProposalErrors(proposal, research, push) {
  const where = `proposal ${proposal.id}`;
  for (const key of TIMING_KEYS) {
    if (key in proposal) {
      push(`${where} carries ${key}: a carousel design carries no timing`);
    }
  }
  if (blank(proposal.particularity)) push(`${where} has no particularity`);
  if (![null, "name-origin"].includes(proposal.series)) {
    push(
      `${where} must declare series: null (a social-only edition) or "name-origin"; memoires-sonores and lectures-afrique keep their own routes`
    );
  }
  const nameOrigin = proposal.series === "name-origin";
  const claims = list(research?.claims);
  let route = null;
  if (nameOrigin) {
    route = carouselRoute(proposal);
    if (proposal.profile !== null && proposal.profile !== undefined) {
      push(
        `${where}: the name-origin series keeps its legacy name carousel, with no reading profile`
      );
    }
    if (proposal.family !== "name-investigation") {
      push(
        `${where}: the name-origin series requires the name-investigation family`
      );
    }
    // The series never loses its myth by being planned here.
    if (!claims.some((claim) => claim.id === proposal.myth?.claimRef)) {
      push(
        `${where}: the name-origin series needs its attested myth (myth.claimRef, a research claim)`
      );
    }
  } else if (blank(proposal.profile)) {
    push(
      `${where} needs a reading profile (reading-story, reading-comparison or reading-listening)`
    );
  } else {
    const profile = readProfile(proposal.profile);
    if (!profile) {
      push(`${where} names unknown profile "${proposal.profile}"`);
    } else if (profile.kind === "own") {
      push(
        `${where}: ${profile.id} keeps its own contract and is not planned by narrative design`
      );
    } else {
      route = profile;
      const cited = list(proposal.claimRefs);
      if (
        profile.music &&
        !cited.some((id) => claims.find((c) => c.id === id)?.kind === "music")
      ) {
        push(
          `${where}: ${profile.id} needs a music claim, so the music review stays required`
        );
      }
    }
  }

  const count = proposal.cardCount;
  if (!Number.isInteger(count) || count <= 0) {
    push(`${where} needs an integer cardCount`);
  } else if (route && (count < route.min || count > route.max)) {
    push(
      `${where} cardCount ${count} is outside ${route.label}'s ${route.min}–${route.max}`
    );
  }
  if (blank(proposal.countReason)) {
    push(`${where} needs a countReason: why this many cards suffice`);
  }
  const steps = list(proposal.arrangement?.steps);
  if (Number.isInteger(count) && steps.length !== count) {
    push(
      `${where} has ${steps.length} cards in the preview but cardCount is ${count}`
    );
  }
  for (const [index, step] of steps.entries()) {
    const allowed = route?.compositions;
    if (step.composition === undefined || !allowed) continue;
    const fits =
      index === 0
        ? step.composition === "cover"
        : allowed.includes(step.composition);
    if (!fits) {
      push(
        `${where} preview card ${index + 1} names composition "${step.composition}", which ${route.label} does not offer there`
      );
    }
  }
}

function assessmentErrors(design, push) {
  const proposalIds = new Set(ids(design.proposals));
  const proposalPattern = new Map(
    list(design.proposals).map((p) => [p.id, p.patternId])
  );
  const assessed = new Map();
  for (const entry of list(design.patternAssessment)) {
    if (!PATTERN_IDS.includes(entry.patternId)) {
      push(`unknown pattern "${entry.patternId}" in the assessment`);
      continue;
    }
    if (assessed.has(entry.patternId)) {
      push(`pattern ${entry.patternId} is assessed twice`);
    }
    assessed.set(entry.patternId, entry);
    if (!DISPOSITIONS.includes(entry.disposition)) {
      push(
        `pattern ${entry.patternId} disposition must be ${DISPOSITIONS.join(", ")}`
      );
      continue;
    }
    if (entry.disposition !== "offered" && blank(entry.reason)) {
      push(
        `pattern ${entry.patternId} is ${entry.disposition} and needs a reason`
      );
    }
    if (entry.disposition === "offered" && list(entry.proposals).length === 0) {
      push(`pattern ${entry.patternId} is offered but lists no proposal`);
    }
    if (
      ["unsupported", "inapplicable"].includes(entry.disposition) &&
      list(entry.proposals).length
    ) {
      push(
        `pattern ${entry.patternId} is ${entry.disposition} yet lists a proposal`
      );
    }
    for (const id of list(entry.proposals)) {
      if (!proposalIds.has(id))
        push(`pattern ${entry.patternId} lists unknown proposal ${id}`);
      else if (proposalPattern.get(id) !== entry.patternId) {
        push(
          `pattern ${entry.patternId} lists proposal ${id}, which uses another pattern`
        );
      }
    }
  }
  for (const id of PATTERN_IDS) {
    if (!assessed.has(id)) push(`pattern ${id} is not assessed`);
  }
  for (const proposal of list(design.proposals)) {
    const entry = assessed.get(proposal.patternId);
    if (
      !entry ||
      !["offered", "conditional"].includes(entry.disposition) ||
      !list(entry.proposals).includes(proposal.id)
    ) {
      push(
        `proposal ${proposal.id} uses pattern ${proposal.patternId}, which is not offered or conditional with this proposal listed`
      );
    }
  }
}

function selectionErrors(design, push) {
  const selection = design.selection;
  if (!selection) {
    return push("no selection recorded (a recommendation is not a selection)");
  }
  if (!SELECTION_KINDS.includes(selection.kind)) {
    push(
      `selection kind "${selection.kind}" must be operator, delegated or synthetic`
    );
  }
  if (!ids(design.proposals).includes(selection.proposalId)) {
    push(`selection cites unknown proposal ${selection.proposalId}`);
  }
  if (blank(selection.statement))
    push("selection needs the operator's statement");
  if (blank(selection.locator)) push("selection needs a recoverable locator");
  if (!DATE.test(selection.date ?? ""))
    push("selection needs a date (YYYY-MM-DD)");
}

function outlineErrors(design, refs, gaps, push) {
  const outline = design.outline;
  const proposal = list(design.proposals).find(
    (p) => p.id === design.selection?.proposalId
  );
  if (!proposal) return;
  if (outline.proposalId !== proposal.id) {
    push(
      `outline is for ${outline.proposalId}, not for the selected proposal ${proposal.id}`
    );
  }
  const blocks = list(outline.blocks);
  if (blocks.length === 0) return push("outline has no block");
  const takeawayIds = new Set(ids(proposal.takeaways));
  const criterionIds = new Set(ids(proposal.successCriteria));
  const supportedTakeaways = new Set();
  const supportedCriteria = new Set();
  const covered = new Set(
    list(proposal.arrangement?.omitted).map((o) => o.function)
  );
  const contents = new Map();

  for (const block of blocks) {
    const where = `block ${block.id}`;
    if (!Number.isInteger(block.seconds) || block.seconds <= 0) {
      push(`${where} seconds must be a positive integer`);
    }
    for (const fn of list(block.functions)) {
      if (BLOCK_IDS.includes(fn)) covered.add(fn);
      else push(`${where} names unknown function ${fn}`);
    }
    if (list(block.functions).length === 0) push(`${where} maps no function`);
    if (blank(block.role)) push(`${where} has no role`);
    if (
      blank(block.content) ||
      block.content.trim().length < MIN_CONTENT_CHARS
    ) {
      push(
        `${where} content is too generic (needs subject material, ${MIN_CONTENT_CHARS}+ characters)`
      );
    } else if (block.content.trim() === block.role?.trim()) {
      push(`${where} content only repeats its role`);
    }
    const key = block.content?.trim();
    if (key && contents.has(key)) {
      push(`blocks ${contents.get(key)} and ${block.id} have the same content`);
    }
    contents.set(key, block.id);
    if (blank(block.evidence?.limits)) push(`${where} needs evidence.limits`);
    if (blank(block.transition)) push(`${where} needs a transition`);
    for (const ref of list(block.evidence?.claimRefs)) {
      if (!refs.has(ref)) push(`${where} cites unknown reference ${ref}`);
      else if (gaps.has(ref)) {
        push(
          `${where} cites ${ref} as evidence but ${ref} is a gap: resolve or qualify it before use`
        );
      }
    }
    for (const id of list(block.supports?.takeawayIds)) {
      if (takeawayIds.has(id)) supportedTakeaways.add(id);
      else push(`${where} supports unknown takeaway ${id}`);
    }
    for (const id of list(block.supports?.criterionIds)) {
      if (criterionIds.has(id)) supportedCriteria.add(id);
      else push(`${where} supports unknown criterion ${id}`);
    }
  }
  for (const fn of BLOCK_IDS) {
    if (!covered.has(fn))
      push(
        `outline: function ${fn} is in no block and not omitted by the proposal`
      );
  }
  orderErrors(
    "outline",
    blocks.map((b) => list(b.functions)),
    push,
    "block"
  );
  for (const id of takeawayIds) {
    if (!supportedTakeaways.has(id))
      push(`takeaway ${id} is supported by no block`);
  }
  for (const id of criterionIds) {
    if (!supportedCriteria.has(id))
      push(`criterion ${id} is supported by no block`);
  }

  const { totalSeconds } = timeline(outline);
  if (totalSeconds > DEFAULT_TARGET_SECONDS && blank(outline.durationReason)) {
    push(
      `outline totals ${totalSeconds} s, over ${DEFAULT_TARGET_SECONDS} s: it needs a durationReason`
    );
  }
  for (const field of ["patternFit", "orderLogic"]) {
    if (blank(outline.rationale?.[field]))
      push(`outline rationale needs ${field}`);
  }
  statementErrors(outline, criterionIds, "viewer", push);
}

// One filled statement per criterion, never a formula with an ellipsis.
function statementErrors(outline, criterionIds, audience, push) {
  const statements = new Map(
    list(outline.successStatements).map((s) => [s.criterionId, s])
  );
  for (const id of criterionIds) {
    const statement = statements.get(id)?.statement;
    if (blank(statement))
      push(`criterion ${id} has no ${audience} success statement`);
    else if (/…|\.\.\./.test(statement)) {
      push(`success statement for ${id} still holds a placeholder (ellipsis)`);
    }
  }
  for (const id of statements.keys()) {
    if (!criterionIds.has(id))
      push(`success statement for unknown criterion ${id}`);
  }
}

/**
 * The carousel's stage-5 table. Each card owes its own evidence, its own
 * qualification and its own source, because a reader can share one card without
 * its neighbours; nothing here is timed, since the reader sets the pace.
 */
function carouselOutlineErrors(design, refs, gaps, push) {
  const outline = design.outline;
  const proposal = list(design.proposals).find(
    (p) => p.id === design.selection?.proposalId
  );
  if (!proposal) return;
  if (outline.proposalId !== proposal.id) {
    push(
      `outline is for ${outline.proposalId}, not for the selected proposal ${proposal.id}`
    );
  }
  for (const key of TIMING_KEYS) {
    if (key in outline) {
      push(`outline carries ${key}: a carousel design carries no timing`);
    }
  }
  const cards = list(outline.cards);
  if (cards.length === 0) return push("outline has no card");

  const route = carouselRoute(proposal);
  if (route && (cards.length < route.min || cards.length > route.max)) {
    push(
      `outline has ${cards.length} cards, outside ${route.label}'s ${route.min}–${route.max}`
    );
  }
  if (blank(outline.countReason)) {
    push(
      "outline needs a countReason: why this many cards, each earning its place"
    );
  }
  if (!Array.isArray(outline.unresolved)) {
    push(
      "outline must declare what is unresolved (unresolved: an empty list is a declaration)"
    );
  }

  const claims = list(design.research?.claims);
  const takeawayIds = new Set(ids(proposal.takeaways));
  const criterionIds = new Set(ids(proposal.successCriteria));
  const supportedTakeaways = new Set();
  const supportedCriteria = new Set();
  const covered = new Set(
    list(proposal.arrangement?.omitted).map((o) => o.function)
  );
  const messages = new Map();
  const seenIds = new Set();

  for (const [index, card] of cards.entries()) {
    const where = `card ${card.id}`;
    if (blank(card.id) || seenIds.has(card.id)) {
      push(`${where} needs a unique id`);
    }
    seenIds.add(card.id);
    if ("seconds" in card) {
      push(`${where} carries seconds: a carousel design carries no timing`);
    }
    for (const fn of list(card.functions)) {
      if (BLOCK_IDS.includes(fn)) covered.add(fn);
      else push(`${where} names unknown function ${fn}`);
    }
    if (list(card.functions).length === 0) push(`${where} maps no function`);

    if (blank(card.heading)) push(`${where} has no heading`);
    if (!HEADING_KINDS.includes(card.headingKind)) {
      push(
        `${where} headingKind "${card.headingKind}" must be ${HEADING_KINDS.join(", ")}`
      );
    }
    if (blank(card.message) || card.message.trim().length < MIN_CONTENT_CHARS) {
      push(
        `${where} message is too generic (needs subject material, ${MIN_CONTENT_CHARS}+ characters)`
      );
    } else if (card.message.trim() === card.heading?.trim()) {
      push(`${where} message only repeats its heading`);
    }
    const key = card.message?.trim();
    if (key && messages.has(key)) {
      push(`cards ${messages.get(key)} and ${card.id} have the same message`);
    }
    messages.set(key, card.id);
    if (blank(card.evidence?.limits)) push(`${where} needs evidence.limits`);
    if (blank(card.qualification)) {
      push(`${where} needs a qualification the reader sees on the card itself`);
    }
    if (index > 0 && blank(card.sourceLine)) {
      push(`${where} needs a source line: every card after the cover owes one`);
    }
    if (blank(card.visualIntention)) push(`${where} needs a visualIntention`);
    if (blank(card.transition)) push(`${where} needs a transition`);
    for (const field of ["heading", "qualification", "sourceLine"]) {
      const leaked = String(card[field] ?? "").match(WORKSHOP_NOTATION);
      if (leaked) {
        push(
          `${where} ${field} prints workshop notation to the reader ("${leaked[0]}")`
        );
      }
    }

    const cited = list(card.evidence?.claimRefs);
    for (const ref of cited) {
      if (!refs.has(ref)) push(`${where} cites unknown reference ${ref}`);
      else if (gaps.has(ref)) {
        push(
          `${where} cites ${ref} as evidence but ${ref} is a gap: resolve or qualify it before use`
        );
      }
    }
    const citedClaims = cited
      .map((ref) => claims.find((c) => c.id === ref))
      .filter(Boolean);
    if (card.headingKind === "claim") {
      const qualified = citedClaims.filter(
        (c) => c.status !== "sourced" || !blank(c.uncertainty)
      );
      if (citedClaims.length === 0 || qualified.length) {
        push(
          `${where} has a flat factual heading over ${citedClaims.length === 0 ? "no claim" : `a qualified claim (${qualified.map((c) => c.id).join(", ")})`}: qualify the heading, or make it a question or a label`
        );
      }
    }

    compositionErrors(
      where,
      card,
      index,
      cards.length,
      route,
      citedClaims,
      push
    );

    for (const id of list(card.supports?.takeawayIds)) {
      if (takeawayIds.has(id)) supportedTakeaways.add(id);
      else push(`${where} supports unknown takeaway ${id}`);
    }
    for (const id of list(card.supports?.criterionIds)) {
      if (criterionIds.has(id)) supportedCriteria.add(id);
      else push(`${where} supports unknown criterion ${id}`);
    }
  }
  for (const fn of BLOCK_IDS) {
    if (!covered.has(fn)) {
      push(
        `outline: function ${fn} is in no card and not omitted by the proposal`
      );
    }
  }
  orderErrors(
    "outline",
    cards.map((card) => list(card.functions)),
    push,
    "card"
  );
  for (const id of takeawayIds) {
    if (!supportedTakeaways.has(id))
      push(`takeaway ${id} is supported by no card`);
  }
  for (const id of criterionIds) {
    if (!supportedCriteria.has(id))
      push(`criterion ${id} is supported by no card`);
  }
  for (const field of ["patternFit", "orderLogic"]) {
    if (blank(outline.rationale?.[field]))
      push(`outline rationale needs ${field}`);
  }
  statementErrors(outline, criterionIds, "reader", push);
}

// A composition is a slot contract of the renderer: the plan may only ask for
// one the profile offers, and for the data that composition cannot be drawn
// without. Whether the finished card fits is the renderer's own check.
function compositionErrors(
  where,
  card,
  index,
  total,
  route,
  citedClaims,
  push
) {
  const composition = card.composition;
  if (blank(composition)) return push(`${where} needs a composition`);
  if (route?.compositions) {
    if (index === 0 && composition !== "cover") {
      push(`${where}: the first card must be a cover`);
    } else if (index === total - 1 && composition !== "credits") {
      push(`${where}: the last card must be credits`);
    } else if (index > 0 && !route.compositions.includes(composition)) {
      push(
        `${where} composition "${composition}" is not in ${route.label}'s compositions (${route.compositions.join(", ")})`
      );
    }
  }
  const between = (value) =>
    Number.isInteger(value) && value >= 2 && value <= 4;
  if (composition === "timeline") {
    if (!between(card.datedEntries)) {
      push(`${where}: a timeline card needs 2–4 dated entries (datedEntries)`);
    }
    if (card.relation !== undefined && card.relation !== "chronologie") {
      push(`${where} relation must be "chronologie" on a timeline`);
    }
  } else if (composition === "comparison") {
    if (!between(card.pairs)) {
      push(`${where}: a comparison card needs 2–4 pairs (pairs)`);
    }
    // The name-derivation arrow claims one term became the other.
    if (card.relation !== "comparaison") {
      push(
        `${where}: a comparison card needs relation "comparaison", never a derivation arrow`
      );
    }
  } else if (card.relation !== undefined) {
    push(
      `${where} names a relation, which only timeline and comparison cards take`
    );
  }
  if (
    composition === "map" &&
    !citedClaims.some((c) => ["place", "route", "map"].includes(c.kind))
  ) {
    push(`${where}: a map card needs a place or route claim it can show`);
  }
}

function presentationErrors(design, push) {
  const shown = design.presentation ?? {};
  if (!shown.proposals)
    push("the proposals were never shown (presentation.proposals is missing)");
  else if (shown.proposals.digest !== proposalsDigest(design)) {
    push("the proposals changed since they were shown; show them again");
  }
  if (!design.outline) return push("no detailed outline");
  if (!shown.outline)
    push("the outline was never shown (presentation.outline is missing)");
  else if (shown.outline.digest !== outlineDigest(design)) {
    push("the outline changed since it was shown; show it again");
  }
  const chosenAt = design.selection?.date;
  if (shown.proposals?.at && chosenAt && chosenAt < shown.proposals.at) {
    push(
      `selection dated ${chosenAt} is before the proposals were shown (${shown.proposals.at})`
    );
  }
  if (shown.outline?.at && chosenAt && shown.outline.at < chosenAt) {
    push(
      `the outline was shown at ${shown.outline.at}, before the selection of ${chosenAt}`
    );
  }
}

// The handoff edition is a snapshot of the design, never a second copy edited
// on its own: what structure writes from must agree with what was shown.
function snapshotErrors(design, brief, refs, push) {
  const proposal = list(design.proposals).find(
    (p) => p.id === design.selection?.proposalId
  );
  const edition = brief.edition;
  if (!edition || !proposal) return;
  if (edition.angle?.question !== proposal.question) {
    push("edition question differs from the selected proposal's question");
  }
  if (edition.family !== proposal.family) {
    push(
      `edition family "${edition.family}" differs from the selected proposal's "${proposal.family}"`
    );
  }
  for (const claim of list(edition.claims)) {
    if (!refs.has(claim.id))
      push(`edition claim ${claim.id} is not in the design's research`);
  }
  for (const beat of list(brief.beats)) {
    for (const id of list(beat.claims)) {
      if (!refs.has(id))
        push(
          `beat ${beat.id} cites ${id}, which is not in the design's research`
        );
    }
  }
  const format = formatOf(design);
  if (edition.format !== format) {
    push(
      `edition format "${edition.format}" differs from the design's "${format}": a choice made for one format never approves the other`
    );
  }
  if (format === "carrousel") {
    carouselSnapshotErrors(design, brief, proposal, push);
  } else {
    const expected = list(design.outline?.blocks).map((b) => b.id);
    const actual = list(brief.videoSequence).map((s) => s.step);
    if (stable(expected) !== stable(actual)) {
      push(
        `videoSequence steps [${actual.join(", ")}] must be the outline blocks [${expected.join(", ")}]`
      );
    }
  }
  for (const id of list(proposal.claimRefs)) {
    const claim = list(design.research?.claims).find((c) => c.id === id);
    if (claim?.status === "gap") {
      push(
        `the selected proposal cites ${id} but ${id} is a gap: resolve or qualify it first`
      );
    }
  }
}

// What is specific to a carousel handoff: the card ids become carouselSequence,
// and the edition keeps the series and profile the operator chose. An existing
// series edition is never relabelled social-only, nor the reverse, to pass.
function carouselSnapshotErrors(design, brief, proposal, push) {
  const expected = list(design.outline?.cards).map((card) => card.id);
  const actual = list(brief.carouselSequence).map((s) => s.step);
  if (stable(expected) !== stable(actual)) {
    push(
      `carouselSequence steps [${actual.join(", ")}] must be the outline cards [${expected.join(", ")}]`
    );
  }
  const profile = proposal.profile ?? null;
  if ((brief.carouselProfile ?? null) !== profile) {
    push(
      `brief carouselProfile "${brief.carouselProfile ?? null}" differs from the selected proposal's "${profile}"`
    );
  }
  const series = proposal.series ?? null;
  if ((brief.edition.series ?? null) !== series) {
    push(
      `edition series "${brief.edition.series ?? null}" differs from the selected proposal's "${series}"`
    );
  }
  if (series === "name-origin" && !brief.edition.myth) {
    push(
      "the name-origin series needs edition.myth in the brief, so the myth review stays required"
    );
  }
}

/**
 * @param {object} design the brief's narrativeDesign
 * @param {{mode?: "draft"|"selected"|"handoff", brief?: object}} options
 *   draft: stages 1–3 (research, assessment, proposals). selected: adds the
 *   choice and, when present, the outline. handoff: everything, shown, and
 *   consistent with the brief's edition.
 */
export function validateDesign(design, { mode = "draft", brief } = {}) {
  if (design === undefined || design === null) {
    return { ok: false, errors: ["brief has no narrativeDesign"] };
  }
  if (design.version !== DESIGN_VERSION) {
    return {
      ok: false,
      errors: [
        `narrativeDesign version ${design.version} is unknown; expected ${DESIGN_VERSION}`,
      ],
    };
  }
  const format = formatOf(design);
  if (!DESIGN_FORMATS.includes(format)) {
    return {
      ok: false,
      errors: [
        `narrativeDesign format "${design.format}" is unknown; expected ${DESIGN_FORMATS.join(" or ")}`,
      ],
    };
  }
  const errors = [];
  const push = (message) => errors.push(message);
  if (blank(design.subject)) push("narrativeDesign has no subject");
  if (blank(design.scope)) push("narrativeDesign has no scope");

  const { refs, gaps } = researchErrors(design.research, push);
  if (list(design.proposals).length === 0)
    push("no proposal: the design offers nothing to choose");
  const seen = new Set();
  for (const proposal of list(design.proposals)) {
    if (seen.has(proposal.id)) push(`proposal id ${proposal.id} is used twice`);
    seen.add(proposal.id);
    proposalErrors(proposal, refs, push, { format, research: design.research });
  }
  assessmentErrors(design, push);
  const recommendation = design.recommendation;
  if (
    !recommendation ||
    blank(recommendation.reason) ||
    !seen.has(recommendation.proposalId)
  ) {
    push("design needs a recommendation: a known proposal id and a reason");
  }

  if (mode !== "draft") {
    selectionErrors(design, push);
    if (design.outline) {
      (format === "carrousel" ? carouselOutlineErrors : outlineErrors)(
        design,
        refs,
        gaps,
        push
      );
    }
  }
  if (mode === "handoff") {
    if (design.selection?.kind === "synthetic") {
      push("selection is synthetic: a synthetic choice never opens a handoff");
    }
    presentationErrors(design, push);
    if (brief) snapshotErrors(design, brief, refs, push);
  }
  return { ok: errors.length === 0, errors };
}

/**
 * Where a piece stands, so the coordinator resumes at the real missing step.
 * It reads the state and names the next act; it never writes a selection.
 */
export function resumeStep(brief) {
  const design = brief?.narrativeDesign;
  if (!design) {
    return brief?.edition
      ? {
          stage: "legacy",
          next: "no narrative-design intake is required; resume the missing visual or production work",
        }
      : {
          stage: "1-2",
          next: "frame the subject and research it (idee stages 1–2)",
        };
  }
  if (!design.research)
    return {
      stage: "1-2",
      next: "frame the subject and research it (idee stages 1–2)",
    };
  if (list(design.proposals).length === 0) {
    return {
      stage: "3",
      next: "examine the ten patterns and propose the suitable ones (idee stage 3)",
    };
  }
  const shown = design.presentation?.proposals;
  if (!shown)
    return {
      stage: "3-present",
      next: "show the proposals to the operator; nothing is chosen yet",
    };
  if (shown.digest !== proposalsDigest(design)) {
    return {
      stage: "3-refresh",
      next: "the evidence or proposals changed after they were shown: refresh them and show them again",
    };
  }
  if (!design.selection) {
    return {
      stage: "4",
      next: "wait for the operator's choice; do not write the recommended script",
    };
  }
  if (design.selection.kind === "synthetic") {
    return {
      stage: "4",
      next: "the selection is synthetic: a real operator choice is needed before development",
    };
  }
  if (!design.outline)
    return {
      stage: "5",
      next: "develop the chosen proposal into the detailed outline (idee stage 5)",
    };
  if (design.presentation?.outline?.digest !== outlineDigest(design)) {
    return {
      stage: "5-present",
      next: "show the detailed outline (again, if it changed) before any full writing",
    };
  }
  return {
    stage: "handoff",
    next: "structure may write the narration under the operator's authorised scope",
  };
}

const CLOSING_RULE = "gabarit-cloture";
const normalise = (text) => text.replaceAll("’", "'");

/**
 * The narration check of the narrative-design route. The legacy gabarit fixes
 * the scene list, the number of names and a two-explanation ceiling; here the
 * outline owns the argument, and what stays fixed is the series' own closing.
 */
export function verifierNarrationConcue(narration, { series } = {}) {
  const paragraphs = normalise(narration)
    .split(/\n\s*\n/)
    .map((p) => p.replace(/\s+/g, " ").trim())
    .filter(Boolean);
  if (series === "name-origin" && paragraphs.at(-1) !== CLOTURE_UNIQUE) {
    return [
      {
        paragraphe: paragraphs.length,
        regle: CLOSING_RULE,
        detail: `la dernière scène est la clôture unique, mot pour mot : « ${CLOTURE_UNIQUE} »`,
      },
    ];
  }
  return [];
}

const cell = (text) =>
  String(text ?? "")
    .replaceAll("|", "\\|")
    .replace(/\s+/g, " ")
    .trim();
const fnLabel = (functions) => list(functions).join("+");
const DISPOSITION_FR = {
  offered: "proposé",
  conditional: "conditionnel",
  unsupported: "preuves insuffisantes",
  inapplicable: "ne s'applique pas",
};
const ACCESS_FR = {
  read: "lue",
  indirect: "indirecte",
  unavailable: "non disponible",
};
const STATUS_FR = {
  sourced: "sourcée",
  qualified: "à qualifier",
  gap: "lacune",
};

function researchLine(design, ref) {
  const claim = list(design.research?.claims).find((c) => c.id === ref);
  if (claim) {
    const sources = claim.sources
      .map((id) => {
        const source = design.research.sources.find((s) => s.id === id);
        return `${id} ${ACCESS_FR[source?.access] ?? "?"}${source?.missing ? `, manque : ${source.missing.replace(/\.$/, "")}` : ""}`;
      })
      .join(" ; ");
    return `- ${ref} (${STATUS_FR[claim.status]}) ${claim.text} Sources : ${sources}.${claim.uncertainty ? ` Incertitude : ${claim.uncertainty}` : ""}`;
  }
  const unknown = list(design.research?.unknowns).find((u) => u.id === ref);
  return `- ${ref} (inconnu) ${unknown?.text ?? ""}`;
}

function arrangementLine(arrangement) {
  const steps = list(arrangement.steps).map(
    (step) => `${fnLabel(step.functions)} ${step.move}`
  );
  const omitted = list(arrangement.omitted).map(
    (o) => `${o.function} omis (${o.reason})`
  );
  const adapted = list(arrangement.adaptations).map(
    (a) => `${a.function} adapté (${a.note})`
  );
  return [steps.join(" → "), ...omitted, ...adapted].join(" ; ");
}

const routeLine = (proposal) => {
  const route = carouselRoute(proposal);
  const range = route ? `, plage ${route.min}–${route.max}` : "";
  const where =
    proposal.series === "name-origin"
      ? `série name-origin, parcours historique du carrousel des noms (mythe : ${proposal.myth?.claimRef})`
      : `${proposal.profile}, édition sociale hors série`;
  return `${where}, ${proposal.cardCount} cartes envisagées${range}. ${proposal.countReason} Une faisabilité de brouillon : aucun rendu n'a été validé.`;
};

const cardPreviewLine = (arrangement) => {
  const cards = list(arrangement.steps).map(
    (step, i) => `${i + 1} ${fnLabel(step.functions)} ${step.move}`
  );
  const omitted = list(arrangement.omitted).map(
    (o) => `${o.function} omis (${o.reason})`
  );
  const adapted = list(arrangement.adaptations).map(
    (a) => `${a.function} adapté (${a.note})`
  );
  return [cards.join(" → "), ...omitted, ...adapted].join(" ; ");
};

// Stage 3 for a carousel: the same five named fields, then what a carousel
// adds — a card preview, the profile and count, and what this pattern stresses.
function renderCarouselProposals(design) {
  const out = [
    `# Propositions de lecture : ${design.subject}`,
    "",
    design.scope,
    "",
  ];
  for (const proposal of design.proposals) {
    const pattern = PATTERNS.find((p) => p.id === proposal.patternId);
    const entry = design.patternAssessment.find(
      (a) => a.patternId === proposal.patternId
    );
    const recommended = design.recommendation?.proposalId === proposal.id;
    out.push(
      `## ${proposal.id} · ${pattern.labelFr}${recommended ? " · recommandée" : ""}`,
      "",
      `**Question** ${proposal.question} ${proposal.intention}`,
      "",
      `**Trame** ${pattern.labelFr} : ${pattern.moves.join(" → ")}.`,
      "",
      `**Application au sujet** ${proposal.application}`,
      "",
      "**Recherche** (état des sources et incertitudes)",
      ...proposal.claimRefs.map((ref) => researchLine(design, ref)),
      "",
      "**Acquis**",
      ...proposal.takeaways.map((t) => `- ${t.text}`),
      "",
      "**Critère de réussite**",
      ...proposal.successCriteria.flatMap((c) => [
        `- ${c.prompt}`,
        `  Réponse ou limite attendue : ${c.expected}`,
      ]),
      "",
      `**Exemple de référence** ${proposal.referenceExample.status === "real" ? `réel (${proposal.referenceExample.locator})` : "hypothétique, pas un carrousel publié"} : ${proposal.referenceExample.text}`,
      "",
      `**Agencement** ${cardPreviewLine(proposal.arrangement)}`,
      "",
      `**Profil et nombre** ${routeLine(proposal)}`,
      "",
      `**Particularité** ${proposal.particularity}`,
      "",
      `**Statut** ${DISPOSITION_FR[entry.disposition]}${entry.reason ? ` — ${entry.reason}` : ""} ${proposal.rationale}`,
      ""
    );
  }
  if (design.recommendation) {
    out.push(
      "**Recommandation**",
      `${design.recommendation.proposalId} : ${design.recommendation.reason} Une recommandation n'est pas le choix : rien n'est retenu tant que vous ne choisissez pas.`,
      ""
    );
  }
  out.push(...coverageTable(design));
  return out.join("\n");
}

function coverageTable(design) {
  return [
    "## Les dix trames examinées",
    "",
    "| Trame | Disposition | Raison ou carte |",
    "| --- | --- | --- |",
    ...PATTERNS.map((pattern) => {
      const entry = design.patternAssessment.find(
        (a) => a.patternId === pattern.id
      );
      const detail = entry.reason ?? `carte ${entry.proposals.join(", ")}`;
      const cards =
        entry.reason && list(entry.proposals).length
          ? ` (carte ${entry.proposals.join(", ")})`
          : "";
      return `| ${pattern.id} · ${pattern.labelFr} | ${DISPOSITION_FR[entry.disposition]} | ${cell(detail)}${cards} |`;
    }),
    "",
  ];
}

/** Stage 3 as the operator reads it: one card per proposal, then the coverage. */
export function renderProposals(design) {
  if (formatOf(design) === "carrousel") return renderCarouselProposals(design);
  const out = [
    `# Propositions de narration : ${design.subject}`,
    "",
    design.scope,
    "",
  ];
  for (const proposal of design.proposals) {
    const pattern = PATTERNS.find((p) => p.id === proposal.patternId);
    const recommended = design.recommendation?.proposalId === proposal.id;
    out.push(
      `## ${proposal.id} · ${pattern.labelFr}${recommended ? " · recommandée" : ""}`,
      "",
      `**Question** ${proposal.question} ${proposal.intention}`,
      "",
      `**Trame** ${pattern.labelFr} : ${pattern.moves.join(" → ")}.`,
      "",
      `**Application au sujet** ${proposal.application}`,
      "",
      "**Acquis**",
      ...proposal.takeaways.map((t) => `- ${t.text}`),
      "",
      "**Critère de réussite**",
      ...proposal.successCriteria.flatMap((c) => [
        `- ${c.prompt}`,
        `  Réponse ou limite attendue : ${c.expected}`,
      ]),
      "",
      "**Recherche** (état des sources et incertitudes)",
      ...proposal.claimRefs.map((ref) => researchLine(design, ref)),
      "",
      `**Exemple de référence** ${proposal.referenceExample.status === "real" ? `réel (${proposal.referenceExample.locator})` : "hypothétique, pas un épisode publié"} : ${proposal.referenceExample.text}`,
      "",
      `**Arrangement** ${arrangementLine(proposal.arrangement)}`,
      "",
      `**Durée** environ ${clock(proposal.durationSeconds)}${proposal.durationReason ? ` (${proposal.durationReason})` : ""}.`,
      "",
      `**Pourquoi la choisir** ${proposal.rationale}`,
      ""
    );
  }
  if (design.recommendation) {
    out.push(
      "**Recommandation**",
      `${design.recommendation.proposalId} : ${design.recommendation.reason} Une recommandation n'est pas le choix : rien n'est retenu tant que vous ne choisissez pas.`,
      ""
    );
  }
  out.push(
    "## Les dix trames examinées",
    "",
    "| Trame | Disposition | Raison ou carte |",
    "| --- | --- | --- |",
    ...PATTERNS.map((pattern) => {
      const entry = design.patternAssessment.find(
        (a) => a.patternId === pattern.id
      );
      const detail = entry.reason ?? `carte ${entry.proposals.join(", ")}`;
      const cards =
        entry.reason && list(entry.proposals).length
          ? ` (carte ${entry.proposals.join(", ")})`
          : "";
      return `| ${pattern.id} · ${pattern.labelFr} | ${DISPOSITION_FR[entry.disposition]} | ${cell(detail)}${cards} |`;
    }),
    ""
  );
  return out.join("\n");
}

const SELECTION_FR = {
  operator: "choix de l'opérateur",
  delegated: "choix délégué par l'opérateur",
  synthetic: "démonstration, pas une décision de l'opérateur",
};

function renderCarouselPlan(design) {
  const proposal = design.proposals.find(
    (p) => p.id === design.selection.proposalId
  );
  const pattern = PATTERNS.find((p) => p.id === proposal.patternId);
  const route = carouselRoute(proposal);
  const cards = design.outline.cards;
  const takeaway = (id) =>
    proposal.takeaways.find((t) => t.id === id)?.text ?? id;
  const unresolved = list(design.outline.unresolved);
  return [
    `# Plan de lecture détaillé : ${design.subject}, proposition ${proposal.id}`,
    "",
    `Trame : ${pattern.labelFr}. Question : ${proposal.question}`,
    `Choix : ${SELECTION_FR[design.selection.kind]} — ${design.selection.statement}`,
    "",
    "| Carte | Fonctions | Titre de travail | Message | Preuves et limites | Qualification et source sur la carte | Composition et intention visuelle | Transition | Acquis / critère |",
    "| --- | --- | --- | --- | --- | --- | --- | --- | --- |",
    ...cards.map((card) => {
      const refs = list(card.evidence.claimRefs).join(", ");
      const supports = [
        ...list(card.supports.takeawayIds).map(takeaway),
        ...list(card.supports.criterionIds).map((id) => `critère ${id}`),
      ].join(" ; ");
      const source = card.sourceLine ? ` Source : ${card.sourceLine}.` : "";
      return `| ${card.id} | ${fnLabel(card.functions)} | ${cell(card.heading)} | ${cell(card.message)} | ${cell(`${refs ? `${refs} — ` : ""}${card.evidence.limits}`)} | ${cell(`${card.qualification}${source}`)} | ${cell(`${card.composition} : ${card.visualIntention}`)} | ${cell(card.transition)} | ${cell(supports)} |`;
    }),
    "",
    `**${cards.length} cartes** (profil ${route?.label}, plage ${route?.min}–${route?.max}). ${design.outline.countReason} Les six fonctions ne sont pas six cartes : une carte peut en porter plusieurs, une fonction peut en occuper plusieurs.`,
    "",
    "## Pourquoi cette trame",
    design.outline.rationale.patternFit,
    "",
    "## Pourquoi cet ordre",
    design.outline.rationale.orderLogic,
    "",
    "## Ce que le lecteur doit pouvoir dire",
    ...design.outline.successStatements.map(
      (s) => `- (${s.criterionId}) ${s.statement}`
    ),
    "",
    "## Reste à établir avant l'écriture",
    ...(unresolved.length
      ? unresolved.map((item) => `- ${item}`)
      : ["- Rien de bloquant n'est déclaré."]),
    "",
    "Ce plan n'est pas le texte des cartes : `structure` l'écrit ensuite, avec la légende, et vous le montre pour approbation avant tout rendu. Il ne dit rien du confort de lecture sur téléphone : la typographie et le cadrage restent jugés par le moteur de rendu.",
    "",
  ].join("\n");
}

/** Stage 5: only the selected proposal gets the detailed table. */
export function renderPlan(design) {
  if (formatOf(design) === "carrousel") return renderCarouselPlan(design);
  const proposal = design.proposals.find(
    (p) => p.id === design.selection.proposalId
  );
  const pattern = PATTERNS.find((p) => p.id === proposal.patternId);
  const { blocks, totalSeconds } = timeline(design.outline);
  const takeaway = (id) =>
    proposal.takeaways.find((t) => t.id === id)?.text ?? id;
  const out = [
    `# Plan détaillé : ${design.subject}, proposition ${proposal.id}`,
    "",
    `Trame : ${pattern.labelFr}. Question : ${proposal.question}`,
    `Choix : ${SELECTION_FR[design.selection.kind]} — ${design.selection.statement}`,
    "",
    "| Temps | Fonctions | Rôle propre à la trame | Contenu | Preuves et limites | Transition | Acquis / critère |",
    "| --- | --- | --- | --- | --- | --- | --- |",
    ...blocks.map((block) => {
      const refs = list(block.evidence.claimRefs).join(", ");
      const supports = [
        ...list(block.supports.takeawayIds).map(takeaway),
        ...list(block.supports.criterionIds).map((id) => `critère ${id}`),
      ].join(" ; ");
      return `| ${clock(block.start)}–${clock(block.end)} | ${fnLabel(block.functions)} | ${cell(block.role)} | ${cell(block.content)} | ${cell(`${refs ? `${refs} — ` : ""}${block.evidence.limits}`)} | ${cell(block.transition)} | ${cell(supports)} |`;
    }),
    "",
    `Durée totale estimée : ${clock(totalSeconds)}${design.outline.durationReason ? ` (${design.outline.durationReason})` : ""}. Ces durées sont indicatives, pas des minutages de voix.`,
    "",
    "## Pourquoi cette trame",
    design.outline.rationale.patternFit,
    "",
    "## Pourquoi cet ordre",
    design.outline.rationale.orderLogic,
    "",
    "## Ce que le spectateur doit pouvoir dire",
    ...design.outline.successStatements.map(
      (s) => `- (${s.criterionId}) ${s.statement}`
    ),
    "",
  ];
  return out.join("\n");
}

/** The reference file of the idee skill: this authority, rendered. */
export function renderCatalogue() {
  const out = [
    "# Narrative pattern catalogue",
    "",
    "Generated by `node social/tools/narration/check-narrative-design.mjs --catalogue`. Do not edit by hand: the authority is `social/tools/narration/narrative-design.mjs`, and a test holds this file equal to that output.",
    "",
    "Ten patterns are examined for every subject. There is no quota of proposals: a pattern the evidence cannot carry is reported with its reason. A proposal chooses one main pattern; a secondary device (an anecdotal opening) is described in its arrangement, not combined into a new pattern. The six families classify the investigation, the patterns say how the argument unfolds, and the visual profile is a separate rendering choice. Reels and carousels share these ten ids: each pattern also lists how it reads as a carousel, where a reader controls the pace and a card can be shared alone. A carousel proposal is planned under an existing reading profile (or the name-origin series' own template) and sets no duration.",
    "",
    "## Patterns",
    "",
  ];
  for (const pattern of PATTERNS) {
    out.push(
      `### \`${pattern.id}\` — ${pattern.labelFr}`,
      "",
      `- Question : ${pattern.question}`,
      "- Ordered moves :",
      ...pattern.moves.map((move, i) => `  ${i + 1}. ${move}`),
      `- Typical families : ${pattern.families.length ? pattern.families.join(", ") : "determined by the broader question or the claim"}`,
      `- Success demonstration : ${pattern.success}`,
      `- Carousel arrangement : ${CAROUSEL_READING[pattern.id].arrangement}`,
      `- Reader success (carousel) : ${CAROUSEL_READING[pattern.id].success}`,
      ""
    );
  }
  out.push(
    "## The six common functions",
    "",
    "Every proposal accounts for B1–B6. They may be merged, repeated or interleaved with an explanation; they are not six mandatory shots. B1 opens, B5 answers before B6 closes. Only B2–B4 may be omitted, with a reason. A proposal outside the `name-investigation` family states how it adapts the name-specific wording.",
    "",
    ...paddedTable(
      ["ID", "Operator-facing block", "Function", "Question to resolve"],
      BLOCKS.map((b) => [b.id, b.labelFr, b.function, b.question])
    ),
    ""
  );
  return out.join("\n");
}

// Padded the way prettier pads a Markdown table, so the committed reference
// file is both a verbatim render and format-clean.
function paddedTable(header, rows) {
  const widths = header.map((title, i) =>
    Math.max(3, title.length, ...rows.map((row) => row[i].length))
  );
  const line = (cells) =>
    `| ${cells.map((c, i) => c.padEnd(widths[i])).join(" | ")} |`;
  return [
    line(header),
    `| ${widths.map((w) => "-".repeat(w)).join(" | ")} |`,
    ...rows.map(line),
  ];
}
