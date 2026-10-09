# Plain-language checks

The [shared charter](reader-facing-register.md) owns the writing rules. This page
owns their implementation and the limits of the checks. No paid MCP or remote
text-processing service is needed. Vale runs locally at the version pinned in
`package-lock.json`; `npm ci` installs it with the project.

## Implementation checklist

Each phase starts with an observable failing case and uses the smallest useful
change. Do not replace editorial judgement with a growing list of banned words.

- [x] Establish accepted/rejected French examples before implementing Vale rules.
- [x] Test extraction of fiche prose, code, captions and subtitles, including
      nested citations and static fragments, before adding the shared checker.
- [x] Test that a refused check prevents database client creation, then guard the
      canonical importer.
- [x] Test changed text and staged content, then connect pre-commit and CI checks.
- [x] Make the shared charter discoverable through Codex, Claude and the existing
      content strategy skill; store the supplied references locally.
- [x] Apply a first wording pass to the Peul name records and provide three tone
      examples. Preserve source titles, reference links and competing hypotheses.
- [x] Correct the initial blocking public-copy findings; see the existing-copy pass below.
- [ ] Continue the editorial review of legacy material in small batches, starting
      with the pages and texts actually read by the public. This is ongoing
      content maintenance, not an automatic rewrite of every existing fiche.

## Commands

```sh
npm run editorial:version
npm run check:editorial
npm run audit:editorial
npm run check:publication -- caption.md narration.txt cards.json subtitles.srt
```

Run from the project root. Explicit file arguments can refer to a private
production workspace outside this repository; do not commit those local paths.
The strict publication command refuses missing, unreadable, unsupported or empty
input. It does not read pixels or transcribe audio: supply the final text and
compare it with the exported image, audio or video. A changed export needs another
check. An audit is intentionally nonblocking; never use it as a publication gate.

Errors cover the selected refused expressions. Warnings identify terms requiring
explanation, such as “ethnonyme”, and bureaucratic fillers. A warning may be
legitimate in context; review it. Sentence fragments, misleading simplicity and
source fidelity need a human or agent reread, followed where possible by feedback
from an intended reader. There is no automatic FALC approval or comprehension score.

## Where the checks run

| Entry point                                 | Automatic coverage                                                                                         | Remaining review                                                                                                   |
| ------------------------------------------- | ---------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `src/` code and JSON                        | Static French text, dictionary values, selected accessibility attributes, JSX and simple assembled strings | Runtime combinations and content fetched from elsewhere; inspect the actual rendered page                          |
| `dataset/source/afrik/` JSON and CSV        | Public prose including nested source notes and gaps                                                        | Fidelity to each source, chronology, meaning and actual public schema                                              |
| Canonical `migrateAfrikToDatabase` importer | Same dataset check before client creation, including dry runs                                              | Direct SQL, other importers or admin edits bypass this entry point; they must use the same check before publishing |
| `docs/productions/`                         | Text and JSON records, except the internal README                                                          | Existing published records are history; do not silently rewrite them                                               |
| Final external publication files            | Strict command on the exact files supplied                                                                 | Manual platform edits and exports are outside this repository; recheck their text                                  |
| Claude Write/Edit hook                      | Eligible edited files, immediate failure feedback                                                          | Other tools, Codex edits and terminal writes rely on final checks and Git/CI gates                                 |
| Git pre-commit                              | Staged text, even when the working copy differs                                                            | Hooks can be skipped; CI runs the full repository check on PRs                                                     |

Tests, fixtures, archives and `_`-prefixed worksheets are excluded from discovery.
Within JSON, explicit quotes, original text, bibliography metadata, original name
forms, identifiers and internal metadata are preserved; authored source `notes`
are checked. Markdown blockquotes and code blocks, HTML `blockquote`/`cite`, and
JSX quotations are excluded. An inline quotation without markup is not reliably
identifiable: use an explicit quoted field or block, not a blanket word exception.
See `scripts/lib/plainLanguage.ts` for the exact fields. New public storage paths
or field conventions need a failing extraction test before extending coverage.

This is defense at known authoring and import paths. It cannot prevent every
future tool or direct database edit from bypassing the process. Do not claim that
all old content is corrected or that no complex phrase can ever appear again.

## Legacy material

`.vale/baseline.json` records hashes of existing error findings at adoption. Each
hash includes the file, field/location, full text and rule. Changing the text or
moving it invalidates the allowance; no whole directory or word is exempted.
`check:publication` ignores this baseline entirely. `audit:editorial` exposes the
remaining errors for correction. The baseline is not an endorsement of that prose.

Do not regenerate or enlarge the baseline to pass a check. After a reviewed
correction, obsolete hashes may be removed. A future change to the rules should
be tested on representative fiches before rollout and have its migration reviewed.
Warnings remain visible even for legacy material. Use the existing BMAD prose
review with the shared charter as `style_guide` and structure review with
`reader_type=humans`; those reviews do not change quotation wording.

