// @req REQ-133
import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { PATRONYME_VOCABULARY } from "../../src/lib/glossaire/vocabularies";
import { GLOSSARY_ENTRIES } from "../../src/lib/glossaire/entries";
import { PATRONYME_NAME_SYSTEMS } from "../../src/lib/afrik/parsers/patronymeTypes";

const root = process.cwd();
const VALUE = "hereditary_family_name";

describe("the sixth naming system, hereditary_family_name", () => {
  // @req REQ-133
  it("is a value of the parser enum", () => {
    expect(PATRONYME_NAME_SYSTEMS).toContain(VALUE);
    expect(PATRONYME_NAME_SYSTEMS).toHaveLength(6);
  });

  // @req REQ-133
  it("is listed in the strict fiche model", () => {
    const model = JSON.parse(
      readFileSync(resolve(root, "public/modele-nom-patronyme.json"), "utf8")
    );
    expect(model.nameSystem.split(" | ")).toContain(VALUE);
  });

  // @req REQ-133
  it("is in the OpenAPI spec wherever nameSystem is enumerated", () => {
    const spec = readFileSync(resolve(root, "openapi-spec.json"), "utf8");
    const source = readFileSync(
      resolve(root, "src/lib/api/openapiV2.ts"),
      "utf8"
    );
    const enums = spec.match(/"non_hereditary_patronymic"/g) ?? [];
    expect(enums.length).toBeGreaterThan(0);
    expect((spec.match(new RegExp(`"${VALUE}"`, "g")) ?? []).length).toBe(
      enums.length
    );
    expect((source.match(new RegExp(`"${VALUE}"`, "g")) ?? []).length).toBe(
      (source.match(/"non_hereditary_patronymic"/g) ?? []).length
    );
  });

  // @req REQ-133
  it("has a reader-facing label and a glossary entry", () => {
    expect(PATRONYME_VOCABULARY.fr.nameSystem[VALUE]).toBe(
      "Nom de famille héréditaire"
    );
    const entry = GLOSSARY_ENTRIES.find(
      (candidate) => candidate.id === "nom-de-famille-hereditaire"
    );
    expect(entry?.definition).toMatch(/\S/);
    for (const related of entry?.seeAlso ?? []) {
      expect(GLOSSARY_ENTRIES.some((e) => e.id === related)).toBe(true);
    }
  });

  // @req REQ-133
  it("is added by a migration of its own that only widens the enum", () => {
    const files = readdirSync(resolve(root, "supabase/migrations")).filter(
      (name) => name.includes("hereditary_family_name")
    );
    expect(files).toHaveLength(1);
    const sql = readFileSync(
      resolve(root, "supabase/migrations", files[0]),
      "utf8"
    );
    expect(sql).toContain(
      `ALTER TYPE name_system_type ADD VALUE IF NOT EXISTS '${VALUE}'`
    );
    // ADD VALUE cannot be used in the transaction that adds it: the file
    // must not use the value, and must not delete or rewrite anything.
    const statements = sql
      .split("\n")
      .filter((line) => !line.trim().startsWith("--"))
      .join("\n");
    expect(statements).not.toMatch(/\b(DROP|DELETE|UPDATE|INSERT|TRUNCATE)\b/i);
    expect(statements).not.toMatch(/BEGIN|COMMIT/i);
  });
});
