# Brief 11 — The result page: from the searched name to the self-name, one video, labelled sources

Read [`README.md`](README.md), [`01-result-page-timeline.md`](01-result-page-timeline.md)
and [`../../mockup-first-workflow.md`](../../mockup-first-workflow.md) first.
Written 2026-10-17. Status: **approved 2026-10-17 by delegation.** The
operator asked Claude on 2026-10-17 to approve these boards on their behalf
(« approuver les maquettes pour moi »). Claude approved them after an
art-direction review; the operator did not review the boards themselves. The
decisions taken on their behalf are in the approval record below, and the two
charter amendments of this brief are applied to
[`../../search-result-charter.md`](../../search-result-charter.md).
Prompt: [`claude-design-prompt-11.md`](claude-design-prompt-11.md).

### Approval record (2026-10-17, by delegation)

1. The hand-off's eyebrow reads « Leur nom » for every type.
2. The video row stays after the open name's end line when another name is
   open: it belongs to the subject.
3. The sources button's label is in ink, not in the family colour, for
   contrast.
4. Brief 1's « Already on `search-peul`, do not redraw » is superseded for the
   lead only.
5. Charter « What left « Tout » » and §8 amended as this brief words them.

This is **pass 2** of the three board passes the operator approved on
2026-10-17. It starts once pass 1 ([brief 10](10-fiche-story-link-and-folds.md)
and brief 6) is approved and recorded: the passes share `Main` and
`ea-live.css`, and three fiche boards change again here for the sources
button.

It covers three findings of the 2026-10-17 triage and one rule:

- **P03**: the page hands the reader from the searched name to the self-name's
  story;
- **P06**: one video made on the name, in the « Histoire du nom » view;
- **P11**: the sources button of each passage gets a visible label and a
  44 px target;
- a rule for **consecutive tiles of the same period**.

**Boards to change** (each at `-430`, `-768`, `-1440`): `search-peul` (the
model), `search-bassa`, and for the sources button also `search-congo`,
`search-state-competing`, `search-state-thin`, `language-lingala`,
`country-civ`, `country-state-civ-quaqua`. `Main` changes for the hand-off
tile, the video row, the sources button and the period rule.

**Not to touch:** `search-unknown` and `search-state-nodate` (brief 12 owns
the unknown page), the people and family boards, the lens bar, the verdict
card's summary, the chips, « Les sources parlent », the closing band's
conviction and invitation, and « Poursuivre avec un autre nom ».

**Surface.** `/fr/atlas/recherche`, built by
`src/components/search/SearchFeed.tsx` and
`src/components/search/timeline/NameTimeline.tsx`; the sources button is
`src/components/sources/SourceDiamond.tsx`, shared with the fiches through
`TileSourceMarker`.

## Why

Measured on recette at 430 px on 2026-10-16, and in the audience data:

- **Fulɓe's story waits behind a tap.** On `?q=peul`, the default view tells
  Peul. Fulɓe, the name this people gives itself, appears in the summary, in
  the lead « Vous avez cherché Peul. Ce peuple se nomme lui-même Fulɓe. »
  (with « Voir ») and as a chip. Its five explanations sit at y≈2,310 and only
  after a tap on the chip, which does not move the page. When the reader
  reaches « Fin de ce que nos recherches retracent pour le nom Peul. », nothing
  hands them on to Fulɓe. Doctrine §1.1 asks the page to lead visibly from the
  searched name to the self-name.
- **The closing band does not follow the open name.** With Fulɓe open, it
  still says « … pour le nom Peul », because it is built from the searched
  name only.
- **No video in the default view.** The only way to the two pieces « D'où
  vient le nom « Fulbe » ? » is the lens button « Shorts 6 ». Social media are
  the project's front door (doctrine §4); the page that answers the name does
  not show the piece made on it.
- **The sources button is a lone 24 × 24 diamond.** It has no visible text
  (10 of them on the Fulɓe timeline, 11 on Lingala). The charter (§8) lists
  « the sources button » among the 44 px controls and exempts only a link
  inside a sentence, so the approved boards already conflict with it.
- 46 of the 48 result clicks recorded in the window came from the result list,
  1 from the timeline view. 81 % of visitors are on a phone.

## What is on the boards today (checked 2026-10-17)

`search-peul-430`, in order: the search field and the lens bar (« Histoire du
nom » pressed, then Tout, Shorts 6, Récits 5, Jeux 1, Fiches 114); the verdict
card (« D'où vient le nom · Peuple », « Peul », the summary, the lead button
« Vous avez cherché Peul. Ce peuple se nomme lui-même Fulɓe. » with « Voir »);
the chips (« Peul · cherché » first); the intro line; « On remonte le temps »
and « Pendant ce temps, ailleurs »; Peul's timeline (two tiles « Usage
contemporain », the tile « Rapporté dans un article de 1966 », the birth tile
1842); « Fin de ce que nos recherches retracent pour le nom Peul. »;
« Voir la fiche complète · Fula (Fulbe / Peul) »; « Qui raconte le nom
Peul ? »; the closing band; « Poursuivre avec un autre nom » (Wolof,
Atlantique).

