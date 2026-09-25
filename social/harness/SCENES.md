# Scene video engine v1

An opt-in extension of `ethni_montage.py`, for narrated videos assembled from
maps, moving photographs, text and comparisons. Carousels and the default video
path keep their existing behaviour. The original `--map-proof` POC also remains
available. This engine uses Pillow, the existing typography/caption modules and
FFmpeg; no Hugging Face, MCP, paid API or browser is required during rendering.

## Audit: what already exists

Inspected on 24 September 2026, starting from the map POC commit `41a0eadd4`.

| Surface                                                          | Finding                                                                                                                        | Consequence                                                                                                |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------- |
| `social/harness/`                                                | Versioned engine, fonts, tokens, captions, voice alignment, outro and tests                                                    | Extend the existing montage entry point instead of creating another production system                      |
| Private workshop `Projects/`                                     | Scripts, decks, audio, alignment, sources and assets                                                                           | Keep productions private; transfer a complete asset bundle for another machine                             |
| Private workshop `Packages/`                                     | Six archived ZIP packages contain older per-topic renderers; functions overlap in typography, photo movement, maps and credits | These are recovery references, not a second current engine; inspected without executing or extracting them |
| Private workshop `tools/`                                        | Local filing and older link helpers remain                                                                                     | No broad migration or deletion is necessary for scene rendering                                            |
| `ethni_montage.rendre_images` / social charter §9 bis            | Existing montage repeatedly cycles images in slots of at most four seconds                                                     | Keep that legacy behaviour, but make new scenes follow authored, audio-bound timing                        |
| Existing narration templates                                     | Name comparison and a newer patronymic/institution case are supported                                                          | Do not impose a name-origin structure on thematic dossiers                                                 |
| Four reviewed community briefs                                   | Names/mutual aid, cooperation, languages and national belonging are researched but not approved production scripts             | Add a thematic preparation route; do not register, schedule or write their final scripts in this change    |
| `src/lib/atlas/globeGeometry.ts` / `overlays.ts`                 | Countries, geographic rings and people-field points are different data structures                                              | Preserve the distinction between political territory and population presence                               |
| `globeTexture.ts`, `AtlasGlobeCanvas.tsx`, `MercatorSurface.tsx` | Browser/WebGL renderer, with globe/plane transformation and interactive state                                                  | A frame-controlled globe exporter is a separate extension; do not screen-record the live UI                |
| `src/lib/atlas/assets/README.md`                                 | Existing site assets document Natural Earth provenance and generation                                                          | Reuse that source policy; geographic reuse does not imply reuse of the interactive renderer                |

The supplied screenshots support a pacing complaint, not a measured universal
retention rule. They also show national outlines alongside people-field markers:
the interface phrase “no borders” must not substitute for checking actual pixels.
The two live URLs were unavailable to the web text tool; inspection relied on
the supplied screenshots and checked-in code, not a claimed live interaction test.

## Delivery phases and tests

1. **Contract first:** failing tests for gaps, overlap, unknown fields, missing
   licenses, modified assets, camera bounds and unsourced geographic overlays;
   then implement `ethni_scene_plan.py`.
2. **Composition first:** failing tests for frame-order independence, border
   visibility, text overflow and enlargement; then implement
   `ethni_scene_render.py` using existing tokens and fonts.
3. **Audio and export first:** failing tests for approval, hashes, cuts through
   words and audio bounds; then implement `ethni_scene_audio.py` and
   `ethni_scenes.py`, including a real one-second H.264/AAC integration test.
4. **Handoff:** export a mixed-scene demonstration from existing approved audio,
   inspect 360px previews, record provenance and document a second-session run.

These are implementation notes, not a replacement for the project's canonical
requirements and architecture records.

## Running a plan

From the repository root, using the harness virtualenv:

```sh
python social/harness/ethni_montage.py <subject> --scene-plan <scene-plan.json> --validate-only
python social/harness/ethni_montage.py <subject> --scene-plan <scene-plan.json> --previews-only
python social/harness/ethni_montage.py <subject> --scene-plan <scene-plan.json>
python social/harness/ethni_montage.py <subject> --scene-plan <scene-plan.json> --controle
```

The subject resolves through `ETHNIAFRICA_SOCIAL_PROJECTS`, as before. The
storyboard and all referenced assets form a portable folder. Asset paths are
relative to that folder and cannot escape it, including through symlinks.
`output_dir` is the destination in the subject's private library `_epreuves`
folder. Resolve the library's registered location before setting it; do not
move a post or change its status to aim a render.

All v1 scene exports are visibly **proofs**. An approved narration does not
approve newly drawn historical polygons, a new scene sequence or an image's
interpretation. Rendering does not set any publication status. A complete final
workflow still needs editorial review, compatible output licensing, listening,
visual approval and the existing publication controls. The approved outro is
available in the legacy engine but is not automatically appended to v1 excerpts.

