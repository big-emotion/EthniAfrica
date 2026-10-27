# EthniAfrica Cartes 1.15.0-proposition — external video in the series video

Proposed by Claude Design and accepted by the operator on 26 October 2026 (« j'accepte la proposition, elle peut être validée »). The designer's own reservations stay open: its project held no 1.14.0 file, so the fixed opening, introduction and closing sentences and the ident appear as slots, not as their text; the safe areas, credit-line positions, −20 dB duck level and 2 s shot minimum are its own values to check against the networks' current guidance; the renderer field is a proposal that the engine adapted (see « Renderer integration of 1.15.0 » in [handoff.md](../../handoff.md)); the Togo plan in §8 is a structure, not a script. The visual reference page (`Cartes Video System v1.15.0.dc.html`) stays in the Claude Design project and is not copied here.

The brief is in [claude-design-brief.md](claude-design-brief.md).

---

# EthniAfrica · Cartes — video system v1.15.0-proposition

**Extends:** v1.14.0-proposition (nothing in v1.14.0 is withdrawn)
**Adds:** external video as a first-class medium
**First use:** Togo episode, campaign `pays-20`
**Outputs:** TikTok 1080×1920 · Instagram Reels 1080×1920 · Facebook 1080×1350 · 30 fps
**Status:** proposition, 2026-10-26
**Visual reference:** `Cartes Video System v1.15.0.dc.html`

---

## 0. What is fixed and what this version changes

- The spoken **opening sentence**, **series introduction** and **closing sentence** stay word for word as in v1.14.0. This version changes only the picture under them.
- The series band (mark + `CARTES · <PAYS>`) stays top-left in every frame.
- Subtitles stay word-timed in the lower third, with the key word on an ochre pill (`#c9821f` fill, `#1a1208` ink, full radius).
- The accent is ocre (pays axis) and stays ocre for the whole film. No hue changes by position.
- Anton is for video figures and the ident only. Fraunces is for words and dates on cards. Nunito Sans is for subtitles and lines. JetBrains Mono is for rights lines and timecodes.

Units are pixels of the 1080-px-wide master. Times are seconds, snapped to the 30 fps grid (1 frame = 0.0333 s).

---

## 1. Clip = a full-screen picture phase

A **clip** is a picture phase whose picture is an external MP4.

| Field        | Rule                                                                                                  |
| ------------ | ----------------------------------------------------------------------------------------------------- |
| `in` / `out` | Source timecodes in seconds, snapped to whole frames. `out − in` = how long the clip is on screen.    |
| Phase length | ≥ 6.0 s (180 frames). A single clip shorter than 6 s cannot be a phase. Use a montage (§2) instead.   |
| Fill         | Full-bleed by default (`crop.mode: "fill"`). The picture covers the whole frame. Nothing letterboxed. |
| Audio        | `off` · `duck` · `on`. **Default `off`.**                                                             |

### Audio modes

| Mode            | Level                                                                                                           | Allowed when                                                                                                                                                                                                              |
| --------------- | --------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `off` (default) | Source muted. The narration plays alone.                                                                        | Always.                                                                                                                                                                                                                   |
| `duck`          | Source at −20 dB under the narration. It rises to −8 dB in narration gaps ≥ 1.5 s. Ramps are 200 ms (6 frames). | The source has ambient sound only (water, market, wind). If the source has speech, the speech must be transcribed and attributed (see `on`).                                                                              |
| `on`            | Source at full level. The narration pauses for the clip's span.                                                 | Only if `audio.transcript` **and** `audio.speaker` are filled in. The speaker line replaces the place line (§5), and the subtitles show the verbatim words in their own language, with the French gloss on a second line. |

The renderer refuses `duck` or `on` for a clip with `audio.speech: true` and no `transcript` and `speaker`. It falls back to `off` and logs a warning. Speech in a source is never played before it has been transcribed and attributed.

---

## 2. Montage = several clips under one narrated phase

A **montage** is one picture phase made of 2 or 3 clips that play under one narrated sentence.

**Cut rules**

1. The montage phase lasts ≥ 6.0 s. That is the minimum hold, and it applies to the phase, not to each shot.
2. Each shot is on screen for ≥ 2.0 s (60 frames). The last shot gets ≥ 2.5 s, so the sentence lands on a held picture.
3. A montage has at most 3 shots. If you need a 4th, it starts a new phase.
4. Cuts snap to a **word start** from the word timing, within ±2 frames. A cut never falls inside the key word on the pill.
5. Subtitles run across the cuts without a break. A cut never resets the subtitle line.
6. The place line changes at the cut if the place changes. If two shots share a place, the line stays put and does not animate again.
7. In `duck` mode, the audio cross-fades at each cut over 6 frames.

**Transitions**

| From → to                     | Transition                                                                        |
| ----------------------------- | --------------------------------------------------------------------------------- |
| shot → shot (in a montage)    | Hard cut.                                                                         |
| footage phase → footage phase | Hard cut.                                                                         |
| footage → designed card       | The card arrives over the last frame of the footage: 320 ms, `--afh-ease-spring`. |
| card → footage                | Hard cut.                                                                         |
| anything → signature card     | Hard cut.                                                                         |

Dissolves, wipes, whip-pans, zoom transitions, speed ramps and slow motion are all ruled out. Inside a shot, a slow push is allowed on a static source only: the crop scales to at most 1.08× over the length of the shot, centred on the focal point.

---

## 3. Footage with an overlay, and footage alone

**Footage alone** is the default. The frame shows the picture, the band, the subtitles, and the place and rights lines. Nothing else.

**Footage with an overlay** adds one designed element. The overlay is one of these:

| Type     | Treatment                                                                      | Rule                                                                                                                                                                                    |
| -------- | ------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `figure` | Anton numeral, 420 px, `#ffffff`. One Nunito Sans 800 label below it (44 px).  | The figure comes from the corpus, grouped French-style.                                                                                                                                 |
| `date`   | Fraunces 900, 200 px.                                                          | **Present-day dates only**: the filming date, or a recurring present-day event. A historical date (1884, 1960) is never set over footage. It goes on a designed date card instead (§9). |
| `word`   | Fraunces 900, 160 px, with `lang` set. Gloss below in Nunito Sans 700 (40 px). | The autonym comes first and the gloss goes under it.                                                                                                                                    |

Placement and timing:

- One overlay per phase.
- It sits in the upper-middle zone, y 360–1000 on 9:16 and y 200–760 on 4:5.
- It never covers the face at the focal point. When the focal point is a speaker's face, the overlay takes the opposite half of the frame.
- It arrives ≥ 0.5 s after the cut (spring, 320 ms) and holds ≥ 3.0 s.
- While it is on screen, the word it shows is **not** also on the subtitle pill. The overlay is the key word.

---

## 4. Per-network framing

| Network         | Master           | Safe area (top · right · bottom · left) |
| --------------- | ---------------- | --------------------------------------- |
| TikTok          | 1080×1920 (9:16) | 150 · 150 · 420 · 60                    |
| Instagram Reels | 1080×1920 (9:16) | 150 · 150 · 420 · 60                    |
| Facebook feed   | 1080×1350 (4:5)  | 60 · 60 · 80 · 60                       |

All text, the band, the overlays and the credit lines stay inside the safe area. The picture fills past it.

### Crop rule for a 16:9 source

The source is scaled to fill the frame height. A window the width of the frame is then cut from it. `fx` is the horizontal focal point, from 0 to 1 across the source.

| Target | Window width as a share of the source width | Window left edge              |
| ------ | ------------------------------------------- | ----------------------------- |
| 9:16   | 0.316                                       | `clamp(fx − 0.158, 0, 0.684)` |
| 4:5    | 0.450                                       | `clamp(fx − 0.225, 0, 0.550)` |

- `fy` is used only when a push or zoom (≤ 1.08×) is set.
- Each network can carry its own `fx`.
- Source resolution: 2160p is preferred for 9:16, and 1080p is accepted. A 1080p source cropped to 9:16 is upscaled 1.78×, which is fine for footage but not for a source with burned-in text.

### Landscape window

Use `crop.mode: "window"` when the crop loses the subject:

- the subject is wider than the window (0.316 or 0.450 of the source), or
- two subjects sit further apart than the window, or
- the camera pans the subject out of the window, or
- the source has text or a sign that has to be read.

| Target | Window                        |
| ------ | ----------------------------- |
| 9:16   | 984×554 (16:9) at x 48, y 520 |
| 4:5    | 984×554 at x 48, y 200        |

- The window has radius 14, a 1 px `--afh-border` hairline and `--afh-elev-warm`, on the parchment `--afh-bg-warm`.
- The band, subtitles and lines switch to ink (`--afh-text`) on parchment.
- The place and rights lines sit directly under the window, not at the bottom of the frame.

---

## 5. Credit and rights lines

The band is the only thing in the top-left. Every credit sits at the bottom-left, inside the safe area.

| Line        | 9:16   | 4:5    | Dress                                                                                                               |
| ----------- | ------ | ------ | ------------------------------------------------------------------------------------------------------------------- |
| Place line  | y 1392 | y 1180 | 34 px ocre dot, then Nunito Sans 700, 34 px, uppercase, tracked 0.12em, `#ffffff`. Example: `● TOGOVILLE, LAC TOGO` |
| Rights line | y 1440 | y 1226 | JetBrains Mono, 26 px, `#f1e7d8`. Example: `Images : [auteur] · CC BY-SA 4.0 · commons.wikimedia.org`               |

- Both lines sit on a flat bottom scrim: `linear-gradient(transparent 50%, rgb(18 14 10 / .6))`. No blur.
- A speaker (audio `on`, or a speaker on screen) takes a **speaker line** in place of the place line: `● [PRÉNOM NOM], LOCUTRICE ÉWÉ · TOGOVILLE`. It is only filled in with the speaker's recorded consent.
- The rights line stays on screen for the whole clip. In a montage it updates at each cut.
- On screen, the rights line gives the author, the licence name and the source domain. The video **description** carries the full credit block, which the renderer generates from the same fields: author, licence URI, file URL, place, filming date.
- Footage shot by BIG EMOTION reads `Images : BIG EMOTION`.
- **OpenStreetMap credit on a map:** it goes inside the map, bottom-right. It is a white label with radius 0 (radius 0 marks the source apparatus) and mono 22 px ink text: `© les contributeurs d'OpenStreetMap · ODbL`. It never goes in the band and never in the rights line.

---

## 6. Renderer field for an external MP4

The engine has no video field today. This adds `kind: "clip"` and `kind: "montage"` to the phase list.

```json
{
  "id": "p06",
  "kind": "montage",
  "narration": "n06",
  "minHold": 6.0,
  "clips": [
    {
      "src": "media/pays-20/lome-grand-marche-01.mp4",
      "in": 12.4,
      "out": 15.8,
      "audio": {
        "mode": "off",
        "speech": false,
        "duckDb": -20,
        "transcript": null,
        "speaker": null
      },
      "crop": {
        "mode": "fill",
        "fx": 0.62,
        "fy": 0.5,
        "push": 1.0,
        "perNetwork": {
          "facebook": { "fx": 0.55 }
        }
      },
      "place": "LOMÉ, GRAND MARCHÉ",
      "rights": {
        "author": "BIG EMOTION",
        "licence": "CC BY-SA 4.0",
        "licenceUri": "https://creativecommons.org/licenses/by-sa/4.0/",
        "sourceUrl": null,
        "shotOn": "2026-09"
      },
      "overlay": null
    }
  ]
}
```

A single clip is the same object with `kind: "clip"` and the clip fields at the top level. The `overlay` field takes one of these shapes:

- `{ "type": "figure", "value": "2", "label": "langues nationales" }`
- `{ "type": "date", "value": "2026", "present": true }`
- `{ "type": "word", "value": "Eʋegbe", "lang": "ee", "gloss": "la langue éwé" }`

**Validation the renderer runs** (it refuses to render on failure):

1. `src` exists, the codec is H.264 or H.265, and the source is at least 1920×1080.
2. `0 ≤ in < out ≤` the source duration. Both are snapped to the frame grid.
3. The phase lasts ≥ `minHold` (6.0 s). In a montage, each shot lasts ≥ 2.0 s and the last ≥ 2.5 s, with at most 3 clips.
4. If `audio.mode` is `duck` or `on` and `speech` is true, then `transcript` and `speaker` are filled in. Otherwise the mode falls back to `off`, with a warning.
5. `rights.author` and `rights.licence` are filled in.
6. `overlay.type: "date"` requires `present: true`.
7. `fx` and `fy` are between 0 and 1. If the subject check fails (see §4) and `mode` is `fill`, the renderer warns.

---

## 7. Footage-first opener

| Beat                       | Picture                                                                                                                                                                          | Sound                                                    | Hold  |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- | ----- |
| O1 · Ouverture             | Parchment ground. Band top-left. Ident (Anton `CARTES` + `N°20 · TOGO`) above a 16:9 **landscape window** clip (Lac Togo, present day). Place and rights lines under the window. | **Fixed opening sentence**, subtitled. Clip audio `off`. | ≥ 6 s |
| O2 · Introduction de série | The clip leaves. The ident moves to the centre (spring, 320 ms) and becomes the series card from v1.14.0. No footage, so the introduction is not tied to a place.                | **Fixed series introduction**, subtitled.                | ≥ 6 s |
| O3 · First footage         | Hard cut to a full-bleed clip.                                                                                                                                                   | Narration.                                               | ≥ 6 s |

On 4:5 the ident runs y 140–300 and the window y 340–894.

---

## 8. Togo, pays-20: phase plan (70 s)

| #   | Time      | Phase           | Picture                                                                  |
| --- | --------- | --------------- | ------------------------------------------------------------------------ |
| 1   | 0:00–0:06 | O1 Ouverture    | Window clip: Lac Togo, pirogues                                          |
| 2   | 0:06–0:12 | O2 Introduction | Series card                                                              |
| 3   | 0:12–0:20 | clip, alone     | Lomé, the coast                                                          |
| 4   | 0:20–0:28 | map card        | Togoville beside Lake Togo (**the episode's only map**, present-day OSM) |
| 5   | 0:28–0:36 | date card       | 1884: sourced archival document, no footage                              |
| 6   | 0:36–0:46 | montage ×3      | Lomé · Kpalimé · Kara (places only)                                      |
| 7   | 0:46–0:52 | clip + `word`   | A living Ewe speaker, Togoville: `Eʋegbe`                                |
| 8   | 0:52–0:58 | date card       | 1960: type only, no footage                                              |
| 9   | 0:58–1:04 | device mock-up  | The Togo fiche on ethniafrica.com                                        |
| 10  | 1:04–1:10 | signature card  | **Fixed closing sentence**                                               |

---

## 9. Editorial limits

- Present-day footage shows **a place** or **a living local speaker**. It never illustrates a dated historical event. When the narration names 1884 or 1960, the picture is a designed date card: Fraunces 900, plus a sourced archival document with author, date, licence and link, or type alone.
- No reenactment, and no present-day crowd standing in for a past one.
- One precise present-day location map at most: Togoville beside Lake Togo, using current OSM data. No historical border is drawn: no protectorate outline and no partition line.
- A speaker is named, located and identified by language only with their consent. Their words are transcribed before they are heard.

## Changelog

- **v1.15.0-proposition**
  - Adds `clip` and `montage` phases with in and out points, the three audio modes, cut rules and overlays.
  - Adds per-network framing, the landscape window, and the credit, rights and OSM lines.
