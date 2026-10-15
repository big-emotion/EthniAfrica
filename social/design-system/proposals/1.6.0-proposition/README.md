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

## Integration, 15 October 2026

**Carousel.** The bundle draws the line from `EthniCards.signatureLine` on every closing card, its top settled at y 760, with no title and no motto. The renderer refuses a closing card with a title, or a line pushed below 760. It reports the line's place, text, line count and overlaps, ends the alternative text with the line, and checks the line against `version.json` on recovery.

The board-only option that kept a fixed closing on the closing card is not carried, since a fixed closing always has its own card (decision 3). Nor is the scratch harness patch.

The 89 sample cards were rendered on the pinned browser:

- the 79 cards that are not closing cards pass unchanged against their accepted references;
- the ten closing cards change by design, are checked by eye against `boards/` and Claude Design's card renders, and are re-accepted (`social/renderer/README.md`, « Fidelity baseline »);
- a complete fidelity check passes 89 of 89.

**Series video.** The ending draws the line from the same constant, top at y 318. Loading requires the closing card to say the line in three chunks, then the search sentence. The closing card's chunks are voiced, but no subtitle shows during the ending. The hold is unchanged.

**Not in this integration.** The reading limit of 21 characters a second belongs to pull request #1778, still open when this was integrated. `series.md` keeps the wording on `recette` until that pull request lands.

## Clipped reels and the satellite video, 16 October 2026

The operator extended the line to two formats outside the card system on 16 October 2026. Both kept the motto « L'Afrique à travers ses noms » and had no signature line.

- **Clipped reels** (`.claude/skills/ethniafrica-reel-clip/`). A reel now ends on its last picture, held in silence, with the signature line where the captions were (Fraunces 600 56/64, three lines). No caption, box or replaced text can cover it. The ending lasts the time to read the line at 21 characters a second plus 0.3 s, which is 3.6 s. The motto leaves the reel's signature and its cover.
- **The satellite video** (`social/video/page.mjs`, Vidéo carte 0.4.0). In both endings, the line takes the motto's place under the word EthniAfrica, in the same face and size, and the pill of ending A moves down with it.

Both read the line from `version.json`. `integration-2026-10-16/` holds the frames: `reel-fin-large-et-vertical.jpg` shows, for a wide and a tall source, the last clip and then the ending; `video-carte-fins-a-et-b.jpg` shows the satellite video's two endings.
