// @req REQ-186
// The clip and montage phases of the series video (Cartes 1.15.0-proposition,
// §1 to §6): what a phase made of external footage must satisfy before the
// renderer touches a frame. The probe of the source file is injected, so no
// MP4 and no browser is needed.
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  FRAME_SECONDS,
  snapToFrame,
  cropWindow,
  resolveAudio,
  checkClipPhase,
} from "./series-clip.mjs";

const HD_SOURCE = { codec: "h264", width: 1920, height: 1080, duration: 60 };
const probeOf = (known) => (src) => known[src] ?? null;
const RIGHTS = { author: "Kokouvia", licence: "licence YouTube standard" };
const clip = (over = {}) => ({
  src: "media/a.mp4",
  in: 10,
  out: 16,
  audio: { mode: "off", speech: false },
  crop: { mode: "fill", fx: 0.5, fy: 0.5 },
  place: "ANÉHO",
  rights: RIGHTS,
  overlay: null,
  ...over,
});
const probe = probeOf({ "media/a.mp4": HD_SOURCE, "media/b.mp4": HD_SOURCE });
const check = (phase) => checkClipPhase(phase, probe);

test("a time snaps to the 30 fps grid", () => {
  assert.equal(FRAME_SECONDS, 1 / 30);
  assert.equal(snapToFrame(12.4), 12.4);
  assert.ok(Math.abs(snapToFrame(12.41) - 12.4) < 1e-9);
  assert.ok(Math.abs(snapToFrame(12.43) - 12.4333333333) < 1e-6);
});

test("the 9:16 window covers 0.316 of a 16:9 source and stays inside it", () => {
  const w = cropWindow(0.5, "tiktok");
  assert.ok(Math.abs(w.width - 0.316) < 1e-9);
  assert.ok(Math.abs(w.left - 0.342) < 1e-9);
  assert.equal(cropWindow(0, "instagram").left, 0);
  assert.ok(Math.abs(cropWindow(1, "tiktok").left - 0.684) < 1e-9);
});

test("the 4:5 window covers 0.45 of the source", () => {
  const w = cropWindow(0.5, "facebook");
  assert.equal(w.width, 0.45);
  assert.ok(Math.abs(w.left - 0.275) < 1e-9);
  assert.ok(Math.abs(cropWindow(1, "facebook").left - 0.55) < 1e-9);
});

test("source sound is off unless speech is transcribed and attributed", () => {
  assert.deepEqual(resolveAudio({ mode: "off" }), {
    mode: "off",
    warning: null,
  });
  assert.deepEqual(resolveAudio({ mode: "duck", speech: false }), {
    mode: "duck",
    warning: null,
  });
  const refused = resolveAudio({ mode: "on", speech: true });
  assert.equal(refused.mode, "off");
  assert.match(refused.warning, /transcri/);
  const noSpeaker = resolveAudio({
    mode: "duck",
    speech: true,
    transcript: "…",
  });
  assert.equal(noSpeaker.mode, "off");
  const allowed = resolveAudio({
    mode: "on",
    speech: true,
    transcript: "Mi vɔ hafi na du nu",
    speaker: "Locutrice éwé",
  });
  assert.equal(allowed.mode, "on");
});

test("a clip of six seconds from a full HD H.264 file passes", () => {
  const r = check({ kind: "clip", id: "p03", minHold: 6, ...clip() });
  assert.deepEqual(r.errors, []);
  assert.deepEqual(r.warnings, []);
});

test("a single clip under six seconds cannot be a phase", () => {
  const r = check({
    kind: "clip",
    id: "p03",
    minHold: 6,
    ...clip({ out: 15.9 }),
  });
  assert.match(r.errors.join("\n"), /moins de 6 s/);
});

test("a missing, small or odd-codec source is refused", () => {
  const phase = (src) => ({
    kind: "clip",
    id: "p",
    minHold: 6,
    ...clip({ src }),
  });
  assert.match(check(phase("media/none.mp4")).errors.join(), /introuvable/);
  const small = checkClipPhase(
    phase("media/s.mp4"),
    probeOf({ "media/s.mp4": { ...HD_SOURCE, width: 1280, height: 720 } })
  );
  assert.match(small.errors.join(), /1920×1080/);
  const odd = checkClipPhase(
    phase("media/v.mp4"),
    probeOf({ "media/v.mp4": { ...HD_SOURCE, codec: "vp9" } })
  );
  assert.match(odd.errors.join(), /H\.264 ou H\.265/);
  const hevc = checkClipPhase(
    phase("media/h.mp4"),
    probeOf({ "media/h.mp4": { ...HD_SOURCE, codec: "hevc" } })
  );
  assert.deepEqual(hevc.errors, []);
});

