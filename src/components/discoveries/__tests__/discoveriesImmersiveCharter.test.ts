import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const read = (path: string) =>
  readFileSync(resolve(process.cwd(), path), "utf8");

// Comments are stripped first: prose shaped like a declaration inside one
// would otherwise satisfy, or fail, a contract about the rules themselves.
const readerCss = read(
  "src/components/discoveries/DiscoveryReader.module.css"
).replace(/\/\*[\s\S]*?\*\//g, "");

const declarationsFor = (selector: string) =>
  [
    ...readerCss.matchAll(
      new RegExp(`(?:^|[},\\s])${selector}\\s*(?:,[^{]*)?\\{([^}]*)\\}`, "g")
    ),
  ]
    .map((block) => block[1])
    .join("\n");

describe("Découvertes immersive stage (brand charter §5.1)", () => {
  // A stage bounded by the page box is a card inside a document, which is
  // what shipped first: a 612 px frame on parchment, under the masthead.
  // @req REQ-156
  it("paints the whole viewport on the night ground from the phone up", () => {
    const stage = declarationsFor("\\.stage");
    expect(stage).toMatch(/position:\s*fixed/);
    expect(stage).toMatch(/inset:\s*0/);
    expect(stage).toMatch(/background:\s*var\(--afh-night-ground\)/);
    expect(declarationsFor("\\.feed")).toMatch(/height:\s*100%/);
  });

  // Without the insets, the top bar sits under the notch and the rail under
  // the home indicator on every recent iPhone.
  // @req REQ-156
  it("keeps the bars clear of the phone's own interface", () => {
    expect(readerCss).toMatch(/env\(safe-area-inset-top\)/);
    expect(readerCss).toMatch(/env\(safe-area-inset-bottom\)/);
  });

  // @req REQ-156
  it("names no colour of its own", () => {
    expect(readerCss).not.toMatch(/#[0-9a-f]{3,8}\b|rgba?\(|hsla?\(/i);
  });

  // The night ground is licensed per stage, not taken as a theme: a dark
  // block the charter does not name is out of scope by its own rule.
  // @req REQ-156
  it("is licensed by name in the brand charter", () => {
    const charter = read("docs/design/brand-charter.md");
    const colourGround = charter.slice(
      charter.indexOf("### 5.1"),
      charter.indexOf("### 5.2")
    );
    expect(colourGround).toMatch(/Découvertes/);
  });

  // @req REQ-156
  it("keeps the reviewed mockup beside the other design references", () => {
    expect(
      existsSync(
        resolve(
          process.cwd(),
          "docs/design/mockups/discoveries/discoveries-mobile.html"
        )
      )
    ).toBe(true);
  });
});
