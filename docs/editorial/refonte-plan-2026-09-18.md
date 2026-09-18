# The editorial reorientation — what changes, in what order, what blocks what

Written 2026-09-18. It sequences a decision already taken; it does not re-argue
it.

## Where this comes from, and what was missing

Three documents came out of the 16–17 September work, and it would be easy to
mistake any of them for a plan:

| Document                                     | What it is                                            |
| -------------------------------------------- | ----------------------------------------------------- |
| `essais/dou-viennent-les-noms-2026-09-17.md` | **the decision** — why onomastics becomes the subject |
| `audit-doctrine-publication-2026-09-17.md`   | **the diagnosis** — 4 surfaces, 6 findings, 7 holes   |
| `design/search-result-charter.md`            | **the contract of one surface**                       |

None of them says what to do first. That is this file.

## The reorientation in one sentence

**The atlas stops being organised around _who a people is_ and becomes organised
around _where its name comes from_.**

## What does not change

Stated first, because a reorientation is read as a demolition until somebody
says what survives.

- **Every fiche stays** — peoples, countries, languages, families, names,
  places. They stop being the default destination; they do not stop existing.
- **The corpus and its doctrine are untouched.** The three tiers, `source_kind`,
  the assertion register, the rule about whose account gets told: all of it was
  already about naming, which is why the reorientation costs nothing there.
- **The visual identity holds.** Tokens, parchment, Fraunces, the home's layout
  and its UX. The home changed one line — its `h1`.
- **The AFRIK hierarchy and the v2 API** are unaffected.

## The five chantiers

### A — This plan

Done when this file is on `recette`. It exists so that B, C and D are not
decided in the order somebody happens to open them.

### B — The artefact reaches its own contract

The fourteen approved artboards are the reference for the **rendering**. They
are not yet a reference for the **sequence**: §3 bis of the charter, written
2026-09-18, found that no two boards share a block grammar, and it names five
deltas none of them has absorbed.

Coverage today:

| Case        | Mobile day | Mobile night | Desktop day | Desktop night |
| ----------- | ---------- | ------------ | ----------- | ------------- |
| Mandé       | ✅         | ✅           | ✅          | ✅            |
| Peul        | ✅         | ✅           | ❌          | ❌            |
| Ekpeye      | ✅         | ✅           | ✅          | ❌            |
| Introuvable | ✅         | ❌           | ❌          | ❌            |
| Bassa       | ✅         | ✅           | ✅          | ✅            |

**One board per case exists at mobile/day, and nowhere else.**

**Order inside B, and it is not negotiable: the five deltas first, the missing
boards after.** Deriving a night or desktop variant from a board that is about
to gain a conviction line and an invitation to correct is drawing it twice. The
night variants are derived by token substitution and never rewritten, which only
holds if the day board is final.

**Mobile is done, 2026-09-18** — five cases by two themes, each board carrying
the §3 bis grammar, each height measured from a render rather than estimated.
Two things the render caught that the markup did not: three boards had their
invitation _before_ their conviction, because the insertion anchored on « Aller
plus loin » without seeing what already sat there; and the boards grew by about
a third, so a fixed wrapper height would have clipped them silently.

**What is left is the desktop row, and it is ten operations, not six.** The
three desktop boards that exist were derived before §3 bis and carry the old
grammar, so they absorb the deltas too; `Peul` and `Introuvable` have no desktop
board at all; and all five night variants follow from those. The full grid is
five cases by four variants — twenty boards, of which ten now conform.

**B blocks C.** A data shape derived from a mockup that is about to change is
derived twice as well.

### C — The data shape

What exists today, measured rather than assumed:

- `src/app/[lang]/atlas/recherche/page.tsx` → `RecherchePageContent.tsx`
- **eleven components** under `src/components/search/`
- `DominantAnswerPanel` referenced in **six files**, including
  `src/lib/search/searchEnvelope.ts` — so it lives in the **shape of the data**,
  not only in the view. Retiring it is not deleting a component.

The analysis C has to produce, and it is an analysis before it is a change:

1. For each block of §3 bis, **what does the page need** — fields, cardinality,
   what "the most common first" is ordered by.
2. **What does the corpus actually hold** for each of those, per entity class.
3. Where the two disagree, **which side moves**: a corpus field to fill, or a
   block that declares a silence instead.
