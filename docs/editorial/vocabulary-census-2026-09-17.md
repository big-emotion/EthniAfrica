# Vocabulary census — what the reader is actually told

Measured 2026-09-17, read-only, across three surfaces: the UI copy dictionaries,
the French literals still typed inside components, and the corpus fields
published to the reader word for word. Nothing was modified.

**Why this file exists.** The project wants to restrict certain words. Before
choosing which, it needed to know what is there — and the measurement overturned
two assumptions that would have produced an unusable rule. Whatever is enforced
later, the counts below are the baseline it starts from.

**Status.** The census is fact. The proposal in §6 is a proposal: it awaits the
operator's arbitration and enforces nothing today.

---

## 1. The surface

| Surface                                               | Size                                |
| ----------------------------------------------------- | ----------------------------------- |
| French strings in the UI copy dictionaries            | ~3 300                              |
| French literals still typed inside components         | 227, in 43 files                    |
| Corpus fiches                                         | 1 725                               |
| Fiches carrying at least one verbatim-published field | **1 722** — effectively all of them |
| Corpus prose entries (`gaps[].reason` + all `notes`)  | **6 951**                           |
| Corpus `title` entries                                | 7 180                               |

One file is a quarter of the UI surface on its own:
`src/lib/home/didYouKnowFacts.ts`, ~750 French strings.

**A correction to how the fields are usually described.** The three
verbatim-published fields live on **five** paths, not three, and the largest is
`content.sources[]` (5 509 titles), not the top-level `sources[]`.
`collectReaderFacingFields` in `scripts/ci/checkEditorialRules.ts` already walks
recursively for any key named `sources`; its own comment records that the
enumerated list "was wrong twice". The gate's reach is correct — only the
shorthand is narrow.

---

## 2. What the four existing mechanisms actually cover

| Mechanism                    | Guards                                                                      | Lets through                               |
| ---------------------------- | --------------------------------------------------------------------------- | ------------------------------------------ |
| `check:glossary`             | English renderings, on 2 terms out of 85                                    | the entire French surface                  |
| `INTERNAL_REGISTER_PATTERNS` | workshop leakage in 5 corpus paths — paths, ids, queue/tier/protocol jargon | loaded words; every UI dictionary          |
| `check:copy-literals`        | French typed outside a dictionary, **diff-scoped**                          | judges no word; 227 literals grandfathered |
| `ethniafrica-message` table  | 4 rows of vocabulary                                                        | advisory, no executor                      |

**The asymmetry that matters.** `TermCopy` in `src/lib/glossaire/terms.ts` has a
`forbiddenEn` field. It bans `tribe`, `tribes`, `ethnic group`, `ethnic groups`
on `peuple`, and `linguistic family` on `famille linguistique`. There is **no
`forbiddenFr`** — zero occurrences in the repository.

So « the Yoruba are a tribe » fails CI, and « les Yoruba sont une tribu » fails
nothing. The site publishes French only (`SITE_LOCALE_MODE` fails closed to
`fr-only`), so the only vocabulary gate guards the locale nobody reads yet.

---

## 3. Two defects the census found

**A forbidden word in a page title.** `src/components/pages/SourcesPageContent.tsx`
lines 23 and 525: « Bibliographie complète — Populations & **Ethnies**
d'Afrique ». Its cognates cluster in the same file — « répartition **ethnique**
par pays » (41, 548), « diversité **ethnolinguistique** » (488, 554) — and
`src/lib/api/openapiV2.ts:15` says « données **ethnographiques** ». This is the
only outright doctrine-violating word in the component tree, and it is in the
most visible position it could occupy.

**Workshop vocabulary rendered to a reader.**
`src/lib/dossiers/nommer/figures.ts:257`, a methodology note the reader sees:
« …au moins une source autre que **la file d'attente des candidats** ». That
exact phrase is banned by `INTERNAL_REGISTER_PATTERNS` — the rule simply does not
reach UI dictionaries. Second leak of the same kind:
`src/lib/home/didYouKnowFacts.ts:456` says « le **tier** "non vérifiée" », the
one anglicism where the rest of the surface says _palier_.

Both are unambiguous: they break a rule the project has already written down.
Only the replacement wording is an editorial choice.

