import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import {
  FEED_BLOCKS,
  FEED_ZONES,
  OWED_PARTS,
  type FeedBlockId,
  type FeedZone,
  type OwedPartId,
  type SearchResultState,
} from "@/lib/search/resultGrammar";

const MOCKUP_DIR = "docs/design/mockups/search-feed";
const MANIFEST_PATH = path.join(MOCKUP_DIR, "manifest.json");

const CASES = [
  { id: "mande", stem: "Mande" },
  { id: "peul", stem: "Peul" },
  { id: "fang", stem: "Fang" },
  { id: "bassa", stem: "Bassa" },
  { id: "ekpeye", stem: "Ekpeye" },
  { id: "nigeria", stem: "Nigeria" },
  { id: "lingala", stem: "Lingala" },
  { id: "traore", stem: "Traore" },
  { id: "introuvable", stem: "Introuvable" },
  { id: "inconnu", stem: "Inconnu" },
] as const;

const VARIANTS = [
  { id: "mobile-day", suffix: "", width: 430, theme: "day" },
  { id: "mobile-night", suffix: "Nuit", width: 430, theme: "night" },
  { id: "desktop-day", suffix: "Desktop", width: 1280, theme: "day" },
  {
    id: "desktop-night",
    suffix: "DesktopNuit",
    width: 1280,
    theme: "night",
  },
] as const;

interface ManifestBlock {
  id: FeedBlockId;
  zone: FeedZone;
}

interface ManifestEntry {
  case: (typeof CASES)[number]["id"];
  variant: (typeof VARIANTS)[number]["id"];
  file: string;
  query: string;
  resultState: SearchResultState;
  width: number;
  theme: "day" | "night";
  height: number;
  blocks: ManifestBlock[];
  owedParts: OwedPartId[];
}

interface FeedManifest {
  schemaVersion: number;
  entries: ManifestEntry[];
}

function loadManifest(): FeedManifest {
  return JSON.parse(
    fs.readFileSync(path.join(process.cwd(), MANIFEST_PATH), "utf8")
  ) as FeedManifest;
}

function boardNames(): string[] {
  return fs
    .readdirSync(path.join(process.cwd(), MOCKUP_DIR))
    .filter((name) => name.endsWith(".dc.html"))
    .sort();
}

function attributeValues(html: string, attribute: string): string[] {
  return Array.from(
    html.matchAll(new RegExp(`${attribute}="([^"]+)"`, "g")),
    (match) => match[1]
  );
}

function boardMarkup(source: string): string {
  return source.split("</helmet>")[1]?.split("</x-dc>")[0] ?? source;
}

function structuralShape(board: ManifestEntry) {
  return {
    query: board.query,
    resultState: board.resultState,
    blocks: board.blocks,
    owedParts: board.owedParts,
  };
}

function entry(
  manifest: FeedManifest,
  caseName: ManifestEntry["case"],
  variant: ManifestEntry["variant"]
): ManifestEntry {
  const found = manifest.entries.find(
    (board) => board.case === caseName && board.variant === variant
  );
  expect(
    found,
    `${caseName}/${variant} is missing from the manifest`
  ).toBeDefined();
  return found!;
}

