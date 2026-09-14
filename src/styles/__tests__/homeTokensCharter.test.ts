import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";

import { describe, expect, it } from "vitest";

/**
 * `src/styles/home-tokens.css` was a holding pen, not a scale — the charter
 * says so in §6 rule 3 and §7. It held the sizes the home set outside the
 * scale until a designer ruled on them. The last one, the title's
 * `clamp(30px, 5.6vw, 56px)`, moved onto `--afh-text-hero` on 2026-09-14, so
 * the pen is closed and the file is gone.
 *
 * This suite keeps it closed. A `--home-text-*` token coming back is a second
 * scale growing back; a literal size is exactly the debt the pen existed to
 * hold, now with nowhere to be held.
 */

const HOME_TOKENS_PATH = resolve(process.cwd(), "src/styles/home-tokens.css");
const HOME_DIR = resolve(process.cwd(), "src/components/home");

function homeComponentSources(): { file: string; source: string }[] {
  return readdirSync(HOME_DIR)
    .filter((name) => name.endsWith(".tsx") && !name.includes(".stories."))
    .map((name) => ({
      file: name,
      source: readFileSync(join(HOME_DIR, name), "utf8"),
    }));
}

describe("home type tokens (typography charter §6 rule 3)", () => {
  // @req REQ-091
  it("keeps the holding pen closed", () => {
    expect(existsSync(HOME_TOKENS_PATH)).toBe(false);
    expect(
      readFileSync(resolve(process.cwd(), "src/index.css"), "utf8")
    ).not.toMatch(/home-tokens\.css/);

    for (const { file, source } of homeComponentSources()) {
      expect(source, `${file}`).not.toMatch(/--home-text-/);
    }
  });

  // The whole value of temps A is that no component keeps a literal. One left
  // behind and the ratchet has a hole in exactly the surface it was opened for.
  // @req REQ-091
  it("leaves no literal font size in any home component", () => {
    for (const { file, source } of homeComponentSources()) {
      const literals = [...source.matchAll(/font-size:\s*([^;]+);/g)]
        .map(([, value]) => value.trim())
        // `font-size: 0` on .access-axis-cta hides a text node; it is a layout
        // trick with no unit, not a size.
        .filter((value) => /\d*\.?\d+(px|rem|em|pt)\b/.test(value));

      expect(literals, `${file}`).toEqual([]);
      expect(source, `${file}`).not.toMatch(/text-\[\d[\d.]*(px|rem|em)\]/);
    }
  });
});
