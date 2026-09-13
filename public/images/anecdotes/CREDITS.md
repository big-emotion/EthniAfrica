# Anecdote illustrations — provenance and licences

One picture per anecdote in `src/lib/home/didYouKnowIllustrations.ts`. None of
them is stock photography: each is a document the anecdote is _about_ — the map
that repeats itself, the object that was traded, the person who did the naming.
A generic photograph of the continent would illustrate none of them, and under
a decolonial editorial posture it would illustrate the wrong thing.

Licences were read from the Wikimedia Commons API (`extmetadata`), not assumed.
Every file below is public domain, CC0, CC BY or CC BY-SA. The attribution
required by CC BY and CC BY-SA is printed under the picture by `AnecdoteCard`,
not only filed here — a credit the reader cannot see does not satisfy the
licence. `didYouKnowIllustrations.test.ts` fails the build if a `credit` line
stops naming one.

All files were fetched at Commons' 1400px thumbnail and resized to 1100px on
the long edge, JPEG quality 72. Two anecdotes reuse a file the repo already
carries for the home and are listed at the end.

| Anecdote                  | File                          | Work                                                                                      | Author                                             | Licence       |
| ------------------------- | ----------------------------- | ----------------------------------------------------------------------------------------- | -------------------------------------------------- | ------------- |
| `monrovia`                | `monrovia.jpg`                | Map of Liberia, c. 1870, annotated in ink                                                 | American Colonization Society / D. McClelland      | Public domain |
| `bantou`                  | `bantou.jpg`                  | Guthrie's Bantu zones (with Tervuren's zone J)                                            | Edricson                                           | CC BY-SA 3.0  |
| `cote-ivoire`             | `cote-ivoire.jpg`             | Tusk Carving with Figures, 19th c., Brooklyn Museum 1992.136.14                           | Unknown                                            | CC BY 3.0     |
| `lingala`                 | `lingala.jpg`                 | The paddle steamer _Livingstone_ at Baringa, Congo, c. 1900-1915                          | Unknown                                            | Public domain |
| `personne-relationnelle`  | `personne-relationnelle.jpg`  | Annual meeting of the men of Ribina, Nigeria, 1970-1973 (ASC Leiden, Rietveld Collection) | Aart Rietveld                                      | CC BY-SA 4.0  |
| `afrique`                 | `afrique.jpg`                 | Antonine Baths at Carthage, Tunisia (2007)                                                | Institute for the Study of the Ancient World       | CC BY 2.0     |
| `burkina-faso`            | `burkina-faso.jpg`            | Ouagadougou from the air, winter 1930-1931                                                | Walter Mittelholzer (1894-1937)                    | Public domain |
| `cameroun`                | `cameroun.jpg`                | Pirogues on the Wouri, Douala (2020)                                                      | Kondah                                             | CC BY-SA 4.0  |
| `benin-dahomey`           | `benin-dahomey.jpg`           | Cast brass plaque from Benin City, 16th c., British Museum room 25                        | Vassil                                             | CC0           |
| `nigeria-flora-shaw`      | `nigeria-flora-shaw.jpg`      | Flora Shaw (Lady Lugard) and Frederick Lugard, 1908                                       | Arnold Wright                                      | Public domain |
| `zimbabwe-grand-zimbabwe` | `zimbabwe-grand-zimbabwe.jpg` | Outer walls of Great Zimbabwe                                                             | Credited on Commons to Edwin Smith and Andrew Dale | CC BY-SA 4.0  |
| `prefixes-bantous`        | `prefixes-bantous.jpg`        | Village in the Maloti mountains, Lesotho (2016)                                           | SkyPixels                                          | CC BY-SA 4.0  |
| `peul-dix-noms`           | `peul-dix-noms.jpg`           | Railway station, Dakar, 1972 — a man in a pointed Fulani straw hat (ASC Leiden)           | Fred van der Kraaij                                | CC BY-SA 4.0  |
| `khoikhoi-hottentot`      | `khoikhoi-hottentot.jpg`      | « Hottentote », hand-tinted engraving, c. 1797, LACMA M.83.190.325                        | Jacques Grasset de Saint-Sauveur / Labrousse       | Public domain |
| `pygmee-homere`           | `pygmee-homere.jpg`           | Attic red-figure plastic vase, a pygmy carrying a killed crane (geranomachy)              | ArchaiOptix                                        | CC BY-SA 4.0  |
| `lac-lac`                 | `lac-lac.jpg`                 | Map of Africa, c. 1847                                                                    | Victor Levasseur / Frédéric-Guillaume Laguillermie | Public domain |
| `tombouctou`              | `tombouctou.jpg`              | Djinguereber Mosque, Timbuktu (2020)                                                      | Ondřej Havelka                                     | CC BY-SA 4.0  |
| `fleuve-niger`            | `fleuve-niger.jpg`            | Boatmen poling a pinasse on the Niger                                                     | PGskot                                             | CC BY-SA 4.0  |
| `ethiopie`                | `ethiopie.jpg`                | Illuminated Gospel, Amhara, late 14th–early 15th c., Metropolitan Museum of Art           | Metropolitan Museum of Art open access             | CC0           |
| `guinee`                  | `guinee.jpg`                  | Wall map of Africa, 1794, after d'Anville                                                 | Solomon Boulton / J.-B. Bourguignon d'Anville      | Public domain |
| `tanzanie`                | `tanzanie.jpg`                | Julius Nyerere, 1975 (Fotocollectie Anefo)                                                | Rob Mieremet / Anefo                               | CC0           |
| `mozambique`              | `mozambique.jpg`              | Igreja de São Sebastião, fort of São Sebastião, Island of Mozambique (2007)               | Erik Cleves Kristensen                             | CC BY 2.0     |
| `sierra-leone`            | `sierra-leone.jpg`            | Bay of Free Town, Sierra Leone — Imray nautical guide, 1884                               | British Library, Mechanical Curator collection     | Public domain |

