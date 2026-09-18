# The result page's data shape — what it needs, what the corpus holds

Chantier C of `docs/editorial/refonte-plan-2026-09-18.md`. Measured 2026-09-18
against the corpus on `recette`; every figure below comes from counting fiches,
not from reading a model.

The charter says what the page draws (`search-result-charter.md` §3 bis) and
`src/lib/search/resultGrammar.ts` carries that as code. This says whether the
corpus can fill it, and what has to change where it cannot.

---

## 1. The finding that governs everything else

**Four entity classes answer the same question and each stores the answer under
a different key.**

| Class           | Where its naming lives                                          |
| --------------- | --------------------------------------------------------------- |
| peuple (774)    | `content.appellations`                                          |
| pays (54)       | root `etymology`, `nameOriginActor` + `content.historicalNames` |
| famille (25)    | `content.decolonialHeader`                                      |
| patronyme (796) | root `spellings[]` + `origin`                                   |
| langue (39)     | root `alternateNames[]` — and nothing else                      |

A page whose single promise is « d'où vient ce nom » currently has to read five
shapes to keep it. This is not a rendering problem that a component can absorb:
each shape carries a different amount of what the page needs, so the same block
is rich on one class and impossible on another.

**It cost a measurement to find.** A first pass probed every class with the
people fiche's field names and reported countries and families as carrying
nothing at all about their names. They carry more than peoples do.

## 2. What each class can actually fill

Per-class fill rates, counted. A block the class cannot fill is not a defect —
the charter's rule is that a silence is declared — but it decides which of the
five cases the mockups drew is representative.

### peuple — 774 fiches

| Field               | Filled |
| ------------------- | ------ |
| `contemporaryUsage` | 100 %  |
| `selfAppellation`   | 99.7 % |
| `originOfExonyms`   | 99.6 % |
| `exonyms` ≥ 1       | 99.5 % |
| `exonyms` ≥ 2       | 94.8 % |
| `whyProblematic`    | 60.1 % |
| `spellingAliases`   | 2.1 %  |
| `peopleGroupId`     | 1.8 %  |

Rich — and one field is not what it looks like. **`exonyms` is a flat
`string[]`, and a quarter of its entries are being used as two fields at once:**

```
"Mandingo (anglophone, générique)"
"Manding (pan-mandé)"
"Mandingue (français colonial)"
```

Across 3 127 exonyms: **75.4 % are bare forms**, 24.3 % carry a parenthetical
qualifier, and those 759 qualifiers take **677 distinct values** — free prose,
not a controlled vocabulary. Per fiche: **56.1 % have no qualified exonym at
all**, 23.0 % have every exonym qualified, 20.4 % are partial.

**So the appellations list as drawn — a form, and beside it what kind of name it
is — is fully renderable on fewer than a quarter of peoples.** Parsing the
parenthesis would leave three quarters of the forms bare and publish 677
uncontrolled labels on the rest.

### pays — 54 fiches

| Field                                                                                     | Filled     |
| ----------------------------------------------------------------------------------------- | ---------- |
| `etymology`                                                                               | 100 %      |
| `nameOriginActor`                                                                         | 100 %      |
| `content.historicalNames`                                                                 | 100 %      |
| · `formerNames`, `antiquity`, `middleAges`, `precolonial`, `colonization`, `contemporary` | 100 % each |

**The best-served class, by a distance** — and the only one that can fill
« À travers le temps », which the charter currently records as unfillable. Six
named eras, complete on every country. The block is not dead; it is dead _for
peoples_.

### famille — 25 fiches, `content.decolonialHeader`

| Field                    | Filled |
| ------------------------ | ------ |
| `selfAppellation`        | 100 %  |
| `historicalAppellations` | 100 %  |
| `contemporaryUsage`      | 100 %  |
| `originOfHistoricalTerm` | 92 %   |
| `whyProblematic`         | 80 %   |

Better filled than peoples on every comparable field.

### patronyme — 796 fiches

**This class already has the shape the page wants.** `spellings[]` is a list of
records, each with its own `attestations[]`, each attestation carrying a
`countryId` and `sourceRefs` — per form, with its own provenance.

| Field                       | Filled  |
| --------------------------- | ------- |
| `spellings` ≥ 1             | 99.6 %  |
| every spelling attested     | 99.6 %  |
| attestation carries sources | 99.6 %  |
| `nameSystem`                | 99.6 %  |
| `transmissionMode`          | 99.6 %  |
| `spellings` ≥ 2             | 28.5 %  |
| `origin.writtenChronicles`  | 17.3 %  |
| `origin.oralTraditions`     | 1.5 %   |
| **attestation dated**       | **0 %** |

So the structure is right and the depth is thin: one spelling on 566 of 796, an
origin documented on roughly a fifth, and **not one dated attestation in the
whole class.**

### langue — 39 fiches

`alternateNames[]`, flat, and **no origin field of any kind**. The worst-served
class, and the one the reorientation names in its own slogan.

## 3. What the mockups over-represent

