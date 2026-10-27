---
name: ethniafrica-reel-clip
description: Turn a video file and a one-line instruction into a finished EthniAfrica reel — cut, captions timed on the voice (translated into French or kept in the source language), boxes, translated on-screen text, render in the published gabarit (wide interview or tall reel source), cover, captions for six social networks and a verification note — then open it for the operator's review. Use for "clip réel", "reel sous-titré", "clip traduit", "traduis cette vidéo", "sous-titre cette vidéo", "fais un reel de ce passage", "extrait sous-titré", or /ethniafrica-reel-clip.
---

# Reel clip

The operator hands over **a video and an instruction**; this skill delivers the
whole publication folder without further questions, then opens the reel for
review. Respond to the operator in French; this file stays English. Used by
Claude Code and by Codex (`$ethniafrica-reel-clip`, same file through
`.agents/skills/`).

Operator decisions of 12 October 2026: run end to end, review at the end; on a
tall source, translate the author's on-screen text as well as the speech.

This is not a card or map publication: `/ethniafrica-social-production` and its
design system do not apply, except the brand fonts, logo and `accent` token,
which the engine reuses. Rendering never authorizes publication.

## Reading the instruction

Extract, and assume a stated default when absent:

| What               | Examples                                                       | Default                                                     |
| ------------------ | -------------------------------------------------------------- | ----------------------------------------------------------- |
| Source             | a file path; a YouTube or Instagram URL for credit             | the file given                                              |
| Passage            | « commence quand elle dit… », « tout », « 1 min autour de… »   | the speaker's whole intervention around the quoted sentence |
| Captions           | « traduction », « juste des sous-titres »                      | translate into French unless the speech is French           |
| Credit             | Instagram links of speaker and show, « avec son autorisation » | speaker and channel names                                   |
| Boxes              | « mets un encadré », « sans encadré »                          | wide source: identity box + one box per key argument        |
| Deliverable folder | given path                                                     | the operator's production folder (ask once if unknown)      |

Say in one sentence what will be produced, then run. Ask only when the passage
cannot be located or the file cannot be read.

## Steps

1. **Transcribe** (billed):
   ```sh
   node .claude/skills/ethniafrica-reel-clip/scripts/transcribe.mjs VIDEO WORK_DIR [eng|fra|…]
   ```
   `WORK_DIR` is the session's scratch folder. `turns.txt` gives speaker turns,
   `lines.txt` each word's start. Never copy a transcript into the repo or the
   deliverable; delete `WORK_DIR` at the end. Name the channel and show from
   the YouTube oEmbed (`https://www.youtube.com/oembed?url=…&format=json`) and
   the on-screen logo.
2. **Cut.** Enter after the previous speaker's last word and ~0.15 s before the
   first word; leave after the last complete sentence. A source often opens
   with a teaser repeating a later line: do not start there. Several `clips`
   make jump cuts.
3. **Captions**, one plan phrase per caption, on the source clock (`start` =
   first word, `end` = last word or later into a silence). Field `text`;
   `language` names the caption language (`fr` by default).
   - Two lines at most; ≤ 56 characters and ≤ 25 characters per second are
     enforced, the browser refuses a third line. Condense repetitions rather
     than speed the reading.
   - Another speaker's line starts with « – »; drop bare backchannels.
   - Keep unfinished sentences unfinished (« … »), names and African
     spellings; never sharpen a claim the speaker hedged.
4. **Boxes** (wide source only; the engine refuses them on a tall one): an
   identity box at the start, **verified** (name, role, nationality — search
   it, never infer it from a video title), then one per key argument, always
   attributed (« POUR ELLE, … », « SELON LUI, … »). Two lines at most; no
   overlap.
   For operator-approved narrative context, set `style: "context"` on the
   box: up to 140 characters, three lines in sentence case at 44/56 px.
   Give each sentence enough reading time and end the boxes at the agreed
   point; they do not have to run throughout the excerpt.
