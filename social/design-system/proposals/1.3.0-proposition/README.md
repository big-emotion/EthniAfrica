# EthniAfrica Cartes 1.3.0-proposition: the series band, seven carousel models, one series video

**Status: proposed on 13 October 2026, not accepted.** The accepted system stays
1.2.0-proposition (`../../version.json`). Only the operator accepts a version,
and the documented path for a visual change is a Claude Design conversation
(`../../handoff.md`: any change to a token, a font or `bundle.css` is a new
version). This folder therefore holds two things: the brief for that
conversation (`claude-design-brief.md`), and a working prototype built on the
unchanged 1.2.0 engine, so the operator can judge the proposal on rendered
images before running it.

The frame being served is `docs/editorial/strategy/social-series.md`: seven
series, a fixed question and fixed beats per series, a video every episode, a
carousel only when the episode takes apart an attested received idea, and
« the accepted card system in `social/design-system/`, plus one band carrying
the series name and the episode number. No separate design per series. »

## 1. The series band

One component, identical for the seven series. Only its words change.

| Property | Value                                                                     | Why                                                                                                                |
| -------- | ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Place    | full width, top of every card, 0 to 72 px                                 | the panel's reading order (kicker, title, blocks) stays exactly as accepted; the band is read first, as a masthead |
| Height   | 72 px (`space-6`), a 2 px `rule` line under it                            | the same measure as the side margins                                                                               |
| Ground   | `ground`, opaque                                                          | holds over any photograph and over the light maps, in Nuit and Parchemin, without a new token                      |
| Text     | Nunito Sans 800, 28/34 px, tracking 0.02 em: the `kicker` size            | 11.1 px read at 430 px, 8.3 px at 320 px, like the kicker; no new size                                             |
| Colours  | series name `ink`, separator `ink-faint`, « n° 14 » `accent`              | one accent spot per band, the same for every series                                                                |
| Wording  | « D'où vient le nom de mon pays ? · n° 14 », sentence case, no guillemets | names are never forced into capitals (README, Content fundamentals)                                                |

Checked by `series.test.mjs` on the pinned Chromium: every series name with
« n° 100 » holds on one line. The longest, « D'où vient le nom de mon pays ? ·
n° 1 », ends at 597 px of the 1008 px available, so the band has room to spare
at any episode number. The band is drawn on all 49 model cards and in the video.

**The band costs 72 px of image.** The operator ruled on 9 October 2026 that
the image window keeps at least 450 px. Under the band that leaves 828 px for
the panel instead of 900 (`PANEL_MAX_WITH_BAND` in `series.mjs`). Every model
card fits 828; one did not at first (`nom-famille-04`, 842 px) and was
shortened, never shrunk. A card near the old limit (`seq-4`, 870 px) would need
the same edit. The alternative is to keep 900 and let the band cover the top of
the window: decision 2 below.

The prototype also refuses a map label, key, callout or inset within 12 px of
the band, so a map is never silently hidden under it.

## 2. One carousel model per series

Each model is a `cards.json` envelope the accepted renderer validates in proof
mode (`validateInput(…, "proof", "1.2.0-proposition")`); each card adds
`series: { id, episode }` for the band. Every card carries the yellow tape and a
`provenance` line naming the beat it serves and the fiche field its text comes
from. No card has an image yet: each `provenance` says what picture to look for.

| File                                | Series                          | Cards | Content                                                                                       |
| ----------------------------------- | ------------------------------- | ----- | --------------------------------------------------------------------------------------------- |
| `models/01-pays.cards.json`         | D'où vient le nom de mon pays ? | 7     | Burkina Faso, from `dataset/source/afrik/pays/BFA.json` (demonstration)                       |
| `models/02-nom-recu.cards.json`     | Le nom qu'on leur a donné       | 8     | Touareg, from `peuples/FLG_BERBERE/PPL_TUAREG.json` (demonstration), one placeholder sentence |
| `models/03-nom-famille.cards.json`  | Mon nom, mon histoire           | 7     | Yao and Kouassi, from `patronymes/PAT_YAO.json` and `PAT_KOUASSI.json` (demonstration)        |
| `models/04-mots.cards.json`         | Les mots qu'on nous a collés    | 7     | placeholders in brackets                                                                      |
| `models/05-frontieres.cards.json`   | Un peuple, plusieurs pays       | 7     | placeholders; the map reuses the fictional areas of the 1.2.0 `map-c` sample                  |
| `models/06-afrique-tout.cards.json` | L'Afrique n'est pas un tout     | 7     | episode 1 (« Qui a nommé l'Afrique ? »), placeholders                                         |
| `models/07-villes.cards.json`       | Ce que les villes racontent     | 6     | placeholders, beats of series 1                                                               |

Card by card, the beats map onto the existing card types only:

- **Opener** carries the series' fixed question (« Qui a choisi le nom Burkina
  Faso ? »). When the question and the name exceed three lines at 116 px, the
  name moves to the kicker (« Le nom Touareg »), as on `nom-recu-01`.
