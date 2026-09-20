import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import { run } from "../read";

const TOKEN = "EAAtest0123456789tokenvalue";
const NOW = () => new Date("2026-09-20T19:00:00Z");
const created: string[] = [];

function scratch(): string {
  const dir = mkdtempSync(join(tmpdir(), "ethni-meta-"));
  created.push(dir);
  return dir;
}

afterEach(() => {
  while (created.length)
    rmSync(created.pop()!, { recursive: true, force: true });
});

function graph(respond: (url: URL) => unknown) {
  let requests = 0;
  const fetchImpl = (async (input: RequestInfo | URL) => {
    requests += 1;
    return new Response(JSON.stringify(respond(new URL(String(input)))));
  }) as typeof fetch;
  return { fetchImpl, requests: () => requests };
}

const facebookComments = {
  data: [
    {
      id: "c1",
      message: "A private opinion",
      created_time: "2026-09-17T10:00:00+0000",
      like_count: 4,
    },
    {
      id: "c2",
      message: "Another one",
      created_time: "2026-09-17T11:00:00+0000",
      parent: { id: "c1" },
    },
  ],
};

const env = {
  META_PAGE_TOKEN: TOKEN,
  META_PAGE_ID: "PAGE1",
  META_IG_USER_ID: "IG1",
};

describe("meta read — comments", () => {
  // @req REQ-032
  it("writes one private JSON file and reports counts without quoting a comment", async () => {
    const out = join(scratch(), "runs");
    const logs: string[] = [];
    const { fetchImpl } = graph(() => facebookComments);

    await run(["comments", "facebook", "--post", "POST1", "--out", out], {
      env,
      fetchImpl,
      now: NOW,
      log: (line) => logs.push(line),
    });

    const files = readdirSync(out);
    expect(files).toEqual(["facebook-comments-POST1-20260920T190000Z.json"]);
    const path = join(out, files[0]);
    // Comments name people, so the file is readable by its owner alone.
    expect(statSync(path).mode & 0o077).toBe(0);
    const saved = JSON.parse(readFileSync(path, "utf8"));
    expect(saved.comments).toHaveLength(2);
    expect(saved.comments[1].parentId).toBe("c1");

    const printed = logs.join("\n");
    expect(printed).toMatch(/2 comments/);
    expect(printed).not.toContain("A private opinion");
    expect(printed).not.toContain(TOKEN);
    expect(readFileSync(path, "utf8")).not.toContain(TOKEN);
  });

  // @req REQ-032
  it("reads an Instagram post's comments by media id", async () => {
    const out = join(scratch(), "runs");
    const { fetchImpl } = graph(() => ({
      data: [
        {
          id: "i1",
          text: "Nice",
          timestamp: "2026-09-18T08:00:00+0000",
          username: "reader",
        },
      ],
    }));

    await run(["comments", "instagram", "--media", "M1", "--out", out], {
      env,
      fetchImpl,
      now: NOW,
      log: () => {},
    });

    const [file] = readdirSync(out);
    expect(file).toBe("instagram-comments-M1-20260920T190000Z.json");
    const saved = JSON.parse(readFileSync(join(out, file), "utf8"));
    expect(saved.comments[0]).toMatchObject({ id: "i1", author: "reader" });
  });
});

describe("meta read — insights", () => {
  // @req REQ-032
  it("writes the Facebook Page metric readings", async () => {
    const out = join(scratch(), "runs");
    const { fetchImpl } = graph((url) =>
      url.pathname.endsWith("/insights")
        ? {
            data: [
              {
                name: url.searchParams.get("metric"),
                values: [{ value: 1, end_time: "2026-09-19T07:00:00+0000" }],
              },
            ],
          }
        : { followers_count: 5878 }
    );

    await run(["insights", "facebook", "--out", out], {
      env,
      fetchImpl,
      now: NOW,
      log: () => {},
    });

    const [file] = readdirSync(out);
    expect(file).toBe("facebook-insights-20260920T190000Z.json");
    const saved = JSON.parse(readFileSync(join(out, file), "utf8"));
    expect(saved.followers).toBe(5878);
    expect(saved.metrics.length).toBeGreaterThan(0);
  });
});

describe("meta read — refusals", () => {
  // @req REQ-032
  it("does not start without a token", async () => {
    const out = join(scratch(), "runs");
    const { fetchImpl, requests } = graph(() => ({}));

    await expect(
      run(["comments", "facebook", "--post", "P", "--out", out], {
        env: { ...env, META_PAGE_TOKEN: undefined },
        fetchImpl,
        now: NOW,
        log: () => {},
      })
    ).rejects.toThrow(/META_PAGE_TOKEN/);
    expect(requests()).toBe(0);
  });

  // @req REQ-032
  it("does not start when the output directory is inside a git checkout", async () => {
    const repo = scratch();
    mkdirSync(join(repo, ".git"));
    const { fetchImpl, requests } = graph(() => facebookComments);

    await expect(
      run(["comments", "facebook", "--post", "P", "--out", join(repo, "out")], {
        env,
        fetchImpl,
        now: NOW,
        log: () => {},
      })
    ).rejects.toThrow(/inside a git checkout/);
    // Refused before the network, so nothing was read that could not be stored.
    expect(requests()).toBe(0);
  });

  // @req REQ-032
  it("needs the Page id for Page insights", async () => {
    const out = join(scratch(), "runs");
    const { fetchImpl } = graph(() => ({}));

    await expect(
      run(["insights", "facebook", "--out", out], {
        env: { ...env, META_PAGE_ID: undefined },
        fetchImpl,
        now: NOW,
        log: () => {},
      })
    ).rejects.toThrow(/META_PAGE_ID/);
  });

  // @req REQ-032
  it("answers a command it does not have with the usage — there is no publish here", async () => {
    const out = join(scratch(), "runs");
    const { fetchImpl } = graph(() => ({}));

    await expect(
      run(["publish", "facebook", "--out", out], {
        env,
        fetchImpl,
        now: NOW,
        log: () => {},
      })
    ).rejects.toThrow(/usage/i);
  });
});
