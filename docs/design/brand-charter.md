# Brand charter — what the atlas is, before it is a page

The charters beside this one each govern one surface. `atlas-charter.md` says
what the map may assert, `typography-charter.md` what a size means,
`actions-charter.md` what shape a click takes, `games-charter.md` what the
Jouer hub owes. Each is excellent at its own scope, and none of them answers
the question a reader asks in the first two seconds: **what is this, and who is
speaking?**

That question has been answered four different ways in the codebase at once,
and this file exists to answer it once. It sits above the surface charters: a
rule here binds all of them, and where a surface charter is silent, this one
still applies.

Companion charters: [`atlas-charter.md`](./atlas-charter.md) ·
[`typography-charter.md`](./typography-charter.md) ·
[`actions-charter.md`](./actions-charter.md) ·
[`games-charter.md`](./games-charter.md).

---

## 1. One name, and it comes from one file

The product currently answers to four names, depending on where a reader looks:

| Where                                                                                                                                                                                      | What it says                           |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------- |
| `PRODUCT_NAME` (`src/lib/brand.ts`) — masthead, tab titles                                                                                                                                 | **EthniAfrica**                        |
| `API_ATTRIBUTION` (`src/api/v2/utils/response.ts`), every OpenAPI example, `CitationBlock`'s default, the admin sign-in page, `/fr/signalements` titles, every `src/styles/**` file header | **Africa History — africahistory.org** |
| `CANONICAL_DOMAIN` (`src/lib/brand.ts`)                                                                                                                                                    | **ethniafrica.com**                    |
| The address the site is actually served from                                                                                                                                               | **africatlas.com**                     |

A reader who cites a fiche is handed one name; the tab above that fiche shows
another; the URL they copy is a third; the canonical link tells a crawler about
a fourth. On a project whose entire argument is provenance, the publisher of
record cannot be ambiguous — a citation that names a site nobody can reach is
not a citation.

**The rule.** The product name, its qualifier, its canonical domain and its
attribution string are read from `src/lib/brand.ts` and from nowhere else. No
component, no route, no API response and no stylesheet header states a name of
its own. `API_ATTRIBUTION` composes itself from `PRODUCT_NAME` and
`CANONICAL_DOMAIN`; a test asserts that no other spelling of the name survives
in `src/`.

**The value, ruled on 30 August 2026: the product is `EthniAfrica`, qualified
`Atlas des Peuples d'Afrique`.** Both already sit in `brand.ts` as
`PRODUCT_NAME` and `PRODUCT_TAGLINE`, so the decision costs no new constant —
it makes the other four spellings wrong, which is the point.

**The qualifier was replaced on 17 September 2026: `D'où viennent les noms des
peuples d'Afrique`.** The reorientation onto onomastics
(`docs/editorial/essais/dou-viennent-les-noms-2026-09-17.md`) makes the site
answer a question rather than announce a category, and the qualifier is where a
reader meets that question first. `Atlas des Peuples d'Afrique` named what the
product _is_; the new one names what it _does_, which is the only thing a
stranger scrolling a feed can act on. The name itself is untouched.

**The qualifier was narrowed out of `peuples` on 20 September 2026: `D'où
viennent les noms d'Afrique`.** The publishing format asks the same question of
five kinds of name — a people, a country, a place, a family name, a language —
and a qualifier that says "peoples" tells a reader who arrives for a country or
a surname that this is not their site. `OG_DESCRIPTION` follows: it opens on the
question, keeps the six corpus classes behind it (`siteDescription.test.ts`
still holds it to the registry), and closes on « sans trancher », the project's
rule that it presents sources and does not rank them. `brandQualifierCharter.test.ts`
now refuses `peuples` in the qualifier and in the description's question, and
the retired wording joins the list of spellings no source file may print.
The classes the description enumerates are unchanged, and so is
`translations.*.subtitle`, which sits under the question on the share card and
already enumerates them.

**Two spellings fell out of that swap, and both are what this section exists to
catch.** The browser tab kept a literal — `EthniAfrica | Dictionnaire des
Ethnies d'Afrique` — so a reader opening the tab and a reader seeing the shared
link were told the product was two different things; it now reads `OG_TITLE`,
which its own doc comment already claimed it did. And the slogan was written
with a straight apostrophe in four constants while the home `h1` used the
typographic one, so the product spelled its own slogan two ways on two
surfaces. **The slogan is an identity string and takes `’` everywhere.** The
wider copy base is genuinely undecided — measured 2026-09-18, 197 typographic
against 219 straight — and settling that is its own pass; an identity string
does not wait for it.

The lesson the second one leaves: `OG_TITLE` is now **composed** in its test
from `PRODUCT_NAME` and `PRODUCT_TAGLINE` rather than restated. A literal
duplicating a constant went stale twice in two days, and each failure reported
only that two strings differed — never which of them was wrong.

**The qualifier was replaced on 21 September 2026: `L'histoire des noms, avec
leurs sources`.** The operator's reason: a name tells the history of the people
who carry it, and the project gathers that history, with the sources it rests
on, so that the people who decide about the continent later can do so knowing
it. `D'où viennent les noms d'Afrique` announced a question; the new qualifier
says what the site holds and how it holds it, and it puts the method — the
sources — in the title where a reader scrolling a feed can see it. The same
string is the bio of every social account, so a card and the profile it comes
from introduce the product in one wording.

Three consequences, each already paid for once:

- **The masthead carries the head of the slogan, not the slogan.** The bar
  leaves the lockup about 200 px on a phone (see `SiteHeader.test.tsx`), so the
  header reads `L'histoire des noms` (`The history of names`). The 39-character
  form stays on the footer, the share card and the tab.
  `brandQualifierCharter.test.ts` holds the French masthead to the opening of
  `PRODUCT_TAGLINE`, and both locales to 24 characters.
- **`OG_TITLE` is composed** from `PRODUCT_NAME` and `PRODUCT_TAGLINE` in
  `brand.ts` itself. It was a second literal of the qualifier, which is how the
  test above had to compose it to catch a stale one.
- **The render engine keeps a copy**, `TAGLINE` in `social/harness/ethni_brand.py`,
  because Python cannot import `brand.ts`. The same test now reads it and
  refuses any difference. The slogan is 491 px wide at the video lockup's
  1080 px measure, against 366 px before, and the lockup's own guard (under
  55 % of the frame) still holds. Productions already rendered keep the old
  qualifier and are not re-rendered for this alone.

