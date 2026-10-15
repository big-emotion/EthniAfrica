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
- `integration-2026-10-15/`: the integration evidence.
