// The plan of a translated clip: where the excerpt sits in the source, and the
// French captions timed on the speaker's voice. Phrase times stay on the
// source clock, so the operator can check them against the original video;
// they move to the reel clock only here.

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
    const text = typeof p.fr === "string" ? p.fr.trim() : "";
    if (!text) errors.push(`${label}: French text is required`);
    if (!(p.end > p.start)) errors.push(`${label}: end must follow start`);
    if (!clips.some(([a, b]) => p.start >= a && p.end <= b))
      errors.push(`${label}: outside every clip`);
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
  return errors;
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
  const moved = plan.phrases.map((p) => ({
    ...p,
    start: toReelTime(plan.clips, p.start),
    end: toReelTime(plan.clips, p.end),
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
      (p, i) => `${i + 1}\n${srtTime(p.start)} --> ${srtTime(p.end)}\n${p.fr}\n`
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