**Aligned the same day.** `OG_DESCRIPTION` opens on « Chaque nom raconte une
histoire. » and keeps the six classes behind it, and the About page's lead reads
« EthniAfrica raconte l'histoire des noms, avec leurs sources » (« tells the
history of names, with their sources » in English). The test that required the
description to open on a question now requires it to open on what a name holds,
and still refuses `peuples` there. Every sentence that says what the site is now
says the qualifier's promise.

**The qualifier was replaced again on 22 September 2026: `L'Afrique à travers
ses noms`.** `editorial-and-experience-plan.md` (C1) moved the site's opening
promise from the method — `L'histoire des noms, avec leurs sources`, ruled the
day before — to the discovery itself: a reader meets the continent through its
names before meeting how the project handles them. The operator chose it
explicitly over keeping the method-first wording, and ruled that this slogan is
now the one string the product introduces itself with everywhere, including its
social bios — not only the site.

That collided with a rule this file had not anticipated: the masthead carries
only the _opening_ of the qualifier, held to 24 characters
(`brandQualifierCharter.test.ts`), and no true prefix of the new 28-character
slogan both fits that budget and reads as a complete phrase — `L'Afrique à
travers ses` cuts the sentence off mid-possessive. Two ways out existed without
touching the ceiling: truncate anyway, or drop back to the name alone in the
masthead, undoing the 21 September fix for exactly the defect it existed to
close (REQ-114: "with nothing saying what EthniAfrica is"). The operator ruled
neither — **the ceiling itself was raised to 28, and the masthead now carries
the slogan in full.** `chromeCopy.fr.headerTagline` reads `PRODUCT_TAGLINE`
directly rather than repeating it, since the "short form" and the full slogan
are now the same string and a second literal would be exactly the duplication
§1 of this file forbids.

**Aligned in the same pass**, the same way the 21 September change was: the
About page's lead — `EthniAfrica raconte l'Afrique à travers ses noms` (`tells
Africa through its names` in English) — and the render engine's `TAGLINE` in
`social/harness/ethni_brand.py`. `OG_DESCRIPTION` was left untouched: it still
opens on the six-class enumeration `siteDescription.test.ts` gates, which the
plan's own proposed description would break, and revising that gate is its own
pass, not a consequence of the slogan change. Productions already rendered
keep the retired qualifier and are not re-rendered for this alone.

**Left as it was, on purpose: the question at the level of one name.** « D'où
vient ce nom ? » remains the label of a fiche section, the eyebrow of the result
page, the home hero's question and the title of a video about one name. Those
are the reader's question about a name, asked where the answer sits — not the
site's promise about itself, which is what this section governs.

`Africa History` is retired, and with it `africahistory.org`. It was an English
name on a product that then existed only in French, and it survives today only in
places a reader reaches by accident: an API payload, a citation, a stylesheet
header.

**Where the name comes from, recorded 2026-09-14 because a reader can ask.**
The project started as a plan to catalogue every ethnie of Africa — a
dictionary of African ethnicities — which is the literal source of "Ethnie" +
"Afrique". Partway through, the operator noticed two things the corpus itself
now documents: "ethnie" is a word applied disproportionately to African
peoples specifically, rarely to European ones, which is exactly the kind of
naming asymmetry the atlas exists to surface; and "Afrique" is itself an
exonym, probably from the Latin name of a North African people, the Afri (the
atlas's own 2026-09-05 "Afrique — le nom du continent" piece). So the
product's name is not a neutral label chosen from outside the project's
subject — it is built from the same kind of word the atlas interrogates, on
purpose, kept as the starting point of the inquiry rather than a settled
position. A reader who asks "why is it called that" is asking the same
question the atlas asks of every name it documents, and the honest answer is
this one.

One thing this section still does not settle: `CANONICAL_DOMAIN` is
`ethniafrica.com` while recette is served from `africatlas.com`. The name
decision is consistent with the constant, so the constant stands — but the
production domain has not been verified against it, and if it differs, the
canonical link is pointing somewhere the site is not.

---

## 2. The promise, and the one place it is currently broken

**Scoped social extension, 2026-09-25:** the operator approved
[Mémoires sonores](gabarits-social/MEMOIRES-SONORES.md) within EthniAfrica,
exclusively on TikTok and Instagram. Those accounts may have a broader musical
and cultural remit than the website. The requirement above to repeat the site's
name-focused slogan in every social bio no longer governs these two profiles;
their exact replacement display names and bios remain pending. The EthniAfrica
brand, website positioning and other accounts are unchanged.

The atlas asserts three things, in this order, and every surface either serves
them or is decoration:

1. **It names peoples, languages, families and countries** — one record each.
2. **Every claim carries its provenance**, tiered and visible, including the
   weak ones. Nothing is forbidden; everything is labelled (see the Source Tier
   policy in `CLAUDE.md`).
3. **It is open.** The corpus is citable and reusable.

The third is contradicted on every page of the site. The footer prints
`© <year> EthniAfrica. Tous droits réservés.` while the API meta and every
citation the site emits declare **CC-BY-SA 4.0**. A reader is told the content
is share-alike by the citation block and all-rights-reserved by the footer four
hundred pixels below it.

**The rule, ruled on 30 August 2026: the corpus is CC BY-SA 4.0**, which is
what the API meta and the citation apparatus have been declaring all along. The
footer states that licence instead of reserving rights, and the legal notice
states what it covers.

Three distinctions the licence line has to keep, because collapsing any of them
is how the current one became wrong:

- **The content is licensed; the code is not, yet.** They are separate works and
  nothing obliges them to share a licence. `LICENSE.md` grants CC BY-SA 4.0 over
  the corpus and the site's own editorial text, and says in as many words that
  it grants nothing over the source code — which stays reserved until that is
  ruled on separately.
- **A third-party source keeps its own licence.** A quotation, an official
  figure, a Wikimedia image: their terms travel with them and the site's licence
  does not reach them. This is the same doctrine as the Source Tier policy, one
  layer up.
- **Facts are not the database.** Individual facts carry no copyright, and the
  EU _sui generis_ database right protects a substantial compilation separately
  from copyright. The legal notice says so rather than leaving a reuser to guess.

Why share-alike rather than plain attribution: the corpus is a claim about
peoples who have rarely held the rights to descriptions of themselves, and
`SA` is the clause that keeps every derivative reusable by them. It also keeps
the site compatible with the CC BY-SA media it already hosts — the Maloti
photograph on `/fr/dossiers/anecdotes` among them. `NC` was rejected: it
reads as protective and in practice excludes Wikipedia, excludes commercial
African media and publishers, and would conflict with that same media.

---

## 3. Voice

Two languages, one voice. In French: `vouvoiement`, present tense. In English,
which has no `vouvoiement`: present tense, declarative, British spelling, and
**no contractions in editorial prose** — _does not_, never _doesn't_ — with the
second person only where the French uses it. The French addresses the reader in
error states, consent and the report dialogs, and nowhere in a fiche, so the
English fiche never says _you_ either. Both registers are declarative and
specific — the surface states what the corpus holds and what it does not, and
never advertises. Ruled with ETNI-1831: a contraction reads as marketing copy
on a page that must read as a record, and a second Voice section would be the
place where the two registers drift apart, which is why there is one.

Three habits carry the decolonial posture, and they are visual as much as
editorial. They do not translate: an autonym is the same string in both
locales and keeps its `lang`; the exonym's gloss is the one thing that changes
language.

- **The autonym leads, the exonym glosses it.** Enforced in components by
  `afh/no-bare-people-name`; enforced typographically by the rule that the
  gloss sits one role below the name inside the same heading
  (`typography-charter.md` §3.2).
- **A colonial name is kept and explained, never quietly dropped.** It receives
  the imposed-exonym marker, which is why terre is reserved inside a fiche
  (`atlas-charter.md` §2).
- **An absence is stated, not hidden** (`atlas-charter.md` §4).

**A silence is not humility.** A hub that lists five modules and marks three
**Bientôt**, a facet that fronts a paginated table, a landing band that carries
135 px of copy in 760 px of ground — each of these is the interface telling a
reader the corpus is thinner than it is. 803 peoples and 54 countries is not a
thin corpus. Where a surface has to choose between advertising scarcity and
showing the work, it shows the work.

---

## 4. One token spine

Two colour systems are live in `src/` and which one paints a given element is
accidental:

- the **`--afh-*` layer** — hex, two-tiered (raw ramp → semantic alias),
  documented in `src/styles/tokens/color.css`;
- the **shadcn layer** — HSL triplets in `src/index.css` (`--foreground`,
  `--accent`, `--primary`…), inherited with the `ui/` primitives.

They are not aliased to each other, and they disagree. `--afh-text` is
`#2c2018`; shadcn's `--foreground` is `hsl(25 25% 15%)` = `#30251d`. Both paint
`h1`s in production: the home takes the first, every fiche and facet takes the
second. `--accent` holds the HSL triplet `42 88% 58%` while `--accent-ink`
holds the hex `#835514` — the same word naming two incompatible kinds of value,
which is how `afh-on-night` combined with `afh-accent-*` once produced an
invalid colour.

