EthniAfrica Cartes is the card system for EthniAfrica's social carousels: one 1080 × 1350 card format, six card types, a dark and a light theme, and a renderer (`EthniCards`) that turns one JSON card into one exact image. **Version 1.3.0-proposition, 13 October 2026, accepted by the operator on 14 October 2026**: version 1.2.0-proposition plus one series band, a carousel model for each of the seven series and one 9:16 video model in layout B, the video's own card (see Series). Cards without a series are unchanged. **1.2.0-proposition, 12 October 2026**: version 1.1.0-proposition (accepted 10 October 2026) plus the historical atlas map and a collision check for every map. The operator accepted 1.2.0-proposition on 12 October 2026. No 1.1 rule changed; the new check moved two labels of the 1.1 examples by a few pixels (« OUGANDA » on `seq-3`, « Centrafrique » on the graded Fulɓe maps), where names touched. The version identifier retains its `-proposition` suffix for traceability. The [production adapter](../renderer/README.md) integrated 1.2.0 on 12 October 2026 and passes its 38 references; see `version.json` and Handoff. Public copy on the cards is French; this book is the internal reference, in English, like the rest of the repository's documentation.

**[1.6.0-proposition](proposals/1.6.0-proposition/README.md)**, proposed and accepted on 15 October 2026: the project's signature line « Connaître nos noms, décoloniser leur emploi, nous nommer nous-mêmes. » at the end of every carousel and every series video, after the series' fixed closing, the same look in the same place every time. On the closing card it takes the place of the closing slogan, which is retired, and « L'Afrique à travers ses noms » leaves the centred signature. The other cards do not change. See Series, « The signature line », and Handoff, « Renderer integration of 1.6.0 ».

**[1.5.0-proposition](proposals/1.5.0-proposition/README.md)**, proposed and accepted on 15 October 2026: a map sequence in the series video, areas and names entering on the word that says them, one colour per name, the language stacked under the name, and one map across consecutive cards (the view may change only between two cards). The carousel cards do not change. See Series, « Map sequence », and Handoff, « Renderer integration of 1.5.0 ».

**[1.4.1-proposition](proposals/1.4.1-proposition/README.md)**, proposed and accepted on 14 October 2026: in the series video, a map card is drawn on satellite imagery by the satellite video engine, with the overlays of Vidéo carte 0.4.0, instead of a flat base map; no 9:16 base map is built per region. Atlas cards stay on the carousel. The carousel cards do not change. See Series, « Map cards on satellite imagery », and Handoff, « Renderer integration of 1.4.1 ».

**[1.4.0-proposition](proposals/1.4.0-proposition/README.md)**, proposed and accepted on 14 October 2026: the series video in full screen. The image fills the whole 1080 × 1920 frame and only text sits on it, each letter edged by a dark outline, with no shadow zone and nothing fitted to the networks' interface; it replaces video layout B, which the operator withdrew the same day. Eight `on-image-*` tokens serve the video only; no card changes. See Series, « Vidéo de série », and Handoff, « Renderer integration of 1.4.0 »; the series video is produced by `social/video`.

**[1.3.0-proposition](proposals/1.3.0-proposition/README.md)**, proposed on 13 October 2026 and accepted on 14 October 2026 with video layout B: the band carrying a social series' name and episode number, one carousel model per series and one 9:16 series video. The renderer integrated it on 14 October 2026 (89 references, see `social/renderer/README.md`); the series video is produced by `social/video`.

Read the further sections for the detail: **Content fit** (what changes when text does not fit), **Maps** (geographic cards and the border layer), **Handoff** (fields, assets, outputs and open choices for the production coordinator), **Series** (the series band, the seven carousel models, their images and the series video, 1.3.0).

## Content fundamentals

The cards tell the history of a name: where it comes from, who used it, when, and how far back the sources go. **Little text on each card**: a title, then at most a short paragraph or a few fields. Write connected, everyday French following the DITP approach, as `docs/editorial/reader-facing-register.md` asks, in whole sentences. Introduce a name before explaining it, then continue with pronouns.

- **One idea per card.** A second idea is a second card. The engine enforces this through the panel limit (see Content fit), never by shrinking text.
- **The opener is a title.** No paragraph under it, only « Faites défiler ».
- **A map card has no running text.** A title, a legend and a one-line caption are enough.
- **Names keep their spelling.** Fulɓe, Eʋegbe, Kpɛlɛɛ, Fɔ̀ngbè, Nǁŋǃke print exactly as the source writes them. No field that can hold a name is set in forced capitals: an uppercase Ʋ reads as V and an uppercase ɓ loses its hook. Titles use sentence case.
- **Uppercase is reserved** for fixed interface labels (`NOM EMPLOYÉ`, `FAITES DÉFILER`), the site pill and, until 1.6.0, the closing slogan, which never contain an African name. The signature line (1.6.0-proposition) contains none either, but is set in sentence case.
- **One accent word per title**, marked `*mot*` in the card data. On a map card, words can instead take the colour of the area they name, marked `{area-a:langue A}`, as the legend does.
- **Periods are written in words**: « De 1894 à 1910 », « 1862 et 1863 », « vers 1850 ». No dash between dates.
- **An unknown date stays unknown.** The dated card prints « Date inconnue » rather than a manufactured year.
- **Quotation versus translation.** An exact quotation keeps its original language inside guillemets (`quote.original`); a French rendering is labelled « Traduction » and printed without guillemets (`quote.translation`).
- **The searched form leads to the self name.** « Vous avez cherché Peul. Ce peuple se nomme lui-même Fulɓe. » (doctrine §1.1) uses the `NameForms` pair, without further explanation.
- **Maquette text is labelled.** Card text not yet approved carries the yellow `demo` tape. The tape never reaches a published export.