Stated plainly, because it is a flaw in work already approved: **`Mande` and
`Peul` sit in the ~23 % of people fiches whose every exonym is qualified.** They
were chosen for being interesting, which made them unrepresentative. `Ekpeye`
was drawn as the poor case and it is poor in a different way — one appellation
rather than several unqualified ones.

**The case the first twenty boards did not draw is the ordinary one**: a people
with four exonyms and not one of them qualified — 56 % of the corpus.

**It has a board now.** `Fang` was added the same day, in all four variants:
Pahouin, Pangwe, Pamue and Mpangwe, none qualified, its right-hand column empty
on purpose. The three European names all descend from one word that coastal
neighbours had made out of hearing these people say _fang_ — so the block that
carries the case is the origin prose, not the list.

## 4. Which side moves

| Block                            | Verdict                                                                                                                                                                                                                                                           |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| The appellations list            | **The page moves, then the corpus.** The qualifier is shown when the corpus carries one and omitted when it does not — never parsed out of the form and never invented. A structured field comes later, and the patronyme model already shows what it looks like. |
| Where they come from             | **Neither.** `originOfExonyms` is one prose paragraph and the mockup renders it as one prose paragraph, forms emphasised inline. They already agree.                                                                                                              |
| Through time                     | **The page moves.** The block is not dead — it is complete on all 54 countries and empty everywhere else. Its condition is per class, not global, and the charter's « never, today » is wrong for `pays`.                                                         |
| What the peoples call themselves | **Neither.** 99.7 % on peoples, 100 % on families.                                                                                                                                                                                                                |
| Why these names are a problem    | **Neither**, with a declared silence on the 40 % of peoples that leave it empty.                                                                                                                                                                                  |
| Who says what today              | **Neither.** 100 % on peoples and families.                                                                                                                                                                                                                       |
| Which one are you looking for    | **The page moves.** It is derived from the search result set, not from a field; `peopleGroupId` (1.8 %) is a different thing — one people split across fiches, not several peoples sharing a name.                                                                |

**The one structural change worth making, and it is not new work.** The
patronyme model already carries what `content.appellations` lacks: a list of
records rather than strings, each with its own attestations and sources. The
people model converges toward it rather than inventing a shape. That is a
migration with a ticket, a validator change and 774 fiches behind it — it is not
a prerequisite for the page, because a form with no qualifier renders as a form.

## 5. What `searchEnvelope` became

Today it carries, for peoples only:

```ts
autonym?: string;
exonyms?: string[];
```

read from `appellations` on the API payload. Nothing reaches the envelope from
`historicalNames`, `decolonialHeader` or `spellings` — so **three of the five
classes deliver none of their naming to the page that now exists to show it.**

**Done, 2026-09-18** — `src/lib/search/naming.ts`:

- **One projection, five readers.** `readNaming(type, content, root)` returns
  the same `NamingProjection` for every class: the self-given name, the forms,
  the origin prose, the problem prose, the usage prose, and the dated eras. Each
  branch of `mapSearchEnvelope` calls it with its own class. The page reads one
  shape, and the grammar's conditions become field checks rather than class
  branches.
- **A form is a record, not a string.** `NamingForm` carries an optional
  `qualifier` and an optional `attestedIn`, so the qualifier has somewhere to
  live that is not inside the form. **It stays `undefined` until a field exists
  and is never parsed out of the form** — a test asserts exactly that on
  « Mandingue (français colonial) ».
- **The eras are a country's alone.** `NAMING_ERAS` names the six, and no other
  reader fills them, because no other class dates anything.
- **A class with nothing to say returns the empty projection**, never
  `undefined`, so a caller writes `naming.forms.length > 0` and never a null
  guard.

What is still owed: the API payload has to carry `content` for the classes whose
RPC does not forward it yet, or the reader receives an empty object and reports
a silence the corpus does not have. That is measurable per class and is the
first thing to check when a block goes missing.

## 6. What `DominantAnswerPanel`'s retirement takes with it

It is referenced in six files, one of which is `searchEnvelope.ts`, so it is in
the shape of the data and not only in the view.

What it renders is a population figure and a confidence percentage for the one
result judged dominant — **a panel whose premise is that a search has a single
best answer.** The charter's rule is that no appellation is crowned. The two
cannot both stand.

It should not be deleted quietly: it contradicts an earlier decision and its
removal needs a DEC number, per the plan's closing section. What goes with it:
the component, its test, its branch in `searchCharter.test.tsx`, and whatever
`searchEnvelope` computes to feed it.

## 7. What this analysis does not settle

- **Whether the page is rebuilt on `/atlas/recherche` or opened as its own
  surface.** The envelope work decides it, and deciding it now would be deciding
  it blind.
- **The ordinary-case mockup.** A people with several unqualified exonyms is the
  majority of the corpus and has no board. That is chantier B reopening, briefly.
- **The gate on competing appellations** (chantier E): nothing requires a fiche
  to carry the forms it is known by, so every figure above can fall without a
  test noticing.