Each file page on Commons is reachable at
`https://commons.wikimedia.org/wiki/File:<original file name>`; the original
names are the ones recorded in the job that fetched them and are preserved in
the descriptions above.

## Reused from the home

- `amazigh` → `/images/home/tifinagh-algeria.jpg`. Tifinagh inscriptions in
  rock, Algeria, by Patrick Gruban, CC BY-SA 2.0. The home's `PurposeBlocks`
  already argues from this exact picture, for the same reason; a second copy
  at a second path would be the same file twice. Full entry in
  `public/images/home/CREDITS.md`.

## Notes

- **`zimbabwe-grand-zimbabwe`** — Commons records the authors as Edwin Smith
  and Andrew Dale (ethnographers of the 1920s) against a CC BY-SA 4.0 licence
  and a 2020 upload date. The two do not obviously agree; the credit follows
  what Commons asserts rather than what the dates suggest, and the file page is
  the place to settle it if it ever matters.
- **`cote-ivoire`** and **`lingala`** carry no named author on Commons. They are
  credited to the holding institution and to the public domain respectively,
  which is what the file pages support.

## Second batch — the corpus's naming mechanisms (2026-09-03)

Forty-three anecdotes were drawn from the people fiches of
`dataset/source/afrik`. Ten of them found a picture that is a document the
anecdote is _about_: the plant that carries the slur, the river a language
family was named after, the person who did the naming, or the people's own
sculpture. The other thirty-three were illustrated at the time by a drawn
plate showing the two names; those plates were replaced by photographs in
the third batch below.

Sourced across four providers, licences read from each API rather than
assumed: `scripts/anecdotes/sourceIllustrations.ts`. Fetched at 900 px on
the long edge, JPEG quality 70 — the card never displays more than 460 px,
and the first batch's 1100 px average of 233 Ko was weight for pixels no
screen shows.

