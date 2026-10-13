# Claude Design brief: EthniAfrica Cartes 1.3.0-proposition

For the operator to paste into a new Claude Design conversation, with the
accepted EthniAfrica Cartes 1.2.0-proposition design system attached (the
artifact named in `social/design-system/version.json`) and the preview images of
this proposal (`version.json` → `previews`). The prototype in this folder is the
starting point, not a constraint: where the design judges better, it says why.

---

## Assignment

Extend the accepted card system **EthniAfrica Cartes 1.2.0-proposition** into
**1.3.0-proposition** for EthniAfrica's social series. Add three things and
change nothing else: one series band, a carousel model for each of the seven
series, and one 9:16 video model. No 1.2 rule, token, font or component changes
unless this brief names it. The operator reviews the result; only the operator
accepts a version.

## Editorial frame (decided on 13 October 2026)

EthniAfrica publishes in seven series. Each has a fixed question, fixed beats
per episode, and a slot. Every episode is a video; an episode that takes apart
an attested received idea also gets a carousel, made from the same script, so
the video costs the cards plus the voice. The operator's decision on the look:
« the accepted card system, plus one band carrying the series name and the
episode number. No separate design per series. »

| #   | Series                          | Fixed question                                | Beats, in order                                                                                                                                                                                                     |
| --- | ------------------------------- | --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | D'où vient le nom de mon pays ? | Qui a choisi ce nom ?                         | the name and the question · what it may mean · who gave it, and when · the earlier name or the inhabitants' name · the other readings · the closing line                                                            |
| 2   | Le nom qu'on leur a donné       | Comment s'appellent-ils eux-mêmes ?           | the name everyone knows · who gave it · the name they give themselves · why the gap · many have adopted the given name today, that was not always so · the question to readers (« Et chez vous, comment dit-on ? ») |
| 3   | Mon nom, mon histoire           | D'où vient ton nom ?                          | the name · where it is carried · what it tells · its forms from country to country · « Et ton nom, d'où vient-il ? »                                                                                                |
| 4   | Les mots qu'on nous a collés    | D'où vient ce mot qu'on dit sur l'Afrique ?   | the word as it is heard · its language and first meaning · how it reached Africa and who used it · what it was used to say · the word people use for themselves                                                     |
| 5   | Un peuple, plusieurs pays       | Pourquoi le même peuple a-t-il deux noms ?    | the people on the map · its name on each side of the border · who drew the line, and when · what the line changed · « La ligne a été tracée par-dessus des gens qui étaient déjà là. »                              |
| 6   | L'Afrique n'est pas un tout     | Qui a fait de l'Afrique un seul bloc ?        | a season of six episodes; the sixth is a signed position, « nous pensons que… », never presented as a sourced fact                                                                                                  |
| 7   | Ce que les villes racontent     | Pourquoi cette ville s'appelle-t-elle ainsi ? | as series 1                                                                                                                                                                                                         |

« The other readings » means: the episode gives the reading it retains and says
plainly that others exist, each attributed, never ranked by origin. Every
caption ends with « Cherchez [nom] sur EthniAfrica, lien en profil. »

Public text is French, connected and plain (the DITP approach). Keep African
spellings, attribution, exact quotations and real uncertainty.

## 1. The series band

One component for all seven series: « D'où vient le nom de mon pays ? · n° 14 ».
Text changes from series to series, never colour, size or place.

The prototype (see `bandeau/` and every card preview) proposes:

- a full-width strip at the top of every card, 72 px high, on `ground`, with a
  2 px `rule` line under it;
