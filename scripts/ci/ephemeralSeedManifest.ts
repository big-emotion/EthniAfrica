/**
 * The AFRIK entity IDs an ephemeral CI database must hold for the three
 * gated jobs (axe live-route audit, Lighthouse gate, Playwright smoke) to
 * render every route they visit.
 *
 * Derived by reading the three source files as text and pattern-matching
 * entity IDs, rather than importing them: `a11yRoutes.ts` already avoids
 * importing `a11y-test.ts` for the same reason (module-load side effects),
 * and an e2e spec file registers Playwright tests on import. Reading text
 * keeps this module free of both.
 *
 * `qualityGateRoutesManifest.test.ts` is the gate on this file: it fails
 * if a route in any of the three sources names an identifier this manifest
 * does not list, so a new gated route cannot silently render empty.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "../..");

const SOURCE_FILES = [
  "scripts/a11yRoutes.ts",
  ".lighthouserc.gate.js",
  "e2e/smoke.spec.ts",
  "e2e/home-search-first.spec.ts",
] as const;

function readSource(relativePath: string): string {
  return readFileSync(resolve(ROOT, relativePath), "utf8");
}

// Precise: the route-builder call itself, e.g. getPeopleRoute(locale, "PPL_WOLOF").
const FAMILY_CALL = /getFamilyRoute\([^,]+,\s*"([^"]+)"\)/g;
const PEOPLE_CALL =
  /get(?:PeopleRoute|PeopleLinksRoute)\([^,]+,\s*"([^"]+)"\)/g;
const COUNTRY_CALL = /getCountryRoute\([^,]+,\s*"([^"]+)"\)/g;

// Fallback safety net: a bare identifier anywhere in the file, including a
// raw URL path (.lighthouserc.gate.js has no route-builder calls at all) or
// a second ID embedded in a composed path (the compare route's
// `FLG_BANTU/FLG_MANDE`, which no single getFamilyRoute call names).
const BARE_FAMILY_ID = /\b(FLG_[A-Z0-9_]+)\b/g;
const BARE_PEOPLE_ID = /\b(PPL_[A-Z0-9_]+)\b/g;
// Only in a route-shaped position: /atlas/pays/SEN or /atlas/countries/SEN
// (the English slug) — a bare three-uppercase-letter word is otherwise too
// common a false-positive shape to scan for on its own.
const COUNTRY_PATH = /\/atlas\/(?:pays|countries)\/([A-Z]{3})\b/g;

function extractAll(text: string, pattern: RegExp): string[] {
  return [...text.matchAll(pattern)].map((match) => match[1]);
}

export interface EphemeralSeedManifest {
  languageFamilyIds: string[];
  peopleIds: string[];
  countryIds: string[];
}

export function buildEphemeralSeedManifest(): EphemeralSeedManifest {
  const languageFamilyIds = new Set<string>();
  const peopleIds = new Set<string>();
  const countryIds = new Set<string>();

  for (const path of SOURCE_FILES) {
    const text = readSource(path);

    for (const id of extractAll(text, FAMILY_CALL)) languageFamilyIds.add(id);
    for (const id of extractAll(text, BARE_FAMILY_ID))
      languageFamilyIds.add(id);

    for (const id of extractAll(text, PEOPLE_CALL)) peopleIds.add(id);
    for (const id of extractAll(text, BARE_PEOPLE_ID)) peopleIds.add(id);

    for (const id of extractAll(text, COUNTRY_CALL)) countryIds.add(id);
    for (const id of extractAll(text, COUNTRY_PATH)) countryIds.add(id);
  }

  return {
    languageFamilyIds: [...languageFamilyIds].sort(),
    peopleIds: [...peopleIds].sort(),
    countryIds: [...countryIds].sort(),
  };
}

// Printable from the CLI for the composite action:
//   npx tsx scripts/ci/ephemeralSeedManifest.ts
if (import.meta.url === `file://${process.argv[1]}`) {
  process.stdout.write(
    JSON.stringify(buildEphemeralSeedManifest(), null, 2) + "\n"
  );
}