**The rule.** `--afh-*` is the spine. The shadcn variables are an
implementation detail of `src/components/ui/**` and each one is **an alias onto
an `--afh-*` token**, never an independent value. Nothing outside `ui/` reads a
shadcn variable. A component that needs an ink asks for `--afh-text`; a
component that needs the surface accent asks for `--accent-ink` or
`--accent-tint`, both of which are hex.

Three tiers, and a token belongs to exactly one:

| Tier          | Example                                       | Who may read it                             |
| ------------- | --------------------------------------------- | ------------------------------------------- |
| **primitive** | `--afh-color-terracotta`, `--afh-cat-teal`    | the semantic tier only                      |
| **semantic**  | `--afh-text`, `--afh-bg-warm`, `--accent-ink` | any component                               |
| **surface**   | `--country-*`, `--people-*`                   | that surface only, with a ticket against it |

The surface tier is a holding pen, not a scale — `typography-charter.md` §6
already says so for type, and it holds for every axis.

---

## 5. Colour

### 5.1 The ground is parchment. That is the brand.

`--afh-bg` `#fbf7f2` and `--afh-bg-warm` `#f5ede0`, with `--afh-surface` white
for anything that has to lift off them. The warm paper is the single most
recognisable thing about the product and it is never traded for a neutral grey.

The night ground `--afh-night-*` is licensed by DEC-022 for **the atlas stage
only** — the globe band on a fiche. It is not a theme, it is a stage light. Any
other block that goes dark is out of scope and needs its own decision.

**Découvertes is the second stage** (operator ruling, 2026-09-14). The operator
asked for the behaviour of a Reel: one publication per screen, black edge to
edge, over the site chrome. Built first as a 612 px night frame under the
masthead and over the footer, the reader was neither the parchment site nor the
Reel a visitor arrived from — a card in a document, with its actions in two rows
of buttons below the fold. So that route draws no masthead, trail or footer; the
whole viewport is `--afh-night-ground`, the browser's own interface is tinted to
match, and the reading carries its own way out — a rail of destinations from
1200 px, a _Parcourir_ sheet below. The licence covers that stage and nothing
opened from it: its sheets stay on parchment, because a source list is a
document. Gated by `discoveriesImmersiveCharter.test.ts`.

**DEC-058 licenses the search-result feed's night variant as a third scoped
surface.** It is a theme variant of the same feed, never the route's default and
never a licence for a global dark theme. It substitutes the documented
`--afh-night-*` ground, surface, warm and ink roles while preserving the same
manifest, copy, media and block geometry as day. The light verdict surface and
light contribution action remain light with dark text because their role is a
quoted answer and an open door, not an extension of the stage ground. Source
apparatus opened from the feed remains a parchment document, as it does from
Découvertes. REQ-180's day/night structural comparison holds this scope: a
night board that changes content or order is a different page, not a theme.

### 5.2 Four categorical accents, and a surface takes one

`--afh-cat-ocre` `#c9821f` · `--afh-cat-teal` `#33a390` ·
`--afh-cat-terre` `#c4573f` · `--afh-cat-perv` `#7a8ce8`, each with a `-tint`
and an `-ink`. The `-ink` exists because the base hexes are fills: accent text
on an accent tint measures 2.28:1 to 3.09:1 and fails AA.

`atlas-charter.md` §2 already governs _which_ accent a surface takes, and it
turns on the doctrine that **a component never names an accent** — it reads
`var(--accent)`, and a page-level `.afh-accent-*` wrapper resolves it.

That doctrine is **already met almost everywhere**, which a first count of
`.afh-accent-*` wrappers hid. Three of the wrappers on any route are the
masthead's own axis buttons — a legend in the chrome, not the page speaking:

