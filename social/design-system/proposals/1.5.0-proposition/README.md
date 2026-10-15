# EthniAfrica Cartes 1.5.0-proposition: a spoken map sequence in the series video

**Status: accepted by the operator on 15 October 2026, with the designer's recommendations.** The authority is the design system itself: `../../version.json`, `../../series.md` (« Map sequence »), `../../handoff.md` (« Renderer integration of 1.5.0 ») and the boards below. The engine is `social/video/series-map.mjs`, with `series.mjs`, `series-page.mjs`, `series-render.mjs` and `page.mjs`; the areas come from `social/video/areas.mjs`.

The operator asked on 15 October 2026, for series 2, episode 1 (« Touareg »), that the regions of the self-names appear on the satellite map as the voice says them, one colour each, then the language names on the same regions, and the map again in the summary. A 1.4.1 map card is drawn once; 1.5.0 lets consecutive map cards share one map whose areas enter on the word that names them.

## The operator's answers (15 October 2026)

1. **One colour per name**, not per region: the two regions of Imuhagh (Ahaggar and Ajjer) share one ink.
2. **The view changes between two cards** of a sequence, in 900 ms (27 frames), flat; no single wide view.
3. **A present-day Amazigh area** is built by `areas.mjs` from its own cited source, proposed by the integration and checked by the operator before the episode is produced. Al-Idrīsī's « Pays des Berbères » (`berberes.geojson`), which stands in on the boards, is not used for the episode.
4. **The summary shows everything at once**; nothing replays.

## What this folder holds

- `claude-design-brief.md`: the brief the operator gave Claude Design.
- `boards/`: the accepted boards as Claude Design drew them on the verified Blue Marble file (`video-150-*`): the four beats of the test episode (`carte-1` to `carte-4`), the entry of one area and of several on the word (`entree`, `entrees`, `temps`), the four inks (`encres`), the stacked labels (`etiquettes`), the change of view (`cadrage`, `changement`), the return after a photograph (`retour`), the whole sequence (`sequence`) and the feed size (`430`). Their subtitles are demonstration text, and their Amazigh area is al-Idrīsī's, standing in.
- `integration-2026-10-15/`: the integration evidence. `cards-1.4.1-vs-1.5.0.json`: the 89 sample cards rendered with the 1.4.1 and 1.5.0 design on one browser, identical pixel for pixel, alternative texts included, so the renderer's reference hashes are unchanged.

## Version number

The signature line brief, first filed here, moved to `../1.6.0-proposition/` by pull request #1776 (merged on 15 October 2026); this folder holds the map sequence.
