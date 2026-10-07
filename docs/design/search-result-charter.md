# The search-result charter — what a name page owes its reader

Settled 2026-09-18, on the reorientation recorded in
`docs/editorial/essais/dou-viennent-les-noms-2026-09-17.md`.

Updated 2026-09-19 by REQ-180 and DEC-058 after the result was recomposed as a
feed.

**The answer-first recomposition (2026-10-06, integrated by lots B and G) is
planned in `docs/design/search-answer-plan.md`.** Its reviewed rendering is the
frozen mockup in `docs/design/mockups/search-answer/` (version 11), made
executable by a generated manifest (`generate_manifest.py`). The forty boards of
`docs/design/mockups/search-feed/` described the page that stacked a dozen
blocks; they are **replaced** and kept only as history. Sections 2 to 3 bis and
4 to 5 below are written for that page: where they speak of the forty boards,
of `origins`, `peoples`, `tiles`, `atlas-holds`, `problem` or `near-name`, §3
ter now rules.

Three authorities govern different concerns and never substitute for one
another:

- **The forty boards govern visual rendering**: type, colour, spacing, density,
  media, theme and reference-width geometry.
- **The generated manifest and this charter govern structure and behaviour**:
  block identity, conditions, state, zone and expected placement.
- **Typed application projections and API schemas govern production data**:
  illustrative board copy never becomes a runtime contract.

When code and a board disagree visually at a reference width, the board wins.
When a board's markup disagrees with the manifest, the manifest wins and the
board is regenerated without an intentional pixel change. An intentional
visual change requires operator review and new baselines.

---

## 1. What the page is

The search-result page is **not an index**. It does not hand the reader a list of
links to fiches; it answers the one question the atlas now exists to answer:
**where does this name come from.**

The detailed fiches of every entity class stay where they are. They stop being
the default destination.

## 2. The ten reference cases, and why each exists

| State                            | Reference artboard | What it settles                                                   |
| -------------------------------- | ------------------ | ----------------------------------------------------------------- |
| A name given from outside        | `Mande`            | The searched form is not the one the peoples use                  |
| Many outside names, none its own | `Peul`             | Including one the corpus declares pejorative                      |
| Almost nothing known             | `Ekpeye`           | One name, no origin, no date — declared, not hidden               |
| Misspelt, then unknown           | `Introuvable`      | A typo reaches the right page; an unknown name gets an admission  |
| One name, several peoples        | `Bassa`            | Three peoples, three language families, no established link       |
| An ordinary unqualified case     | `Fang`             | Bare forms stay bare; the page invents no qualifier               |
| A country                        | `Nigeria`          | Historical names and dated eras come from the country shape       |
| A language                       | `Lingala`          | Conflicting sources remain visible and are not resolved by the UI |
| A family name                    | `Traore`           | Patronyme storage projects onto the same reader grammar           |
| A genuinely unknown name         | `Inconnu`          | Admission, conviction, contribution and onward paths              |

## 3. The rules the page obeys

**No scholarly word reaches this page.** Not _exonyme_, not _endonyme_, not
_autonyme_, not _étymologie_, not _corpus_. A reader who wants the vocabulary
meets it on a fiche or in the glossary, never here. This is the rule the first
draft broke, in a sentence lifted straight out of `whyProblematic` — which is
how the rule below came to be written.

**A corpus field is never copied onto this page; it is translated.** The corpus
speaks to the curator, the page speaks to the visitor. The three fields where a
retired word is legitimately discussed (`whyProblematic`, `originOfExonyms`,
`contemporaryUsage`) are curator prose, and quoting them verbatim is how the
jargon gets in.

**No appellation is crowned.** Every form the corpus holds is shown, **the name
the people gives itself first** (operator ruling, 2026-09-22), then the filed
name and the others in the fiche's order, each with its origin attributed to its
source. Ordering is not crowning: every chip keeps the same weight, and the
self-given one is marked, not enlarged. This replaced "the most common first",
which nothing implemented — the corpus holds no measure of commonness — and which
put « Peul » before « Fulbe » on the page that exists to show where the names
come from. The component
named `DominantAnswerPanel` is contrary to this rule by its premise and does not
survive the reorientation.

