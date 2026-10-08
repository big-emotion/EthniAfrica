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