| Route                                        | wrappers | masthead | the page's own |
| -------------------------------------------- | -------- | -------- | -------------- |
| `/fr/mentions-legales`                       | 3        | 3        | **0**          |
| `/fr/atlas` · `/fr/dossiers` · `/fr/jeux`    | 4        | 3        | 1, its axis    |
| `/fr/atlas/peuples`, and both fiches sampled | 5        | 3        | 2              |
| **`/fr`**                                    | **13**   | 3        | **10**         |

The second row describes a live surface again. ETNI-1555 removed the three
axis landing pages; the dossier index came back on 6 September 2026 for theme
discovery and search, and `/fr/atlas` and `/fr/jeux` came back on 7 September
2026 with the rest of them, on the shared spread this charter's §8.2 now
governs. The count above still records the _earlier_ surfaces — one wrapper,
the axis's own — which is what the spread reinstates rather than a measurement
taken of it.

So the rule holds on every surface but the home, and the home's ten are not
arbitrary either: the purpose rows carry the entity mapping (pays → teal,
peuple → ocre, famille → terre) and the axis cards carry the axis mapping
(L'atlas → ocre, Les dossiers → teal, Les jeux → perv). Those three labels
are `ACCESS_MODE_LABELS`; DEC-045 (ETNI-1614) renamed them from their
previous verbal register (Consulter, Enquêter, Jouer) to this nominal one.

What is wrong is that both are true at once. **The same hue teaches two
lessons within one scroll**: the masthead paints `Les dossiers` teal, and forty
lines down a `PAYS` chip and the "Trois pays" section are teal too. A reader
cannot learn a code that means two things on one page.

That is a decision about what a hue means, not a defect to patch — and it is
the one open question this section leaves.

**The rule.** _A page has one accent._ The `.afh-accent-*` wrapper is set once,
at the page level, and it is the axis's or the entity's colour. A nested
wrapper is legitimate only where the nested block **is** an object of another
kind and says so — an entity chip, a fiche card in a listing. Three sibling
blocks of the same kind take the page accent and are told apart by their
content, never by rotating through the palette: a colour that changes with
position carries no meaning, and a reader who cannot learn it reads it as
decoration.

### 5.3 The gradient is brand, so it is a token and it has a scope

The warm gradient paints the masthead tagline on every page and, through
`.page-title-gradient`, the `h1` of each axis hub and of the search page. It is
the most visible colour in the product, and neither of its stops was a token:
both lived as raw HSL in `index.css`, outside the palette that governs every
other colour.

**The rule.** The gradient is a **token**: `--afh-gradient-brand`, composed from
`--afh-brand-flame` and `--afh-brand-gold`. Those two are **mark colours, not
accents** — no surface takes them, no component reads them, only the gradient
does. `--gradient-warm` aliases it, because callers already read that name.

**Where it is allowed.** The masthead lockup, **the footer lockup**, a brand
mark on a share card, and **the title of a page that names an axis rather than
a subject**. That last one is a real distinction and worth keeping: `L'atlas`,
`Les dossiers`, `Les jeux` and `Recherche` name parts of the apparatus; `!Kung` and
`Afrique du Sud` name things in the world. A fiche title takes `--afh-text`.

**And a lockup gets one treatment, not one per surface.** The footer used to
paint « Atlas des Peuples d'Afrique » in a five-hue ramp of its own —
`--afh-gradient-spectrum`, sampled off `public/africa.png` — while the masthead
painted the identical string in this gradient. Two treatments of the same words
on one page do not read as one brand with range; they read as two things. The
ramp is retired and its token deleted rather than left declared-and-unconsumed,
which is the failure §7 records against `--afh-section-gap`.
`colorTokens.test.ts` asserts both halves: the footer qualifier resolves to
`--gradient-warm`, and no spectrum declaration survives in either theme.

**One treatment covers the geometry too.** The lockup is mark, then name to its
right, then qualifier under the name — the masthead's arrangement, which the
footer takes at twice the size rather than restating as a single column. Stacked
vertically the three parts sit at three heights and read as three things; the
block is also narrow enough that the footer rubrics beside it start at a quarter
of the measure instead of a third, which is the "mark stranded on the left"
complaint this étage has already been through once.
`siteFooterDirectory.test.tsx` asserts the arrangement.

**The cost this rule accepts.** The retired ramp was built to clear 4.5:1 on
`--afh-color-bg-warm`; the brand gradient's gold stop measures **1.52:1** on
that same ground (flame, the other stop, measures 3.13:1). Coherence was
preferred to legibility here because the masthead has shipped exactly this on
every route since the lockup existed — the footer was the outlier, not the
regression. Darkening `--afh-brand-gold` would fix both surfaces at once and is
the right ticket if the pale end proves unreadable; painting the footer a third
way is not.

An earlier draft of this section claimed the treatment was fragile, because it
sets `color: transparent`. **It is not.** The declaration sits inside
`@supports ((background-clip: text) or (-webkit-background-clip: text))`, the
element carries no hard-coded transparency of its own, and
`PageLayout.test.tsx` asserts exactly that. A browser without the feature gets a
plain title, which is the correct fallback and was built deliberately.

### 5.4 A primary action has one colour

Four were measured: the home's `Jouer` CTA and the facet's `Filtrer` take
`--afh-color-terracotta` `#b64e27`; the 404's `Rechercher une fiche` takes the
near-black ink; `/fr/comparer`'s `comparer` takes terracotta at reduced opacity
as its resting state.

**The rule.** A primary button takes `variant="accent"` and therefore the
surface's accent (`actions-charter.md` §4). `--afh-color-terracotta` is a
primitive of the classification palette and is not a button colour. A disabled
control is never the visual centre of a page: a page whose only action cannot
be taken needs a different first screen, not a greyed button.

---

## 6. Type

`typography-charter.md` owns the scale. Two things above it belong here.

**The display weight the charter names cannot be rendered.** It files every
heading role under "display 600", and `src/app/layout.tsx` loads Fraunces at
`300, 500, 700, 900`. A 600 request resolves to 700, silently.

Counted rather than assumed, the spread was smaller than it looked: **two**
declarations asked for 600 — `section-heading.css` and `DidYouKnow`'s motif
glyph — and everything else already sat on 700 or 900. There was never an 800
on the display family: `people-tokens.css` sets 800 on `.people-section-label`,
which inherits the **body** face, and Nunito Sans is loaded at 800.

**The rule.** Two display weights, both loaded, both meaning something:
**700** for every heading role, **900** for the page's own `h1` and for a key
figure. The charter's declared weight and the loaded set are asserted against
each other by a test, so the next weight added to one has to be added to the
other.

**A legal page does not outrank a fiche.** `Mentions légales` renders its `h1`
at 52 px — `--afh-text-hero`, the scale's top step — while `!Kung` renders at
40 px. The top of the scale belongs to the pages the atlas exists for.

---

## 7. Rhythm

**Vertical rhythm is a brand property.** It is what makes six unrelated
sections read as one document, and it is the axis with the least governance in
the repo today.

`--afh-section-gap` (24 / 32 / 48 px) is declared in `space.css` and documented
in `Spacing.mdx`. Before REQ-152, no fiche chapter consumed it; fiche chapters
now do, while the home cadence remains separate.

That does not mean the page is arrhythmic, which an earlier draft of this
section claimed. Measured on the rendered home, the bands **abut**: there is no
gap at all, and the cadence between two of them is the previous one's bottom
padding plus the next one's top.

| width   | cadence between the six bands  |
| ------- | ------------------------------ |
| 430 px  | 44 · 70 · 68 · 68 · 74 · 60    |
| 1440 px | 64 · 96 · 108 · 108 · 100 · 78 |

So it is near-regular in the middle and hand-kept at both ends, at roughly 68
and 104 — and nowhere near the token's 24 / 32 / 48. **Wiring the token would
move the most visited page in the product rather than describe it**, which is
why `space.css` now records both rows beside it instead. Reconciling them is a
design decision, and those are the numbers it needs.

The scale it would draw from cannot help either. `space.css` names seventeen
steps, eleven of them between 4 px and 24 px, at 2 px apart: `4, 6, 8, 10, 12,
14, 16, 18, 20, 24`. `actions-charter.md` §6 collapsed two radius tokens on the
grounds that **no reader can see two pixels** and a distinction nobody can
perceive is bookkeeping, not a sign. That argument applies unchanged here, and
the spacing scale is the place it was not applied.

**The rule.**

- **A ramp, not a ruler.** `4 · 8 · 12 · 16 · 24 · 32 · 48 · 64 · 96`. The odd
  steps (6, 10, 14, 18, 20) are deprecated in place the way the raw font sizes
  were: a register in `eslint.config.mjs`, one line per file, deleted as each
  is migrated, never added to.
- **Sections are separated by `--afh-section-gap` and by nothing else.** A
  band's own `padding-block` sets its internal breathing; the gap between two
  bands is the token. This is enforceable by a charter contract test that
  measures the rendered gaps between the top-level children of `main` on the
  home and the three hubs, and fails when a page shows more than two distinct
  values.

---

## 8. Composition

### 8.1 One alignment per block

Below 768 px `src/styles/mobile-text.css` centres text site-wide. The rule was
written for a band of one or two lines; it now lands on layouts built
left-aligned, and it is the single largest source of visual damage on a phone:

| page           | centred paragraphs over two lines |
| -------------- | --------------------------------- |
| a people fiche | **29**, the longest 21 lines      |
| the home       | 12                                |
| search         | 9                                 |

**And the mechanism is not what it looks like.** A facet card reads as though
it carried three alignments — name flush left, gloss centred, metadata flush
left, twenty times down one listing. Measured, every element in it computes
`center`. Nothing declares three. What produces three is that alignment only
shows on a box **wider than its text**: the full-width gloss centres, while the
shrink-to-fit heading (49 px) and metadata (30 px) sit at the left edge.

**One declaration produced three alignments, which is worse than three
declarations** — there was nothing to grep for, and no rule to point at.

**The rule.** Alignment is a property of a block, not of a viewport. A block is
centred or it is ragged-right, and every element inside it — eyebrow, title,
prose, metadata, action — obeys that one choice. **Running prose of more than
two lines is never centred**: a centred paragraph gives the eye no return edge,
and this is a site made of paragraphs.

The phone keeps the composed-page default on **headings**, which is what
`mobile-text.css` argues for and argues well. Centred titles over ragged-right
prose is the composition it gets. Two corollaries the first pass missed:

- `dt` travels with `dd`, not with the headings. A definition list is one
  block, and splitting the pair put « Population » in the middle of the search
  card with « 48 482 000 » under it at the left edge.
- A block carrying `text-center` made a **decision**, not an inheritance, and
  keeps it. Only the body-level default is overridden.

**An atlas record's parchment is exempt as a block** (operator ruling,
2026-09-12). Below the globe a record is one document of rounded chapters,
tiles and a timeline, and every one of them anchors on a left label. A centred
chapter heading above that grid gave each chapter two edges — the heading's and
the grid's — which is the §8.1 failure one level up. So `.afh-parchment` is
left-aligned whole, declared once in `mobile-text.css` beside the other
exemptions, never per component. The record's head above the globe is not in
the parchment and keeps the centred composition.