**A shared name is not kinship, and the page never says otherwise.** On `Bassa`
the page states that the atlas files the three in three different language
families and that no source it holds links them — a fact about the corpus, never
a fact about the world.

**A pejorative form is shown, not hidden**, in its own visual treatment, with the
reason. Hiding it would be settling.

**A silence is declared, never left blank.** `Ekpeye` carries three: no other
appellation, no documented origin, no dated attestation. Each is a statement, and
each is followed by what the atlas does hold and by an invitation to correct it.

**The page admits when it does not know a name.** « Nous ne connaissons pas ce
nom. Ce n'est pas une réponse : c'est un aveu. »

## 3 bis. The rhetorical obligations

Written 2026-09-18, after the initial fourteen artboards were found not to share
a grammar. Each had been drawn for its own case and none compared with the
others: `Mande` carried « À travers le temps » and `Bassa` did not; `Bassa`
carried « Lequel cherchez-vous ? » and « Pourquoi le même nom ? », which no other
board had; `Ekpeye` folded its silence about dates into its three declared
silences while `Mande` spent a whole section on the same silence.

The artboards stay the reference **for the rendering** — type, density, inks, the
two-column desktop split. They never settled the sequence. This section does.

The page still reads in three rhetorical movements: answer, what the atlas
holds, and what it owes. They describe what the reader must understand; they no
longer define one rigid first-screen composition or one flat DOM order. The
executable block and zone contract is in §3 ter.

### I. The answer — always, in this order

| Block             | What it carries                                                   |
| ----------------- | ----------------------------------------------------------------- |
| Chrome and search | The searched name stays in the field: correcting it costs no step |
| The name          | The eyebrow « D'où vient ce nom », then the name, large           |
| **The verdict**   | **One sentence.** It is the answer, before anything else          |

The verdict is the page's only promise, and it exists in all five states —
including the one where the answer is « Nous ne connaissons pas ce nom ». A
result page that cannot be held in one sentence has not answered.

### II. What the atlas holds — in this order, each under its condition

| Block                            | Appears if                                            | Reference board |
| -------------------------------- | ----------------------------------------------------- | --------------- |
| Which one are you looking for    | Two or more entities answer to the name               | `Bassa`         |
| The appellations                 | The entity carries two forms or more                  | `Mande`, `Peul` |
| Where they come from             | At least one form has a documented origin             | `Mande`, `Peul` |
| What the peoples call themselves | The self-given name differs from the searched form    | `Mande`         |
| Why these names are a problem    | At least one form is declared pejorative or contested | `Peul`          |
| Who says what today              | The corpus records a split in contemporary usage      | `Peul`          |
| Through time                     | **The corpus dates at least one attestation**         | none, today     |
| What the atlas does hold         | Fewer than two of the blocks above are filled         | `Ekpeye`        |

Two rules govern that table, and they are what corrects the boards.

**A block never renders to say it is empty.** « À travers le temps » on `Mande`
and `Peul` holds one sentence stating that the atlas dates nothing — a whole
section spent on a silence. The silence moves down to movement III, where the
silences are gathered, and the section disappears until the corpus dates
something. This is also what §5 reported as "an empty band on every artboard":
the band was never missing data, it was a misplaced block.

**"What the atlas does hold" is a thin page's floor, not an ordinary block.** It
appears only when almost nothing else does, and it then hands the reader the few
verified facts — family, region, country, source count — so a sparse page stays a
page. On `Mande` it would duplicate "Aller plus loin".

### III. What the atlas owes — as one closing, in this order

| Block                       | What it carries                                                       |
| --------------------------- | --------------------------------------------------------------------- |
| What the atlas does not say | **Every** silence of the case, one per line, declared and never blank |
| The conviction              | One sentence, chosen by the case, taken from the doctrine             |
| The invitation to correct   | An open door, on **every** page                                       |
| Going further               | The fiches, last — they are no longer the default destination         |

Three things the artboards did not do, and which become obligatory.

