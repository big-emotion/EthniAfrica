import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const CSS = readFileSync(join(__dirname, "..", "approach.css"), "utf8");

describe("Notre démarche approved board styles", () => {
  // @req REQ-132
  it("centres headings on phones and aligns them left from tablet width", () => {
    expect(CSS).toMatch(/\.ed-phone-centre h1,[\s\S]*?text-align:\s*center/);
    expect(CSS).toMatch(
      /@media\s*\(min-width:\s*768px\)[\s\S]*?text-align:\s*left/
    );
  });

  // @req REQ-132
  it("keeps the signature, position, source list, and onward links on board tokens", () => {
    for (const selector of [
      ".ea-signature",
      ".ea-position",
      ".ea-position-text",
      ".ea-approach-sources",
      ".ea-approach-source a",
      ".ea-approach-close",
    ]) {
      expect(CSS).toContain(selector);
    }
    expect(CSS).not.toMatch(/(?:font-size|margin|padding):\s*\d/);
  });
});