### 8.2 A band's height is earned by what is in it

`.home-hero` sets `min-height: min(100svh, 760px)`, centres its content, and
hides `.home-hero-figure` below 768 px. On a phone that is a 760 px band
carrying a 135 px block: **82 % empty parchment**, split above and below the
one question the product exists to answer. The height was earned by a
two-column composition that only exists from 768 px up.

`PageHero.tsx` records this exact failure being fixed — "a screen-tall band set
the title at the foot of a screen of empty parchment" — and fixes it in
`.afh-hero`, the band the home does not use.

**The rule.** No band measures itself against the viewport. A band's height is
its content plus its padding, floor included. Where a surface opts out of
`PageHero`, it states why in a comment and inherits this rule anyway — a
correction made to the shared unit is a correction to the doctrine, not to one
file.

**One exception, and it is measured, not asserted.** The axis hub's spread
(§8.6) takes a viewport floor **from 768 px only**. What the rule above forbids
is a height the content cannot fill, and the failure it names is arithmetic:
135 px of copy in a 760 px band. A hub's text column carries a title, the
sentence the header shows beside the same tiles, and five to seven tiles at
44 px each — it fills a screen at the width where the floor applies, and the
one place it would not is the phone, where the floor is not applied. Below
768 px the two blocks stack and each takes its content's height, which is the
same answer the rule gives everywhere else.

The floor is therefore licensed by a count, and the count is the condition: a
spread whose text column drops below four tiles has lost the thing that earned
the height, and takes no floor. `axisHubSpreadCharter.test.ts` holds both
halves — the floor is inside a `min-width` query, and every axis clears the
count.

