# Scene-renderer feature catalogue

Companion to the [production guide](SCENE-PRODUCTION.md) and [exact field contract](SCENES.md).
All examples below are composition fragments, not complete ready-to-render plans or historical evidence.
The private workshop gallery contains the actual reviewed Mandén videos; those media do not travel
with a Git push. A [gallery template](templates/scene-gallery.md) records their paths and selected frames.

## What can be composed

| Feature                        | Working controls                                                                          | Use and limitation                                                                                                        | Visual example to inspect                           |
| ------------------------------ | ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| National orientation           | `borders`, solid/dashed `border_style`; `highlights` only on `national` layer             | Current borders orient; they are not medieval boundaries                                                                  | Geographic 10s proof, opening map                   |
| Political or population region | Closed `territory.points`, `colour`, `fill_opacity`, `label_colour`, independent evidence | Strong clear fill; estimates/hypotheses get dashed outlines. Overlap does not mean exclusive settlement                   | Composed chronology, Kirina/Mandén                  |
| Geographic point               | `[longitude, latitude]`, label, pixel `offset`, local `at`/`until`                        | City or expressly approximate regional anchor; off-screen labels are omitted, not clamped                                 | Cairo and Mecca in geographic proof                 |
| Flags                          | Three explicit vertical `flag_stripes`, national layer                                    | Only vertical tricolours; date and source the flag. No arbitrary national-flag library                                    | Original map POC; not every flag is supported       |
| Animated route                 | Ordered points, `meaning`, `draw_seconds`, line style/width, cue and expiry               | Distinguish an individual's trip from migration/language/name circulation. Schematics are labelled; speed is illustrative | Mansa Musa journey                                  |
| Nearby context                 | `role: context` on point/territory, optional `fade_seconds`                               | Draws below the subject in secondary ink; own period/source required                                                      | Geo proof: Gao context                              |
| Geographic note                | `annotation` on a point and `offset`                                                      | Short secondary note with leader line, no large card. Check its safe viewport and collisions                              | Option 2, Gao                                       |
| Camera                         | Time keys with west/south/east/north bounds                                               | Wide Africa → focus → wider context; fixed Mercator, no globe/projection morph                                            | Option 4, geographic pullback                       |
| Focused timeline               | 2–3 increasing years/cues, `layout: focus`, optional `overview_at`                        | One main date at a time, then summary. Ordinal spacing is visibly disclosed                                               | Corner-note chronology                              |
| Context note                   | `context_layout: corner`, one regional/world item per date                                | One note at a time in upper-right; silent, independently dated; never implies causation                                   | Corner-note chronology, 1324                        |
| Timeline + map                 | `timeline.background` accepts map features/highlights                                     | Compact rail above a dedicated map viewport. Context uses corner layout. Geography retains sources and legends            | Composed chronology                                 |
| Timeline overview              | Default `layout: overview`, at most 2 same-year context items                             | Existing card presentation remains available; not the preferred low-density option                                        | Legacy overview example                             |
| Photograph                     | `image.asset`, `fit: cover`, motion from/to `[zoom, focusX, focusY]`                      | Pan/zoom over a licensed relevant image, zoom 1–1.25, enlargement ≤2×. Not video generation                               | Mixed-scene proof                                   |
| Source document                | `document.asset`, label/body                                                              | Whole uncropped archive image beside text; identify the actual document, not an imagined cover                            | Document proof; visual style not operator-preferred |
| Comparison                     | Up to 3 label/body items with cues                                                        | Compare spellings/meanings or bounded cases, not a hierarchy of peoples                                                   | Name-origin comparison                              |
| Text pause                     | Wrapped text                                                                              | Brief deliberate statement; avoid long empty screens                                                                      | Editorial closing or transition                     |
| Scene transition               | cut, dissolve or fade, ≤0.8s and <half the incoming scene                                 | Transition occurs inside incoming time; captions do not crossfade                                                         | Mixed-scene proof                                   |
| Captions                       | Derived from approved narration and word alignment                                        | Fixed charter roles; overflow fails. Scene timings do not rewrite speech                                                  | All narrated proofs                                 |
| Progress                       | Root `progress: true`                                                                     | Continuous elapsed-video line in the safe area, independent of chapter count                                              | Original POC and latest proofs                      |
| Reduced motion                 | Existing `--controle` montage flag                                                        | Freezes camera/interpolation, retains reveal cues. Separate output, not the default handoff baseline                      | Control render when needed                          |
| Evidence and credits           | Sources, period, status, asset licence, optional geometry note                            | Mandatory qualifiers remain in legends. Crowding fails instead of hiding uncertainty                                      | Below each map/timeline                             |