**The silences are gathered in one place when there is a concrete silence.**
`Ekpeye` declares three; `Mande` and `Peul` have one — the dates — loose in a
section of its own; `Bassa` has one — why the name is shared — buried inside
« Pourquoi le même nom ? ». Scattered, they read as holes; gathered, they read as
what they are, a declared state of knowledge. An unknown query does not invent
a dated-attestation silence about an entity the atlas does not hold.

**The conviction closes every page, not only `Bassa`.** « Un nom partagé n'est pas
une parenté » is the model: one sentence saying what the reader should keep
beyond the name they searched. It is the site's counterpart to the positive
message every social post now ends on, and it comes from the same doctrine — the
About page. Without it a rich page ends on a list of links, which is to say on
nothing.

**The invitation to correct is on every page, not only the poor ones.** `Ekpeye`
and `Introuvable` carry it because they lack matter; `Mande`, `Peul` and `Bassa`
do not carry it at all. Reserving the invitation for thin pages says the rich
ones are settled — exactly what "no appellation is crowned" refuses. A page
showing seven names is the page most in need of correction.

### Two columns have two reading orders

§3 bis states a sequence, and a sequence assumes one column. The three desktop
boards each resolved that differently — `Mande` put a dated silence in its right
rail, `Bassa` its conviction, `Ekpeye` its invitation beside a facts panel — so
the same grammar produced three different closings.

**The rule. Movement II may use columns; movement III is one full-width band at
the foot, in the grammar's order.** What the atlas holds can be read in parallel;
what it owes the reader is read in sequence, and a conviction sitting in a rail
beside an unrelated panel is not a closing.

**And the convictions do not change with the width.** A mockup that says
something different at 1280 than at 430 has stopped being one mockup, and
comparing the two proves nothing — the same reason the night variants are derived
by substitution rather than rewritten.

**A thin page keeps its measure in the band too.** `Ekpeye` and `Introuvable`
hold 720 px at 1280; their bands are centred on the same column rather than run
to the 900 px the rich boards use.

## 3 ter. The executable feed grammar

The top-level block vocabulary, in canonical order, is
(`src/lib/search/resultGrammar.ts`):

```text
lenses · verdict · appellations ·
answer-what · answer-origin · answer-names · answer-where · answer-next ·
answer-sources · fiche-link · shorts · plates · quiz · images · fiches ·
owed · further
```

**« Tout » is the answer.** When a subject carries an answer, the page is the
filters, then for each subject the six `answer-*` blocks in that order, then the
`fiche-link` button, then `owed` (conviction and invitation to correct). A block
with no data is absent; none is drawn to say it is empty. Where the fiche
declares no sourced speakers (a language, almost always a family), there is no
`answer-where`. A reviewed answer (`nameAnswers`) takes the place of the
automatic origin and carries its own sources; the sources of the page are one
line (`answer-sources`), never a badge after each sentence.

**Several subjects, one name.** The searched term stays the single `h1`; each
subject then answers with its own six blocks (an `h2` for its own name) and its
own fiche button. No subject is promoted over another. Two cases are told
differently (`src/lib/search/answerSubjectPlan.ts`), and each is a refusal of a
failure measured on the real page on 2026-10-07:

