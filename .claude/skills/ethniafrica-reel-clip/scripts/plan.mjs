// The plan of a reel clip: where the excerpt sits in the source, the captions
// timed on the speaker's voice (translated or in the source language), the
// boxes framing the argument and the overlays that replace on-screen text.
// Times stay on the source clock, so the operator can check them against the
// original video; they move to the reel clock only here.

// Two lines of the 70 px caption face fit about 28 characters each in the
// 960 px text column. The browser measures the real fit at render time; this
// bound refuses the obvious overflows before anything is drawn.
export const MAX_CHARACTERS = 56;
// Above this rate a viewer reads the caption instead of watching the speaker,
// or misses it. Broadcast norms aim near 17; short captions on a fast speaker
// can go higher without becoming unreadable.
export const MAX_READING_RATE = 25;
// A gap shorter than this between two captions is filled by holding the first
// one: a blink of empty screen reads as a glitch, not as a pause.
const BRIDGE_SECONDS = 0.6;

const characters = (text) =>
  [...new Intl.Segmenter("fr", { granularity: "grapheme" }).segment(text)]
    .length;

// `fr` is the field of the first translated reels; `text` serves any language.
const captionText = (p) => {
  const text = p.text ?? p.fr;
  return typeof text === "string" ? text.trim() : "";
};

const inClip = (clips, item) =>
  clips.some(([a, b]) => item.start >= a && item.end <= b);
const isFraction = (v) => typeof v === "number" && v >= 0 && v <= 1;

export function validatePlan(plan) {
  const errors = [];
  if (typeof plan.source !== "string" || !plan.source)
    errors.push("source: path of the source video is required");
  if (typeof plan.credit_line !== "string" || !plan.credit_line.trim())
    errors.push("credit_line: an excerpt always names its speaker and source");
  const clips = Array.isArray(plan.clips) ? plan.clips : [];
  if (!clips.length)
    errors.push("clips: at least one [start, end] is required");
  clips.forEach(([start, end], i) => {
    if (!(end > start)) errors.push(`clip ${i + 1}: end must follow start`);
    if (i > 0 && start < clips[i - 1][1])
      errors.push(`clip ${i + 1}: starts before clip ${i} ends`);
  });
  const phrases = Array.isArray(plan.phrases) ? plan.phrases : [];
  if (!phrases.length) errors.push("phrases: at least one caption is required");
  phrases.forEach((p, i) => {
    const label = `phrase ${i + 1}`;
    const text = captionText(p);
    if (!text) errors.push(`${label}: caption text is required`);
    if (!(p.end > p.start)) errors.push(`${label}: end must follow start`);
    if (!inClip(clips, p)) errors.push(`${label}: outside every clip`);
    if (i > 0 && p.start < phrases[i - 1].end)
      errors.push(`${label}: overlaps phrase ${i}`);
    const count = characters(text);
    if (count > MAX_CHARACTERS)
      errors.push(`${label}: ${count} characters, at most ${MAX_CHARACTERS}`);
    const rate = count / (p.end - p.start);
    if (p.end > p.start && rate > MAX_READING_RATE)
      errors.push(
        `${label}: ${rate.toFixed(1)} characters per second, at most ${MAX_READING_RATE}`
      );
  });
  const boxes = Array.isArray(plan.boxes) ? plan.boxes : [];
  boxes.forEach((b, i) => {
    const label = `box ${i + 1}`;
    const maxCharacters =
      b.style === "context" ? MAX_CONTEXT_CHARACTERS : MAX_BOX_CHARACTERS;
    if (b.style !== undefined && b.style !== "context")
      errors.push(`${label}: unknown style`);
    if (typeof b.text !== "string" || !b.text.trim())
      errors.push(`${label}: text is required`);
    else if (characters(b.text) > maxCharacters)
      errors.push(`${label}: at most ${maxCharacters} characters`);
    if (!(b.end > b.start)) errors.push(`${label}: end must follow start`);
    if (!clips.some(([a, z]) => b.start >= a && b.end <= z))
      errors.push(`${label}: outside every clip`);
    if (i > 0 && b.start < boxes[i - 1].end)
      errors.push(`${label}: overlaps box ${i}`);
  });
  const overlays = Array.isArray(plan.overlays) ? plan.overlays : [];
  overlays.forEach((o, i) => {
    const label = `overlay ${i + 1}`;
    if (typeof o.text !== "string" || !o.text.trim())
      errors.push(`${label}: text is required`);
    if (!(o.end > o.start)) errors.push(`${label}: end must follow start`);
    if (!inClip(clips, o)) errors.push(`${label}: outside every clip`);
    if (!isFraction(o.x) || !isFraction(o.y))
      errors.push(
        `${label}: position x, y must be fractions of the source frame`
      );
  });
  return errors;
}

