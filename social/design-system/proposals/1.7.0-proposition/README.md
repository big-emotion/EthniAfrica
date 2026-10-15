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
