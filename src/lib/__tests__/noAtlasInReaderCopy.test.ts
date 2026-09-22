import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Operator ruling, 2026-09-22: a reader never reads the word "atlas" as the
 * name of this project. The project is a "we" that takes positions — « nous »,
 * « notre projet », EthniAfrica — and the section a reader browses is
 * « Parcourir ». An object called "the atlas" that "documents", "holds" or
 * "does not say" is the register this replaces.
 *
 * What stays is not a self-reference: URL segments (`/atlas/…`, kept so no
 * link breaks), code identifiers, comments, the titles of real works (UNESCO's
 * *Atlas des langues africaines*…) and the Atlas mountains.
 *
 * The scan reads string literals and JSX text, not exports, because half the
 * copy is template functions (`(total) => \`…\``) an export walk cannot see.
 */

const SCANNED = [
  "src/lib/i18n/copy",
  "src/lib/hubs",
  "src/lib/glossaire",
  "src/lib/dossiers",
  "src/lib/home",
  "src/lib/proverbs",
  "src/lib/games",
  "src/lib/seo",
  "src/lib/legal-pages.ts",
  "src/lib/legal-pages.en.ts",
  "src/lib/brand.ts",
  "src/lib/api/openapiV2.ts",
  "src/app",
  "src/components",
];
const CODE = /\.(ts|tsx)$/;
const SKIPPED =
  /(__tests__|__fixtures__|\.test\.|\.stories\.|^src\/app\/api\/(?!download))/;

/** Real titles and place names that contain the word without meaning us. */
const PROPER_NOUNS =
  /Atlas (des|of|linguistique|de la)|WorldAtlas|(Haut|Moyen|Anti)[- ]Atlas|monts? de l['’]Atlas|Atlas mountains|l['’]Atlas (marocain|saharien|tellien)/gi;

function walk(target: string, out: string[]): void {
  const full = path.join(process.cwd(), target);
  if (!fs.existsSync(full)) return;
  if (fs.statSync(full).isFile()) {
    out.push(target);
    return;
  }
  for (const entry of fs.readdirSync(full, { withFileTypes: true })) {
    const rel = path.join(target, entry.name);
    if (entry.isDirectory()) walk(rel, out);
    else if (CODE.test(entry.name)) out.push(rel);
  }
}

function stripComments(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, "")
    .replace(/(^|[^:"'`\\])\/\/.*$/gm, "$1");
}

/** A string that is a path, a key or a class name is code, not copy. */
function isCode(literal: string): boolean {
  return (
    /^[\w./${}:@#?=&-]*$/.test(literal) ||
    /(^|[\s"'`(])\/[\w${}[\]-]*\/?atlas\b/i.test(literal)
  );
}

/** `atlas-morph-range`, `data-atlas-x`, `.atlas` are identifiers inside a literal. */
const IDENTIFIER_TOKENS = /[\w.-]*(?:atlas[-_]|[-_.]atlas)[\w.-]*/gi;

function offendingLiterals(source: string): string[] {
  const code = stripComments(source);
  const literals = [
    ...code.matchAll(/"((?:[^"\\\n]|\\.)*)"/g),
    ...code.matchAll(/`((?:[^`\\]|\\.)*)`/g),
    ...code.matchAll(/>([^<>{}`"]+)</g),
  ].map((m) => m[1]);
  return literals.filter((literal) => {
    if (isCode(literal)) return false;
    return /\batlas\b/i.test(
      literal.replace(PROPER_NOUNS, "").replace(IDENTIFIER_TOKENS, "")
    );
  });
}

describe("no reader-facing text calls the project an atlas", () => {
  const files: string[] = [];
  for (const target of SCANNED) walk(target, files);

  // @req REQ-019
  it("scans the copy it claims to scan", () => {
    expect(files.length).toBeGreaterThan(200);
    expect(files).toContain("src/lib/i18n/copy/nameAnswer.ts");
  });

  // @req REQ-019
  it("finds no « atlas » in any string a reader can read", () => {
    const offenders = files
      .filter((file) => !SKIPPED.test(file))
      .flatMap((file) =>
        offendingLiterals(fs.readFileSync(file, "utf8")).map(
          (literal) => `${file}: ${literal.slice(0, 100)}`
        )
      );
    expect(offenders.join("\n")).toBe("");
  });

  // @req REQ-019
  it("still lets real titles and mountains through", () => {
    expect(
      offendingLiterals(
        'const t = "UNESCO, Atlas des langues africaines ; le Haut-Atlas";'
      )
    ).toEqual([]);
    expect(
      offendingLiterals('const t = "L’atlas ne date aucune forme.";')
    ).toHaveLength(1);
  });
});