### 8.3 Search leads the home; maps earn their place elsewhere

The home is a compact entry into a question, not a tour of the corpus
(operator ruling, 2026-09-23). Its reading order is search, a short invitation
to contribute, then the project's purpose and source policy. Featured answers,
stories, maps and counters no longer occupy this page.

Four examples introduce surnames, languages, peoples and countries. They are
drawn per visit and renewed on request. People examples use attested self-given
forms, never a filed exonym as an implicit recommendation. The selection stays
still while the reader chooses it.

On surfaces that do carry a map, it is above the fold or absent: a ninth-screen
map was the failure behind this rule. The home no longer carries a map.

Gated by `homeOrientation.test.tsx`, `homeHeroSeedsCorpus.test.ts` and
`e2e/home-search-first.spec.ts`.

### 8.4 One wait, one shape

A wait is the one surface with a single job: be read before it is taken away.
The site spends it on a `Saviez-vous que` fact — sourced, tiered, drawn from
the home's own bank — so a reader who navigates a lot ends up having read the
bank.

Three code paths render that wait, and they had drifted. The client overlay
(`RouteTransitionLoader`) painted the fact alone, below the measured masthead.
The two server screens painted a title plate, a trail, and — on a fiche — a
night stage floored at `--afh-globe-stage-height`. On
`/fr/atlas/pays/ZAF` the plate and the stage together filled the viewport:
the fact sat below the fold and was never read, on precisely the routes that
wait longest. The same click therefore produced two different waits depending
on whether the segment happened to own a `loading.tsx` — a governance failure,
not a local bug.

**The rule.** A wait renders the persistent chrome and the interstitial, and
nothing else: no title plate, no trail, no hero band, no globe stage. The
chrome is what must not move — masthead, search, footer stay mounted, so the
navigation never reads as a reload (REQ-098) — and everything that names a
page is withheld until the reader is on it. A wait names no place it has not
arrived at.

The continuity argument that put the band there is void: nothing in a wait
survives into the page it resolves into. The plate that says "Pays" is
replaced by the plate that says "Afrique du Sud", and the body is swapped
whole, so there is no still thing for a band to keep still.

Gated by `loaderCoverage.test.ts` (every wait screen, no page identity) and by
the counterpart clause in `heroCoverageCharter.test.ts`.

### 8.5 A group title must be able to be wrong

The anecdote band on the home draws two facts at random from the bank on every
request, and titled them **« Deux noms, deux histoires »**. The bank holds 24
facts, so the band has 276 possible pairs and that sentence describes a
fraction of them; on the rest it sat over an anecdote about a coastline, a
prefix or a migration and said something the reader could see was not the
case. It occupied the one slot that names the section, and it could not be
false, because nothing computed it.

This is the composition-level twin of the fiche rule already written in
`atlas-charter.md` §1: a predicate is only a title if there is a condition that
makes it drop. `« un peuple sans bord »` was true of all 924 peoples, so it
distinguished none of them; a title over a random draw is the same defect run
the other way — written for one draw, applied to every draw.

**The rule.** A section title states something about the section's actual
contents. Where the contents are drawn, filtered or otherwise unknown at write
time, the section takes an eyebrow and no title, and its items carry the
headings — `SectionHeading` renders no `<h2>` when given no `title`. A band
with no group heading does not leave a hole in the outline: its items move up
a rung, so the anecdote band contributes two `<h2>`s to the home rather than
one `<h2>` over two `<h3>`s.

**The eyebrow does not inherit the title's rank.** Promoting `Saviez-vous que`
to the `<h2>` while keeping its 12 px kicker dress would paint a heading three
roles below its own children — the inversion `typography-charter.md` §3 names
as a lie rather than a divergence.

**But it does inherit the title's job, so it is not left at the title's
kicker size.** The rule above takes the band's `<h2>` away; what it left
behind was a section whose only heading text was 12 px, over 30 px headlines
and 22 px body copy. The label of the band rendered two and a half times
smaller than the prose it governed, and read as a stray caption between two
articles rather than as the thing that made them one band — the reader met
two unrelated facts where the page meant to show a section.

An eyebrow that files a section with no title therefore takes
`--afh-text-small`, and moves nothing else: the dress stays uppercase, 600
and tracked at 0.16em, because a kicker that keeps only its size has become a
caption (`typography-charter.md` §1). The ceiling is the rank rule above —
`h3` and up would paint the kicker at the rank this section refuses it, so
the step exists to make the band legible, never to give it back the title it
is not allowed to have. `SectionHeading` marks the case itself, from the
absence of a `title`; no caller opts in, so no caller can get it wrong.

The band itself was retired on 2026-09-13: its anecdote now takes a third of
the hero's visual draw, one card, still filed by the kicker and still titled
only by its own headline. The home visual was retired on 2026-09-23; the generic rule remains gated by
`SectionHeading.test.tsx` (a title-less unit renders no
heading, is marked `is-untitled`, is sized at `small`, and is asserted never
to reach a heading role) and `homeOrientation.test.tsx` (the home's document
plan).

### 8.6 The axis hub is a spread, and it says only what the header says

ETNI-1555 deleted `/fr/atlas` and `/fr/jeux` for a reason that was true of the
band they carried, not of the pages: the band was viewport-tall and
bottom-aligned, so the reader met the masthead, a screen of empty parchment,
and the title of the page they had asked for somewhere past the fold
(`heroBandCharter.test.ts` records the measurement). The three axes then had no
address of their own — the trail printed a crumb that led nowhere, the sitemap
published nothing for them, and the footer had to name six corpus indexes
because there were no three doors to name instead.

**The rule.** An axis hub is a **spread**: two blocks side by side, the text on
one side and an archival plate on the other, and nothing else. No hero, no
band, no second section under it.

Four clauses, each closing one of the ways the retired hubs went wrong.

- **It repeats the header; it does not extend it.** The tiles are
  `getNavModules(axis)` and no more — the same set, in the same order, wearing
  the same glyph, label and **Bientôt** chip. A hub that lists what the menu
  does not is a second navigation for one axis, which is the defect
  `atlas-charter.md` §3 already names against the dossiers panel. The
  description is the header's own sentence (`menuBlurb`), for the same reason:
  the reader who opens the panel and the reader who lands on the page are owed
  the same account of what the axis holds.
- **The title names the axis, so it takes the gradient** (§5.3) and the page
  takes that axis's accent, once, at its root (§5.2).
