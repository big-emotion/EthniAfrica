/**
 * How readers really type: « les krus », « d’où vient le nom peul ? »,
 * « mandja egypte ». The corpus holds names, so everything around the name is
 * removed before matching — and never rewritten into the name itself.
 *
 * The output is a list of candidates, tried in order until one finds
 * something, so a wrong guess costs a query and never an answer:
 *
 * 1. the name with its frame, punctuation and leading article removed;
 * 2. that name without a trailing plural « s » — an *additional* candidate,
 *    because « Bassa » and « Gambas » end in a letter that is not a plural;
 * 3. the query as typed, minus frame and punctuation, for the few names that
 *    carry their article;
 * 4. for a single word, the same name respelt the way French writes it — an
 *    m before b and p (« diawanbe » → « diawambe »), a y between consonants
 *    (« pigmee » → « pygmee »). Last, because it is no longer what the reader
 *    typed, and every typed form is tried before one that is not.
 *
 * `tokens` are the words of a multi-name query, for widening it once every
 * candidate has found nothing. A single word has none. A country filed under
 * several words stays one token: « n'daho cote d'ivoire » asks about two
 * names, not about « cote » and « ivoire ».
 *
 * French only: the frames below are the ones the September log contains.
 * Adding a frame is a test first, a line here second.
 */
import { normalizeString } from "@/lib/normalize";

export interface NormalisedSearchQuery {
  /** As typed. Kept for display and for the query log. */
  raw: string;
  candidates: string[];
  tokens: string[];
}

const ELISION = /[’‘ʼ`´]/g;

// Longest alternatives first: the regex takes the first that matches.
const QUESTION_FRAME =
  /^(?:d'o[uù]\s+(?:vient|viennent|provient|proviennent)|d'o[uù]\s+vient\s+le\s+nom|que\s+(?:veut\s+dire|signifie)|qu'est-ce\s+que|c'est\s+quoi|qui\s+a\s+(?:créé|cree|inventé|invente|nommé|nomme|fondé|fonde)|quelle\s+est\s+l'origine)\s*/;

const LEADING_NAME_WORD = /^(?:nom|noms)\s+/;
// A spelled article needs a space after it (« lesotho » keeps its « le »); an
// elided one is closed by its apostrophe.
const LEADING_ARTICLE =
  /^(?:(?:de\s+la|de\s+l'|du|des|les|le|la|un|une)\s+|l'|d')/;
const EDGE_PUNCTUATION = /^[\s"«»“”?!.,;:]+|[\s"«»“”?!.,;:]+$/g;

const CONNECTING_WORDS = new Set([
  "de",
  "du",
  "des",
  "d",
  "la",
  "le",
  "les",
  "l",
  "et",
  "en",
  "au",
  "aux",
  "un",
  "une",
]);

function fold(raw: string): string {
  return raw
    .normalize("NFC")
    .replace(ELISION, "'")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(EDGE_PUNCTUATION, "");
}

function withoutFrame(text: string): string {
  const framed = text.replace(QUESTION_FRAME, "");
  if (framed === text) return text;
  return framed
    .replace(LEADING_ARTICLE, "")
    .replace(LEADING_NAME_WORD, "")
    .replace(LEADING_ARTICLE, "")
    .replace(/^de\s+/, "");
}

function singularOf(text: string): string | undefined {
  return text.length > 3 && text.endsWith("s") && !text.endsWith("ss")
    ? text.slice(0, -1)
    : undefined;
}

// Readers write a name as they hear it. These two are the confusions measured
// in the October log whose correct spelling French orthography fixes, so the
// respelling is a rule and not a guess at a typo — a typo stays a near name.
const N_BEFORE_LABIAL = /n(?=[bp])/g;
const I_BETWEEN_CONSONANTS =
  /(?<=[bcdfghjklmnpqrstvwxz])i(?=[bcdfghjklmnpqrstvwxz])/g;

function respeltOf(name: string): string | undefined {
  if (name.includes(" ")) return undefined;
  const respelt = name
    .replace(N_BEFORE_LABIAL, "m")
    .replace(I_BETWEEN_CONSONANTS, "y");
  return respelt === name ? undefined : respelt;
}

/**
 * Countries the corpus files under several words, accent-folded. Hyphenated
 * names (« Guinée-Bissau ») are one word already and need no entry. The suite
 * holds every entry to a `nameFr` in `dataset/source/afrik/pays`.
 */
// @req REQ-002
export const MULTI_WORD_COUNTRY_NAMES = [
  "afrique du sud",
  "burkina faso",
  "cabo verde",
  "cote d'ivoire",
  "guinee equatoriale",
  "republique centrafricaine",
  "republique democratique du congo",
  "sierra leone",
  "soudan du sud",
];

const COUNTRY_WORDS = MULTI_WORD_COUNTRY_NAMES.map((name) => name.split(" "));

function countryAt(words: string[], start: number): number {
  const folded = words.map((word) => normalizeString(word));
  const match = COUNTRY_WORDS.find((country) =>
    country.every((word, offset) => folded[start + offset] === word)
  );
  return match?.length ?? 0;
}

function tokensOf(name: string): string[] {
  const words = name.split(" ");
  const tokens: string[] = [];
  for (let index = 0; index < words.length;) {
    const countryLength = countryAt(words, index);
    if (countryLength > 0) {
      tokens.push(words.slice(index, index + countryLength).join(" "));
      index += countryLength;
      continue;
    }
    const word = words[index].replace(/^(?:d|l)'/, "");
    if (word.length >= 2 && !CONNECTING_WORDS.has(word)) tokens.push(word);
    index += 1;
  }
  return tokens;
}

// @req REQ-178
export function normaliseSearchQuery(raw: string): NormalisedSearchQuery {
  const cleaned = fold(raw);
  if (!cleaned) return { raw, candidates: [], tokens: [] };

  const framed = fold(withoutFrame(cleaned)) || cleaned;
  const stripped = fold(framed.replace(LEADING_ARTICLE, "")) || framed;
  const singular = singularOf(stripped);

  const candidates = [
    ...new Set(
      [
        stripped,
        singular,
        framed,
        respeltOf(stripped),
        singular && respeltOf(singular),
      ].filter((candidate): candidate is string => Boolean(candidate))
    ),
  ];

  const tokens = tokensOf(stripped);

  return { raw, candidates, tokens: tokens.length >= 2 ? tokens : [] };
}