test("in and out stay inside the source", () => {
  const phase = (over) => ({
    kind: "clip",
    id: "p",
    minHold: 6,
    ...clip(over),
  });
  assert.match(check(phase({ in: 16, out: 10 })).errors.join(), /in < out/);
  assert.match(
    check(phase({ in: 58, out: 64 })).errors.join(),
    /durée de la source/
  );
  assert.match(check(phase({ in: -1, out: 6 })).errors.join(), /in < out/);
});

test("a montage holds six seconds with two or three shots of two seconds", () => {
  const montage = (shots) => ({
    kind: "montage",
    id: "p06",
    minHold: 6,
    clips: shots,
  });
  const ok = check(
    montage([clip({ in: 0, out: 3 }), clip({ in: 5, out: 8.5 })])
  );
  assert.deepEqual(ok.errors, []);
  const short = check(
    montage([clip({ in: 0, out: 1.9 }), clip({ in: 5, out: 10 })])
  );
  assert.match(short.errors.join(), /2 s/);
  const lastShort = check(
    montage([clip({ in: 0, out: 4 }), clip({ in: 5, out: 7.4 })])
  );
  assert.match(lastShort.errors.join(), /2,5 s/);
  const tooShort = check(
    montage([clip({ in: 0, out: 2 }), clip({ in: 5, out: 8 })])
  );
  assert.match(tooShort.errors.join(), /moins de 6 s/);
  const four = check(
    montage([0, 1, 2, 3].map((i) => clip({ in: i * 5, out: i * 5 + 2.5 })))
  );
  assert.match(four.errors.join(), /3 plans/);
  const one = check(montage([clip({ in: 0, out: 6 })]));
  assert.match(one.errors.join(), /2 ou 3 plans/);
});

test("rights need an author and a licence", () => {
  const noLicence = check({
    kind: "clip",
    id: "p",
    minHold: 6,
    ...clip({ rights: { author: "X" } }),
  });
  assert.match(noLicence.errors.join(), /licence/);
  const noAuthor = check({
    kind: "clip",
    id: "p",
    minHold: 6,
    ...clip({ rights: { licence: "CC BY" } }),
  });
  assert.match(noAuthor.errors.join(), /auteur/);
});

test("an overlay date must be a present-day date", () => {
  const withOverlay = (overlay) =>
    check({ kind: "clip", id: "p", minHold: 6, ...clip({ overlay }) });
  assert.match(
    withOverlay({ type: "date", value: "1884" }).errors.join(),
    /date du jour/
  );
  assert.deepEqual(
    withOverlay({ type: "date", value: "2026", present: true }).errors,
    []
  );
  assert.deepEqual(
    withOverlay({
      type: "word",
      value: "Eʋegbe",
      lang: "ee",
      gloss: "la langue éwé",
    }).errors,
    []
  );
});

test("a focal point outside the source is refused and a speech clip falls back to silence with a warning", () => {
  const off = check({
    kind: "clip",
    id: "p",
    minHold: 6,
    ...clip({ crop: { mode: "fill", fx: 1.2, fy: 0.5 } }),
  });
  assert.match(off.errors.join(), /fx et fy/);
  const speech = check({
    kind: "clip",
    id: "p",
    minHold: 6,
    ...clip({ audio: { mode: "on", speech: true } }),
  });
  assert.deepEqual(speech.errors, []);
  assert.match(speech.warnings.join(), /transcri/);
});

test("a 720p source is refused in a final video and only reported in a proof", () => {
  const small = probeOf({
    "media/s.mp4": { ...HD_SOURCE, width: 1280, height: 720 },
  });
  const phase = {
    kind: "clip",
    id: "p",
    minHold: 6,
    ...clip({ src: "media/s.mp4" }),
  };
  const final = checkClipPhase(phase, small);
  assert.match(final.errors.join(), /1920×1080/);
  const proof = checkClipPhase(phase, small, { proof: true });
  assert.deepEqual(proof.errors, []);
  assert.match(proof.warnings.join(), /agrandie 2,7 fois/);
  assert.match(proof.warnings.join(), /preuve/);
});

test("blur mode asks for 1080 px of width, so a 720p source is clean", () => {
  const small = probeOf({
    "media/s.mp4": { ...HD_SOURCE, width: 1280, height: 720 },
  });
  const phase = {
    kind: "clip",
    id: "p",
    minHold: 6,
    ...clip({ src: "media/s.mp4", mode: "blur" }),
  };
  const r = checkClipPhase(phase, small);
  assert.deepEqual(r.errors, []);
  assert.deepEqual(r.warnings, []);
  const tiny = probeOf({
    "media/t.mp4": { ...HD_SOURCE, width: 854, height: 480 },
  });
  const refused = checkClipPhase({ ...phase, src: "media/t.mp4" }, tiny);
  assert.match(refused.errors.join(), /1080 px de large/);
});
