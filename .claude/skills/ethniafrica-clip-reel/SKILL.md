---
name: ethniafrica-clip-reel
description: Turn a third-party video plus a prompt into a publishable vertical reel package for EthniAfrica — the passage cut out of the video, framed 9:16 over its own blur, captioned in French in 2–4 word blocks coloured by speaker, signed with the project watermark — plus its cover image and one description per network (TikTok, Instagram, YouTube Shorts, Facebook, X, LinkedIn). Use for « fais un montage de cette vidéo », « découpe cet extrait », « sous-titre cette vidéo en reel », « miniature + descriptif », « clip reel », or /ethniafrica-clip-reel. A social-only piece, outside the idee → structure → produire chain; it publishes nothing, schedules nothing and clears no rights.
---

# clip-reel — one video and one prompt in, a reel package out

You cut, caption and dress a **third-party** video the operator points at. The
prompt says _which passage_ and _which angle_; you decide nothing beyond that, and
you hand back files, not a plan.

**Where it sits.** This is a social-only piece in the sense of
`docs/design/gabarits-social/EDITORIAL-CONTRACT.md`: no site fiche, no ledger entry,
no `post.md`, and it is **not a fourth step** of the chain. What it inherits from
the project is the _look_ (the watermark, the fonts, the cover rules of
`docs/design/gabarits-social/GABARITS-SOCIAL.md` §1 ter) and the _register_ (below).

The renderer is `social/harness/ethni_clip_reel.py`; its plan is the contract, and
its tests are `social/harness/test_ethni_clip_reel.py`. **Change behaviour there,
test first — never in a one-off script.**

## The five products

1. **The reel** — 1080 × 1920, source frame centred over its blurred self, French
   captions of two to four words, one ink per speaker (white, project gold), the
   watermark under them. A fixed engine: the same plan always draws the same file.
2. **The cover** — the source frame, a title in Anton, capitals, the last words in
   the project accent, the watermark. Eight words at most; the copy yields, the type
   never shrinks.
3. **Six descriptions** — `.claude/skills/ethniafrica-clip-reel/references/network-captions.md`.
4. **A verification note** — what you checked, what the video asserts that you could
   not confirm, and the rights reminder. Said in the final report, not in the post.
5. **The plan file** — kept next to the outputs so a cut can be redone.

## Steps

**0. Restate before you touch anything.** Say what you understood of the prompt
(which passage, which angle, who speaks) and wait if it is ambiguous. A cut that
misattributes a position cannot be repaired by a caption.

**1. Transcribe, locally and free.** Word timestamps are what makes exact cuts
possible; a transcript without them cannot place a boundary.

```
python3 -m venv <workdir>/venv
<workdir>/venv/bin/pip install faster-whisper
<workdir>/venv/bin/python .claude/skills/ethniafrica-clip-reel/scripts/transcribe.py <video> <workdir>/words.json
```

`transcribe.py` decodes the audio through ffmpeg itself: `faster-whisper`'s own
decoder breaks on some `av` releases. Diarization (who speaks) is **not** local. Get
it from a still frame — extract one at the instant, and look — or, only if the
operator agrees to a paid call, from the speech-to-text MCP with diarization. Never
guess a speaker from the words.

**2. Choose the passage from the prompt.** Read the whole transcript first. Two
traps measured on the first use:

- **A source can repeat itself.** The Surrounded clip replayed 15 s of its own
  exchange. The word-level transcript shows it; keep one pass, the one that
  continues.
- **Crosstalk.** Segment boundaries from the recogniser are coarse; a hard cut lands
  mid-word or lets the next speaker's first words in. Take boundaries from the
  **word** timestamps, listen for the overlap, and re-transcribe the _output_ to
  check the cut (step 5).

**3. Write the plan** (`references/plan.example.json` is the shape):
`clips` are the kept source ranges in order; each `phrase` is one speaker turn or
sentence inside a single clip, with its French translation; `thumbnail` names the
frame, the title lines and the accent. Then:

```
python3 social/harness/ethni_clip_reel.py validate plan.json
```

It refuses a phrase that straddles a cut, a third speaker, a title over eight words,
and an accent that does not close the title.

**4. Translate as the speaker said it.** Faithful, plain, spoken French. No
softening, no sharpening, and never a claim added to a phrase to make the excerpt
land. A term with no clean French equivalent (« chattel slavery ») is given once,
in French with the original in parentheses.

**5. Render, then check it like a reader.**

```
python3 social/harness/ethni_clip_reel.py reel plan.json <out>/reel.mp4
python3 social/harness/ethni_clip_reel.py thumbnail plan.json <out>/cover.png
```

Needs the engine's environment (`social/harness/venv`, Pillow and NumPy) and `ffmpeg`.
The output must be **outside any git checkout** — `ethni_paths.assert_writable`
refuses otherwise, on purpose. Then:

- re-transcribe the _rendered_ audio: the first word of each clip must be whole, and
  no sentence of the next speaker may bleed in;
- pull three frames (start, middle, a speaker change) and **look**: caption ink,
  the watermark, the source's own logo still visible;
- a suite that is green does not prove the frame is right.

**6. Write the descriptions** from `references/network-captions.md`. Choose the
flavour the prompt asks for: the _debate_ (who holds which position) or the _word
origin_ (« D'où vient le mot X ? », the project's own subject).

**7. Report.** Files and where they are; what was cut and why; every claim in the
video you could not confirm; the two open decisions (rights, and whether the piece
answers its own cover question).

## The register — what this project refuses, in this format

- **A position is attributed to whoever holds it**, never to a scholar or an
  author fronting the sentence, and never as the project's own. « Pour l'un… pour
  l'autre… », « il avance que… ». The full ruling is the _Reader-facing register_
  section of `CLAUDE.md`.
- **A contested claim is not carried flat.** Where the video asserts something the
  sources do not settle, say « il avance que » in the caption, name it to the
  operator, and suggest a cut or a source card. Do not correct the speaker in the
  captions and do not add the project's view.
- **Never** write « ce sont ses mots, nous ne les avons pas vérifiés » or any
  variant in a produced text: the caption attributes, it does not disclaim.
- **Verify before asserting**, and cite at the right tier. A quick encyclopedia read
  is a first pass, **never a source shown to the reader**. For a word's origin,
  where several are proposed and none is established, say so and name more than
  one, or none.
- **A cover question is a debt.** The piece — reel plus description — must answer
  what the cover asks. If it cannot, change the cover: on this project a hook whose
  question is not paid is bait. A reel's own title law is « D'où vient le nom « X » ? »
  (GABARITS-SOCIAL §1 ter); a third-party clip may use another title, but say so.
- **No « atlas »** in reader-facing text: « nous », « notre projet », EthniAfrica.
- **The source is credited**, in every description, with a link when the operator has
  one. Its own logos stay visible in the frame.

## What this skill never does

- publish, schedule, or move a file into the library; that is the operator's act;
- clear the rights to a third-party video — it **reminds**, every time, and says the
  credit line is not a licence;
- write into the repository: outputs go elsewhere, and the plan file with them;
- add a speaker beyond two, a caption over four words, or a title over eight.
