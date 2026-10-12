// @req REQ-186
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  validatePlan,
  reelDuration,
  reelPhrases,
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

test("a well-formed plan has no errors", () => {
  assert.deepEqual(validatePlan(plan()), []);
});

test("a plan without credit line is refused: an excerpt always names its source", () => {
  assert.match(validatePlan(plan({ credit_line: " " })).join(), /credit_line/);
});

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

test("a phrase outside every clip is refused, since it would never be seen", () => {
  const errors = validatePlan(
    plan({ phrases: [{ start: 25, end: 26, fr: "Hors coupe." }] })
  );
  assert.match(errors.join(), /phrase 1.*outside/);
});

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

test("a caption longer than two lines is refused rather than shrunk", () => {
  const errors = validatePlan(
    plan({
      phrases: [{ start: 10, end: 19.9, fr: "mot ".repeat(20).trim() }],
    })
  );
  assert.match(errors.join(), /characters, at most/);
});

test("the reel lasts the sum of its clips", () => {
  const p = plan({
    clips: [
      [10, 20],
      [30, 35.5],
    ],
  });
  assert.equal(reelDuration(p), 15.5);
});

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

test("a short silence between two captions is bridged so the text does not flicker", () => {
  const [a] = reelPhrases(plan());
  assert.equal(a.end, 2.1);
});

test("a long silence leaves the screen without caption", () => {
  const p = plan({
    phrases: [
      { start: 10, end: 11, fr: "Une." },
      { start: 14, end: 15, fr: "Deux." },
    ],
  });
  assert.equal(reelPhrases(p)[0].end, 1);
});

test("the SRT carries the reel times and the French text", () => {
  const srt = toSrt(reelPhrases(plan()));
  assert.equal(
    srt,
    "1\n00:00:00,200 --> 00:00:02,100\nPremière phrase,\n\n" +
      "2\n00:00:02,100 --> 00:00:05,000\npuis la suite.\n"
  );
});

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