## Input contract

The executable contract is `ethni_scene_plan.validate_plan`, rather than an
independently maintained schema with different rules. Unknown fields fail.

| Root field   | Meaning                                                                             |
| ------------ | ----------------------------------------------------------------------------------- |
| `version`    | Integer `1`                                                                         |
| `profile`    | `name-origin`, `history-geography`, `thematic-analysis` or `free`                   |
| `coverage`   | `excerpt` or `complete`; complete plans require the profile's editorial beats       |
| `title`      | Internal production title                                                           |
| `source`     | Script/audio SHA-256 hashes, ordered audio `cuts`, selected paragraph indexes       |
| `sources`    | ID → full `citation`, `url`, `tier`, optional short on-screen `label`               |
| `assets`     | ID → relative `path`, `kind`, SHA-256, `credit`, `license`, source ID               |
| `scenes`     | Ordered, continuous scene descriptions spanning the selected audio                  |
| `progress`   | Optional boolean; draws continuous elapsed-video progress inside the 9:16 safe area |
| `output_dir` | Private proof destination                                                           |

`source` uses `source_script_sha256`, `source_audio_sha256`, `cuts` as
`[[startSeconds,endSeconds], ...]`, and zero-based `paragraphs`. Hash the actual
files, never copy a digest from prose. The source directory must contain
`narration.fr.txt`, `post.md`, `work/narration.wav` and `work/aligned-words.json`.
Existing `cards.json` and `cartes.json`, if present, are included in the stale
approval check. A thematic video need not fabricate a carousel deck.

Cuts preserve whole approved paragraphs and never split a word or exceed the
recording. Scene times refer to the resulting excerpt, not the original audio.
Bind them to measured words/paragraphs and record the intention in `purpose`.
An external narration provider may supply character timestamps; retain the
original response, map exact approved-text tokens to its original-text alignment,
and preserve the audio without post-generation retiming. The renderer itself
does not call a speech service: any voice API cost belongs in the production
record, separately from `render-report.json`'s rendering-only API count.
For a continuous map across scenes, match the outgoing camera bounds to the
incoming first bounds and use a cut; a dissolve holds the old visual while
blending and therefore has different movement semantics.
No rule divides a scene into four-second image slots. A one-second mechanical
floor is only a guard; it is not a recommended reading duration.

Each scene has `id`, `type`, `start`, `end`, `title`, `purpose`, `evidence`,
optional editorial `beat`, its type-specific content, and optional `transition`.
Evidence always has `sources` (IDs), `period` (visible) and `status`:
`documented`, `estimate`, `hypothesis`, `illustration` or `editorial`.
Those are author assertions to review, not findings automatically verified by
the renderer. Full citations remain in `REVIEW.md`; short labels fit the frame.

| Scene type   | Content                                                                                                             |
| ------------ | ------------------------------------------------------------------------------------------------------------------- |
| `map`        | `asset`, `layer`, explicit `borders`, optional `highlights`, `graticule`, camera keyframes and authored features    |
| `image`      | `asset`, `fit` (`contain` or `cover`), optional `motion` with `from`/`to` values `[zoom,focusX,focusY]`             |
| `text`       | One wrapped string in `text`; useful for an argument or quotation, with evidence and attribution                    |
| `comparison` | Two or three `{label,body,at?}` items, vertically stacked for mobile; `at` is local seconds                         |
| `timeline`   | `{scale: "ordinal", events, context?}`; two or three chronological events and up to two same-year contextual events |
| `document`   | `{asset,label,body}`; a complete archival image beside concise copy, with source and asset credits                  |

Use `timeline` for multiple historical dates. Each primary event contains
`year` (a nonzero integer), `label`, `at` (local seconds) and its own `evidence`.
Events must be strictly chronological. Context events additionally require
`detail` and share a primary event's exact year; they appear on a separate
labelled lane, not as an implied cause. Combine multiple events in one year
into one concise label, or use another scene. The visible spacing notice is
mandatory: equal layout spacing does **not** represent equal elapsed time.
All event sources enter the credit register even if the parent scene lists
different sources. Long labels fail preflight rather than shrinking to fit.
`templates/timeline.json` is a placeholder starter, not a historical example.

### Focused chronology

Set `timeline.layout` to `"focus"` to travel along the axis with one active
event at a time. The default `"overview"` layout above is unchanged. Primary
event years and their speech cues must both increase strictly. An optional
`overview_at` cue, after the final event, pulls back to all dated names while
hiding the contextual cards. Without that cue, focus lasts to the scene's end.