4. What `searchEnvelope` becomes, and what `DominantAnswerPanel`'s retirement
   takes with it.

**C does not wait for the corpus to be complete.** The charter settles this: a
silence is declared, never left blank, and `Ekpeye` is the proof that a page
with almost nothing still reads as a page. Building against a thin corpus is the
intended behaviour, not a compromise.

**One decision C settles and this plan does not**: whether the page is rebuilt
on `/atlas/recherche` or opened as its own surface. It depends on what the
envelope turns out to be, and deciding it earlier would be deciding it blind.

### D — Retire what still asserts the old doctrine

**The distinction that governs this whole chantier: a file that _records_ the
old positioning as history stays; a file that _asserts_ it goes.** Brand charter
§1 records "Atlas des Peuples d'Afrique" as the value ruled on 30 August and
replaced on 17 September — that is a ledger entry and deleting it would lose the
reason. A live e-mail that greets a reader with it is an assertion.

First pass, measured 2026-09-18. **It is partial by construction** and the
command that produced it is written down so the next pass is not a fresh guess:

```bash
grep -rlniE "atlas des peuples d.afrique|dictionnaire des ethnies|encyclop[ée]die des peuples" src docs .claude public
```

| What                                                               | Standing                                                                                                                                                                                              |
| ------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/lib/email/flagNotification.ts`, `src/lib/email/signInLink.ts` | **Live, a reader sees it.** Both hard-code the old qualifier, which brand charter §1 forbids twice over — the value is stale _and_ it is stated outside `brand.ts`                                    |
| Three test comments describing the lockup                          | Stale prose, no behaviour. Fix in passing                                                                                                                                                             |
| `docs/design/mockups/pages/*.html`                                 | Reviewed renderings carrying the old lockup. They are references for their own surfaces; re-render rather than edit                                                                                   |
| `DominantAnswerPanel` and its six files                            | **Belongs to C**, because it is a data-shape change                                                                                                                                                   |
| ~~Two skills~~                                                     | **False positives, checked.** Both say "tertiary encyclopedias", a source-tier category with nothing to do with the product's positioning. Left in the table because a loose grep surfaces them again |
| `CLAUDE.md`                                                        | Its own decision, below                                                                                                                                                                               |

**What this pass does not catch**, and why a second one is needed: the search
above finds the old _qualifier_. It does not find a page that still reads as an
encyclopaedia without ever using the word, and no grep will. That is a reading
pass over the reader-facing copy modules — `homePurpose.ts`, `doctrine.ts`,
`about.ts`, the hub copy — and it belongs in D, after B has settled what the new
register sounds like.

**`CLAUDE.md`.** The operator has asked to rewrite it from zero. It is not in
this chantier, on purpose: it is the file every agent reads first, and rewriting
it while the shape of the work is still moving means rewriting it twice. It is
the **last** thing that changes, once B, C and D are done and there is something
stable to describe. The reset inventory
(`docs/reset-inventory-2026-09-17.md` §7) already records what a reset costs and
which of its lines are measured facts that must be rediscovered by failing again
rather than re-derived from memory.

### E — The gate on competing appellations

The charter's own §5 names it: **`checkEditorialRules.ts` requires the self-given
name and nothing requires the others.** The result page promises to show every
form a people is known by, resting on a field nothing fills.

It is corpus and gate work, it is real, and it is **not on the critical path** —
see C. It runs beside B and C rather than before them.

**The gate landed 2026-09-18.** `competing-appellations` asks every ethnographic
fiche to have decided about the names it is known by, without demanding an
exonym — an empty list is a declared silence, an absent key is an unanswered
question. Three fiches fail it, held by a two-way ratchet, and each one is
editorial work rather than a code fix. The corpus half of E is what remains.

## What blocks what

```
A  plan
└─ B  artefact: 5 deltas, then 9 boards
   └─ C  data shape: analysis, then envelope
      └─ D2 reading pass over reader-facing copy
         └─ CLAUDE.md rewritten, last

D1 live assertions (the two e-mails, the stale comments)  — no dependency, do it now
E  appellations gate                                      — no dependency, runs beside
```

Two chantiers have no predecessor and should not wait: **D1** (two e-mails
greeting readers with a retired qualifier) and **E**.

## What this plan deliberately leaves undecided

- **The apostrophe.** The copy base is genuinely split — measured 2026-09-18,
  197 typographic against 219 straight. The slogan was unified because an
  identity string cannot wait; the rest is its own pass and nothing depends on
  it.
- **Fraunces 600 → 700** on the share cards (brand charter §9.1). Needs a new
  subset and a glyph-coverage check.
- **Per-page share cards.** A name page previewing with its own question is what
  the reorientation actually wants, and it is a feature that depends on C.

## How this ends

With `/ethniafrica-spec`, taking this file as its matter: REQ, DEC and ARCH in
Pending, then the Jira tickets. Two things it has to carry that no chantier
above owns —

- **`DominantAnswerPanel`'s retirement needs a DEC number.** It is contrary by
  premise to "no appellation is crowned", and a component removed without a
  recorded decision is a component somebody restores later with good arguments.
- **Confluence, not this repo, is the source of truth for REQ/DEC/ARCH.** The
  decision currently lives in a markdown essay. An agent reading Confluence
  tomorrow will re-derive the old positioning, which is the exact failure the
  rule exists to prevent.

And a trap on the way in: the Requirements page is **split across twelve
sub-pages**, and reading the parent alone makes you re-allocate an existing REQ
number.

---

## Two questions this plan did not answer, and now does

### Is this enough for an implementing agent to reach parity with the mockup?

**No, and the repository already knew why.** `docs/design/mockups/README.md`
exists precisely for this case: it lists the artefact URLs _and_ vendors the
sources, because **an agent implementing a page cannot open a `claude.ai`
link.** The search-result charter points at an artefact and nothing else, which
is a regression against a practice this repository had already established.

Three things are missing, and none of them is the plan's sequencing:

1. **The mockup has to be in the repository.** The twenty artboards are vendored
   under `docs/design/mockups/` the way the four atlas pages are, with the same
   README shape: what each board is, which artefact it came from, and why the
   source rather than the published file.
2. **Parity has to be defined, because pixel parity is the wrong target.** The
   boards carry fixed content; the page renders from a corpus whose strings are
   any length. What must match is the **block grammar** — which blocks appear,
   in what order, under which condition — plus the tokens, the type scale and
   the spacing steps. A page that draws the same blocks in the same order with
   the same tokens _is_ the mockup; one that matches it pixel for pixel on
   Mandé and breaks on a name twice as long has matched the wrong thing.
3. **A gate has to measure it.** A unit test cannot see a rendered page (the
   brand charter's own note on this). A Playwright assertion at 430 and 1280, in
   both themes, counting the blocks and their order against the grammar, is what
   makes the charter enforceable rather than advisory.

Until those three exist, an agent will produce something defensible and
different, and nothing will say which of the two is wrong.

### How are duplicate and obsolete files found and removed?

**Code is already covered and the answer is "do not delete by hand".**
`check:dead` holds `files` at **0**, so an unreferenced module fails the build
the day it stops being imported. It is a **two-way ratchet**: deleting code
lowers the count and fails the build just as adding dead code does, unless the
ceiling moves in the same commit.

**Prose is not covered at all**, and that is the real gap. Measured 2026-09-18:

```
docs tracked          83
referenced by nothing 20
```

The command is the same shape as the local-paths gate — every tracked file is
read, and a doc whose basename appears nowhere but in itself is an orphan.

**An orphan is a candidate, never a verdict.** The twenty split three ways:

- **Ledger entries** — the dated `gabarits-social/notes/_*.md`, the audience
  audits. They are a record; they are linked from their directory's README or
  left alone, never deleted.
- **Newly written and not yet linked** — `search-result-charter.md`,
  `reset-inventory-2026-09-17.md`, and this file. That is a finding about the
  writing, not the file: a document nothing points at is a document nobody will
  read. Each gets its pointer.
- **Genuinely superseded** — `runbooks/v1-removal-cutover-2026-05.md` describes
  a cutover that happened, `runbooks/bilingual-copy-survey.md` a parity gate
  that REQ-171 made non-blocking, `design/dossier-theme-architecture-proposal.md`
  a proposal nothing records accepting. These are read, then deleted or dated
  as historical.

The gate worth adding is the orphan count as its own ratchet, in the shape
`check:dead` already uses — a number that can only go down, with the three-way
triage written beside it so the next reader does not mistake a ledger for a
leftover.