5. **On-screen text** (tall source, or any burned-in text in the author's
   language): look at a contact sheet,
   ```sh
   ffmpeg -i VIDEO -vf "fps=2,scale=270:-1,tile=6x5" -frames:v 1 WORK_DIR/sheet-%02d.png
   ```
   then step through the frames around each text to time it. Write one
   `overlay` per text: the translation, its `start`/`end` on the source clock,
   and its centre `x`, `y` as fractions of the source frame, so the plate
   covers the original. Overlays may share the screen.
6. **Validate and render** from the repo root:
   ```sh
   node .claude/skills/ethniafrica-reel-clip/scripts/render.mjs validate PLAN.json
   node .claude/skills/ethniafrica-reel-clip/scripts/render.mjs render PLAN.json OUT_DIR
   ```
   The engine reads the source size and picks the gabarit: **band** for a wide
   source (the interview reels), **portrait** for a tall one (the « sauvage »
   reel). It writes `reel.mp4` (1080×1920, H.264/AAC), `sous-titres-<lang>.srt`,
   `cover.png` (when `thumbnail` is set) and a copy of `plan.json`. The reel
   ends with the last source picture and its live audio. Do not add a closing
   card, text or silent hold to a reel clip.
7. **Look**: at least four frames (start, a two-line caption, another
   speaker or an overlay, and the final live frame) and the
   cover. Check credit, watermark, the source's logo, an overlay fully
   covering its original, and no word cut at either end.
8. **Captions for the networks**: `descriptions.md` following
   [references/descriptions.md](references/descriptions.md), then
   `npm run check:publication -- OUT_DIR/descriptions.md` until it passes.
9. **`verification.md`** following
   [references/verification.md](references/verification.md). Rights are always
   an open decision unless the operator reports a permission.
10. **Open the reel** (`open OUT_DIR/reel.mp4` on macOS) and report: duration,
    gabarit, what to check by ear, open decisions. Never post.

## Plan format

```json
{
  "source": "/abs/path/source.mp4",
  "source_url": "https://…",
  "language": "fr",
  "clips": [[82.2, 162.4]],
  "phrases": [{ "start": 82.36, "end": 85.3, "speaker": 0, "text": "…" }],
  "boxes": [{ "start": 82.36, "end": 89.4, "text": "NAME, VERIFIED ROLE" }],
  "overlays": [
    { "start": 3.1, "end": 5.0, "text": "« sauvage »", "x": 0.5, "y": 0.3 }
  ],
  "credit_line": "Name (@speaker) · source : @show (Show name)",
  "thumbnail": {
    "frame_at": 100,
    "title_lines": ["LINE ONE", "LINE TWO"],
    "accent": "LINE TWO"
  }
}
```

`fr` is still read in place of `text` (the first translated reels). Times stay
on the source clock; the engine moves them onto the reel. A gap under 0.6 s
between captions is held so the text does not blink; boxes are never held past
their `end`, since a box lingering over the next idea misattributes it.

**Credit.** Speaker's and show's Instagram accounts when the operator gives them
(the reel is posted there); otherwise the YouTube channel. A permission from the
author is credited as such: « Vidéo originale : @handle · traduite avec son
autorisation ».

## Deliverable folder

The operator's social-media production folder, outside the repo:
`Publie/<date>/Extraits-<Speaker>/<slug>/` for an interview excerpt,
`Publie/<date>/<slug>/` for a reel by its author. It holds `reel.mp4`,
`cover.png`, `plan.json`, `sous-titres-<lang>.srt`, `descriptions.md`,
`verification.md` (and later `diffusion.md`, written by the operator).

## Why this engine

Text is drawn in the pinned Chromium (`social/renderer/runtime.json`) like the
cards and map videos, so captions share fonts and runtime; FFmpeg only composes
pictures, because the workstation build has no libass or drawtext. Both
gabarits were measured on published reels (`scripts/layout.mjs`). The cover
accent follows the accepted design system (`accent`, night).

## Tests

`npm run test:social-clip`: plan rules, geometry, transcript shaping, and
end-to-end renders on synthetic FFmpeg sources in both gabarits (needs FFmpeg
and the pinned Chromium; no network, no third-party footage).
