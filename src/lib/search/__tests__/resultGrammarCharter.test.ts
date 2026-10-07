import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import {
  ANSWER_BLOCKS,
  FEED_BLOCKS,
  type FeedBlockId,
} from "@/lib/search/resultGrammar";

/**
 * The charter of the answer page, read from the frozen mockup (v11) and its
 * generated manifest. `docs/design/mockups/search-feed/` — the ten boards of
 * the page that stacked a dozen blocks — is replaced by this directory and no
 * longer governs structure.
 */
const MOCKUP_DIR = "docs/design/mockups/search-answer";
const MANIFEST_PATH = path.join(MOCKUP_DIR, "manifest.json");

const SCREENS = [
  "peul",
  "peul-shorts",
  "lingala",
  "bantou",
  "congo",
  "camara",
  "pharaon",
] as const;

interface ManifestEntry {
  case: (typeof SCREENS)[number];
  file: string;
  query: string;
  lens: "all" | "shorts";
  blocks: FeedBlockId[];
}

function loadManifest(): { schemaVersion: number; entries: ManifestEntry[] } {
  return JSON.parse(
    fs.readFileSync(path.join(process.cwd(), MANIFEST_PATH), "utf8")
  );
}

function boardMarkup(file: string): string {
  const source = fs.readFileSync(
    path.join(process.cwd(), MOCKUP_DIR, file),
    "utf8"
  );
  return source.split("</helmet>")[1]?.split("</x-dc>")[0] ?? source;
}

function entry(case_: ManifestEntry["case"]): ManifestEntry {
  const found = loadManifest().entries.find((board) => board.case === case_);
  expect(found, `${case_} is missing from the manifest`).toBeDefined();
  return found!;
}

describe("the generated answer-page charter", () => {
  // The manifest is the structural authority, so its matrix is exact: a new or
  // missing screen is a contract change rather than an incidental file.
  // @req REQ-178
  it("holds exactly the seven validated screens, each backed by a file", () => {
    const manifest = loadManifest();

    expect(manifest.schemaVersion).toBe(2);
    expect(manifest.entries.map((board) => board.case)).toEqual([...SCREENS]);
    for (const board of manifest.entries) {
      expect(
        fs.existsSync(path.join(process.cwd(), MOCKUP_DIR, board.file)),
        board.file
      ).toBe(true);
    }
  });

  // @req REQ-178
  it("uses only canonical blocks, once each, in the canonical order", () => {
    const canonicalIndex = new Map(
      FEED_BLOCKS.map((block, index) => [block, index])
    );

    for (const board of loadManifest().entries) {
      expect(new Set(board.blocks).size, board.file).toBe(board.blocks.length);
      for (const block of board.blocks) {
        expect(FEED_BLOCKS, `${board.file} declares ${block}`).toContain(block);
      }
      const sorted = [...board.blocks].sort(
        (left, right) => canonicalIndex.get(left)! - canonicalIndex.get(right)!
      );
      expect(board.blocks, `${board.file} is out of order`).toEqual(sorted);
      expect(board.blocks[0], board.file).toBe("lenses");
    }
  });

  // The screens are an executable view of the manifest: the semantic markers
  // may never drift from it.
  // @req REQ-178
  it("keeps every screen's markup aligned with the manifest", () => {
    for (const board of loadManifest().entries) {
      const markers = Array.from(
        boardMarkup(board.file).matchAll(/data-feed-block="([^"]+)"/g),
        (match) => match[1]
      );
      expect(markers, board.file).toEqual(board.blocks);
    }
  });

  // « Tout » is the six blocks in the validated order, then the fiche button,
  // then the invitation; a block with no data is absent, never empty.
  // @req REQ-178
  it("draws each answer as its blocks in the validated order, then the fiche and the invitation", () => {
    for (const board of loadManifest().entries.filter(
      ({ lens }) => lens === "all"
    )) {
      const answer = board.blocks.filter((id) => id.startsWith("answer-"));
      expect(answer, board.file).toEqual(
        ANSWER_BLOCKS.filter((id) => answer.includes(id))
      );
      // The three that every answer owes, whatever its fiche holds.
      for (const always of [
        "answer-what",
        "answer-origin",
        "answer-sources",
      ] as const) {
        expect(answer, `${board.file} lacks ${always}`).toContain(always);
      }
      expect(board.blocks.at(-1), board.file).toBe("owed");
      const afterSources = board.blocks.slice(
        board.blocks.indexOf("answer-sources") + 1
      );
      expect(
        afterSources.filter((id) => id !== "fiche-link" && id !== "owed"),
        board.file
      ).toEqual([]);
    }
  });

  // A word has no fiche and no geography; a language and a country do.
  // @req REQ-184
  it("gives a published word no fiche button and no geography", () => {
    const word = entry("pharaon").blocks;

    expect(word).not.toContain("fiche-link");
    expect(word).not.toContain("answer-where");
  });

  // The filters replace the answer rather than add to it.
  // @req REQ-178
  it("shows a filter as the filters and its shelf, with no answer block", () => {
    const shorts = entry("peul-shorts").blocks;

    expect(shorts).toEqual(["lenses", "shorts"]);
  });
});