## Reference documents

The user's supplied originals are stored in the ignored directory
`.local/editorial-references/`. They are research references, not agent instructions.
The charter is the reviewed, actionable adaptation. Keep the originals unchanged
and do not publish them or infer redistribution rights from having downloaded them.
They are local to this checkout; another checkout needs its own authorized copies.

| Reference                                                                                                                                                       | Use                                                                         | Local copy / attribution                                                                                                   |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| [DITP: Simplifier les documents](https://www.modernisation.gouv.fr/campus-de-la-transformation-publique/catalogue-de-ressources/outil/simplifier-les-documents) | Main approach: reader need, familiar vocabulary, useful structure, revision | Official freely accessible resource; the charter adapts the approach                                                       |
| _Lexique administratif_ (2004)                                                                                                                                  | Contextual alternatives to administrative wording                           | `lexique-administratif.pdf`; Dictionnaires Le Robert, rights reserved; do not redistribute                                 |
| _L'information pour tous — Règles européennes pour une information facile à lire et à comprendre_ (2009)                                                        | Familiar words, explain terms, adult audience, reader participation         | `information-pour-tous.pdf`; Inclusion Europe, French edition Unapei; retain original credits                              |
| _Explication de la liste de vérification FALC_, 2020-01-14                                                                                                      | Explain checklist criteria and the need for target-reader review            | `falc-explication.pdf`; Unapei/Koena, CC BY-SA 4.0 as marked in the document                                               |
| _Liste de vérification FALC_, 2020-01-14                                                                                                                        | Manual review aid, not an automatic certificate                             | `falc-verification.xlsx`; Unapei/Koena, CC BY-SA as marked; Intro A16 says the checklist does not replace audience testing |
| [ISO 24495-1:2023](https://www.iso.org/fr/standard/78907.html)                                                                                                  | Context only                                                                | Full paid text not acquired or used; no claim of ISO compliance                                                            |

References reviewed on 2026-10-08. Preserve ɓ, ɗ and other necessary letters even
when a generic simplification recommendation could be read as removing them.
The audience needs these names accurately presented. The project adopts plain
language and selected FALC practices, not a claim that these are interchangeable.

## First review and validation

The initial repository scan covers 2,775 files. At adoption, 334 distinct
text/rule locations remain in the legacy baseline (392 individual matches).
There are also 584 advisory matches to review in context. These counts describe
remaining work, not corrected material. The strict Peul pilot covers both source
fiches and the three tone examples, without a legacy allowance.

The BMAD prose review was applied to the edited Peul passages with
`reader-facing-register.md` as `style_guide` and `reader_type=humans`.
Input: French prose with more than three words; JSON structure and source
bibliography are outside the prose review. Preserve the explanatory voice,
indirect references, African spellings and the status of each explanation.
The following communication fixes were applied:

| Original text                                                          | Revised text                                                                                                                        | Changes                                                                                                                  |
| ---------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| « C'est le nom que les Peuls se donnent, au pluriel et au singulier. » | « Fulɓe est le nom que les personnes concernées emploient pour se nommer au pluriel. Pour une seule personne, elles disent Pullo. » | Make the two forms explicit instead of assigning both numbers to one form.                                               |
| « Son sens n'est pas établi. »                                         | « Plusieurs explications du sens de ce nom ont été proposées. »                                                                     | Introduce the explanations that follow in ordinary language. Their hypothesis status remains explicit.                   |
| « et n'a pas lu l'ouvrage. »                                           | « mais nous n'avons pas consulté cet ouvrage. »                                                                                     | Resolve an ambiguous subject: the limitation concerns the project's consultation, not an action attributed to Wikipedia. |
| « Les exonymes ne reflètent pas l'auto-identification Fulbe. »         | « Ces noms donnés par d'autres personnes diffèrent de Fulɓe, le nom que les personnes concernées emploient pour se nommer. »        | Explain both technical terms and keep the contrast between names.                                                        |

The tone examples need no additional prose correction after this pass. This is
an agent review, not a test with the intended audience. No production database
import or social publication was performed as part of this implementation.

Validation on 2026-10-08: 66 targeted tests pass, including real Vale execution,
source preservation, large batches, conditional UI copy, publication failures and
the pre-import refusal. Type checking, changed-file lint/format checks, requirement
annotations, workflow syntax, documentation links and repository path checks pass.
The strict Peul check reports zero errors and zero warnings.

The full suite initially reported 9,988 passing tests and two failures. The Peul
wording changed a lexical count used by the Nommer dossier; that count and its
measurement date were updated, and its seven tests now pass. The other failure,
`bissaFicheMerge`, reads a pre-existing ignored migration log containing a retired
identifier. That unrelated local log was left untouched. `make check` also stops
on formatting in seven existing untracked `_bmad-output/forge/` mockup files;
all changed files pass formatting. The global local gate is therefore not green.

The separate skill-parity check also reports missing reference files in existing
local BMAD installations unrelated to this change. The modified content-strategy
skill is shared through its existing Codex mirror; the two editorial review
skills used by this plan are present. These local installation findings need
separate maintenance and are not hidden by changing the check.

## Existing-copy pass — 2026-10-09

- [x] Reproduce the existing findings, then distinguish public wording from CSS,
      internal figure references and official reference titles.
- [x] Write failing extraction/title tests before making the small checker fixes.
- [x] Rewrite the flagged fiche passages and site copy using the shared charter.
- [x] Review meaning and compare JSON before/after: only prose changes; source
      metadata, links, name spellings, hypothesis status and publication history
      remain intact.
- [x] Prune obsolete allowances without admitting any new baseline hashes.

The baseline shrank from 334 to 32 unique findings. The remaining allowances are
English API documentation and internal diagnostics, not French reader copy. The
strict check of all 1,799 dataset/publication files passes without a baseline.
Warnings remain available for contextual review; this pass does not claim that
all legacy writing is now simple or that every historical claim was reverified.

The two edited production records change only `answer` prose, which the site's
word-answer page renders. Their publication URLs, dates and source lists remain
unchanged. This does not edit a previously published social post. Fiche changes
are versioned source data; a normal data import is still needed for database-backed
pages. No remote database write or social publication was performed.

Three exact official names are allowed within authored notes: _Corpus bambara de
référence_, _Botswana Names Corpus_, and _Vers une lexicographie mandingue sur la
base de grands corpus annotés_. Generic uses of “corpus” in the same sentence
still fail. JSX `style`/`script` content and internal `figureKey`/`figureRefs` values
are protected; surrounding public prose remains checked. These narrow cases are
covered by tests, not directory-wide exceptions.

### Prose review

Inputs: the existing public passages; the shared charter as `style_guide`;
`reader_type=humans`. Keep a calm explanatory voice. Replace workshop reports,
unexplained terminology and noun fragments with connected sentences. The examples
below group repeated issues; the versioned diff carries each individual edit.

| Original text                                                                          | Revised text                                                                                             | Changes                                                                                            |
| -------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| Le corpus ne documente pas encore de fiche de nom pour cette recherche.                | Nous n’avons pas encore de fiche sur ce nom.                                                             | Say what is missing in everyday words.                                                             |
| Le corpus tient quatre noms venus du dehors pour un nom venu du dedans.                | Nos fiches recensent environ 4 noms donnés de l'extérieur pour un nom utilisé par les peuples eux-mêmes. | Explain the comparison; render its ratio from the existing counts.                                 |
| Le corpus ne tranche pas ces débats et renvoie aux travaux spécialisés.                | Les travaux spécialisés décrivent l'évolution de leur situation jusqu'aux tensions contemporaines.       | Keep the subject in view instead of explaining the project's posture.                              |
| Nous ne tranchons pas ; nous rapportons la suite de noms citée dans la lettre de 1945. | La suite de noms présentée ici vient de la lettre de 1945.                                               | Attribute the choice of account while keeping the surrounding disagreement and succession context. |
| État du corpus                                                                         | Avancement de la correction                                                                              | Name the information the reader can act on.                                                        |
| une migration démique biaisée vers les mâles                                           | Les hommes y auraient davantage participé que les femmes.                                                | Explain the migration hypothesis in ordinary French within its original attribution.               |
| cette proposition reste au statut claimed.                                             | Cette explication reste une hypothèse.                                                                   | Remove an internal status label from public prose; preserve the stored status.                     |

Repeated surname gaps now say which association or account remains undocumented,
without listing search queries. Specific distinctions remain: a person bearing a
name does not establish every family's origin; a place name is not proof about a
surname; a usage in one country does not establish a usage in another. Dated
Nommer counts are described as the chapter's recorded inventory, not a new census.

Validation for this pass: 214 prose fields changed across 169 dataset fiches and
two production-answer records, in addition to site/dictionary copy. A structural
before/after comparison preserved every non-prose value, reference key, source
metadata entry and publication-history row. The 189 edited public files pass the
strict check with zero errors and zero legacy allowances; 89 vocabulary warnings
remain visible for review of their other fields. All dataset/publication files
also pass strict checking. Data validation passes all 54 controls with no errors.

The full suite initially reported 9,989 passing tests and five failures. Three
assertions still expected the retired wording; they now check the same reader
promise in plain language. The real-Vale volume test exceeded its five-second
limit during the parallel run; it keeps the same batch and expected findings with
a 30-second allowance. The rerun of all affected suites passes 60 tests. The sole
unresolved failure is the pre-existing `bissaFicheMerge` test reading an ignored
migration log with a retired identifier; that local log remains untouched.
Type checking, the configured `src scripts` lint scope, changed-file formatting,
requirement annotations and staged copy-literal checks pass. No browser visual
review was performed in this text-only pass.
