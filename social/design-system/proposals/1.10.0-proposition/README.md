# EthniAfrica Cartes 1.10.0-proposition: the new ending of videos and carousels

**Status: accepted by the operator on 19 October 2026, with the designer's recommendations on its nine questions** (« je suis tes recommandations »). The authority is the design system itself:

- `../../version.json`;
- `../../series.md`, « The closing (1.10.0) », with its addendum and « Decided by the operator on 19 October 2026 »;
- `../../handoff.md`, « Renderer integration of 1.10.0 », with its addendum « small text on the image » and its eight checks;
- the boards below.

The engines are `social/renderer` (the carousel closing card, through `components/bundle.js`) and `social/video` (`series.mjs`, `series-page.mjs`).

The brief came from the operator's decision of 19 October 2026 on the Burkina Faso episode (series 1, episode 19): every series video and every carousel ends with « L’importance de connaître nos noms. Vous pouvez continuer la recherche sur EthniAfrica, lien en profil. », printed, and spoken in the video. It replaces the 1.6.0 signature line and the « Cherchez [nom] » invitation. An addendum the same day asked about busy pictures, the kicker and the credit. The editorial rule is in `docs/editorial/strategy/social-series.md` (PR #1887 and PR #1888).

## The operator's answers (19 October 2026)

1. **The closing line on two lines**, « L’importance de » / « connaître nos noms. », in the signature line's face (Fraunces 600 56/64) and place: its top at y 318 in the video and at y 760 on the closing card.
2. **The fixed invitation** « Vous pouvez continuer la recherche sur EthniAfrica, lien en profil. », two lines broken after « recherche ».
3. **The pill keeps « ethniafrica.com »**; « Prochain épisode : … » always sits under it.
4. **A closing card's own `body` is not printed.** Outside a series, that sentence goes on the last content card.
5. **The line stays at y 760 on the card**; the freed space goes above the credit.
6. **The carousels change with the videos.**
7. **Busy pictures**: a 9 px blur of the picture under each block of small text, when the card's small-text zones measure 10 or more together (the local standard deviation of L\* in 9 × 9 px windows).
8. **The kicker** at 36/42 px in the accent ink, the gap under it 4 px.
9. **The source and the credit** at 26/32 px, the credit in `on-image-ink`.

The voice says the line and the invitation in four chunks, one per printed line, and the subtitle band stays empty for the whole ending. The apostrophe is printed ’; the engine compares ' and ’ as one letter.

## What was measured

| Measure                                                    | Before       | After        |
| ---------------------------------------------------------- | ------------ | ------------ |
| Busyness under the small text, Tiébélé (opener and ending) | 11 to 13     | 2 to 3       |
| Busyness under the small text, Bobo-Dioulasso              | 5            | 5 (no blur)  |
| Kicker on screen at 430 px                                 | 12 px        | 14 px        |
| Credit on screen at 430 px                                 | 9 px, grey   | 10 px, cream |
| Gap above the credit, series closing cards                 | 76 px        | 95 px        |
| Gap above the credit, series 1 with its recap              | 51 px        | 70 px        |
| Gap above the credit, `seq-9`                              | 6 px         | 70 px        |
| Video ending block                                         | y 318 to 816 | y 318 to 728 |

The spoken ending lasts about 6.7 s at 17 characters a second. Busyness is the mean, over a zone, of the standard deviation of perceptual lightness (L\*, 0 to 100) in 9 × 9 px windows. A calm sky measures about 2. The 79 sample cards other than the ten closing cards render pixel-identical with 1.9.0, alternative texts included (Claude Design's comparison on Chromium 141).

## What this folder holds

- `claude-design-brief.md`: the brief relayed to Claude Design, with its addendum.
- `boards/`: the accepted boards as Claude Design drew them. The cards are the sample's and the Burkina Faso episode's.
  - Video, `video-1100-*`: the Burkina Faso ending (`fin`), on light pictures (`fin-claire`), the signed card then the ending (`ordre`), without a next episode (`sans-episode`), the variants that were not kept (`variantes`), the time (`temps`), the feed at 430 px (`430`), and full frames (`plein-fin-bfa`, `plein-fin-place`).
  - Video addendum: the busy pictures (`chargee`, `chargee-detail`), the kicker (`surtitre`), the credit (`credit`), before and after at 430 px (`lisibilite-430`), and the opener and the ending at full size (`plein-ouv-apres`, `plein-fin-apres`).
  - Carousel, `cloture-1100-*`: the closing cards before and after (`avant-apres`), in Nuit and Parchemin (`themes`), series 6's last content card and its closing card (`serie-6`), where the freed space goes (`place`), the cards at 430 px (`430`), and two cards at full size (`plein-serie-pays-07`, `plein-seq-9-parchemin`).
