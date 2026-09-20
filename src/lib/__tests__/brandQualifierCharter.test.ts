import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import {
  OG_DESCRIPTION,
  OG_TITLE,
  PRODUCT_NAME,
  PRODUCT_TAGLINE,
} from "@/lib/brand";

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
];

describe("the product's qualifier, spelled in one place", () => {
  // The site asks « d'où vient ce nom ? » of a people, a country, a language, a
  // place and a family name. A title that says "peoples" tells a reader who
  // arrives for a country or a surname that this is not their site.
  // @req REQ-019
  it("does not narrow the question to peoples alone", () => {
    expect(PRODUCT_TAGLINE.toLowerCase()).not.toContain("peuples");
    expect(OG_DESCRIPTION.split("?")[0].toLowerCase()).not.toContain("peuples");
  });

  // @req REQ-019
  it("opens the description on the question", () => {
    expect(OG_DESCRIPTION.startsWith("D’où vient")).toBe(true);
  });

  // @req REQ-019
  it("composes OG_TITLE from the name and the qualifier", () => {
    expect(OG_TITLE).toBe(`${PRODUCT_NAME} — ${PRODUCT_TAGLINE}`);
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
