# EthniAfrica Cartes 1.7.0-proposition: the long series video, with chapters

**Status: accepted by the operator on 15 October 2026, with the designer's recommendations on its five questions.** The authority is the design system itself:

- `../../version.json`;
- `../../series.md`, « Vidéo longue et chapitres »;
- `../../handoff.md`, « Renderer integration of 1.7.0 », with its twelve checks;
- the boards below.

The engine is `social/video` (`series.mjs`, `series-page.mjs`). No carousel card changes.

One brief replaced three drafts: « Afrique » (series 6, episode 1, the main test case), « Kouassi et Yao » (series 3, episode 1) and « tribu » (series 4, episode 1). The operator settled the frame before the design:

- the length follows the argument;
- a long video has chapters;
- the hook is recalled between 1 min 15 and 2 min;
- each video carries part of the signed position;
- nothing darkens the image;
- the reading limit is 21 characters a second.

## The operator's answers (15 October 2026)

1. **The chapter card** shows the large number in the accent ink and « sur N », then the chapter's title. Every card of the chapter then carries « n · Titre » in its kicker.
2. **No season count in the band.** It stays « n° 1 ».
3. **A quoted person** is named above the subtitles.
4. **« Prochain épisode : … »** sits under the pill, or on a card of its own when it does not fit.
5. **The signed position** is marked by the kicker « Nous pensons » and the foot « Position d'EthniAfrica ».

## What this folder holds

- `claude-design-brief.md`: the brief the operator gave Claude Design (first in draft pull request #1781).
- `boards/`: the accepted boards as Claude Design drew them, `video-170-*`. Their texts are demonstration text, apart from the « Afrique » and « Kouassi et Yao » frames (`plein-afr-*`, `plein-ky-*`), which carry those proofs' scripts.
  - Chapters: `chapitres`, `chapitre-trois-facons`.
  - Readings, figures and the attribution: `lectures`, `chiffres`, `attribution`.
  - The signed position: `position`.
  - The reminder of the hook: `rappel`.
  - The two endings and the next episode: `fins`.
  - The rhythm of a long video: `rythme`.
  - The cover and the feed at 430 px: `couverture`, `430`.
  - Full frames of the two episodes: `plein-*`.
- `integration-2026-10-15/`: the integration evidence.
  - `planches-et-moteur-430.jpg` shows the « Afrique » board cards drawn by the integrated engine beside Claude Design's full-frame boards at 430 px (step 5 of `docs/design/mockup-first-workflow.md`): the chapter card, figures, readings, the reminder, the names list, the signed card, the question and the ending. Only the subtitles differ; the engine's are demonstration text.
  - `video-tests.json` records the test runs and the reminder.

## Integration, 15 October 2026

**Model** (`social/video/series.mjs`).

- Chapter cards are silent beats, titled from the sequence's `chapters`.
- Each chapter card fills the voice's silence; a short one is refused with the milliseconds missing.
- The « n · Titre » kicker is composed for the video only.
- Items and the quoted person are timed on their word.
- It checks the length and chapters, the reminder's image and window, the signed position, the two invitations, the source label and the next episode.
- Runs of one image change the head only, under one zoom.

**Drawing** (`social/video/series-page.mjs`). Everything above, in the accepted sizes and inks. Hyphenated words never break.

**Carousel.** No card changes: the 89 sample cards render byte-identical with 1.6.0, alternative texts included.

Two precisions taken by the integration, within the accepted rules:

- **The closing card's chunks**, voiced but never shown as subtitles since 1.6.0, leave the subtitle rules (3 to 6 words, 900 px, reading speed). The general invitation's first chunk has seven words.
- **The next episode** stays under the pill after the named invitation and gets its own card after the general one, which takes two lines (measured on the boards). The ending block is still checked against y 820.

**The hook reminder on the recorded voice.** Not measured: « Afrique » has no recorded voice yet. Its proof carries a silent placeholder for the old 40 s script. The design's estimate stands at about 1 min 08, just before the window. The engine reports the reminder's time and warns outside 75 to 120 s once the voice is in.
