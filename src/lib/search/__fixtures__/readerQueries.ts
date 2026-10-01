/**
 * Queries readers typed on /atlas/recherche, taken from search_query_log
 * (2026-09-01..29), with what each must reach on the corpus of the repository.
 * Spellings are the readers', mistakes included; the curly apostrophe of
 * « d’où vient » is the one phones type.
 *
 * `outcome` is the tier reached, in the order the page prefers:
 * - `hit`       an entry answers to the (cleaned) name;
 * - `widened`   no entry answers to the name, but entries mention it or answer
 *               to one of several names — results without a subject;
 * - `neighbour` nothing answers, but a near name is offered as a neighbour;
 * - `none`      the honest empty state.
 *
 * `answered` marks a query the reviewed name answers (nameAnswers/data) cover.
 */
export type ReaderOutcome = "hit" | "widened" | "neighbour" | "none";

export interface ReaderQuery {
  typed: string;
  problem: string;
  outcome: ReaderOutcome;
  answered?: true;
}

// @req REQ-178
export const OUTCOME_RANK: Record<ReaderOutcome, number> = {
  hit: 3,
  widened: 2,
  neighbour: 1,
  none: 0,
};

// @req REQ-178
export const READER_QUERIES: ReaderQuery[] = [
  // Leading articles and plural
  { typed: "les krus", problem: "article + plural", outcome: "hit" },
  {
    typed: "les siamou",
    problem: "article; the name is not in the corpus",
    outcome: "neighbour",
  },
  { typed: "les peuls", problem: "article + plural", outcome: "hit" },
  { typed: "les hausas", problem: "article + plural", outcome: "hit" },
  { typed: "les dogons", problem: "article + plural", outcome: "hit" },
  {
    typed: "les bassa",
    problem: "article, several entries answer",
    outcome: "hit",
  },
  { typed: "l'egypte", problem: "elided article, unaccented", outcome: "hit" },
  {
    typed: "du mali",
    problem: "partitive article",
    outcome: "hit",
    answered: true,
  },
  { typed: "le bambara", problem: "article", outcome: "hit", answered: true },

  // Spelling of a word the corpus files under another spelling
  {
    typed: "pigmée",
    problem: "variant spelling of Pygmée",
    outcome: "widened",
    answered: true,
  },
  {
    typed: "pigmee",
    problem: "variant spelling, unaccented",
    outcome: "widened",
    answered: true,
  },
  {
    typed: "pigme",
    problem: "variant spelling, truncated",
    outcome: "widened",
    answered: true,
  },
  {
    typed: "pygme",
    problem: "truncated form the corpus already holds",
    outcome: "hit",
    answered: true,
  },

  // Typos
  { typed: "fulbr", problem: "typo of Fulbe", outcome: "neighbour" },
  { typed: "kassabara", problem: "typo, no close name", outcome: "neighbour" },
  { typed: "beretr", problem: "typo, no close name", outcome: "neighbour" },
  {
    typed: "heidinger",
    problem: "surname the corpus does not hold",
    outcome: "neighbour",
  },
  { typed: "diawanbe", problem: "typo of Diawambé", outcome: "neighbour" },
  { typed: "adjoukoi", problem: "typo of Adioukrou", outcome: "neighbour" },
  { typed: "adjoukr", problem: "typo, partial", outcome: "widened" },
  { typed: "adjoukrou", problem: "spelling of Adioukrou", outcome: "widened" },

  // Questions and punctuation
  {
    typed: "d’où vient les bakayoko",
    problem: "question frame, curly apostrophe, spelling of Bagayoko",
    outcome: "hit",
  },
  {
    typed: "qui a créé la côte d'ivoire",
    problem: "question frame",
    outcome: "hit",
  },
  {
    typed: "d'où vient le nom peul ?",
    problem: "question frame, trailing mark",
    outcome: "hit",
  },
  {
    typed: "bambara?",
    problem: "trailing question mark",
    outcome: "hit",
    answered: true,
  },
  { typed: "« mandé »", problem: "guillemets", outcome: "hit" },

  // Two entities
  {
    typed: "mandja egypte",
    problem: "two names, no entry has both",
    outcome: "widened",
  },

  // Out of scope, kept so the limit stays written down
  {
    typed: "giso",
    problem: "fragment inside a word (Ogiso) — not supported",
    outcome: "neighbour",
  },
  {
    typed: "ogiso",
    problem: "the whole word; prose mentions it",
    outcome: "widened",
  },

  // Controls: what already worked must not move
  { typed: "krou", problem: "control", outcome: "hit" },
  { typed: "kru", problem: "control", outcome: "hit" },
  { typed: "peul", problem: "control: an exonym", outcome: "hit" },
  { typed: "fula", problem: "control", outcome: "hit" },
  { typed: "bassa", problem: "control", outcome: "hit" },
  { typed: "côte d'ivoire", problem: "control", outcome: "hit" },
  { typed: "pygmée", problem: "control", outcome: "hit", answered: true },
  { typed: "mandja", problem: "control", outcome: "hit" },
];