- **Which side the text takes is drawn, per request, 50/50** — the same device
  and the same injectable random as the home's visual (`drawHomeHeroVisual`).
  What is drawn is the **painting order only**: the DOM is text then plate at
  every width and in both draws, so a reader on a keyboard meets the tiles
  first whatever the die said. A reading order that changes with a coin toss is
  not a composition, it is a bug that reproduces half the time.
- **The plate is an archive image, captioned as one** (§9). It is drawn from
  the same pool as the home's, which means the same four registers and the same
  obligation: the licence is published, not named.

Gated by `axisHubSpreadCharter.test.ts` and, at the route level, by
`axisHubCharter.test.ts` — which asserts the three pages exist, replacing
`axisHubRemovalCharter.test.ts`, which asserted that two of them did not.

### 8.7 Two columns on a phone admit only atomic cells

On `/fr/atlas/pays/MAR`, measured 2026-09-16, `.afh-tiles` ran two columns from
430 px up. Each tile was 172 px wide and carried 16 px of padding on both
sides, which left **140 px of measure**. « Islam sunnite (école malékite
majoritaire), soufisme important » — 62 characters — fell on **five lines of
twelve characters**, against a 45–75 character comfort range and an absolute
mobile floor of about 35. The chapter had written a sentence; the grid printed
a column of fragments.

Two further defects arrived with the first, and neither is about the measure:

- **Columns of free height rag the bottom.** Two tiles of unequal content in
  one row leave the shorter one's card standing empty beside the taller one's
  fourth line — a white box the reader has to rule out as a missing fact.
- **Two `details` in one row put their controls at two heights.** Each
  « + en savoir plus » sits at the foot of its own tile, so a row offers two
  controls on two baselines and there is no row of controls left to scan. A
  grid of disclosures that cannot be read across is a list that has paid for a
  second column.

**The rule.** Two columns on a phone admit only atomic cells. A cell is atomic
when its content cannot wrap: a number, a proper noun, a date. The moment a
cell carries prose, the grid linearises.

The corollary settles both of the record's grids at once, so neither is decided
tile by tile:

- `.afh-tiles` carries prose — a culture field, a folded passage, a language
  note. It is one column on a phone, and its two columns return at the
  `@container (min-width: 760px)` the parchment already uses for its chapter
  padding, which is the width at which a column holds a sentence.
- `.fiche-summary-brief__counted` carries five numbers and nothing that wraps,
  so it keeps its two columns on a phone. Linearising it would print five
  figures down a screen and lose the comparison the block exists to make.

The measure is a **rendered** value — a function of the viewport, the container
query and the loaded face, none of which exists in a unit test. That is why two
columns of twelve characters shipped under a green suite, and why the gate is
`e2e/fiche-tile-measure.spec.ts`: it opens a culture tile at 430 px, measures
the body against thirty-five characters set in the body's own type, and asserts
the two columns come back above the container threshold.

---

## 9. Imagery

The archival engravings are the best-judged thing on the site: an Al-Idrisi
mappemonde of 1154, Ogilby's _Guinea_ of 1670. They are sourced, dated,
credited and in the public domain, and they carry the atlas's argument about
naming better than any stock photograph would.

An earlier draft called them **the whole of the iconography on the home page**,
and said every gaze there was from outside. **Both halves were wrong**, and
`public/images/home/CREDITS.md` — a file that audit never opened — says so:

| picture                                    | register                                                 |
| ------------------------------------------ | -------------------------------------------------------- |
| al-Idrisi, _Tabula Rogeriana_, 1154        | Arab cartography, drawn from **inside** Africa, south-up |
| Ogilby, _Guinea_, 1670                     | the colonial document, deliberately                      |
| **Tifinagh carved in rock, Algeria, 2006** | **a contemporary colour photograph**                     |
| Wilhelm Bleek's portrait                   | 19th-century European                                    |

Four pictures, not three, and the third is already the second register.
Al-Idrisi was born in Ceuta; his map is the opposite of an outside view, which
is exactly why the hero carries it. `/fr/dossiers/anecdotes` does the same
thing with a photograph of a village in the Maloti mountains — it is a second
example, not the only one.

What the check did find is narrower and sharper: **the tifinagh photograph is
CC BY-SA 2.0, and its caption named the licence without publishing it.**
§4(a) of that licence asks for "a copy of, or the Uniform Resource Identifier
for, this License". Naming a licence is not publishing it, and on this surface
that distinction is the whole product.

**The rule.** The colonial archive is _a_ register of imagery, never the only
one, and where it appears it is captioned as what it is — a document of how
Africa was seen, not a document of Africa. Any surface carrying more than one
image carries more than one register. A surface that shows a people shows that
people's own visual record where one is available and clearable, under the same
discipline the text already obeys: sourced, dated, credited, tiered. Where no
such record exists yet, the honest fallback is the corpus's own cartography,
which the atlas generates, owns and can cite.

**The site carries real images** (operator ruling, 2026-09-13). An image slot
beside a text is filled by a photograph or a photographed document under a free
licence — never by an AI-generated picture, and never by a typographic plate
standing in for one. Thirty-three anecdotes were illustrated by a drawn plate showing the
two names, on the reasoning that no free picture was exactly _about_ them. That
reasoning was reversed: an exact document is the first choice, not the only
admissible one. When it does not exist, the slot walks down a cascade and takes
the first rung that yields a good, free picture — **the thing the text is
about, then the people's own place or material culture, then the country, then
the region.** Something always exists at the last rung. The caption stays
truthful about which rung it came from: a landscape of the Teso sub-region is
captioned as the landscape, not as the Iteso.

**No face under a slur.** Where the text is about an insulting name, the picture
shows a place, an object or a landscape, never a recognisable person; and a file
whose own title carries the slur is not taken, because illustrating with the
word reproduces the naming the text criticises.

**And a licence is published, not named.** Where a picture's licence requires
attribution, the rendered caption carries the author, the licence's **URI**,
and a link to the file itself — not the licence's initials. A notice a reader
cannot reach is not a notice, and this is the one line on a page that is not
editorial discretion. `public/images/home/CREDITS.md` keeps the same record for
a maintainer, with the date it was last checked against the source.

**The residual gap, stated rather than papered over.** No surface of the atlas
shows the people it documents — only the naming of them, and the cartography.
The fallback above licenses that, and it is still a gap. Closing it means an
image field per fiche and eight hundred cleared images: a corpus feature, with
its own decision about sourcing and rights.

