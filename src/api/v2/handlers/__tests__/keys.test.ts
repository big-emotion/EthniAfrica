import { beforeEach, describe, expect, it, vi } from "vitest";
import { getKeyPrefix } from "@/lib/api/auth";
import {
  handleKeyCreate,
  handleKeyList,
  handleKeyRevoke,
  handlePublicKeyIssue,
} from "@/api/v2/handlers/keys";

const user = { id: "user-1" };

const keySummary = {
  id: "key-1",
  label: "CI script",
  tier: "public" as const,
  active: true,
  key_prefix: "usr_abcdef012345678901", // gitleaks:allow
  created_at: "2026-01-01T00:00:00.000Z",
  last_used_at: null,
  expires_at: null,
  revoked_at: null,
};

function makeDependencies() {
  return {
    getAuthenticatedUser: vi.fn().mockResolvedValue(user),
    listUserApiKeys: vi.fn().mockResolvedValue([keySummary]),
    createUserApiKey: vi
      .fn()
      .mockResolvedValue({ ...keySummary, key: "usr_rawvalue" }),
    revokeUserApiKey: vi.fn().mockResolvedValue("revoked" as const),
  };
}

describe("key handlers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("handleKeyList", () => {
    // @req REQ-056
    it("returns 401 without an access token", async () => {
      const dependencies = makeDependencies();
      const result = await handleKeyList({ accessToken: null }, dependencies);

      expect(result.status).toBe(401);
      expect(dependencies.listUserApiKeys).not.toHaveBeenCalled();
    });

    // @req REQ-056
    it("returns 401 when the token does not resolve to a user", async () => {
      const dependencies = makeDependencies();
      dependencies.getAuthenticatedUser.mockResolvedValue(null);

      const result = await handleKeyList(
        { accessToken: "invalid" },
        dependencies
      );

      expect(result.status).toBe(401);
    });

    // @req REQ-056
    it("returns the caller's own keys", async () => {
      const dependencies = makeDependencies();
      const result = await handleKeyList(
        { accessToken: "valid-jwt" },
        dependencies
      );

      expect(result.status).toBe(200);
      expect(result.body).toMatchObject({ data: [keySummary] });
      expect(dependencies.listUserApiKeys).toHaveBeenCalledWith(user.id);
    });
  });

  describe("handleKeyCreate", () => {
    // @req REQ-056
    it("returns 401 without an access token", async () => {
      const dependencies = makeDependencies();
      const result = await handleKeyCreate(
        { accessToken: null },
        { label: "Local dev" },
        dependencies
      );

      expect(result.status).toBe(401);
      expect(dependencies.createUserApiKey).not.toHaveBeenCalled();
    });

    // @req REQ-056
    it("returns 400 when the label is missing", async () => {
      const dependencies = makeDependencies();
      const result = await handleKeyCreate(
        { accessToken: "valid-jwt" },
        {},
        dependencies
      );

      expect(result.status).toBe(400);
      expect(dependencies.createUserApiKey).not.toHaveBeenCalled();
    });

    // @req REQ-056
    it("creates a key scoped to the caller and returns the raw key once", async () => {
      const dependencies = makeDependencies();
      const result = await handleKeyCreate(
        { accessToken: "valid-jwt" },
        { label: "Local dev" },
        dependencies
      );

      expect(result.status).toBe(201);
      expect(dependencies.createUserApiKey).toHaveBeenCalledWith(
        user.id,
        "Local dev"
      );
      expect(result.body).toMatchObject({
        data: { key: "usr_rawvalue" },
      });
    });
  });

  describe("handleKeyRevoke", () => {
    // @req REQ-056
    it("returns 401 without an access token", async () => {
      const dependencies = makeDependencies();
      const result = await handleKeyRevoke(
        { accessToken: null },
        "key-1",
        dependencies
      );

      expect(result.status).toBe(401);
      expect(dependencies.revokeUserApiKey).not.toHaveBeenCalled();
    });

    // @req REQ-056
    it("returns 404 when the key is not owned by the caller", async () => {
      const dependencies = makeDependencies();
      dependencies.revokeUserApiKey.mockResolvedValue("not_found" as const);

      const result = await handleKeyRevoke(
        { accessToken: "valid-jwt" },
        "someone-elses-key",
        dependencies
      );

      expect(result.status).toBe(404);
    });

    // @req REQ-056
    it("revokes the caller's key", async () => {
      const dependencies = makeDependencies();
      const result = await handleKeyRevoke(
        { accessToken: "valid-jwt" },
        "key-1",
        dependencies
      );

      expect(result.status).toBe(200);
      expect(dependencies.revokeUserApiKey).toHaveBeenCalledWith(
        user.id,
        "key-1"
      );
    });
  });

  describe("handlePublicKeyIssue", () => {
    const storedHash = "pbkdf2v1:600000:c2FsdA==:0123abcd";

    function makeIssuanceDependencies() {
      return {
        hasActivePublicKeyForIp: vi.fn().mockResolvedValue(false),
        insertPublicKey: vi.fn().mockResolvedValue(undefined),
        hashApiKey: vi.fn().mockResolvedValue(storedHash),
      };
    }

    // @req REQ-034
    it("issues a public key bound to the address and returns it once", async () => {
      const dependencies = makeIssuanceDependencies();

      const result = await handlePublicKeyIssue(
        { clientIp: "203.0.113.9" },
        dependencies
      );

      expect(result.status).toBe(201);
      expect(result.body.data).toMatchObject({ tier: "public" });
      const issued = result.body.data as { key: string };
      expect(issued.key.startsWith("pub_")).toBe(true);
      expect(dependencies.insertPublicKey).toHaveBeenCalledWith({
        keyHash: storedHash,
        keyPrefix: getKeyPrefix(issued.key),
        ipAddress: "203.0.113.9",
      });
    });

    // @req REQ-034
    it("never puts the stored hash or the address in the response", async () => {
      const result = await handlePublicKeyIssue(
        { clientIp: "203.0.113.9" },
        makeIssuanceDependencies()
      );

      const serialized = JSON.stringify(result.body);
      expect(serialized).not.toContain(storedHash);
      expect(serialized).not.toContain("203.0.113.9");
    });

    // The lookup is a cheap indexed read; the hash is 600,000 PBKDF2 rounds.
    // An address that already has a key must never reach the hash.
    // @req REQ-034
    it("refuses with 409 before hashing when the address already holds a key", async () => {
      const dependencies = makeIssuanceDependencies();
      dependencies.hasActivePublicKeyForIp.mockResolvedValue(true);

      const result = await handlePublicKeyIssue(
        { clientIp: "203.0.113.9" },
        dependencies
      );

      expect(result.status).toBe(409);
      expect(result.body.errors[0].code).toBe("RATE_LIMITED");
      expect(dependencies.hashApiKey).not.toHaveBeenCalled();
      expect(dependencies.insertPublicKey).not.toHaveBeenCalled();
    });

    // Without an address the one-key-per-IP rule cannot be applied, and
    // issuing anyway would make the endpoint unlimited.
    // @req REQ-034
    it("refuses with 400 when the client address is unknown", async () => {
      const dependencies = makeIssuanceDependencies();

      const result = await handlePublicKeyIssue(
        { clientIp: null },
        dependencies
      );

      expect(result.status).toBe(400);
      expect(dependencies.hasActivePublicKeyForIp).not.toHaveBeenCalled();
      expect(dependencies.hashApiKey).not.toHaveBeenCalled();
      expect(dependencies.insertPublicKey).not.toHaveBeenCalled();
    });

    // @req REQ-034
    it("lets a storage failure reach the route, which answers 500", async () => {
      const dependencies = makeIssuanceDependencies();
      dependencies.insertPublicKey.mockRejectedValue(new Error("db down"));

      await expect(
        handlePublicKeyIssue({ clientIp: "203.0.113.9" }, dependencies)
      ).rejects.toThrow("db down");
    });
  });
});