## Visual foundations

### Format and anatomy

Every card exports at **1080 × 1350 px** (4:5). The image (photograph, document or map) covers the whole card. From top to bottom:

1. **Image window**: at least `image-window-min` (450 px, a third of the height, the operator's ruling of 9 October 2026), where the focal point sits.
2. **Veil**: a 300 px gradient from `scrim-clear` to `veil`, then the veil under the whole panel. The veil is translucent (86 % in Nuit, 90 % in Parchemin), so the picture stays visible behind the text, as on the earlier carousels. Over a page of print or a manuscript, set `veil: "strong"` (96 %, `veil-strong`) so the document's lines do not mix with the card's; map cards always use it, with a 90 px gradient.
3. **Panel**, anchored to the bottom, at most `panel-max` (900 px): kicker and folio, title, then the card's own blocks, source line, credit line, signature row.

Safe margins are `space-6` (72 px) left and right; the panel's bottom margin is 44 px.

### Colour

Two themes share every token: **Nuit** (dark, as in the fetishism carousel) and **Parchemin** (light, as in the griot carousel). Choose one theme per carousel; it can change from one publication to the next.

Apply the **60-30-10 rule**: about 60 % of the surface is the image and the veil, about 30 % is `ink` text, and at most 10 % is `accent`. A colourful photograph counts in the 60 %: pair it with a sober panel and no extra accent. Maps follow their own palette (Maps section): they stay light in both themes, like a printed map above a title band.

Every text colour holds at least 4.5:1 on `ground` in both themes, and still on the translucent veil in the worst case (a white image under Nuit, a black one under Parchemin); each token's usage note gives its ratio.

### Typography

- **Anton** (`display`) for titles, dates, names and table terms. It covers every African letter tested, including ɓ ɗ ƙ ŋ ɛ ɔ ƴ ɲ ɩ ʋ, clicks ǀ ǁ ǂ ǃ and combining tones.
- **Nunito Sans** (`text`) for everything else, as on the site and on the earlier carousels. It lacks a few African letters (ɛ, ɔ, ɲ, ƙ, ɖ, ɣ); **Noto Sans** draws those letters only, as a fallback. Prefer setting such names in a title, a table term or a field name, where Anton draws them all.
- **Fraunces** (`wordmark`) only for the word EthniAfrica and the slogan in the signature; since 1.6.0-proposition, for the signature line too, the project's sentence, at 56/64.
- **Noto Sans Ethiopic** is the last fallback in both stacks, so a Geʽez autonym renders.
- **Noto Sans Arabic** SemiBold serves the map videos only (Vidéo carte 0.3.0): once per video, for the word under discussion, in parentheses after its transcription. The cards do not load it.

| Style                | Export px                                            | Read at 430 px | Read at 375 px | Read at 320 px |
| -------------------- | ---------------------------------------------------- | -------------- | -------------- | -------------- |
| `display-opener`     | 116 / 112                                            | 46             | 40             | 34             |
| `display`            | 88 / 90 (72 / 76 from three lines, and on map cards) | 35             | 31             | 26             |
| `display-date`       | 176 / 156                                            | 70             | 61             | 52             |
| `display-name`       | 76 / 82                                              | 30             | 26             | 23             |
| `body`, `field`      | 32 / 45                                              | 12.7           | 11.1           | 9.5            |
| `body-dense` (floor) | 28 / 40                                              | 11.1           | 9.7            | 8.3            |
| `kicker`             | 28 / 34                                              | 11.1           | 9.7            | 8.3            |
| `legend`             | 24 / 30                                              | 9.6            | 8.3            | 7.1            |
| `source`             | 22 / 30                                              | 8.8            | 7.6            | 6.5            |
| `credit`             | 19 / 25                                              | 7.6            | 6.6            | 5.6            |

The body is small on purpose and stays short: the operator ruled on 10 October 2026 that the 40 px body of version 1.0 changed the look too much. Sources and credits are present and readable by zooming (ruling of 9 October); the full references go in the publication package.

### Image framing

Each image has a **focal point** (`image.focus`, as fractions of the image), an **anchor** (`image.anchor`, as fractions of the image window) and an optional **zoom**. The renderer scales the image to cover the card and places the focal point on the anchor, so the crop changes with the subject and with the panel height. Pick the focal point on what carries meaning: a face, the printed line being discussed, a stamp, a place label. The fit report warns when the focal point falls under the text. Documents may add up to two **insets** (zooms) inside the image window, each with a short label.

Use real photographs, real documents and documented geography only. Generated imagery never stands in for historical evidence.

### Sources, credits and attribution

Every card that states a fact carries a `Source :` line (author, title or holder, date, page). Every image carries its credit line (creator, place, date, platform, licence). A credit states what the file shows, never an event its title claims without evidence. CC BY-SA images make the adapted card CC BY-SA.

### Branding

The signature row closes every card: the current EthniAfrica logo (`Logo/ethniafrica-logo.png`, 44 px), the word EthniAfrica in Fraunces, and `ethniafrica.com · @ethniafrica` on the right. On the closing card the signature is centred and the site appears as an outlined pill (`ETHNIAFRICA.COM`); until 1.6.0 the slogan « L'Afrique à travers ses noms » sat under the word. Never use the retired « Atlas des Peuples d'Afrique » signature. **Two words, two things:** the signature row is this logo row; the signature line (1.6.0-proposition) is the project's sentence on the closing card. With 1.6.0 the centred signature drops « L'Afrique à travers ses noms ».

### Iconography

No emoji and no icon font. The status shapes drawn by the engine are: circle (usage actuel), flag (indépendance), square (adoption officielle), triangle (attestation datée), triangle on a bar (plus ancienne attestation repérée), filled diamond (origine la plus ancienne connue), dotted circle (avant ce nom), two bars (usage parallèle), open diamond (hypothèse), hatched square (incertain). On a card, only origin, context and uncertainty draw a mark; the other kinds name the kicker. The shapes reappear in the closing recap of a dated sequence.

## Card types

- **Opener** (`type: "opener"`): kicker, a large title, « Faites défiler ».
- **Explanation** (`type: "explanation"`): a title and a short paragraph, or the `NameForms` table or pair, or an exact quotation.
- **Document** (`type: "document"`): the explanation set on the document it discusses, with optional insets.
- **Dated name** (`type: "dated"`): the date in large type, the name used then, then two balanced columns, what it designates and who uses it. No timeline on the card. The branch variant puts two concurrent forms side by side, each with its own colour.
- **Map** (`type: "map"`): the map takes most of the card; the panel holds a title, a legend and a one-line caption. Border layer none, quiet or strong. Since 1.2.0, the **historical atlas** variant draws up to 45 states, societies without a king and archaeological cultures of one moment as approximate zones on one continent map, named on the map or numbered in keys by region over the sea, with a period marker for a series going back in time; the same variant fills present-day states by colonial power (1914, with the territories of the period named) or by independence date, over dotted present-day borders (see Maps).
- **Closing** (`type: "closing"`): centred slogan in capitals, one sentence of invitation, the site pill, the centred signature. After a dated sequence, a simple recap timeline (`recap`) sums up the name's path. **Since 1.6.0-proposition (accepted on 15 October 2026):** no title; top to bottom, the series band, the kicker, folio and recap when there are any, the **signature line** (Fraunces 600 56/64, three lines broken after each comma, its top at y 760 on every closing card), the invitation « Cherchez [nom] sur EthniAfrica, lien en profil. », the site pill, the credit and the centred signature without its motto. A series' fixed closing is never on this card: it is the title of the last content card. The alternative text ends with the signature line, word for word.
- **Series band** (1.3.0, any type): `series: {id, episode}` adds the band « D'où vient le nom de mon pays ? · n° 14 » at the top of the card; the image window starts under it and the panel stops at 828 px. One band for the seven series, a carousel model per series, and the series video: see Series.

## Export

PNG, sRGB, 1080 × 1350, one file per card named `01.png`, `02.png` … in reading order. The same files serve Instagram, Facebook and TikTok photo carousels. Each export ships with its alternative text (see Content fit) in the package's `post.md`. Render with the same fonts from `fonts/` and the same `tokens.json`: with identical inputs the output is identical, which the reference images under `References` let anyone check.

## Using the engine

Load `tokens.css` (or call `EthniCards.installTokens(tokens, base)`), `components/bundle.css` and `components/bundle.js`, then:

```js
EthniCards.mount(container, cardSpec, {
  width: 1080,
  resolve: assetUrl,
  logo: "Logo/ethniafrica-logo.png",
}).then(({ card, report }) => {
  /* screenshot card; refuse to export when report.ok is false */
});
```

`width: 430` mounts the same card at phone reading size. `handoff/harness.html` is a ready rendering bench and `handoff/cards.sample.json` holds every example card shown here.

## Production adapter

The [carousel renderer](../renderer/README.md) adds checked PNG exports, a review page and report verification around these unchanged reference components. Its verification scope and the operator-approved reconciliation of two reference images are documented there.
