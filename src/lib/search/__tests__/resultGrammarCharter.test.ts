import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import {
  RESULT_BLOCKS,
  UNCONDITIONAL_BLOCK_IDS,
} from "@/lib/search/resultGrammar";

/**
 * How each block is recognised inside a board, keyed by the id the contract
 * declares. The French lives here rather than in `resultGrammar.ts`: a heading
 * a reader sees is copy and belongs in a locale dictionary, while these are
 * needles for matching a mockup — a different job, and one `check:copy-literals`
 * exempts `__tests__/` from precisely because of it.
 */
const BLOCK_PROBES: Record<string, string> = {
  verdict: "D'où vient ce nom",
  disambiguation: "Lequel cherchez-vous",
  appellations: "Les appellations",
  origins: "D'où elles viennent",
  "self-given": "Ce que les peuples se donnent",
  problem: "posent problème",
  "usage-today": "Qui dit quoi",
  "shared-name": "Pourquoi le même nom",
  "through-time": "À travers le temps",
  "atlas-holds": "Ce que l'atlas tient",
  silences: "Ce que l'atlas ne dit pas",
  further: "Aller plus loin",
};

/**
 * The conviction and the invitation carry no fixed heading — their sentence is
 * chosen by the case — so a board is matched against the phrases the charter
 * fixes. Any one of them counts.
 */
const CONVICTION_PHRASES = [
  "Aucun de ces noms n'est faux",
  "Le nom qui compte le plus",
  "ne retire rien à personne",
  "Un nom partagé n'est pas une parenté",
  "mieux placé que vous",
];

const INVITATION_PHRASES = [
  "Nous nous sommes trompés",
  "Vous connaissez ce nom mieux que nous",
  "Nous parler de ce nom",
];

/**
 * The reviewed mockups, measured against the grammar they are supposed to obey.
 *
 * Parity with a mockup is not pixel equality and never could be: the boards
 * carry fixed text while the page renders a corpus whose strings are any
 * length. What has to match is which blocks are drawn, in what order — so that
 * is what is asserted, on the boards today and on the page when it exists.
 *
 * It would have caught the defect that produced it. Three of the five mobile
 * boards ended up drawing their invitation to correct *before* their
 * conviction, because the insertion anchored on « Aller plus loin » without
 * seeing what already sat there, and no diff showed it.
 */

const MOCKUP_DIR = "docs/design/mockups/search";

function boards(): string[] {
  return fs
    .readdirSync(path.join(process.cwd(), MOCKUP_DIR))
    .filter((name) => name.endsWith(".dc.html"))
    .sort();
}

/**
 * Every named entity the boards use. Written out rather than approximated: a
 * first version dropped the ones it had not listed, so « D&ugrave; » collapsed
 * to « D » and the gate reported the mockups as broken when the decoder was.
 * An unknown entity now throws instead of silently becoming a space.
 */
const ENTITIES: Record<string, string> = {
  "&#39;": "'",
  "&aacute;": "á",
  "&agrave;": "à",
  "&Agrave;": "À",
  "&ccedil;": "ç",
  "&eacute;": "é",
  "&ecirc;": "ê",
  "&egrave;": "è",
  "&icirc;": "î",
  "&iuml;": "ï",
  "&laquo;": "«",
  "&mdash;": "—",
  "&middot;": "·",
  "&nbsp;": " ",
  "&ocirc;": "ô",
  "&raquo;": "»",
  "&rarr;": "→",
  "&ucirc;": "û",
  "&ugrave;": "ù",
};

/** The board's visible text, entities resolved, markup gone. */
function readableText(board: string): string {
  const raw = fs.readFileSync(
    path.join(process.cwd(), MOCKUP_DIR, board),
    "utf8"
  );
  const body = raw.split("</helmet>")[1]?.split("</x-dc>")[0] ?? raw;
  return body
    .replace(/<[^>]+>/g, "\n")
    .replace(/&[a-zA-Z#0-9]+;/g, (entity) => {
      const plain = ENTITIES[entity];
      if (plain === undefined) {
        throw new Error(
          `${board} uses ${entity}, which this gate cannot decode — add it to ENTITIES`
        );
      }
      return plain;
    });
}

/** Where each block first appears, in reading order; -1 when it is absent. */
function blockPositions(text: string): Map<string, number> {
  const found = new Map<string, number>();

  for (const block of RESULT_BLOCKS) {
    if (block.id === "conviction") {
      found.set(
        block.id,
        Math.min(
          ...CONVICTION_PHRASES.map((phrase) => text.indexOf(phrase)).filter(
            (at) => at >= 0
          ),
          Infinity
        )
      );
      continue;
    }
    if (block.id === "invitation") {
      found.set(
        block.id,
        Math.min(
          ...INVITATION_PHRASES.map((phrase) => text.indexOf(phrase)).filter(
            (at) => at >= 0
          ),
          Infinity
        )
      );
      continue;
    }
    const probe = BLOCK_PROBES[block.id];
    if (probe === undefined) {
      throw new Error(
        `${block.id} is declared in RESULT_BLOCKS with no probe in this test`
      );
    }
    found.set(block.id, text.indexOf(probe));
  }

  return found;
}

describe("the result page's block grammar, on the reviewed mockups", () => {
  // @req REQ-044
  it("has a board for every case at every width and theme", () => {
    const names = boards();
    expect(names.length, "the grid is five cases by four variants").toBe(20);

    for (const entity of ["Mande", "Peul", "Ekpeye", "Introuvable", "Bassa"]) {
      for (const variant of ["", "Nuit", "Desktop", "DesktopNuit"]) {
        expect(names, `${entity}${variant} is missing`).toContain(
          `${entity}${variant}.dc.html`
        );
      }
    }
  });

  // The order is the contract. Pixels are not: the boards carry fixed text and
  // the page will carry a corpus, so equality of appearance is unattainable and
  // equality of sequence is the thing that means something.
  // @req REQ-044
  it("draws the blocks it draws in the charter's order", () => {
    for (const board of boards()) {
      const positions = blockPositions(readableText(board));
      const drawn = RESULT_BLOCKS.map((block) => ({
        id: block.id,
        at: positions.get(block.id) ?? -1,
      })).filter((entry) => entry.at >= 0 && entry.at !== Infinity);

      const outOfOrder = drawn.filter(
        (entry, index) => index > 0 && entry.at < drawn[index - 1].at
      );

      expect(
        outOfOrder.map((entry) => entry.id),
        `${board} draws ${outOfOrder.map((e) => e.id).join(", ")} before the ` +
          `block the charter puts ahead of it`
      ).toEqual([]);
    }
  });

  // A board that declares no silence, offers no way to correct it or closes on
  // a link list has dropped what the atlas owes its reader, which is the half
  // of the grammar that does not depend on the corpus.
  // @req REQ-044
  it("never drops what the atlas owes the reader", () => {
    for (const board of boards()) {
      const positions = blockPositions(readableText(board));

      for (const id of UNCONDITIONAL_BLOCK_IDS) {
        // The verdict's eyebrow is absent from the two-state « introuvable »
        // board, whose answer is that it does not know the name.
        if (id === "verdict" && board.startsWith("Introuvable")) continue;
        // A board with a single appellation declares its silences in place of
        // the block; `Introuvable` has no entity to be silent about.
        if (id === "silences" && board.startsWith("Introuvable")) continue;

        const at = positions.get(id) ?? -1;
        expect(at >= 0 && at !== Infinity, `${board} draws no ${id}`).toBe(
          true
        );
      }
    }
  });
});
