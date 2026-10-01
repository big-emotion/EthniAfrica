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
 *    carry their article.
 *
 * `tokens` are the words of a multi-name query, for widening it once every
 * candidate has found nothing. A single word has none.
 *
 * French only: the frames below are the ones the September log contains.
 * Adding a frame is a test first, a line here second.
 */
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

// @req REQ-178
export function normaliseSearchQuery(raw: string): NormalisedSearchQuery {
  const cleaned = fold(raw);
  if (!cleaned) return { raw, candidates: [], tokens: [] };

  const framed = fold(withoutFrame(cleaned)) || cleaned;
  const stripped = fold(framed.replace(LEADING_ARTICLE, "")) || framed;

  const candidates = [
    ...new Set(
      [stripped, singularOf(stripped), framed].filter(
        (candidate): candidate is string => Boolean(candidate)
      )
    ),
  ];

  const tokens = stripped
    .split(" ")
    .map((word) => word.replace(/^(?:d|l)'/, ""))
    .filter((word) => word.length >= 2 && !CONNECTING_WORDS.has(word));

  return { raw, candidates, tokens: tokens.length >= 2 ? tokens : [] };
}
