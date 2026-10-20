# Series

**1.12.0-proposition, 20 October 2026, accepted by the operator the same day:** the parchment card, the week table one people per table, the formula in motion, drawings on teaching cards and the parchment text card (« Teaching cards in motion and the parchment card (1.12.0-proposition) » below). **1.11.0-proposition, 19 October 2026, accepted by the operator the same day:** the animated satellite map of the series video, its opening globe, area states, route arrows, drawings and words on the map (« The animated satellite map (1.11.0-proposition) » below). **Series idents, 19 October 2026, the operator's decision:** the intro bumper after the opener and the end card in place of the 1.10.0 video ending (« The series idents in the video » below). **1.10.0-proposition, 19 October 2026, accepted by the operator the same day:** a new ending for every series video and every carousel, replacing the signature line and the invitation (« The closing (1.10.0) » below). **1.9.0-proposition, 16 October 2026, accepted by the operator the same day:** a second contour under every text on the image of the series video (« Legibility on light pictures: the double outline » below). **1.8.0-proposition, 15 October 2026, accepted by the operator the same day:** the document card and three teaching cards in the series video (« Document and teaching cards » below). **1.7.0-proposition, 15 October 2026, accepted by the operator the same day:** the long series video, with chapters on screen (« Vidéo longue et chapitres » below). **1.6.0-proposition, 15 October 2026, accepted by the operator the same day:** the project's signature line at the end of every carousel and every series video (« The signature line » below). **1.5.0-proposition, 15 October 2026, accepted by the operator the same day:** a map sequence in the series video, areas and names entering on the word that says them, one map across several cards (« Map sequence » below). **1.4.1-proposition, 14 October 2026, accepted by the operator the same day:** in the series video, map cards are drawn on satellite imagery (« Map cards on satellite imagery » below); nothing else changes. **1.4.0-proposition, 14 October 2026, accepted by the operator the same day:** the series video in full screen replaces layout B (« Vidéo de série » below). **1.3.0-proposition, 13 October 2026, accepted by the operator on 14 October 2026 with video layout B, since withdrawn.** It adds three things to the accepted 1.2.0-proposition and changes nothing else: one series band, a carousel model for each of the seven series, and one 9:16 video model. A card without `series` renders exactly as in 1.2.0: the 37 non-series sample cards were rendered again with 1.3.0 and compared with the 1.2.0 references, pixel for pixel identical.

The editorial frame is `docs/editorial/strategy/social-series.md` (13 October 2026): seven series, a fixed question and fixed beats per series, a video every episode, and a carousel only when the episode takes apart an attested received idea. « The accepted card system, plus one band carrying the series name and the episode number. No separate design per series. »

## The series band

One component for all seven series: « D'où vient le nom de mon pays ? · n° 14 ». Its words change from series to series, never its colour, size or place.

