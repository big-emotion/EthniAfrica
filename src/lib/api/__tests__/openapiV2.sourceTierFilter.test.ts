import { describe, expect, it } from "vitest";

import { listSourcesQuerySchema } from "@/api/v2/schemas/sources";
import { swaggerSpecV2 } from "@/lib/api/openapiV2";
import { SOURCE_TIER_STATES } from "@/types/sources";

interface ParameterObject {
  name: string;
  in: string;
  schema: { enum?: string[] };
}

const spec = swaggerSpecV2 as {
  paths: Record<string, { get: { parameters: ParameterObject[] } }>;
};

function documentedTierFilter(): string[] {
  const parameter = spec.paths["/api/v2/sources"].get.parameters.find(
    (candidate) => candidate.in === "query" && candidate.name === "tier"
  );
  return [...(parameter?.schema.enum ?? [])].sort();
}

/**
 * The published contract and the validator are two copies of one list. A
 * standing zod accepts and the spec omits is a filter no integrator can
 * discover; one the spec lists and zod refuses is a documented 400.
 */
describe("GET /api/v2/sources tier filter", () => {
  // @req REQ-092
  it("documents exactly the standings the query validator accepts", () => {
    expect(documentedTierFilter()).toEqual([...SOURCE_TIER_STATES].sort());

    for (const standing of SOURCE_TIER_STATES) {
      expect(
        listSourcesQuerySchema.safeParse({ tier: standing }).success,
        standing
      ).toBe(true);
    }
    expect(
      listSourcesQuerySchema.safeParse({ tier: "authoritative" }).success
    ).toBe(false);
  });
});
