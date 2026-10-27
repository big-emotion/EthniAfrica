# Claude Design brief: figures and facts drawn on the map, not written (proposal after Cartes 1.13.0)

From the operator's review of the episode « Afrique » (series 6 « L'Afrique n'est pas un tout », n° 1) on
21 October 2026, rendered on Cartes 1.13.0. Reader-facing examples are in French, as published.

## The operator's request (verbatim)

> « Lorsqu'on présente les chiffres à l'écran, il faut écrire les phrases. Vu qu'on a vu qu'il y a le globe,
> on peut plutôt représenter des illustrations. Si on parle de la moitié, à moins de 20 ans, on peut faire
> des représentations imagées. Par exemple, c'est comme si on remplissait la carte de l'Afrique à moitié,
> je sais pas, d'une couleur. On commence par le bas et on met 20 ans à côté […] On peut mettre, je sais
> pas, des petits bonhommes un peu partout sur l'Afrique, et puis mettre un chiffre pareil pour les langues.
> On peut faire des représentations imagées plutôt que d'afficher des morceaux de texte à l'écran qui
> peuvent être empilés les uns sur les autres. Ça ne sert à rien d'avoir une carte représentative et
> d'afficher du texte. S'il y a du texte, il faut privilégier le motion design […] Si on affiche une carte,
> à ce moment-là, il faut insérer des choses dans la carte pour représenter ce qu'on veut montrer. »

Three screenshots of the figures card were attached: « 54 pays », « 1,5 milliard d'habitants »,
« 1 personne sur 5 dans le monde », « la moitié a moins de 20 ans · monde : 31 » stacked on the map, under
the subtitle that says the same words.

## The problem

Cartes 1.11.0 decided that « the map says the key facts in words », so the video reads without sound, and
the engine's silent viewing check refuses a spoken fact without a mark (a text, an area, an arrow or one of
the eight series-1 drawings). With burned-in subtitles, this makes the map repeat the subtitle: the episode
writes 22 texts on its maps, five of them on the figures card alone, most of them the subtitle's words.

## The principle to design

- **A figure the voice says becomes a visual encoding**, on the map or beside it, not a sentence on the map.
- **Text on the map is kept for names and dates**: a place, an area, a people, a year. No sentence.
- **Where words must move, they move as kinetic typography** (1.13.0's motion family), not as labels.
- **The silent viewing check counts the new encodings as marks of a fact**, so the video still reads
  without sound: the subtitles carry the words, the map carries the facts.
- Nothing is drawn that the narration and its sources do not support. Every encoding states its unit
  (« 1 personnage = 100 millions d'habitants ») and its source in the foot.
- The operator asked on 19 October 2026 for **real illustrations, not flat pictograms** (gold nugget, kola
  nuts): the people and language figures should be drawn in that same illustrated family.

## The encodings requested, with this episode as the test case

| Spoken (narration v9)                                                                       | Today on screen                | Encoding to design                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| ------------------------------------------------------------------------------------------- | ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| « De 54 pays. »                                                                             | text « 54 pays »               | the 54 countries swell one by one in a cascade while a number counts up to 54 beside the continent (count-up, `ease-land`), one word « pays »                                                                                                                                                                                                                                                                                                                 |
| « D'un milliard et demi d'habitants, près d'une personne sur cinq dans le monde. »          | two texts                      | a unit chart: illustrated people popping across the continent, one figure for a stated number (15 figures for 1.5 billion), then a row of five world figures with one lit: « 1 sur 5 »                                                                                                                                                                                                                                                                        |
| « La moitié des Africains a moins de 20 ans ; dans le monde, la moitié a moins de 31 ans. » | one text                       | a fill gauge: the operator suggests filling the map of Africa halfway from the bottom with « 20 ans » beside it. **Risk to resolve:** a fill that starts in the south of the map reads as geography (« the south is younger »), which the figure does not say. Proposed alternative: a separate silhouette of Africa beside the globe, filling like a glass to its middle, labelled « 20 ans », next to a world silhouette at « 31 ans ». Operator to choose. |
| « Et de plus de 2 000 langues. »                                                            | text                           | speech marks or small dots popping all over the continent while a count runs to « 2 000 »                                                                                                                                                                                                                                                                                                                                                                     |
| « D'autres lectures existent : berbère, phénicienne, latine, grecque. »                     | one text listing four readings | each reading pinned to the place its language comes from (Amazigh North Africa, Phoenicia, Rome, Greece), a short arrow from each to Carthage                                                                                                                                                                                                                                                                                                                 |
| « Et l'origine du mot reste inconnue. »                                                     | text « origine inconnue »      | a stamped question mark over the word « Africa » at Carthage                                                                                                                                                                                                                                                                                                                                                                                                  |
| « Les Grecs disaient « Libye ». « Éthiopie » a longtemps nommé tout le sud du continent. »  | two texts                      | the names lettered across the regions they named, in old-atlas curved capitals, « LIBYE » over the north, « ÉTHIOPIE » over the south                                                                                                                                                                                                                                                                                                                         |
| « … l'appellent « Alkebulan », sans citer de source. »                                      | two texts                      | « ALKEBULAN » lettered across the continent with a « sans source » stamp                                                                                                                                                                                                                                                                                                                                                                                      |
| « … ne montrent pas de nom commun, venu de l'intérieur, pour tout le continent. »           | one sentence                   | to design without inventing names: for instance an empty name frame over the continent                                                                                                                                                                                                                                                                                                                                                                        |
| « … la principale source de l'Europe. » (Léon l'Africain)                                   | two texts                      | a drawn book (his description) travelling along the route from Fès towards Europe                                                                                                                                                                                                                                                                                                                                                                             |

Names of places and areas (Carthage, Grenade, Fès, Addis-Abeba, the province, the Égypte area) and the
dates (146 av. J.-C., 1914, 1963) stay as text.

## What is already accepted and stays

Everything in Cartes 1.13.0 (motion and sound, the pop, the swell, the push, the headline bands, drawn
marks), the subtitles with their lit word, the head and band, the foot with its sources, the reading
speed, the double outline, the map band (y 724 to 1296), eight texts at most on the map.

## Deliverables (as for 1.13.0)

Boards at 1080 × 1920 and their 430 px reading, animated previews of the figures card of this episode,
the series.md section and the « Renderer integration » notes (piece fields, engine steps, checks), the
questions for the operator, each with a recommendation.

## Questions for the operator

1. The age figure: the map filled halfway from the bottom (his suggestion), or a separate silhouette
   filling like a glass (recommended for the reason above).
2. The people unit: one figure for 100 million (15 on the continent), or for another round number.
3. Count-up numbers beside the continent: in the head's place, or anchored on the continent.
4. Does a map word ever stay a sentence (for example a signed position), or never.