| Property | Value                                                                                                                                                                           |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Field    | `series: { id, episode }` on the card spec; the engine resolves `id` from `EthniCards.SERIES` (the seven names below). `series: { name, episode }` prints a name given in full. |
| Place    | the top of the card, full width, 0 to 72 px (operator, 13 October 2026)                                                                                                         |
| Height   | 72 px: 70 px of band on `ground` and a 2 px `rule` line under it                                                                                                                |
| Text     | Nunito Sans 800, 28/34 px (the kicker's size), tracking 0.02 em, left on the 72 px margin                                                                                       |
| Colours  | series name `ink`, separator `ink-faint`, « n° 14 » `accent` (operator, 13 October 2026)                                                                                        |
| Wording  | sentence case, no guillemets, French spacing; the episode is « n° » and a whole number                                                                                          |
| Tokens   | none added: `ground`, `rule`, `ink`, `ink-faint`, `accent` already hold in Nuit and Parchemin                                                                                   |

The seven names, as `EthniCards.SERIES` prints them: `pays` « D'où vient le nom de mon pays ? », `nom-recu` « Le nom qu'on leur a donné », `nom-famille` « Mon nom, mon histoire », `mots` « Les mots qu'on nous a collés », `frontieres` « Un peuple, plusieurs pays », `afrique-tout` « L'Afrique n'est pas un tout », `villes` « Ce que les villes racontent ».

### What the band changes on a card

1. **The image window starts under the band.** A photograph is placed from y 72, never under the band; its focal point must fall between the band and the panel (`report.image.focusInWindow`). The window keeps the operator's 450 px (ruling of 9 October 2026), so **a series card's panel stops at 828 px** instead of 900 (`EthniCards.PANEL_MAX_SERIES`). Past 828 px the body goes dense, then the card is refused, exactly as at 900 on other cards. The fix is editorial: shorten or split, never shrink. A photograph's credit line counts in those 828 px.
2. **Maps.** The map stays full bleed under the band, so its frame must leave the band clear: no map text, marker, key, callout or inset within 12 px of the band (y 84). The renderer reports anything closer (« À moins de 12 px du bandeau de série »), counts the band as a box in `report.collisions`, writes atlas names on the map only below y 84 and refuses an atlas key that starts above it. On the samples, the 1880 atlas is reframed (view moved down and 3 % smaller, keys on the Atlantic below the Cape Verde islands) and the 1914 map moved down by 80 px: see `serie-atlas-1880` and `serie-atlas-1914-parchemin`.
3. **The maquette tape** moves under the band (top 100 px).
4. **Alternative text** opens with the band's words: « D'où vient le nom de mon pays ?, n° 1. Le nom d'un pays… ».
5. **Capacity.** The band holds on one line. With « n° 100 », the longest name ends at 627 px of the 1008 px available (measured in Chromium, both themes, `bandeaux-n100.png`); about 25 more characters would still fit. A band that wraps is refused (« Bandeau de série sur deux lignes ») : shorten the series name, never the type.
6. **Every card type** takes the band, in both themes: opener, explanation, forms and pair, dated card, map and atlas map, closing card. The 49 model cards and the two atlas samples show each one.

## One carousel model per series

`handoff/cards.sample.json` holds the seven models of the proposal folder as sample cards `serie-<series>-NN`, 6 to 8 cards each, built from the existing card types only, with their reference images. Series 1, 2 and 3 carry demonstration data drawn from the corpus fiches (Burkina Faso, Touareg, Yao and Kouassi); series 4 to 7 carry labelled placeholders in brackets. Every card keeps its yellow tape and its `provenance` line (the beat it serves, the fiche field its text comes from). No claim, date or source was added or rewritten; `nom-famille` card 4 fits 828 px with its credit line exactly.

| Series                            | Cards | Theme     | Sample ids                      |
| --------------------------------- | ----- | --------- | ------------------------------- |
| 1 D'où vient le nom de mon pays ? | 7     | Nuit      | `serie-pays-01` to `07`         |
| 2 Le nom qu'on leur a donné       | 8     | Parchemin | `serie-nom-recu-01` to `08`     |
| 3 Mon nom, mon histoire           | 7     | Nuit      | `serie-nom-famille-01` to `07`  |
| 4 Les mots qu'on nous a collés    | 7     | Nuit      | `serie-mots-01` to `07`         |
| 5 Un peuple, plusieurs pays       | 7     | Parchemin | `serie-frontieres-01` to `07`   |
| 6 L'Afrique n'est pas un tout     | 7     | Nuit      | `serie-afrique-tout-01` to `07` |
| 7 Ce que les villes racontent     | 6     | Parchemin | `serie-villes-01` to `06`       |

The carousel of each series is shown at 430 and 320 px in the `Lecture` asset group (`serie-NN-<series>-430.png`, `-320.png`).

## Images

Decision 6 of 13 October 2026: every model card that carries an image gets one. None of the design system's own sample images (Kampala, Mengo, Speke, Richardson) truthfully fits these subjects. The verified pictures below come from the site's credited library (`public/images/anecdotes/CREDITS.md` and `public/images/home/CREDITS.md`), where each licence was read from the Commons API; the files there are web renditions (583 to 1100 px wide), so production needs the full-resolution file from its Commons page. A slot without a verified candidate shows a plain « image à trouver » panel saying what the picture must show: a hatched slot with a frame, never an image that could pass for a place, a person or a document. No image was generated and no source was invented. Images of people follow the brand charter: no face under a contested name, no identifiable face without consent.

| Card                    | What it shows                                                                                                                                               | Credit (verified)                                                                                       |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `serie-pays-01`         | Maison aux murs peints de la cour royale de Tiébélé, au Burkina Faso                                                                                        | Photo : Alexander Leisser, cour royale de Tiébélé (Burkina Faso), 2016, Wikimedia Commons, CC BY-SA 4.0 |
| `serie-pays-02`         | La Grande Mosquée de Bobo-Dioulasso, au Burkina Faso                                                                                                        | Photo : Angeline A. van Achterberg, Grande Mosquée de Bobo-Dioulasso, 2001, ASC Leiden, CC BY-SA 4.0    |
| `serie-pays-03`         | « image à trouver » : le texte de l'ordonnance du 2 août 1984, ou une photographie datée de Thomas Sankara en 1984, du domaine public ou sous licence libre | —                                                                                                       |
| `serie-pays-04`         | Ouagadougou vue d'avion pendant l'hiver 1930-1931                                                                                                           | Photo : Walter Mittelholzer, Ouagadougou vue d'avion, 1930-1931, domaine public                         |
| `serie-pays-05`         | « image à trouver » : un document daté où on lit le mot « burkinabè » : journal, affiche ou texte officiel                                                  | —                                                                                                       |
| `serie-pays-06`         | « image à trouver » : les ouvrages cités (Maharaux 1995, Izard 1985), photographiés par l'équipe                                                            | —                                                                                                       |
| `serie-pays-07`         | Maison aux murs peints de la cour royale de Tiébélé, au Burkina Faso                                                                                        | Photo : Alexander Leisser, cour royale de Tiébélé (Burkina Faso), 2016, Wikimedia Commons, CC BY-SA 4.0 |
| `serie-nom-recu-01`     | Inscriptions en tifinagh gravées dans la roche, en Algérie                                                                                                  | Photo : Patrick Gruban, inscriptions en tifinagh (Algérie), 2006, Wikimedia Commons, CC BY-SA 2.0       |
| `serie-nom-recu-02`     | « image à trouver » : une page d'un auteur arabe du XIVe siècle où le nom apparaît, manuscrit ou édition numérisés, domaine public                          | —                                                                                                       |
| `serie-nom-recu-03`     | « image à trouver » : un document daté qui emploie Mulatthamin ou Kandin, domaine public                                                                    | —                                                                                                       |
| `serie-nom-recu-04`     | « image à trouver » : un lieu ou un objet du pays tamasheq, sans visage (charte de marque), sous licence libre                                              | —                                                                                                       |
| `serie-nom-recu-05`     | « image à trouver » : les pages de 1857 et de 1864 citées par la fiche, numérisées                                                                          | —                                                                                                       |
| `serie-nom-recu-06`     | « image à trouver » : la page de 1864 où le nom est refusé, numérisée                                                                                       | —                                                                                                       |
| `serie-nom-recu-07`     | Inscriptions en tifinagh gravées dans la roche, en Algérie                                                                                                  | Photo : Patrick Gruban, inscriptions en tifinagh (Algérie), 2006, Wikimedia Commons, CC BY-SA 2.0       |
| `serie-nom-recu-08`     | Inscriptions en tifinagh gravées dans la roche, en Algérie                                                                                                  | Photo : Patrick Gruban, inscriptions en tifinagh (Algérie), 2006, Wikimedia Commons, CC BY-SA 2.0       |
| `serie-nom-famille-01`  | « image à trouver » : un objet ou un document akan lié aux noms du jour de naissance, sans visage identifiable sans accord                                  | —                                                                                                       |
| `serie-nom-famille-02`  | the map itself                                                                                                                                              | —                                                                                                       |
| `serie-nom-famille-03`  | « image à trouver » : un calendrier des jours akan ou un objet documenté qui le porte                                                                       | —                                                                                                       |
| `serie-nom-famille-04`  | Rochers dans la vallée de Tanoboase, près de Techiman, au Ghana                                                                                             | Photo : Kelsdark, Tanoboase près de Techiman (Ghana), 2014, Wikimedia Commons, CC BY-SA 3.0             |
| `serie-nom-famille-05`  | « image à trouver » : la source de 1881 où apparaissent Yaw et Kwasi, page numérisée                                                                        | —                                                                                                       |
| `serie-nom-famille-06`  | « image à trouver » : une image qui invite à raconter son nom : registre, faire-part ou carte d'identité anonymisée                                         | —                                                                                                       |
| `serie-nom-famille-07`  | Rochers dans la vallée de Tanoboase, près de Techiman, au Ghana                                                                                             | Photo : Kelsdark, Tanoboase près de Techiman (Ghana), 2014, Wikimedia Commons, CC BY-SA 3.0             |
| `serie-mots-01`         | « image à trouver » : [à choisir avec l'épisode] : le mot dans un document daté où il est employé                                                           | —                                                                                                       |
| `serie-mots-02`         | « image à trouver » : [à choisir avec l'épisode] : le mot dans un document daté où il est employé                                                           | —                                                                                                       |
| `serie-mots-03`         | « image à trouver » : [à choisir avec l'épisode] : le mot dans un document daté où il est employé                                                           | —                                                                                                       |
| `serie-mots-04`         | « image à trouver » : [à choisir avec l'épisode] : le mot dans un document daté où il est employé                                                           | —                                                                                                       |
| `serie-mots-05`         | « image à trouver » : [à choisir avec l'épisode] : le mot dans un document daté où il est employé                                                           | —                                                                                                       |
| `serie-mots-06`         | « image à trouver » : [à choisir avec l'épisode] : le mot dans un document daté où il est employé                                                           | —                                                                                                       |
| `serie-mots-07`         | « image à trouver » : [à choisir avec l'épisode] : le mot dans un document daté où il est employé                                                           | —                                                                                                       |
| `serie-frontieres-01`   | « image à trouver » : [à choisir avec l'épisode] : la frontière ou le traité qui l'a tracée, document daté                                                  | —                                                                                                       |
| `serie-frontieres-02`   | the map itself                                                                                                                                              | —                                                                                                       |
| `serie-frontieres-03`   | « image à trouver » : [à choisir avec l'épisode] : la frontière ou le traité qui l'a tracée, document daté                                                  | —                                                                                                       |
| `serie-frontieres-04`   | « image à trouver » : [à choisir avec l'épisode] : la frontière ou le traité qui l'a tracée, document daté                                                  | —                                                                                                       |
| `serie-frontieres-05`   | « image à trouver » : [à choisir avec l'épisode] : la frontière ou le traité qui l'a tracée, document daté                                                  | —                                                                                                       |
| `serie-frontieres-06`   | « image à trouver » : [à choisir avec l'épisode] : la frontière ou le traité qui l'a tracée, document daté                                                  | —                                                                                                       |
| `serie-frontieres-07`   | « image à trouver » : [à choisir avec l'épisode] : la frontière ou le traité qui l'a tracée, document daté                                                  | —                                                                                                       |
| `serie-afrique-tout-01` | Carte de l'Afrique gravée vers 1847                                                                                                                         | Carte de l'Afrique, vers 1847, Victor Levasseur, domaine public                                         |
| `serie-afrique-tout-02` | Carte murale de l'Afrique publiée en 1794                                                                                                                   | Carte de l'Afrique, 1794, S. Boulton d'après d'Anville, domaine public                                  |
| `serie-afrique-tout-03` | « image à trouver » : [à choisir avec l'épisode] : une carte ou un document daté lié à la lecture présentée                                                 | —                                                                                                       |
| `serie-afrique-tout-04` | La carte du monde d'al-Idrisi, de 1154, dessinée le sud en haut                                                                                             | Carte du monde d'al-Idrisi, 1154, sud en haut, domaine public                                           |
| `serie-afrique-tout-05` | « image à trouver » : [à choisir avec l'épisode] : une carte ou un document daté lié à la lecture présentée                                                 | —                                                                                                       |
| `serie-afrique-tout-06` | « image à trouver » : [à choisir avec l'épisode] : une carte ou un document daté lié à la lecture présentée                                                 | —                                                                                                       |
| `serie-afrique-tout-07` | Carte de l'Afrique gravée vers 1847                                                                                                                         | Carte de l'Afrique, vers 1847, Victor Levasseur, domaine public                                         |
| `serie-villes-01`       | « image à trouver » : [à choisir avec l'épisode] : la ville, photographie sous licence libre, ou son ancien nom sur un document daté                        | —                                                                                                       |
| `serie-villes-02`       | « image à trouver » : [à choisir avec l'épisode] : la ville, photographie sous licence libre, ou son ancien nom sur un document daté                        | —                                                                                                       |
| `serie-villes-03`       | « image à trouver » : [à choisir avec l'épisode] : la ville, photographie sous licence libre, ou son ancien nom sur un document daté                        | —                                                                                                       |
| `serie-villes-04`       | « image à trouver » : [à choisir avec l'épisode] : la ville, photographie sous licence libre, ou son ancien nom sur un document daté                        | —                                                                                                       |
| `serie-villes-05`       | « image à trouver » : [à choisir avec l'épisode] : la ville, photographie sous licence libre, ou son ancien nom sur un document daté                        | —                                                                                                       |
| `serie-villes-06`       | « image à trouver » : [à choisir avec l'épisode] : la ville, photographie sous licence libre, ou son ancien nom sur un document daté                        | —                                                                                                       |

## Vidéo de série

**1.4.0-proposition, 14 October 2026, accepted by the operator the same day: the series video in full screen.** On 14 October 2026 the operator withdrew decision 4 (layout B, the video's own card kept in the feed's safe zone), which came from a misunderstanding of the design: « L'image dans la vidéo doit prendre tout l'écran. Il ne doit pas y avoir de zones d'ombre comme sur les cartes des carrousels, et il ne doit pas y avoir de réajustement par rapport à la visibilité de l'écran. La vidéo prend tout l'écran, et il n'y a que le texte. » Settled, not to reopen:

1. The image fills the whole 1080 × 1920 frame, edge to edge, for the whole video.
2. No shadow zones: no dark panel, no fade into `ground`, no veil, no scrim. Legibility comes from the text itself.
3. The layout is not fitted to the networks' interface: the Meta and TikTok safe zone and the button column place nothing. The apps cover part of the text in the feed, as for the Vidéo carte 0.4.0 « plein écran ».
4. Only text sits on the image: the band's words, the head of the card, the subtitle with its lit word, sources, credit and signature, and on the ending the slogan, its sentence and the pill (since 1.6.0-proposition, accepted: the signature line in place of the slogan).

The model is **Vidéo carte 0.4.0 « plein écran »** (accepted on 12 October 2026), text in fixed bands over a clear image, minus its veil. Everything else in 1.3.0 stays: the cards, the band on cards, the seven carousel models, the images. The boards are drawn by `handoff/video-board-full.html` (`?card=…&next=…&fade=…&sub=…&lit=…&zoom=…&guides=1`) and kept in the `Video` asset group as `video-14-*`. Their text is demonstration text, and their images are the web renditions of the library, enlarged 1.8 to 3.7 times: the boards are soft where production, from the full-resolution files, will be sharp.

**Unchanged from 1.3.0**, except the length and the reading speed. 1080 × 1920 at 30 frames a second, on the operator's voice, the same cards as the carousel. Vidéo carte 0.4.0's subtitle chunks (3 to 6 words, two lines of 26 characters at most), the lit word, the reading rule and the voice timing. Frame 0 is the opener with its band and no subtitle; a video never shows « Faites défiler ». The ending « série » asks for one search and needs `pageOnline: true`.

**Reading speed, operator decision of 15 October 2026.** 17 characters a second is a recommendation; 21 is the limit. The first episode of series 4 (« tribu », about 3 min 30) was voiced faster than 17 in places, and the operator chose to relax the rule rather than slow the voice further or cut the text: « assouplissons la règle ». A chunk read between 17 and 21 characters a second loads with a warning (`warnings` in the manifest); past 21 a subtitle cannot be read, and the chunk is refused. No visual rule changes.

**Length, operator decision of 15 October 2026.** 35 to 75 seconds is a recommendation, no longer a limit: « il ne faut pas que ça soit bloquant pour le moteur ». The first episode of series 2 needed more than 45 s to hold its research. A video outside the range loads and exports with a warning (`warnings` in the manifest); it is a reason to reread the script, not a refusal. No visual rule changes.

### Bands

At 1080 × 1920, every text between x 60 and 1020.

| Band        | y                                                            | What it holds                                                                                                                                                                                                                                     |
| ----------- | ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Demo tape   | 178 to 226, right on x 1020                                  | « Démonstration : texte non validé », mockups only                                                                                                                                                                                                |
| Series band | 250 to 290                                                   | Nunito Sans 800 32/40, tracking 0.02 em: name `on-image-ink`, separator `on-image-faint`, « n° N » `on-image-accent`. No rule line: the 2 px rule closed a band of ground that no longer exists; on the image it would be a drawn line, not text. |
| Head        | 318 to 700 at most                                           | kicker Nunito Sans 800 30/36 `on-image-accent`, then the title in Anton 88/90 (the opener's 116/112), three lines at most; or, on a dated card, the date (see Long dates), the label `NOM EMPLOYÉ` and the name employed in Anton 76/82           |
| Clear image | 700 to 1300                                                  | nothing but the picture: the focal point is brought to (540, 1000)                                                                                                                                                                                |
| Subtitle    | 1316 to 1452                                                 | Vidéo carte 0.4.0: centred on x 540, lines at most 900 px wide                                                                                                                                                                                    |
| Foot        | 1652 to 1786, bottom aligned (a map card's from 1600, 1.4.1) | a map's key (swatch and text, Nunito Sans 800 26/32), `Source :` (Nunito Sans 700 24/30) and the credit (700 22/28, `on-image-muted`)                                                                                                             |
| Signature   | 1836 to 1884                                                 | logo 44 px and « EthniAfrica » in Fraunces 600 32/38, from x 60                                                                                                                                                                                   |

Measured on the boards: the head ends between y 544 and 700 on content cards (700 for a three-line opener, 690 for a two-line date), the foot starts at 1696 at the highest (a map with two key rows).

**Why the band sits at y 250.** Instagram and TikTok show a 3:4 crop of the cover in the profile grid (y 240 to 1680). At y 250 the band and the title stay in that thumbnail, so the grid reads as a series. This is not a fit to the feed: the apps still cover the band's top and everything under y 1248 while the video plays in the feed (`video-14-fil-430.png`).

### The photograph

- **Framing.** The image covers the frame: scale = max(1080 ÷ width, 1920 ÷ height). Its focal point (`image.focus`) is brought to (540, 1000), the middle of the clear zone, as far as the image's edges allow. The slow zoom from 100 to 104 % grows around the focal point. The card's `anchor` and `zoom` do not apply in the video.
- **Too wide.** The crop keeps 1080 ÷ (width × scale) of the width: 33 % of the tifinagh rock (900 × 529), 37 % of Tiébélé and of the 1930 aerial view, 61 % of al-Idrisi's map, 87 % of the Bobo-Dioulasso mosque (`video-14-cadrage.png`). The renderer reports it (`keptWidth`). When the subject is wider than the crop, the card gives a video framing, `image.video: { src, focus }`, another file or another focal point. Never a letterbox, never a blurred copy behind the image, never a band.
- **Too small.** A frame pixel may stretch at most 1.5 source pixels, zoom included: the visible crop needs at least 720 × 1280 source pixels (750 × 1333 with the 104 % zoom). Below that the renderer refuses the image (« Image trop petite pour la vidéo ») and production takes the full-resolution file from its Commons page. The library's web renditions are 1.8 to 3.7 times too small, which is why the boards are soft.
- **Focal point out of reach.** When the image runs out before its focal point reaches y 700 (al-Idrisi, focus at 0.3 of the height, lands at y 576), the renderer warns; set `image.video.focus`.
- **Map card.** In the series video a map card is drawn on satellite imagery by the satellite video engine (1.4.1-proposition, accepted on 14 October 2026, « Map cards on satellite imagery » below). The flat 9:16 view of 1.4.0 (`map.videoView`, a subject brought to (540, 1000) on the card's base map, a refusal when the base map is too short) is withdrawn with it, and so is the 9:16 base map per region.

### Legibility: one text treatment

Every text on the image, on light and dark pictures, in both themes, is set the same way: light letters on a dark outline painted under them, Vidéo carte 0.4.0's subtitle treatment. `-webkit-text-stroke` in `on-image-stroke` (#0b0806 at 92 %) with `paint-order: stroke fill`, so the outer half of the stroke edges each letter, plus a soft shadow (`on-image-shadow`, 0 2px 14px from 40 px up, 0 1px 8px below). Nothing darkens a region of the image.

| Text                                                               | Type                                    | Outline      |
| ------------------------------------------------------------------ | --------------------------------------- | ------------ |
| Subtitle                                                           | Nunito Sans 800 56/68, `on-image-text`  | 9 px (0.4.0) |
| Opener title                                                       | Anton 116/112                           | 13 px        |
| Title, slogan                                                      | Anton 88/90, 84/88                      | 10 px        |
| Date                                                               | Anton 176/156 to 104/100                | 14 px        |
| Name employed                                                      | Anton 76/82                             | 8 px         |
| Band, kicker, label, key, source, credit, sentence, pill, wordmark | Nunito Sans 22 to 34 px, Fraunces 32 px | 4 px         |

The letter always meets its outline, never the picture. Against the outline, even laid over pure white: `on-image-text` 16.3:1, `on-image-ink` 14.1:1, `on-image-accent` 9.3:1, `on-image-muted` 9.0:1, the area inks 8.2:1 (`area-b`) and 6.4:1 (`area-c`), `on-image-faint` 6.0:1; the lit word, `on-image-on-accent` on `on-image-accent`, 10.2:1. Tested on the lightest images (Boulton's 1794 map, mean luminance 218; al-Idrisi 187; the tifinagh rock 188; Levasseur's 1847 map 179), the darkest (Tanoboase 112, the « image à trouver » slot 37) and the busiest (the 1930 aerial view, Tiébélé's painted walls): `video-14-lisibilite.png`. If a text still cannot be read on an image, the remedy is the framing (`image.video.focus`), another crop or another image, never a band. 1.9.0-proposition (accepted) adds a second contour to every text on the image and retires the soft shadow: see « Legibility on light pictures: the double outline » below.

**Parchemin.** The on-image inks are the same in both themes. Parchemin's own inks cannot sit on a dark outline: `ink` (#2a1e15) and `accent` (#7f5212) read under 2:1 against it. The other way, dark letters on a light outline, was drawn on the tifinagh rock and on Tanoboase (`video-14-parchemin-encres.png`, right of each pair): it reads, but makes white halos on a dark picture and would sit beside the 0.4.0 subtitle, light on dark, in the same frame. Parchemin therefore shows where the video has ground of its own: an « image à trouver » slot is drawn on parchment (decision 1). Since 1.4.1, a map card is drawn on imagery and has no Parchemin ground.

### Legibility on light pictures: the double outline (1.9.0-proposition, accepted)

**Proposed and accepted by the operator on 16 October 2026, with the designer's recommendations on its two questions** (« Decided by the operator » below). Brief: the Burkina Faso episode (series 1, episode 19), relayed by the coordinator on 16 October 2026 (`proposals/1.9.0-proposition/claude-design-brief.md` once deposited). The operator finds the cream text hard to read on light or busy pictures. Settled, not reopened: the image fills the frame, no shadow zone, no band, no veil over a region, nothing fitted to the networks' interface (« Vidéo de série », points 1 to 4).

**What was measured.** The picture behind each band of text, framed as the engine frames it, in linear luminance (90th percentile, `video-190-probleme.jpg`): the painted wall of Tiébélé 0.59 under the title, Mittelholzer's 1930 aerial view 0.69 under the subtitles, the sky of the Ouagadougou boulevard 0.53 under the title, Boulton's 1794 map 0.90 everywhere. The inks: `on-image-text` 0.96, `on-image-ink` 0.82, `on-image-accent` 0.53, `on-image-muted` 0.51, `on-image-faint` 0.32. Against the bare picture the letters then read at 1.0:1 to 1.8:1; the credit and the accent are darker than such a picture. Each letter stands out only by its outline, and at 4 px (the band, the kicker, the source, the credit) the outline shows 2 px outside the letter: on a light, detailed picture the eye loses the word's shape.

**Five treatments, drawn on the same frames** (`video-190-options-*.jpg`): A, 1.4.0 as accepted; B, the same outline 1.75 times wider; C, a double outline; D, a tight shadow (three drop shadows chained on the outlined letters); E, a veil under each line, the box of the line and 0.2 em on each side. Measured on thirteen frames (the four lightest pictures: Tiébélé on the opener and on the ending, the 1930 aerial view under two heads, Boulton's map under two heads, the boulevard's sky; the darkest: Mouhoun, Tanoboase and the lower half of Bobo-Dioulasso; the sky of the Place de la Révolution; two 1.8.0 document cards, Académie 1835 and Lugard 1922), as the contrast between the letter and what surrounds it within 0.12 em (at least 4 px), the lit word's box left out, 90th percentile, as rendered (`video-190-mesures.jpg`):

| Worst of the thirteen frames                                      | A (1.4.0) | B      | C (accepted) | D     | E     |
| ----------------------------------------------------------------- | --------- | ------ | ------------ | ----- | ----- |
| Band, 32 px                                                       | 1.3:1     | 4.1:1  | 6.7:1        | 5.4:1 | 4.8:1 |
| Kicker, 30 px                                                     | 1.0:1     | 3.0:1  | 4.8:1        | 4.1:1 | 3.2:1 |
| Subtitles, 56 px                                                  | 1.2:1     | 11.4:1 | 7.9:1        | 7.4:1 | 4.9:1 |
| Edge of the lit word                                              | 1.0:1     | 1.1:1  | 6.2:1        | 6.5:1 | 1.6:1 |
| Source, 24 px                                                     | 1.3:1     | 4.6:1  | 6.8:1        | 5.7:1 | 4.8:1 |
| Credit, 22 px                                                     | 1.2:1     | 3.2:1  | 4.4:1        | 3.8:1 | 3.0:1 |
| Picture light taken away within 24 px of the text, light pictures | 11 %      | 20 %   | 30 %         | 36 %  | 48 %  |

Titles, dates and names: the worst case is the date « 1er mars 1919 » in the accent ink on Boulton's map, the lightest picture (1.0:1 in A, 1.7:1 in C); the median of the thirteen frames goes from 1.7:1 (A) to 7.8:1 (C). The credit, in `on-image-muted`, stays near 4.5:1 in C on Boulton's map only (4.4:1 and 4.6:1 on its two frames; 5.1:1 to 5.8:1 on the other light pictures). The letter against its own outline is unchanged by every option (16.3:1 for the subtitles, 14.1:1 for the cream text, 9.0:1 for the credit).

- **B, a wider outline**, helps the subtitles most, but gives the large titles a heavy sticker edge and leaves the lit word's box lost on a light picture.
- **D, a tight shadow**, reads almost as well as C and looks softer, but takes more light from the picture around the text (36 %) and reads less well on the small text (credit 3.8:1).
- **E, a line veil**, is a box: it brings back the « zone d'ombre » the operator removed on 14 October 2026 (« Vidéo de série », point 2), takes the most light (48 %) and reads less well than C or D, because the veil is partly transparent and the letters keep their light edges on it.
- **C, the double outline**, gives the best worst case for every small text and for the lit word, for less picture taken away than D or E. It follows the letters: the dark reaches 5 px past a 22 px credit and 9.5 px past a subtitle. On a dark picture it melts into the image and nothing changes to the eye (`video-190-sombres.jpg`).

**The rule (C, accepted).** Every text on the image, in both themes, keeps its 1.4.0 outline (`on-image-stroke`, the widths of « Legibility: one text treatment »). Then:

1. **A second contour.** The outlined letters, grown by r = max(3, round(0.6 × the outline width)) px, in `on-image-ring` (#0b0806 at 62 %), its edge softened by 0.6 px.
2. **A soft shadow from that contour**, a Gaussian blur of the grown shape with a standard deviation of r, in `on-image-ring-soft` (#0b0806 at 45 %). It replaces the 1.4.0 soft shadow (`on-image-shadow`), which no text on the image uses any more.
3. **The lit word** keeps its box in `on-image-accent`; the box gets a 2 px edge of `on-image-stroke` around its 6 px side extensions and a shadow of 12 px spread 4 px at 55 %, and the subtitle line's second contour goes round it. On a light picture the box no longer disappears (edge 1.0:1 in A, 6.2:1 in C).

| Outline     | r         | Texts                                                                           |
| ----------- | --------- | ------------------------------------------------------------------------------- |
| 4 px        | 3 px      | band, kicker, label, key, source, credit, sentence, pill, wordmark, small items |
| 5 to 6 px   | 3 to 4 px | readings, figures' labels, attribution, formula day line                        |
| 8 px        | 5 px      | name employed, signature line                                                   |
| 9 px        | 5 px      | subtitles                                                                       |
| 10 px       | 6 px      | title, slogan                                                                   |
| 12 px       | 7 px      | figures, formula                                                                |
| 13 to 14 px | 8 px      | opener and chapter titles, date, chapter number                                 |

One second contour per block of text (the band, the kicker, a title, a subtitle line, the source line): the words of a block share it. Nothing else changes: the inks, the sizes, the bands and places, the card change, the map cards' names on imagery (1.4.1 and 1.5.0 keep their own halo), the 1.8.0 document card (its sharp passage and underline are not text on the image; the head and subtitles over the blurred page take the double outline, `video-190-document.jpg`), and every carousel card.

**Parchemin.** The on-image inks are the same in both themes; so is the double outline.

#### Boards (1.9.0)

`Video` group, `video-190-*`: the problem on a working render of the Burkina Faso episode, the five treatments on Tiébélé, the 1930 aerial view, Boulton's map and the boulevard's sky, the dark pictures, the subtitles and the lit word, the foot, the band and the kicker, the 1.8.0 document card, the ending, the measures, the 430 px strip and six frames at full size. Drawn by a scratch copy of `handoff/video-board-full.html` patched for the five treatments (`?legi=A` to `E`); since the acceptance the board renderer on this page carries the patch and draws the double outline by default (`?legi=A`, `B`, `D` or `E` redraws the others for comparison). The cards are the episode's; the Boulton, Mouhoun, Place de la Révolution and Tanoboase frames carry its texts as demonstration, and Boulton's map is the library's web rendition, softer than production.

#### Decided by the operator on 16 October 2026

The two questions were answered with the designer's recommendations:

1. **Treatment C, the double outline**: the 1.4.0 outline kept; a second contour, r = max(3, round(0.6 × outline)) px, in `on-image-ring` at 62 %; its soft shadow (standard deviation r, `on-image-ring-soft` at 45 %) replacing the 1.4.0 soft shadow.
2. **The lit word's box** gets the 2 px dark edge.

### Long dates

The date takes the largest of 176/156, 148/136, 124/118 and 104/100 that holds on one line in 960 px. Below 104 px, never: the date goes on two balanced lines at 104/100, and a date never breaks inside itself (day, month and year are joined by no-break spaces). A date that does not fit two lines at 104 is refused: shorten its display. On `video-14-dates.png`, with test dates that are not content: « 1984 » and « 4 août 1984 » at 176, « 1er mars 1919 » at 148 (811 px wide), « entre 1884 et 1885 » at 124, « du 15 novembre 1884 au 26 février 1885 » on two lines at 104; the head then ends at y 690. This settles the layout B defect where « 1er mars 1919 » wrapped at 124 in a 640 px head.

### Cover, card change, ending

- **Cover.** Frame 0: the opener's image, band, kicker and title, credit and signature, no subtitle (`video-14-couverture.jpg`).
- **Card change.** One change of 300 ms; nothing slides. The two images cross-fade over the whole 300 ms. The outgoing card's head and foot fade out in the first 150 ms and the incoming card's fade in during the last 150 ms, so two heads never show at once (`video-14-changement-1.jpg` at 100 ms, `-2.jpg` at 200 ms). The band and the signature are drawn once for the whole video and never fade. The subtitle sits above the cards: the outgoing card's last chunk stays until the new card's first chunk appears, at the end of the change (0.4.0 voice rule; decision 2).
- **Ending « série ».** The closing card's own image, full frame. Band at 250; slogan in Anton 84/88 capitals, centred, three lines at most; its sentence in Nunito Sans 700 32/40; the site pill (outlined in `on-image-accent`, its line edged inside and out by 2 px of `on-image-stroke`); the whole block from y 318 to 820 at most (808 measured). The last two chunks in the subtitle band. The credit centred above the signature; the signature centred, logo 56 px and Fraunces 44/48, from y 1828 to 1884. It holds 2.5 s, or until the voice ends plus 0.5 s (`video-14-fin.jpg`, `video-14-fin-parchemin.jpg`). 1.6.0-proposition (accepted) replaces the slogan by the signature line, which the voice says, and leaves the subtitle band empty on the ending: see « The signature line ».

### The seven gaps between the layout B boards and the engine, settled

1. **Kicker on a dated card: shown.** The date's marker label (« Le nom d'avant », « Nom de l'État ») is its kicker, as on the card: it says what the date is.
2. **Signature on content cards: yes,** small and bottom left (y 1836 to 1884), drawn once so it never fades. A downloaded or reposted video keeps its signature. No `ethniafrica.com · @ethniafrica` on content cards: the ending carries the site.
3. **Ending signature: centred, bottom on y 1884** (1828 to 1884), the same baseline as on content cards.
4. **The outgoing card's last subtitle stays during the change,** as the engine does (0.4.0: a chunk is cut when the next one appears).
5. **French spacing: the cards' rule** (`EthniCards`' `fr`), in every text of the frame, subtitles included: a narrow no-break space (U+202F) before ; : ! ? and » and after «, so « Faso ? », « Source : », « « désert » »; a no-break space in « n° 1 » and inside the searched name of the ending.
6. **Subtitle outline: the 0.4.0 values,** as the engine has them: 9 px of rgba(11, 8, 6, 0.92), shadow 0 2px 14px rgba(11, 8, 6, 0.7), the lit box with a 6 px radius and 6 px side shadows. The board's #1a120a and 4 px radius were the board's error.
7. **The lit word lights with its spoken word.** A chunk appears 150 ms before its first word, which lights only when it is spoken (`highlightAt`), as the engine does. The 1.3.0 boards lit a word on the chunk's first frame; they were wrong.

### « Image à trouver » on a video frame

The renderer draws the slot itself across the whole frame, never the slot PNG enlarged, whose label would be cut off: hatching in the theme's ground (Nuit dark, Parchemin light), a 2 px `rule` frame 48 px inside the edges, and the label in the clear zone (y 760 to 1240, x 120 to 960): « IMAGE À TROUVER » in Nunito Sans 800 30/36 capitals, `on-image-accent`, then what the picture must show, Nunito Sans 700 40/52, both with the on-image outline. A card with a slot gives that text in `image.find`; the 1.3.0 slot PNGs carry it only as pixels. A final video still refuses a slot (`video-14-image-a-trouver-nuit.jpg`, `-parchemin.jpg`).

### Map cards on satellite imagery (1.4.1-proposition, accepted)

**Accepted by the operator on 14 October 2026, from his decision of the same day.** In the series video a map card is drawn by the satellite video engine, on imagery, and no longer on its flat base map. Settled, not to reopen: the satellite view fills the frame edge to edge like every image of the series video; no flat 9:16 base map is built per region, and the flat base maps (`assets/Cartes/*.json`) stay for the carousel cards; the video has one map grammar, the satellite video's (Vidéo carte 0.2.0 to 0.4.0): certain areas filled with a solid edge, uncertain areas hatched with a dashed edge, borders none, quiet or strong, a dark keyline under every bright mark, every name on its halo. The rest of 1.4.0 stays as accepted. Boards: `video-141-*` in the `Video` group, drawn by `handoff/video-board-full.html` with `?sat=` and `handoff/video-board-sat.js`, on the verified Blue Marble file.

- **Framing.** A still, top-down view (the flat style's orthographic projection), centred on the middle of the subject's longitude and latitude box: the highlighted country, or the union of the card's areas. The centre sits at (540, 1010) and the radius is fitted so the subject fills a box of 840 × 520 px (x 120 to 960, y 750 to 1270), within the scale limit below. The slow zoom from 100 to 104 % grows around (540, 1010), as on a photograph. No globe opening, no camera travel and no relief inside a card: a map card is one card among others, entered and left by the 300 ms change. 1.11.0-proposition (accepted) adds the opening globe and moves inside a card: see « The animated satellite map ». Relief stays a satellite video option: it needs a tilted camera, whose horizon would sit under the head. The subject's box must stay below y 724 and above the foot.
- **Grade.** `sat-grade-recede` from the first frame, since the overlays are on screen at once. The satellite shader's edge vignette and the ending's dimming are off: the series frame darkens no region of the image.
- **Highlight.** Each highlighted country is its Natural Earth 1:50m admin 0 outline (version 5.1.2, already pinned for the satellite video), drawn as a certain area in the card's ink: fill at 30 %, a 4 px edge over an 8 px keyline. The inks are the satellite video's, the same as the on-image ones: `area-a` #e8b96a, `area-b` #6cc3b5, `area-c` #e3876a.
- **Areas.** The card's areas are in its base map's units; each base map's `meta` names an equirectangular projection at k px per degree from a top-left origin, so longitude = origin longitude + x ÷ k and latitude = origin latitude − y ÷ k (`afrique-ouest`: 19 px, 19° W 30° N; `grands-lacs`: 140 px, 28.45° E 4.42° N; `afrique`: 12 px, 28° W 38° N). Certain areas are filled, approximate ones hatched at 45° (135° for an area inside an earlier one) with a dashed edge, in the ink of their `tone`.
- **Borders.** `none`: none. `quiet`: a 2 px light dash over a 5 px keyline. `strong`: a 3.5 px light line over an 8 px keyline, named « Frontières actuelles » in the key. The lines are the land borders shared by two Natural Earth countries inside the frame: the card's own border paths stop at its base map's edge, and coastlines are never drawn, since the imagery shows them.
- **Names.** `countryLabels: "highlight"` names the highlighted country (Natural Earth's French name) at its interior point, in tracked Anton 44/52 on its halo; `true` names every country in the frame. The card's `labels` of kind area take Nunito Sans 700 32/38 in their area's ink; `places` a dot and Nunito Sans 800 28/32; `waterLabels` italic #bfe0ea 26/30. At most six names on screen, every one between y 724 and 1296 and x 60 and 1020, placed by the 0.4.0 rule (candidates around the anchor at 44, 40 then 36 px, 12 px clearance, the key as fallback).
- **Key.** In the foot as text, with the satellite swatches (a certain area at 35 % with a 3 px edge, an approximate one hatched with a dashed edge, the strong border line), in two columns from three items. A map card's foot may start at y 1600 (1642 measured on `serie-frontieres-02`, three items).
- **Atlas cards: carousel only.** `serie-atlas-1880`, `serie-atlas-1914-parchemin` and the independence maps are refused in a series video (« Carte d'atlas : carrousel seulement »). Their 8 categorical colours, up to 45 named territories, regional numbered keys, period marker and insets exceed the satellite grammar of 3 inks, 6 names and 4 key items, and would cover the image. The episode's video leaves the atlas card out of its beats; the voice can say what it shows over another card.
- **Parchemin.** On imagery there is no Parchemin ground: a Parchemin series map card is drawn exactly like a Nuit one, same imagery, same three inks, same light names on halos (`video-141-parchemin.png`, the carousel card beside its video frame). Parchemin keeps its ground only on the « image à trouver » slot.
- **Scale limit.** The 1.4.0 image rule applies to imagery: no source pixel is enlarged past 1.5, zoom included. The frame is therefore at least 720 source pixels wide: 1336 km with the verified Blue Marble file (21600 px, about 1.85 km a pixel); about 360 km with the 500 m Blue Marble mosaic, once verified and pinned; about 7 km with Sentinel-2 cloudless (10 m), listed but not yet verified. A smaller subject is drawn at the limit, smaller in the frame: `serie-frontieres-02` would fit at 730 km and is drawn at 1336 km, its areas 460 px wide. A subject whose long side falls under 120 px at the limit (a city, a small kingdom: about 150 km with the verified file) is refused (« Sujet trop petit pour l'imagerie vérifiée ») until a finer source is verified.
- **Credits.** The foot reads `Source :` and the card caption's source without its base map clause (« fond Natural Earth »), then, in the credit style, « Imagerie : NASA Earth Observatory ; frontières : Natural Earth, domaine public » (with Sentinel-2: « Imagerie : Sentinel-2 cloudless 2016, EOX », its full attribution in the package).

### Map sequence (1.5.0-proposition, accepted)

**Accepted by the operator on 15 October 2026 with the designer's recommendations, from his request of the same day.** A map sequence is one or more consecutive map cards of a series video that share one map: areas and names enter on the word that says them, and the imagery stays from one card to the next. It extends « Map cards on satellite imagery » (1.4.1): every rule there holds unless this section says otherwise. The test case is series 2, episode 1 (« Touareg »): the self-names region by region, the same word as Amazigh, the language names on the same regions, then, after a photograph, the summary. Boards: `video-150-*` in the `Video` group, drawn on the verified Blue Marble file.

- **Data.** A card's `map.sequence` names its sequence; consecutive cards with the same name share one map. Its areas are files of `social/video/data/areas/` (`map.areas[].file`), built by `areas.mjs` from sourced geometry, never drawn by hand. Each area has a `name` (its label), an optional `lang` (a second line), an `ink` (`a` to `d`) and a `say`: the word of the card's own chunks that brings it in. One name, one area: when a name covers several regions (Imuhagh: the Ahaggar and the Ajjer), `areas.mjs` builds their union as one file, so one name is one outline.
- **Entry on the word.** An area enters when its word starts, at the voice's word time: it fades in over 700 ms, edge and hatching together; nothing grows, draws on or slides. Its name waits until the area is 60 % in, then fades in over 300 ms, and its key item fades in with the area. Two entries are at least 700 ms apart: a word said sooner waits (« Imajeghen », said at 0.70 s, enters at 0.85 s). Several areas named by one word enter together. A language (`lang`) enters on its own word, under its name, over 300 ms; the name does not move, its two-line box being kept from the start. What has entered stays until the sequence ends (`video-150-temps.png`, `video-150-entrees.png`).
- **One colour per name.** Four inks on imagery, each on its dark keyline: `area-a` ochre #e8b96a, `area-b` turquoise #6cc3b5, `area-c` coral #e3876a, and a new `area-d` lilac #c4a8f2. Against its keyline each holds 7.6:1 (coral) to 11:1 (ochre); against bare sand only 1.5 to 2.2:1, which is why no coloured mark is ever drawn without its keyline. Colour never carries the meaning alone: every area carries its name. The colour follows the name, not the region: the two regions of Imuhagh share the ochre, since two colours for one name would read as two names (decision 1). At most four inks in a sequence; a fifth coloured name is refused (« Cinq noms en couleur : quatre au plus ») (`video-150-encres.png`).
- **Hatching survives.** The areas are approximate (`kind: "approximate"`): hatched at 45° with a dashed edge in their ink, as in 0.4.0, never filled. A certain area keeps the 30 % fill.
- **Names on imagery, with an outline.** On the hatching of its own area, the 0.4.0 halo is too weak: an area's name is Nunito Sans 700 32/38 in its ink over a 6 px dark outline painted under the letters, the head's treatment. A language is Nunito Sans italic 700 26/30 in the same ink over a 5 px outline, right under the name.
- **Two labels on one area: stacked.** The self-name, and under it the language in italic (« Imuhagh », then « tamahaq »). A stack counts as one name for the limit of six. Replacing would lose the self-name; appending (« Imajeghen · tamajaq », 280 px) overflows the small areas and reads as one block (`video-150-etiquettes.png`).
- **A map across cards.** Consecutive cards of one sequence never cross-fade their imagery: the map stays, and only the head and the foot change, as in every card change (the outgoing text leaves in the first 150 ms, the incoming text comes in the next 150 ms). The overlays that have entered stay. The slow zoom runs once over the whole sequence, 100 to 104 %, not once per card.
- **A change of view between two cards.** A card of the sequence may need a wider or a closer view: beat 2 frames the Amazigh area of North Africa with the Tuareg regions, 4781 km across instead of 2383. The view then changes during that card change, in 900 ms, eased, still top-down and flat: the only camera move a series video allows. Names fade out in the first 150 ms of the move and back in at their new places after it; areas stay on their ground. An area the new view does not frame (the Amazigh area, when beat 3 goes back to the regions) fades out during the move, with its key item. No move inside a card, no tilt, no globe (`video-150-cadrage.png`; decision 2). 1.11.0-proposition (accepted) allows up to two moves inside a card and the opening globe: see « The animated satellite map ».
- **Back to the map.** A later card of the same sequence after another card (beat 4, after a photograph) comes in by the ordinary 300 ms cross-fade, with everything that had entered by the end of the sequence shown at once; nothing replays. It takes its own view (`video-150-retour.png`).
- **Framing.** Each view is fitted as in 1.4.1 on the areas it frames, 840 × 520 around (540, 1010); every area of a card's view stays between y 724 and the foot, and the scale limit is checked on each view.
- **Key and credits.** The key lists the names on screen with their ink's approximate swatch, two columns from three items, the foot from y 1600. The source line gives the card's source, then where the areas come from, in words: « Source : fiche EthniAfrica Touareg ; aires approximatives d'après Natural Earth et al-Idrîsî (1154) ». Then « Imagerie : NASA Earth Observatory ; contours : Natural Earth, domaine public » (« contours » when the map draws no border, « frontières » when it does).
- **Parchemin.** As in 1.4.1, a Parchemin sequence is drawn like a Nuit one; the boards are series 2, in Parchemin.
- **The boards' areas.** Imuhagh is the union of the Natural Earth 1:10m geography regions AHAGGAR MTS. and Tassili-n-Ajjer, the gap between them filled; Imajeghen is the region AÏR MTS.; Imushagh is a 1° circle around Tessalit, the `areas.mjs` anchor rule, since the Adrar des Ifoghas is not a Natural Earth region; the Amazigh area is the repository's `berberes.geojson`, al-Idrīsī's « Pays des Berbères », standing in for a present-day Amazigh area (decision 3 below). They are board geometries: the episode's files are built by `areas.mjs`.

**Decided by the operator on 15 October 2026,** with the designer's recommendations:

1. **One colour per name**, not per region: the two regions of Imuhagh share the ochre.
2. **The view changes between two cards** of a sequence, in 900 ms, flat; no single wide view.
3. **A present-day Amazigh area** is built by `areas.mjs` from its own cited source, proposed by the integration and checked by the operator before the episode is produced. Al-Idrīsī's « Pays des Berbères » (1154), which stands in on the boards, is not used for the episode.
4. **The summary shows everything at once**; nothing replays.

### Decided by the operator on 14 October 2026

The four open questions were answered with the designer's recommendations:

1. **Parchemin on the image:** the same light inks on a dark outline in both themes; Parchemin shows on map cards and « image à trouver » slots.
2. **Card change:** the heads swap inside the 300 ms (out in the first 150 ms, in during the last 150 ms) while the images cross-fade over the whole 300 ms.
3. **Series band:** at y 250 to 290, inside the profile grid's 3:4 thumbnail.
4. **Map cards whose base map is too short for 9:16:** a 9:16 base map per region (withdrawn the same day: the operator chose to draw the series video's map cards on satellite imagery, 1.4.1-proposition).

### Vidéo longue et chapitres (1.7.0-proposition, accepted)

**Proposed and accepted by the operator on 15 October 2026, with the designer's recommendations on its five questions** (« Decided by the operator » below). Brief: `proposals/1.7.0-proposition/claude-design-brief.md` (draft PR #1781). It replaces three drafts written the same day for « Afrique » (series 6, episode 1), « Kouassi et Yao » (series 3, episode 1) and « tribu » (series 4, episode 1). It builds on the accepted 1.6.0 and changes nothing accepted: the full-screen frame, the band at y 250, the head, the subtitles and the lit word, the foot, the legibility rule, the 300 ms card change, map cards and map sequences, the signature line and the order of the ending, and every carousel card. The document card, the name-making formula, the side-by-side forms and the week table are 1.8.0.

**Settled by the operator on 15 October 2026, not to reopen:** length follows the argument; chapters are required in long videos, titled with the script's own phrases; a reminder of the hook question is spoken between 1 min 15 and 2 min; each video carries part of the signed position; nothing darkens the image. Subtitles read at up to 21 characters a second (PR #1778).

| Episode                                 | Length                           | Chapters                                                                                                                                         |
| --------------------------------------- | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| « Afrique », series 6, episode 1        | about 3 min 10, about 25 cards   | Un continent entier · D'où vient le mot · Le nom s'étend · D'autres noms · Sur place · Un rassemblement choisi · Ce que nous pensons             |
| « Kouassi et Yao », series 3, episode 1 | 3 min 43, voiced, about 15 cards | Un nom pour chaque jour · La fabrication du nom · De l'autre côté de la frontière · Ce que le nom dit · Devenu nom de famille · Une base commune |
| « tribu », series 4, episode 1          | about 3 min 30, 16 cards         | D'où vient le mot · Le sens glisse · Le mot change de niveau · Un mot pour gouverner · Les mots des peuples                                      |

#### Length

A short series video stays 35 to 75 seconds, a recommendation (unchanged). A video longer than 90 seconds is a **long video**: it has chapters, 3 to 7 of them, each at least 15 seconds, and 2 to 4 minutes is its recommended length. Outside these ranges the engine warns; it never refuses for length. Nothing in the accepted grammar depends on the length: every value is a function of the frame number, the slow zoom runs per card (or per run of cards on one image, below), the card change lasts 300 ms however long the video, and the band and the signature are drawn once.

#### The chapter rule

1. **A chapter opens on a chapter card**: the head only, over the chapter's first image (`video-170-chapitres.jpg`). The chapter's number in Anton 176/140 in `on-image-accent`, then « sur 7 » in Nunito Sans 800 30/36 in `on-image-muted` on its baseline, then the chapter's title in Anton 116/112, the opener's size, two lines at most, within x 60 to 960 and y 318 to 700. Measured: « De l'autre côté de la frontière », the longest title of the three episodes, ends at y 695. No subtitle and no source line; the image's credit stays in the foot; the band and the signature as on every card.
2. **Wording.** The title is the script's phrase, word for word, in sentence case, with no full stop. The number is in figures. The word « Chapitre » is not printed: the large number says it.
3. **Time.** The chapter card fills the silence that the voice script already inserts between two chapters. It stays at full opacity at least 1.2 s, and at least the time to read its title at 21 characters a second plus 0.3 s (1.8 s for « De l'autre côté de la frontière »). The voice does not say the title. When the silence is too short, the sequence is refused with the milliseconds missing, and the voice script lengthens the pause.
4. **Enter and leave.** By the ordinary 300 ms card change; nothing slides. The chapter card normally shows the image of the chapter's first content card: then only the head changes (out in the first 150 ms, in during the last 150 ms), the image does not cross-fade and its slow zoom goes on.
5. **During the chapter**, every content card's kicker is « 3 · Le nom s'étend »: the number, a middle dot, the title, as the chapter marker of Vidéo carte 0.3.0 wrote it. The engine composes it from the sequence's chapters; it is never stored in the card, so the same card in a carousel keeps its own kicker. Two cards keep their own kicker: a dated card's marker label (« Le nom d'avant », 1.4.0) and a signed card (« Nous pensons », below).
6. **Why not the other two ways** (`video-170-chapitre-trois-facons.jpg`). A title held in the head over the chapter's first image puts two titles in one head, or changes the head in the middle of a card. The chapter in the kicker alone makes a new chapter a few words changing in a line read at 12 px on a phone: it passes unnoticed. A chapter card that writes « Chapitre 1 sur 7 » above an opener-size title reads as a second opener.

**Replaced on 20 October 2026 by the operator's chapter card** (« The chapter card (operator's decision, 20 October 2026) » below): points 1 and 4 no longer apply; points 2, 3 (with the title's entrance added), 5 and 6 still do.

#### Where the viewer stands

« sur 7 » on the chapter card, and the chapter in the kicker of every card of the chapter. No bar, no « 3 / 7 », no line that fills: they read as a player's controls. The chapter marker stays out of the subtitle band and inside the part of the frame the apps leave clear (`video-170-430.jpg`).

#### The band's numbering

The band stays « n° 1 » (1.3.0). The chapter is never in the band: the band is drawn once and never changes, which keeps the profile grid reading as a series. A season count is not shown. If the operator wants one for series 6, it reads « n° 1 sur 6 », never « 1/6 », which reads as a fraction or a counter; it holds on one line (`video-170-couverture.jpg`, right).

#### Rhythm over three minutes

- **A card every 6 to 10 seconds**, 4 to 12 allowed: about 25 cards for « Afrique » (`video-170-rythme.jpg`).
- **One image may hold several cards in a row**: only the head changes, with no image cross-fade, and one slow zoom (100 to 104 %) runs over the whole run.
- **An image may come back** later in the video (Ortelius 1570 on several cards), by the ordinary 300 ms cross-fade.
- **A detail of the same image** is a card with its own framing (`image.video.focus` and a closer scale), entered by the 300 ms cross-fade, within the limit of 1.5 source pixels per frame pixel. With the Ortelius plate (1864 px wide) a detail can be at most 1.11 times closer than the full frame; a real detail needs the library's full-resolution file.
- **A silent beat** only on a chapter card. Anywhere else a silence leaves the subtitle band empty, as in 0.4.0, and the image keeps moving with its zoom.

#### The hook reminder

The reminder gets a visual cue: its card shows the opener's image again, with the same framing, and the reminder question as its title, shortened to three lines at most (`video-170-rappel.jpg`). The return of the first image tells the viewer « we are back to the question ». It is spoken between 1 min 15 and 2 min; the engine warns outside. For « Afrique », an estimate from the length of the text puts it at about 1 min 08, just before the window: to check once the voice is recorded.

#### Readings, and names with their dates

`readings: { items: [{ label, text, by }] }` on an explanation card (`video-170-lectures.jpg`). The items flow under the title, from the head into the clear zone, and end above y 1290: a readings card is a text card, and its image stays full frame behind, every letter on its outline. Each item: the kind of reading (« berbère ») in Nunito Sans 800 26/32 in `on-image-accent`; the reading in Nunito Sans 800 40/48 in `on-image-text`, two lines at most; its author in Nunito Sans 700 26/32 in `on-image-muted`. Five items at most, all the same size and ink: none is ranked, and they come in the order the voice names them. Each item enters on the word that names it, in 300 ms, its place kept from the card's first frame, as 1.5.0's names do. The card holds at least the time to read its items at 21 characters a second; a list that needs longer is split into two cards. Measured on « Afrique », chapter 2: five items from y 574 to 1222. The same card, without the kind, lists names with who used them and when (chapter 4: Libye, Éthiopie, Alkebulan, Kemet). At 430 px the readings are read at 16 px and their authors at 10 px.

#### A person quoted by role

`attribution: { name, role }` (`video-170-attribution.jpg`). The name in Nunito Sans 800 34/40 in `on-image-text`, the role under it in Nunito Sans 700 26/32 in `on-image-muted`, left on x 60, the bottom at y 1296, just above the subtitle band, where the eye already is. It enters in 300 ms on the word that names the person and stays to the end of the card. The foot's source line still names the work. The foot alone would not do: it is small, it names a text rather than a person, and the apps cover it in the feed.

#### Figures

`figures: { items: [{ pre, value, unit, label }] }`, three or four, in two columns under the title (`video-170-chiffres.jpg`): the number in Anton 112/104 in `on-image-ink`, its unit in Anton 52, a qualifier such as « plus de » in Nunito Sans 800 30/36 in `on-image-muted` above it, and what it counts in Nunito Sans 700 30/38, two lines at most. The source in the foot. Each figure enters on its word. French numbers: « 2 000 » with a narrow no-break space, « 1,5 milliard ». Measured on « Afrique », chapter 1: the four figures from y 488 to 900.

#### The signed position

One rule for a single signed sentence and for a signed chapter (`video-170-position.jpg`): the kicker reads « Nous pensons », in `on-image-accent`, and the foot reads « Position d'EthniAfrica » where a source line would be. A signed card never carries a source line, and a sourced card never reads « Nous pensons ». The title stays in Anton, like every title. A signed chapter opens on its chapter card (« 7 sur 7, Ce que nous pensons »), and each of its signed cards reads « Nous pensons ». Fraunces stays reserved for the signature line, so that the line stays unique (1.6.0, decision 3).

#### The ending of a long video

The 1.6.0 order is unchanged: the series' fixed closing or the question to readers on the last content card, then the ending with the signature line, the invitation, the site pill and the signature (`video-170-fins.jpg`).

1. **Two invitations.** The named form « Cherchez [nom] sur EthniAfrica, lien en profil. » leads to the search page for that name. The general form « Vous aussi, cherchez votre nom sur EthniAfrica, lien en profil. » names nothing and leads to the search page. The voice says the line, then the invitation; the subtitle band stays empty (1.6.0).
2. **The next episode.** One line under the pill, 30 px below it: « Prochain épisode : » in Nunito Sans 800 in `on-image-accent`, then the title in Nunito Sans 700 32/40 in `on-image-ink`. It is printed, not spoken. Measured on « Afrique »: the block ends at y 816, inside 318 to 820. When it does not fit (the general invitation takes two lines and pushes the pill to y 786), the next episode gets a card of its own between the last content card and the ending: the kicker « Prochain épisode » and the title in Anton. No text is made smaller. On a carousel closing card the line sits between the pill and the credit when 64 px are free there, otherwise it gets the same card of its own.
3. **The source line.** The field no longer carries its label: `sourceLabel` is « Source » (the default), « Sources » or « Hypothèses », and a source text that starts with a word and a colon is refused. « Source : Hypothèses : » can no longer happen.

#### No break inside a hyphenated word

1.6.0's rule for « nous-mêmes » extends to every text of the video: a title, a kicker, an item or an invitation never breaks inside « dit-on » or « nomme-t-il ». Each hyphenated word is set without wrapping (seen on « Comment finit-il par nommer tout un continent ? »).

#### Cover

The cover stays the opener at frame 0 (1.4.0): band, kicker, title, credit and signature, inside the profile grid's 3:4 thumbnail (y 240 to 1680). It shows no list of chapters and no duration; the apps show the duration.

#### Carousels

A carousel built from the same cards shows no chapters. It is read at the reader's pace, the apps show the position, and ten cards at most make it a selection of the video's cards. The cards keep their own kickers: the engine composes the chapter kicker only in the video.

#### Nuit and Parchemin

On the image the inks are the same in both themes (1.4.0), so a long video's cards are drawn the same in Nuit and Parchemin; the boards are in Nuit. Only an « image à trouver » slot shows the theme.

#### Boards (1.7.0)

`Video` group, `video-170-*`: a chapter opening for each of the three episodes, the three ways of opening a chapter, the figures card, the readings card and the names list, the attributed person, the reminder, the signed sentence and the signed chapter, the endings with the named invitation and the next episode and with the general invitation, the cover and the band with a season count, the rhythm of « Afrique », the 430 px strip, and seven frames at full size. Drawn by a scratch copy of `handoff/video-board-full.html`, patched for these cards; since the acceptance the board renderer on this page carries the patch (the card fields `chapter`, `chapterKicker`, `readings`, `figures`, `attribution`, `signed`, `sourceLabel` and `next`). The texts are demonstration text, and the images are the episodes' working files.

#### Decided by the operator on 15 October 2026

The five questions were answered with the designer's recommendations:

1. **The chapter card** shows the large number in the accent ink and « sur 7 », then the chapter's title; then « 3 · Titre » in the kicker of every card of the chapter.
2. **No season count in the band**: it stays « n° 1 ».
3. **The quoted person** shows above the subtitles.
4. **« Prochain épisode : … »** sits under the pill, or on a card of its own when it does not fit.
5. **The signed position** is marked by the kicker « Nous pensons » and the foot « Position d'EthniAfrica ».

### Document and teaching cards (1.8.0-proposition, accepted)

**Proposed and accepted by the operator on 15 October 2026, with the designer's recommendations on its five questions** (« Decided by the operator » below). Brief: `proposals/1.8.0-proposition/claude-design-brief.md` (draft PR #1781). Four card rules for the series video, on top of the accepted 1.7.0: the document card (« tribu », series 4, episode 1, needed by about 22 October), and three teaching cards (« Kouassi et Yao », series 3, episode 1): the name-making formula, the side-by-side forms and the week table. Chapters, readings, figures, attribution, the signed position, the ending and the cover stay as 1.7.0 settles them; carousel cards, photographs, maps and the signature line do not change. The texts on the boards are demonstration text; the documents are the episode's working files.

#### Document card

A card whose image is a page of text: a scan, a facsimile, a captured web page. It is the proof of what the voice says, so the quoted passage must be read on a phone, and the head must not mix with the page's own lines (`video-180-documents.jpg`).

1. **Framing on the passage.** The card gives the quoted passage in source pixels: `image.document: { passage: [x, y, w, h], marks: [[x, y, w, h], …] }`. The page is scaled so that the passage is 960 px wide, never more than 1.5 frame pixels per source pixel and never less than the scale that covers the frame, and the passage's centre is brought to (540, 1000). The passage must end up inside the clear zone (y 700 to 1300), otherwise the card is refused. Measured on the five cases, with the distance between two printed lines in the frame: « 1835 » at 1.41 (51 px), « 1863 » at 0.53 (30 px), « Lugard » at 0.83 (32 px), « qabīla » at 0.38 (28 px), the web capture at 1.0 (66 px). A passage wider than the frame is cut down to the quoted words: the other words of its lines may leave the frame. **Amended by the operator on 16 October 2026:** when the page's edge stops the passage from centring and it would cross x 60 to 1020, the engine reduces the scale just enough to bring it inside, so the passage ends a little under 960 px wide; the page keeps covering the frame's width and stops at most 400 px short of the top or the bottom. No card is re-cropped. A passage that ends near the page's own edge cannot be brought inside this way (a smaller scale pushes its right side further out): it needs a narrower passage, and check 1 refuses it until then. Measured: « Lugard » goes from 57–1023 at 0.83 to inside 60–1020 at about 0.82.
2. **What the head sits on: the page out of focus.** Outside a band around the passage (the passage and 48 px above and below it, fading over 90 px), the page is blurred by 7 px. The head and the subtitle then sit on a soft paper texture, not on printed lines; the passage itself stays sharp and is never retouched. Nothing darkens the page, no band is added, and the frame stays full. This is a new treatment of the image, which the 1.4.0 rules did not cover; the operator accepted it (decision 1).
   - **Why not the other ways.** The same framing without the blur keeps every 1.4.0 rule to the letter, but on four of the five pages the head lands on columns of printed text and the two texts mix, as on the proof stills (`video-180-documents-nets.jpg`). A smaller head does not solve it: the page's lines are still under it. A page set on a ground of its own, smaller than the frame, would be a band, which 1.4.0 refuses.
3. **The edge of the page.** When the passage sits near the top or the bottom of the page, centring it would take the frame past the page. The frame may then show past the page's edge, at most 400 px, on the frame's own dark ground: it says where the page ends (« Lugard », 400 px; « qabīla », 277 px; `video-180-bord-de-page.jpg`). Without it, those two passages fall under the subtitles and the cards would be refused. This departs from 1.4.0's « the image fills the frame »; the operator accepted the departure (decision 2).
4. **Marking the passage.** The quoted words are underlined: a 7 px line in `on-image-accent` on a 2 px dark keyline, under each line of the passage, 5 px below the text. No highlight over the words, no frame around them: the document's letters stay as printed. The line enters in 300 ms on the word that quotes the passage (`say`), as an area enters on its word in 1.5.0; nothing slides (`video-180-passage.jpg`).
5. **A captured web page.** The capture is made for the video: 1080 × 1920, with the quoted words in the clear zone. It must show the headline, the author, the date and the site's name; when the site's name cannot show without the capture date, the credit carries it. It removes ads, cookie and consent dialogs, live counters (« 4235 personnes lisent cet article »), the bar that shows the day of the capture, and faces that are not the subject. Space may be added above the article, in the page's own background colour, so that the headline reaches the clear zone; nothing else changes, and the production record lists what was hidden (`video-180-capture.jpg`). The column's own headline does not stand in for the opener's title: the title stays ours, set on the added margin, and the headline is the underlined passage.
6. **Scan marks.** « Digitized by Google » and library stamps are part of the scan: never retouched, never cut out by editing. The framing usually leaves them out of the frame or in the blurred part; the credit always names the holder of the scan.
7. **The foot.** A document card's foot is one line: « Source : » then the title, the date, the volume and page, and the holder of the scan (« Dictionnaire de l'Académie française, 6e éd., 1835, t. 2, p. 883, numérisation University of Toronto, Internet Archive »). The document is the source, so there is no separate credit line. A web capture reads « Capture : Camer.be, chronique de Pierre Laverdure Ombang, 16 avril 2025, capturée le 15 octobre 2026 ».
8. **A change from a photograph to a document** is the ordinary 300 ms change; the blur and the line are part of the image and do not enter separately (`video-180-changement.jpg`).

The same rule serves the Isidore page of « Afrique » (a printed page around a diagram): the T-O diagram is its passage.

#### Name-making formula

1.12.0-proposition (accepted) sets the formula on the parchment card and builds it by moves: see « Teaching cards in motion and the parchment card ». The formula sits in the clear zone, centred, built word by word with the voice (`video-180-formule.jpg`):

- **Lines.** The day (« vendredi se dit ya »), Nunito Sans 800 40/48 in `on-image-ink`; for each child, a label (« fille », « garçon ») in Nunito Sans 800 32/38, then the formula line in Anton 120/124, or 104 or 88 when it needs them to hold in 960 px. Operators « + », « = » and « → » in Nunito Sans 800, `on-image-muted`.
- **Colour carries the day.** The day word is in `on-image-accent` everywhere it appears, in the formula and inside the name (A**ya**, **Ya**o, Koua**ssi**): the eye follows what stays. Girl and boy are told apart by their labels, not by colours.
- **It claims no more than the source.** « = » only when the letters add up exactly (A + ya = Aya). « → » when the form changes (Kwa + ya → Yao; A + kissi → Akissi). A dropped part stays visible at 30 % (Kwa, (ki)), and a teaching cut is said as one: « (ki) : coupe pour l'explication. Le nom du jour est « plus ou moins modifié » (Delafosse, 1900). »
- **Timing.** Each step enters in 300 ms on the word that says it: « ya », « A », « Aya », « Kwa », « Yao ». A change is a cross-fade in place: « A + ya » gives way to « A + ya = Aya » where it stands; nothing slides or flies. The last state holds to the end of the card.
- **Measured:** five steps and the Monday case end above y 1260.

#### Side-by-side forms

Two columns under the title, « Côte d'Ivoire (baoulé) » and « Ghana (twi) », in Nunito Sans 800 28/34 in `on-image-accent`; each row the boy's and the girl's names in Anton 72/74 (« Kouassi · Akissi »), and under them the day in Nunito Sans 800 36/42 in `on-image-accent` (`video-180-cote-a-cote.jpg`). Rows enter with the voice; the days enter together on « un jour plus tôt », their place kept from the start. The Nzema line fits, smaller, under the rows (Nunito Sans 700 28/36), and enters on « Les Nzema ». Measured: from y 488 to 884. It is its own field, `sbs`, using the readings card's grammar (entry on the word, place kept, one ink for the facts); it is not a readings list, because its two columns compare.

#### Week table

1.12.0-proposition (accepted) sets the week table one people per card, girl | day | boy, on the parchment card, and animates it: see « Teaching cards in motion and the parchment card ». Seven rows (the days, in French) and two sides (« Baoulé » and « Twi (ashanti) »), each cell the boy's and the girl's names (Nunito Sans 800 38/44) over the day's own word (Nunito Sans 700 24/28, `on-image-muted`), with « garçon · fille » under each side's heading (`video-180-semaine.jpg`). It reads at 430 px (names at 15 px) and ends at y 1124. Its 28 names and 14 day words take about 10 s to read at 21 characters a second. Rule: one card when the voice leaves it 10 s; otherwise two cards, Monday to Thursday and Friday to Sunday, each held its own reading time. The rule is accepted (decision 4); whether the table enters this episode stays the operator's call (« on attend un peu pour ça »). Data: Pagnet 2005 for Baoulé, Christaller 1881 and Agyekum 2006 for Twi, as in the episode's notes; no cell is filled from another people's table.

#### Boards (1.8.0)

`Video` group, `video-180-*`: the five documents with the recommended treatment and without it, the passage before and after its word, the page edge, the web capture rule, a change from a photograph to a document, the five steps of the formula and the Monday case, the side-by-side card before and after « un jour plus tôt », the week table and its split, the 430 px strip, and six frames at full size. Drawn by a scratch copy of the accepted `handoff/video-board-full.html`, patched for these cards; since the acceptance the board renderer on this page carries the patch (the fields `image.document`, `formula`, `sbs` and `week`).

#### Decided by the operator on 15 October 2026

The five questions were answered with the designer's recommendations:

1. **The page out of focus** around the passage, blurred by 7 px; the passage sharp and never retouched.
2. **The page's edge on dark ground**, at most 400 px, is allowed when the passage is near the top or bottom of a page: an accepted departure from 1.4.0's « the image fills the frame ».
3. **On a web capture**, our title sits on a margin added above the article; the column's headline is the underlined passage.
4. **The week table** takes one card when the voice leaves it 10 s, two cards otherwise.
5. **The formula's signs**: « = » only when the letters add up, « → » when the form changes, dropped parts at 30 %.

### Layouts A and B (1.3.0), the record of the comparison

Layout A centred the 1080 × 1350 carousel card in the frame (y 285 to 1635), subtitles under it. Layout B kept the video's own card inside the feed's safe zone: band at y 270, photograph from 342 to 902 fading into `ground`, subtitle on its lower edge, head from 902 to 1248 left of the buttons, sources under 1248. The operator chose B on 14 October 2026 (decision 4), then withdrew it the same day for full screen. Neither is to be produced. Their boards (`video-A-*`, `video-B-*`) and `handoff/video-board.html` stay as the record.

## The signature line (1.6.0-proposition, accepted)

**1.10.0-proposition (accepted) replaces the line and the invitation** by the closing of 19 October 2026; its place, face and order stay. See « The closing (1.10.0) » below.

**Proposed and accepted by the operator on 15 October 2026, with the designer's recommendations on its four questions** (« Decided by the operator on 15 October 2026 » below). Brief: `proposals/1.6.0-proposition/claude-design-brief.md` (first numbered 1.5.0, renumbered the same day). It adds one rule to the accepted 1.5.0: the project's signature line at the end of every carousel and every series video. The content cards, the series band, the full-screen frame and its legibility rule, map cards, map sequences, the cover and the card change are unchanged.

> Connaître nos noms, décoloniser leur emploi, nous nommer nous-mêmes.

**The operator's decision of 15 October 2026, settled, not to reopen:**

1. **Word for word, every time.** The same sentence ends every reel and every carousel of every series, and sits in every account's bio. No card, series or episode changes, shortens or translates it.
2. **After the series' fixed closing, never in its place.** The two follow each other and never merge. In series 6 the closing line speaks of unity and the signature line of names.
3. **The same look, in the same place, every time.** Its use is recognition through repetition.
4. **No panel, no veil, no band added to carry it.** In the video it follows the 1.4.0 legibility rule, like every other text on the image.
5. **It contains no African name**, so capitals are allowed.

Its meaning and limits are in `docs/editorial/essais/afrique-nest-pas-un-tout-2026-10-13.md`, section 5.6: an invitation, never a judgement; it speaks of the **use** of names; it never replaces a series' closing.

**Two words, two things.** The **signature row** is the logo row (the logo and « EthniAfrica » in Fraunces). The **signature line** is the project's sentence. They keep their names.

### The order of the ending

Top to bottom, over the last two cards of a carousel and the last two moments of a video:

| Place                | Carousel                                                                                                                                                                      | Video                                                                                      |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Last content card    | The series' fixed closing as the card's title, when the series has one as a line                                                                                              | The same card, voiced and subtitled like any card, entered by the 300 ms change            |
| Closing card, ending | Series band; kicker, folio and recap when there are any; **signature line**; invitation « Cherchez [nom] sur EthniAfrica, lien en profil. »; site pill; credit; signature row | Series band at y 250; **signature line**; invitation; site pill; credit; centred signature |

**The three kinds of series closing** (`docs/editorial/strategy/social-series.md`, « The series »):

1. **A line.** Series 5 « La ligne a été tracée par-dessus des gens qui étaient déjà là. », series 6 episode 6 « L'Afrique n'est pas un seul peuple. Elle peut choisir d'être un seul camp. », the series 1 season finale « Un nom change-t-il l'identité d'un peuple ? ». The line is the title of the last content card, in Anton like every title, under a kicker that says what it is (« Pour finir », « Nous pensons », « La question de la saison »). The 1.3.0 model `serie-frontieres-06` already does this.
2. **A question to readers.** Series 2 « Et chez vous, comment dit-on ? »: the same, kicker « À vous », the body asking for a comment (`serie-nom-recu-07`).
3. **No line of its own.** Series 3, 4 and 7: the closing card follows the last content card. Series 3's beats end on « Et ton nom, d'où vient-il ? », which the 1.3.0 model draws as a question card (`serie-nom-famille-06`); the brief counts series 3 among the series with no line. Either way the closing card is the same.

**The fixed closing never shares the closing card.** Measured on `cloture-160-une-ou-deux-cartes.jpg`: the longest closing (series 6, 73 characters) fits with the line, the invitation and the pill at 810 of the 828 px a series panel allows, but the line then drops to y 836, the image window shrinks to 468 px, and the episode's last word and the project's sentence stand in one panel, which decision 2 forbids. On its own card the fixed closing keeps the size of a title, and the closing card stays the same in every series, so the line never moves (decision 3). The cost is one card for the series that end on a line; the 1.3.0 models already count it.

### The line's look

| Property | Value                                                                                                                                                                                                                                                          |
| -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Face     | Fraunces 600, the face of the word EthniAfrica: the project speaking. Anton stays the episode's voice: titles, dates and the fixed closing.                                                                                                                    |
| Size     | 56/64 px on the closing card and in the video, both 1080 px wide: 22 px read at 430 px, 19 px at 375 px.                                                                                                                                                       |
| Colour   | `ink` on the card (Nuit and Parchemin). In the video, `on-image-ink` on an 8 px `on-image-stroke` outline with the large shadow (Legibility). No accent: the site pill keeps the ending's one accent.                                                          |
| Lines    | Three, centred, broken after each comma, one idea per line: « Connaître nos noms, » (19 characters, 524 px), « décoloniser leur emploi, » (24 characters, 612 px), « nous nommer nous-mêmes. » (23 characters, 706 px).                                        |
| Case     | Sentence case. Capitals are allowed, but 68 characters in capitals would outweigh the episode's title and read as a heading, not a voice.                                                                                                                      |
| Hyphen   | Each line is set without wrapping, so « nous-mêmes » never breaks and keeps the ordinary hyphen (U+002D). The non-breaking hyphen (U+2011) is not used: Fraunces, Nunito Sans and Anton have no glyph for it, and the browser would draw it from another face. |
| Length   | 68 characters with spaces, 60 without (the brief counted 66).                                                                                                                                                                                                  |

### Carousel: the closing card

- **Every closing card**, in a series or not: the line replaces the closing slogan wherever the slogan stood (`seq-9`, `chr-5` and the seven series closings).
- **Its place.** The top of the line is at y 760 on every closing card. Below it: the invitation (two lines at most), the pill, a gap that takes up what the invitation and the credit leave, the credit (two lines at most) and the signature row (y 1262 to 1306). Above it, the kicker, the folio and the recap grow the panel upwards. Measured: without a recap the panel is 632 px and the image window runs from y 72 to 718; series 1 with its recap, 800 of 828 px; `seq-9` (two-line invitation and two-line credit) leaves a 6 px gap, the tightest case; `chr-5`, 806 of 900. The line is 28 px above the invitation; the invitation and the pill keep their 1.1 spacing.
- **What it replaces.** The closing slogan « Notre objectif : raconter l'origine des noms, avec des sources. » is retired (Handoff, choice 2): a closing card has no `title`. « L'Afrique à travers ses noms » leaves the centred signature row: the ending carries one sentence for the project, not three. With it (`cloture-160-devise.jpg`), the 17 px motto under the word EthniAfrica reads as a leftover beside the 56 px line.
- **Alternative text.** It ends with the line, word for word: « … Cherchez Afrique sur EthniAfrica, lien en profil. ethniafrica.com. Connaître nos noms, décoloniser leur emploi, nous nommer nous-mêmes. » The brief asks for the line last; on the card it is printed above the invitation.

### Video: the ending « série »

- **The block.** The closing card's own image, full frame, band at y 250 (unchanged). From y 318: the line (318 to 510), the invitation in Nunito Sans 700 32/40 (538 to 642 on two lines), the pill (672 to 746). The block stays inside 318 to 820. The slogan is gone; the credit and the centred signature are unchanged (y 1788 to 1884).
- **The fixed closing** is the last content card, entered by the 300 ms change before the ending (`video-160-fin-serie-6.jpg`).
- **The voice says the line** (decision 1). Hearing and reading the same sentence together makes it easier to remember. The closing card's chunks are then the line in three chunks, one per printed line, then the invitation in its two chunks. While the line is on screen the subtitle band stays empty, so the same words never show twice; since the line stays for the whole ending, the band is empty for the whole ending, and the invitation, printed in the block, is not subtitled either. This replaces 1.4.0's « the last two chunks in the subtitle band ». Before publication a person listens to « nos noms… nommer »: the synthetic voice has already merged close words in this format (essay, 5.6).
- **Not retained: the line printed only.** The invitation would have been subtitled as in 1.4.0 and the ending held at least 3.3 s, the time to read 68 characters at 21 a second, the reading limit (`video-160-voix.jpg`, the record of the comparison).
- **Time.** The ending holds 2.5 s, or until the voice ends plus 0.5 s (unchanged). With a voice at 16 characters a second, the line takes about 4.3 s and the ending about 8.5 s (`video-160-temps.jpg`); the line's three chunks then read at about 16 characters a second, under the 21 a second limit.
- **The feed.** At 430 px the line, the invitation and the pill sit in the part of the frame the apps leave clear; the top of the band is covered, as in 1.4.0. Nothing is fitted to the apps' interface (`video-160-fil-430.jpg`).
- **Parchemin.** As for every text on the image, the same light inks on a dark outline in both themes (`video-160-fin-parchemin.jpg`, series 2).

### Boards (1.6.0)

`Lecture` group, `cloture-160-*`: the closing cards of series 6 (a line), series 2 (a question) and series 3 (no line), in Nuit and Parchemin; the order and places, annotated; the line measured; one card or two; with or without the motto; the other endings (series 5, the series 1 finale, a recap, outside a series); the cards mounted at 430 px; three closing cards at full size. `Video` group, `video-160-*`: the endings of series 6 and series 2 with their last content card, the frame where the voice says the line, the line printed only (not retained), the time, the guides, the feed at 430 px. Drawn by a scratch copy of the bundle and of `handoff/video-board-full.html`, patched for the line. Since the acceptance the renderer on this page draws the line: the ten closing cards of the sample changed, and the 79 others were rendered again and compared with the 1.5.0 renderer, pixel for pixel identical, alternative texts included. Texts other than the signature line and the fixed closings are demonstration text.

### Decided by the operator on 15 October 2026

The four questions were answered with the designer's recommendations:

1. **The voice says the line**, and the subtitle band stays empty for the whole ending, the invitation included.
2. **The closing slogan and the motto « L'Afrique à travers ses noms » are both retired** from the closing card.
3. **A series' fixed closing always has its own card**, the last content card; it never shares the closing card.
4. **The signature line ends every closing card**, in a series or not.

The three points the design raised against the brief stand as resolved: the line has 68 characters with spaces; no U+2011, each printed line set without wrapping instead; series 3 is counted among the series with no line of its own, and its closing card is the same either way. Durations use the 21 characters a second reading limit (PR #1778).

## The closing (1.10.0-proposition, accepted)

**Proposed and accepted by the operator on 19 October 2026, with the designer's recommendations on its nine questions** (« Decided by the operator » below). Brief: the operator's decision of 19 October 2026 on the Burkina Faso episode (series 1, episode 19), relayed by the episode session (`proposals/1.10.0-proposition/claude-design-brief.md` once deposited); the script rule is in `docs/editorial/strategy/social-series.md`, « Opening, closing and length of every video » (PR #1887). Every series video and every carousel now ends with:

> L’importance de connaître nos noms. Vous pouvez continuer la recherche sur EthniAfrica, lien en profil.

It replaces both the signature line « Connaître nos noms, décoloniser leur emploi, nous nommer nous-mêmes. » (« The signature line » above) and the invitation, named « Cherchez [nom] sur EthniAfrica, lien en profil. » or general « Vous aussi, cherchez votre nom sur EthniAfrica, lien en profil. » (1.7.0). The signed « Nous pensons » card still comes just before the ending, and a series' fixed closing keeps its own card (1.6.0, decision 3). Nothing else changes: the band, the head, the subtitles and the lit word, the double outline, map cards, chapters, document and teaching cards, the cover and the card change.

**Two constants, never card fields.** The renderer draws the ending from two constants, like the signature line before them:

| Constant         | Printed lines                                                                 | Characters |
| ---------------- | ----------------------------------------------------------------------------- | ---------- |
| The closing line | « L’importance de » / « connaître nos noms. »                                 | 35         |
| The invitation   | « Vous pouvez continuer la recherche » / « sur EthniAfrica, lien en profil. » | 68         |

The apostrophe is printed as ’ (U+2019), as in the cards' other text; a comparison with the voice's words treats ' and ’ as the same letter.

### The line

- **Face and look: those of the signature line.** Fraunces 600 56/64, `ink` on the card, `on-image-ink` on its 8 px outline and the 1.9.0 double outline in the video. The face of the word EthniAfrica stays the project's voice; Anton stays the episode's.
- **Two lines, centred**: « L’importance de » (408 px) and « connaître nos noms. » (514 px). « connaître nos noms » stays whole, the words the signature line began with. On one line it is 932 px wide, nearly the whole frame, and reads as a heading rather than a voice (`video-1100-variantes.jpg`, `cloture-1100-place.jpg`).
- **Same place.** Its top at y 318 in the video and at y 760 on every closing card, as in 1.6.0: the line never moves.

### The invitation

- **Fixed**, two lines broken after « recherche » (524 and 433 px in the video), each set without wrapping. Broken after « EthniAfrica, », as the voice may pause, the first line runs 762 px and the second has 15 characters (`video-1100-variantes.jpg`).
- **Type unchanged**: Nunito Sans 700 32/40 in `on-image-ink` in the video; on the card the closing body's style, Nunito Sans 400 32/45 in `ink-muted`.
- **A closing card's own sentence is no longer printed.** The ending is the same on every closing card, in a series or not. Outside a series, a card's sentence (« Sur ethniafrica.com, la fiche Ouganda présente… », `seq-9`; « Vous avez une histoire… Partagez-la sur EthniAfrica. », `chr-5`) goes on the last content card. A closing card that still gives `body` renders without it and warns.

### Pill and next episode

- **The pill keeps the site's address**, « ethniafrica.com », the ending's one accent. The invitation says where to tap (« lien en profil »); the pill says where it leads, for whoever types it. It never carried a searched name. Without it (`video-1100-variantes.jpg`) the ending loses its one written address.
- **« Prochain épisode : … » always sits under the pill.** The video block now ends at y 728 with it (816 before), well inside 318 to 820, so the 1.7.0 card of its own after the general invitation is no longer needed. Without a next episode the block ends at the pill (y 658) and nothing else moves (`video-1100-sans-episode.jpg`).

### Video: the ending

- **The block**, from y 318: the line (318 to 446), the invitation (474 to 554), the pill (584 to 658), « Prochain épisode » (688 to 728). Band at y 250, the credit and the centred signature unchanged (y 1760 to 1884 with the episode's two-line credit) (`video-1100-fin.jpg`).
- **The voice says the line, then the invitation**, in four chunks, one per printed line: « L’importance de », « connaître nos noms. », « Vous pouvez continuer la recherche », « sur EthniAfrica, lien en profil. ». **The subtitle band stays empty for the whole ending**, as in 1.6.0: every word said is already printed. The brief's chunking (the line in one chunk, the invitation cut after « EthniAfrica, ») would also do, since nothing is subtitled; one chunk per printed line keeps the voice and the page in step.
- **Time.** About 6.7 s at 17 characters a second and 5.6 s at 21, with a breath of 0.3 s between the line and the invitation; the ending holds until the voice ends plus 0.5 s, and at least 2.5 s (`video-1100-temps.jpg`).
- **Light pictures.** The line and the invitation take the 1.9.0 double outline like every text on the image (`video-1100-fin-claire.jpg`, the Place de la Révolution and Boulton's map).
- **The order**: the signed card, the 300 ms card change, the ending (`video-1100-ordre.jpg`).

### Carousel: the closing card

- **The line stays at y 760**, its top, on every closing card; above it the kicker, the folio and the recap as before; below it the fixed invitation, the pill, the gap, the credit and the signature row (y 1262 to 1306). The panel's height and the image window do not change (632 px without a recap, 800 with series 1's).
- **Where the freed space goes.** The line is 64 px shorter, the fixed invitation one line longer than most cards' body: the gap above the credit grows from 76 to 95 px (series cards), 51 to 70 (series 1 with its recap), 6 to 70 (`seq-9`). Lowering the line to y 824 would give the image 64 px but leave 6 px above the credit on series 1 and on `seq-9`, and move the line (`cloture-1100-place.jpg`).
- **Alternative text** ends with the closing, word for word: « … ethniafrica.com. L’importance de connaître nos noms. Vous pouvez continuer la recherche sur EthniAfrica, lien en profil. » The card's own `body` is no longer read into it.
- **The sample.** The ten closing cards change; the 79 other sample cards were rendered again with the patched bundle and compared with the 1.9.0 bundle: pixel for pixel identical, alternative texts included.

### What remains of the signature line

Nothing on videos or carousels, as the operator decided. Kept small in the foot it would be a second motto beside the closing, which 1.6.0 removed for « L'Afrique à travers ses noms » (`cloture-160-devise.jpg`). The account bios are an editorial matter (`docs/editorial/strategy/social-series.md`).

### Addendum: busy pictures, the kicker and the credit

Added to the brief the same day, after the operator reviewed frames of the Burkina Faso video on 1.9.0 (questions 8 to 10 of the brief). The 1.9.0 double outline solves light pictures; these three are about busy pictures and small lines.

**Busy pictures (brief, question 8).** On Tiébélé's painted court the black and white triangles compete with the letters, even with the double outline. Measured as the mean local contrast behind a block of small text, the standard deviation of perceptual lightness (L*) in 9 × 9 px windows, averaged over the block's zone: Tiébélé 11 to 13, the boulevard's motorbikes under the subtitles 10, Boulton's map 8 to 9, the 1930 aerial view 5 to 6, Bobo-Dioulasso 5, a calm sky 2 (`video-1100-chargee.jpg`). Three ways were drawn on the opener and the ending (`video-1100-chargee-detail.jpg`):

- **A framing rule only**: a calm zone under the text, checked at proof; no new element. On Tiébélé there is none: the pattern fills the frame.
- **A dark gradient behind the text zones**: it reads, but it is a « zone d'ombre », the veil the operator removed on 14 October 2026 (« Vidéo de série », point 2).
- **A local blur (accepted).** Under each block of small text, and only there, the picture is blurred by 9 px: the subtitle lines (with the lit word's box), the ending block (the line, the invitation, the pill, « Prochain épisode »), the foot and the ending's credit. Each zone is the text's own extent grown by 16 px and feathered over 40 px on every side. It darkens nothing: the picture keeps its tones and colours, only the pattern under the letters goes soft, as the 1.8.0 document card does with its page. It brings the busyness under the text from 11 to 13 down to 2 to 3.
- **When.** The engine measures the card's small-text zones together on its first frame (the picture alone, before any text); when their mean is 10 or more, all of them are blurred, so a block never sits half on a calm patch and half on the pattern. It reports the measure. Tiébélé's opener measures 12 and its ending 11; the boulevard card 6, its motorbikes busy under the subtitles only; Bobo-Dioulasso 5. Titles in Anton, the band and the head are not blurred: large letters hold with the double outline. A card can refuse it (`image.calm: false`), the framing then being the remedy, as before.

**The kicker (brief, question 9).** In `on-image-accent` (luminance 0.53) at 30 px, about 12 px on screen at 430 px, it fades on mid tones (the grey sky of Bobo-Dioulasso, dry earth). Accepted: **36/42 px**, still Nunito Sans 800 in the accent ink, its outline 5 px, so 14 px on screen; the gap under it goes from 10 to 4 px, so the head keeps its height and a three-line opener still ends at y 700. In the cream ink it would merge with the title and lose its role (`video-1100-surtitre.jpg`).

**The credit (brief, question 10).** In `on-image-muted` (luminance 0.51) at 22 px, about 9 px on screen at 430 px, it is the weakest line, and the licences (CC BY-SA) require it. Accepted: **the credit in `on-image-ink` at 26/32 px**, and the source at the same size, so the foot stays one block (« Source : » and « Photo : » tell them apart): 10 px on screen. The foot, bottom-aligned at y 1786, still holds a two-line source and a two-line credit (top at y 1654 at worst, the band starting at 1652). On a busy picture the local blur is the credit's quiet band, with no band drawn (`video-1100-credit.jpg`). The ending's centred credit takes the same size and ink.

Before and after at 430 px: `video-1100-lisibilite-430.jpg` (the Tiébélé opener, the Bobo-Dioulasso explanation card, which is not busy and gets no blur, and the Tiébélé ending).

### Boards (1.10.0)

`Video` group, `video-1100-*`: the Burkina Faso ending before and after, with its guides; the ending on light pictures; the signed card and the change into the ending; without a next episode; the variants (one line, no pill, the invitation cut as the voice may pause); the time; the 430 px strip; two frames at full size; and for the addendum, the busy pictures (`video-1100-chargee*.jpg`), the kicker, the credit, before and after at 430 px, and the opener and the ending at full size. `Lecture` group, `cloture-1100-*`: the closing cards of series 1 (with its recap), series 6 and outside a series, before and after, in Nuit and Parchemin; series 6's last content card and its closing card; where the freed space goes; the cards mounted at 430 px; two cards at full size. Drawn by scratch copies of the accepted `components/bundle.js` and `handoff/video-board-full.html`, patched for the closing; since the acceptance the bundle and the board renderer on this page carry the patch: the ten closing cards of the sample show the new ending, and the board draws the 36 px kicker and the 26 px foot by default (`?calm=blur` draws the calm zones, which the engine applies by measure). The cards are the sample's and the Burkina Faso episode's.

#### Decided by the operator on 19 October 2026

The nine questions were answered with the designer's recommendations (« je suis tes recommandations »):

1. **The line on two lines**, « L’importance de » / « connaître nos noms. », in the signature line's face and place.
2. **The invitation broken after « recherche »**.
3. **The pill keeps « ethniafrica.com »**.
4. **A closing card's own sentence moves to the last content card**; the closing card prints the fixed ending only.
5. **The line stays at y 760 on the card**; the freed space goes above the credit.
6. **The carousels change with the videos**, as the brief says; `social-series.md` already says so since PR #1888 (19 October 2026), captions and bios included.
7. **Busy pictures: a local blur** of 9 px under each block of small text, when the card's small-text zones measure 10 or more together.
8. **The kicker at 36/42 px in the accent ink**, the gap under it 4 px.
9. **The source and the credit at 26/32 px**, the credit in `on-image-ink`.

The answers 4 to 6 of the brief stand as given: « Prochain épisode » under the pill, the subtitle band empty for the whole ending, nothing left of the signature line.

## The series idents in the video (operator's decision, 19 October 2026)

**Decided by the operator on 19 October 2026, without a Claude Design proposal** (« décision opérateur »): the intro bumper and the end card designed and approved in `social/series-idents/` (PR #1891, board <https://claude.ai/artifact/FH2aH5LZG7r7P32pYNvbsu>) are part of every series video. They are drawn by their own pages, on their own parchment ground, never on the episode's picture. Nothing in the cards or the carousels changes: the carousel's closing card stays 1.10.0's.

- **The intro**, right after the opener card, entered and left by the 300 ms card change: a generic social profile, « S'abonner », the profile's link, ethniafrica.com. The voice says the fixed sentence of the script rule (`docs/editorial/strategy/social-series.md`, « Opening, closing and length of every video »), word for word, subtitled in the usual band.
- **The end card, in place of the 1.10.0 video ending**, after the signed card: the closing line, the same phone searching the episode's name and its answer, then the invitation, ethniafrica.com, « Prochain épisode », the cue towards the account's name and the five networks the project publishes on (Instagram, TikTok, Facebook, YouTube, LinkedIn; never X). The voice still says the line and the invitation, one chunk per printed line, never subtitled (1.10.0). The 1.10.0 ending block on the picture is not drawn under it.
- **The band and the signature** fade out under an ident and back in after it: an ident fills the frame.
- **Each ident runs on its own clock** from the first frame of the change that brings it in, and holds its last frame; the end card plays whole (8 s), so the video lasts at least that long after the signed card.
- **Engine.** A beat `{ "type": "intro", "chunks": [...] }`, second in the sequence; `idents: { "outro": "<name>", "next": "…" }` in the input, `<name>` naming the answer's layer file in `social/series-idents/layers/`. Without them the engine still draws the 1.10.0 ending, for older pieces.

## The chapter card (operator's decision, 20 October 2026)

**Decided by the operator on 20 October 2026, without a Claude Design proposal** (« décision opérateur »), on the 1 fps preview of « tribu » (series 4, episode 1): the title stood against « 1 sur 5 », and the card borrowed the next picture. The board « Carte de chapitre animée » (<https://claude.ai/artifact/NtxUtXfkt19YRQ5TYTkRFA>) was approved the same day (« oui je valide »). It replaces points 1 and 4 of 1.7.0's chapter rule for every series video.

- **Nothing but text** on the dark ground (`ground`, Nuit), with a slow golden glow: no picture, no credit, no subtitle. The band and the signature fade out under it, as under an ident.
- **The chapter's place** first: a 4 px line in `rule` grows from the left (0.25 s, 0.7 s long), then one 24 px dot per chapter enters (from 0.3 s, one every 0.12 s): past chapters filled in `on-image-faint`, the current one in `on-image-accent` with a ring that widens and fades (1.0 s), chapters to come empty. The row is centred, top at y 770.
- **« n sur N »** centred under it in Nunito Sans 800 44/52, `on-image-muted`, the number in `on-image-accent`, top at y 850, entering at 1.0 s over 0.4 s.
- **The title** centred in Anton 112/112, `on-image-text`, between x 90 and 990, top at y 986, two lines at most; it rises 24 px as it fades in at 1.25 s over 0.6 s. 82 px clear of « n sur N ».
- **Time.** The card's clock starts on its first frame. The hold rule of 1.7.0 counts from the title's entrance: the card stays at full opacity 1.25 s plus the time to read its title (21 characters a second plus 0.3 s, 1.2 s at least). A chapter beat that gives an image is refused.
- **Enter and leave** by the ordinary 300 ms change: its ground cross-fades with the pictures around it.
- **Engine.** `social/video/series.mjs` (the clock `chapter.t`, the hold, the bands `chapter-count` y 720 to 940 and `chapter-title` y 940 to 1300, x 60 to 1020) and `series-page.mjs` (`silentParts`, `drawChapter`); tests in `series-long.test.mjs` and `series-long.render.test.mjs`.

## The animated satellite map (1.11.0-proposition)

**Proposed by Claude Design and accepted by the operator on 19 October 2026, with the designer's recommendations on its eight questions** (« Decided by the operator on 19 October 2026 » below). Brief: `proposals/1.11.0-proposition/claude-design-brief.md`, from the operator's review of the animatic of the long Burkina Faso episode (series 1, episode 19, version 3, <https://claude.ai/artifact/YG1vXNGHT33w92fGGNAZF2>). It replaces question 11 of the 1.10.0 brief (globe scenes), which 1.10.0 left open.

The operator's decision, not to reopen: the map carries the video. Whenever the narration places something (a people, a route, a kingdom, a colony, a border), the screen is a map, drawn on satellite imagery seen from straight above, never on a flat printed map. The video must be understood without sound, from the map and the subtitles: the map says the key facts in words. It is animated: areas light up, change and fade, arrows draw a people's route, small drawings show what is at stake. The video opens on a globe, which is the way in, not the whole video. A sentence with nothing to place gets a picture, held as a phase of its own.

Everything accepted stays: the full-screen frame (1.4.0), map cards on imagery and their grammar (1.4.1), the map sequence with areas and names entering on their word (1.5.0), chapters (1.7.0), the head, the band, the subtitles, the foot, the double outline (1.9.0), the ending and the calm zones (1.10.0), the series idents (operator's decision of 19 October 2026). 1.11.0 extends the map sequence; where it changes an accepted rule, the rule is named below.

Boards: `video-1110-*` in the `Video` group, with five animated previews, drawn on the verified Blue Marble file by a scratch board renderer (`map111.html`, not the engine) from the animatic's areas, places and voice. The demonstration text is the animatic's.

### Where the marks sit

Unchanged from 1.4.1 and 1.5.0, now for every mark: every text and every drawing on the map sits between y 724 and 1296 and between x 60 and 1020, never in the subtitle band (1316 to 1452) and never under the head. The imagery itself fills the whole frame. The frame holds **at most eight texts on the map** at once: area and place names, drawing labels and words together, of which at most two are words (« Words on the map » below). This replaces 1.4.1's six names, which a map that carries the facts cannot hold: the end of the Dioula plan shows four place names, three drawing labels and one word.

### 1. The opening globe

The opener card is the globe. It is the satellite video's own orthographic globe (`social/video/page.mjs`), shaded at its limb, with its atmosphere, seen from straight above: no tilt, whose horizon would cross the head.

- **Frame 0, the cover.** The whole globe, radius 300 px around the map view's centre (540, 1010), its disc between y 710 and 1310, under the opener's band, kicker and title. It is turned 40° east of the subject, Africa face-on. No subtitle (1.4.0: frame 0 has none).
- **The turn, 0 to 1.8 s.** The globe turns west towards the subject and grows a little: at 1.8 s its centre is 7.5° east and 3° south of the subject, radius 430 px.
- **The dive, 1.8 to 4.4 s.** The radius grows to the first map view's radius, in log, and the centre reaches the subject. One camera path passes through the three keys without stopping (a monotone cubic in longitude, latitude and log radius, zero speed at both ends), as the satellite video's opening does.
- **It becomes the map.** Map cards use the same orthographic projection: when the camera stops, the globe is the flat map (at the scale limit the curvature across the frame is under 1 px). Nothing dissolves, nothing cuts. The atmosphere leaves the frame by itself during the dive.
- **Grade.** The base grade during the globe; `sat-grade-recede` from 3.4 to 4.6 s, as overlays are about to enter.
- **First mark.** The subject enters at the end of the dive, at 4.4 s or on its word if later, by the 1.5.0 entry (700 ms, name at 60 %).
- **Length.** 4.4 s of camera, then the entry: the opener holds at least 5.5 s. The voice's first sentence runs over it.
- **Band, head, subtitle.** The band at 250 and the opener's kicker and title in the head stay in place for the whole globe; the globe passes behind the head, which keeps its double outline. The first subtitle chunk enters 150 ms before its first word, in its usual band, over the globe or the dark around it.
- **Credit.** « Imagerie : NASA Earth Observatory » during the globe; the 1.4.1 credit line from the first mark on.

Boards: `video-1110-ouverture.jpg`; preview `ouverture.mp4`.

### 2. Area states

An area has four states on imagery. Certain areas are filled, approximate ones hatched with a dashed edge, in every state (1.5.0); colour never carries the meaning alone.

| State   | Certain area                                                                       | Approximate area                                                              | Name                         |
| ------- | ---------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- | ---------------------------- |
| Lit     | fill 30 %, edge 4 px over an 8 px keyline (1.4.1)                                  | hatching 3 px every 16 px at 45° over a dark line, dashed edge 4 px over 8 px | in its ink, at full strength |
| Context | fill 10 %, edge 2.5 px at 60 % over a 5 px keyline                                 | hatching at 35 %, dashed edge 2.5 px at 60 %                                  | at 60 %                      |
| Changed | the fill, hatching, edge and name cross-fade to the new ink; the outline stays put | same                                                                          | crosses to the new ink       |
| Out     | fades away                                                                         | same                                                                          | with it                      |

- **Times.** Entering: 700 ms, eased (0.2, 0, 0, 1), the name waiting until 60 % (1.5.0). Lit to context and back: 500 ms. A change of ink: 600 ms. Leaving: 500 ms, eased (0.4, 0, 1, 1). Two area events are at least 700 ms apart, unless one word moves them together (« partage » splits Haute-Volta into three parts at once).
- **How many.** At most four inks in a sequence (1.5.0), so at most four lit names in four inks; context areas have no limit of their own, their names count among the eight texts.
- **A territory that changes hands.** Its part appears first in the ink it had, then takes the new ink (`video-1110-1932.jpg`, 2.8 and 3.6 s): the cut reads before the colours.
- **The ink follows the people.** This refines 1.5.0's « one colour per name »: a people keeps one ink for the whole episode, and all its areas share that ink while each keeps its own name (the Mossi kingdoms of Tenkodogo, Ouagadougou and Yatenga, and the Mamprusi kingdom they come from, all ochre). The reason of 1.5.0 holds: two colours for one people would read as two peoples. A territory that is not a people, a colony, takes a free ink of its sequence.
- **What comes from outside.** A colonial power's marks (the French column's arrow) are drawn in the cream `map-foreign` (#f3e9da, the on-image ink) on its keyline, not in one of the four inks: they do not count among them.

### 3. Route arrows

- **Path.** A quadratic curve from A to B, bent by 18 % of its length to one side (the script may set the bend), or a curve through via points (Catmull-Rom). It starts 8 px after its origin and its tip stops 14 px before its target, so a dot or an area edge stays visible.
- **Drawing.** The line grows from A with the head riding its tip from the first frame, so the direction reads while it draws. Length ÷ 600 px a second, between 0.8 and 1.6 s, eased (0.4, 0, 0.2, 1); the stroke fades in over its first 150 ms. An exchange (two heads) grows from its middle towards both ends, a head on each tip.
- **Width and head.** Set by the proportion rule below: width w between 5 and 10 px, the head a notched point 3.6 w long and 3.2 w wide. Under the line a keyline w + 6 px at 70 %; under the head a 6 px keyline.
- **Ink.** The ink of the people that moves; cream for a colonial power.
- **How many.** One arrow draws at a time, two starts at least 700 ms apart; at most three on screen at full strength. An arrow enters on its word (the verb of motion or the destination).
- **Stay or fade.** A drawn arrow stays. When the story moves on (the kingdoms are all lit) it goes to **trace**, 45 % over 500 ms; it leaves with its sequence, or on its own `out` in 500 ms.

### 4. Illustrations on the map

- **The set for series 1.** Eight drawings: `or` (a gold nugget and grains), `kola` (red and pale kola nuts on a leaf), `eleveurs` (a zebu and a Fulani herder), `cavaliers` (a horseman with a spear), `commercants` (a trader leading a loaded donkey), `guerres` (two hide shields, spears crossed), `colonne` (three soldiers in file, rifles on the shoulder), `travailleurs` (two men, a hoe and a head load). Board: `video-1110-illustrations.jpg`.
- **The hand.** Drawn as the real things: an ink line (#23170d) over a watercolour wash lit from the top left, a few engraved strokes in the shade, and a soft contact shadow that sets the object on the ground. Realistic colours, so they sit with the satellite ground. On the image each drawing takes the 1.9.0 second contour (r 3). Never an emoji, a flat pictogram, a disc badge or a symbol. The figures are generic and small: never a portrait, never a named person. Their colour wash keeps them apart from period documents (Riou's engravings, used as pictures), so a drawing is never taken for an archive.
- **Format.** One SVG per drawing, a 160 × 120 box (132 high with the spear's tip), its foot at (80, 112) set on its place. A new drawing for another series is drawn in the same hand and reviewed with that series' boards.
- **Size.** Set by the proportion rule below: between 100 and 150 px high at 1080 (40 to 60 px at 430), at most four thirds of its height wide.
- **Label.** Under the drawing, Nunito Sans 800 28/32 in `on-image-ink`, 4 px outline and second contour; one or two words. It counts among the eight texts.
- **Entry and exit.** On its word: 400 ms, eased (0.2, 0, 0, 1), rising 8 px; the label 150 ms later over 300 ms. Out: 400 ms. No idle motion, no loop, no bounce. At most three drawings on screen, never touching.

### 5. Proportions

The smallest lit area on screen sets the size of routes and drawings, so a route never outweighs a people. Let **s** be the shorter side, in frame pixels, of the bounding box of the smallest area lit at more than 50 %.

- **Arrow width** w = round(s ÷ 14), between 5 and 10 px; head 3.6 w × 3.2 w.
- **Drawing height** h = round(1.1 × s), between 100 and 150 px; width at most 4/3 h.
- Measured on the boards: Tenkodogo at the scale limit, s 90 px, w 6, head 22 × 19, drawing 100 px (`video-1110-illustrations.jpg`); the Mossi plan, s 115 (Tenkodogo), w 8, drawing 127; the Dioula plan, s 131 (Manden), w 9, drawing 144; the 1932 plan, s 166 (the Niger part), w 10, drawing 150 (`video-1110-mesures.jpg`).

### 6. Words on the map

For silent viewing the map carries short phrases: « burkina = la personne intègre », « 1810 », « exil du roi Wobgo », « frontières gardées ».

| Word                                   | Type                                                           | Ink                                                   | Outline                           |
| -------------------------------------- | -------------------------------------------------------------- | ----------------------------------------------------- | --------------------------------- |
| Phrase                                 | Nunito Sans 800 40/48, 26 characters a line, two lines at most | `on-image-text`, or the ink of the people it is about | 6 px and the second contour (r 4) |
| Date                                   | Anton 80/80                                                    | `on-image-text`                                       | 9 px and the second contour (r 5) |
| A country's name as the plan's subject | Anton 64/70, tracked 0.1 em                                    | `on-image-text`                                       | 8 px and the second contour (r 5) |
| Its former name's dates                | Nunito Sans 800 30/36                                          | `on-image-muted`                                      | 4 px and the second contour (r 3) |

- **Where.** Near what it says, inside the map's band (y 724 to 1296), at least 12 px clear of every name, label, drawing and arrow head; never under the subtitles.
- **How many.** Two at once; a third makes the oldest leave.
- **Entry and exit.** On its word, 300 ms in, eased (0.2, 0, 0, 1); 300 ms out. A word stays while the voice is on it, and at most until the plan's next fact.

### 7. Camera moves inside a map card

1.5.0 allowed one camera move, the 900 ms change of view between two cards. 1.11.0 also allows a move inside a card, so the map moves with the story (« Les Dioula viennent de l'ouest »: the view slides west and pulls back).

- **On a word**, flat and top-down: pan and zoom together, no rotation, no tilt. 1.6 s, one camera path through its keys with zero speed at both ends, the radius in log.
- **At most two moves in a card**, at least 2 s apart; a radius ratio of 2.5 at most in one move (the boards: 1.15 for the Dioula, 2.0 for the Mossi, 1.6 for 1932). Never while an arrow draws.
- **Marks stay on their ground.** Areas, arrows, drawings and words move with the map and keep their pixel size; names fade out in the 150 ms before the move and back at their new places after it, as in 1.5.0. An area the new view does not frame fades out during the move.
- **The slow zoom** (100 to 104 %, 1.4.0) does not run on a card that moves.
- The change of view between two cards (900 ms, 1.5.0) stays.

### 8. A name that changes on the map

« Haute-Volta » becomes « Burkina Faso » on the same outline (4 August 1984). **Recommended, B: the old name steps aside.** On its word, the old name rises 118 px and shrinks to 62 % at 85 % over 1 s; 500 ms after it starts, the new name enters at its place over 300 ms; at 0.8 s the old name's dates (« de 1919 à 1984 ») enter under it. The outline never moves: the frontiers stay while the name changes, which is what the plan says. Both names stay readable, in the order they came. **Variant A:** the two names cross-fade in place, and the old one is gone (`video-1110-1984.jpg`, bottom row).

### 9. Map phases and picture phases

- **A map when the text situates.** A sentence that places something (a people, a route, a kingdom, a colony, a border) is said over a map.
- **A picture when it does not**, as a phase of its own: whole sentences, **at least 6 s**. A picture shorter than 6 s between two map cards is refused (« Image isolée de moins de 6 s entre deux cartes »): the sentence stays on the map, which must then show its fact. The share of maps and pictures follows the script; it is not fixed.
- **Handover.** The ordinary 300 ms card change (1.4.0), both ways. Back to the map, everything that had entered shows at once, nothing replays (1.5.0).
- **Framing.** A photograph sits full frame, as every picture of the series video (1.4.0); a document to be read (a map, a page, a manuscript) uses the document card (1.8.0).
- **The scripts** are written in map phases and picture phases; each map phase lists its facts and their marks (« The silent viewing check » below).

Board: `video-1110-phases.jpg`. The king's flight in 1896 has a place and a route: it stays on the map with its arrow and its words. The engraving of the king inserted for that one sentence (2.6 s) is the refused case. The signed position, one sentence without a place, holds 11 s on its photograph: a picture phase.

### 10. The silent viewing check

Every fact the voice says during a map phase has its mark on screen while it is said: a word, a date, an area, an arrow, a drawing or a place.

- **The script names them.** Each map phase lists its facts: `{ "say": "<the words of the fact>", "shows": ["area:<id>", "arrow:<id>", "illus:<kind>", "text:<words>"] }`.
- **The proof samples the plan every 100 ms.** An element counts from 60 % opacity; an arrow from half drawn; a text when one of its words is on screen.
- **A fact passes** when at least one of its marks is on screen for 80 % of its spoken time or more, and the first one arrives at most 700 ms after its first word. A fact without a mark fails; the fix is a mark on the map, or the sentence moves to a picture phase.
- **Measured** on the Mossi plan (`video-1110-sans-le-son.jpg`): the first try failed on « Les Mossi parlent le mooré », with nothing on screen; with « mooré : la langue des Mossi » on the map, all six facts pass (84 to 100 %, 0 to 0.4 s).

### Closer views and the imagery

The operator asked for closer views, read at 430 px. With the verified Blue Marble file (21,600 px around the Earth, 1.85 km a pixel) and the 1.4.1 limit of 1.5 frame pixels per source pixel, the closest view is 1336 km across: Burkina Faso fills the clear zone (the opening, 1984), but a Mossi kingdom is 90 px wide, 36 px at 430 (`video-1110-plus-pres.jpg`). The boards of the Mossi plan (1.9 times, about 1045 km across) and of 1896 (1.75 times) are drawn closer than the verified file allows, soft on purpose to show the framing. The NASA Blue Marble mosaic at 500 m (tiles B1 and C1 cover West Africa), once verified and pinned like the 2 km file, brings the limit to 360 km. **Decided (question 1):** it is verified and pinned before the engine change; until then the engine keeps the 1.5 limit and refuses a closer view.

### Boards (1.11.0)

`Video` group, `video-1110-*`: the opening (six frames), the Dioula, the Mossi, 1932 and 1947, 1984 with its two variants, map and picture phases, the illustrations, the measures, closer views, the silent viewing check and the 430 px strip; full-size frames under `plein-ecran/`; animated previews `ouverture.mp4`, `dioula.mp4`, `mossi.mp4`, `1932.mp4`, `1984.mp4` and the refused insert `pingpong.mp4` (540 × 960, 30 frames a second; the previews draw the text outline without the second contour, for speed; the boards draw it). Text and timings are the animatic's, demonstration only; the language areas of the animatic and the engraving's caption are to be sourced.

### For the operator to decide (answered on 19 October 2026)

1. **Closer views:** verify and pin the Blue Marble mosaic at 500 m (recommended), or keep views at 1336 km at least.
2. **The ink follows the people** (recommended), refining 1.5.0's one colour per name.
3. **Camera moves inside a card,** two at most (recommended); or keep moves between cards only.
4. **A name that changes:** B, the old name steps aside with its dates (recommended); or A, a cross-fade in place.
5. **The illustrations' hand** as drawn on the boards (recommended as the reference for series 1); or another hand.
6. **A picture phase of 6 s at least** (recommended); or 8 s.
7. **Eight texts on the map** at once, two of them words (recommended), in place of 1.4.1's six names.
8. **The colonial power in cream**, outside the four inks (recommended).

#### Decided by the operator on 19 October 2026

The eight questions were answered with the designer's recommendations (« j'accepte toutes les recommandations »):

1. **Closer views:** the NASA Blue Marble mosaic at 500 m (tiles B1 and C1) is verified and pinned like the 2 km file, which brings the closest view to 360 km; until it is, the 1.5 limit holds and a closer view is refused.
2. **The ink follows the people:** a people keeps one ink for the whole episode, all its areas share it, each keeps its name.
3. **Moves inside a card:** two at most, on a word, 1.6 s, flat.
4. **A name that changes:** B, the old name steps aside with its dates while the new one takes the outline.
5. **The illustrations' hand:** the eight drawings of the boards are the reference for series 1 (`assets/Illustrations/`).
6. **A picture phase:** 6 s at least, whole sentences.
7. **Eight texts on the map** at once, two of them words, in place of 1.4.1's six names.
8. **The colonial power in cream** (`map-foreign`), outside the four inks.

## Teaching cards in motion and the parchment card (1.12.0-proposition)

**Proposed by Claude Design and accepted by the operator on 20 October 2026, with the designer's recommendations on its eight questions and the three drawings as drawn** (« Decided by the operator on 20 October 2026 » below). Brief: `proposals/1.12.0-proposition/claude-design-brief.md`, from the operator's review of the narration v8 of « Kouassi et Yao » (series 3, episode 1) on 20 October 2026. It builds on the accepted 1.11.0 and the series idents. Every accepted rule stays: the head, the band, the subtitles, the foot, the chapters (1.7.0), the ending (1.10.0), the map grammar (1.11.0), picture phases of 6 s at least, the reading speed (17 characters a second recommended, 21 at most).

The operator's decisions, not to reopen: the week table reads girl | day | boy, one people per table, and its presentation is animated; the name formulas are animated more visibly than a cross-fade; drawings in the series' hand illustrate what a name says, never photographs; a passage with nothing to show but words is a parchment card with motion-design text, like the idents.

Boards: `video-1120-*` in the `Video` group, with eight animated previews, drawn by a scratch board renderer (`card112.html`, not the engine) from the narration v8 and the episode's week table. Times are estimated at the voice's pace; the engine takes them from the voice's word file.

### The parchment card

Most of the episode explains how a name is made, which neither a map nor a photograph can show. Today those cards sit on a photograph of the Akan gold weights, and the letters mix with the object (`video-1120-avant.jpg`). 1.12.0 gives them a ground of their own: the idents' parchment.

- **The ground** is the idents' (`social/series-idents/idents.css`): the site's `bg` #fbf7f2, a white light (radial, 1300 × 1000 px at 50 % 30 %, 55 %), an ochre glow (#c9821f at 12 %, 1400 px) drifting slowly (60 px by sin 0.35 t, 50 px by cos 0.27 t) and the support film's grain (`grain.png`, 5 %, overlay) moving every frame. The same ground, not a calmer copy: the grain is too fine to be seen under a letter, and the glow moves a few pixels a second (question 5).
- **What sits on it:** the week table, the name formula, the side-by-side forms (1.8.0), drawings, and words. Photographs, documents (1.8.0's document card) and maps keep their image.
- **Inks: the Cartes Parchemin theme**, without outline or second contour, since the ground is calm and light: `ink` #2a1e15, `accent` #7f5212, `ink-muted` #55463a, `ink-faint` #655443, `rule` #d6c8b0.
- **The band, the head, the foot and the signature stay** (question 6), at their places and sizes (1.4.0, 1.10.0), in those inks. The band and the signature are drawn once for the video; during the change into or out of a parchment card they cross-fade between their two inkings, in place.
- **Subtitles** keep their band, size and timing. On parchment, recommended: the subtitle in `ink` without outline, the lit word on an `accent` box in #fffaf0 (`video-1120-sous-titres.jpg`). The image subtitle (light letters on a 9 px dark outline) reads too, but makes a dark patch on the light paper.
- **Changes.** A change into or out of a parchment card is the ordinary 300 ms change (1.4.0): images cross-fade, the old head leaves in the first 150 ms and the new one enters in the last 150 ms. Two parchment cards in a row keep their ground, as cards of one map sequence keep their map (1.5.0): only the head and the content change.
- **Length.** A run of parchment cards is a picture phase (1.11.0): whole sentences, 6 s at least.
- **The 3:4 grid crop** (y 240 to 1680) keeps the head, the table, the formula, the drawings, the quotation and the subtitles; the foot and the signature fall outside it, as on every series card (`video-1120-grille.jpg`).

### 1. The week table

One people per table (`video-1120-semaine.jpg`).

| Element                                       | Type                                             | Ink                               | Place                          |
| --------------------------------------------- | ------------------------------------------------ | --------------------------------- | ------------------------------ |
| People and country                            | Nunito Sans 800 40/48, the country 700 30        | `accent`, the country `ink-muted` | centred, top 490               |
| Column labels « fille », « jour », « garçon » | Nunito Sans 800 22/28 capitals, tracked 0.12 em  | `ink-muted`                       | y 550                          |
| Girl's name                                   | Nunito Sans 800 48/56                            | `ink`                             | right-aligned, ending at x 400 |
| French day, the people's word under it        | Nunito Sans 800 32/38; the word 700 italic 28/32 | `ink`; the word `accent`          | centred between x 400 and 680  |
| Boy's name                                    | Nunito Sans 800 48/56                            | `ink`                             | left-aligned from x 680        |
| Rows                                          | 96 px apart, a 1 px `rule` under each            |                                   | from y 590 to 1262             |

- **Reading.** Seven rows hold 152 characters (Baoulé and Twi alike): 7.2 s at 21 characters a second, 8.9 s at 17. **One card per people when the voice leaves it 7.2 s or more**, 9 s recommended; otherwise two cards, Monday to Thursday and Friday to Sunday, each held its own reading time (question 1). In v8, chapter 1 leaves the Baoulé table about 8.5 s and chapter 3 the Twi table about 12 s: one card each. At 430 px a name is 19 px high; the longest, Kwabena and Akosua, are 220 px wide at 1080, Memeneda 130 px in its column of 280.
- **Entry.** The people and the column labels enter with the card (300 ms). On the word that announces the days (« jour », « Sept jours »), the seven rows arrive in a cascade from the top, each in 300 ms rising 16 px, 90 ms apart: the whole table is there in 0.9 s, and the voice never waits for a row it does not say. A table that comes back (the summary) enters whole.
- **The row the voice dwells on.** On its day's word, in 400 ms, the row lights: an ochre band behind it (#c9821f at 16 %, a 2 px edge of `accent` at 35 %, radius 14 px, 14 px wider than the table on each side), and the other rows recede to 40 % (question 2). No change of size, no frame alone, no colour on the names. Two rows lit at most (the voice compares two days); a third lit row makes the first go back. A lit row stays until the card ends.
- **Data.** The episode's table as the brief gives it; no cell is filled from another people's table (1.8.0).

### 2. The formula in motion

The 1.8.0 formula, set on parchment, now built by moves that teach the construction (`video-1120-formule.jpg`, `video-1120-formule-lundi.jpg`). Types as 1.8.0: the day line in Nunito Sans 800 44/52 with the day's word in `accent`; « fille » and « garçon » in Nunito Sans 800 26/32 capitals over their lines; the pieces in Anton 120/124 (104 or 88 when a line needs it to hold in 960 px); the day's part in `accent` wherever it goes; « + » in Nunito Sans 800 64, `ink-muted`.

Four moves, each starting on the word that says it (question 3):

| Move   | What it shows                                     | Length | How                                                                                                                  |
| ------ | ------------------------------------------------- | ------ | -------------------------------------------------------------------------------------------------------------------- |
| Appear | a piece is said                                   | 300 ms | fades in, rising 12 px                                                                                               |
| Join   | the pieces make the name (A + ya = Aya)           | 450 ms | the « + » fades in the first 150 ms; the pieces slide towards each other until they touch, the group staying centred |
| Fall   | a part drops out (Kwa, the é of kissié, (ki), da) | 500 ms | it goes 104 px down, shrinks to 55 % and fades to 30 %, and stays there, under where it was                          |
| Become | a form changes (ya → Yao, Kwa → Koua)             | 300 ms | the letters cross-fade in place; the group re-centres                                                                |

- **What the signs said, the moves now show.** The joining is the « = » of 1.8.0; the fall and the change of form are its « → »; dropped parts stay visible at 30 %, as in 1.8.0, smaller and under the line. No « = » or « → » is printed in a formula in motion. A static formula (a carousel card) keeps the 1.8.0 signs.
- **A form still heard, or a spelling,** goes on one line under the formula, Nunito Sans 800 40/48 in `ink-muted`, its day part in `accent`: « on entend encore Kwao » for 2 s, « Kwa s'écrit Koua en français » to the end of the card. It enters and leaves in 300 ms.
- **Pace.** Two moves on one line at least 700 ms apart; nothing bounces, turns or overshoots. The last state holds to the end of the card.
- **The cases of v8.** Friday: « A », « + ya », join (Aya); « Kwa », « + ya », join, Kwa falls, ya becomes Yao, then « Kwao » under it. Monday: « A + kissié », é falls as A and kissi join (Akissi); « Kwa + kissié », (ki) and é fall, Kwa becomes Koua and joins ssi (Kouassi). Twi: Kwasida, da falls (Kwasi); « A + kosua », join (Akosua); Yawda, da falls (Yaw), Yaa.

### 3. Drawings on teaching cards

Three new drawings in the hand of the eight of 1.11.0, set on parchment (`video-1120-dessins.jpg`): full figures in a small scene, not objects (question 4).

- **Yaw, « le courageux »:** a man wading across a river in spate, a bundle on his head, his staff planted. **Kwasi, « l'agile »:** a man climbing an oil palm with his rope loop. **Kwa, « le serviteur »** (Kwasi Konadu's hypothesis): a young man sweeping the yard at sunrise, the day's first task.
- **What they never are.** Never evidence: the foot says « Dessins : illustrations d'EthniAfrica, pas des documents ». No face (the heads carry no features), no caricature, no Adinkra or other symbol, no named cloth pattern (plain cloth with one border stripe), no ritual: the river, the palm and the yard are everyday scenes. The figures are generic.
- **Size.** Two drawings side by side, 470 px wide each (388 px high), from y 610; one alone, 560 px wide (462 px high), centred, from y 600. On parchment a drawing needs no second contour; its ground fades out at both sides, so it reads as a vignette, not a box.
- **Words.** Under each drawing its name in Anton 72/76 (`ink`) and its quality in Nunito Sans 800 36/42 (`accent`), as one says them: « Yaw · le courageux ». A hypothesis keeps its question mark: « serviteur de l'esprit de son jour ? ».
- **Entry.** On its name's word, 400 ms, rising 8 px; the name 150 ms later; the quality 300 ms later or on its own word. It leaves with its card. No idle motion.
- **Attribution.** As 1.7.0 (« A person quoted by role »): the name in Nunito Sans 800 34/40, the role in 700 26/32 `ink-muted`, its box ending at y 1296, entering on the name's word.

### 4. The parchment text card

For a passage with nothing to show but words: the 1964 law (`video-1120-loi.jpg`).

- **Head:** the dated head of 1.7.0 in Parchemin inks: the place as kicker (« Côte d'Ivoire »), the date set large in Anton 148/136 `accent` (1.4.0 « Long dates »), the label in capitals (« Loi sur le nom »). Each enters on its word; the date also grows from 94 to 100 % in 500 ms.
- **A quotation:** Nunito Sans 700 46/60 in `ink`, a hanging « in Anton 150 `accent` and its closing » in `accent`; lines enter one by one (300 ms, 250 ms apart) on the word that brings the quotation; its source under it, Nunito Sans 700 26/32 `ink-muted` (« Loi n° 64-381 du 7 octobre 1964, article 3 »; the boards print « relative au nom », which is not the law's title). Its key words are underlined as 1.8.0 underlines a passage (7 px `accent`), the line now drawing from left to right in 400 ms on its spoken word.
- **Free words:** Nunito Sans 800 54/64, `ink`, key words in `accent`, an arrow in `ink-muted`; each line on its word, 400 ms rising 12 px (« un jour de naissance » / « → le nom d'une lignée »).
- **How many.** Three blocks at most under the head (here the quotation, its source, the conclusion); everything stays to the end of the card.

### Boards (1.12.0)

`Video` group, `video-1120-*`: today's cards on the photograph; the week table (Baoulé entering, Twi with its two lit rows, the summary); the Friday formula; the Monday formula and the Twi one; the drawings; the 1964 law; the subtitles on parchment; the change from a map; the 3:4 grid crop; the measures; the 430 px strip. Animated previews: `semaine-baoule.mp4`, `semaine-twi.mp4`, `formule-vendredi.mp4`, `formule-lundi.mp4`, `formule-twi.mp4`, `dessins-qualites.mp4`, `dessin-kwa.mp4`, `loi-1964.mp4` (540 × 960, 15 frames a second; the grain without its blend mode, for speed). The text is the narration v8's; the timings are estimates.

### For the operator to decide (answered on 20 October 2026)

1. **The week table:** one card per people when the voice leaves it 7.2 s or more, two cards otherwise (recommended).
2. **The lit row:** an ochre band, the other rows receding to 40 % (recommended); no change of size.
3. **The formula's moves:** appear, join, fall, become, with the lengths above (recommended); the printed « = » and « → » give way to the moves.
4. **The drawings:** full figures in a scene (recommended); the three of the boards as drawn.
5. **The ground:** the idents' ground and grain, unchanged (recommended).
6. **Band and head** kept on parchment cards, in Parchemin inks (recommended).
7. **Teaching cards on parchment:** the week table, the formula and the side-by-side forms leave the photograph for the parchment card (recommended).
8. **Subtitles on parchment** in `ink` without outline (recommended), or the image subtitle.

#### Decided by the operator on 20 October 2026

The eight questions were answered with the designer's recommendations, and the three drawings stay as drawn, the Kwa drawing (« serviteur ») included (« oui j’accepte mais rajoute le dessin », in reply to a proposal to drop it):

1. **The week table:** one card per people when the voice leaves it 7.2 s or more, two cards otherwise.
2. **The lit row:** an ochre band, the other rows receding to 40 %; no change of size.
3. **The formula's moves:** appear, join, fall, become, with their lengths; the printed « = » and « → » give way to the moves.
4. **The drawings:** full figures in a scene; the three of the boards as drawn (`courageux`, `agile`, `serviteur`).
5. **The ground:** the idents' ground and grain, unchanged.
6. **Band and head** kept on parchment cards, in Parchemin inks.
7. **Teaching cards on parchment:** the week table, the formula and the side-by-side forms leave the photograph for the parchment card.
8. **Subtitles on parchment** in `ink` without outline, the lit word on an `accent` box in #fffaf0.

## Checks

- Band: one line (`report.series.lines` is 1); nothing within 12 px of it on a map; tape under it.
- Panel: 828 px at most on a series card (`report.panelMax`), credit line included.
- Image: focal point between the band and the panel.
- Cards without `series`: identical to their 1.2.0 references.
- Video, full screen (1.4.0): see « Renderer integration of 1.4.0 » in Handoff. Every text between x 60 and 1020 and inside its band; no element drawn over the image with a background, except the lit word, the pill's outline, the slot and the demo tape.
- Closing card (1.6.0-proposition, accepted): the signature line drawn from the constant, top at y 760, no title; see « Renderer integration of 1.6.0 » in Handoff.
- Long video (1.7.0-proposition, accepted): chapters from 90 s, the chapter card's title inside y 318 to 700, the chapter kicker composed by the engine, items and figures entering on their words, the signed card without a source line; see « Renderer integration of 1.7.0 » in Handoff.
- Small text on the image (1.10.0-proposition, accepted): the local blur under each block of small text where the picture measures 10 or more, reported; the kicker at 36/42; source and credit at 26/32 in `on-image-ink`; see « Renderer integration of 1.10.0 » in Handoff.
- Closing (1.10.0-proposition, accepted): the line and the invitation drawn from the two constants, the line's top at y 760 on every closing card and at y 318 in the video, no closing card's own body printed, the alternative text ending with both sentences, the closing card's four chunks the four printed lines, word for word; see « Renderer integration of 1.10.0 » in Handoff.
- Teaching cards and the parchment card (1.12.0-proposition, accepted): the idents' ground under a parchment card, its texts in Parchemin inks without outline; the week table one people per card, girl | day | boy, read in its card's time; at most two lit rows; formula moves on their words; drawings on parchment only; three blocks at most on a text card; see « Renderer integration of 1.12.0 » in Handoff.
- Animated satellite map (1.11.0-proposition, accepted): the opening globe becomes the first map without a cut; area states and arrows on their times; arrow width and drawing size from the smallest lit area; every text and drawing in the map band, eight texts at most; moves inside a card on a word, two at most; no picture under 6 s between two map cards; every fact of a map phase with its mark on screen; see « Renderer integration of 1.11.0 » in Handoff.
- Text on the image (1.9.0-proposition, accepted): every outermost text block carries the second contour with r = max(3, round(0.6 × outline)), no text on the image keeps the 1.4.0 soft shadow, the lit word's box has its dark edge; see « Renderer integration of 1.9.0 » in Handoff.
- Document and teaching cards (1.8.0-proposition, accepted): the passage inside y 700 to 1300 within 1.5 frame pixels per source pixel, the edge of the page at most 400 px, the underline entering on its word, the formula's lines in 960 px; see « Renderer integration of 1.8.0 » in Handoff.