| Anecdote              | File                      | Work                                                                                                                                                                                 | Author                     | Licence       | Source    |
| --------------------- | ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------- | ------------- | --------- |
| `azande-niamniam`     | `azande-niamniam.jpg`     | Impatiens niamniamensis kz04.jpg                                                                                                                                                     | Krzysztof Ziarnek, Kenraiz | CC BY 4.0     | commons   |
| `omotique-fleuve-omo` | `omotique-fleuve-omo.jpg` | Omo Valley in Ethiopia.jpg                                                                                                                                                           | pxfuel.com                 | CC0           | commons   |
| `gur-mabia`           | `gur-mabia.jpg`           | Trees reflecting on the Volta River.jpg                                                                                                                                              | ARchIvlst07                | CC BY-SA 4.0  | commons   |
| `ronga-junod`         | `ronga-junod.jpg`         | HJ-1-P16.png                                                                                                                                                                         | Henry Junod                | Public domain | commons   |
| `beti-cranes`         | `beti-cranes.jpg`         | Portrait of Paul Belloni Du Chaillu.jpg                                                                                                                                              | Elliott Fry                | Public domain | commons   |
| `tabwa-attache`       | `tabwa-attache.jpg`       | Figure- Male MET 1978.412.592 a.jpeg                                                                                                                                                 | —                          | CC0           | commons   |
| `fang-reputation`     | `fang-reputation.jpg`     | Eyema byeri (reliquary guardian figure)                                                                                                                                              | Okak-Fang artist           | CC0           | openverse |
| `bambara-refus`       | `bambara-refus.jpg`       | Chi Wara Headdress, Bamana people, Mali, 20th century, wood - Huntington Museum of Art - DSC05130.JPG                                                                                | Daderot                    | CC0           | commons   |
| `guere-wobe`          | `guere-wobe.jpg`          | Ritual mask, Gere people, Ivory Coast 01.jpg                                                                                                                                         | Mickey Mystique            | CC BY-SA 4.0  | commons   |
| `dioula-metier`       | `dioula-metier.jpg`       | ASC Leiden - van Achterberg Collection - 5 - 005 - La Grande Mosquée de Bobo-Dioulasso, avec 21 niveaux de protubérances en bois - Bobo-Dioulasso, Burkina Faso, 19-26 août 2001.tif | Angeline A. van Achterberg | CC BY-SA 4.0  | commons   |

`omotique-fleuve-omo` was replaced in the third batch: its uploader credits
pxfuel, a site that re-hosts photographs under a blanket CC0 it has no power
to grant.

The ten pictures here carry `licenceUrl` and `filePage`, so the caption
publishes the licence rather than naming it (brand charter §9, and §4(a) of
CC BY-SA itself). The twenty-four pictures of the first batch received the
same two links on 2026-09-13, read from the Commons API (`LicenseUrl`) and
each matched against the shipped file by eye; public-domain files carry the
file page only, since they ask for no licence notice.

## Third batch — real pictures in place of the plates (2026-09-13)

Operator ruling: the site carries real images. The thirty-three drawn plates
of the second batch, and the pxfuel-sourced Omo picture, were replaced by
photographs or photographed documents under a free licence. Where no picture
is exactly about the anecdote, a neighbour was taken, walking down a cascade
and stopping at the first rung that yields a good, free image (brand charter
§9):

1. the thing the anecdote is about;
2. the people's own place or material culture;
3. the country;
4. the region.

The alt and the credit name what the picture actually shows — the hills of
southern Burundi, not "the Hutu". Every licence was read from the provider's API
(Commons `extmetadata`, Cleveland `cc0`, Flickr via Openverse), every finalist
was looked at before it was taken, and all files were fetched at 900 px on the
long edge, JPEG quality 70.

**No face under a slur.** `iteso-bakedi`, `datoga-mangati`, `west-taa-masarwa`,
`khwe-penduka`, `kirdi-paien` and `hutu-cartes-identite` show a place, a
dwelling, livestock or a landscape. No file was taken whose own title carries
the slur the anecdote criticises. `hutu-cartes-identite` also carries no image
of the genocide.

**`tetela-watetera`** is a crop of the 1888 map around the label « BATETELA »:
at card size the whole sheet reads as a grey rectangle, and the label is the
document's point.

