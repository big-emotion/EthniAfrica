import { describe, expect, it } from "vitest";

import { GET } from "../[...path]/route";

const call = (path: string[]) =>
  GET(new Request("http://localhost/media/articles/x"), {
    params: Promise.resolve({ path }),
  });

describe("GET /media/articles/[...path]", () => {
  // @req REQ-114
  it("answers 404 for a traversal attempt", async () => {
    expect((await call(["..", "etc", "passwd.webp"])).status).toBe(404);
  });

  // @req REQ-114
  it("answers 404, not 500, when the media directory is not mounted", async () => {
    expect((await call(["mali", "poster-ab12.webp"])).status).toBe(404);
  });
});
