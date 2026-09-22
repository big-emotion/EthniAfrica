# The production history and its cadence

This directory is the versioned answer to "where was this subject published,
in which format" — one JSON file per subject, at
`docs/productions/<typologie>/<NNN>-<slug>.json`. The schema, the gate that
enforces it (`scripts/ci/checkProductionLedger.ts`), and the reasoning behind
every decision below are in `docs/plans/production-history-plan.md`; this file
holds only what a skill or a human needs at hand while filing an entry.

**This directory holds no rendering doctrine.** How a carousel or a reel is
composed is `docs/design/gabarits-social/GABARITS-SOCIAL.md`'s job; this file
never restates it, only points at it where the two touch.

## Never an assertion

**EthniAfrica poses a name's origin, it never states one.** A name is either
an endonym or an exonym, and it keeps moving through history — a fiche
publishes the forms and their sources, never a verdict on which is right.
This is not a stance the ledger invents; it is the same discipline
`CLAUDE.md`'s Source Tier Policy and its "Assertion tracks certainty" rule
already hold for every fiche, restated here for the two fields a reader sees
closest to verbatim:

- **`question` and `myth` must both read as a question, never as a stated
  fact — even a hedged one.** "Le lingala aurait été inventé par les colons
  belges." still asserts, softened only by "aurait". "Le Lingala, un nom
  inventé par les colons belges ?" poses the same claim as a question the
  piece goes on to examine. The gate enforces this literally: both fields
  must end in `?`.
- **No source outranks another by origin.** A European source can be right; an
  African source can be right; a non-official or oral source can be right.
  The project does not adjudicate that — it surfaces that several accounts
  exist, at their own tier (`official`/`referenced`/`unverified`, never
  ranked by whose account it is), and leaves the judgment to the reader.
  Where a local account and an outside one disagree, both are named; neither
  is dropped for being weaker.
- **The point a reader should leave with** is that a name almost always has
  more than one appellation and more than one possible reading — not which
  one to believe.

This is doctrine for the _data_ this directory versions. The actual on-screen
card copy is authored in `cards.json` by `ethniafrica-structure`, and the same
rule applies there once that skill is updated to write to this ledger.

## The fixed format

- **Three publication days**: Monday, Wednesday, Friday.
- **A connected subject sequence with flexible depth**, at the cadence stated
  below. There is no fixed quota of new subjects per day or per week.
- **One question, five typologies**: every subject answers « D'où vient le nom
  X ? », where X is a **peuple**, a **pays**, un **patronyme**, un **lieu**, or
  une **langue** — plus one exception, **mot** (see "The mot exception").
- **Per subject: a video, plus a carousel only when an attested myth supports
  it**, per GABARITS §1 bis. The video walks the appellations back through their
  history. The carousel opens on a sourced myth, ten images maximum. A subject
  may need several distinct episodes; do not manufacture a myth or repeat an
  answer to fill a weekly count.
- **Numbered by episode, per typologie** — the 7th `langue` episode, the 3rd
  `pays` episode — never a single counter shared across typologies, so a
  reader can follow one series without the others' numbers interrupting it.
- **Every piece presents the project**, invites contribution, and explains why
  appellations are hard and why the word « ethnie » does not fit.
- **Under three minutes**, and each platform's own format constraints
  respected — see GABARITS §1 bis for exactly which network receives which
  format; this file does not repeat that table.
- **Current events are a reason to schedule a subject** ahead of the queue —
  the operator's own example is Goma.

## The network × format mapping

**Already fixed in GABARITS §1 bis, dated 2026-09-16 — not repeated or
re-derived here.** In short: since the operator's 2026-09-21 revision, both
formats go to every network, and only X refuses the carousel because the
platform has none. LinkedIn and X also carry a text-with-link form.
`scripts/lib/socialFormatMatrix.ts` is the
one machine-readable copy of that table, used by the gate — if §1 bis is
revised, that file is revised in the same change, and this paragraph is not a
second copy to keep in sync.

