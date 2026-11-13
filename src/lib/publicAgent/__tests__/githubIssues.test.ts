// @req REQ-178
import { createVerify, generateKeyPairSync } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  createGithubIssuesPort,
  _resetInstallationTokenForTest,
} from "@/lib/publicAgent/githubIssues";

const { privateKey, publicKey } = generateKeyPairSync("rsa", {
  modulusLength: 2048,
  privateKeyEncoding: { type: "pkcs8", format: "pem" },
  publicKeyEncoding: { type: "spki", format: "pem" },
});

const config = {
  repo: "owner/propositions",
  appId: "123",
  installationId: "456",
  privateKey,
};

type Call = { url: string; init: RequestInit };

function stubGithub(
  respond: (url: string, init: RequestInit) => unknown
): Call[] {
  const calls: Call[] = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string, init: RequestInit = {}) => {
      calls.push({ url, init });
      const body = url.includes("/access_tokens")
        ? { token: "ghs_installation", expires_at: "2099-01-01T00:00:00Z" }
        : respond(url, init);
      return new Response(JSON.stringify(body), { status: 200 });
    })
  );
  return calls;
}

describe("createGithubIssuesPort", () => {
  beforeEach(() => _resetInstallationTokenForTest());
  afterEach(() => vi.unstubAllGlobals());

  // @req REQ-178
  it("authenticates as the app with an RS256 JWT, then as the installation", async () => {
    const calls = stubGithub(() => ({ number: 7 }));
    await createGithubIssuesPort(config).createIssue({
      title: "ewe",
      body: "b",
      labels: ["proposition"],
    });

    const tokenCall = calls[0];
    expect(tokenCall.url).toBe(
      "https://api.github.com/app/installations/456/access_tokens"
    );
    const jwt = String(
      (tokenCall.init.headers as Record<string, string>).Authorization
    ).replace("Bearer ", "");
    const [header, claims, signature] = jwt.split(".");
    expect(JSON.parse(Buffer.from(header, "base64url").toString())).toEqual({
      alg: "RS256",
      typ: "JWT",
    });
    expect(JSON.parse(Buffer.from(claims, "base64url").toString()).iss).toBe(
      "123"
    );
    const verifier = createVerify("RSA-SHA256").update(`${header}.${claims}`);
    expect(verifier.verify(publicKey, signature, "base64url")).toBe(true);

    const issueCall = calls[1];
    expect(issueCall.url).toBe(
      "https://api.github.com/repos/owner/propositions/issues"
    );
    expect(
      (issueCall.init.headers as Record<string, string>).Authorization
    ).toBe("Bearer ghs_installation");
  });

  // @req REQ-178
  it("reuses the installation token between calls", async () => {
    const calls = stubGithub(() => ({}));
    const port = createGithubIssuesPort(config);
    await port.addComment(1, "x");
    await port.addComment(1, "y");
    expect(calls.filter((c) => c.url.includes("/access_tokens"))).toHaveLength(
      1
    );
  });

  // @req REQ-178
  it("finds an issue by exact title and label, ignoring near matches", async () => {
    stubGithub(() => ({
      items: [
        { number: 1, title: "ewe nord", labels: [{ name: "proposition" }] },
        { number: 2, title: "ewe", labels: [{ name: "proposition" }] },
      ],
    }));
    const found = await createGithubIssuesPort(config).findIssue({
      title: "ewe",
      label: "proposition",
    });
    expect(found).toEqual({ number: 2, labels: ["proposition"] });
  });

  // @req REQ-178
  it("returns null when no issue has that title", async () => {
    stubGithub(() => ({ items: [] }));
    expect(
      await createGithubIssuesPort(config).findIssue({
        title: "ewe",
        label: "proposition",
      })
    ).toBeNull();
  });

  // @req REQ-178
  it("throws without the response body when GitHub refuses", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) =>
        url.includes("/access_tokens")
          ? new Response(
              JSON.stringify({ token: "t", expires_at: "2099-01-01T00:00:00Z" })
            )
          : new Response("secret detail", { status: 403 })
      )
    );
    await expect(
      createGithubIssuesPort(config).addComment(1, "x")
    ).rejects.toThrow(/403/);
    await expect(
      createGithubIssuesPort(config).addComment(1, "x")
    ).rejects.not.toThrow(/secret detail/);
  });
});
