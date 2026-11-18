import { describe, expect, it } from "vitest";

import { swaggerSpecV2 } from "@/lib/api/openapiV2";

interface SchemaObject {
  $ref?: string;
  type?: string | string[];
  maxLength?: number;
  enum?: string[];
  properties?: Record<string, SchemaObject>;
  items?: SchemaObject;
}

interface OperationObject {
  security?: Array<Record<string, unknown>>;
  parameters?: Array<{ name: string; in: string; required?: boolean }>;
  responses: Record<string, unknown>;
}

interface OpenApiSpec {
  components: {
    schemas: Record<string, SchemaObject>;
    securitySchemes: Record<string, { type: string; in?: string }>;
  };
  paths: Record<string, Record<string, OperationObject>>;
}

const spec = swaggerSpecV2 as unknown as OpenApiSpec;
const schemas = spec.components.schemas;

describe("OpenAPI v2 — block comments", () => {
  // @req REQ-212
  it("documents the comment read as keyless, driven by block_keys", () => {
    const list = spec.paths["/api/v2/comments"].get;

    expect(list.security).toEqual([{ BearerAuth: [] }, {}]);
    expect(list.parameters).toContainEqual(
      expect.objectContaining({
        name: "block_keys",
        in: "query",
        required: true,
      })
    );
    expect(list.responses["200"]).toBeDefined();
    expect(list.responses["400"]).toBeDefined();
  });

  /**
   * The public payload is what a stranger may read about a reader: their
   * pseudonym, never their address, account or the internal field path.
   */
  // @req REQ-212
  it("publishes no address, account id or field path in a thread", () => {
    const forbidden = [
      "email",
      "reporter_email",
      "contributor_id",
      "author_id",
      "target_field_path",
      "assertion_field_path",
      "contribution_payload",
      "hidden_reason",
    ];

    for (const name of ["CommentThread", "CommentReply", "BlockComments"]) {
      const properties = Object.keys(schemas[name].properties ?? {});
      for (const field of forbidden) {
        expect(properties, `${name}.${field}`).not.toContain(field);
      }
    }
  });

  // @req REQ-212
  it("documents a reply as requiring a reader session cookie, never a bearer", () => {
    const reply = spec.paths["/api/v2/comments/{id}/replies"].post;

    expect(spec.components.securitySchemes.ReaderSessionCookie).toMatchObject({
      type: "apiKey",
      in: "cookie",
    });
    expect(reply.security).toEqual([{ ReaderSessionCookie: [] }]);
    expect(reply.responses["401"]).toBeDefined();
    expect(reply.responses["429"]).toBeDefined();
  });

  // @req REQ-212
  it("documents both reports as anonymous and guarded by proof of work", () => {
    for (const path of [
      "/api/v2/comments/{id}/report",
      "/api/v2/comments/{id}/replies/{replyId}/report",
    ]) {
      const report = spec.paths[path].post;
      expect(report.security, path).toEqual([]);
      for (const status of ["201", "403", "404", "429", "503"]) {
        expect(report.responses[status], `${path} ${status}`).toBeDefined();
      }
    }
  });

  // @req REQ-212
  it("documents the comment fields of the flag body", () => {
    const input = schemas.FlagCreateInput.properties;

    expect(input.block_key).toBeDefined();
    expect(input.display_name.maxLength).toBe(40);
    expect(input.knowledge_basis.enum).toEqual([
      "family",
      "language",
      "reading",
      "other",
    ]);
    expect(input.age_confirmed.type).toBe("boolean");
  });
});
