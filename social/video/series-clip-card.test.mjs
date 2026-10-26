// @req REQ-186
// A card whose picture is an external clip (Cartes 1.15.0-proposition, §1):
// the loader checks it against its source, the frame state says which still
// of the clip each frame shows, and Chromium draws those stills in turn. A
// moving test pattern stands for the footage.
import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import sharp from "sharp";
import { loadSeriesVideo, seriesFrameState } from "./series.mjs";
import { wordOf } from "./series-sequence.mjs";
import { renderSeriesFrames } from "./series-render.mjs";
import { clipDemo, CLIP_CARD, RIGHTS } from "./fixtures/series-clip.mjs";

const root = mkdtempSync(join(tmpdir(), "series-clip-card-"));
// @req REQ-186
test.after(() => rmSync(root, { recursive: true, force: true }));

const SOURCE = join(root, "source.mp4");
execFileSync(
  "ffmpeg",
  [
    ...["-v", "error", "-y", "-f", "lavfi"],
    ...["-i", "testsrc2=size=1920x1080:rate=30:duration=12"],
    ...["-c:v", "libx264", "-pix_fmt", "yuv420p", SOURCE],
  ],
  { stdio: "inherit" }
);

const SMALL = join(root, "small.mp4");
execFileSync(
  "ffmpeg",
  [
    ...["-v", "error", "-y", "-f", "lavfi"],
    ...["-i", "testsrc2=size=1280x720:rate=30:duration=12"],
    ...["-c:v", "libx264", "-pix_fmt", "yuv420p", SMALL],
  ],
  { stdio: "inherit" }
);

let runs = 0;
const build = (options) => {
  const dir = join(root, `run-${runs++}`);
  execFileSync("mkdir", [dir]);
  execFileSync("cp", [SOURCE, join(dir, "source.mp4")]);
  execFileSync("cp", [SMALL, join(dir, "small.mp4")]);
  return loadSeriesVideo(clipDemo(dir, options), { dir });
};
const indexOfClip = (seq) => seq.cards.findIndex((c) => c.id === CLIP_CARD);

// @req REQ-186
test("a clip card is loaded with its stills and its length in frames", () => {
  const seq = build();
  const card = seq.cards[indexOfClip(seq)];
  assert.equal(card.image.clip.count, 240);
  assert.equal(card.image.src, `clip/${CLIP_CARD}/0-0001.jpg`);
  assert.deepEqual([card.image.w, card.image.h], [1080, 1920]);
  assert.equal(card.image.calm, false);
});

// @req REQ-186
test("each frame of the card shows the matching still, held at the ends", () => {
  const seq = build();
  const i = indexOfClip(seq);
  const start = seq.cardStarts[i];
  const clipFrame = (frame) =>
    seriesFrameState(seq, frame).layers.find((l) => l.card === i).clipFrame;
  assert.equal(clipFrame(start), 0);
  assert.equal(clipFrame(start + 10), 10);
  assert.equal(clipFrame(start + 100), 100);
});

// @req REQ-186
test("footage is never pushed in: its zoom stays at 1", () => {
  const seq = build();
  const i = indexOfClip(seq);
  const start = seq.cardStarts[i];
  for (const f of [start, start + 90, start + 200]) {
    const layer = seriesFrameState(seq, f).layers.find((l) => l.card === i);
    assert.equal(layer.zoom, 1);
    assert.equal(layer.zoomEnd, 1);
  }
});

// @req REQ-186
test("a clip shorter than its card is refused", () => {
  assert.throws(
    () => build({ clip: { in: 0, out: 6 } }),
    /plus court que sa carte/
  );
});

// @req REQ-186
test("a missing source and a missing licence are refused", () => {
  assert.throws(() => build({ clip: { src: "absent.mp4" } }), /introuvable/);
  assert.throws(() => build({ clip: { rights: { author: "X" } } }), /licence/);
});

// @req REQ-186
test("Chromium draws a different still on each frame of the clip", async () => {
  const seq = build();
  const i = indexOfClip(seq);
  const start = seq.cardStarts[i];
  const [a, b] = await renderSeriesFrames(seq, [start + 20, start + 80]);
  // The picture's middle band, clear of the head and the subtitles.
  const band = async (png) =>
    sharp(png)
      .extract({ left: 0, top: 700, width: 1080, height: 400 })
      .raw()
      .toBuffer();
  const [pa, pb] = [await band(a.png), await band(b.png)];
  let differing = 0;
  for (let k = 0; k < pa.length; k += 3) if (pa[k] !== pb[k]) differing++;
  assert.ok(
    differing > 10000,
    `the two frames hold the same picture (${differing} pixels differ)`
  );
});

// @req REQ-186
test("a 720p source loads in a demonstration, with the upscale reported", () => {
  const seq = build({ clip: { src: "small.mp4" } });
  assert.match(seq.warnings.join("\n"), /1280×720.*agrandie 2,7 fois/);
});

// @req REQ-186
test("the card's credit is the clip's own place and rights, never the old photo's", () => {
  const seq = build();
  const { credit } = seq.cards[indexOfClip(seq)];
  assert.match(credit, /ESSAI, TOGO/);
  assert.match(
    credit,
    /Images : Chaîne d'essai · licence d'essai · example\.org/
  );
  assert.doesNotMatch(credit, /Bobo-Dioulasso/);
});

