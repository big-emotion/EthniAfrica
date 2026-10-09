import { describe, expect, it } from "vitest";

import { validateAgainstSchema } from "@/app/api/v2/__tests__/helpers/openapiValidator";
import { VALID_NAME_HISTORY } from "@/lib/afrik/parsers/__tests__/fixtures";
import { swaggerSpecV2 } from "@/lib/api/openapiV2";

interface SchemaObject {
  required?: string[];
  properties?: Record<string, { $ref?: string }>;
}

const schemas = (
  swaggerSpecV2 as unknown as {
    components: { schemas: Record<string, SchemaObject> };
  }
).components.schemas;

const NAME_HISTORY_REF = { $ref: "#/components/schemas/NameHistoryV2" };

const SUBJECT_SCHEMAS = [
  "PeopleV2",
  "CountryV2",
  "LanguageFamilyV2",
  "LanguageV2",
  "PatronymeV2",
];

describe("OpenAPI v2 nameHistory contract", () => {
  // @req REQ-196
  it.each(SUBJECT_SCHEMAS)(
    "%s carries an optional nameHistory in the one shared shape",
    (schemaName) => {
      const schema = schemas[schemaName];

      expect(schema.properties?.nameHistory).toEqual(NAME_HISTORY_REF);
      expect(schema.required ?? []).not.toContain("nameHistory");
    }
  );

  // @req REQ-196
  it("accepts a block the shared parser accepts", () => {
    expect(
      validateAgainstSchema(NAME_HISTORY_REF, VALID_NAME_HISTORY)
    ).toBeNull();
  });

  // @req REQ-195
  it("accepts an oral source with no URL and no page", () => {
    const [source] = VALID_NAME_HISTORY.names[0].accounts[0].sources;

    expect(source.url).toBeNull();
    expect(source).not.toHaveProperty("page");
    expect(
      validateAgainstSchema(NAME_HISTORY_REF, VALID_NAME_HISTORY)
    ).toBeNull();
  });

  // @req REQ-196
  it("rejects a source that does not say what kind of source it is", () => {
    const block = structuredClone(VALID_NAME_HISTORY);
    delete (block.names[0].accounts[0].sources[0] as { source_kind?: string })
      .source_kind;

    expect(validateAgainstSchema(NAME_HISTORY_REF, block)).not.toBeNull();
  });
});
