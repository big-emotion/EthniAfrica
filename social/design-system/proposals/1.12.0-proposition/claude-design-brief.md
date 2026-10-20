# EthniAfrica Cartes 1.12.0: teaching cards that move (week table, name formula, drawings, parchment text)

This brief builds on the accepted Cartes 1.11.0 (the animated satellite map, accepted on 19 October 2026) and on the series idents (intro bumper and end card). Every accepted rule stays: the head, the band, the subtitles, the foot, the chapters of 1.7.0, the ending of 1.10.0, the map grammar of 1.11.0, picture phases of 6 s at least, the reading speed (17 characters a second recommended, 21 at most).

## The episode that needs it

Series 3 « Mon nom, mon histoire », n° 1, « Kouassi et Yao » (about 4 min, six chapters). The Akan day names: a child is named after the day of birth; the name is built from the day's word (A + ya = Aya for a girl; Kwa + ya → Yao for a boy, the Kwa having fallen); the Ivorian (Baoulé) and Ghanaian (Twi) cycles are one day apart (Kouassi is Monday, Kwasi Sunday). The validated narration (v8) is at the end of this brief. Most of the episode explains how a name is made, which nothing on a map can show: these are picture phases, and today they are static cards.

## The operator's decisions (20 October 2026, reviewing narration v8)

1. **The week table reads girl | day | boy**, the day between the two names, one people per table, and its presentation is animated.
2. **The name formulas are animated** more visibly than today's cross-fade.
3. **Drawings in the series' hand** illustrate what a name says (« Yaw, c'est le courageux ; Kwasi, l'agile » ; « Kwa voudrait dire serviteur »), not photographs.
4. **Parchment and motion-design text**: « un fond parchemin avec du texte en motion design qui s'anime », like the intro and the end card, for a passage with nothing to show but words (the 1964 law that turned the name into a family name).

## What the engine does today (facts, for the designer)

- Week table (`week`, 1.8.0): fixed grid of three columns (150 px, 1fr, 1fr): the day, then one cell per people printing « garçon · fille » with the day's word under it; two peoples side by side. A row fades in (300 ms) on the word that names its day. No column order option, no row highlight.
- Formula (`formula`, 1.8.0): each step is a whole state that cross-fades (300 ms) on its spoken word; a `dropped` part stays at 30 % opacity; « = » only when the letters add up, « → » otherwise.
- Pictures: a slow zoom from 100 to 104 %, no pan, no move inside a document.
- Drawings (1.11.0): eight SVG drawings (gold, kola, herders, horsemen, traders, wars, colonial column, workers), placed on map cards only.
- The parchment ground exists only in the idents (rendered separately), not as a series card.

## What 1.12.0 must define

1. **Week table, one people per table.** Columns: girl's name | day (French day, the people's day word under it) | boy's name; the people or language as the table head (« Baoulé », « Twi (ashanti) »). Seven rows. How the table enters (head, then rows one by one on the spoken day, or all rows quickly and then the spoken ones), and a **row highlight** for the rows the voice dwells on (Baoulé: lundi Akissi · Kouassi, vendredi Aya · Yao; Twi: dimanche Akosua · Kwasi, jeudi Yaa · Yaw). Highlight style, how many rows at once, how it leaves. Legibility at 430 px: the longest names are Kwabena, Affoué, Akosua, Memeneda. The table must stay readable at 21 characters a second; say whether it splits in two cards (lundi–jeudi, vendredi–dimanche) or holds as one.
2. **Formula in motion.** The pieces build the name: « A » and « ya » come together into « Aya »; « Kwa » and « ya » join, then « Kwa » visibly falls away to leave « Yao » (with « Kwao » shown briefly as the form still heard); « kissié » shortens to « (ki)ssi » and joins « Kwa » into « Kouassi ». Twi: « Kwasida » loses « da » → « Kwasi »; « A » + « kosua » → « Akosua »; « Yawda » → « Yaw », « Yaa ». Movements, their length, ink of the day part versus the prefix, tied to the voice's word timings (each move starts on its word). Nothing gimmicky: the move must teach the construction.
3. **Drawings on picture cards.** Three new drawings in the same hand as the eight of 1.11.0: a courageous man (Yaw), an agile man (Kwasi), a servant of the day's spirit (Kwa). Constraints: illustrations, never presented as evidence; no identifiable face; no caricature; no Adinkra or other symbol whose meaning we would be asserting without a source; Akan setting without inventing ritual detail. How a drawing sits on a non-map card (with the name and its quality as words, e.g. « Yaw · le courageux »), enters and leaves; the attribution line (« selon Kofi Agyekum », « selon l'historien Kwasi Konadu ») stays as in 1.7.0.
4. **Parchment text card.** The idents' animated parchment ground as a series card, with motion-design text: words appear on their spoken word, key words in ink, a date set large. For this episode: « 7 octobre 1964 » · « loi sur le nom » · « Côte d'Ivoire » · the article's words « Ce nom devient son nom patronymique ainsi que celui de ses enfants » (Loi n° 64-381, art. 3) · « un jour de naissance → le nom d'une lignée ». How many words at once, the quote style versus free words, how it hands over to a map card and back, the minimum length (a picture phase: 6 s at least).

## Questions