// A montage: two shots of the card, the second entering on a word of the voice.
const SHOT = (over) => ({
  src: "source.mp4",
  in: 0,
  out: 3,
  fx: 0.5,
  audio: { mode: "off", speech: false },
  place: "LOMÉ, GRAND MARCHÉ",
  rights: RIGHTS,
  ...over,
});
const montage = (extra = []) => [
  SHOT({ place: "LOMÉ, GRAND MARCHÉ" }),
  SHOT({ in: 4, out: 9, place: "KPALIMÉ, COLLINES", say: "Burkina" }),
  ...extra,
];
const stateOf = (seq, frame) =>
  seriesFrameState(seq, frame).layers.find((l) => l.card === indexOfClip(seq));

// @req REQ-186
test("a montage cuts to its next shot on the word that says it", () => {
  const seq = build({ clips: montage() });
  const i = indexOfClip(seq);
  const start = seq.cardStarts[i];
  const cut = wordOf(seq, i, "Burkina").frame;
  assert.equal(cut - start, 77);
  const before = stateOf(seq, cut - 1);
  assert.deepEqual([before.clipShot, before.clipFrame], [0, 76]);
  const after = stateOf(seq, cut);
  assert.deepEqual([after.clipShot, after.clipFrame], [1, 0]);
  assert.equal(stateOf(seq, cut + 50).clipFrame, 50);
});

// @req REQ-186
test("a shot without a word follows the footage of the one before", () => {
  const seq = build({
    clips: [SHOT({ out: 3 }), SHOT({ in: 4, out: 9, place: "KPALIMÉ" })],
  });
  const i = indexOfClip(seq);
  const start = seq.cardStarts[i];
  assert.equal(stateOf(seq, start + 89).clipShot, 0);
  assert.equal(stateOf(seq, start + 90).clipShot, 1);
});

// @req REQ-186
test("a montage refuses a last shot under 2.5 s and a fourth shot", () => {
  const three = [
    SHOT(),
    SHOT({ in: 4, out: 8, say: "Burkina", place: "KPALIMÉ" }),
    SHOT({ in: 9, out: 12, say: "Faso", place: "KARA" }),
  ];
  assert.throws(() => build({ clips: three }), /dernier plan.*2,5 s/);
  const four = [...three, SHOT({ in: 0, out: 3, place: "ANÉHO" })];
  assert.throws(() => build({ clips: four }), /3 plans/);
});

// @req REQ-186
test("a shot under two seconds on screen is refused", () => {
  const quick = [
    SHOT({ out: 3 }),
    SHOT({ in: 4, out: 9, say: "mots", place: "KPALIMÉ" }),
  ];
  assert.throws(() => build({ clips: quick }), /moins de 2 s à l'écran/);
});

// @req REQ-186
test("a shot too short for its time on screen is refused", () => {
  const short = [SHOT({ out: 2 }), SHOT({ in: 4, out: 9, say: "Burkina" })];
  assert.throws(() => build({ clips: short }), /plus court que son temps/);
});

// @req REQ-186
test("Chromium cuts between the shots and changes the credit with them", async () => {
  const seq = build({ clips: montage() });
  const i = indexOfClip(seq);
  const cut = wordOf(seq, i, "Burkina").frame;
  const [a, b] = await renderSeriesFrames(seq, [cut - 2, cut + 2]);
  assert.match(a.text, /LOMÉ, GRAND MARCHÉ/);
  assert.doesNotMatch(a.text, /KPALIMÉ/);
  assert.match(b.text, /KPALIMÉ, COLLINES/);
  assert.doesNotMatch(b.text, /LOMÉ, GRAND MARCHÉ/);
  assert.notDeepEqual(a.png, b.png);
});

// A footage-first opener (1.15.0 §7) still owes the 1.7.0 hook reminder its
// own image: the reminder repeats the opener when both show the same shot.
const reminderOfClipOpener = (reminderClip) => {
  const dir = join(root, `run-${runs++}`);
  execFileSync("mkdir", [dir]);
  execFileSync("cp", [SOURCE, join(dir, "source.mp4")]);
  const shot = {
    src: "source.mp4",
    in: 0,
    out: 8,
    fx: 0.5,
    audio: { mode: "off", speech: false },
    place: "ESSAI, TOGO",
    rights: RIGHTS,
  };
  const input = clipDemo(dir, {
    clip: reminderClip(shot),
    change: (deck) => {
      deck.cards.find((c) => c.id === "serie-pays-01").image = {
        clip: { ...shot },
      };
    },
  });
  input.reminder = CLIP_CARD;
  return loadSeriesVideo(input, { dir });
};

// @req REQ-186
test("a reminder repeats a clip opener when it shows the same shot", () => {
  const seq = reminderOfClipOpener((shot) => shot);
  assert.equal(seq.cards[0].image.clip.in, 0);
});

// @req REQ-186
test("a reminder showing other footage than the clip opener is refused", () => {
  assert.throws(
    () => reminderOfClipOpener((shot) => ({ ...shot, in: 2, out: 10 })),
    /Le rappel ne montre pas l'image d'ouverture/
  );
});
