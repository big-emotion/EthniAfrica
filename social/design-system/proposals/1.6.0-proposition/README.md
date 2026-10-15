# EthniAfrica Cartes 1.6.0-proposition: the signature line at the end of every carousel and series video

**Status: accepted by the operator on 15 October 2026, with the designer's recommendations.** The authority is the design system itself:

- `../../version.json`;
- `../../series.md`, « The signature line »;
- `../../handoff.md`, « Renderer integration of 1.6.0 »;
- the boards below.

The carousel engine is `../../components/bundle.js` (`EthniCards.signatureLine`). The series video reads the same constant from that bundle (`social/video`).

The line is the project's sentence, chosen by the operator on 15 October 2026 (`docs/editorial/essais/afrique-nest-pas-un-tout-2026-10-13.md`, section 5.6):

> Connaître nos noms, décoloniser leur emploi, nous nommer nous-mêmes.

## The operator's answers (15 October 2026)

1. **The voice says the line.** The subtitle band stays empty for the whole ending, the invitation included.
2. **The closing slogan** « Notre objectif : raconter l'origine des noms, avec des sources. » **and the motto « L'Afrique à travers ses noms » are both retired** from the closing card.
3. **A series' fixed closing always has its own card**, the last content card. It never shares the closing card.
4. **The signature line ends every closing card**, in a series or not.

Also settled, against the brief:

- the line has 68 characters with spaces;
- there is no U+2011, which none of the three faces draws: each printed line is set without wrapping instead;
- series 3 counts among the series with no line of its own.

## What this folder holds

- `claude-design-brief.md`: the brief the operator gave Claude Design.
- `boards/`: the accepted boards as Claude Design drew them. Their texts, other than the line and the fixed closings, are demonstration text.
  - `cloture-160-*` show the closing cards of series 6 (a line), series 2 (a question) and series 3 (no line), in Nuit and Parchemin. They also show the order and places, annotated (`ordre`), the line measured (`ligne`), one card or two (`une-ou-deux-cartes`), the closing card with or without the motto (`devise`), the other endings (`autres-fins`) and the feed size (`430`).
  - `video-160-*` show the video endings of series 6 and series 2, the full frame, the guides (`reperes`), the spoken or printed line (`voix`), the timing (`temps`), Parchemin, and the feed at 430 px.