---

## 4. One concept, several words

The real disorder, and invisible from any single file.

| Concept                        | Spellings | The variants                                                                                                                                       |
| ------------------------------ | --------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| A source's level of authority  | **5**     | _palier_ (glossary) · _niveau de source_ (people and country fiches) · _niveau de confiance_ (transparency panel) · _indice de confiance_ · _tier_ |
| The name a people gives itself | **3**     | _auto-appellation_ · _autonyme_ · _endonyme_                                                                                                       |
| The atlas itself               | **2**     | _le corpus_ (~33 reader-facing uses) · _l'atlas_                                                                                                   |
| The naming axis                | **3**     | _Appellations_ · _Noms & appellations_ · _Le nom et ses appellations_                                                                              |
| The review state               | **3**     | _En attente d'examen_ · _En cours d'examen_ · _Mis à l'examen_                                                                                     |

The second is the worst: **the glossary itself states that an autonyme and an
endonyme are not the same thing** (`src/lib/glossaire/entries.ts:24`), and two
pages use them for one another.

The third is documented in the clearest possible way — the same sentence exists
twice, word for word, de-jargonised in one copy and not the other:

- `src/lib/dossiers/nommer/figures.ts:292` — « **Le corpus** enregistre l'origine d'un exonyme en prose libre… On peut compter **les fiches**… »
- `src/lib/i18n/copy/nommer.ts:48` — « **L'atlas** enregistre l'origine d'un exonyme en prose libre… On peut compter **les pages**… »

---

## 5. The corpus counts

Entries = matching field values. Prose = `gaps[].reason` + `notes`.

| Term               | Entries | Fiches | In prose | In `title` |
| ------------------ | ------: | -----: | -------: | ---------: |
| `ethnique`         | **147** |    132 |      143 |          4 |
| `dialecte`         |  **50** |     44 |       47 |          3 |
| `tribal`           |      22 |     20 |        7 |         15 |
| `tribu`            |      21 |     16 |       19 |          2 |
| `Berlin`           |      19 |     17 |        1 |         18 |
| `ethnie`           |      16 |     14 |        7 |          9 |
| `auto-désignation` |      11 |     10 |       11 |          0 |
| `1884`             |       7 |      3 |        4 |          3 |
| `exonyme`          |       5 |      4 |        5 |          0 |
| `autonyme`         |       4 |      3 |        4 |          0 |
| `indigène`         |       4 |      4 |        4 |          0 |
| `arbitraire`       |       1 |      1 |        1 |          0 |
| `endonyme`         |       1 |      1 |        1 |          0 |
| `primitif`         |       1 |      1 |        0 |          1 |
| `peuplade`         |   **0** |      0 |        0 |          0 |

Other axes:

| Check                                        | Entries | Fiches |
| -------------------------------------------- | ------: | -----: |
| « Vérifié via Wikipédia » in prose           |  **70** |   ≤ 52 |
| English Glottolog boilerplate                |      25 |     25 |
| Untranslated English (≥3 markers, no accent) |      18 |      9 |
| URL inside `notes`                           |       9 |      7 |

### The assumption the measurement overturned

**`Berlin` and `1884` must not be banned.** Of the 26 occurrences, **not one**
refers to the Conference. The 19 `Berlin` are publisher cities — « Berlin,
Weidmann, 1879 ». The 7 `1884` are date brackets and publication years —
« c.1865–c.1884 ». A pattern here would be 100 % false positive.

