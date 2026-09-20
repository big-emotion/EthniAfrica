import { describe, expect, it } from "vitest";

import { searchCompanionsDataSchema } from "@/api/v2/schemas/searchCompanions";
import { generateExample } from "@/app/api/v2/__tests__/helpers/openapiValidator";
import { swaggerSpecV2 } from "@/lib/api/openapiV2";

interface SchemaObject {
  type?: string | string[];
  enum?: string[];
  minimum?: number;
  maximum?: number;
  maxItems?: number;
  required?: string[];
  properties?: Record<string, SchemaObject>;
  items?: SchemaObject;
  oneOf?: SchemaObject[];
  $ref?: string;
  default?: unknown;
}

interface OpenApiParameter {
  in?: string;
  name?: string;
  required?: boolean;
  schema?: SchemaObject;
  description?: string;
  example?: unknown;
}

interface OpenApiOperation {
  parameters?: OpenApiParameter[];
  responses?: Record<
    string,
    {
      content?: Record<
        string,
        {
          schema?: SchemaObject;
          examples?: Record<string, { value?: { data?: unknown } }>;
        }
      >;
    }
  >;
}

interface OpenApiSpec {
  components: { schemas: Record<string, SchemaObject> };
  paths: Record<string, { get?: OpenApiOperation }>;
}

const spec = swaggerSpecV2 as unknown as OpenApiSpec;
const schemas = spec.components.schemas;

const SUBJECT_TYPES = [
  "people",
  "country",
  "languageFamily",
  "language",
  "patronyme",
];
const RELATIONS = [
  "exact",
  "linked-family",
  "linked-people",
  "linked-country",
  "recent",
];
const QUIZ_TEMPLATE_IDS = [
  "T1",
  "T2",
  "T3",
  "T4",
  "T6",
  "T7",
  "T8",
  "T9",
  "T10",
  "T11",
  "T12",
  "T13",
  "T14",
  "T15",
  "T16",
  "T17",
  "T18",
];

