/**
 * Which files in a published folder are the release that went out.
 *
 *     node --test social/tools/articles-import/
 */
import { strict as assert } from "node:assert";
import { test } from "node:test";

import { selectRelease } from "./release.mjs";

// @req REQ-114
test("a carousel is the one network folder of 4:5 slides, in slide order", () => {
  const release = selectRelease(
    [
      "post.md",
      "TikTok-Instagram/x_10_carrousel_1080x1350.png",
      "TikTok-Instagram/x_02_carrousel_1080x1350.png",
      "TikTok-Instagram/x_01_carrousel_1080x1350.png",
      "Instagram-Facebook-YouTube-X/x_01_reel_1080x1920.png",
      "_rendus-remplaces/x_01_carrousel_1080x1350.png",
      "_non-publie/x_01_linkedin_1080x1080.png",
    ].concat(
      Array.from(
        { length: 7 },
        (_, i) =>
          `TikTok-Instagram/x_${String(i + 3).padStart(2, "0")}_carrousel_1080x1350.png`
      )
    ),
    {}
  );
  assert.deepEqual(release.problems, []);
  assert.equal(release.slides.length, 10);
  assert.equal(
    release.slides[0],
    "TikTok-Instagram/x_01_carrousel_1080x1350.png"
  );
  assert.equal(
    release.slides[9],
    "TikTok-Instagram/x_10_carrousel_1080x1350.png"
  );
});

// @req REQ-114
test("two carousel folders, or a hole in the numbering, is not a release", () => {
  const two = selectRelease(
    [
      "TikTok-Instagram/x_01_carrousel_1080x1350.png",
      "TikTok-Instagram-Facebook/x_01_carrousel_1080x1350.png",
    ],
    {}
  );
  assert.match(two.problems.join(), /ambiguous/);
  const hole = selectRelease(
    [
      "TikTok-Instagram/x_01_carrousel_1080x1350.png",
      "TikTok-Instagram/x_03_carrousel_1080x1350.png",
    ],
    {}
  );
  assert.match(hole.problems.join(), /slide 02 missing/);
});

// @req REQ-114
test("a video is the only cut, or the one the record designates", () => {
  const one = selectRelease(["video/video.mp4", "video/thumbnail.png"], {});
  assert.equal(one.video, "video/video.mp4");
  assert.equal(one.poster, "video/thumbnail.png");

  const two = selectRelease(["video/a.mp4", "video/b.mp4"], {});
  assert.equal(two.video, null);
  assert.match(two.problems.join(), /ambiguous video/);

  const chosen = selectRelease(
    [
      "video/a.mp4",
      "video/b.mp4",
      "video/b_1080x1350.mp4",
      "images/b_tiktok-story_1080x1920.png",
    ],
    { selected: "b.mp4" }
  );
  assert.deepEqual(chosen.problems, []);
  assert.equal(chosen.video, "video/b.mp4");
  assert.equal(chosen.poster, "images/b_tiktok-story_1080x1920.png");
});

// @req REQ-114
test("a folder holding only post.md has nothing to release", () => {
  const empty = selectRelease(["post.md"], {});
  assert.equal(empty.video, null);
  assert.deepEqual(empty.slides, []);
  assert.match(empty.problems.join(), /no media/);
});