**A third register: declared fiction** (DEC-053). A generated image may be
published, but only as its own publication and only as what it is — an
interpretation shown as one, never a document and never an illustration slot
beside a text. It is stylised, never photorealistic when it shows people. It is
about one or two atlas entities, and **its subject and its picture are sourced
separately**: the subject rests on a linked fiche's own cited source at
`official` or `referenced`; the picture carries its provenance — tool, model,
job, date, `ai_generated` — which is a record, not a source, and can never vouch
for the subject. A caption stating a place, a date or a pairing that no linked
fiche states cites its own source. The reader is told the image is generated
before any other claim, and every downloadable format carries that mark burned
into the file, because a file leaves its caption behind. The CC BY-SA 4.0 grant
covers the human contribution only — the brief, the selection, the caption.
Figures with a surviving photographic record are excluded: a generated picture
of them is a likeness, not an interpretation. Myths and oral narratives — the
Récits collection — are held back until a second reviewer exists.

This register **declares the residual gap above; it does not close it**. A
generated people is still not the people's own visual record.

### 9.1 The share card is a surface, and it was the one nobody looked at

A card previewing a shared link is the **most-seen surface of the brand**: it is
read in a feed, in a message, in a search result, by people who have not been to
the site and may never go. It had no rule, and it showed.

Four routes draw one — the site card, its Twitter twin, the comparison card, the
quiz score. Each declared its own ground. **Three of them landed on the same
cold slate gradient, `#0f172a → #1e293b → #111827`, a colour that appears
nowhere else in the product**; the fourth was already on parchment. Nothing was
red, because no page renders these files and no gate read them. The defect was
found the way this class of defect is always found: someone shared a link and
looked at it.

**The rule.** A share card is the product's own surface and is drawn like one.

- **Parchment, never a dark neutral.** §5.1 already said the warm paper is never
  traded for a neutral grey; nothing exempted the one surface a stranger sees
  first.
- **The product's faces, loaded as files.** Satori never sees the Next font
  loader, so a card that ships no `fonts` array renders in the runtime's default
  — which is how the site card came to be set in a grotesque while every page of
  the site is Fraunces. Nothing in the output says so; it just looks like a
  different product.
- **One accent, and it is ocre.** The brand gradient is allowed on the mark
  alone, per §5.3. At the 22 px the mark occupies it reads as a solid warm
  orange, and that is fine — it is the mark's colour, not a decoration to be
  admired.
- **The colours are copies of tokens, and a gate holds the copies.** Satori
  resolves no custom property, so a card cannot read the spine at render time
  and a literal is unavoidable. `SHARE_CARD_THEME` holds them in one place and
  `shareCardCharter.test.ts` asserts each against `src/styles/tokens/`, in both
  directions. That test finds the drawings by looking for `new ImageResponse(`
  rather than from a list, because a list is what a fifth card would sit outside
  of.
- **No publisher lockup.** The old card gave its bottom-right corner to
  `BIG EMOTION` — the one element naming neither the product nor what it does,
  set at the same weight as the domain. The corner is now empty and the domain
  stands alone, which is what the quiz card had been doing correctly all along.
- **And no licence line.** It is tempting, since §2 makes the licence something
  the reader is owed. But `DossierChapterBlock` already settled it: naming
  `CC BY-SA 4.0` satisfies nothing, because §4(a) of that licence asks for its
  URI. A card carries no link, so it carries no licence.

**What the card says, and in what order.** The question first, the name above it
small where a masthead sits, the enumeration of what the corpus holds third. The
previous card inverted all three: it set the product name at 72 px — twice over,
once as an eyebrow and once as the title — and gave the promise 28 px
underneath. A reader scrolling a feed gives a card one glance, and
« EthniAfrica » alone tells them nothing they can want.

**One thing this rule does not yet reach.** The cards are set in Fraunces at
weight 600, from a subset file named for it, while §6 retired 600 in favour of
700 and 900. Changing it means cutting a new subset and re-checking its glyph
coverage — the coverage being the thing that breaks silently. Recorded here
rather than done.

---

## 10. Performance budget

A lab score is kept apart from the aim it falls short of, so that neither can
quietly become the other.

**Target: 0.85**. The Lighthouse performance score every route aims for under
the mobile emulation the nightly matrix runs. The three assembled fiches are
warned against it rather than failed: they open on a WebGL globe that a
GPU-less runner rasterises on its CPU, a cost a reader's phone does not pay, and
`.lighthouserc.js` holds their blocking time and LCP as ratchets instead.

**Accepted lab floor off the fiches: 0.73**. Every route that does not open on
an assembled fiche fails the build below this score. It is the lowest three-run
median the 2026-09-12 nightly measured (0.75, the English home) less two points
of runner noise, and it was accepted as the budget on 2026-09-14 (production
audit, D9-2). What those routes share is the common client chunk, not their own
code, so the gap to 0.85 closes in that chunk rather than route by route. That
work is tracked on its own; this number does not drift toward the target on
its own either.

The floor is a ratchet. It rises toward the target in the same change as the
chunk reduction that earned it, and lowering it to absorb a regression is a
charter change argued here first.
`scripts/__tests__/performanceBudgetCharter.test.ts` fails when this section and
`.lighthouserc.js` disagree.

A lab score is not a reader's experience either. Real-user Core Web Vitals are
sampled through Sentry, and only for a reader who accepted analytics — the same
choice that loads Plausible — so they describe a consented sample, never the
audience.

---

## 11. What this charter does not cover

- **The source code's licence.** §2 grants CC BY-SA 4.0 over the content and
  deliberately grants nothing over the code, which stays reserved until its own
  decision is taken. That one is legal, not editorial, and belongs to BIG
  EMOTION as the publisher named in the legal notice.
- **The production domain.** §1 leaves `CANONICAL_DOMAIN` standing on
  `ethniafrica.com` without having verified it against the domain production
  actually serves.
- **Wording.** Whether a label reads "Parcourir" or "Voir les 803 peuples" is
  content design. `actions-charter.md` §7 draws the same line.
- **Anything a surface charter already governs.** Where this file and a surface
  charter disagree, the surface charter is more specific and wins — and the
  disagreement is a bug in one of them, to be closed rather than lived with.
- **Translation classes and review.** Which field is invariant, translatable,
  review-required or generated is DEC-047's, declared in
  `src/lib/i18n/translationClasses.ts` and held by the `afrik-translator`
  skill and the parity gate. §3 settles how the English reads, not what may be
  translated.
