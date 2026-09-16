import { describe, expect, it } from "vitest";

import { GET } from "../route";

describe("GET /api/docs", () => {
  // V1 was removed: advertising /api/docs/v1 sends a client to a page that
  // only redirects back, so the deprecated entry point names v2 alone.
  // @req REQ-099
  it("points only at the v2 documentation", async () => {
    const response = await GET();
    const body = await response.json();

    expect(body.links).toEqual({ v2: "/api/docs/v2" });
    expect(JSON.stringify(body)).not.toMatch(/v1/);
  });
});
