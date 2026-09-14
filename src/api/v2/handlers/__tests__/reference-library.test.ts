import { describe, expect, it, vi } from "vitest";
import {
  handleAssertionReferenceCreate,
  handleReferenceCreate,
  handleReferenceSearch,
  handleReferenceWorkingAssetCreate,
  type ReferenceLibraryHandlerDependencies,
} from "../reference-library";

const contributor = {
  id: "11111111-1111-4111-8111-111111111111",
  email: "moderation@example.org",
};
const source = {
  id: "22222222-2222-4222-8222-222222222222",
  source_key: "wpp-2025",
  title: "World Population Prospects 2025",
  author: "United Nations",
  year: 2025,
  source_kind: "intergovernmental" as const,
  tier: "official" as const,
  identifiers: { doi: "10.1234/example" },
  publisher: "UN DESA",
  url: "https://population.un.org/wpp/",
};

function dependencies(
  overrides: Partial<ReferenceLibraryHandlerDependencies> = {}
): Partial<ReferenceLibraryHandlerDependencies> {
  return {
    getAuthenticatedReferenceUser: vi.fn().mockResolvedValue(contributor),
    isEmailAllowlisted: vi.fn().mockResolvedValue(true),
    searchReferences: vi.fn().mockResolvedValue([source]),
    createReference: vi.fn().mockResolvedValue({ source, created: true }),
    linkReferenceToAssertion: vi.fn().mockResolvedValue({
      id: "33333333-3333-4333-8333-333333333333",
      assertion_id: "44444444-4444-4444-8444-444444444444",
      source_id: source.id,
      locator_type: "page" as const,
      locator_value: "p. 48",
      review_status: "verified" as const,
    }),
    storeReferenceWorkingAsset: vi.fn().mockResolvedValue({
      id: "55555555-5555-4555-8555-555555555555",
      sourceId: source.id,
      assetKind: "scan" as const,
      filename: "report.pdf",
      contentType: "application/pdf",
      byteSize: 256,
      rightsStatus: "private" as const,
      createdAt: "2026-07-29T12:00:00.000Z",
    }),
    ...overrides,
  };
}

const authenticatedContext = { accessToken: "valid-jwt" };

describe("reference library handler", () => {
  // @req REQ-012
  it("requires an authenticated JWT before a contributor can search", async () => {
    const result = await handleReferenceSearch(
      { q: "population", limit: "10" },
      { accessToken: null },
      dependencies()
    );

    expect(result).toMatchObject({
      status: 401,
      body: { data: null, errors: [{ code: "UNAUTHENTICATED" }] },
    });
  });

  // @req REQ-012
  it("validates reference searches before calling the service", async () => {
    const deps = dependencies();
    const result = await handleReferenceSearch(
      { q: "", limit: "101" },
      authenticatedContext,
      deps
    );

    expect(result.status).toBe(400);
    expect(result.body.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "VALIDATION_ERROR", field: "q" }),
        expect.objectContaining({ code: "VALIDATION_ERROR", field: "limit" }),
      ])
    );
    expect(deps.searchReferences).not.toHaveBeenCalled();
  });

  // @req REQ-012
  it("creates a structured reference and preserves a duplicate result", async () => {
    const deps = dependencies({
      createReference: vi.fn().mockResolvedValue({ source, created: false }),
    });
    const result = await handleReferenceCreate(
      {
        source_key: source.source_key,
        title: source.title,
        authors: ["United Nations"],
        publication_year: 2025,
        source_kind: "intergovernmental",
        tier: "official",
        identifiers: { doi: "10.1234/example" },
        publisher: "UN DESA",
      },
      authenticatedContext,
      deps
    );

    expect(deps.createReference).toHaveBeenCalledWith({
      sourceKey: source.source_key,
      title: source.title,
      authors: ["United Nations"],
      publicationYear: 2025,
      sourceKind: "intergovernmental",
      tier: "official",
      identifiers: { doi: "10.1234/example" },
      publisher: "UN DESA",
      url: null,
    });
    expect(result).toMatchObject({
      status: 200,
      body: { data: { source, created: false }, errors: [] },
    });
  });

  // @req REQ-012
  it("links UUID assertion and source identifiers with a precise locator", async () => {
    const deps = dependencies();
    const result = await handleAssertionReferenceCreate(
      {
        assertion_id: "44444444-4444-4444-8444-444444444444",
        source_id: source.id,
        locator_type: "page",
        locator_value: "p. 48",
      },
      authenticatedContext,
      deps
    );

    expect(deps.linkReferenceToAssertion).toHaveBeenCalledWith(
      "44444444-4444-4444-8444-444444444444",
      source.id,
      { locatorType: "page", locatorValue: "p. 48" }
    );
    expect(result.status).toBe(201);
  });

  // @req REQ-012
  it("returns private asset metadata without binary storage details", async () => {
    const deps = dependencies();
    const result = await handleReferenceWorkingAssetCreate(
      {
        source_id: source.id,
        asset_kind: "scan",
        filename: "report.pdf",
        content_type: "application/pdf",
        byte_size: 256,
        content: new Uint8Array([1, 2, 3]),
      },
      authenticatedContext,
      deps
    );

    expect(deps.storeReferenceWorkingAsset).toHaveBeenCalledWith(
      contributor.id,
      expect.objectContaining({ sourceId: source.id, assetKind: "scan" })
    );
    expect(result).toMatchObject({
      status: 201,
      body: {
        data: expect.objectContaining({
          sourceId: source.id,
          rightsStatus: "private",
        }),
        errors: [],
      },
    });
    expect(JSON.stringify(result.body)).not.toContain("object_path");
    expect(JSON.stringify(result.body)).not.toContain('"content":');
  });
});