`search-bassa` draws three subjects; the third (the Basaa of Cameroon) carries
the lead « Vous avez cherché Bassa. Ce peuple se nomme lui-même Basaa. ».
`Main` draws the same lead in « Composants · frise du nom ».

Each sourced passage ends with the diamond button: no text, 24 × 24, its
colour the family of the first source, its accessible name « Sources :
Publication académique et 3 autres, voir les sources » or « Source :
Publication académique, voir les sources ».

## What to change

### 1. The hand-off to the self-name (P03)

**a. One line in the lead, with the count.** Under the lead's sentence, inside
the same lead (one tap still opens the self-name):

> « D'où vient le nom Fulɓe ? Les sources proposent cinq explications, sans
> que l'une l'emporte. »

The number counts the accounts of the **explanation tiles the timeline
actually builds** for the self-name (the « Hypothèse 1 … 5 » tile), not every
account marked as an explanation in the data: the page never announces a
number it does not show. A group of explanations needs two accounts or more to
become a tile, so the count is either zero or two and more. With none, the
line is not drawn. Numbers from two to six are written in words (« deux » to
« six »), higher ones in figures.

The lead's action keeps its word, « Voir ». It opens the self-name's chip and
brings the **top of its timeline** into view, its intro line first: the page
introduces the name before it explains it (doctrine §1.1). It never jumps
straight to the explanations.

**b. The hand-off tile, after the end line.** Directly after « Fin de ce que
nos recherches retracent pour le nom Peul. », a tile set off the timeline's
thread (no dot, not a dated tile):

- eyebrow « Leur nom », the tag the fiches already give a self-name;
- the name « Fulɓe », in the display face;
- « Ce peuple se nomme lui-même Fulɓe. Ce nom a aussi son histoire : les
  sources proposent cinq explications de son origine, sans que l'une
  l'emporte. »;
- an outlined button, 44 px: « Lire l'histoire du nom Fulɓe ». It opens the
  Fulɓe chip and brings the top of Fulɓe's timeline into view, as the lead
  does. It is a button, not the page's solid ocre action (the page keeps one).

With no explanation tile: « Ce peuple se nomme lui-même Basaa. Ce nom a aussi
son histoire. » and « Lire l'histoire du nom Basaa ». The first sentence is the
lead's own sentence for the subject's type.

**c. When it shows.** Only while the searched name is the open chip and the
subject has a self-name lead. A page with several subjects gets **one hand-off
per subject that has one**: on `search-bassa`, the third subject only. No
hand-off when the searched name is the self-name (`search-state-thin`,
« wolof »), and none once the self-name is open.

**d. The closing band follows the open chip.** With Fulɓe open, the band's
silences speak of Fulɓe, as « Qui raconte le nom … ? » already does:

- « Aucun récit transmis oralement n'est enregistré pour le nom Fulɓe. »
- « Avant sa plus ancienne trace connue du projet, l'histoire du nom Fulɓe
  reste à écrire. »