| Anecdote                 | File                         | Work                                                                                                                                                                                      | Author                                                            | Licence       | Rung |
| ------------------------ | ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- | ------------- | ---- |
| `kirdi-paien`            | `kirdi-paien.jpg`            | Mandara Mountains, Far North Region, Cameroon (2018)                                                                                                                                      | Serieminou                                                        | CC BY-SA 4.0  | 2    |
| `bamileke-cent-royaumes` | `bamileke-cent-royaumes.jpg` | Courtyard of the royal palace of the Bandjoun chiefdom, West Region, Cameroon (2013)                                                                                                      | Tokankh                                                           | CC BY-SA 4.0  | 2    |
| `sara-douzaine`          | `sara-douzaine.jpg`          | Rooftop view over Moundou, Logone Occidental, Chad (2019)                                                                                                                                 | Korom10                                                           | CC BY-SA 4.0  | 2    |
| `masa-banana`            | `masa-banana.jpg`            | Masa earthen houses at Yagoua, Far North Region, Cameroon (2022)                                                                                                                          | Bile rene                                                         | CC BY-SA 4.0  | 2    |
| `bassa-nge-distinction`  | `bassa-nge-distinction.jpg`  | Lokoja and the river seen from the summit of Mount Patti, Kogi State, Nigeria (2017)                                                                                                      | Dotun55                                                           | CC BY-SA 4.0  | 2    |
| `kalabari-calabar`       | `kalabari-calabar.jpg`       | « Cours du Nouveau Calebar », survey chart of the New Calabar River by Charles Girard, 1867 (University of Illinois Library via DPLA)                                                     | Charles Girard                                                    | Public domain | 1    |
| `hutu-cartes-identite`   | `hutu-cartes-identite.jpg`   | Hills and valleys in southern Burundi (2007)                                                                                                                                              | Dave Proffer (d_proffer)                                          | CC BY 2.0     | 3    |
| `antambahoaka-surnom`    | `antambahoaka-surnom.jpg`    | The Pangalanes canal at Mananjary, east coast of Madagascar (2024)                                                                                                                        | Privatemajory                                                     | CC BY-SA 4.0  | 2    |
| `iteso-bakedi`           | `iteso-bakedi.jpg`           | Grain store in the Teso country, eastern Uganda, published 1909 (J. B. Purvis, _Through Uganda to Mount Elgon_)                                                                           | Unknown photographer                                              | Public domain | 2    |
| `datoga-mangati`         | `datoga-mangati.jpg`         | Livestock enclosure (boma) of a Datooga homestead, Tanzania, 2022 (Wiki Loves Africa 2022)                                                                                                | Erasmus Kamugisha                                                 | CC BY-SA 4.0  | 2    |
| `west-taa-masarwa`       | `west-taa-masarwa.jpg`       | Aerial view of Aminuis and its pan, Omaheke Region, Namibian Kalahari, 2017                                                                                                               | Hp.Baumeler                                                       | CC BY-SA 4.0  | 2    |
| `khwe-penduka`           | `khwe-penduka.jpg`           | Sunset over the Okavango River, Bwabwata National Park, Namibia, 2018                                                                                                                     | Jedesto                                                           | CC BY-SA 4.0  | 2    |
| `murle-moden`            | `murle-moden.jpg`            | Flooded plain near Pibor seen from the air, Pibor County, South Sudan, 2012 (Panoramio)                                                                                                   | Олег Сокол (Oleg Sokol)                                           | CC BY-SA 3.0  | 2    |
| `gorowa-village-voisin`  | `gorowa-village-voisin.jpg`  | Lake Babati and a hill above its shore, Manyara Region, Tanzania, 2009                                                                                                                    | Daniel Thomas                                                     | CC BY-SA 2.0  | 2    |
| `rendille-baton`         | `rendille-baton.jpg`         | Traditional Rendille house covered with mats, hides and cloth, northern Kenya, 2012                                                                                                       | Redemption93                                                      | CC BY-SA 4.0  | 2    |
| `kaffa-cafe`             | `kaffa-cafe.jpg`             | Silver crown with crest, Kaffa kingdom, Ethnological Museum, Addis Ababa (photo 2018; museum label: "Restituted item — Heritage from Kaffa Kingdom")                                      | Sailko                                                            | CC BY 3.0     | 2    |
| `omotique-fleuve-omo`    | `omotique-fleuve-omo.jpg`    | The Omo River seen from the Karo village of Doose, lower Omo valley, Ethiopia, 2012                                                                                                       | Bernard Gagnon                                                    | CC BY-SA 3.0  | 1    |
| `teke-vendre`            | `teke-vendre.jpg`            | Mitako, bracelet-currency in brass or copper attributed to the Teke of Congo, Museo Casa de la Moneda, Madrid (photo 2022)                                                                | Ángel M. Felicísimo                                               | CC BY 2.0     | 2    |
| `tetela-watetera`        | `tetela-watetera.jpg`        | Detail of _Originalkarte des Sankuru-Stromes und seiner Nebenflüsse_ after Ludwig Wolf's 1886 surveys, Petermanns Geographische Mitteilungen, 1888, cropped around the label « BATETELA » | Bruno Hassenstein, after Ludwig Wolf and the Wissmann expeditions | Public domain | 1    |
| `manianga-marche`        | `manianga-marche.jpg`        | The River Congo seen from the plateau at Manyanga, engraving from Harry H. Johnston, _The River Congo from its Mouth to Bólóbó_ (London, 1895)                                            | Harry H. Johnston                                                 | Public domain | 2    |
| `kaonde-riviere`         | `kaonde-riviere.jpg`         | Forest on the bank of the Kabompo River, West Lunga National Park, Zambia (2021)                                                                                                          | MarkTownsendZambia                                                | CC BY-SA 4.0  | 3    |
| `kavango-riviere`        | `kavango-riviere.jpg`        | The Okavango River near Rundu, Namibia (2006)                                                                                                                                             | Peter Stenglein                                                   | CC BY-SA 2.5  | 1    |
| `tswa-recensement`       | `tswa-recensement.jpg`       | Thatched homes in Vilankulo, Inhambane Province, Mozambique (2008)                                                                                                                        | Brian Dell                                                        | Public domain | 2    |
| `angolar-naufrage`       | `angolar-naufrage.jpg`       | Dugout fishing canoes on the beach of São João dos Angolares, São Tomé (2019)                                                                                                             | Ji-Elle                                                           | CC BY-SA 4.0  | 2    |
| `crioulo-cap-vert`       | `crioulo-cap-vert.jpg`       | House in rua Banana, Cidade Velha (former Ribeira Grande), Santiago, Cape Verde (2011)                                                                                                    | Cayambe                                                           | CC BY-SA 3.0  | 2    |
| `wonnin-godie`           | `wonnin-godie.jpg`           | Bovine mask, Wonnin (catalogued as Godié), Côte d'Ivoire, c. 1900, Musée africain de Lyon (photographed 2016)                                                                             | Ji-Elle                                                           | CC BY-SA 4.0  | 2    |
| `bete-plantation`        | `bete-plantation.jpg`        | Cocoa beans drying in front of a mud-brick house, Ziplignan, Gagnoa department, Côte d'Ivoire (2010)                                                                                      | arno B                                                            | CC BY 3.0     | 2    |
| `toura-wen`              | `toura-wen.jpg`              | Biankouma below its forested hills, western Côte d'Ivoire (2008)                                                                                                                          | Zenman                                                            | CC BY-SA 3.0  | 2    |
| `dogon-habe`             | `dogon-habe.jpg`             | Dogon village at the foot of the Bandiagara escarpment, Mali                                                                                                                              | Kirua                                                             | CC BY-SA 3.0  | 2    |
| `le-nom-est-une-reponse` | `le-nom-est-une-reponse.jpg` | Painted walls and huts at the Sirigu Women's Organisation for Pottery and Art, Upper East Region, Ghana (Flickr)                                                                          | Sucram Yef                                                        | CC BY 2.0     | 2    |
| `kasem-gurunsi`          | `kasem-gurunsi.jpg`          | Painted house in the royal court of Tiébélé, a Kasena village, Burkina Faso (2016)                                                                                                        | Alexander Leisser                                                 | CC BY-SA 4.0  | 2    |
| `bono-brong-ahafo`       | `bono-brong-ahafo.jpg`       | Rock formations in the valley at Tanoboase, near Techiman, Bono East Region, Ghana (2014)                                                                                                 | Kelsdark                                                          | CC BY-SA 3.0  | 2    |
| `fulbe-quatre-noms`      | `fulbe-quatre-noms.jpg`      | Kaasa blanket, handwoven wool in six strips, Fulani style, Cleveland Museum of Art 2024.72                                                                                                | Cleveland Museum of Art                                           | CC0           | 2    |
| `malinke-manden`         | `malinke-manden.jpg`         | Thatched hut roof and sandstone cliffs near Siby, in the Manden hills, Mali (Flickr)                                                                                                      | Ralf Steinberger                                                  | CC BY 2.0     | 2    |

