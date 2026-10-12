---
name: ethniafrica-translated-clip
description: Cut a speaker's excerpt from a foreign-language interview video (YouTube download), translate it into French captions timed on the voice, and render the EthniAfrica vertical reel — blurred source behind, source frame in a band, credit line, burned-in captions, watermark — with its SRT, cover and verification note. Use for "clip traduit", "reel sous-titré", "traduis cette vidéo YouTube", "extrait sous-titré en français", "fais un reel de ce passage", or /ethniafrica-translated-clip.
---

# Translated clip (reel sous-titré)

Turns a downloaded interview into a publishable French-subtitled reel in the
gabarit of the translated reels already published (Sankara, Maurice Mitchell,
8 October 2026). Respond to the operator in French; this file stays English.
The engine is `scripts/render.mjs`; its plan format is checked by
`scripts/plan.mjs`.

This is not a card or map publication: `/ethniafrica-social-production` and its
design system do not apply, except the brand fonts, logo and `accent` token,
which the engine reuses. Rendering never authorizes publication.

## Inputs

- The source video on disk (usually a `<title> - YouTube.mp4` in the operator's
  downloads) and its YouTube URL.
- Which passage: a phrase the speaker says. Unless told otherwise, take the
  speaker's **whole intervention** around it — from the first word of the turn
  to its last complete sentence — not just the quoted sentence.

## Steps

1. **Restate** the passage, the expected length and the deliverable folder;
   confirm before the paid transcription.
2. **Transcribe with word timestamps and speakers.** The ElevenLabs MCP tool
   returns plain text only and reads files from the desktop folder only, so
   call the API directly with the key already configured for the `elevenlabs`
   MCP server in the user-level Claude Code config: `POST https://api.elevenlabs.io/v1/speech-to-text` with
   `model_id=scribe_v1`, `diarize=true`, `timestamps_granularity=word`, on a
   mono 16 kHz MP3 extracted with FFmpeg. Keep the transcript in the job's temp
   folder, never in the repo or the deliverable.
3. **Find the in and out points** from the speaker turns. Enter ~0.1 s before
   the first word, after the previous speaker's last word; leave after the
   last complete sentence. A source often opens with a teaser that repeats a
   later line: do not start there. Name the channel and show from the YouTube
   oEmbed (`https://www.youtube.com/oembed?url=…&format=json`) and the on-screen
   logo.
4. **Adapt, do not transcribe.** One plan phrase per caption, on the source
   clock (`start` = first word, `end` = last word, or later into a silence).
   - Two lines at most; ≤ 56 characters and ≤ 25 characters per second are
     enforced, the browser refuses a third line. Condense repetitions rather
     than speed the reading.
   - Another speaker's line starts with « – » (French change-of-speaker dash);
     drop bare backchannels (« Yes », « Mm »).
   - Keep unfinished sentences unfinished (« … »), keep names and African
     spellings, never sharpen a claim the speaker hedged.
   - **Boxes** (white plates above the source band, as on the Mitchell and
     Kachamba reels): one identity box at the start, verified (name, role,
     nationality — check it, never infer it from the video title), then one
     box per key argument, always attributed (« POUR ELLE, … », « SELON LUI,
     … »): a box states the speaker's thesis, never ours. Two lines at most,
     the browser refuses a third; boxes do not overlap.
5. **Validate**, then **render** from the repo root:
   ```sh
   node .claude/skills/ethniafrica-translated-clip/scripts/render.mjs validate PLAN.json
   node .claude/skills/ethniafrica-translated-clip/scripts/render.mjs render PLAN.json OUT_DIR
   ```
   The render writes `reel.mp4` (1080×1920, H.264/AAC), `sous-titres-fr.srt`,
   `cover.png` (when `thumbnail` is set) and a copy of `plan.json`.
6. **Look at the result**: at least three frames (start, a two-line caption,
   another speaker's line) and the cover. Check the credit, the watermark, the
   source's logo, and that no word is cut at either end.
7. **Write `verification.md`** next to the reel, as in the published folders:
   cut, checks done, adaptation choices to confirm by ear, claims not verified,
   open decisions. **Rights are always an open decision**: the credit is not a
   licence.
8. Descriptions per network are a separate, optional step; they follow
   `docs/editorial/reader-facing-register.md` and its checks.

## Plan format

```json
{
  "source": "/abs/path/source.mp4",
  "source_url": "https://www.youtube.com/watch?v=…",
  "clips": [[42.4, 162.4]],
  "phrases": [
    { "start": 42.54, "end": 43.54, "speaker": 0, "fr": "Et encore une fois," }
  ],
  "boxes": [{ "start": 42.5, "end": 56, "text": "NAME, VERIFIED ROLE" }],
  "credit_line": "Name (@speaker) · source : @show (Show name)",
  "thumbnail": {
    "frame_at": 100,
    "title_lines": ["LINE ONE", "LINE TWO"],
    "accent": "LINE TWO"
  }
}
```

Several `clips` make jump cuts; phrase times stay on the source clock and the
engine moves them onto the reel. A gap under 0.6 s between captions is held so
the text does not blink. The credit names the speaker's and the show's
Instagram accounts when the operator gives them (the reel is posted there, and
a handle is how the viewer finds them); otherwise the YouTube channel. Boxes use the same source clock and are never held
past their `end`: a box lingering over the next idea misattributes it.

The engine covers horizontal interview sources. A vertical source (a TikTok or
Reel, as the 10 October « sauvage » reel) uses another frame — the source at
near full height, « Vidéo originale : @handle · traduite avec son autorisation »
under it, a larger watermark — and is not supported yet.

## Deliverable folder

The operator's social-media production folder, outside the repo, next to the
earlier translated reels: `Publie/<date>/Extraits-<Speaker>/<slug>/`. Ask for
its root if it is not known. The folder holds `reel.mp4`, `cover.png`, `plan.json`, `sous-titres-fr.srt`,
`verification.md` (and later `descriptions.md`, `diffusion.md`).

## Why this engine

Text is drawn in the pinned Chromium (`social/renderer/runtime.json`) like the
cards and map videos, so captions share fonts and runtime; FFmpeg only composes
pictures, because the workstation build has no libass or drawtext. Layout values
(band at y 336–944, credit under it, caption centred near y 1305, watermark near
y 1614) were measured on the published Sankara and Mitchell reels. The cover
accent follows the accepted design system (`accent`, night), not the orange of
the earlier Sankara cover.

## Tests

`npm run test:social-clip` — plan rules, and an end-to-end render on a
synthetic FFmpeg source (needs FFmpeg and the pinned Chromium).
