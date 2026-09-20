import { describe, expect, it } from "vitest";

import {
  ENABLED_EMBED_PROVIDERS,
  embedFrameSrcHosts,
  embedPlayerUrl,
} from "@/lib/embeds/providers";

describe("embedFrameSrcHosts", () => {
  // @req REQ-181
  it("opens nothing when no provider is enabled", () => {
    expect(embedFrameSrcHosts([])).toEqual([]);
  });

  // The player navigates its own frame to youtube.com (logo, channel, end
  // screen), and frame-src governs navigations, not only the first URL.
  // @req REQ-181
  it("opens exactly the two YouTube hosts for YouTube, and no wildcard", () => {
    expect(embedFrameSrcHosts(["youtube"])).toEqual([
      "https://www.youtube-nocookie.com",
      "https://www.youtube.com",
    ]);
  });

  // The switch is a line in a file somebody reviews, so a change to it is a
  // change to the policy the CSP tests hold.
  // @req REQ-181
  it("ships with YouTube alone enabled", () => {
    expect(ENABLED_EMBED_PROVIDERS).toEqual(["youtube"]);
  });
});

describe("embedPlayerUrl", () => {
  const enabled = ["youtube"] as const;

  // @req REQ-181
  it("builds the privacy-enhanced player URL from a well-formed identifier", () => {
    expect(
      embedPlayerUrl({ provider: "youtube", id: "vESK91smqxQ" }, enabled)
    ).toBe(
      "https://www.youtube-nocookie.com/embed/vESK91smqxQ?autoplay=1&rel=0&playsinline=1&modestbranding=1"
    );
  });

  // A stored identifier becomes an iframe `src`. With `strict: false` nothing
  // else in the type system stops a string with a slash or a query in it.
  // @req REQ-181
  it.each([
    ["too short", "vESK91smqx"],
    ["too long", "vESK91smqxQQ"],
    ["a path segment", "../../evil.co"],
    ["a query smuggled in", "vESK91smq?x"],
    ["a scheme", "https://evil"],
    ["whitespace", "vESK91smq Q"],
    ["empty", ""],
  ])("does not render an identifier that is %s", (_label, id) => {
    expect(embedPlayerUrl({ provider: "youtube", id }, enabled)).toBeNull();
  });

  // @req REQ-181
  it("does not render for a provider that is not enabled", () => {
    expect(
      embedPlayerUrl({ provider: "youtube", id: "vESK91smqxQ" }, [])
    ).toBeNull();
  });

  // Those platforms keep linking out: there is no player to build for them.
  // @req REQ-181
  it("does not render for a provider that has no player, even when listed", () => {
    expect(
      embedPlayerUrl({ provider: "tiktok", id: "7234567890123456789" }, [
        "tiktok",
      ])
    ).toBeNull();
  });
});
