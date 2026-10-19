# EthniAfrica Cartes 1.10.0: the new ending of videos and carousels

Brief for Claude Design, to paste into the Claude Design conversation of EthniAfrica Cartes
(https://claude.ai/artifact/FMuUA1zKTU9P8qwdrmmQML, 1.9.0-proposition accepted on 16 October
2026). Written 19 October 2026 from the operator's decision of the same day on the Burkina Faso
episode (series 1, episode 19). It builds on the accepted Cartes 1.9.0 (`social/design-system/`,
`version.json`, `series.md`). Please return a `1.10.0-proposition` with boards, as for 1.6.0 to
1.9.0.

## The decision

Every series video and every carousel now ends with this sentence, printed, and spoken in the
video:

> L'importance de connaître nos noms. Vous pouvez continuer la recherche sur EthniAfrica, lien en profil.

On the video ending and on every carousel closing card it **replaces both**:

- the signature line « Connaître nos noms, décoloniser leur emploi, nous nommer nous-mêmes. »
  (1.6.0, « The signature line »), printed on three lines and said by the voice;
- the invitation, named « Cherchez [nom] sur EthniAfrica, lien en profil. » or general « Vous
  aussi, cherchez votre nom sur EthniAfrica, lien en profil. » (1.7.0, « Two invitations »).

The signed « nous pensons » card still comes just before the ending (1.8.0, signed position).

Captions and account bios change too, but they are not design questions: they are recorded in
`docs/editorial/strategy/social-series.md`.

## What changes on the carousel closing card

The 1.6.0 rule (`series.md`, « Carousel: the closing card »): the top of the signature line at
y 760 on every closing card, in a series or not; below it the invitation (two lines at most), the
pill, the credit and the signature row (y 1262 to 1306); the alternative text ends with the line,
word for word. In 1.10.0:

- the new line takes the signature line's place;
- the new invitation replaces « Cherchez [nom] sur EthniAfrica, lien en profil. »;
- the alternative text ends with the new sentence, word for word;
- the ten closing cards of the sample change; the 79 other sample cards stay pixel for pixel
  identical, alternative texts included.

## Out of scope

- The band, the head, the subtitles and the lit word, the double outline (1.9.0), map cards,
  chapters, document and teaching cards, the cover and the card change.

## What changes on the video ending

The 1.6.0 block (`series.md`, « Series video: the ending »): the closing card's own image full
frame, band at y 250, from y 318 the signature line (318 to 510), the invitation (538 to 642),
the pill (672 to 746), the block inside 318 to 820; credit and centred signature row from y 1788
to 1884; the voice says the line then the invitation, and the subtitle band stays empty.

## Questions for the designer

1. **The new line.** « L'importance de connaître nos noms. » is one short sentence. Does it keep
   the signature line's face, Fraunces 600 56/64 in `on-image-ink` with the 8 px outline, so that
   the project's voice stays recognisable? On one line or two? Where does it sit in 318 to 820?
2. **The invitation.** « Vous pouvez continuer la recherche sur EthniAfrica, lien en profil. »
   names no subject. Same type as today's invitation, Nunito Sans 700 32/40, on how many lines?
3. **The pill.** It no longer repeats a searched name. What does it show: the site address,
   « ethniafrica.com », or nothing, so the ending carries one accent less?
4. **The next episode.** « Prochain épisode : Togo », printed under the pill since 1.7.0. Does
   it still fit under the pill, or does it need its own card?
5. **The voice and the subtitles.** The voice says the line as one chunk, then the invitation in
   two chunks: « Vous pouvez continuer la recherche sur EthniAfrica, » and « lien en profil. ».
   Does the subtitle band stay empty for the whole ending, as in 1.6.0?
6. **What remains of the old signature line.** Nothing, on videos or carousels, unless you
   recommend keeping it elsewhere, for example small in the foot. The operator decided it is
   replaced.
7. **The carousel closing card.** Does the shorter line free space, and where does it go: a
   larger image window, or the same layout so the line never moves? Does the pill keep a searched
   name on the carousel, where it is not spoken?

## Boards wanted

At 1080 × 1920 and mounted at 430 px:

- the Burkina Faso ending, Nuit, with « Prochain épisode : Togo »;
- the same ending on a light photograph, to check the 1.9.0 double outline on the new line;
- the last signed card followed by the ending, to see the order;
- an ending without a next episode;
- the carousel closing cards of series 1 (with its recap), series 6 (a line) and a card outside
  a series, in Nuit and Parchemin, mounted at 430 px.

## After acceptance

The engine and renderer change is made test first in a PR into `recette`, with the boards
deposited in `social/design-system/proposals/1.10.0-proposition/`: `version.json`
(`signatureLine` and the invitation), the cards bundle's closing card, `social/video/series.mjs`
(the closing card's expected chunks, the `ending` input without `search`), the series and
renderer tests, and the fidelity check on the 89 sample cards.

## Addendum to the brief (19 October 2026): busy pictures and small lines

Received the same day, as relayed by the coordinator:

> The operator reviewed frames of the Burkina Faso video on 1.9.0 and asked about legibility. Please add these three questions to 1.10.0.
>
> 8. Busy pictures. The 1.9.0 double outline solves light pictures, not busy ones. On the Tiébélé royal court (black and white triangles), the subtitle « un nom venu de marins portugais. » and, on the ending, the invitation and « Prochain épisode : Togo » compete with the pattern: the eye struggles to separate the letters from it. Should the video get a rule for busy, high-contrast pictures, for example a soft dark gradient behind the text zones (subtitles, ending block, foot), applied only when a picture needs it? Or is it a framing rule only (a calm zone under the text, checked at proof), with no new visual element?
>
> 9. Small accent lines. The kicker (« Le nom d'un pays », « Ce que le nom veut dire ») in on-image-accent reads on dark pictures but fades on mid tones (sun-dried earth, grey sky). At 430 px it is about 11 px on screen. Should it gain size, weight, or a solid colour on mid tones?
>
> 10. The photo credit. It is the weakest line: light grey, about 9 px on screen at 430 px, on pebbles, a light wall or a littered ground. Should it gain size or contrast, or sit on a quiet band of its own? It must stay readable: the licences (CC BY-SA) require the credit.
>
> Boards for 8 to 10: the Burkina Faso opener (Tiébélé, subtitle over the pattern), the explanation card on the Bobo-Dioulasso mosque (kicker on grey sky, credit on the ground) and the ending on Tiébélé, each before and after, mounted at 430 px.
