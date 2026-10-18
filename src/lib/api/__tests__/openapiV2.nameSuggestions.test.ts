// @req REQ-200
import { describe, expect, it } from "vitest";
import { swaggerSpecV2 } from "@/lib/api/openapiV2";

describe("name suggestions OpenAPI contract", () => {
  // @req REQ-200
  it("documents the additive prefix endpoint and all six subject types", () => {
    const operation = swaggerSpecV2.paths["/api/v2/names/suggest"].get;
    expect(operation.parameters).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: "q",
          required: true,
          schema: expect.objectContaining({ minLength: 2 }),
        }),
        expect.objectContaining({
          name: "limit",
          schema: expect.objectContaining({ default: 8 }),
        }),
      ])
    );
    const schema =
      operation.responses["200"].content["application/json"].schema;
    expect(
      schema.properties.data.properties.suggestions.items.properties.type.enum
    ).toEqual([
      "people",
      "country",
      "family",
      "language",
      "patronyme",
      "place",
    ]);
  });
});