Three choices were made knowingly and are recorded so they can be revisited:

- **`toura-wen`** shows the town of Biankouma, not a Toura object: the only
  free picture of a Toura mask on Commons is a watermarked phone snapshot whose
  attribution nothing confirms. Its caption names the town, not the people.
- **`wonnin-godie`** is a portrait-format museum photograph; the card sets
  pictures with `object-fit: contain`, so the horns are not cropped.
- **`masa-banana`** — Commons files the houses under "Masa people" and
  "Yagoua"; they may be a reconstruction, so the caption says no more than
  "Masa houses at Yagoua".

### Curator review (2026-09-13)

Every third-batch picture was checked against the people fiche its anecdote
names. What changed, and why:

- **A caption does not repeat the name its anecdote rejects.** `wonnin-godie`
  reads « masque bovin wonnin, catalogué « godié » »; `fulbe-quatre-noms` says
  « de style fulbe » where Cleveland says "Fulani (Peul) style"; `masa-banana`
  uses Masa, the form the fiche gives as the group's own, not Massa.
- **`kirdi-paien`** no longer names Mora: it is the seat of the Wandala sultan,
  and « Kirdi-Mora » is the slur joined to the town's name. The file title
  still says Mora; only the link reaches it.
- **`hutu-cartes-identite`** — the file's own geotag (4.007°S 30.069°E) lies
  about 70 km inland from Rumonge, whatever its category says, so the caption
  says southern Burundi.
