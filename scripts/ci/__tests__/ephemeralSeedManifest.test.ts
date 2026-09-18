import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { buildEphemeralSeedManifest } from "../ephemeralSeedManifest";

const ROOT = resolve(import.meta.dirname, "../../..");

const SOURCE_FILES = [
  "scripts/a11yRoutes.ts",
  ".lighthouserc.gate.js",
  "e2e/smoke.spec.ts",
  "e2e/home-search-first.spec.ts",
] as const;

// A deliberately broader, independent sweep: not the precise route-builder-call
// patterns the manifest itself uses, so a new route naming an entity in a shape
// those patterns do not recognise still turns up here. Country codes are the
// one axis this cannot check generically (a bare three-uppercase-letter token
// is too common a shape); COUNTRY_PATH in ephemeralSeedManifest.ts already
// covers every route-path form a gated route can take.
const GENERIC_ENTITY_ID = /\b(FLG|PPL|PAT)_[A-Z0-9_]+\b/g;

describe("the ephemeral seed manifest covers every gated route's entities", () => {
  const manifest = buildEphemeralSeedManifest();
  const known = new Set([
    ...manifest.languageFamilyIds,
    ...manifest.peopleIds,
    ...manifest.countryIds,
  ]);

  // @req REQ-168
  it("names at least the entities the three gates are known to render", () => {
    expect(manifest.languageFamilyIds).toContain("FLG_BANTU");
    expect(manifest.languageFamilyIds).toContain("FLG_MANDE");
    expect(manifest.peopleIds).toContain("PPL_WOLOF");
    expect(manifest.countryIds).toContain("SEN");
  });

  for (const path of SOURCE_FILES) {
    // @req REQ-168
    it(`leaves no entity-shaped identifier in ${path} outside the manifest`, () => {
      const text = readFileSync(resolve(ROOT, path), "utf8");
      const found = [...text.matchAll(GENERIC_ENTITY_ID)].map((m) => m[0]);
      const missing = found.filter((id) => !known.has(id));

      expect(
        missing,
        missing.length > 0
          ? `${path} names ${missing.join(", ")}, absent from the seed manifest — a route reading this entity would render against an empty row in the ephemeral database. Widen ephemeralSeedManifest.ts's extraction patterns.`
          : undefined
      ).toEqual([]);
    });
  }
});