Each focused context item contains `event_year`, `lane`, `label`, `detail`,
`at` and `evidence`. `lane` is `"regional"` or `"world"`, with at most one of
each per primary event. `event_year` anchors the card to the main event;
**it is not the context event's date**. Its own visible `evidence.period`
can be a date, reign, century or explicitly uncertain interval. This allows
contemporary context without claiming every event happened in the same year.
The context cue must fall within its primary event's focused window. Cards
disappear when the next main event or final overview starts. Their text is
silent: the audio still comes exclusively from the approved narration file.

An optional `background` accepts the map contract below, restricted to a
`physical` basemap without features or country highlights. Camera keys can
follow the narration; current borders can be dashed. This background locates
the chronology and does not establish historic boundaries. Its asset license
and source join the credits. Use a separate map scene for historical polygons
or travel routes that need their own geographic evidence.

The focus layout keeps two or three main events, a non-proportional spacing
notice, fixed mobile type sizes and optional video progress. Reduced-motion
mode preserves the same cues but removes the rail, card and camera movement.
Preflight samples reveal cues, transitions, the final overview and camera
keys; long copy fails instead of shrinking. Review additional 360px frames
for each date: the automatic scene midpoint alone cannot show every state
of a single continuous chronology.

The `document` layout keeps the complete source image (no crop), checks the
same enlargement ceiling, and pairs it with a short label and explanation.
A portrait illustrates its subject; it is not evidence that a depicted meeting
or scene occurred. Identify the actual edition/date, not an assumed book cover.

Image zoom is bounded from 1 to 1.25 and enlargement by the existing ×2 ceiling.
`contain` preserves a whole document and does not zoom; `cover` explicitly
permits cropping. Text is measured at the charter's sizes: overflow fails,
instead of shrinking typography or dropping words.

Transitions are `{type,duration}`: `cut`/0, `dissolve` or `fade`, at most 0.8s
and shorter than half the incoming scene. They occur **inside** the incoming
scene, holding the previous scene's last visual frame; they do not overlap or
shorten audio. Captions and credits are composed after the transition, so
captions are never crossfaded into unreadable doubles. The title and its evidence
label switch at the transition midpoint instead of superimposing two headings.
Both asset credits remain
visible while both images are visible. Dense credits can require a cut.

## Geographic contract

The basemap is GeoJSON Polygon/MultiPolygon, closed rings in longitude/latitude,
with `ADM0_A3` country properties. Coordinates are limited to Mercator's supported
latitude range. The projection is explicitly labelled; it is not an equal-area
or globe renderer and must not be used to demonstrate true surface ratios.

Camera keys are `{at,bounds}` with local times and bounds ordered
west/south/east/north. Start at zero and increase strictly. The camera fits the
whole requested bounds; it interpolates smoothly between keys.

Map layers: `national`, `political`, `people`, `physical`. Country highlighting
is permitted only in `national`. Borders are an independent visible option.
Turning them off uses uniform land fills without country strokes. That does
not turn a set of national statistics into a historical territory.
With borders enabled, optional `border_style: "dashed"` draws quiet dashed
outlines behind population/territory overlays; omission preserves solid lines.

Features have `kind`, `label`, local `at`/`until`, their own `evidence`, optional
`colour` (`gold`, `white`, `night-ink-2`, `teal`, `perv`) and label `offset`.
Optional `role: "context"` marks a territory as geographic background. Context
territories render below subject features regardless of array order, with dimmed
fill and labels, and a visible `Voisinage` legend prefix. Use dated evidence;
proximity alone does not establish contemporaneity. Omission means `subject`.
Optional `fade_seconds` (0.04 to `until-at`) reveals a feature once, then holds
it. Reduced-motion output shows it immediately. Neither option infers geometry.

Optional `label_colour` takes the same palette tokens independently of the fill;
use it to keep labels readable over saturated regions. Optional `geometry_note`
is visible in the legend and must be nonempty when supplied.

- `point`: `point: [lon,lat]`; a national-layer point may have three explicit
  `flag_stripes` hex colours. These are only vertical tricolours, not a general
  flag library. Cite the flag and its historical validity.
- `presence`: a point with an equal-size halo. It indicates a locator, not
  measured density, exclusive membership, exact settlement or population size.
- `territory`: closed `points` ring, on a political or people layer. Estimates
  and hypotheses have dashed outlines and visible epistemic labels. Optional
  `fill_opacity` is a finite number from 0 to 1; the original default is 65/255.
  Values around 0.8 give a clearly visible, crisp region without using a halo.
  Colour strength is a design choice, never a measure of historical certainty,
  population density or administrative control. Country fills remain forbidden
  on these layers. A crisp edge can still be an explicitly estimated boundary.
- `presence-zone`: closed `points` ring, people layer only, with a feathered
  coloured fill and no hard perimeter. Requires `estimate` or `hypothesis`
  evidence and a visible `geometry_note`. The feathered edge is a schematic
  uncertainty convention, not a measured density surface. An authored ring
  based on qualitative place references must explicitly state that its extent
  is not measured; it must never be represented as a surveyed settlement area.
