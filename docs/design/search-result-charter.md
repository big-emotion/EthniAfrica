# The search-result charter — what a name page owes its reader

Settled 2026-09-18, on the reorientation recorded in
`docs/editorial/essais/dou-viennent-les-noms-2026-09-17.md`.

Updated 2026-09-19 by REQ-180 and DEC-058 after the result was recomposed as a
feed.

**The reviewed rendering is local and executable.** The forty approved boards
live in `docs/design/mockups/search-feed/`: ten cases, mobile and desktop, day
and night. The external canvas is provenance for the review, not an
implementation dependency.

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

**No appellation is crowned.** Every form the corpus holds is shown, **the most
common first**, each with its origin attributed to its source. The component
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

The top-level block vocabulary, in canonical mobile order, is:

```text
lenses · verdict · appellations · shorts · origins · peoples · shared-name ·
tiles · atlas-holds · plates · quiz · images · problem · near-name · fiches ·
owed · further
```

`owed` is one top-level block because it is one visual and rhetorical closing.
Its independently testable parts are, in order:

```text
silences · conviction · invitation
```

The page and the boards expose these identities through `data-feed-block` and
`data-feed-part`. Bassa uses `shared-name`; `problem` is reserved for a recorded
naming problem or disagreement.

The exceptional states are explicit:

- an exact or widened subject closes with `owed`, including `silences` only
  when a concrete silence can be derived;
- a typo with useful leads closes with `further` only;
- a genuinely unknown query closes with `owed` containing `conviction` and
  `invitation`, then `further`;
- `lenses` appears after an answered query when at least one filterable content
  group exists;
- `shorts` appears for every answered query, and an empty source slot is
  content rather than an empty block.

Below 1200 px, intermediate blocks occupy the `primary` zone in canonical
order. At 1200 px and above, rich boards may split them between `primary` and
`secondary`; order is asserted within each zone, never by flattening the two
columns. Desktop-thin boards remain one centred `primary` column. `verdict` and
the opening blocks occupy `first`; `owed` and `further` occupy `closing` after
all intermediate zones.

The checked-in generated manifest records the case, variant, query, result
state, ordered block identities and zones, `owed` parts, board dimensions and
the first-poster rectangle. The case source and generator author it; the JSON
is generated output and is never edited by hand.

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