1. One week table or two cards per people (reading speed)?
2. Row highlight: ink, frame, scale, or the others receding?
3. Formula moves: slide, drop, fade, or a combination; length of each?
4. The three drawings: full figures or objects (a sword for courage would be a symbol we cannot source: prefer a scene)? Size on a picture card?
5. Parchment card: same ground and grain as the idents, or a calmer still version under the subtitles?
6. Do these cards keep the series head and band, as all series cards do?

Deliver boards at 1080 × 1920 and the 3:4 grid crop, with the timings, as for 1.11.0. The operator accepts the proposition before it is integrated in the engine.

## Validated narration v8 (operator, 20 October 2026)

Chapter titles in brackets are on-screen cards, not spoken.

Aujourd'hui, nous allons parler de l'origine des noms Kouassi et Yao. Avec EthniAfrica, on part des noms qu'on emploie en français pour mieux comprendre l'Afrique et ses peuples. Kouassi, Yao, Konan, Koffi : ces noms de famille sont des jours de la semaine. Et d'un peuple à l'autre, ils ne tombent pas le même jour.

[1. Un nom pour chaque jour]

D'abord, d'où viennent ces noms ? Du grand groupe akan : des peuples qui parlent des langues proches, de part et d'autre de la frontière entre la Côte d'Ivoire et le Ghana. En Côte d'Ivoire, ce sont par exemple les Baoulé, les Agni et les Nzema. Au Ghana, les Ashanti et les Fante, entre autres.

Chez eux, l'enfant reçoit le nom du jour où il est né. Sept jours, donc sept noms de garçon et sept noms de fille.

[2. La fabrication du nom]

Et ce nom se fabrique avec le nom du jour lui-même. Prenons le vendredi. En baoulé, le vendredi se dit ya. Pour une fille, on ajoute A devant le jour : A, ya… Aya. Pour un garçon, on ajoutait Kwa devant le jour. Avec ya, ce Kwa est tombé : il reste Yao. On entend parfois encore Kwao.

Même chose pour le lundi, qui se dit kissié. La fille s'appelle A-kissi : Akissi. Le garçon prend Kwa, devant le nom du jour un peu raccourci : Kouassi.

[3. De l'autre côté de la frontière]

Alors, pourquoi ces noms ne tombent-ils pas le même jour d'un peuple à l'autre ? Passons au Ghana. En twi, la langue des Ashanti, c'est le même principe. Le jour qu'on appelle Kwasida donne Kwasi pour le garçon, et Akosua pour la fille. Le jour Yawda donne Yaw pour le garçon, et Yaa pour la fille.

Ce sont les mêmes noms. Mais chez les Ashanti et les Fante, ils tombent un jour plus tôt que chez les Baoulé : Kouassi naît le lundi, Kwasi le dimanche. Yao naît le vendredi, Yaw le jeudi. Les Nzema, eux, font les deux : ils nomment les jours comme les Baoulé, mais donnent à leurs enfants les noms des Ashanti, aux mêmes jours qu'eux.

Pourquoi ce jour d'écart ? La linguiste ghanéenne Florence Abena Dolphyne propose une explication : chaque peuple aurait calé ses jours sur la semaine européenne de son côté. La semaine anglaise commence le dimanche, la française le lundi. C'est son hypothèse.

[4. Ce que le nom dit]

Ce nom dit plus qu'un jour. Au Ghana, le linguiste Kofi Agyekum rappelle qu'on l'appelle le nom de l'âme. Chaque jour a aussi sa qualité : Yaw, c'est le courageux ; Kwasi, l'agile. Et selon l'historien Kwasi Konadu, Kwa voudrait dire serviteur : chaque garçon servirait l'esprit de son jour.

[5. Devenu nom de famille]

Alors, comment un jour de la semaine devient-il un nom de famille ? En Côte d'Ivoire, c'est une loi qui le fixe. En 1964, elle fait du nom sous lequel chacun est connu son nom de famille, transmis à ses enfants. Un jour de naissance est devenu le nom d'une lignée.

[6. Une base commune]

Résumons. Kouassi et Yao viennent des noms du lundi et du vendredi, en baoulé. Au Ghana, Kwasi et Yaw sont les mêmes noms, donnés un jour plus tôt. Et en Côte d'Ivoire, depuis 1964, ce sont aussi des noms de famille.

Les histoires et les migrations ont été différentes, mais la base est commune. La frontière sépare deux pays ; les noms racontent une histoire partagée.

Et ton nom, d'où vient-il ? Dis-le en commentaire.

Nous pensons que ces noms montrent ce qui nous relie, par-delà les frontières tracées après eux.

L'importance de connaître nos noms. Vous pouvez continuer la recherche sur EthniAfrica, lien en profil.

## Week table data

| Jour     | Baoulé (mot du jour · fille · garçon) | Twi (mot du jour · fille · garçon) |
| -------- | ------------------------------------- | ---------------------------------- |
| lundi    | kissié · Akissi · Kouassi             | Dwoda · Adwoa · Kwadwo             |
| mardi    | djolai · Adjoua · Kouadjo             | Benada · Abena · Kwabena           |
| mercredi | mlan · Amlan · Konan                  | Wukuda · Akua · Kwaku              |
| jeudi    | houé · Ahou · Kouakou                 | Yawda · Yaa · Yaw                  |
| vendredi | ya · Aya · Yao                        | Fida · Afua · Kofi                 |
| samedi   | foué · Affoué · Koffi                 | Memeneda · Amma · Kwame            |
| dimanche | monlin · Amoin · Kouamé               | Kwasida · Akosua · Kwasi           |
