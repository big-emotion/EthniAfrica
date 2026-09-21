import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import {
  OG_DESCRIPTION,
  OG_TITLE,
  PRODUCT_NAME,
  PRODUCT_TAGLINE,
} from "@/lib/brand";
import { chromeCopy } from "@/lib/i18n/copy/chrome";

/**
 * Brand charter §1: the product name and its qualifier are read from
 * `src/lib/brand.ts` and from nowhere else.
 *
 * The rule had no gate, and the cost was measured twice in two days. When the
 * qualifier changed on 2026-09-17 the browser tab kept its own spelling, so a
 * reader opening the tab and a reader seeing the shared link were told the
 * product was two different things. And **four e-mails kept theirs** — the flag
 * notification and the moderation sign-in link, each in both locales — which is
 * worse, because a mail outlives the page it came from and sits in somebody's
 * inbox for years.
 */

const SCANNED_DIRS = ["src", "scripts"];
const CODE = /\.(ts|tsx|mjs|cjs|js)$/;
const SKIPPED = new Set(["node_modules", ".next", "dist", "coverage"]);

/**
 * Where the qualifier may legitimately appear: the constant itself, and the
 * files whose job is to assert or record it. A ledger entry naming a retired
 * value is history; a component printing one is the defect.
 */
const ALLOWED = [
  /^src\/lib\/brand\.ts$/,
  /^src\/lib\/__tests__\/brand(QualifierCharter)?\.test\.ts$/,
];

function walk(dir: string, out: string[]): void {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIPPED.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (entry.isFile() && CODE.test(entry.name)) out.push(full);
  }
}

function sourceFiles(): string[] {
  const out: string[] = [];
  for (const dir of SCANNED_DIRS) {
    const full = path.join(process.cwd(), dir);
    if (fs.existsSync(full)) walk(full, out);
  }
  return out.map((file) => path.relative(process.cwd(), file));
}

/** Every spelling of the qualifier the product has answered to. */
const QUALIFIERS = [
  PRODUCT_TAGLINE,
  "Atlas des Peuples d'Afrique",
  "Atlas of the Peoples of Africa",
  "Dictionnaire des Ethnies d'Afrique",
  // Retired 2026-09-20: it named peoples alone, once the site asked the
  // question of five kinds of name.
  "D’où viennent les noms des peuples d’Afrique",
  // Retired 2026-09-21: it announced a question, and the site now says what it
  // holds — the history a name carries, with the sources it rests on.
  "D’où viennent les noms d’Afrique",
  "D’où viennent les noms",
];

describe("the product's qualifier, spelled in one place", () => {
  // The site holds the history of a people's name, a country's, a language's, a
  // place's and a family name's. A title that says "peoples" tells a reader who
  // arrives for a country or a surname that this is not their site.
  const firstSentence = (text: string) => text.split(/[.?]/)[0];

  // @req REQ-019
  it("does not narrow the promise to peoples alone", () => {
    expect(PRODUCT_TAGLINE.toLowerCase()).not.toContain("peuples");
    expect(firstSentence(OG_DESCRIPTION).toLowerCase()).not.toContain(
      "peuples"
    );
  });

  // The enumeration of the six classes comes second: a reader scrolling a feed
  // has no reason yet to want a table of contents. What a name holds comes first.
  // @req REQ-019
  it("opens the description on what a name holds, not on the inventory", () => {
    const opening = firstSentence(OG_DESCRIPTION).toLowerCase();

    expect(opening).toContain("nom");
    expect(opening).toContain("histoire");
    expect(OG_DESCRIPTION).not.toMatch(/^D’où vient/);
  });

  // @req REQ-019
  it("composes OG_TITLE from the name and the qualifier", () => {
    expect(OG_TITLE).toBe(`${PRODUCT_NAME} — ${PRODUCT_TAGLINE}`);
  });

  // The bar leaves the lockup about 200 px on a phone, so the masthead carries a
  // short form. It must be the head of the slogan: two wordings would be the
  // product introducing itself two ways in the same viewport.
  // @req REQ-019
  it("carries the slogan's own opening in the masthead, in French", () => {
    expect(PRODUCT_TAGLINE.startsWith(chromeCopy.fr.headerTagline)).toBe(true);
  });

  // @req REQ-019
  it("keeps the masthead short enough for a phone bar", () => {
    expect(chromeCopy.fr.headerTagline.length).toBeLessThanOrEqual(24);
    expect(chromeCopy.en.headerTagline.length).toBeLessThanOrEqual(24);
  });

  // Python cannot import brand.ts, so the render engine's lockup keeps a copy of
  // the qualifier. A card and the page it points to must not introduce the
  // product in two wordings.
  // @req REQ-019
  it("is the qualifier the render engine draws under the wordmark", () => {
    const engine = fs.readFileSync(
      path.join(process.cwd(), "social/harness/ethni_brand.py"),
      "utf8"
    );
    const drawn = engine.match(/^TAGLINE = "(.+)"$/m);

    expect(drawn, "ethni_brand.py no longer declares TAGLINE").not.toBeNull();
    expect(drawn?.[1]).toBe(PRODUCT_TAGLINE);
  });

  // @req REQ-019
  it("is written in no source file but the constant that holds it", () => {
    const offences: string[] = [];

    for (const file of sourceFiles()) {
      if (ALLOWED.some((pattern) => pattern.test(file))) continue;
      const code = fs.readFileSync(file, "utf8");
      for (const qualifier of QUALIFIERS) {
        if (code.includes(qualifier)) {
          offences.push(`${file} spells « ${qualifier} »`);
        }
      }
    }

    expect(
      offences,
      "read the qualifier from src/lib/brand.ts instead of spelling it"
    ).toEqual([]);
  });
});
