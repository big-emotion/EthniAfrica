/**
 * Which block a result page draws, in what order, and under what condition.
 *
 * This is §3 bis of `docs/design/search-result-charter.md` as code, so that the
 * mockups and the page can be measured against the same list instead of against
 * a paragraph somebody has to remember. The charter stays the prose; this is
 * the part a test can read.
 *
 * It carries no French: a block's heading is copy and belongs in a locale
 * dictionary, and the phrases used to recognise a block inside a mockup are
 * the parity test's own business. What is contractual is the list, the order
 * and the condition.
 *
 * It exists because the grammar was broken the day it was written: three of the
 * five artboards ended up asking the reader for a correction *before* saying
 * what the atlas stands for, and every diff of that change read as correct. A
 * rule about the order of blocks is only enforceable if something counts them.
 */

/** The three movements the page reads in. */
export type ResultMovement = "answer" | "holds" | "owes";

export interface ResultBlock {
  /** Stable id; the page and the mockups both key on it. */
  id: string;
  movement: ResultMovement;
  /**
   * When the block is drawn. `always` for the two movements that frame the
   * page; the rest is read off the corpus.
   */
  when: string;
}

/**
 * Ordered. The index in this array *is* the required order — a page that draws
 * two of these blocks the other way round fails the charter contract.
 *
 * Movement II's blocks are each conditional and may all be absent; movements I
 * and III are not, which is why a result page with nothing to say still reads
 * as a page.
 */
// @req REQ-044
export const RESULT_BLOCKS: readonly ResultBlock[] = [
  {
    id: "verdict",
    movement: "answer",
    when: "always — one sentence, and it is the answer",
  },
  {
    id: "disambiguation",
    movement: "holds",
    when: "two or more entities answer to the name",
  },
  {
    id: "appellations",
    movement: "holds",
    when: "the entity carries two forms or more",
  },
  {
    id: "origins",
    movement: "holds",
    when: "at least one form has a documented origin",
  },
  {
    id: "self-given",
    movement: "holds",
    when: "the self-given name differs from the searched form",
  },
  {
    id: "problem",
    movement: "holds",
    when: "at least one form is declared pejorative or contested",
  },
  {
    id: "usage-today",
    movement: "holds",
    when: "the corpus records a split in contemporary usage",
  },
  {
    id: "shared-name",
    movement: "holds",
    when: "several unrelated entities share the name",
  },
  {
    id: "through-time",
    movement: "holds",
    when: "the corpus dates at least one attestation — never, today",
  },
  {
    id: "atlas-holds",
    movement: "holds",
    when: "fewer than two blocks of this movement are filled",
  },
  {
    id: "silences",
    movement: "owes",
    when: "always — every silence of the case, gathered, never left blank",
  },
  {
    id: "conviction",
    movement: "owes",
    when: "always — one sentence from the doctrine, chosen by the case",
  },
  {
    id: "invitation",
    movement: "owes",
    when: "always — a page showing seven names is the one most in need of it",
  },
  {
    id: "further",
    movement: "owes",
    when: "always — the fiches, last",
  },
] as const;

/** The blocks that every result page draws, whatever the corpus holds. */
// @req REQ-044
export const UNCONDITIONAL_BLOCK_IDS: readonly string[] = RESULT_BLOCKS.filter(
  (block) => block.when.startsWith("always")
).map((block) => block.id);
