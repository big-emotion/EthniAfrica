# Editorial consistency audit — 2026-09-30

The new guide is integrated, but conflicting instructions, templates and public prose remain. This report records **33 findings**: 24 confirmed conflicts or delivery/content gaps, six policy/style tensions, and three explicitly unimplemented follow-ups. These categories are not interchangeable.

**This is an inventory, not a remediation.** No source weights, public copy, corpus records, local skill copies, permissions or Confluence contracts were changed.

## Work checklist

- [x] Freeze the integrated baseline and separate the unmerged plan.
- [x] Inventory tracked files, local instruction surfaces and canonical pages.
- [x] Screen text and review retained instruction/code/content findings in context.
- [x] Reproduce the checker mismatch and run the existing editorial gate read-only.
- [x] Separate confirmed conflicts, policy tensions, plan gaps and false positives.
- [x] Save occurrence and coverage appendices with precise locations.

## Scope and limits of completeness

Baseline: `f23c464634165a4d768f901b767fbb5aa1f0f339` on recette, including the merged voice/persona change. Shared checkout: initially `64c96cdc09fab1e3a2804640fb3ce74e810c220c`, later observed clean at `f23c46463` during final verification. Later plan: `be9084345`, not merged in this baseline.

The inventory covers all **6,191 tracked files**: **5,910 UTF-8 text files** and **281 binary files**. Broad text screening returned 14,582 line/rule matches in 3,216 files; these are candidates, not violations. Targeted contextual review retained the findings below. Local instruction screening includes 2,319 additional text paths after excluding nested worktrees and dependency/cache directories. Confluence coverage includes all 74 retrieved nonsensitive pages; the environment-value-location page was deliberately excluded. Only relevant clauses were reviewed in depth. Page versions are recorded in the appendix; canonical documents are linked, not mirrored.

**Completeness is bounded:** all eligible tracked text was screened (`.env.example`, `.mcp.json` and generated `package-lock.json` were inventory-only), but every sentence of the full corpus was not independently fact-checked or manually semantically reviewed. Binary images/videos were not OCRed/transcribed. This audit does not cover deployed database contents, private production libraries, platform posts absent from the repository, private recordings or every retired worktree revision. Therefore it does **not** certify that no other contradiction exists. The exhaustive deliverables are the file coverage inventory and the occurrences retained by the documented sweeps, not a claim of omniscient semantic coverage.

The broad scan covered author-first constructions; academic/authority vocabulary; audience/persona assertions; oral/source-tier admission; categorical certainty; internal workshop language; and methodological framing. Narrow author review walked non-metadata JSON strings in the active French corpus and English sidecars, searching sentence starts `Selon`, `D'après`/`D’après` and `According to`. It reviewed 141 candidates and retained **87 occurrences**. This pattern misses other forms such as ‘X argues…’; it is not an all-language grammar proof. The all-field register sweep used the project's existing `violatesReaderRegister`, filtered structural values, and reviewed 61 candidates, retaining **53 occurrences**. A JSON pointer is the precise locator; a repeated identical string can share the first matching source line.

## Complete finding register

