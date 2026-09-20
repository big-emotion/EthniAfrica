import { describe, expect, it } from "vitest";

import { GraphApiError, createGraphClient } from "../metaGraph";

const TOKEN = "EAAtest0123456789tokenvalue";

interface Call {
  url: URL;
  init: RequestInit;
}

/**
 * The Graph API is the boundary, so it is the only thing faked: the client is
 * exercised end to end, and the assertions read what would have gone on the wire.
 */
function graphServer(
  respond: (url: URL) => { status?: number; body: unknown }
) {
  const calls: Call[] = [];
  const fetchImpl = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(String(input));
    calls.push({ url, init: init ?? {} });
    const { status = 200, body } = respond(url);
    return new Response(JSON.stringify(body), {
      status,
      headers: { "content-type": "application/json" },
    });
  }) as typeof fetch;
  return { fetchImpl, calls };
}

describe("Graph client — what goes on the wire", () => {
  // @req REQ-032
  it("authenticates with a bearer header and keeps the token out of the URL", async () => {
    const { fetchImpl, calls } = graphServer(() => ({ body: { id: "1" } }));
    const client = createGraphClient({ token: TOKEN, fetchImpl });

    await client.get("me", { fields: "id,name" });

    const [{ url, init }] = calls;
    expect(new Headers(init.headers).get("authorization")).toBe(
      `Bearer ${TOKEN}`
    );
    expect(url.href).not.toContain(TOKEN);
    expect(url.searchParams.has("access_token")).toBe(false);
    expect(url.searchParams.get("fields")).toBe("id,name");
  });

  // @req REQ-032
  it("talks to the versioned Graph host and nowhere else", async () => {
    const { fetchImpl, calls } = graphServer(() => ({ body: {} }));
    const client = createGraphClient({
      token: TOKEN,
      fetchImpl,
      version: "v99.0",
    });

    await client.get("12345/comments");

    expect(calls[0].url.origin).toBe("https://graph.facebook.com");
    expect(calls[0].url.pathname).toBe("/v99.0/12345/comments");
  });

  // @req REQ-032
  it("only ever issues GET requests", async () => {
    const { fetchImpl, calls } = graphServer((url) => ({
      body: url.searchParams.get("after")
        ? { data: [2] }
        : { data: [1], paging: { cursors: { after: "C1" }, next: "x" } },
    }));
    const client = createGraphClient({ token: TOKEN, fetchImpl });

    await client.get("me");
    await client.getAll("1/comments");

    expect(calls.length).toBeGreaterThan(2);
    for (const { init } of calls) {
      expect((init.method ?? "GET").toUpperCase()).toBe("GET");
      expect(init.body).toBeUndefined();
    }
  });

  // @req REQ-032
  it("refuses an empty token before sending anything", () => {
    const { fetchImpl, calls } = graphServer(() => ({ body: {} }));
    expect(() => createGraphClient({ token: "", fetchImpl })).toThrow(/token/i);
    expect(calls).toHaveLength(0);
  });
});

describe("Graph client — paging", () => {
  // @req REQ-032
  it("follows the after cursor and never replays the next URL", async () => {
    // Graph's own `paging.next` embeds an access_token query parameter. Replaying it
    // would put a credential in a URL, so the cursor is rebuilt onto our own request.
    const { fetchImpl, calls } = graphServer((url) =>
      url.searchParams.get("after") === "CUR1"
        ? { body: { data: [3] } }
        : {
            body: {
              data: [1, 2],
              paging: {
                cursors: { after: "CUR1" },
                next: "https://graph.facebook.com/v26.0/1/comments?access_token=LEAKED&after=CUR1",
              },
            },
          }
    );
    const client = createGraphClient({ token: TOKEN, fetchImpl });

    const all = await client.getAll<number>("1/comments", { limit: 2 });

    expect(all).toEqual([1, 2, 3]);
    expect(calls).toHaveLength(2);
    for (const { url } of calls) {
      expect(url.href).not.toContain("LEAKED");
      expect(url.searchParams.has("access_token")).toBe(false);
    }
    expect(calls[1].url.searchParams.get("limit")).toBe("2");
  });

  // @req REQ-032
  it("stops rather than page forever", async () => {
    const { fetchImpl } = graphServer(() => ({
      body: { data: [1], paging: { cursors: { after: "SAME" }, next: "x" } },
    }));
    const client = createGraphClient({ token: TOKEN, fetchImpl, maxPages: 3 });

    await expect(client.getAll("1/comments")).rejects.toThrow(
      /more than 3 pages/
    );
  });
});

async function failureOf(request: Promise<unknown>): Promise<GraphApiError> {
  try {
    await request;
  } catch (error) {
    return error as GraphApiError;
  }
  throw new Error("The request was expected to fail.");
}

describe("Graph client — errors", () => {
  // @req REQ-032
  it("turns a Graph error into a GraphApiError carrying its code and subcode", async () => {
    const { fetchImpl } = graphServer(() => ({
      status: 400,
      body: {
        error: { message: "(#100) bad field", code: 100, error_subcode: 33 },
      },
    }));
    const client = createGraphClient({ token: TOKEN, fetchImpl });

    const failure = await failureOf(client.get("1"));

    expect(failure).toBeInstanceOf(GraphApiError);
    expect(failure.status).toBe(400);
    expect(failure.code).toBe(100);
    expect(failure.subcode).toBe(33);
    expect(failure.message).toContain("(#100) bad field");
  });

  // @req REQ-032
  it("never lets the token reach an error message", async () => {
    const { fetchImpl } = graphServer(() => ({
      status: 401,
      body: {
        error: { message: `Invalid OAuth access token ${TOKEN}`, code: 190 },
      },
    }));
    const client = createGraphClient({ token: TOKEN, fetchImpl });

    const failure = await failureOf(client.get("me"));

    expect(failure.message).not.toContain(TOKEN);
    expect(failure.message).toContain("[redacted]");
  });
});