- **Two countries carrying the name are one answer** (`CountriesAnswer`, the
  mockup's `Congo`). « congo » reaches « Congo » and « République démocratique
  du Congo »; two full answers made the reader hold one while reading the other.
  The six blocks are drawn once: the eyebrow says how many States bear the name,
  the origin is said once when both fiches tell it (otherwise each reading is
  labelled with the country that tells it, never announced as a dispute between
  them), the names through time and the shares of the population sit under each
  country's own name, and the follow-up is the one a fiche wrote — a template
  (a former name, a migration) is about one country and cannot speak for two. A
  country is a subject of the name when its filed name holds the searched word
  as a whole word, and only after an exact country match
  (`selectNameSubject`).
- **A family and the peoples filed under its name are one answer and a choice**
  (the mockup's `Bantou`). The people whose own `languageFamilyId` is the
  family's, or that is filed under exactly the family's name (PPL_BANTU names
  the parent family, so the name is all the corpus offers), is not drawn as a
  second answer: « Que cherchez-vous ? » offers the
  family and its peoples as two cards at the same weight, and the speakers block
  ends on « Voir les N peuples », N being the family's people count from the
  data — nothing in the copy is a number. A people that merely resembles the
  name is never folded.

**What left « Tout ».** `shorts`, `plates`, `quiz`, `images` and `fiches` are
what the filters show. `origins`, `peoples`, `shared-name`, `tiles`,
`atlas-holds`, `problem` and `near-name` no longer exist: their job is done by
the answer blocks and by several answers side by side. `verdict`,
`appellations` and `further` remain only for the pages with no answer to give.

**The filters are dynamic.** « Tout » is always there; Shorts, Récits, Images,
Jeux and Fiches appear only when they have content, each with its count, never
with a zero. A filter replaces the answer by its shelf under one heading about
the name, with a way back. The shorts shelf separates « Sur ce nom » (a piece
made on the searched name or word: relation `exact` or `word`) from « Autour de
ce nom » (context).

`owed` is one top-level block because it is one rhetorical closing; its parts
are, in order:

```text
silences · conviction · invitation
```

The page and the screens expose these identities through `data-feed-block` and
`data-feed-part`. The page is one reading column (880 px at most from 1200 px)
and is left-aligned as a block, like an atlas record's parchment (brand charter
§8.1).

The exceptional states are explicit:

- a published word with no fiche is answered by its record: the same blocks
  without `fiche-link`, under the filters, never the confession;
- a typo with useful leads opens on the verdict and the choices and closes with
  `further` only;
- a genuinely unknown query opens on the verdict and closes with `owed`
  (`conviction` and `invitation`), then `further`;
- related results with no entity answering the name (and a family or country
  browse) open on the verdict and list the fiches; they close without `owed`.

The checked-in manifest (`docs/design/mockups/search-answer/manifest.json`)
records, for each of the seven validated screens, the ordered block identities;
it is generated from the screens' `data-feed-block` attributes and is never
edited by hand. `resultGrammarCharter.test.ts` holds it to the grammar, and
`e2e/search-answer.spec.ts` holds the real page to the screens at 320, 430, 768
and 1280 px.

### A word we hold a piece on, 2026-09-25

A reader can type a word that no entity answers to — « zombie », « vodun »,
« ethnie » — because we made a piece on it. That query has no fiche. Measured
against the live search on 2026-09-25, it ends in the `widened` state far more
often than in the `unknown` one: the search returns related fiches for almost
any word (« mami wata » finds ten), and `unknown` is only a query that finds
nothing. The state does not change in either case, and the closing it owes is
unchanged. What changes is one sentence and one shelf, in both states.

- **The verdict does not confess.** « Nous ne connaissons pas ce nom » is a
  claim about what we hold, and the piece drawn directly under it would
  contradict it — the failure §3 records for a confession drawn over results.
  It reads instead « Nous n'avons pas de fiche pour ce nom, mais nous avons une
  vidéo sur son origine. » What we lack is said; what we have is said.
- **The piece takes the shelf, not the empty slot.** The slot that says « Pas
  encore de short » exists for a name nobody has told yet; beside a piece on
  that very word it would say the opposite of what the shelf shows. A `widened`
  page with no entity blanks every shelf so nothing unrelated sits under it;
  the piece found by the reader's word is kept, because it is the one shelf
  item that is not unrelated. Found on the live page, where the unit tests had
  passed: the piece was in the API response and absent from the page.
- **It is not a widening.** A production found by the reader's word answers it,
  as an exact match does, so it carries no « autour de ce nom » note and no
  relation label.
- **A word is matched whole, never by prefix.** « zomb » is not a word we
  filed, and a page that answered it would be guessing.
- **A misspelling is not a word.** A query that names a piece is `unknown`,
  never `typo`, even when near names exist.

What this section does not settle: no board draws this case yet. Its rendering
awaits operator review and new baselines, per the rule at the top of this file;
until then the behaviour is held by `SearchFeed.test.tsx` and the classification
by `searchFeedPlan.test.ts`.

### What the first correction established, 2026-09-18

**All twenty v1 boards conformed**: five cases by four variants — mobile and
desktop, day and night. They are now superseded visually by the forty v2 feed
boards, while the rhetorical corrections below remain binding. What changed,
and what the first pass cost:

| Board         | What changes                                                              |
| ------------- | ------------------------------------------------------------------------- |
| `Mande`       | "Through time" becomes a silence; gains the conviction and the invitation |
| `Peul`        | the same                                                                  |
| `Ekpeye`      | gains the conviction; its three silences are already in the right place   |
| `Bassa`       | its silence moves up into the silences block; gains the invitation        |
| `Introuvable` | « En attendant » takes the name "Aller plus loin"; gains the conviction   |

Two things only a render could have caught, both recorded because a future pass
will hit them again:

- **Three boards ended up asking for a correction before saying what they stand
  for.** The insertion anchored on « Aller plus loin » without seeing that an
  invitation already sat there. The markup read as correct in every diff.
- **The boards grew by about a third**, and a board declares its height in two
  places — its own wrapper and the canvas index. An estimate would have clipped
  them in silence, so every height is measured from a render.

The artboards and this section no longer disagree.

## 4. What the layout settles

**Mobile is the reference width**, 430 px, as everywhere in this project. Desktop
is 1280.

**A rich page goes to two columns on desktop** — the forms and their origins on
the left, what the peoples call themselves and the silences on the right.

**Disambiguation is what desktop serves best**: the three Bassa cards side by
side, which mobile can only stack.

**A thin page does not spread.** `EkpeyeDesktop` keeps a 720 px measure at 1280
and lets the whitespace say there is no more to say. Inflating a sparse page to
fill the viewport is the failure this rule exists to prevent.

**The night variants are derived by token substitution, never rewritten.** The
two versions have to stay the same mockup, or comparing them proves nothing about
the theme. Every value comes from the `--afh-night-*` group of
`src/styles/tokens/color.css`.

## 4 bis. What the corpus can actually fill

`search-result-data-shape.md` measures it, class by class, and two of its
findings change what this charter may promise.

**Four classes store their naming under four different keys** — peoples under
`content.appellations`, countries at the root plus `content.historicalNames`,
families under `content.decolonialHeader`, patronymes under `spellings[]` and
`origin`. A page with one promise reads five shapes to keep it.

**The appellations list is fully renderable on fewer than a quarter of
peoples.** Of 3 127 exonyms, 75.4 % are bare forms; the qualifier the boards
show beside each one lives, where it lives at all, _inside_ the form string, in
677 distinct free-text values. **So the qualifier is shown when the corpus
carries one and omitted when it does not — never parsed out of the form, never
invented.**

And the boards over-represent: `Mande` and `Peul` sit in the 23 % whose every
exonym is qualified. The ordinary case — a people with four exonyms and no
qualifier, 56 % of the corpus — has no board.

## 5. What the page cannot deliver yet

Two blockers measured 2026-09-17, both visible as an empty band on every artboard:

- **The corpus dates almost no attestation — for four classes out of five.**
  Measured 2026-09-18 (`search-result-data-shape.md`): not one of the 774
  peoples, 25 families, 39 languages or 796 patronymes dates a single
  attestation. **All 54 countries date theirs**, across six named eras, at
  100 %. So « À travers le temps » is not a dead block: its condition is per
  class, and the mockups — which draw four peoples and a disambiguation — drew
  the four classes that cannot fill it.
- ~~**No gate guards the competing appellations.**~~ **Closed 2026-09-18.**
  `competing-appellations` in `checkEditorialRules.ts` now asks every
  ethnographic fiche to have _decided_ about the names it is known by besides
  its own — reading `exonyms` on a people and `historicalAppellations` on a
  family, and asking for the origin wherever forms exist.

  **It does not demand an exonym**, because a people known by one name only is a
  truth this atlas publishes and `Ekpeye` is the board drawn for it. What it
  demands is that the question was asked: an empty list is a declared silence, an
  absent key is nobody having looked, and the page cannot tell those apart.

  **The corpus is at zero, so the findings are errors and there is no ratchet.**
  Three fiches failed it when it shipped, and all three were correctable from
  prose they already published. `PPL_KABYLE` never declared the field while its
  own sourced paragraph named two outside forms — « Kabyle », the Arabic
  _qabāʾil_, and « Zwawa », used since Ibn Khaldoun; they say Iqbayliyen. The
  other two were not incomplete at all: each listed **its own name** as a
  competing appellation, with a note in brackets, which is a people known by one
  name mis-encoded as a people known by two.

The first says where the work starts. The second no longer does.

## 6. The accent of each kind of answer

Ruled 2026-10-07. The answer page and the result cards both colour a subject by
what it is, and until now they did it from two tables that disagreed: a language
was terre on a card and periwinkle on the page, a family periwinkle on a card
and ocre on the page. **A kind that wears two colours teaches nothing**, so the
assignment is one: `SEARCH_ENTITY_ACCENT` for the kinds a card carries,
`SEARCH_ANSWER_ACCENT` (same file, read by the answer blocks through
`ANSWER_ACCENT_CLASS`) for the page. Both name a `.afh-accent-*` scope class
from `src/styles/tokens/color.css`, never a colour; the blocks read
`var(--accent)` and `var(--accent-ink)` (brand charter §5.2).

| Kind             | Page accent        | Why                                                                                   |
| ---------------- | ------------------ | ------------------------------------------------------------------------------------- |
| `people`         | `afh-accent-ocre`  | The brand's own hue, as on the people fiche                                           |
| `country`        | `afh-accent-teal`  | The cartographic entity, as on the country fiche and the mockup's `Congo`             |
| `language`       | `afh-accent-perv`  | Under its family, as on its fiche; the eyebrow says which of the two it is            |
| `languageFamily` | `afh-accent-perv`  | The mockup paints the family card of `Bantou` periwinkle                              |
| `patronyme`      | `afh-accent-terre` | The mockup paints `Camara` terre; a name must not read as a people, country, language |
| `word`           | `afh-accent-ocre`  | A word is no corpus entity: it takes the brand's ocre                                 |

Two differences from the cards are declared, not accidental. A language card
moves from terre to periwinkle to agree with the page and the fiche. A family
name stays neutral on a card (ETNI-1463: a name is not a fifth entity kind and a
list of results should not paint it) and takes terre on its own page, because a
page needs one accent and the reviewed rendering gives it terre. **One accent per
page** holds: the six blocks of an answer share the subject's scope, and the
only nested scope is a card that leads to an object of another kind and says so
(`Que cherchez-vous ?`: the family card periwinkle, the peoples card ocre).
`searchAnswerAccentCharter.test.ts` holds the table.

## 7. The reading measure

Ruled 2026-10-07. The mockup is a 430 px board, so it settles nothing past
430 px; the rule is the page's own. **Every answer block holds
`--afh-measure-prose` (65ch) and sits left-aligned in the page's 880 px
column**, as one reading column, from 768 px up. Measured on the real page for
`peul`, `bantou`, `congo`, `lingala`, `camara` and `pharaon`, a wrapped
paragraph averages **46 to 75 characters a line at 768 px and 53 to 74 at
1280 px** (the line ends ragged, so the mean sits under the cap) — the
about-70 the rule asks for, without ever stretching with the viewport. Below
768 px the line is the screen minus its 16 px gutters (22 to 46 characters at
320 and 430 px), which is a smaller measure, not a failure of this rule.

What this prevents: a prose block that follows the width of the page, which at
1280 px is a line of 110 characters that the eye loses on the way back. What it
does not do: widen a thin page to fill the viewport (§4), or centre the column
— the block is left-aligned like a record's parchment (brand charter §8.1).
`e2e/search-answer.spec.ts` fails a wrapped paragraph that averages past 80
characters a line at 768 and 1280 px.

## 8. Touch targets

A control is 44 px high and wide at least, at 320 and 430 px: the filter tabs,
the « Lire la suite » and « Voir les N peuples » links, the choice cards, the
fiche buttons, the sources button. A text link on its own line grows to 44 px
through `ANSWER_TEXT_BUTTON` without changing its look; a link inside a sentence
is exempt, as WCAG 2.5.5 allows. Measured on the real page on 2026-10-07 at 320,
430, 768 and 1280 px for the six cases above, no control was under 44 px;
the rule exists so the next block cannot be the first, and the e2e spec asserts
it on every case at 320 and 430 px.