describe("OpenAPI v2 search companions contract", () => {
  // @req REQ-180
  it("documents typed subjects and item-level widening provenance", () => {
    expect(schemas.SearchCompanionSubject).toMatchObject({
      type: "object",
      required: ["entityType", "entityId"],
      properties: {
        entityType: { type: "string", enum: SUBJECT_TYPES },
        entityId: { type: "string" },
      },
    });
    expect(schemas.SearchCompanionMatch).toMatchObject({
      type: "object",
      required: ["relation", "entityType", "entityId"],
      properties: {
        relation: { type: "string", enum: RELATIONS },
        entityType: { type: "string", enum: SUBJECT_TYPES },
        entityId: { type: "string" },
      },
    });
  });

  // @req REQ-180
  it("requires a match on every companion item schema", () => {
    const requiredFields = {
      SearchCompanionShort: [
        "id",
        "href",
        "name",
        "description",
        "publishedAt",
        "durationSeconds",
        "watchUrl",
        "poster",
        "source",
        "match",
      ],
      SearchCompanionAnecdote: [
        "id",
        "contentLanguage",
        "headline",
        "body",
        "tier",
        "sources",
        "illustration",
        "match",
      ],
      SearchCompanionProverb: [
        "id",
        "contentLanguage",
        "text",
        "meaning",
        "original",
        "origin",
        "sources",
        "match",
      ],
      SearchCompanionImage: [
        "id",
        "href",
        "slug",
        "title",
        "description",
        "caption",
        "image",
        "generation",
        "source",
        "match",
      ],
      SearchCompanionQuiz: [
        "id",
        "templateId",
        "contentLanguage",
        "prompt",
        "stimulus",
        "options",
        "correctOption",
        "explanation",
        "assertionId",
        "source",
        "entity",
        "match",
      ],
    };

    for (const [name, required] of Object.entries(requiredFields)) {
      expect(schemas[name]?.required, `${name}.required`).toEqual(required);
      expect(schemas[name]?.properties?.match, `${name}.match`).toEqual({
        $ref: "#/components/schemas/SearchCompanionMatch",
      });
    }
  });

  // @req REQ-180
  it("documents poster accessibility and the canonical quiz bounds", () => {
    expect(schemas.SearchCompanionPoster).toMatchObject({
      required: ["src", "alt", "width", "height"],
      properties: { alt: { type: "string", minLength: 1 } },
    });
    expect(schemas.SearchCompanionQuiz).toMatchObject({
      properties: {
        templateId: { type: "string", enum: QUIZ_TEMPLATE_IDS },
        correctOption: { type: "integer", minimum: 0, maximum: 3 },
      },
    });
  });

  // @req REQ-180
  it("bounds each item selection and exposes its total count", () => {
    const maximums = {
      SearchCompanionShortSelection: [6, "SearchCompanionShort"],
      SearchCompanionAnecdoteSelection: [3, "SearchCompanionAnecdote"],
      SearchCompanionProverbSelection: [2, "SearchCompanionProverb"],
      SearchCompanionImageSelection: [1, "SearchCompanionImage"],
    };

    for (const [name, [maximum, item]] of Object.entries(maximums)) {
      expect(schemas[name]).toMatchObject({
        type: "object",
        required: ["count", "items"],
        properties: {
          count: { type: "integer", minimum: 0 },
          items: {
            type: "array",
            maxItems: maximum,
            items: { $ref: `#/components/schemas/${item}` },
          },
        },
      });
    }

    expect(schemas.SearchCompanionQuizSelection).toMatchObject({
      type: "object",
      required: ["count", "item"],
      properties: {
        count: { type: "integer", minimum: 0 },
        item: {
          oneOf: [
            { $ref: "#/components/schemas/SearchCompanionQuiz" },
            { type: "null" },
          ],
        },
      },
    });
  });

  // @req REQ-180
  it("documents the bounded companion data and Module #0 success envelope", () => {
    expect(schemas.SearchCompanionsData).toMatchObject({
      type: "object",
      required: [
        "subjects",
        "shorts",
        "anecdotes",
        "proverbs",
        "images",
        "quiz",
      ],
      properties: {
        subjects: { type: "array", maxItems: 20 },
        shorts: {
          $ref: "#/components/schemas/SearchCompanionShortSelection",
        },
        anecdotes: {
          $ref: "#/components/schemas/SearchCompanionAnecdoteSelection",
        },
        proverbs: {
          $ref: "#/components/schemas/SearchCompanionProverbSelection",
        },
        images: {
          $ref: "#/components/schemas/SearchCompanionImageSelection",
        },
        quiz: {
          $ref: "#/components/schemas/SearchCompanionQuizSelection",
        },
      },
    });
    expect(schemas.SearchCompanionsResponse).toMatchObject({
      type: "object",
      required: ["data", "meta", "errors"],
      properties: {
        data: { $ref: "#/components/schemas/SearchCompanionsData" },
        meta: { $ref: "#/components/schemas/ApiResponseMeta" },
        errors: { type: "array", maxItems: 0 },
      },
    });
  });

  // @req REQ-180
  it("generates companion data accepted by the runtime response schema", () => {
    const example = generateExample({
      $ref: "#/components/schemas/SearchCompanionsData",
    });

    expect(searchCompanionsDataSchema.safeParse(example).success).toBe(true);
  });

  // @req REQ-180
  it("documents the typed-subject query and public response statuses", () => {
    const operation = spec.paths["/api/v2/search/companions"]?.get;

    expect(operation).toBeDefined();
    if (!operation) throw new Error("Missing companions operation");

    const subjects = operation.parameters?.find(
      (parameter) => parameter.in === "query" && parameter.name === "subjects"
    );
    const lang = operation.parameters?.find(
      (parameter) => parameter.in === "query" && parameter.name === "lang"
    );

    expect(subjects).toMatchObject({
      required: false,
      schema: { type: "string" },
    });
    expect(subjects?.description).toMatch(/type:id/i);
    expect(subjects?.description).toMatch(/20/);
    expect(subjects?.example).toBeDefined();
    expect(lang).toMatchObject({
      required: false,
      schema: { type: "string", enum: ["en", "fr"], default: "fr" },
    });
    expect(
      operation.responses?.["200"]?.content?.["application/json"]?.schema
    ).toEqual({ $ref: "#/components/schemas/SearchCompanionsResponse" });
    expect(Object.keys(operation.responses ?? {}).sort()).toEqual([
      "200",
      "400",
      "429",
      "500",
    ]);
  });

  // @req REQ-180
  it("documents valid exact, widened, sparse and empty responses", () => {
    const examples =
      spec.paths["/api/v2/search/companions"]?.get?.responses?.["200"]
        ?.content?.["application/json"]?.examples;

    expect(Object.keys(examples ?? {})).toEqual([
      "exact",
      "widened",
      "sparse",
      "empty",
    ]);
    for (const [name, example] of Object.entries(examples ?? {})) {
      expect(
        searchCompanionsDataSchema.safeParse(example.value?.data).success,
        name
      ).toBe(true);
    }
  });
});
