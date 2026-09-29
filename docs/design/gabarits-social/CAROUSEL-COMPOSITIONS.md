# Carousel compositions — reading profiles

A small library for carousels that are read at the reader's own pace: eight
compositions, three profiles, one compositor. It draws nothing the standard gabarit
does not already draw (`GABARITS-SOCIAL.md` §5, dispositions A/B/C). It adds what
was missing around it: a variable card count, a slot contract per card, a check
that a face, a document or a route survives the crop, and a way to state a
comparison without claiming a derivation.

How a deck's argument is chosen before its cards are written — five stages in
`ethniafrica-idee`, a card table shown before any copy — is in
[NARRATIVE-DESIGN.md](NARRATIVE-DESIGN.md#carousels). It reads this table's counts and
compositions from the profile descriptors and adds none of its own.

Nothing here approves an episode's copy, sources or images. Every example below is
a synthetic fixture (`social/harness/layout_fixtures.py`), drawn, not photographed.

## Three axes, kept apart

The editorial contract (`EDITORIAL-CONTRACT.md` §2) separates a narrative **family**
(how the story establishes and answers its question), a visual **profile** (this
file) and a **format and destination**. A family never selects a renderer: six
families need eight compositions between them, and the same composition serves
several families.

| Axis        | Chosen by                                | Lives in                                         |
| ----------- | ---------------------------------------- | ------------------------------------------------ |
| Family      | the shape of the question (S3)           | the brief                                        |
| Profile     | the reading shape of the carousel        | `social/harness/carousel-profiles/*.json`        |
| Destination | the network and its crop                 | the profile's `formats` and `crops`              |

A deck without `profil` keeps every existing rule. So do `memoires-sonores` (exactly
six cards, the standard gabarit, unchanged) and `lectures-afrique`. A profile that
does not resolve fails before any image is read, never falling back to all networks.

## The three profiles

| Profile              | Cards | Compositions besides `cover`                 | Networks                       |
| -------------------- | ----- | -------------------------------------------- | ------------------------------ |
| `reading-story`      | 4–9   | portrait, document, timeline, map, credits   | the five carousel networks     |
| `reading-comparison` | 4–7   | portrait, comparison, map, credits           | the five carousel networks     |
| `reading-listening`  | 3–8   | listening, portrait, credits                 | TikTok, Instagram (music notes)|

The count belongs to the profile: nothing inherits Mémoires sonores' six. The first
card is always a `cover` and the last always `credits`. `reading-listening` owes the
same `musique` notes and per-platform sound review as Mémoires sonores, and for the
same reason: carousel images embed no audio, the sound is chosen on the platform.
Why only two networks there is an operator choice not yet made (see open points).

## The compositions

A composition is a slot contract plus checks over the compositor. `ethni_carousel_layouts.py`
holds the table; the profile check names the card and the field that is missing.

| Composition  | Owes                                              | Built on                                | Caught by the machine                              |
| ------------ | ------------------------------------------------- | --------------------------------------- | -------------------------------------------------- |
| `cover`      | titre; `image.sujet`                              | disposition A, series band, scroll cue  | more than eight words; title too small at 160 px   |
| `portrait`   | titre, precision, source; `image.sujet`           | photograph, one dated line under title  | subject cropped, covered or dimmed                 |
| `document`   | titre, corps, source; `image.sujet`               | photograph of a sheet; never disposition B | as above; word-only B refused                   |
| `timeline`   | titre, corps, source; 2–4 dated `paires`          | the pair block, arrow meaning « then »  | a term with no digit; five entries                 |
| `comparison` | titre, corps, source; 2–4 `paires` with `glose`   | the pair block, neutral divider         | missing `relation`; a case with no gloss           |
| `map`        | titre, precision, corps, source; `image.sujet`    | a map image, route inside the subject   | route cropped, covered or dimmed                   |
| `listening`  | titre, precision as `m:ss` or `m:ss–m:ss`, corps, source | standard slots                   | no timecode; end before start                      |
| `credits`    | titre, corps, source                              | standard slots                          | any of them empty                                  |

Every card after the cover also owes a `source`. A card's `image` still owes the
existing gates (credit, licence, repository, identity): the profile adds to them.

### Why comparison and timeline have a `relation`

The pair block of §3 bis says one word *became* another: a mandatory arrow, first
term in ink 1, last term in the accent. That is exactly right for a name and exactly
wrong for two cases asked the same question — the arrow claims a derivation, the
accent crowns the second case. A card may therefore carry:

- `relation: "comparaison"` — every term in ink 1, a neutral divider in the accent
  (`couple-separateur-N`), no arrow. Required on a `comparison` card.
- `relation: "chronologie"` — every date in ink 1, the arrow kept (it means « then »).
  Optional on a `timeline`.

Without `relation` the block is byte-identical to before, which the regression
control below pins. This is the only change to `ethni_compose.py`.

## Six families as compositions

`social/harness/layout-examples/family-layouts.json` is the machine form; a test
checks it against S3's six family fixtures, so a seventh family or a renamed one
fails the suite instead of silently going unrepresented.

| Family                    | Profile              | Card sequence                                             |
| ------------------------- | -------------------- | --------------------------------------------------------- |
| Name investigation        | none                 | the eight-card name carousel of §7 ter, unchanged         |
| Historical portrait       | `reading-story`      | cover, portrait, timeline, document, credits              |
| Circulation and connections | `reading-story`    | cover, map, timeline, portrait, credits                   |
| Material biography        | `reading-story`      | cover, document, portrait, timeline, credits              |
| Comparison                | `reading-comparison` | cover, portrait, comparison, comparison, credits          |
| Guided listening          | `reading-listening`  | cover, listening, listening, portrait, credits           |

Circulation and material biography are assembled from the same primitives as the
portrait; the pilot did not show a missing composition, so none was added. Counts
are examples inside each profile's range, not a rule: three criteria make a longer
comparison, one stage fewer a shorter route.

## Subject zone, crop and safe areas

A card that carries a face, a document or a route declares it:
`image.sujet = [x0, y0, x1, y1]`, fractions of the source image. The check runs on the
plan the renderer will draw, for each format the profile lists in `crops`, and
refuses:

1. **A crop that loses it.** The object-fit cover crop and `image.cadrage` can push a
   subject out of the frame; the whole box must stay inside.
2. **Text on it.** Any text block overlapping the box.
3. **The scrim on it.** The ramp that carries the text darkens the photograph above
   the column. Twenty per cent of the darkening is reached 55 % of the way down the
   ramp, so a subject reaching past that is dimmed although no letter touches it.
4. **The platform interface.** In 9:16 nothing that has to be seen goes under y = 1620.

Declare `sujet` whenever the picture carries something the reader has to see. A
decorative ground needs none, and then the header row may sit on the picture: that
is the standard gabarit, not a defect.

## Type hierarchy

Nothing new is drawn, so the existing five ranks apply (`GABARITS-SOCIAL.md` §3):
display title, precision, pair term and gloss, body, source; credit and watermark as
annexe. The compositions fix only *which slot carries what*: the timecode of a
`listening` card, the date line of a `portrait`, the dated terms of a `timeline`
are all `precision` or pair terms, never a new size. Text is measured, never shrunk:
an overflow is reported (`plan.fautes`, or a column that only held by giving up type)
and the lot ships as a proof.

## Phone readability

Criteria were fixed before the boards were drawn, at 320, 390 and 430 px first, then
768 and 1200 px (the same 1080 px export scaled, so larger views can lose nothing
that 320 keeps).

| Check                                    | Rule                                                        |
| ---------------------------------------- | ----------------------------------------------------------- |
| Fit                                      | no plan fault, no compressed column                         |
| Type floor at 320 px                     | title ≥ 24, precision ≥ 10, body ≥ 9, pair term ≥ 14, gloss ≥ 8, source ≥ 5.5 |
| Cover at thumbnail width (160 px)        | title ≥ 10 px, at most eight words                          |
| Subject                                  | inside the crop, uncovered, undimmed, above y = 1620 in 9:16 |

The floors are the standard gabarit's own smallest sizes rescaled and rounded down.
They catch a composition that shrinks type; they do **not** certify comfort. Measured
on the boards: the standard body is drawn at 32 px of 1080, which is **9.5 px on a
320 px phone** (11.6 at 390, 12.9 at 430), and the source line 5.9 px. That predates
this work and belongs to the approved gabarit, so a profile does not change it; it
is listed under open points.

## Reviewing

    cd social/harness
    ./venv/bin/python layout_boards.py --out <a directory outside the repository>

writes one contact sheet per deck at 160 (thumbnails), 320, 390, 430 and 768 px, and
each card in full. Look at 320 first: cover crop, subject, credits and footer; then
larger. A successful render is not proof of editorial quality, and a synthetic board
approves no episode.

## Interfaces for the neighbouring sessions

**For the scene engine (S5).** A video is staged from meaning and timing, not
exported from the cards. The carousel compositions correspond to features the scene
catalogue already has — a map with an animated route (`map`), a source document
shown whole (`document`, a static hold is valid), a focused timeline (`timeline`),
a comparison of up to three items or the full-frame layout (`comparison`), a
photograph with keyed motion (`portrait`, `cover`). Two requests, neither a new
effect:

1. Where a scene image carries a subject worth protecting, accept the same
   `image.sujet` box and refuse a `motion` whose keyed view leaves it, so a pan
   cannot cut a face the still card would have kept.
2. A comparison scene sets every case in the same ink, as `relation: "comparaison"`
   does on the card.

Movement is justified only where it points at meaning: a route drawing in, a date
arriving on its word. A hold on a document is not a fault.

**For publication kits (S6).** For each destination the profile lists in `formats`
and `crops`:

- `ethni_carousel_layouts.zone_problems(card, plan, fmt_key, image)` — empty when the
  subject survives that destination's crop;
- `ethni_carousel_layouts.readability_problems(plan, fmt_key, viewport)` and
  `thumbnail_problems(plan, fmt_key)`;
- `ethni_carrousel2.py --brief <profile>` returns the guide and an empty scaffold.

`ethni_carrousel2.py` already runs them for reading profiles and files a lot that
fails as a proof with the reason in `RENDU.md`. Changing `image.cadrage`, `image.sujet`
or the destination touches the layout and destination approvals (contract §6), not the
approval of the copy.

## What was not done, and why

- No composition was added for a pilot need that did not appear; six renderers were
  not built for six families.
- The music series was not touched: its profile, six cards and standard look are
  pinned by the existing suites and re-run here.
- The 1080 × 1080 LinkedIn output stays retired, and X still receives no carousel.
- No catalogue of effects, no new dependency, no change to the disposition quota.

## Open points for a person

1. **Body size on the smallest phones.** 9.5 px at 320 px is the approved gabarit's
   own size. Raising it is a change to the standard look, not to a profile.
2. **Timecode as a slot.** On a `listening` card the timecode is a plain precision
   line and reads lighter than the thing the listener is told to find. A dedicated
   rank would be a new type role; not added without a ruling.
3. **Networks for `reading-listening`.** Set to TikTok and Instagram like Mémoires
   sonores, because the per-platform sound review is owed per network. Widening it
   means reviewing the sound on each added network.
4. **Closing wording** for non-name families is S3's open point: the `credits` card
   owes sources, and its copy is not written here.
