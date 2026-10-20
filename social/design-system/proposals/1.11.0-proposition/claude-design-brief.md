# Claude Design brief: EthniAfrica Cartes 1.11.0, the animated satellite map

Brief for Claude Design, to paste into the Claude Design conversation of EthniAfrica Cartes (https://claude.ai/artifact/FMuUA1zKTU9P8qwdrmmQML). It builds on the accepted Cartes 1.10.0 (accepted and integrated on 19 October 2026). It replaces question 11 of the 1.10.0 brief (globe scenes), which 1.10.0 did not answer.

## The decision

The operator, 19 October 2026, reviewing the animatic of the long Burkina Faso episode (series 1, episode 19, about 4 min, five chapters):

- The map carries the video. Whenever the narration places something (a people, a route, a kingdom, a colony, a border), the screen is a map. Most of an episode is map.
- The video must be understood without sound, from the map and the subtitles alone. The map itself says the key facts in words: names, dates, what moves where.
- The map is animated: areas light up, change, fade out; arrows draw a people's route; illustrations show what is at stake.
- Satellite, not a flat printed map. The flat map looked « aseptisée ». Every map is drawn on satellite imagery (the verified Blue Marble of the satellite video), seen from straight above.
- The video opens on a globe. A 3D satellite globe appears, turns to Africa and dives onto the subject; the view then becomes the flat satellite map. The globe is the way in, not the whole video.
- Illustrations, not pictograms. What is at stake is shown as the real thing: a gold nugget, kola nuts, people on the move, a war between kingdoms. Small, drawn, on the map.
- Closer views, true proportions. The map is zoomed in enough to read at 430 px. A route arrow never outweighs the area of the people or kingdom it describes: its width, its head and its illustration stay subordinate to the area.
- Maps when the text situates, pictures when it does not. A sentence with nothing to place gets a picture. No ping-pong: a picture is a phase of its own, held for whole sentences, never a 2 to 3 second insert between two maps. The share of maps and pictures follows the text; it is not fixed. Scripts will be written in map phases and picture phases.

Reference: the animatic of the episode, https://claude.ai/artifact/YG1vXNGHT33w92fGGNAZF2 (version 3: satellite globe opening, satellite map, thin arrows, gold and kola sketched as objects). Its arrows, illustrations and timings are sketches to be designed, not a design.

## What 1.11.0 must define

The accepted rules stay: the map sequence of 1.5.0 (areas and names entering on the word that says them), the chapters of 1.7.0, the head, the band, the subtitles, the foot, the double outline of 1.9.0, and the ending and calm zones of 1.10.0. Today a series map card allows one camera move only, the 900 ms change of view between two cards, refuses callouts and forbids a globe. 1.11.0 extends this.

1. The opening globe. How the 3D satellite globe appears, turns, dives and becomes the flat satellite map; its length; where the band, the head and the first subtitle sit during it.
2. Area states. An area can light up, stay as quieter context, change colour (a territory passing to another colony) and fade out, on satellite imagery. Certain and approximate (hatched) areas in each state. How long each change takes, and how many areas may be lit at once.
3. Route arrows. A people's migration or a column's march: an arrow that draws itself from A to B along a curve, with a head at one end or both (exchanges). Width, ink per people, outline on imagery, how long the draw takes, how many arrows at once, and whether an arrow stays or fades once drawn.
4. Illustrations on the map. A small set for this series, drawn as the real things: a gold nugget, kola nuts, cattle, horsemen, traders, a war between kingdoms, a colonial column, workers. Style (illustrated, consistent with the satellite ground, never emoji or flat pictograms), size at 430 px, the label under each, how one enters and leaves.
5. Proportions. A rule tying an arrow's width and head, and an illustration's size, to the smallest area on screen, so that a route never outweighs a people.
6. Words on the map. For silent viewing the map carries short phrases: « burkina = la personne intègre », « 1810 », « exil du roi Wobgo », « frontières gardées ». Face, size, ink and outline on imagery; where they may sit (never under the subtitles); how many at once; how they leave.
7. Camera moves inside a map card. The map moves with the story: pull out from Burkina Faso to West Africa, push in on Ouagadougou. Is a move inside a card allowed, how long, eased how, and how many per card? Or is every move still a change of view between cards?
8. A name that changes on the map. « Haute-Volta » fades and « Burkina Faso » takes its place on the same outline (4 August 1984). How the two names cross.
9. Map and picture phases. The minimum length of a picture phase, how a map phase hands over to a picture phase and back, and the rule against single short inserts. Does a picture still sit full frame, or framed like the document card of 1.8.0?
10. Silent viewing check. A rule the proof can check: every fact the voice says during a map phase has a word, a date, an area, an arrow or an illustration on screen while it is said.

## Boards wanted

At 1080 × 1920 and mounted at 430 px, frames at the start, the middle and the end of each:

- the opening: the globe appearing, turning to Africa, diving onto Burkina Faso, then the flat satellite map with the country lit;
- the Dioula: the Manden lit, the traders, the arrow to Kong and Bobo-Dioulasso, the gold nugget and the kola nuts;
- the Mossi: the Mamprusi kingdom, the horsemen, three arrows lighting the Mossi kingdoms one by one;
- 1932: Haute-Volta split into three colours with arrows to the three colonies, the workers' arrow to the plantations, then 1947 rejoining;
- 1984: « Haute-Volta » becoming « Burkina Faso » on the same outline;
- each illustration at 430 px, next to the smallest area it may sit on.

## After acceptance

The engine change is made test first in a PR into recette (social/video/series-map.mjs, series-sequence.mjs, series-page.mjs, and the satellite video's globe in page.mjs), with the boards deposited in social/design-system/proposals/1.11.0-proposition/.