describe("the generated search-result feed charter", () => {
  // The manifest is the structural authority, so its matrix must be exact: a
  // new or missing board is a contract change rather than an incidental file.
  // @req REQ-180
  it("contains exactly ten cases and four variants per case", () => {
    const manifest = loadManifest();
    const expectedFiles = CASES.flatMap(({ stem }) =>
      VARIANTS.map(({ suffix }) => `${stem}${suffix}.dc.html`)
    ).sort();

    expect(manifest.schemaVersion).toBe(1);
    expect(manifest.entries).toHaveLength(40);
    expect(boardNames()).toEqual(expectedFiles);
    expect(manifest.entries.map((board) => board.file).sort()).toEqual(
      expectedFiles
    );

    for (const { id: caseName, stem } of CASES) {
      for (const variant of VARIANTS) {
        const board = entry(manifest, caseName, variant.id);
        expect(board.file).toBe(`${stem}${variant.suffix}.dc.html`);
        expect(board.width).toBe(variant.width);
        expect(board.theme).toBe(variant.theme);
      }
    }
  });

  // Desktop may split the mobile sequence across two columns. Order therefore
  // belongs to each real zone, not to one flattened desktop list.
  // @req REQ-180
  it("uses only canonical blocks and keeps their order inside each zone", () => {
    const manifest = loadManifest();
    const canonicalIndex = new Map(
      FEED_BLOCKS.map((block, index) => [block, index])
    );

    for (const board of manifest.entries) {
      expect(new Set(board.blocks.map(({ id }) => id)).size, board.file).toBe(
        board.blocks.length
      );

      for (const zone of FEED_ZONES) {
        const blocks = board.blocks
          .filter((block) => block.zone === zone)
          .map(({ id }) => id);
        const sorted = [...blocks].sort(
          (left, right) =>
            canonicalIndex.get(left)! - canonicalIndex.get(right)!
        );
        expect(blocks, `${board.file}/${zone} is out of order`).toEqual(sorted);
      }

      for (const block of board.blocks) {
        expect(FEED_BLOCKS, `${board.file} declares ${block.id}`).toContain(
          block.id
        );
        expect(FEED_ZONES, `${board.file} declares ${block.zone}`).toContain(
          block.zone
        );

        if (
          ["lenses", "verdict", "appellations", "shorts"].includes(block.id)
        ) {
          expect(block.zone, `${board.file}/${block.id}`).toBe("first");
        } else if (["owed", "further"].includes(block.id)) {
          expect(block.zone, `${board.file}/${block.id}`).toBe("closing");
        } else {
          expect(
            ["primary", "secondary"],
            `${board.file}/${block.id}`
          ).toContain(block.zone);
        }
      }
    }
  });

  // Night is a token substitution over the same page, never a second
  // composition. Comparing structure catches a hand-edited night board.
  // @req REQ-180
  it("keeps day and night structurally identical at each width", () => {
    const manifest = loadManifest();

    for (const { id: caseName } of CASES) {
      expect(
        structuralShape(entry(manifest, caseName, "mobile-night"))
      ).toEqual(structuralShape(entry(manifest, caseName, "mobile-day")));
      expect(
        structuralShape(entry(manifest, caseName, "desktop-night"))
      ).toEqual(structuralShape(entry(manifest, caseName, "desktop-day")));
    }
  });

  // `owed` is one top-level closing with independently testable children. Its
  // children must not leak back into the top-level feed vocabulary.
  // @req REQ-180
  it("keeps owed composite and its parts in their canonical order", () => {
    const manifest = loadManifest();
    const owedIndex = new Map(OWED_PARTS.map((part, index) => [part, index]));

    for (const board of manifest.entries) {
      const ids = board.blocks.map(({ id }) => id);
      expect(ids).not.toContain("silences");
      expect(ids).not.toContain("conviction");
      expect(ids).not.toContain("invitation");

      if (["exact", "widened"].includes(board.resultState)) {
        expect(ids, `${board.file} must close with owed`).toContain("owed");
      }
      if (board.resultState === "typo") {
        expect(
          ids,
          `${board.file} must not invent an owed subject`
        ).not.toContain("owed");
      }
      if (board.resultState === "unknown") {
        expect(ids, `${board.file} must carry the unknown closing`).toContain(
          "owed"
        );
      }

      if (!ids.includes("owed")) {
        expect(board.owedParts, board.file).toEqual([]);
        continue;
      }

      expect(board.owedParts, `${board.file} omits conviction`).toContain(
        "conviction"
      );
      expect(board.owedParts, `${board.file} omits invitation`).toContain(
        "invitation"
      );
      expect(board.owedParts).toEqual(
        [...board.owedParts].sort(
          (left, right) => owedIndex.get(left)! - owedIndex.get(right)!
        )
      );
    }
  });

  // These three cases distinguish a shared name, a useful typo and a genuinely
  // unknown query. Conflating them was the grammar defect this contract fixes.
  // @req REQ-180
  it("preserves the Bassa, typo, and unknown exceptional contracts", () => {
    const manifest = loadManifest();

    for (const variant of VARIANTS) {
      const bassa = entry(manifest, "bassa", variant.id).blocks.map(
        ({ id }) => id
      );
      expect(bassa).toContain("shared-name");
      expect(bassa).not.toContain("problem");

      const typo = entry(manifest, "introuvable", variant.id).blocks.map(
        ({ id }) => id
      );
      expect(typo).not.toContain("owed");
      expect(typo.at(-1)).toBe("further");

      const unknown = entry(manifest, "inconnu", variant.id);
      const unknownIds = unknown.blocks.map(({ id }) => id);
      expect(unknownIds.slice(-2)).toEqual(["owed", "further"]);
      expect(unknown.owedParts).toEqual(["conviction", "invitation"]);
    }
  });

  // The generated markup is an executable view of the manifest. Visible copy
  // remains illustrative, but semantic markers may never drift from it.
  // @req REQ-180
  it("keeps every board's semantic markup aligned with the manifest", () => {
    const manifest = loadManifest();

    for (const board of manifest.entries) {
      const html = fs.readFileSync(
        path.join(process.cwd(), MOCKUP_DIR, board.file),
        "utf8"
      );
      const markup = boardMarkup(html);
      expect(attributeValues(markup, "data-feed-block"), board.file).toEqual(
        board.blocks.map(({ id }) => id)
      );
      expect(attributeValues(markup, "data-feed-part"), board.file).toEqual(
        board.owedParts
      );
    }
  });
});
