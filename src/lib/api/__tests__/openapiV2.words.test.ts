import { describe, expect, it } from "vitest";

import { validateAgainstSchema } from "@/app/api/v2/__tests__/helpers/openapiValidator";
import { loadAllWordFiches } from "@/lib/afrik/loaders/wordJsonLoader";
import { swaggerSpecV2 } from "@/lib/api/openapiV2";

const WORD_REF = { $ref: "#/components/schemas/WordV2" };

describe("OpenAPI v2 word contract", () => {
  // Checked against the corpus' own word fiche, so a nameHistory shape the
  // spec cannot describe fails here rather than in a client.
  // @req REQ-196
  it("describes WRD_RACE as the detail endpoint serves it", () => {
    const word = loadAllWordFiches().words.find(({ id }) => id === "WRD_RACE");
    expect(word).toBeDefined();

    const served = {
      id: word.id,
      nameMain: word.nameMain,
      names: [word.nameMain],
      wordLanguage: word.wordLanguage,
      definition: word.definition,
      relatedSubjects: word.content.relatedSubjects,
      gaps: word.content.gaps,
      sources: word.content.sources,
      nameHistory: word.nameHistory,
    };

    expect(validateAgainstSchema(WORD_REF, served)).toBeNull();
  });

  // @req REQ-196
  it("documents both word endpoints and the words facet of search", () => {
    const spec = swaggerSpecV2 as unknown as {
      paths: Record<string, unknown>;
      components: { schemas: Record<string, { properties?: object }> };
    };

    expect(spec.paths).toHaveProperty("/api/v2/words");
    expect(spec.paths).toHaveProperty("/api/v2/words/{id}");
    expect(
      Object.values(spec.components.schemas).some(
        (schema) =>
          schema.properties &&
          "words" in schema.properties &&
          "wordsTotal" in schema.properties
      )
    ).toBe(true);
  });
});