- **Rungs lowered** where the fiche does not carry the claim: `bete-plantation`
  (the name's plantation origin is placed in the south-east, Gagnoa is
  centre-west), `masa-banana` and `teke-vendre` (material culture, not the
  word itself), `kaonde-riviere` (the fiche names Solwezi and Kasempa, never the
  Kabompo or West Lunga).
- **`bono-brong-ahafo`** — no fiche names Tanoboase. Its tie to the Bono rests
  on the fiche's Techiman and on Tanoboase lying in Techiman municipality,
  which only unverified sources state.
- **Credits corrected to what the file pages say**: the 1909 Teso photograph is
  by an unknown photographer, published by Purvis; the Omo village is Doose;
  the Sirigu photographer is Sucram Yef; the Calabar chart is Charles Girard's;
  the mitako are brass or copper, attributed to the Teke by the exhibition; the
  Sankuru map follows Ludwig Wolf's 1886 surveys.
- **Two pictures replaced.** `manianga-marche` showed a powder box that the
  Brooklyn Museum records only as "Democratic Republic of the Congo" — "Sundi"
  was a Commons category, and the corpus knows a second Sundi people across
  the river. It is now Johnston's 1895 engraving of the Congo from the Manyanga
  plateau, the stretch between the Manyanga and Mpioka falls the fiche names.
  Commons tags it "No restrictions" (Flickr Commons, Internet Archive book
  images) rather than with a public-domain template; it is credited as public
  domain because it was published in 1895 and Johnston died in 1927.
  `kaffa-cafe` showed a coffee cup under a headline that denies the coffee
  etymology; it is now the silver crown of the Kaffa kingdom, whose museum label
  marks it as restituted. No free photograph of a Kafa house or of the Kafa
  forest was found.