// A preliminary bound for the labels; Chromium enforces their two-line fit.
// Operator-approved context prose has its own bound and three-line fit check.
const MAX_BOX_CHARACTERS = 70;
const MAX_CONTEXT_CHARACTERS = 140;

// Boxes frame what the speaker argues ("POUR ELLE, …"): they are timed on the
// source clock like the phrases, but never bridged, since a box that lingers
// over the next idea misattributes it.
const toReel = (plan, items) =>
  (items || []).map((item) => ({
    ...item,
    start: toReelTime(plan.clips, item.start),
    end: toReelTime(plan.clips, item.end),
  }));

export const reelBoxes = (plan) => toReel(plan, plan.boxes);

// Overlays replace text the author burned into the picture, so they follow the
// original's own timing and may share the screen.
export const reelOverlays = (plan) => toReel(plan, plan.overlays);

// One stretch per change in what is on screen; `active` indexes the overlays
// drawn together in that stretch.
export function overlayTrack(overlays, duration) {
  const cuts = [
    ...new Set([0, duration, ...overlays.flatMap((o) => [o.start, o.end])]),
  ]
    .filter((t) => t >= 0 && t <= duration)
    .sort((a, b) => a - b);
  const track = [];
  for (let i = 0; i < cuts.length - 1; i++) {
    const [from, to] = [cuts[i], cuts[i + 1]];
    const active = overlays
      .map((o, index) => (o.start <= from && o.end >= to ? index : -1))
      .filter((index) => index >= 0);
    const last = track.at(-1);
    if (last && String(last.active) === String(active))
      last.seconds += to - from;
    else track.push({ active, seconds: to - from });
  }
  return track;
}

export const reelDuration = (plan) =>
  round(plan.clips.reduce((sum, [a, b]) => sum + (b - a), 0));

const round = (t) => Math.round(t * 1000) / 1000;

function toReelTime(clips, t) {
  let offset = 0;
  for (const [a, b] of clips) {
    if (t >= a && t <= b) return round(offset + t - a);
    offset += b - a;
  }
  throw new Error(`time ${t} is outside every clip`);
}

export function reelPhrases(plan) {
  const moved = toReel(plan, plan.phrases).map((p) => ({
    ...p,
    text: captionText(p),
  }));
  for (let i = 0; i < moved.length - 1; i++) {
    const next = moved[i + 1].start;
    if (next - moved[i].end <= BRIDGE_SECONDS) moved[i].end = next;
  }
  return moved;
}

const srtTime = (t) => {
  const ms = Math.round(t * 1000);
  const pad = (n, w = 2) => String(n).padStart(w, "0");
  return `${pad(Math.floor(ms / 3600000))}:${pad(Math.floor(ms / 60000) % 60)}:${pad(Math.floor(ms / 1000) % 60)},${pad(ms % 1000, 3)}`;
};

export const toSrt = (phrases) =>
  phrases
    .map(
      (p, i) =>
        `${i + 1}\n${srtTime(p.start)} --> ${srtTime(p.end)}\n${p.text}\n`
    )
    .join("\n");

// The caption layer is one image sequence spanning the reel: each phrase's
// picture for its duration, an empty picture in between. `index` points into
// the phrases, null for an empty stretch.
export function captionTrack(phrases, duration) {
  const track = [];
  let cursor = 0;
  phrases.forEach((p, index) => {
    if (p.start > cursor)
      track.push({ index: null, seconds: p.start - cursor });
    track.push({ index, seconds: p.end - p.start });
    cursor = p.end;
  });
  if (duration > cursor)
    track.push({ index: null, seconds: duration - cursor });
  return track;
}
