/**
 * Lists the etymology fields that state a name's origin as fact (ETNI-2009).
 *
 * Doctrine §1.1: every origin is a hypothesis and the site never affirms. A
 * sentence breaks that rule when it carries an origin verb in the indicative
 * (« vient de », « dérive de », « signifie »…) with neither a conditional
 * (« viendrait ») nor an attribution (« selon », « d'après », « hypothèse »…)
 * anywhere in the same sentence. The sentence is the unit on purpose: a
 * conditional framing (« Le nom viendrait de X, qui signifie Y ») keeps a
 * lexical gloss inside it honest, and an attribution two sentences away does
 * not cover the claim a reader meets on its own.
 *
 * It is a heuristic for review, not a parser of French: an adverb such as
 * « probablement » is deliberately not enough, because the register asks for
 * the conditional. Quotations in « » are skipped: they are a source's words,
 * kept verbatim and attributed.
 *
 * Usage: npx tsx scripts/afrik/findAssertiveEtymologies.ts [datasetRoot]
 */
import { readCorpusFiches } from "./sourceTierRulings";

const DEFAULT_DATASET_ROOT = "dataset/source/afrik";

/** The two fields ETNI-2009 covers, by the folder their fiches live in. */
const ETYMOLOGY_FIELDS: { folder: string; field: string }[] = [
  { folder: "peuples/", field: "content.appellations.originOfExonyms" },
  { folder: "pays/", field: "etymology" },
];

// JavaScript's \b only knows ASCII letters, even under the u flag, so a word
// ending in « é » (« dérivé », « rapporté ») never met it. These two
// letter-aware boundaries stand in for it in both patterns.
const START = String.raw`(?<!\p{L})`;
const END = String.raw`(?!\p{L})`;

function words(alternatives: string[]): RegExp {
  return new RegExp(
    alternatives
      .map((pattern) => pattern.replace(/^\\b/, START).replace(/\\b$/, END))
      .join("|"),
    "iu"
  );
}

// Accents are optional throughout: older fiches were written without them.
const ORIGIN_STATED = words([
  String.raw`\bvien(?:t|nent)\b`,
  String.raw`\bvenant d`,
  String.raw`\bprovien(?:t|nent)\b`,
  String.raw`\bprovenant d`,
  String.raw`\bd[ée]riv(?:e|ent|[ée]e?s?)\b`,
  String.raw`\bsignifi(?:e|ent|ant)\b`,
  String.raw`\bveu(?:t|lent) dire\b`,
  String.raw`\bvoulant dire\b`,
  String.raw`\bse tradui(?:t|sent)\b`,
  // « issus de » alone also tells where a group comes from, not a name.
  String.raw`\b(?:est|sont) issue?s? d`,
  String.raw`\btir(?:e|ent) (?:son|leur) nom\b`,
  String.raw`\btir[ée]e?s? d`,
  String.raw`\b(?:trouve|tire|a)n?t? (?:son|leur|pour) origine\b`,
]);

// The conditional endings of the verbs these fields use (serait, viendrait,
// pourrait, signifierait…), anchored so that « portrait » or « extrait » do
// not pass for one.
const HEDGED = words([
  String.raw`\b\p{L}*(?:erai|irai|drai|rrai|aurai)(?:t|ent)\b`,
  String.raw`\bselon\b`,
  String.raw`\bd'apr[èe]s\b`,
  String.raw`\bhypoth[èe]se`,
  String.raw`\bpropos(?:e|ent|ée?s?|ait)\b`,
  String.raw`\brapport(?:e|ent|ée?s?|ait)\b`,
  String.raw`\bexplication`,
  String.raw`\binterpr[ée]tation`,
  String.raw`\bth[ée]orie`,
]);

const QUOTATION = /«[^»]*»/g;

export function findAssertiveSentences(text: string): string[] {
  return text.split(/(?<=[.!?])\s+(?=[\p{Lu}«"'])/u).filter((sentence) => {
    const ownWords = sentence.replace(QUOTATION, "«»");
    return ORIGIN_STATED.test(ownWords) && !HEDGED.test(ownWords);
  });
}

export interface AssertiveEtymology {
  /** Path of the fiche, relative to the dataset root. */
  fiche: string;
  field: string;
  text: string;
  sentences: string[];
}

function readField(json: unknown, field: string): unknown {
  return field
    .split(".")
    .reduce<unknown>(
      (node, key) =>
        node && typeof node === "object"
          ? (node as Record<string, unknown>)[key]
          : undefined,
      json
    );
}

export function findAssertiveEtymologies(
  datasetRoot: string
): AssertiveEtymology[] {
  const found: AssertiveEtymology[] = [];
  for (const fiche of readCorpusFiches(datasetRoot)) {
    for (const { folder, field } of ETYMOLOGY_FIELDS) {
      if (!fiche.path.startsWith(folder)) continue;
      const text = readField(fiche.json, field);
      if (typeof text !== "string") continue;
      const sentences = findAssertiveSentences(text);
      if (sentences.length > 0) {
        found.push({ fiche: fiche.path, field, text, sentences });
      }
    }
  }
  return found.sort((a, b) => a.fiche.localeCompare(b.fiche));
}

function main(): void {
  const datasetRoot = process.argv[2] ?? DEFAULT_DATASET_ROOT;
  const found = findAssertiveEtymologies(datasetRoot);
  for (const { fiche, sentences } of found) {
    for (const sentence of sentences) console.log(`${fiche}\t${sentence}`);
  }
  console.log(`${found.length} etymology fields state an origin as fact`);
}

if (
  process.argv[1] &&
  process.argv[1].endsWith("findAssertiveEtymologies.ts")
) {
  main();
}
