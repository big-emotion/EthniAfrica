// @req REQ-186
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  validatePlan,
  reelDuration,
  reelPhrases,
  reelBoxes,
  reelOverlays,
  overlayTrack,
  toSrt,
  captionTrack,
} from "./plan.mjs";

const plan = (over = {}) => ({
  source: "/videos/interview.mp4",
  clips: [[10, 20]],
  credit_line: "Une invitée · source : une chaîne (YouTube)",
  phrases: [
    { start: 10.2, end: 12, fr: "Première phrase," },
    { start: 12.1, end: 15, fr: "puis la suite." },
  ],
  ...over,
});

// @req REQ-186
test("a well-formed plan has no errors", () => {
  assert.deepEqual(validatePlan(plan()), []);
});

// @req REQ-186
test("a plan without credit line is refused: an excerpt always names its source", () => {
  assert.match(validatePlan(plan({ credit_line: " " })).join(), /credit_line/);
});

// @req REQ-186
test("clips must be increasing and must not overlap", () => {
  const errors = validatePlan(
    plan({
      clips: [
        [10, 20],
        [15, 30],
      ],
    })
  );
  assert.match(errors.join(), /clip 2/);
});

// @req REQ-186
test("a phrase outside every clip is refused, since it would never be seen", () => {
  const errors = validatePlan(
    plan({ phrases: [{ start: 25, end: 26, fr: "Hors coupe." }] })
  );
  assert.match(errors.join(), /phrase 1.*outside/);
});

// @req REQ-186
test("overlapping phrases are refused", () => {
  const errors = validatePlan(
    plan({
      phrases: [
        { start: 10.2, end: 13, fr: "Une." },
        { start: 12.5, end: 14, fr: "Deux." },
      ],
    })
  );
  assert.match(errors.join(), /phrase 2.*overlaps/);
});

// @req REQ-186
test("a caption too fast to read is refused", () => {
  const errors = validatePlan(
    plan({
      phrases: [
        {
          start: 10,
          end: 10.5,
          fr: "Une phrase beaucoup trop longue pour une demi-seconde.",
        },
      ],
    })
  );
  assert.match(errors.join(), /characters per second/);
});

// @req REQ-186
test("a caption longer than two lines is refused rather than shrunk", () => {
  const errors = validatePlan(
    plan({
      phrases: [{ start: 10, end: 19.9, fr: "mot ".repeat(20).trim() }],
    })
  );
  assert.match(errors.join(), /characters, at most/);
});

// @req REQ-186
test("the reel lasts the sum of its clips", () => {
  const p = plan({
    clips: [
      [10, 20],
      [30, 35.5],
    ],
  });
  assert.equal(reelDuration(p), 15.5);
});

// @req REQ-186
test("phrase times move from the source clock to the reel clock across cuts", () => {
  const p = plan({
    clips: [
      [10, 20],
      [30, 40],
    ],
    phrases: [
      { start: 11, end: 12, fr: "Avant la coupe." },
      { start: 31, end: 33, fr: "Après la coupe." },
    ],
  });
  const [a, b] = reelPhrases(p);
  assert.deepEqual([a.start, a.end], [1, 2]);
  assert.deepEqual([b.start, b.end], [11, 13]);
});

// @req REQ-186
test("a short silence between two captions is bridged so the text does not flicker", () => {
  const [a] = reelPhrases(plan());
  assert.equal(a.end, 2.1);
});

// @req REQ-186
test("a long silence leaves the screen without caption", () => {
  const p = plan({
    phrases: [
      { start: 10, end: 11, fr: "Une." },
      { start: 14, end: 15, fr: "Deux." },
    ],
  });
  assert.equal(reelPhrases(p)[0].end, 1);
});

// @req REQ-186
test("the SRT carries the reel times and the French text", () => {
  const srt = toSrt(reelPhrases(plan()));
  assert.equal(
    srt,
    "1\n00:00:00,200 --> 00:00:02,100\nPremière phrase,\n\n" +
      "2\n00:00:02,100 --> 00:00:05,000\npuis la suite.\n"
  );
});

// @req REQ-186
test("a box outside every clip, or overlapping another, is refused", () => {
  const errors = validatePlan(
    plan({
      boxes: [
        { start: 10, end: 14, text: "POUR ELLE, UNE IDÉE" },
        { start: 13, end: 16, text: "SELON ELLE, UNE AUTRE" },
        { start: 25, end: 26, text: "HORS COUPE" },
      ],
    })
  );
  assert.match(errors.join(), /box 2.*overlaps/);
  assert.match(errors.join(), /box 3.*outside/);
});

// @req REQ-186
test("boxes move to the reel clock without bridging", () => {
  const p = plan({
    clips: [
      [10, 20],
      [30, 40],
    ],
    phrases: [{ start: 11, end: 12, fr: "Une." }],
    boxes: [
      { start: 10, end: 12, text: "UNE" },
      { start: 12.3, end: 14, text: "DEUX" },
      { start: 31, end: 35, text: "TROIS" },
    ],
  });
  assert.deepEqual(
    reelBoxes(p).map((b) => [b.start, b.end]),
    [
      [0, 2],
      [2.3, 4],
      [11, 15],
    ]
  );
});

// @req REQ-186
test("a plan without boxes has none", () => {
  assert.deepEqual(reelBoxes(plan()), []);
});

// @req REQ-186
test("a caption may be written in `text`, in any language, instead of `fr`", () => {
  const p = plan({
    phrases: [{ start: 10.2, end: 12, text: "Same-language caption." }],
  });
  assert.deepEqual(validatePlan(p), []);
  assert.match(toSrt(reelPhrases(p)), /Same-language caption\./);
});

// @req REQ-186
test("an on-screen text overlay needs a position inside the source frame", () => {
  const errors = validatePlan(
    plan({
      overlays: [
        { start: 10, end: 12, text: "« sauvage »", x: 0.5, y: 0.3 },
        { start: 12, end: 13, text: "Hors cadre", x: 1.4, y: 0.3 },
        { start: 12, end: 13, text: " ", x: 0.5, y: 0.5 },
      ],
    })
  );
  assert.equal(errors.length, 2);
  assert.match(errors.join(), /overlay 2.*position/);
  assert.match(errors.join(), /overlay 3.*text/);
});

// @req REQ-186
test("overlays may show together; the track lists what is on screen in each stretch", () => {
  const p = plan({
    overlays: [
      { start: 10, end: 14, text: "Un", x: 0.5, y: 0.2 },
      { start: 12, end: 16, text: "Deux", x: 0.5, y: 0.8 },
    ],
  });
  assert.deepEqual(
    overlayTrack(reelOverlays(p), reelDuration(p)).map((s) => [
      s.active,
      Number(s.seconds.toFixed(3)),
    ]),
    [
      [[0], 2],
      [[0, 1], 2],
      [[1], 2],
      [[], 4],
    ]
  );
});

// @req REQ-186
test("the caption track covers the whole reel, gaps included", () => {
  const p = plan();
  const track = captionTrack(reelPhrases(p), reelDuration(p));
  assert.deepEqual(
    track.map((s) => [s.index, Number(s.seconds.toFixed(3))]),
    [
      [null, 0.2],
      [0, 1.9],
      [1, 2.9],
      [null, 5],
    ]
  );
});
