import { describe, expect, it } from "vitest";
import { swaggerSpecV2 } from "@/lib/api/openapiV2";

interface OperationObject {
  description?: string;
  deprecated?: boolean;
  security?: Array<Record<string, unknown>>;
  responses: Record<string, unknown>;
}

interface OpenApiSpec {
  components: {
    securitySchemes: Record<string, { description?: string }>;
  };
  paths: Record<string, Record<string, OperationObject>>;
}

const spec = swaggerSpecV2 as unknown as OpenApiSpec;

describe("OpenAPI v2 — who may call what", () => {
  // @req REQ-042
  it("describes every reference-library write as reserved to moderators", () => {
    const writes = [
      spec.paths["/api/v2/reference-library"].post,
      spec.paths["/api/v2/reference-library/assertions"].post,
      spec.paths["/api/v2/reference-library/assets"].post,
    ];

    for (const write of writes) {
      expect(write.description).toMatch(/moderator/i);
      expect(write.description).not.toMatch(/authenticated contributor/i);
      expect(write.responses["403"]).toBeDefined();
    }
  });

  // @req REQ-042
  it("says the session scheme alone does not open the moderator allowlist", () => {
    const description = spec.components.securitySchemes.SupabaseJwtAuth
      .description as string;

    expect(description).toMatch(/allowlist/i);
    expect(description).not.toMatch(/authenticated contributor/i);
  });

  // @req REQ-084
  it("documents the search key as optional, like the rest of the keyless API", () => {
    expect(spec.paths["/api/v2/search"].get.security).toEqual([
      { BearerAuth: [] },
      {},
    ]);
  });

  // @req REQ-034
  it("issues public keys on POST and keeps the GET only as a deprecated alias", () => {
    const issue = spec.paths["/api/v2/keys/issue"];

    expect(issue.post).toBeDefined();
    expect(issue.post.deprecated).not.toBe(true);
    expect(issue.post.security).toEqual([]);
    expect(issue.get.deprecated).toBe(true);
  });
});