- the text in Nunito Sans 800 at 28/34 px (the kicker's size), left on the 72 px
  margin: the series name in `ink`, the separator in `ink-faint`, « n° 14 » in
  `accent`;
- the maquette tape moved under the band (top 100 px).

Design it as a component of the engine: a `series: { name, episode }` field (or
an identifier the engine resolves) on the card spec, drawn by `EthniCards`
itself. Settle and document:

1. **The image window.** The operator's ruling of 9 October keeps at least
   450 px of image. The prototype keeps it by limiting a series card's panel to
   828 px; it does not move the image, which the 1.2.0 engine still frames from
   the top of the card. Make the engine start the image window under the band, and
   add the 828 px limit to the fit report and to Content fit, or propose a
   better trade-off with its reason.
2. **Maps.** The band sits over the top of a light map. The prototype refuses any
   map label, key, callout or inset within 12 px of the band. Add the band to
   `report.collisions` and to the atlas key placement rules (keys currently
   start at y 96).
3. **Alternative text.** The band's words open the composed alternative text.
4. **Capacity.** The longest series name with « n° 100 » must hold on one line;
   say what happens if a future series name does not (shorten the name, never
   the type).
5. **Both themes**, and every card type including the closing card and the
   1.2.0 atlas maps.

## 2. One carousel model per series

`models/*.cards.json` holds one model per series, 6 to 8 cards, built from the
existing card types only. Series 1, 2 and 3 use the first planned episodes as
demonstration data drawn from the corpus fiches (Burkina Faso, Touareg, Yao and
Kouassi); series 4 to 7 use labelled placeholders in brackets. Keep every
demonstration and placeholder tape. Do not research, rewrite or add a claim,
date or source: where a model card lacks content, it keeps its placeholder.

Return each model as sample cards in `handoff/cards.sample.json` (ids
`serie-<id>-NN`) with reference images, so the renderer can pin them. Show the
carousel of each series at 430 px and 320 px.

The models need images: none has one yet. Use the existing sample images only
where they truthfully fit, otherwise the plain ground, and mark the slot.

## 3. One 9:16 video model, common to all series

Build it on **EthniAfrica Vidéo carte 0.4.0-proposition** (accepted on
12 October 2026): its subtitle chunks, spoken-word highlight, reading rule,
voice timing and bands. It is not a satellite video: the same cards, animated on
the operator's voice, 35 to 45 seconds.

The prototype (`video/` and `video.model.json`) proposes:

- a 1080 × 1920 frame on the theme's `ground`, the 1080 × 1350 card with its
  band at y 285 to 1635, so a grid's 4:5 crop of the cover keeps the whole card;
- the 0.4.0 subtitles under the card, line boxes from y 1660 to 1796;
- a 300 ms cross-fade between cards and nothing that slides; a slow 100 to 104 %
  zoom on the photograph around its focal point; panel and band still;
- frame 0 as the cover: the opener with its band, no subtitle;
- the closing card held 2.5 s while the voice says « Cherchez [nom] sur
  EthniAfrica, lien en profil. ».

`zones-couvertes.png` shows the problem to solve: in the feed, the apps cover the
lower half of the panel and the subtitles (TikTok's buttons right of x 780 below
y 840, the caption below y 1248). The operator accepted this for the plein
écran layout of 0.4.0. Either confirm the centred card with that trade-off, or
draw a video-specific card layout that keeps the panel inside the safe zone;
show both on boards at feed size.

The 0.4.0 endings « never ask the viewer for anything »; the series frame asks
for a search in the last sentence. Draw the ending the frame asks for and say
how it differs from endings A and B.

## Deliverables

1. The updated design source and document, version **1.3.0-proposition**, with
   `version.json` marked proposed.
2. The band in `bundle.js`, `bundle.css` (and `tokens.json` only if a token is
   truly needed: say why), with its fit and collision rules in Content fit and
   Maps.
3. The seven series models as sample cards, with reference images at
   1080 × 1350 and reading previews at 430 and 320 px.
4. A « Vidéo de série » section and boards: cover, one card with a subtitle and
   the lit word, a card change, the ending, at full size and at feed size with
   the covered zones.
5. A handoff section « Renderer integration of 1.3.0 » listing the new fields,
   the new refusals, the new references and the existing references that change
   (there should be none: cards without `series` must render as in 1.2.0).
6. The open choices, each with the proposal's answer and its reason.

## Out of scope

Research and validation of any episode's text; publication; a design per series;
any change to the satellite video engine.