- **Who gave it, and when** and **the earlier name** are dated cards; an
  official adoption takes the `adoption` mark, the first known trace `premiere`.
- **What it may mean** and **its forms from country to country** are forms
  tables; **the name they give themselves** is the `pair` of doctrine §1.1.
- **The other readings** is an explanation card that names each reading's
  author and ranks none. When a fiche holds no competing reading (Burkina Faso),
  the card says the sources agree rather than invent one.
- **The question to readers** (series 2 and 3) is its own explanation card, so
  the closing card stays the closing card.
- **Closing** keeps the accepted slogan and pill; its sentence is the one every
  caption ends with: « Cherchez [nom] sur EthniAfrica, lien en profil. » A
  series 1 closing may keep the 1.1 recap timeline.

Series 3 shows the band over a map card (`nom-famille-02`, Côte d'Ivoire from the
fiches' `countries` field). Series 2, 5 and 7 are set in Parchemin to show the
band in the light theme.

## 3. One video model for every series

`video.model.json` times the series 1 model on a demonstration script: 7 cards,
19 subtitle chunks, 42.5 s with the final 2.5 s hold.

- **Frame.** 1080 × 1920, the theme's `ground`. The card, band included, is the
  same 1080 × 1350 card as in the carousel, placed at y 285 to 1635: the 4:5
  centre of the frame, so the cover still reads when a grid crops it to 4:5.
- **Subtitles.** Vidéo carte 0.4.0 unchanged: chunks of 3 to 6 words, two lines
  of 26 characters at most, Nunito Sans 800 56/68 in #fffaf2 with the dark
  stroke, the spoken word lit in `accent`. They sit under the card, line boxes
  from y 1660 to 1796, x 90 to 990.
- **Motion.** One cross-fade of 300 ms between cards, nothing slides. The card's
  photograph zooms slowly from 100 to 104 % around its focal point; panel and
  band never move. A chunk replaces the previous one on the same frame, as in
  0.4.0.
- **Cover.** Frame 0 is the opener, band included, with no subtitle, so the
  platform's automatic thumbnail is already the cover.
- **Ending.** The closing card holds 2.5 s while the voice says « Cherchez
  [nom] sur EthniAfrica, lien en profil. », shown as the last two chunks.
- **What the apps cover.** `zones-couvertes.png` draws the zone the 12-second
  Vidéo carte keeps clear. On a phone feed the panel's lower half and the
  subtitles fall under the caption and the TikTok buttons, as they do for the
  accepted plein écran layout: decision 4 below.

## Decisions for the operator

1. **Band position**: the top of the card (proposed), or a line inside the panel
   head above the kicker.
2. **Image window**: keep 450 px and limit a series card's panel to 828 px
   (proposed), or keep 900 px and let the band cover the top of the image.
3. **The episode number in `accent`** (proposed), or the whole band in `ink`.
4. **Video layout**: the 4:5 card centred in the 9:16 frame (proposed), knowing
   the apps cover its lower half in the feed; or a video-specific layout where
   the panel is shorter and higher, which Claude Design would draw.
5. **Asking in the video ending.** Vidéo carte endings « never ask the viewer for
   anything »; the 13 October frame asks for a search. The proposal follows the
   frame for the series video only.
6. **Images.** No model card has one. The rule of 30 September (an image on every
   card) applies; the research chooses them per episode.

Content left to the research before any of these episodes is produced: the date
of the 1984 ordinance rests on a press article (`pays-03`); who uses the name
Touareg today has no source in the fiche (`nom-recu-06`, placeholder in
brackets); the Ghana is not yet in the `countries` field of `PAT_YAO` and
`PAT_KOUASSI` (`nom-famille-02`).

## Previews

```sh
npm run test:social-series-proposal
node social/design-system/proposals/1.3.0-proposition/preview.mjs OUT_DIR
```

Both need the pinned Chromium of `social/renderer/runtime.json`. The lockfile now
installs Playwright 1.64, whose own browser build differs from that pin; set
`ETHNIAFRICA_CHROMIUM` to the pinned headless shell when the installed
Playwright ships another browser. The previews of 13 October 2026 are in the
production evidence folder named in `version.json`: per series `01.png` …
(1080 × 1350, band included) and `lecture-430.png`, `lecture-320.png`;
`bandeau/` (the seven bands at « n° 100 »); `video/` (cover, one frame per card,
every subtitle chunk, `zones-couvertes.png` and a silent 42.5 s animatic).
`rapports.json` holds every fit report. Previews are not exports: production
still goes through `social/renderer` once a version is accepted.

## What is prototype and what Claude Design builds

`series-band.css` and `series-band.js` add the band to a card the 1.2.0 engine
has already laid out. That is enough to judge the look and the fit; it is not
the component. The engine itself must learn the band (a `series` field on the
card spec, the image window starting under the band, the panel limit, the map
collision check, the alternative text reading the band) and the video frame
must become a board of the design. The brief asks for exactly that.