- `route`: ordered `points`, revealed progressively with an arrow. `meaning`
  must be `journey`, `migration`, `language-diffusion` or `name-circulation`.
  Use `journey` for an individual's travel, not collective population migration.
  Optional `draw_seconds` (0.04 to `until-at`) finishes the reveal early and holds
  the completed arrow until `until`; omission preserves the original reveal
  throughout the feature's lifetime. Optional `line_style` is `solid` (default)
  or `dashed`; optional `line_width` is an integer from 1 to 12 pixels at 1080px
  (default 5). A dashed line can distinguish schematic links from an attested
  track, but still needs evidence and a clear explanatory note. The reveal is
  an explanatory animation, not a measured travel speed or literal track.

Prefer points and clearly coloured regions for new geographic examples, per
operator feedback. Halos remain supported for existing plans, not a default
choice. For changing kingdoms, distinguish the ruler's personal travel from
campaigns by their generals and from later rulers' territorial expansion.
Do not imply that political extent is an exclusive population distribution.

Use separate dated features/scenes for changing extents. The engine never
morphs two boundaries into an invented intermediate historical border.
Presence overlap is allowed; drawing one group does not exclude another.
All active feature periods/statuses remain in a legend even when a point is
outside the camera. A crowded legend fails instead of hiding uncertainty.

## Editorial profiles and handoff

Profiles concern the argument, not the rendering technology. Map/image/text
scenes can be combined in any profile. `coverage: complete` requires these beats
to be present (it does not certify their quality or source accuracy):

Copy a starter from `templates/name-origin.json`, `templates/history-geography.json`,
`templates/thematic-analysis.json` or `templates/free.json` into the private
workshop. They intentionally **fail validation** until real timings, hashes,
approved copy and sources replace their placeholders. No fictional durations or
historical facts are supplied as defaults. Replace any starter text scene with
one of the supported scene types using the content contract above; the private
mixed-scene demonstration is a filled working example.

| Profile             | Required beats                                                   | Typical visual choices                                              |
| ------------------- | ---------------------------------------------------------------- | ------------------------------------------------------------------- |
| `name-origin`       | question, usages, evidence, limits, answer, closing              | Map locator, attested spellings/document, names comparison          |
| `history-geography` | question, context, evidence, evolution, limits, closing          | Physical map, dated political or presence layers, source image      |
| `thematic-analysis` | question, definitions, case, evidence, limits, position, closing | Terms comparison, located case, study/document, attributed position |
| `free`              | No fixed order; every scene still needs purpose and evidence     | An authored sequence whose argument is explained in its brief       |

Name-origin narration continues to follow the existing category-specific
template; these beat tags do not replace its wording. A visual scene may span
or subdivide an editorial paragraph when the explicit timeline follows speech.
The other profiles do not force an etymology, an ethnonym pair or a mythical
opponent into a thematic subject. Positions must be labelled as editorial.

1. **Strong model:** supplies the question, complete approved narration,
   claim/source/uncertainty map, profile, visual intention and accepted assets.
2. **Execution model:** fills `scene-plan.json`, resolves local files, hashes
   inputs, derives cues from alignment, runs validation, fixes reported errors,
   then exports previews and the proof. It does not invent facts or geometry,
   change approved speech, modify the engine to evade validation, or publish.
3. **Engine:** validates inputs, computes frames, composites common captions,
   writes H.264/AAC, 360px previews and provenance. No LLM runs inside it.
4. **Operator:** assesses visual meaning, listens to names and approves the
   final piece under the normal workflow.

For a different Mac or cloud session, transfer the private source production,
storyboard and assets, configure the workshop root, and set the destination.
Pushing this public repository transfers none of those private inputs.

Frame-order independence is tested. Identical source/configuration and pinned
runtime produce reproducible pixels; byte-identical MP4s across different
FFmpeg, font or operating-system versions are not promised. The report records
hashes and runtime versions. No model's quality is guaranteed by choosing its
name; the next subject must test this handoff in practice.

## Deliberate v1 limits

No clip scene, interactive globe export, arbitrary vector effects, automatic
historical reconstruction, density interpolation or inferred migration. Clips
need trim bounds, frame-rate normalization, embedded-audio policy and licensing;
globe export needs a frame-driven camera and deterministic graphics capture.
These are extension points, not working capabilities claimed by this release.

The geographic data adapter is explicit GeoJSON. The website's data can feed
it after a reviewed conversion; this change does not silently equate national
centroids with settlements or alter the website's disputed-territory policy.

Run the new suites with the harness interpreter: `test_ethni_scenes.py` and
`test_ethni_scene_audio.py`, then the existing engine checks. The integration
test creates and removes its own synthetic audio/video; no private corpus is
required for the new contracts.
