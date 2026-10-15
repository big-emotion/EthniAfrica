# EthniAfrica Cartes 1.8.0-proposition: the document card and the teaching cards

**Status: accepted by the operator on 15 October 2026, with the designer's recommendations on its five questions.** The authority is the design system itself:

- `../../version.json`;
- `../../series.md`, « Document and teaching cards »;
- `../../handoff.md`, « Renderer integration of 1.8.0 », with its nine checks;
- the boards below.

The engine is `social/video` (`series.mjs`, `series-document.mjs`, `series-page.mjs`). No carousel card changes.

One brief gathered the cards two episodes needed:

- « tribu » (series 4, episode 1, slot 27 October) needs the document card: a page of text as the image, its quoted passage read on a phone;
- « Kouassi et Yao » (series 3, episode 1) needs the name-making formula, the side-by-side forms and the week table.

The operator settled the frame before the design: the image fills the frame, only text sits on it, nothing is fitted to the networks' interface and nothing darkens the image. Any departure was to be shown with its variant and left to the operator.

## The operator's answers (15 October 2026)

1. **The page out of focus** around the passage, blurred by 7 px. The passage stays sharp and is never retouched.
2. **The page's edge on dark ground**, at most 400 px, is allowed when the passage sits near the top or the bottom of a page. This is an accepted departure from 1.4.0's « the image fills the frame ».
3. **On a web capture**, our title sits on a margin added above the article. The column's own headline is the underlined passage.
4. **The week table** takes one card when the voice leaves it 10 s, two cards otherwise. Whether it enters « Kouassi et Yao » stays the operator's call.
5. **The formula's signs**: « = » only when the letters add up, « → » when the form changes. Dropped parts show at 30 %.

## What this folder holds

- `claude-design-brief.md`: the brief the operator gave Claude Design (first in draft pull request #1781).
- `boards/`: the accepted boards as Claude Design drew them, `video-180-*`. Their texts are demonstration text. The documents are the « tribu » episode's working files, and the Camer.be page on the boards is a simulation of the new capture, not production material.
  - The document card: `documents` (the recommended treatment) and `documents-nets` (the same framing without the blur), `passage` (before and after its word), `bord-de-page` (the page's edge), `capture` (the web capture rule), `changement` (a photograph followed by a document).
  - The teaching cards: `formule` (the five steps and the Monday case), `cote-a-cote` (before and after « un jour plus tôt »), `semaine` (the week table and its split).
  - The feed at 430 px: `430`.
  - Full frames: `plein-*`.
- `integration-2026-10-16/`: the integration evidence.
  - `planches-et-moteur-430.jpg` shows Claude Design's full-frame boards (left of each pair) beside the integrated engine's frames (right) at 430 px (step 5 of `docs/design/mockup-first-workflow.md`). Top row: the four « tribu » scans on the episode's own page files (Hanoteau, Académie 1835, Code de l'Algérie, Lugard). Bottom row: the Friday and Monday formulas, side by side and the week table of « Kouassi et Yao ». Only the subtitles and the chapter kicker differ: the engine's subtitles are demonstration text, and the acceptance video has no chapters.
  - `video-tests.json` records the test runs, the frames and the framing of each document.

## Integration, 16 October 2026

**Model** (`social/video/series-document.mjs`, `series.mjs`). The framing on the passage, the refusals of checks 1 to 8, the underline's word, the formula's steps, and the side-by-side and week rows entering on their words.

**Drawing** (`social/video/series-page.mjs`). The page drawn twice, blurred and sharp; the page's edge on dark ground; the underline; the formula; the two teaching tables, in the board's sizes and inks.

**Carousel.** No card changes: the 89 sample cards render byte-identical with 1.7.0, alternative texts included.

Three precisions taken by the integration, within the accepted rules:

- **The web capture's foot** reads « Capture : … » in place of « Source : », as series.md item 7 writes it. The boards drew « Source : Capture : … ». In the card it is `sourceLabel: "Capture"`, since 1.7.0 refuses a source text that carries its own label.
- **A side-by-side row** enters on its first name (« Kouassi » of « Kouassi · Akissi »), or on its first cell's own `say`. **A week row** enters on its day when the voice says it, otherwise with the card. The handoff names no word for these rows.
- **The week table's reading time** counts its names and day words, as the design does (« about 10 s » for the full week).

**Open for the operator: check 1's x range.** The handoff's check 1 refuses a passage outside x 60 to 1020. The engine applies it as written. Three of the five accepted boards' passages fall outside it as Claude Design measured them: Code de l'Algérie 68 to 1028 (the passage ends near the page's right edge), Lugard 57 to 1023 (the cover scale sets it 967 px wide) and the simulated Camer.be capture 30 to 1050. So the engine refuses those three cards as framed on the boards. series.md item 1 lets the other words of a wide passage leave the frame, and checks only y 700 to 1300. Either check 1 is amended to match, or the episode gives these cards narrower passages, another crop or another scan. The comparison frames of Code and Lugard were drawn with the x range lifted in a scratch copy of the engine.
