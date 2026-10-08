# The production history and its cadence

This directory is the versioned answer to "where was this subject published,
in which format" — one JSON file per subject, at
`docs/productions/<typologie>/<NNN>-<slug>.json`. The schema, the gate that
enforces it (`scripts/ci/checkProductionLedger.ts`) and the decisions below
are what a human needs at hand while filing an entry.

**This directory holds no rendering doctrine.** How a carousel or a reel is
composed is not this file's subject.

## Never an assertion

**EthniAfrica poses a name's origin, it never states one.** A name is either
an endonym or an exonym, and it keeps moving through history — a fiche
publishes the forms and their sources, never a verdict on which is right.
This is not a stance the ledger invents; it is the same discipline
the Source Tier Policy and the "Assertion tracks certainty" rule
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

This is doctrine for the _data_ this directory versions, and the same rule
applies to the on-screen card copy.

## Scope of this ledger — operator direction, 2026-09-27

**This directory is the name series' ledger, not the whole workshop's.** The
rules below (the `?`-ending question and myth, the five typologies, the
network × format gate, the Monday/Wednesday/Friday appointments) describe the
name-origin series. Social stories that are not about a name — a portrait, a
circulation, a listening, a comparison, a material biography — are recorded in
the private library, never here, and never with a fabricated site path or myth.
A `publications[]` row below is one publication occurrence: publishing one network's row never closes the subject, and a
repeated angle or a same-angle adaptation is legitimate.

## The fixed format

**Scope exception, 2026-09-25:**
Mémoires sonores is a separate
recurring feature within EthniAfrica: three musical carousel subjects every other
Sunday, each for TikTok and Instagram only. The Monday/Wednesday/Friday,
name-origin and mandatory-myth rules below describe the existing name series,
not this feature. Musical posts are registered in the private library, not in this site's
name-origin ledger. Selected launch subjects are not publication records. Do not file them
under a fabricated name category or invent a site route.

- **Three publication days**: Monday, Wednesday, Friday.
- **A connected subject sequence with flexible depth**, at the cadence stated
  below. There is no fixed quota of new subjects per day or per week.
- **One question, five typologies**: every subject answers « D'où vient le nom
  X ? », where X is a **peuple**, a **pays**, un **patronyme**, un **lieu**, or
  une **langue** — plus the **mot** exception. Project introductions are recorded separately
  without an episode (see "The introduction record").
- **Per subject: a video, plus a carousel only when an attested myth supports
  it.** The video walks the appellations back through their
  history. The carousel opens on a sourced myth, ten images maximum. A subject
  may need several distinct episodes; do not manufacture a myth or repeat an
  answer to fill a weekly count.
- **Numbered by episode, per typologie** — the 7th `langue` episode, the 3rd
  `pays` episode — never a single counter shared across typologies, so a
  reader can follow one series without the others' numbers interrupting it.
- **Every piece presents the project**, invites contribution, and explains why
  appellations are hard and why the word « ethnie » does not fit.
- **Under three minutes**, and each platform's own format constraints
  respected — see the network × format mapping below.
- **Current events are a reason to schedule a subject** ahead of the queue —
  the operator's own example is Goma.

## The network × format mapping

Since the operator's 2026-09-21 revision, both
formats go to every network, and only X refuses the carousel because the
platform has none. LinkedIn and X also carry a text-with-link form.
`scripts/lib/socialFormatMatrix.ts` holds the table itself, used by the gate;
this paragraph is not a second copy to keep in sync.

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
  and a mythless subject goes out as a video alone. Its
  `publications[]` therefore never holds a carousel row.

`question` and `myth` still end in `?` and every other rule of this file
applies unchanged.

**A `mot` record may carry an `answer`** (optional, added 2026-10-06 with the
answer page): what the result page says when a reader types the word. It holds
`origin[]` (at least one account of where the word comes from, each with an
optional `attribution`: oral, written, linguistic or synthesis), and optionally
a `lead`, a `path[]` (the form in each language it passed through) and a
`followUp` question. `lead` and `followUp` obey the limits of the same two
fields on a fiche (220 and 120 characters, the follow-up ends with `?`), every
sentence obeys the reader-facing register, and `answer` needs a `word`. The
sources and publications the page shows are the record's own `sources[]` and
`publications[]`; nothing is repeated.

## The introduction record

The operator approved the project-intention essay adaptation on 2026-09-22.
It introduces the connected series; it is not a name-origin episode or a
vocabulary word. Its record is
[introduction/comprendre-afrique-noms.json](introduction/comprendre-afrique-noms.json).

A second unnumbered record,
[introduction/pourquoi-la-meconnaissance-freine-l-afrique.json](introduction/pourquoi-la-meconnaissance-freine-l-afrique.json),
files the operator's message video of 2026-09-23 (« Pourquoi ignorer nos noms
freine l'Afrique ? »). It is an exceptional piece decided by the operator, outside
the five typologies and the `mot` exception, with no episode and no myth. It uses
this record type only because it is the one that holds a piece with neither. Its
carousel, to be published later, cannot be registered here for the reason given
below.

- `typologie` is `introduction`; `episode` and `myth` must be explicitly `null`.
  No episode zero or invented audience belief is required.
- `subjects` is empty and `sitePath` is `/fr/about`: the piece explains the
  project rather than documenting one corpus entity.
- `question` still carries a question, in both languages when available.
- The filename is `<campaign>.json`, without a numeric prefix. Introductions
  do not enter episode sequences. Campaign uniqueness and media validation
  still apply. With no attested myth, an introduction cannot register a carousel.
- Registration is not approval of a rendering template.

## Current cadence — operator revision, 2026-09-22

**Since 2026-09-27 this cadence is a planning aid for the name series, not an
obligation: a ready edition may have no date, and no weekday is mandatory
(see the scope section above).** When the name series is scheduled, Monday,
Wednesday and Friday remain its appointments. The ordered
subject sequence governs their contents, not a fixed number of new subjects.
The operator explicitly left the choice of two or three weekly subjects open:
a complex subject may occupy several appointments or return in a later chapter.

Aim for **four to six distinct editorial pieces per week**, where research and
capacity support them, including useful companion formats. A cross-post of the
same video on six networks counts as one produced piece. Do not fabricate a myth,
split a thin answer, or introduce an unrelated subject to fill the envelope.
Publish fewer pieces if the evidence is not ready; no catch-up burst is required.

The active sequence starts with the project-intention essay, then **Mali →
Manden/Mandé/mandingue → Dioula → Traoré → Keïta/Coulibaly → Macina/Diina**.

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
3. Leave `narrativePattern` out. It named a row of a per-type closing
   table, which was deleted on 2026-09-21: a reel and a carousel now share one
   closing, so no row is left to pick. Entries filed earlier keep the key, and
   `checkProductionLedger.ts` never required it, so nothing in the gate changes.
4. Leave `publications[]` empty until something is actually posted; add one
   row per network × format as it goes out, `url` included once known —
   never omitted for being unknown yet.
5. Run `npm run check:production-ledger` before committing.
