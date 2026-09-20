import { describe, expect, it } from "vitest";

import { GraphApiError, createGraphClient } from "../metaGraph";
import {
  readFacebookComments,
  readFacebookInsights,
  readInstagramComments,
  readInstagramInsights,
} from "../metaReaders";

const TOKEN = "EAAtest0123456789tokenvalue";
const PAGE = "PAGE1";
const IG = "IG1";

interface Reply {
  status?: number;
  body: unknown;
}

function clientFor(respond: (url: URL) => Reply) {
  const seen: URL[] = [];
  const fetchImpl = (async (input: RequestInfo | URL) => {
    const url = new URL(String(input));
    seen.push(url);
    const { status = 200, body } = respond(url);
    return new Response(JSON.stringify(body), { status });
  }) as typeof fetch;
  return { client: createGraphClient({ token: TOKEN, fetchImpl }), seen };
}

const invalidMetric = (metric: string): Reply => ({
  status: 400,
  body: {
    error: {
      message: `(#100) ${metric} is not a valid insights metric`,
      code: 100,
    },
  },
});

describe("Facebook comments", () => {
  // @req REQ-032
  it("returns comments and replies flat, marking each reply with its parent", async () => {
    const { client, seen } = clientFor(() => ({
      body: {
        data: [
          {
            id: "c1",
            message: "Top level",
            created_time: "2026-09-17T10:00:00+0000",
            like_count: 4,
            from: { id: "P", name: "EthniAfrica" },
          },
          {
            id: "c2",
            message: "A reply",
            created_time: "2026-09-17T11:00:00+0000",
            like_count: 0,
            parent: { id: "c1" },
          },
          // Sticker and photo comments carry no `message`.
          { id: "c3", created_time: "2026-09-17T12:00:00+0000" },
        ],
      },
    }));

    const comments = await readFacebookComments(client, "POST1");

    expect(comments).toEqual([
      {
        id: "c1",
        parentId: null,
        text: "Top level",
        createdAt: "2026-09-17T10:00:00+0000",
        likeCount: 4,
        author: "EthniAfrica",
      },
      {
        id: "c2",
        parentId: "c1",
        text: "A reply",
        createdAt: "2026-09-17T11:00:00+0000",
        likeCount: 0,
        // Facebook withholds `from` on everyone but the Page itself.
        author: null,
      },
      {
        id: "c3",
        parentId: null,
        text: "",
        createdAt: "2026-09-17T12:00:00+0000",
        likeCount: 0,
        author: null,
      },
    ]);
    // `stream` is what returns replies flat instead of only top-level comments.
    expect(seen[0].searchParams.get("filter")).toBe("stream");
  });
});

describe("Facebook comments — authors", () => {
  // @req REQ-032
  it("keeps the comments Facebook drops when the author is requested", async () => {
    // Measured on a real reel: asking for `from{id,name}` returned 68 of 71
    // comments. The three missing had no resolvable author (no text either), so
    // the listing never asks for it and authors are read in a second pass.
    const at = "2026-09-17T10:00:00+0000";
    const { client, seen } = clientFor((url) => {
      const withAuthor = (url.searchParams.get("fields") ?? "").includes(
        "from"
      );
      return {
        body: {
          data: withAuthor
            ? [
                {
                  id: "c1",
                  created_time: at,
                  from: { id: "P", name: "EthniAfrica" },
                },
              ]
            : [
                { id: "c1", message: "Top", created_time: at },
                { id: "c3", created_time: at },
              ],
        },
      };
    });

    const comments = await readFacebookComments(client, "POST1");

    expect(comments.map((comment) => comment.id)).toEqual(["c1", "c3"]);
    expect(comments[0].author).toBe("EthniAfrica");
    expect(comments[1].author).toBeNull();
    const listings = seen.filter(
      (url) => !(url.searchParams.get("fields") ?? "").includes("from")
    );
    expect(listings).toHaveLength(1);
  });
});

describe("Instagram comments", () => {
  // @req REQ-032
  it("flattens replies under the comment they answer", async () => {
    const { client } = clientFor(() => ({
      body: {
        data: [
          {
            id: "i1",
            text: "Nice",
            timestamp: "2026-09-18T08:00:00+0000",
            username: "reader",
            like_count: 2,
            replies: {
              data: [
                {
                  id: "i2",
                  text: "Thanks",
                  timestamp: "2026-09-18T09:00:00+0000",
                  username: "ethniafrica",
                  like_count: 0,
                },
              ],
            },
          },
        ],
      },
    }));

    const comments = await readInstagramComments(client, "M1");

    expect(comments.map((c) => [c.id, c.parentId, c.author, c.text])).toEqual([
      ["i1", null, "reader", "Nice"],
      ["i2", "i1", "ethniafrica", "Thanks"],
    ]);
  });
});

