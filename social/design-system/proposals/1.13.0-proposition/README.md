# EthniAfrica Cartes 1.13.0-proposition: motion and sound of the series video

**Status: accepted by the operator on 21 October 2026, with the designer's recommendations on its twelve questions** (« j’accepte toutes les recommandations »). The authority is the design system itself:

- `../../version.json`;
- `../../series.md`, « Motion and sound (1.13.0-proposition) », its thirteen parts and « Decided by the operator on 21 October 2026 »;
- `../../handoff.md`, « Renderer integration of 1.13.0 », with its piece data, thirteen engine steps and fourteen checks;
- `../../tokens.json`, the three new families `easing`, `duration` and `sound` and eleven colour tokens;
- `../../assets/Paper/` (the era map's paper fibres) and `../../assets/Flags/` (`bfa.svg`, `hv.svg`);
- the boards below.

The engine is `social/video`. No carousel card changes.

The brief came from the operator's review of a La Minute Géographie Short on the Caprivi Strip (« je la trouve parfaite sur la forme […] Mon objectif est d'arriver à ce niveau de qualité, même sur les publications longues de plus de 4 min »): reach that quality of form on every series video, short to long, with several episodes on one subject and some episodes about a word. The brief is `claude-design-brief.md`.

## The operator's answers (21 October 2026)

1. **Easing:** one family for map and parchment (`ease-enter`, `ease-exit`, `ease-move`, `ease-draw`, `ease-land`).
2. **The pop:** 300 ms, 70 → 106 → 100 %; 110 % for marks under 60 px; one bounce; exits in 200 ms to 92 %.
3. **Picture phases:** the same push as the maps, 6 % every 10 s, replacing 1.4.0's slow zoom of 4 %.
4. **The flash:** one warm flash for every turn (a new era, back to today, the twist), at most one in any 2 s; the twist is told apart by the headline band and its cue.
5. **The era map:** the satellite imagery re-inked as a printed map with the atlas tokens (map-land, map-water, the engraved coast, the paper fibres), no modern border.
6. **Flags:** only a state existing on the date shown, with that date's flag, named by the voice; never a people, a colony or a colonial power's flag over African land; a flag follows the counter.
7. **Format tiers:** a change every 2, 2.5 and 3 s for short, medium and long, with the strong transitions, bands, chapters, recap and end cards of the table.
8. **The subject key:** id, ink, base view, title formula and thumbnail family fixed per subject; the episode number in the kicker, never in the band.
9. **The recap card:** map and one line, 6 s at most (4 s on a short), after the intro ident.
10. **Sound:** one cue palette for all series, one bed per series.
11. **Word episodes:** the parchment alone about 20 s on a short, 30 s on a longer video.
12. **What is left out** of the reference, as the brief lists it: confirmed (no footage insert, no sensational wording, no question hook, sources kept, the lit word kept, no loop ending, no flashes everywhere, no flags on peoples, no 1 to 2 s rate on long videos).

## What was measured on the boards

| Measure         | Value                                                                                                                       |
| --------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Pop             | 300 ms: 70 % to 106 % in 180 ms, 100 % at 300 ms; 110 % under 60 px; exit 200 ms to 92 %                                    |
| Swell           | 700 ms: fill to 135 % of its level at 55 % of the time; borders never move                                                  |
| Continuous push | 6 % of the radius every 10 s on maps and pictures, 3 % on parchment content; at 430 px about 1.5 px a second at the edge    |
| Framing         | a 10 s Burkina Faso card at 5157 ÷ 1.06 = 4865 px of globe radius                                                           |
| Whip zoom       | 700 ms, out to radius 900 and in; blur up to 35 % radial and 160 px directional                                             |
| Warm flash      | 500 ms, peak 92 % at 150 ms; #fff7e6, #f0c882 at 42 %, #c9821f at the edge                                                  |
| Date counter    | Anton 176/156 at x 60, y 318; digits 0.5 em; 1.2, 1.6 or 2.0 s; 4 % settle in 200 ms                                        |
| Drawn marks     | dotted route at the arrow width W, every 2.4 W; river core 5 px on 9 px; circle 7 px on 13 px; cross 9 px, 44 px; pin 58 px |
| Flags           | 86 % on the satellite, 73 % on paper; wave 7 px at 0.6 Hz; unroll 600 ms, roll back 400 ms                                  |
| Headline band   | Anton 104/112 capitals, 18 characters a line, two lines; in 400 ms, out 250 ms                                              |
| Recap card      | 6 s at most (4 s on a short), the previous map at 30 % saturation, marks 0.6 s apart                                        |
| Word card       | the word in Anton 170/170 centred at y 930; parts to 80 %, 150 px apart; stamp from 140 %                                   |
| Mix             | −16 LUFS integrated, −1 dBTP, LRA 8; the bed 17 dB under the voice, +4 dB in pauses                                         |

## What this folder holds

- `claude-design-brief.md`: the brief relayed to Claude Design.
- `boards/`: the accepted boards as Claude Design drew them on the Burkina Faso of series 1, its episode 2 (« Trois langues dans un nom »). Their facts are demonstration text, to be checked by an episode session against its sources (Binger's route, Kong in 1897, Salaga's kola, the senses of Burkina, Faso and -bè, the variant spellings and the flags' adoption dates):
  - `video-1130-jetons.jpg`: the motion tokens;
  - `video-1130-pop.jpg`: the pop and the swell;
  - `video-1130-camera.jpg`: the continuous camera;
  - `video-1130-passages.jpg`: the whip zoom and the warm flash;
  - `video-1130-epoque.jpg`: the era map;
  - `video-1130-compteur.jpg`: the date counter;
  - `video-1130-traits.jpg`: the drawn marks;
  - `video-1130-drapeaux.jpg`: the flags;
  - `video-1130-bandeau.jpg`: the headline band;
  - `video-1130-formats.jpg`: the three format tiers;
  - `video-1130-rappel.jpg`: the recap card;
  - `video-1130-vignettes.jpg`: the thumbnails of one subject;
  - `video-1130-mot.jpg`: the word card;
  - `video-1130-son.jpg`: the sound cues;
  - `video-1130-nappe.jpg`: the music bed and the mix;
  - `video-1130-grille.jpg`: the 3:4 grid crop;
  - `video-1130-430.jpg`: the frames at 430 px.

The seven animated previews stay outside git, in `.local/research/social-production-2026-10-09/design-system-1.13.0-boards/videos/` (540 × 960, 30 frames a second, with placeholder cues synthesized for the boards and their cue lists): `video-1130-pop.mp4`, `video-1130-whip.mp4`, `video-1130-epoque.mp4`, `video-1130-traits.mp4`, `video-1130-bandeau.mp4`, `video-1130-rappel.mp4`, `video-1130-mot.mp4`, and all seven in `video-1130-suite.mp4`; each with its `*.cues.json`. The full-size frames are in `plein-ecran/`. Not deposited: `design-system.json`, the component's `preview.html` and the board renderer and cue synthesizer in `tools/`.
