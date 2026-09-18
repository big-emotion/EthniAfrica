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

**Order inside B, and it is not negotiable: the five deltas first, the nine
missing boards after.** Deriving a night or desktop variant from a board that is
about to gain a conviction line and an invitation to correct is drawing it
twice. The night variants are derived by token substitution and never rewritten,
which only holds if the day board is final.

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