## Small configuration fragments

### A clear region plus current borders

```json
{
  "layer": "political",
  "borders": true,
  "border_style": "dashed",
  "features": [
    {
      "kind": "territory",
      "label": "SOURCE-VERIFIED REGION",
      "points": [
        [-10, 10],
        [-8, 10],
        [-8, 12],
        [-10, 10]
      ],
      "colour": "gold",
      "fill_opacity": 0.8,
      "label_colour": "white",
      "at": 0,
      "until": 6,
      "evidence": {
        "sources": ["reference"],
        "period": "ILLUSTRATIVE ONLY",
        "status": "estimate"
      }
    }
  ]
}
```

Those coordinates are an artificial contract example, not a historical territory. Replace them
with reviewed geometry. To show changing extents, schedule different dated features; the engine
never interpolates an invented boundary between two historical snapshots.

### An independently timed journey

```json
{
  "kind": "route",
  "label": "Journey",
  "points": [
    [-8, 12],
    [10, 25],
    [31, 30]
  ],
  "meaning": "journey",
  "at": 2,
  "until": 8,
  "draw_seconds": 4,
  "line_style": "dashed",
  "line_width": 7,
  "geometry_note": "Schematic connection, not a reconstructed itinerary",
  "evidence": {
    "sources": ["reference"],
    "period": "SOURCE PERIOD",
    "status": "illustration"
  }
}
```

Reveal start and duration come from speech cues, not a mandatory three/four-second slideshow.
Place city points as separate features. Give them offsets that remain readable during the camera move.

### Timeline composition

```text
timeline.layout = "focus"
timeline.context_layout = "corner"
timeline.events = ordered dated events with local voice cues
timeline.background = the same authored map configuration used in a map scene
timeline.overview_at = the start of the approved spoken recap
```

The selected date and speaker remain dominant; the contextual note is optional. Use different
regional neighbours when the evidence and audience warrant them. A familiar world event may
help orientation, but its period remains independent and it is not added to the voice. Do not
force a European parallel or a conflict merely to fill a slot.

## Editorial defaults for future videos

- Prefer city points and clearly coloured regions; halos remain legacy options, not the default.
- Start with a wider view when orientation matters; spend the narration on a readable focus; pull back when the meaning widens.
- Use dashed current borders for orientation alongside sourced historical/population geometry.
- Prefer the corner note on a timeline, geographically anchored notes on a map, and a separate wide shot for optional wider context.
- Use the timeline as a possible summary before closing, not an obligatory scene in every episode.
- Choose an image because it illustrates the spoken claim. A generic Bamako photo is not automatically relevant to medieval history.
- Test at phone size first. Tablet/desktop display does not repair unreadable mobile labels. The output remains a fixed portrait video, not a responsive website.

## Limits that need a separate extension

Interactive globe/projection morph, arbitrary image-to-video animation, clip scenes, music/SFX
mixing, automatic image search/licensing, general flag assets, automatic migration inference,
geometry morphing, automatic historical fact checking and a clean publication master are not
implemented by the current scene renderer. Brand fonts and the core layout are governed by the
charter, not free per-video style parameters. See [production readiness](SCENE-PRODUCTION.md#readiness-audit-and-remaining-work).

## Reviewed final output

The [release workflow](SCENE-RELEASE.md) adds a clean MP4, SRT subtitles, credits,
a phone preview and a hashed delivery manifest. The proof badge alone is removed;
all source credits, uncertainty, captions, geography and timing remain. The
version-bound review must be complete; the engine never generates passing reviews.