| ID          | Finding                                                                                     | Classification                                                         |
| ----------- | ------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| [C01](#c01) | The curator is told to put tier reasoning into public notes                                 | Active instruction conflict                                            |
| [C02](#c02) | Wikipedia is both admitted and forbidden                                                    | Active instruction and public-copy conflict                            |
| [C03](#c03) | Canonical Confluence still contains a source-exclusion contract                             | Specification conflict; decision not silently resolved                 |
| [C04](#c04) | Local Codex skill copies restore retired rules                                              | Local operational conflict                                             |
| [C05](#c05) | The shared checkout and the plan are not at the same delivered state                        | Delivery gap                                                           |
| [C06](#c06) | CLAUDE retains superseded oral approval and carrier deduplication                           | Active instruction conflict                                            |
| [C07](#c07) | The curator reference still blocks incomplete population estimates                          | Active instruction conflict                                            |
| [C08](#c08) | The colonial-border model still demands Tier 1/2 or abandonment                             | Active template conflict                                               |
| [C09](#c09) | The cited source-of-truth template prescribes unstructured citations                        | Active reference conflict                                              |
| [C10](#c10) | All oral surname accounts must fit a griot/transcription shape                              | Structural mismatch with plural oral provenance                        |
| [C11](#c11) | Name templates force a universal assertion                                                  | Active template and executable-check conflict                          |
| [C12](#c12) | The surname template presupposes one original form and civil-register change                | Active template conflict                                               |
| [C13](#c13) | A source checker rejects a book even when the book is the subject                           | Reproduced executable mismatch                                         |
| [C14](#c14) | A checker comment still equates citing a book with missing field contact                    | Active maintenance-instruction conflict                                |
| [C15](#c15) | The English reference recommends prohibited project wording and misstates coverage          | Active reference conflict                                              |
| [C16](#c16) | A remaining before/after example broadens a negative claim                                  | Guide contradicts its own evidence-preservation rule                   |
| [C17](#c17) | Game-design instructions still request raw field paths in the reveal                        | Active instruction drift; renderer already corrected                   |
| [C18](#c18) | Author-first prose remains in the corpus                                                    | Confirmed content occurrences                                          |
| [C19](#c19) | A homepage anecdote retains the same author-first construction                              | Confirmed public-copy occurrence                                       |
| [C20](#c20) | Two people fiches repeat a missionary evaluation                                            | Confirmed public-prose conflict                                        |
| [C21](#c21) | Outside descriptions become unbounded descriptions of peoples                               | Confirmed scope and framing problem; underlying history not reverified |
| [C22](#c22) | Dense linguistic terminology still substitutes for explanation                              | Confirmed readability examples; not a word ban                         |
| [C23](#c23) | Internal maintenance prose survives outside the three guarded provenance fields             | Confirmed corpus leak; gate blind spot                                 |
| [C24](#c24) | The sources page still privileges an institutional bibliography and mislabels pending work  | Public explanatory mismatch                                            |
| [T01](#t01) | Institutional standing still determines source weights                                      | Existing policy tension, not an accidental regression                  |
| [T02](#t02) | Repeated accounts increase the score without an independence test                           | Existing accepted tradeoff to reconsider                               |
| [T03](#t03) | Some discovery surfaces still filter by standing                                            | Existing exceptions requiring a decision                               |
| [T04](#t04) | A source score can read like verified truth                                                 | Public interpretation risk under existing policy                       |
| [T05](#t05) | The research frame has not yet become a documented plural method                            | Proposed methodological work                                           |
| [T06](#t06) | The voice charter still models a record more than a conversation                            | Style tension to test with readers                                     |
| [G01](#g01) | Continental reading contexts are present but not yet operationally specified                | Unimplemented proposed-plan scope                                      |
| [G02](#g02) | Personas are instructed, but their actual use has not been audited in delivered productions | Verification gap, not missing routing                                  |
| [G03](#g03) | Understanding and source-consultation outcomes remain unmeasured                            | Declared measurement gap                                               |

<a id="c01"></a>

### C01 — The curator is told to put tier reasoning into public notes

**Active instruction conflict.** [.claude/skills/afrik-curator/reference/source-tiers.md:108](https://github.com/big-emotion/ethniafrica/blob/f23c464634165a4d768f901b767fbb5aa1f0f339/.claude/skills/afrik-curator/reference/source-tiers.md#L108) says notes contain the reason for the tier, not a source summary. The guide and CLAUDE explicitly reserve that reasoning for the internal ledger. Following this reference recreates the leak just removed. Keep useful source context; move editorial classification rationale to the ledger.

<a id="c02"></a>

### C02 — Wikipedia is both admitted and forbidden

**Active instruction and public-copy conflict.** [CLAUDE.md:575](https://github.com/big-emotion/ethniafrica/blob/f23c464634165a4d768f901b767fbb5aa1f0f339/CLAUDE.md#L575) coexists with the same file's explicit admission of directly cited Wikipedia URLs. [.claude/skills/afrik-curator/reference/source-tiers.md:102](https://github.com/big-emotion/ethniafrica/blob/f23c464634165a4d768f901b767fbb5aa1f0f339/.claude/skills/afrik-curator/reference/source-tiers.md#L102), [.claude/skills/ethniafrica-ticket/SKILL.md:87](https://github.com/big-emotion/ethniafrica/blob/f23c464634165a4d768f901b767fbb5aa1f0f339/.claude/skills/ethniafrica-ticket/SKILL.md#L87), [.claude/skills/ethniafrica-mythe/SKILL.md:55](https://github.com/big-emotion/ethniafrica/blob/f23c464634165a4d768f901b767fbb5aa1f0f339/.claude/skills/ethniafrica-mythe/SKILL.md#L55), [.claude/skills/ethniafrica-clip-reel/references/network-captions.md:22](https://github.com/big-emotion/ethniafrica/blob/f23c464634165a4d768f901b767fbb5aa1f0f339/.claude/skills/ethniafrica-clip-reel/references/network-captions.md#L22) and [src/lib/i18n/copy/sourcesBibliography.ts:5](https://github.com/big-emotion/ethniafrica/blob/f23c464634165a4d768f901b767fbb5aa1f0f339/src/lib/i18n/copy/sourcesBibliography.ts#L5) keep exclusionary wording. The production audit makes Wikipedia-as-source P0 and caps its score: [.claude/skills/ethniafrica-audit/SKILL.md:212](https://github.com/big-emotion/ethniafrica/blob/f23c464634165a4d768f901b767fbb5aa1f0f339/.claude/skills/ethniafrica-audit/SKILL.md#L212), lines 274 and 287. A fully identified dated article and the unidentifiable word ‘internet’ are not the same case. Reconcile discovery preference with the current publish-and-label policy; do not pretend a consulted source was not used.

<a id="c03"></a>

### C03 — Canonical Confluence still contains a source-exclusion contract

**Specification conflict; decision not silently resolved.** [REQ-092](https://big-emotion.atlassian.net/wiki/spaces/ETHNIAFRIC/pages/190840834) rejects or sends blogs, ordinary social posts, Wikipedia and aggregators to review rather than publishing them as sources. [DEC-011](https://big-emotion.atlassian.net/wiki/spaces/ETHNIAFRIC/pages/194773003) calls several of these prohibited factual evidence. [DEC-035](https://big-emotion.atlassian.net/wiki/spaces/ETHNIAFRIC/pages/194641922) and [DEC-055](https://big-emotion.atlassian.net/wiki/spaces/ETHNIAFRIC/pages/200310786) say publish and label. DEC-055 explicitly leaves alignment of REQ-092 as an open question. These pages cannot all be read as equivalent current instructions. Record the eventual ruling and supersession links; do not treat this audit as approval to change a canonical decision.

<a id="c04"></a>

### C04 — Local Codex skill copies restore retired rules

**Local operational conflict.** Ten files differ between the shared checkout's `.agents/skills/` and `.claude/skills/`; [the full list](local-mirror-drift.csv) includes both editorial and operational drift. Most consequential: `.agents/skills/ethniafrica-ticket/SKILL.md:87` (local copy) forbids Tier 3 and orders deletion; `.agents/skills/ethniafrica-spec/SKILL.md:312` (local copy) still requests Tier 1/2 sourcing. The local onomastics and message copies miss the new shared voice/persona block and retain older review instructions. This is a real difference in entry points, not ten independent new editorial doctrines. Repair linkage during remediation; do not edit every duplicate separately.

<a id="c05"></a>

### C05 — The shared checkout and the plan are not at the same delivered state

**Delivery gap.** PR #1422 merged on 2026-09-29 at 23:37:04 UTC as `f23c46463`. The shared checkout was at `64c96cdc0` at the initial inspection, then reached `f23c46463` before the final verification through activity outside this audit; that checkout lag is now resolved. The later plan commit `be9084345` is not an ancestor of recette; its document is absent from this integrated baseline. [The saved plan remains on its commit](https://github.com/big-emotion/ethniafrica/blob/be9084345/docs/editorial/remediation-plan-2026-09-30.md). A merged PR cannot deliver commits pushed afterwards. This audit does not synchronize another working checkout or reclassify the plan as implemented.

<a id="c06"></a>

### C06 — CLAUDE retains superseded oral approval and carrier deduplication

**Active instruction conflict.** [CLAUDE.md:643](https://github.com/big-emotion/ethniafrica/blob/f23c464634165a4d768f901b767fbb5aa1f0f339/CLAUDE.md#L643) requires an approved narrative and counts one carrier once. [supabase/migrations/091_oral_narratives_before_review.sql:103](https://github.com/big-emotion/ethniafrica/blob/f23c464634165a4d768f901b767fbb5aa1f0f339/supabase/migrations/091_oral_narratives_before_review.sql#L103) and [DEC-055 §6](https://big-emotion.atlassian.net/wiki/spaces/ETHNIAFRIC/pages/200310786) admit rights-cleared public narratives before review and count source IDs. Old [DEC-052](https://big-emotion.atlassian.net/wiki/spaces/ETHNIAFRIC/pages/199163928), [REQ-161/162](https://big-emotion.atlassian.net/wiki/spaces/ETHNIAFRIC/pages/198836243) and [ARCH-022](https://big-emotion.atlassian.net/wiki/spaces/ETHNIAFRIC/pages/199131139) retain earlier clauses; DEC-055 explicitly supersedes the approval/deduplication parts. Consent is not superseded. Align the active instruction, and annotate old contracts rather than restoring their gate.

<a id="c07"></a>

### C07 — The curator reference still blocks incomplete population estimates

**Active instruction conflict.** [.claude/skills/afrik-curator/reference/directives.md:78](https://github.com/big-emotion/ethniafrica/blob/f23c464634165a4d768f901b767fbb5aa1f0f339/.claude/skills/afrik-curator/reference/directives.md#L78) says both demographic bands fail. CLAUDE and DEC-055 make them warnings and show incompleteness to readers. The stale instruction can cause omission or invented completeness. Preserve dated estimates and explicit limits.

<a id="c08"></a>

### C08 — The colonial-border model still demands Tier 1/2 or abandonment

**Active template conflict.** [public/modele-frontiere-coloniale.json:5](https://github.com/big-emotion/ethniafrica/blob/f23c464634165a4d768f901b767fbb5aa1f0f339/public/modele-frontiere-coloniale.json#L5) says a border without those tiers must never be published. That contradicts CLAUDE/DEC-055, where CR1 warns about standing. A traceable source is still required; low standing alone is no longer a veto.

<a id="c09"></a>

### C09 — The cited source-of-truth template prescribes unstructured citations

**Active reference conflict.** [.claude/skills/afrik-curator/reference/directives.md:4](https://github.com/big-emotion/ethniafrica/blob/f23c464634165a4d768f901b767fbb5aa1f0f339/.claude/skills/afrik-curator/reference/directives.md#L4) calls public directives the source of truth. [public/DIRECTIVES-AFRIK.md:117](https://github.com/big-emotion/ethniafrica/blob/f23c464634165a4d768f901b767fbb5aa1f0f339/public/DIRECTIVES-AFRIK.md#L117) prescribes strings, while the curator, current models and [REQ-093](https://big-emotion.atlassian.net/wiki/spaces/ETHNIAFRIC/pages/190840834) require structured source data. This undermines the promised traceability of distinct claims and accounts. Clarify precedence and update the template contract.

<a id="c10"></a>

### C10 — All oral surname accounts must fit a griot/transcription shape

**Structural mismatch with plural oral provenance.** [src/lib/afrik/parsers/patronymeParser.ts:71](https://github.com/big-emotion/ethniafrica/blob/f23c464634165a4d768f901b767fbb5aa1f0f339/src/lib/afrik/parsers/patronymeParser.ts#L71) and its adjacent transcription field are mandatory; [src/lib/afrik/parsers/patronymeTypes.ts:53](https://github.com/big-emotion/ethniafrica/blob/f23c464634165a4d768f901b767fbb5aa1f0f339/src/lib/afrik/parsers/patronymeTypes.ts#L53), [public/modele-nom-patronyme.json:28](https://github.com/big-emotion/ethniafrica/blob/f23c464634165a4d768f901b767fbb5aa1f0f339/public/modele-nom-patronyme.json#L28), [docs/runbooks/anthroponym-fiche-research.md:52](https://github.com/big-emotion/ethniafrica/blob/f23c464634165a4d768f901b767fbb5aa1f0f339/docs/runbooks/anthroponym-fiche-research.md#L52) and [.claude/skills/afrik-curator/reference/source-tiers.md:156](https://github.com/big-emotion/ethniafrica/blob/f23c464634165a4d768f901b767fbb5aa1f0f339/.claude/skills/afrik-curator/reference/source-tiers.md#L156) propagate this. [REQ-133](https://big-emotion.atlassian.net/wiki/spaces/ETHNIAFRIC/pages/190840834) uses the same wording. The public model allows ‘griot or informant’, so the implementation does not literally verify the person's profession; the narrow field name and obligatory transcription still pressure collectors to fit every account into that model. Represent the actual carrier/collection form, including agreed anonymity, without inventing missing details or removing permission checks.

<a id="c11"></a>

### C11 — Name templates force a universal assertion

**Active template and executable-check conflict.** [.claude/skills/ethniafrica-structure/references/gabarit-reel-nom.md:48](https://github.com/big-emotion/ethniafrica/blob/f23c464634165a4d768f901b767fbb5aa1f0f339/.claude/skills/ethniafrica-structure/references/gabarit-reel-nom.md#L48) requires ‘always several names’. [social/tools/narration/gabarit-reel.mjs:150](https://github.com/big-emotion/ethniafrica/blob/f23c464634165a4d768f901b767fbb5aa1f0f339/social/tools/narration/gabarit-reel.mjs#L150) enforces it. All six files in `social/tools/narration/exemples/` begin with the same universal pattern. Selecting a subject with several attested names does not establish a rule about every people, country or language. The dialect variant already permits several endonyms: do not falsely describe the implementation as universally enforcing exactly one endonym.

<a id="c12"></a>

### C12 — The surname template presupposes one original form and civil-register change

**Active template conflict.** [.claude/skills/ethniafrica-structure/references/gabarit-reel-nom.md:145](https://github.com/big-emotion/ethniafrica/blob/f23c464634165a4d768f901b767fbb5aa1f0f339/.claude/skills/ethniafrica-structure/references/gabarit-reel-nom.md#L145) and [social/tools/narration/gabarit-reel.mjs:174](https://github.com/big-emotion/ethniafrica/blob/f23c464634165a4d768f901b767fbb5aa1f0f339/social/tools/narration/gabarit-reel.mjs#L174) require a fixed explanation regardless of what produced the variants. Multiple languages, transmission paths or unsettled origins can make that causal statement unsupported. Keep the name-inventory structure conditional on the researched case.

<a id="c13"></a>

### C13 — A source checker rejects a book even when the book is the subject

**Reproduced executable mismatch.** [social/tools/narration/plain-language.mjs:199](https://github.com/big-emotion/ethniafrica/blob/f23c464634165a4d768f901b767fbb5aa1f0f339/social/tools/narration/plain-language.mjs#L199) flags document words anywhere in a sentence. Read-only probes return `attribution-en-tete` for ‘Ce livre raconte la vie de son auteur.’ and for a source line placed after the explanation. The guide explicitly allows a book/author as the actual subject. Its acknowledgement of lexical limits does not supply an exception to this executable rule. Keep human semantic adjudication and test legitimate document subjects before changing the checker.

<a id="c14"></a>

### C14 — A checker comment still equates citing a book with missing field contact

**Active maintenance-instruction conflict.** [social/tools/narration/plain-language.mjs:111](https://github.com/big-emotion/ethniafrica/blob/f23c464634165a4d768f901b767fbb5aa1f0f339/social/tools/narration/plain-language.mjs#L111) preserves the exact inference corrected by the new guide. Citing a book proves neither a visit nor the absence of one. Remove that inference from future instructions; keep transparent collection provenance.

<a id="c15"></a>

### C15 — The English reference recommends prohibited project wording and misstates coverage

**Active reference conflict.** [.claude/skills/afrik-translator/reference/register.md:114](https://github.com/big-emotion/ethniafrica/blob/f23c464634165a4d768f901b767fbb5aa1f0f339/.claude/skills/afrik-translator/reference/register.md#L114) gives ‘The atlas…’ as the good example, despite prohibiting project self-reference as atlas above it. [.claude/skills/afrik-translator/SKILL.md:90](https://github.com/big-emotion/ethniafrica/blob/f23c464634165a4d768f901b767fbb5aa1f0f339/.claude/skills/afrik-translator/SKILL.md#L90) is also stale: the current gate reads English sidecars and both vocabulary lists for French. This is a documentation defect, not evidence English is currently unvalidated.

<a id="c16"></a>

### C16 — A remaining before/after example broadens a negative claim

**Guide contradicts its own evidence-preservation rule.** [docs/editorial/reader-facing-register.md:95](https://github.com/big-emotion/ethniafrica/blob/f23c464634165a4d768f901b767fbb5aa1f0f339/docs/editorial/reader-facing-register.md#L95) changes ‘no deceased bearer’ into ‘no bearer’. [.claude/skills/afrik-translator/reference/register.md:117](https://github.com/big-emotion/ethniafrica/blob/f23c464634165a4d768f901b767fbb5aa1f0f339/.claude/skills/afrik-translator/reference/register.md#L117) does the same in English. A search restricted by eligibility cannot support the broader absence. The adjacent ‘living person excluded’ example also changes a fact about eligibility into an absence statement. Explain the documented scope without publishing private data or exposing workshop rules.

<a id="c17"></a>

### C17 — Game-design instructions still request raw field paths in the reveal

**Active instruction drift; renderer already corrected.** [.claude/skills/afrik-game-designer/SKILL.md:104](https://github.com/big-emotion/ethniafrica/blob/f23c464634165a4d768f901b767fbb5aa1f0f339/.claude/skills/afrik-game-designer/SKILL.md#L104) requests verbatim text and its field path. [src/lib/games/revealProvenance.ts:17](https://github.com/big-emotion/ethniafrica/blob/f23c464634165a4d768f901b767fbb5aa1f0f339/src/lib/games/revealProvenance.ts#L17) and `src/components/play/GameAnswerReveal.tsx` already translate or omit those paths. Correct the skill to the working implementation; this audit does not claim the current game UI displays raw paths.

<a id="c18"></a>

### C18 — Author-first prose remains in the corpus

**Confirmed content occurrences.** The [author-opening review](author-opening-review.csv) lists every candidate from the specified sentence-opening sweep, with a retain/exclude decision and JSON pointer. Retained cases include Mali (`MLI.json`, etymology), Lingala (`lin.json`, whyProblematic), Fula (`PPL_FULA.json`, originOfExonyms), Dioula and Manianga. Move the reference after the explanation while preserving which interpretation belongs to whom. An attributed oral tradition or a competing hypothesis is not automatically a violation; those cases are separately excluded. This is not a historical fact-check of each statement.

<a id="c19"></a>

### C19 — A homepage anecdote retains the same author-first construction

**Confirmed public-copy occurrence.** [src/lib/home/didYouKnowFacts.ts:1310](https://github.com/big-emotion/ethniafrica/blob/f23c464634165a4d768f901b767fbb5aa1f0f339/src/lib/home/didYouKnowFacts.ts#L1310) and [src/lib/home/didYouKnowFacts.en.ts:1270](https://github.com/big-emotion/ethniafrica/blob/f23c464634165a4d768f901b767fbb5aa1f0f339/src/lib/home/didYouKnowFacts.en.ts#L1270) introduce the market and nickname explanations with Van Bulck/Monnier/Wiliame. Retain the competing accounts and their qualifiers, but let the explanations lead.

<a id="c20"></a>

### C20 — Two people fiches repeat a missionary evaluation

**Confirmed public-prose conflict.** [dataset/source/afrik/peuples/FLG_OMOTIQUE/PPL_SHEKO.json:60](https://github.com/big-emotion/ethniafrica/blob/f23c464634165a4d768f901b767fbb5aa1f0f339/dataset/source/afrik/peuples/FLG_OMOTIQUE/PPL_SHEKO.json#L60) states a need for evangelistic materials; [dataset/source/afrik/peuples/FLG_BANTU/PPL_GOVA.json:73](https://github.com/big-emotion/ethniafrica/blob/f23c464634165a4d768f901b767fbb5aa1f0f339/dataset/source/afrik/peuples/FLG_BANTU/PPL_GOVA.json#L73) evaluates churches by whether they transmit the Gospel. ‘According to Joshua Project’ does not make those value judgments the people's own needs or beliefs. Contextualize the provider's standpoint if relevant; do not adopt it as the project's description.

<a id="c21"></a>

### C21 — Outside descriptions become unbounded descriptions of peoples

**Confirmed scope and framing problem; underlying history not reverified.** [dataset/source/afrik/peuples/FLG_NILOTIQUE/PPL_NUER.json:81](https://github.com/big-emotion/ethniafrica/blob/f23c464634165a4d768f901b767fbb5aa1f0f339/dataset/source/afrik/peuples/FLG_NILOTIQUE/PPL_NUER.json#L81) describes Nuer violence in the general present without a bounded period or group. [dataset/source/afrik/peuples/FLG_GUR/PPL_BUSSA.json:31](https://github.com/big-emotion/ethniafrica/blob/f23c464634165a4d768f901b767fbb5aa1f0f339/dataset/source/afrik/peuples/FLG_GUR/PPL_BUSSA.json#L31) and [dataset/source/afrik/peuples/FLG_NIGERCONGO/PPL_BUSANSI.json:33](https://github.com/big-emotion/ethniafrica/blob/f23c464634165a4d768f901b767fbb5aa1f0f339/dataset/source/afrik/peuples/FLG_NIGERCONGO/PPL_BUSANSI.json#L33) reproduce ‘intrusive Mande’ as a description. Moving the author's name alone would worsen these passages. First bound, explain and reassess the inherited classification; never make one external description a timeless trait.

<a id="c22"></a>

### C22 — Dense linguistic terminology still substitutes for explanation

**Confirmed readability examples; not a word ban.** [dataset/source/afrik/famille_linguistique/FLG_NILOSAHARIENNE.json:69](https://github.com/big-emotion/ethniafrica/blob/f23c464634165a4d768f901b767fbb5aa1f0f339/dataset/source/afrik/famille_linguistique/FLG_NILOSAHARIENNE.json#L69) stacks singulative/collective, suprasegmental traits and an isogloss notation. [dataset/source/afrik/peuples/FLG_OMOTIQUE/PPL_DIZI.json:39](https://github.com/big-emotion/ethniafrica/blob/f23c464634165a4d768f901b767fbb5aa1f0f339/dataset/source/afrik/peuples/FLG_OMOTIQUE/PPL_DIZI.json#L39) offers ‘système de castes hypertrophique’ without a usable explanation. [dataset/source/afrik/famille_linguistique/FLG_MANDE.json:64](https://github.com/big-emotion/ethniafrica/blob/f23c464634165a4d768f901b767fbb5aa1f0f339/dataset/source/afrik/famille_linguistique/FLG_MANDE.json#L64) lists technical theories rather than a first layer of accessible explanation. Specialist terms and scholarly bibliography remain legitimate when explained; no automated score can establish comprehension.

<a id="c23"></a>

### C23 — Internal maintenance prose survives outside the three guarded provenance fields

**Confirmed corpus leak; gate blind spot.** The [register review](register-review.csv) records all 61 filtered candidates from applying the existing register matcher to all non-metadata JSON strings; retained rows contain internal identifiers in prose, duplicate-record instructions or research-pass commentary. Examples: `PPL_TUTRUGBU` recommends merging fiches, `PPL_TOMA_LOMA` starts with ‘DOUBLON POTENTIEL’, `PAT_OPIO` explains removal from ‘fiche vague 1’, and `PPL_COPTES` explains a database family assignment. Associated-people names also contain raw PPL identifiers. Pure ID fields, source keys, URLs and a historical migration ‘wave’ are excluded. The existing gate returned zero errors because its register rule focuses on gaps/source titles/source notes, not every narrative field. Repository content is verified; exposure on every deployed route is not.

<a id="c24"></a>

### C24 — The sources page still privileges an institutional bibliography and mislabels pending work

**Public explanatory mismatch.** [src/components/pages/SourcesPageContent.tsx:25](https://github.com/big-emotion/ethniafrica/blob/f23c464634165a4d768f901b767fbb5aa1f0f339/src/components/pages/SourcesPageContent.tsx#L25) foregrounds international/official/academic providers; no equivalent oral-account section is present in this static bibliography. Joshua Project sits under academic/linguistic sources, albeit with a religious-orientation warning ([src/components/pages/SourcesPageContent.tsx:485](https://github.com/big-emotion/ethniafrica/blob/f23c464634165a4d768f901b767fbb5aa1f0f339/src/components/pages/SourcesPageContent.tsx#L485)). This is a representation gap, not proof that every cited source is external or European. [src/lib/i18n/copy/sourcesBibliography.ts:6](https://github.com/big-emotion/ethniafrica/blob/f23c464634165a4d768f901b767fbb5aa1f0f339/src/lib/i18n/copy/sourcesBibliography.ts#L6) also describes ‘Awaiting review’ as incomplete source-tracing, whereas CLAUDE defines it as a tier ruling not yet made. Tell readers what is actually unknown.

<a id="t01"></a>

### T01 — Institutional standing still determines source weights

**Existing policy tension, not an accidental regression.** [CLAUDE.md:558](https://github.com/big-emotion/ethniafrica/blob/f23c464634165a4d768f901b767fbb5aa1f0f339/CLAUDE.md#L558) ranks institutional sources at 1.0, published work at 0.7 and community accounts at 0.4; oral provenance has an exception at 0.6 ([supabase/migrations/091_oral_narratives_before_review.sql:183](https://github.com/big-emotion/ethniafrica/blob/f23c464634165a4d768f901b767fbb5aa1f0f339/supabase/migrations/091_oral_narratives_before_review.sql#L183)). The guide explicitly preserves current tiers, so it did not authorize silently changing those weights. This remains a mismatch with judging a source's usefulness for the specific question. The curator's source-kind summary also omits the oral/synthesis exception. Evaluate relevance, collection conditions and independence before proposing a replacement; neither African origin nor institutional standing establishes truth by itself.

<a id="t02"></a>

### T02 — Repeated accounts increase the score without an independence test

**Existing accepted tradeoff to reconsider.** [supabase/migrations/091_oral_narratives_before_review.sql:179](https://github.com/big-emotion/ethniafrica/blob/f23c464634165a4d768f901b767fbb5aa1f0f339/supabase/migrations/091_oral_narratives_before_review.sql#L179) counts source IDs, not independent lines of evidence. [DEC-055](https://big-emotion.atlassian.net/wiki/spaces/ETHNIAFRIC/pages/200310786) explicitly accepts ten narratives from one carrier raising confidence as ten sources. The new guide says repeated books are not independent confirmation. These are distinct notions of quantity and corroboration; expose the difference and evaluate it without pretending the migration violates its own specification.

<a id="t03"></a>

### T03 — Some discovery surfaces still filter by standing

**Existing exceptions requiring a decision.** [src/lib/search/companionCatalogs.ts:151](https://github.com/big-emotion/ethniafrica/blob/f23c464634165a4d768f901b767fbb5aa1f0f339/src/lib/search/companionCatalogs.ts#L151) excludes unverified-only proverbs from companion suggestions. [src/lib/supabase/queries/afrik/sitemapEntries.ts:153](https://github.com/big-emotion/ethniafrica/blob/f23c464634165a4d768f901b767fbb5aa1f0f339/src/lib/supabase/queries/afrik/sitemapEntries.ts#L153) implements the name-indexing threshold from [DEC-050](https://big-emotion.atlassian.net/wiki/spaces/ETHNIAFRIC/pages/196739074). [DEC-055 open questions](https://big-emotion.atlassian.net/wiki/spaces/ETHNIAFRIC/pages/200310786) explicitly leaves discovery/indexing alignment undecided. This is not removal of names from the ordinary site search. The quiz already has a bounded oral-source exception; do not report it as refusing all oral knowledge.

<a id="t04"></a>

### T04 — A source score can read like verified truth

**Public interpretation risk under existing policy.** [src/components/source-transparency/ConfidenceChip.tsx:13](https://github.com/big-emotion/ethniafrica/blob/f23c464634165a4d768f901b767fbb5aa1f0f339/src/components/source-transparency/ConfidenceChip.tsx#L13) presents a percentage and ‘verified’ date. [docs/editorial/reader-facing-register.md:69](https://github.com/big-emotion/ethniafrica/blob/f23c464634165a4d768f901b767fbb5aa1f0f339/docs/editorial/reader-facing-register.md#L69) follows the guide's assertion that the tier badge tells readers how far to trust a source. Elsewhere CLAUDE correctly says tier does not settle a claim. No comprehension study here establishes how readers interpret the chip. Treat this as a risk to evaluate, not a measured misunderstanding or a warrant to invent new scores.

<a id="t05"></a>

### T05 — The research frame has not yet become a documented plural method

**Proposed methodological work.** [CLAUDE.md:696](https://github.com/big-emotion/ethniafrica/blob/f23c464634165a4d768f901b767fbb5aa1f0f339/CLAUDE.md#L696) and [.claude/skills/ethniafrica-onomastique/SKILL.md:131](https://github.com/big-emotion/ethniafrica/blob/f23c464634165a4d768f901b767fbb5aa1f0f339/.claude/skills/ethniafrica-onomastique/SKILL.md#L131) keep a singular verification frame, while distinguishing it from whose voice counts. [docs/runbooks/anthroponym-fiche-research.md:72](https://github.com/big-emotion/ethniafrica/blob/f23c464634165a4d768f901b767fbb5aa1f0f339/docs/runbooks/anthroponym-fiche-research.md#L72) assigns an expert research role. This does not literally claim the operator has that qualification, but the output still needs the project's public-education framing. The later plan proposes researching situated African methods; none should be claimed as researched or representative of the continent yet. Generic planning tools are not evidence of European bias simply because they are generic.

<a id="t06"></a>

### T06 — The voice charter still models a record more than a conversation

**Style tension to test with readers.** [docs/design/brand-charter.md:253](https://github.com/big-emotion/ethniafrica/blob/f23c464634165a4d768f901b767fbb5aa1f0f339/docs/design/brand-charter.md#L253) and the translator reference require formal English and limit second-person address to existing French locations. This is not inherently inaccessible and does not authorize casual stereotypes. Test whether it helps or hinders the guide's invitation to investigate, especially in source/contribution prompts, before relaxing a blanket rule.

<a id="g01"></a>

### G01 — Continental reading contexts are present but not yet operationally specified

**Unimplemented proposed-plan scope.** P2 already cites Côte d'Ivoire, Guinea and Mali and requires a co-reader for every people-focused piece. P1 remains diaspora-first by operator intent. These are not four rigid demographic markets. The plan's P1 work—separating needs from location/language, choosing examples, explaining French terms in context and testing with voluntary readers—has not been executed. Do not replace it with an invented ‘African French’, national stereotype or assumed proficiency.

<a id="g02"></a>

### G02 — Personas are instructed, but their actual use has not been audited in delivered productions

**Verification gap, not missing routing.** AGENTS, CLAUDE and seven writing/review skills already point to the guide/personas. The persona document asks for the primary need in the existing brief. No new agent is required to make those instructions usable. This repository audit did not inspect the private production library or reconstruct every historical brief; it cannot certify consistent adoption. The plan's P4 should test real briefs and handoffs before adding an agent or a mandatory schema.

<a id="g03"></a>

### G03 — Understanding and source-consultation outcomes remain unmeasured

**Declared measurement gap.** The measurement protocol explicitly proposes voluntary comprehension checks and a future `fiche:source_click` implementation. Existing audience counts do not validate the four personas or prove that wording caused retention changes. This audit reused the dated report, did not recollect platform analytics, contact participants or install tracking. The remaining measurement work is proposed, not a failed implementation.

## What is deliberately not classified as a contradiction

- An African, European or other author is not disqualified by origin. A bibliography, quoted speaker, historical naming actor or genuinely book-focused explanation may name the author first.
- Oral attribution, permission, anonymity and a distinction between transmitted memory and independently established events are necessary, not evidence of dismissing oral knowledge.
- Ordinary uncertainty (‘one account’, ‘according to the tradition’) must not be removed to satisfy a keyword rule.
- Archives, retired migrations, quoted operator statements, old dated metrics and negative test fixtures are evidence of history, not automatically live instructions. Old source-policy clauses become risky when a current entry point still requests them.
- The About page already welcomes oral accounts and corrections. Seven relevant skills already load personas. No evidence justifies claiming those features are entirely absent.
- Platform geography does not establish diaspora membership, cultural expertise, language proficiency or one national way of reading. Côte d'Ivoire, Mali and Guinea need situated validation, not stereotyped rewrites.
- No evidence supports claiming that a generic project-management workflow is intrinsically European, or that one African methodology represents all communities.

## Validation and next use

The existing editorial gate completed with **0 errors, 95 warnings, 0 notices**. The frozen worktree’s skill-parity check passes; this does not certify the separate shared checkout’s ignored copies. Link/evidence checks found no broken relative report links or mismatched quoted locations. This establishes its current verdict, not the cultural or historical validity of every sentence. Read-only narration probes reproduced C13. No new implementation tests were needed for this audit document; remediation phases should start with failing cases or human review cases, then use the smallest useful change.

First reconcile delivery and local entry points (C04–C06), then conflicting active instructions/templates (C01–C17). Address content in bounded reviewed batches (C18–C24), preserving evidence and uncertainty. T01–T06 require explicit design/research decisions rather than mechanical substitutions. G01–G03 remain proposed work from the earlier plan. Creating an additional agent alone would not remove any contradictory instruction listed here.

## Appendices

- [Precise instruction/code locations](locations.csv) — evidence snippets at the frozen baseline, plus separately identified local copies.
- [Author-opening review](author-opening-review.csv) — all 141 focused candidates, retained and excluded.
- [All-field register review](register-review.csv) — all 61 filtered candidates, retained and excluded.
- [Local mirror drift](local-mirror-drift.csv) — all ten differing files, not all treated as editorial defects.
- [Tracked-file coverage](tracked-coverage.csv) — every baseline file and depth of review.
- [Local instruction coverage](local-coverage.csv) — additional local paths screened, excluding other checkouts.
- [Confluence coverage](confluence-coverage.csv) — retrieved page IDs, versions and canonical links.

Related: [reader-facing register](../reader-facing-register.md), [personas](../audience-personas.md), [voice review](../editorial-voice-review-2026-09-30.md), [audience audit](../../audience/audit-2026-09-30.md), [measurement protocol](../../audience/editorial-measurement.md).
