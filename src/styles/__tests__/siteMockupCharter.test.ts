import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it, expect } from "vitest";

/**
 * Mockups first (`docs/design/mockup-first-workflow.md`).
 *
 * The site boards in `docs/design/mockups/site/` are the reference every
 * visible change answers to. Their stylesheet carries a verbatim copy of the
 * stylesheets below, so a board renders with the tokens the site ships.
 *
 * A stylesheet edited in `src/styles/` without the boards moves the site away
 * from its reference with nothing to show for it: the next agency to open the
 * canvas designs against a site that no longer exists. This gate fails that
 * edit until the boards carry the same bytes, which is the order the workflow
 * asks for: the boards change first, the code follows.
 */
const ROOT = join(__dirname, "..", "..", "..");
const SITE = join(ROOT, "docs", "design", "mockups", "site");
const BOARD_CSS = readFileSync(join(SITE, "ea-live.css"), "utf8");

const VERBATIM: Record<string, string> = {
  "color.css": "src/styles/tokens/color.css",
  "type.css": "src/styles/tokens/type.css",
  "space.css": "src/styles/tokens/space.css",
  "radius.css": "src/styles/tokens/radius.css",
  "elevation.css": "src/styles/tokens/elevation.css",
  "motion.css": "src/styles/tokens/motion.css",
  "shell.css": "src/styles/shell.css",
  "site-chrome.css": "src/styles/site-chrome.css",
  "source-diamond.css": "src/styles/source-diamond.css",
  "search-feed.css": "src/styles/search-feed.css",
  "name-timeline.css": "src/styles/name-timeline.css",
  "fiche-parchment.css": "src/styles/fiche-parchment.css",
  "fiche-chapter-bar.css": "src/styles/fiche-chapter-bar.css",
};

const LAYER_MARK =
  "/* ============================================================\n   EthniAfrica record layer";

function verbatimSections(css: string): Map<string, string> {
  const layerAt = css.indexOf(LAYER_MARK);
  const copied = layerAt === -1 ? css : css.slice(0, layerAt);
  const parts = copied.split(
    /^\/\* ===== (\S+\.css) \(verbatim\) ===== \*\/\n/m
  );
  const sections = new Map<string, string>();
  for (let i = 1; i < parts.length; i += 2) {
    sections.set(parts[i], parts[i + 1]);
  }
  return sections;
}

const trimEnd = (text: string) => text.replace(/\n+$/, "");

describe("site mockups — the boards carry the stylesheets the site ships", () => {
  const sections = verbatimSections(BOARD_CSS);

  it("copies every listed stylesheet, and only those", () => {
    // @req REQ-115
    expect([...sections.keys()].sort()).toEqual(Object.keys(VERBATIM).sort());
  });

  it.each(Object.entries(VERBATIM))(
    "%s in the boards matches %s byte for byte",
    (name, source) => {
      // @req REQ-115
      const shipped = readFileSync(join(ROOT, source), "utf8");
      expect(trimEnd(sections.get(name) ?? "")).toBe(trimEnd(shipped));
    }
  );
});

describe("site mockups — the canvas index lists every board", () => {
  it("canvas.json and the board files agree", () => {
    // @req REQ-115
    const canvas = JSON.parse(
      readFileSync(join(SITE, "canvas.json"), "utf8")
    ) as { boards: Record<string, unknown> };
    const files = readdirSync(SITE).filter((f) => f.endsWith(".dc.html"));
    expect(Object.keys(canvas.boards).sort()).toEqual(files.sort());
  });
});