Same verdict for `primitif`: one occurrence, and it is a real 1936 title
(Vergiat, _Les rites secrets des primitifs de l'Oubangui_).

This is why the census exists. The doctrine forbids naming Berlin as the author
of the borders; it does not forbid citing a book printed there.

### The rule that makes any restriction shippable

**Key the rule by field kind, never by word alone.**

- `title` is a **citation field**. It legitimately carries English, colonial-era
  vocabulary and publisher cities. **2 377 of its 7 180 entries already contain
  English markers.**
- `gaps[].reason` and `notes` are **the project's own voice**.

Applying one list to both is what would make the rule unusable. Restricting
`tribu`/`tribal`/`ethnie` to prose alone cuts 59 hits to ~33 actionable ones.

`docs/editorial/glossary.md` states the same lesson in its own words: _"The
glossary is a gate on terms, not a spell-checker on prose; a gate that fires on
every sentence gets switched off."_

---

## 6. Proposal — awaiting the operator's arbitration

### Tier A — worth a pattern, prose fields only (~177 entries)

| Pattern                                                     | Entries | Why                                                                                                            |
| ----------------------------------------------------------- | ------: | -------------------------------------------------------------------------------------------------------------- |
| `autonyme\|exonyme\|endonyme\|auto-?désignation\|ethnonyme` |      21 | Unglossed scholarly jargon, zero in titles                                                                     |
| « Vérifié via Wikipédia » / « indépendante de Wikipédia »   |  **70** | Curator audit trail — **already banned in English** by `pipeline source note`, only the French form is missing |
| URL inside `notes`                                          |       9 | The `url` field exists on every source object                                                                  |
| `Glottolog name:` / `languoid`                              |      25 | One generated template, English concatenated onto French                                                       |
| Untranslated English, ≥3 markers and no accent              |      18 | Two of them narrate the workshop's failure to the reader                                                       |
| `designatedSocialUnit`, « vocabulaire fermé »               |       2 | Schema leakage the current `JSON field path` pattern misses                                                    |
| `tribu\|tribal\|ethnie`, prose only                         |     ~33 | The other 26 are cited works                                                                                   |
| `peuplade`                                                  |   **0** | Free insurance                                                                                                 |

### Tier B — repair the template, do not ban the word

- **`ethnique` (147)** — 108 sit in `notes`, overwhelmingly « groupe ethnique »
  quoting a census rubric. Defensible as a quoted rubric, not as « l'ethnie X ».
- **`dialecte` (50)** — 46 come from the same generated Glottolog template. One
  fix repairs the class.

### Tier C — do not ban

`Berlin`, `1884`, `primitif`, and anything inside a `title`.

### On the UI side

Add `forbiddenFr` symmetric to `forbiddenEn`, seed it on `peuple`
(`tribu`, `ethnie`), and point `checkGlossary` at the French side of the
dictionaries.

### How to ship it without it being switched off

Start it as a **two-edged ratchet** at the measured count, the mechanic the
project already uses (`NEEDS_REVIEW_RATCHET`, `UNDATED_POLITY_CEILING`). It
fails when the count rises **and** when it falls without the ceiling being
lowered in the same change. Each editorial pass lowers it; at zero the ratchet is
deleted and the findings become errors.

And it inherits the exemptions the project has already granted itself: quoted
mentions, the three fields where a retired word is legitimately discussed
(`whyProblematic`, `originOfExonyms`, `contemporaryUsage`), and the glossary
itself — which has to be able to name what it retires.

---

## 7. Two things worth knowing before building the rule

**The copy-literals gate is blind to unaccented French.** `FRENCH_ACCENT_PATTERN`
only fires on a diacritic, so two of the most doctrinal sentences in the
repository are invisible to it — in
`src/components/dossiers/nommer/ThesisMeasures.tsx`: « Le corpus tient quatre
noms venus du dehors pour un nom venu du dedans. » and « Autant de pays portent
un nom que des Africains ont choisi. » A vocabulary rule keyed off that gate's
output would silently skip them.

**Seven files are editorially frozen.** `questionTemplates.ts`,
`DominantAnswerPanel.tsx`, `hubs/facets.ts`, `ThesisMeasures.tsx`,
`DoctrineLinkCard.tsx`, `familyFootprintSource.ts` and `quiz/segmentPolicy.ts`
are 100 % doctrinal literals. The gate grandfathers by text identity, so editing
one sentence un-grandfathers it and turns the gate red — the file has to be
migrated wholesale first. Correcting a word in them is not currently possible in
a small change.

**One file wants an exemption, not a migration.**
`src/lib/afrik/parsers/appellationGrammar.ts` — its four "literals"
(_désignation_, _dénomination_, _utilisé_, _employé_) are a parsing grammar that
reads French **out of** the corpus. They are never rendered, and moving them to a
dictionary would break the parser.

**And one document is stale.** `docs/runbooks/bilingual-copy-survey.md` records
316 candidates in 52 files; the gate now measures 227 in 43.