describe("reference library writes are reserved to the moderator allowlist", () => {
  const writes = [
    {
      name: "reference creation",
      write: "createReference" as const,
      run: (
        context: { accessToken: string | null },
        deps: Partial<ReferenceLibraryHandlerDependencies>
      ) =>
        handleReferenceCreate(
          {
            source_key: source.source_key,
            title: source.title,
            authors: ["United Nations"],
            publication_year: 2025,
            source_kind: "intergovernmental",
            tier: "official",
          },
          context,
          deps
        ),
    },
    {
      name: "assertion linking",
      write: "linkReferenceToAssertion" as const,
      run: (
        context: { accessToken: string | null },
        deps: Partial<ReferenceLibraryHandlerDependencies>
      ) =>
        handleAssertionReferenceCreate(
          {
            assertion_id: "44444444-4444-4444-8444-444444444444",
            source_id: source.id,
            locator_type: "page",
            locator_value: "p. 48",
          },
          context,
          deps
        ),
    },
    {
      name: "private asset upload",
      write: "storeReferenceWorkingAsset" as const,
      run: (
        context: { accessToken: string | null },
        deps: Partial<ReferenceLibraryHandlerDependencies>
      ) =>
        handleReferenceWorkingAssetCreate(
          {
            source_id: source.id,
            asset_kind: "scan",
            filename: "report.pdf",
            content_type: "application/pdf",
            byte_size: 256,
            content: new Uint8Array([1, 2, 3]),
          },
          context,
          deps
        ),
    },
  ];

  for (const { name, write, run } of writes) {
    // @req REQ-042
    it(`answers ${name} without a bearer token with 401`, async () => {
      const deps = dependencies();
      const result = await run({ accessToken: null }, deps);

      expect(result).toMatchObject({
        status: 401,
        body: { data: null, errors: [{ code: "UNAUTHENTICATED" }] },
      });
      expect(deps[write]).not.toHaveBeenCalled();
    });

    // @req REQ-042
    it(`answers ${name} from a signed-in address off the allowlist with 403`, async () => {
      const deps = dependencies({
        isEmailAllowlisted: vi.fn().mockResolvedValue(false),
      });
      const result = await run(authenticatedContext, deps);

      expect(result).toMatchObject({
        status: 403,
        body: { data: null, errors: [{ code: "UNAUTHORIZED" }] },
      });
      expect(deps.isEmailAllowlisted).toHaveBeenCalledWith(contributor.email);
      expect(deps[write]).not.toHaveBeenCalled();
    });
  }

  // @req REQ-042
  it("leaves searching open to any signed-in session", async () => {
    const deps = dependencies({
      isEmailAllowlisted: vi.fn().mockResolvedValue(false),
    });
    const result = await handleReferenceSearch(
      { q: "population", limit: "10" },
      authenticatedContext,
      deps
    );

    expect(result.status).toBe(200);
    expect(deps.isEmailAllowlisted).not.toHaveBeenCalled();
  });
});