## Typologies are not corpus kinds

A `langue`, `peuple`, `pays` or `patronyme` subject's `subjects[]` entry uses
the matching corpus kind (`language`, `people`, `country`, `patronyme`). A
**`lieu`** subject has no table of its own in the AFRIK corpus — a toponym is
always filed under whichever entity actually names it, almost always
`country` and sometimes `people`. `subjects[].kind` is therefore never derived
from `typologie`; the gate checks the id against the real corpus, not against
the typologie.

## The mot exception

**`mot` is a sixth typologie, granted once, for a word.** The operator added it
on 2026-09-21 for « ethnie »: a word of the vocabulary that the project cannot
avoid using — it is in the project's own name — and that no corpus fiche
carries, so none of the five typologies could hold it. It exists for a word
whose origin the project has to pose, not as a place to put subjects that fit
no other row; a new `mot` still needs the operator's word.

What differs from the five, and nothing else does:

- **`subjects[]` may be empty.** A word names no fiche, so there is no corpus
  id to resolve and none is invented. The gate still refuses a subject the
  corpus does not hold, should one be listed.
- **`sitePath` has no fiche route to match**, so it only has to be a French
  route (`/fr/…`): the page the piece sends the reader to, for example the
  about page.
- **Its episodes are counted on their own**, from 001, in
  `docs/productions/mot/` — the first `mot` is « ethnie ».
- **« Ethnie » is one video and no carousel**, by the
  operator's exception of the same day: it has no attested myth to take apart,
  and §1 bis already sends a mythless subject out as a video alone. Its
  `publications[]` therefore never holds a carousel row.

`question` and `myth` still end in `?` and every other rule of this file
applies unchanged.

## Current cadence — operator revision, 2026-09-22

**Monday, Wednesday and Friday remain the publication appointments. The ordered
subject sequence governs their contents, not a fixed number of new subjects.**
The operator explicitly left the choice of two or three weekly subjects open:
a complex subject may occupy several appointments or return in a later chapter.

Aim for **four to six distinct editorial pieces per week**, where research and
capacity support them, including useful companion formats. A cross-post of the
same video on six networks counts as one produced piece. Do not fabricate a myth,
split a thin answer, or introduce an unrelated subject to fill the envelope.
Publish fewer pieces if the evidence is not ready; no catch-up burst is required.

The active sequence starts with the project-intention essay, then **Mali →
Manden/Mandé/mandingue → Dioula → Traoré → Keïta/Coulibaly → Macina/Diina**.
The [dated strategy roadmap](../editorial/strategy/roadmap-2026-q4.md) supplies
planning slots and reviews; the [evidence note](../editorial/strategy/evidence-2026-09-22.md)
records the measurements and limitations behind them.

This decision **supersedes the September 20 ramp**, whose target was five
subjects per publication day and whose recorded stage remained bootstrap 0.
It is a replacement of the volume policy, not an assertion that any old stage's
validation criteria passed. Source readiness, actual publication URLs and the
production-ledger gate remain required; a planned date is never a published row.
The previous ramp is preserved in Git history rather than maintained as a second
active cadence table.

## Filing an entry

1. Resolve the corpus id(s) the subject is about (`subjects[]`) and the site
   path they resolve to (`sitePath`).
2. Pick the next free `episode` number for the subject's `typologie` — read
   the highest-numbered file already in that typologie's subdirectory.
3. Leave `narrativePattern` out. It named a row of GABARITS §7 ter's per-type
   table, which was deleted on 2026-09-21: a reel and a carousel now share one
   closing, so no row is left to pick. Entries filed earlier keep the key, and
   `checkProductionLedger.ts` never required it, so nothing in the gate changes.
4. Leave `publications[]` empty until something is actually posted; add one
   row per network × format as it goes out, `url` included once known —
   never omitted for being unknown yet.
5. Run `npm run check:production-ledger` before committing.