These are the sentences the site already builds from the data (Fulɓe's oldest
trace is Heinrich Barth's journey of 1849-1855, not a plain year).

### 2. One video made on the subject (P06)

After the hand-off tile (or directly after the end line when there is no
hand-off), one compact row for the first piece of the « Sur ce nom » group
(relation `exact` or `word`):

- poster at 9:16, 64 px wide at 430;
- eyebrow « Une vidéo sur ce peuple » (« sur ce pays », « sur cette
  langue »… by the subject's type). A piece matched `exact` is matched on the
  subject, not on the name form: on `?q=peul` the piece is titled after
  Fulbe, so the eyebrow must not say « sur ce nom »;
- the title from the data, « D'où vient le nom « Fulbe » ? », with the action
  link's arrow, as on the next-step cards;
- the duration, « 2 min 35 »;
- the whole row is one link, 44 px tall at least.

One row per page, under the subject the piece belongs to. The other pieces
stay in the « Shorts » filter. No row and no empty slot when no such piece
exists. At 768 and 1440 the row keeps the reading column's width, poster on
the left. Then comes « Voir la fiche complète », in its approved place.

### 3. The sources button gets its label (P11)

Keep the diamond and its colour. After it, a visible label:

- « Source » when the passage has one source, « Sources » when it has
  several. **No count**: a number beside each passage would read as a score of
  strength;
- `--afh-text-small`, weight 600, in an ink that reaches 4.5:1 on the tile
  ground (the diamond alone carries the family colour); report the ratio;
- diamond and label are **one button** (it opens the source sheet), joined to
  the passage's last word by a no-break space, so they wrap together;
- a touch target of **44 × 44** at least, from padding, that does not change
  the passage's line height;
- its accessible name **starts with the visible label** (WCAG 2.5.3): « Source :
  Publication académique, voir les sources », « Sources : Publication
  académique et 3 autres, voir les sources ».

The source sheet and its colour key do not change. The book family keeps its
label « Livre ou étude ».

### 4. Consecutive tiles of the same period

When two or more tiles in a row carry the same period label (on `search-peul`,
two « Usage contemporain »; on `search-congo`, two « Rapporté en 2025 »), the
period is printed once, on the first. The following tiles join it, each still
its own statement with its own sources button, separated by a hairline. Their
texts are never merged and no account is dropped. A birth tile, a « before the
name » tile and an explanations tile never join another tile. The data holds
501 such runs in 344 fiches; the rule is a display rule, not a data rewrite.

### 5. The filed name « Peul »

On `search-peul`, « Voir la fiche complète · Fula (Fulbe / Peul) » becomes
« Voir la fiche complète · Peul », as on `Main` in brief 10.

## States to draw (430 first, then 768 and 1440)

- `search-peul`, default (Peul open): the lead with its line, the hand-off
  tile, the video row, the period rule on the two « Usage contemporain »
  tiles, the labelled sources buttons.
- `search-peul`, Fulɓe open: Fulɓe's timeline from its top, its explanations
  tile, no hand-off, the closing band about Fulɓe.
- `search-bassa`: the hand-off without a count on the third subject only; no
  video row unless the canvas data holds a piece of the « Sur ce nom » group.
- `search-state-thin`: no hand-off.
- The sources button, on `Main`: one source, several sources, an oral source,
  and a label that wraps with the last word to the next line.
- On every other board that draws the button: the new button, nothing else.

## Do not

- Quote, rank or crown an explanation in the lead or the hand-off; add « la
  plus probable » or any tier word.
- Move Peul out of first place or open Fulɓe by default.
- Jump to the explanations without the name's introduction.
- Autoplay a video, add a second row, or show an « Autour de ce nom » piece
  in this view.
- Put a count next to « Sources », or one mark per source type.
- Merge the texts of two tiles that share a period.

## Proposed charter amendments (not applied)

For the operator to approve with the boards; `docs/design/search-result-charter.md`
is not edited by this brief.

**« What left « Tout » »** (§3 ter). After its first sentence (« `shorts`,
`plates`, `quiz`, `images` and `fiches` are what the filters show. »), add:

> One exception: the « Histoire du nom » view shows one piece of the « Sur ce
> nom » group (relation `exact` or `word`), as a single row after the end line
> of the open name's timeline, its eyebrow naming the subject the piece is
> about. The shelf itself stays in the Shorts filter, and no row and no empty
> slot are drawn when no such piece exists.

The comment of `src/lib/search/resultGrammar.ts` that says shorts « left
« Tout » » changes in the same implementation.

**§8, touch targets.** After « a link inside a sentence is exempt, as WCAG
2.5.5 allows. », add:

> The sources button that ends a passage is not a link inside a sentence and
> is not exempt. It shows its diamond followed by a visible label, « Source »
> for one source and « Sources » for several, with no count. Its target is
> 44 px high and wide at least, without changing the passage's line height,
> and its accessible name begins with the visible label (WCAG 2.5.3).

This settles the conflict between the approved 24 px diamond and §8 in favour
of the charter.

## Decisions for the operator

1. The eyebrow of the hand-off: « Leur nom » (the fiche tag) for every type.
2. The video row's place when another name is open: it stays after the open
   name's end line, since it belongs to the subject.
3. The label colour of the sources button: ink, not the family colour, for
   contrast.
4. Brief 1's « Already on `search-peul`, do not redraw » covered the lead; this
   brief changes it and supersedes that line for the lead only.

## For the implementation (after approval)

- `selfLead` gains the count of the built explanation tiles; the number words
  come from the helper of `src/lib/i18n/copy/nameClosing.ts`, exported or
  moved first.
- The video row's clicks get their own surface value, `timeline_short`.
- Tests first, per the plan: the count (5 for Fulɓe, 0 with none, REQ-197);
  the line, the hand-off and its absence for `searched = "Fulɓe"` (REQ-198);
  one exact piece after the end line and none for a `linked-*` piece, with its
  surface (REQ-180); the label « Source » / « Sources » with an accessible name
  that starts with it, replacing the empty-text assertion (REQ-194); every
  button at least 44 × 44 at 430 on `?q=peul` with the line height unchanged
  (REQ-194, e2e).
- `ea-live.css` changes with `src/styles/` in the same commit.