describe("Facebook insights", () => {
  const serve = (url: URL): Reply => {
    const metric = url.searchParams.get("metric");
    if (!url.pathname.endsWith("/insights")) {
      return { body: { followers_count: 5878, id: PAGE } };
    }
    if (metric === "page_impressions") return invalidMetric(metric);
    return {
      body: {
        data: [
          {
            name: metric,
            values: [{ value: 9088, end_time: "2026-09-19T07:00:00+0000" }],
          },
        ],
      },
    };
  };

  // @req REQ-032
  it("reports a metric Meta has retired as unavailable and still returns the others", async () => {
    // Meta renames and retires Page metrics without notice (`page_impressions`
    // already went), so one dead name must not sink the whole report.
    const { client } = clientFor(serve);

    const report = await readFacebookInsights(client, PAGE, [
      "page_media_view",
      "page_impressions",
    ]);

    expect(report.followers).toBe(5878);
    expect(report.metrics).toEqual([
      {
        metric: "page_media_view",
        ok: true,
        values: [{ value: 9088, endTime: "2026-09-19T07:00:00+0000" }],
      },
      {
        metric: "page_impressions",
        ok: false,
        error: "(#100) page_impressions is not a valid insights metric",
      },
    ]);
  });

  // @req REQ-032
  it("does not hide a dead token behind an unavailable metric", async () => {
    // Only "this metric does not exist" is recoverable. An expired token
    // answering every metric with an error must fail the run, or the report
    // would be silently empty.
    const { client } = clientFor((url) =>
      url.pathname.endsWith("/insights")
        ? {
            status: 401,
            body: { error: { message: "Session has expired", code: 190 } },
          }
        : { body: { followers_count: 5878 } }
    );

    await expect(
      readFacebookInsights(client, PAGE, ["page_media_view"])
    ).rejects.toBeInstanceOf(GraphApiError);
  });
});

describe("Instagram insights", () => {
  const serve = (url: URL): Reply => {
    const metric = url.searchParams.get("metric");
    if (url.pathname.endsWith(`/${IG}`)) {
      return {
        body: {
          id: IG,
          username: "ethniafrica",
          followers_count: 1199,
          media_count: 51,
        },
      };
    }
    if (url.pathname.endsWith(`/${IG}/media`)) {
      return {
        body: {
          data: [
            {
              id: "m1",
              timestamp: "2026-09-19T10:00:00+0000",
              media_type: "VIDEO",
              media_product_type: "REELS",
              comments_count: 1,
              like_count: 10,
            },
            {
              id: "m2",
              timestamp: "2026-09-18T10:00:00+0000",
              media_type: "IMAGE",
              media_product_type: "FEED",
              comments_count: 0,
              like_count: 3,
            },
          ],
        },
      };
    }
    if (url.pathname.endsWith("/m2/insights") && metric === "shares") {
      return invalidMetric("shares");
    }
    if (url.searchParams.get("metric_type") === "total_value") {
      return {
        body: { data: [{ name: metric, total_value: { value: 777 } }] },
      };
    }
    return {
      body: {
        data: [
          {
            name: metric,
            values: [{ value: 5, end_time: "2026-09-19T07:00:00+0000" }],
          },
        ],
      },
    };
  };

  // @req REQ-032
  it("reads the profile, the account metrics and per-post metrics, tolerating one unsupported metric", async () => {
    const { client } = clientFor(serve);

    const report = await readInstagramInsights(client, IG, { recentMedia: 2 });

    expect(report.profile).toEqual({
      username: "ethniafrica",
      followers: 1199,
      mediaCount: 51,
    });
    expect(report.account.every((reading) => reading.ok)).toBe(true);
    expect(report.media.map((post) => [post.id, post.type])).toEqual([
      ["m1", "REELS"],
      ["m2", "FEED"],
    ]);
    const [reel, feedPost] = report.media;
    expect(reel.metrics.every((reading) => reading.ok)).toBe(true);
    const shares = feedPost.metrics.find(
      (reading) => reading.metric === "shares"
    );
    expect(shares).toMatchObject({ ok: false });
    expect(feedPost.metrics.some((reading) => reading.ok)).toBe(true);
  });

  // @req REQ-032
  it("asks for one metric per request, so an unsupported one cannot take the rest down", async () => {
    const { client, seen } = clientFor(serve);

    await readInstagramInsights(client, IG, { recentMedia: 2 });

    const insightRequests = seen.filter((url) =>
      url.pathname.endsWith("/insights")
    );
    expect(insightRequests.length).toBeGreaterThan(4);
    for (const url of insightRequests) {
      expect(url.searchParams.get("metric")).not.toContain(",");
    }
  });

  // @req REQ-032
  it("reads a total_value metric as a single reading", async () => {
    const { client } = clientFor(serve);

    const report = await readInstagramInsights(client, IG, { recentMedia: 0 });

    const views = report.account.find((reading) => reading.metric === "views");
    expect(views).toEqual({
      metric: "views",
      ok: true,
      values: [{ value: 777 }],
    });
  });
});
