# Editorial unification — implementation plan

Status: implementation-ready work plan; implementation has not started in this document.
Updated 2026-09-30 after the operator requested removal of contradictions and duplicates,
with this conversation and its related decisions taking precedence over older project rules.

This is the **single active remediation plan**. It supersedes the earlier version at
commit `be9084345`, consolidates its P0–P6 work, and operationalizes all 33 findings in the
[contradictions audit](contradictions-2026-09-30/README.md). The audit remains dated evidence,
not a second normative guide. PR #1422 (guide/personas) and PR #1424 (audit) are merged.
Planning baseline: `93cc2288945dd0ba8c26ade58eb073a6b07349a5` on recette.

## Outcome and governing intent

One editorial doctrine must govern site copy, corpus records, captions, narration,
translations, games and the tools that produce them. No active duplicate may prescribe a
competing rule. Consolidation must preserve different accounts and source provenance:
two disagreeing traditions are not a documentation duplicate to delete.

The operator's decisions in this conversation govern the target:

- EthniAfrica popularizes knowledge in ordinary language. It draws on research without
  presenting the operator as a scientist, linguist or historian. Specialist help is welcome.
- Explain the subject first; put identifiable references beside or after the explanation.
  Keep uncertainty in the explanation. A book, quoted speaker or historical naming actor
  may itself be the subject. Never mechanically erase necessary attribution.
- Oral, local, written, material and scholarly sources may answer different questions.
  Publication or institutional standing alone neither establishes a claim nor invalidates
  a situated account. Do not turn an outside interpretation into a community's belief.
- Invite investigation, comparison and correction. Never invent a visit, interview,
  endorsement, local voice or consensus to make a piece look balanced.
- Diasporas remain the primary intended audience. People in Côte d'Ivoire, Mali, Guinea
  and elsewhere on the continent are direct readers across all four needs, not merely
  informants who validate content written for someone else.
- Investigate African research and transmission practices in their specific contexts.
  Neither a single universal African method nor a uniformly European method is assumed.
  Retain useful scientific and linguistic tools without making them the only framework.
- Existing rules that conflict with these decisions must be replaced or explicitly retired.
  Do not reopen settled preferences because an older skill or specification says otherwise.

This plan proposes implementation details below; it does not retroactively claim that
numeric-score changes or schema migrations were already specified by the operator.
Record their concrete contracts during P0/P3. Only genuinely new choices need a concrete
review; routine corrections already follow the operator's stated direction.

## One home for each responsibility

Reuse existing documents. Do not create another general charter, master prompt or agent
knowledge base that repeats the same rules.

| Responsibility                                                               | Canonical home                                           | What other surfaces contain                                                             |
| ---------------------------------------------------------------------------- | -------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| Editorial voice, source use, uncertainty and the operational research method | `docs/editorial/reader-facing-register.md`               | A reference and the step at which it must be loaded                                     |
| Four reader needs and contextual adaptations                                 | `docs/editorial/audience-personas.md`                    | Selected need/context in the existing brief                                             |
| Metrics, definitions and interpretation limits                               | `docs/audience/editorial-measurement.md`                 | Dated observations and links to definitions                                             |
| Agent entry instructions                                                     | `CLAUDE.md`; `AGENTS.md` remains its concise entry point | No independent editorial/source-policy tables                                           |
| Skill procedures                                                             | `.claude/skills/<name>/`                                 | `.agents/skills/` links to these canonical directories                                  |
| Native agent configuration                                                   | Existing `.claude/agents/` and `.codex/agents/`          | Identical role contract, generated or parity-checked; no separate editorial doctrine    |
| Technical requirements, decisions, data/API contracts                        | Existing Confluence tree                                 | Stable identifiers and links in code/repository; no competing full specification mirror |
| Public field shapes, source vocabulary and mechanical checks                 | Existing shared types/parsers/checkers                   | Models and consumers validated against that contract                                    |
| Research evidence, previous decisions, before/after reviews                  | Dated evidence records and Git history                   | Explicit historical/proposed status, never loaded as current instructions               |

Confluence records the technical consequences of the new direction and which old clauses
are superseded. An older Confluence clause must not silently override this conversation.
The guide owns editorial wording; Confluence owns the implementation contract. Link across
that boundary instead of maintaining the same mutable prose twice. Never silently mark a
Pending formal decision Approved or rewrite applied migrations as though history differed.

## Task list and dependencies

The implementation owner is the agent carrying out the repository work through existing
skills. The operator owns new editorial choices; real contributors provide situated input
when available. This plan does not create a new agent, schedule or delegated workflow.

- [ ] P0 — Freeze cases, establish precedence and create the closure ledger.
- [ ] P1 — Consolidate the guide, reader contexts and researched method.
- [ ] P2 — Remove competing instructions and repair every active entry point.
- [ ] P3 — Align source assessment, oral models, confidence and discovery behavior.
- [ ] P4 — Repair templates and enforce meaningful editorial checks.
- [ ] P5 — Correct existing content and reconcile actual duplicates.
- [ ] P6 — Verify real writing paths, comprehension and audience measurement.
- [ ] P7 — Validate delivery, retire obsolete routes and close every finding.

P0 precedes all work. P1 defines the common contract; P2 and P4 follow it. P3 uses the
P1 method and can proceed alongside P2/P4 once its concrete contract is recorded.
P5 begins with a small pilot after P2/P4, and uses P3 for source-dependent changes.
P6 measurement preparation can run alongside P5; P7 requires all applicable acceptance
evidence. Straightforward factual-scope corrections need not wait for a database redesign.
A pilot is the first batch, not a substitute for completing the remaining inventory.

Every phase is **test first, then the smallest useful change, then the same tests again**.
For prose and research, the first test is a recorded semantic case and expected distinction.
For code, add a failing behavioral test before changing behavior. Avoid tests that merely
look for the same sentence copied into multiple files.

## P0 — Establish the contract and the closure ledger

**Test first.** Freeze review cases before any correction:

| Case                                                                        | Required result                                                                   |
| --------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| Author-first explanation, including an African author                       | Subject leads; reference remains identifiable; uncertainty unchanged              |
| A book/author is the actual subject; direct quotation                       | Legitimate attribution remains and the checker permits it                         |
| A book published in 1912 describes an undated event                         | No conversion of publication year into event date                                 |
| A speaker describes present usage; collector relays an older account        | Actual carrier/collector, period and limits remain distinguishable                |
| Oral account without a griot or full transcript; protected identity         | Actual provenance fits; missing details stay missing; permissions remain enforced |
| Two publications repeat one account; two independent accounts disagree      | Reference count is not corroboration; disagreement remains visible                |
| Only deceased eligible bearers were investigated                            | Rewrite does not claim that no bearer exists                                      |
| One recorded name, several endonyms, uncertain original spelling            | No forced universal claim, invented exonym or single original form                |
| A source title contains a technical word; a prose field contains `PPL_*`    | Citation is preserved; internal identifier in reader prose is rejected            |
| Readers with different knowledge in Mali, Guinea, Côte d'Ivoire or diaspora | Same supported claims; useful context without assumed ignorance or expertise      |
| Current request to write a page without naming a skill                      | Same guide/persona requirements as the specialized writing path                   |
| Unique local skill customization versus stale copied rule                   | Unique work preserved for reconciliation; obsolete rule cannot remain active      |

Refresh the baseline since the audit; its 87 author-opening and 53 register occurrences
are seeds, not a final current count or the whole content scope. Preserve original text,
source pointers and audit classifications. Recheck the already resolved checkout lag;
do not reopen C05 as an unfixed branch problem without current evidence.

Create one implementation closure ledger, linked from this plan, with one row per C/T/G
finding: active locations, target rule owner, action, dependency, status, evidence/PR and
remaining limitation. Add occurrence-level disposition for content batches. Use existing
CSV evidence as input; do not copy every source passage into several reports.

Record the conversation's precedence in the guide's change history. In Confluence, identify
existing DEC/REQ/ARCH clauses affected by C03/C06 and T01–T04, reuse existing records where
appropriate, and provide explicit successor links. Preserve history without leaving an
old clause discoverable as a competing current instruction. No new ID is invented locally.

**Exit evidence:** all 33 findings mapped; cases and expected results saved before edits;
current baseline recorded; earlier plan replaced by this one; every normative responsibility
has one owner. **KISS:** one ledger and one reusable case set. **Covers:** C03, C05 and the
baseline for every remaining finding.

## P1 — Consolidate voice, personas and the method

**Test first.** Review the P0 cases with the current guide/personas. Identify which passages
cause the wrong output before rewriting them. Preserve a before/after semantic comparison.

Update the existing guide with a compact operational method: identify the reader's question;
identify the relevant speakers/place/time; seek appropriate evidence; record direct versus
mediated collection; compare accounts; write the explanation; attach usable provenance;
state uncertainty and invite a relevant next step. The working brief records this without
creating a second mandatory production schema.

Research methodological passages from African institutions, scholars and situated practices,
including oral-history collection and community-held approaches appropriate to the subject.
CELHTO, CODESRIA and the General History of Africa are starting leads from the earlier plan,
not readings already completed or substitutes for community practices. Keep exact locators,
what was actually read, applicable context, limitations and the adaptation proposed for
EthniAfrica in one dated research record. Integrate only supported operational rules into
the guide. Do not claim human consultation without actual participation.

Keep four needs: explore a connection; compare accounts; understand a new subject; deepen,
transmit or contribute. Separate these from geography, language and subject familiarity.
Each need must be usable on the continent and in a diaspora. Use common clear French;
adapt examples, explanations and documented local terms, without imitating a national
accent or treating location as language proficiency. Preserve the evidence/hypothesis labels.

Resolve C16's broadened negatives. Align the brand Voice section and translation reference
with the guide: precision and reading comfort govern sentence choices; formal style is not
an end in itself. Necessary specialist terms are explained. No blanket ban on books,
linguists, direct address or English contractions substitutes for semantic review.

**Exit evidence:** cases preserve meaning and uncertainty; four needs work across contexts;
every adopted methodological practice has read evidence and an explicit scope. Unconsulted
communities remain unconsulted in the report. **KISS:** update guide/personas, keep research
evidence separate. **Covers:** C16, T05, T06, G01; supplies the contract for T01–T04.

## P2 — Remove competing rules and local copies

**Test first.** Use `scripts/__tests__/skillParity.test.ts` and a temporary fixture containing
an old real mirror directory, a correct link, a broken link and a unique local customization.
The setup must detect divergence, preserve unique edits, and reach parity after reconciliation.
Run the same editorial case through the affected entry points before and after consolidation.

Replace repeated editorial doctrine in skills, CLAUDE, design references and templates with
short, explicit loading instructions and task-specific procedures. Keep AGENTS concise and
consistent with CLAUDE. In particular remove conflicting notes/tier instructions, blanket
Wikipedia exclusions, obsolete approval/deduplication statements, hard demographic bands,
Tier 1/2 border vetoes, string-source prescriptions, the book/fieldwork inference, translation
coverage claims and game field-path requirements identified by C01–C17.

Repair the ten local divergent files at the actual shared checkout, not just in a clean
worktree. Compare unique changes before replacing copied project skill directories with
canonical links. `scripts/setupAgentSkillLinks.ts` currently refuses a real directory;
extend its existing safe reconciliation path only if necessary. A disposable backup is
removed after verification; unique user work must first be retained in its appropriate home.
Do not delete unrelated installed skills merely because they are not project-owned.

Run setup/parity as part of supported checkout provisioning and a read-only preflight before
editorial work. CI validates the committed canonical resources and a fresh setup; a local
preflight validates ignored live copies. A clean CI clone cannot certify another checkout.
Do not silently reset branches or interrupt another active task to repair its checkout.

Inventory every relevant entry point, including essays, myths, clip captions, translator,
games, direct page-copy requests and existing video planner/executor handoffs. One active
shared guide is loaded; a worker handoff carries the needed context and guide version.
Use existing paired agent contracts and parity tests; do not add an editorial agent now.

**Exit evidence:** no independent project skill copies remain on repaired active entry
points; setup is repeatable; unique changes preserved; every obsolete normative passage has
been replaced or retired; no active link loads a retired rule. **KISS:** reuse linking and
parity tools, not a new synchronization service. **Covers:** C01–C09, C14, C15, C17, G02.

## P3 — Align sources, oral provenance and public confidence

**Test first.** Exercise source-to-page behavior, not just enum shapes: the same present-usage
claim with oral, archival and institutional sources; a source outside its competence; an
unreviewed but permitted account; a restricted/withdrawn account; dependent citations; and
an unverified-only but traceable name/proverb. Verify parser, loader, database, API, visible
copy, quiz qualification, recommendations and indexing behavior where affected.

**Recommended target for this plan:** assess support for the claim, expose provenance and
limits, and stop using an institution-based percentage as a public proxy for truth. Do not
replace 1.0/0.7/0.4 with another arbitrary hierarchy. Preserve legacy tier/score fields for
compatible consumers during migration, but remove their use as the editorial verdict in
public copy and source-only suppression/ranking decisions. This is a proposed implementation
choice derived from the conversation, not a claim that the operator dictated a new formula.

Publish source form, actual carrier/author, collector when applicable, date/context, usable
locator, review status and the statement it supports. Unknown remains unknown. Distinguish
number of references from independent corroboration; keep two retellings visible without
claiming that they are independent. Record known shared origin/dependence using the existing
reference/assertion links where possible. Do not deduplicate everything from one carrier:
one person can convey distinct accounts, and two people can repeat one account.

Generalize the surname oral shape away from compulsory `griot` and full `transcription`.
Support a carrier or agreed description, direct/mediated collection, summary/transcript/audio
locator as actually available, language/context when known and permitted public detail.
Retain valid existing griot/transcription values through a lossless compatibility adapter;
never fabricate values to pass a schema. Keep permission, access, withdrawal and rejection
conditions separate from academic validation.

Replace absolute admission rules with traceability and appropriate claim scope. Wikipedia,
blogs, community sources or scholarly collections are identified for what they actually are;
a source is neither hidden merely for its category nor elevated beyond what it supports.
An AI-produced statement is not evidence of an interview or observed practice.

Update the sources page and public labels: show oral/local accounts actually present; explain
pending review accurately; separate review date from a declaration that the claim is true.
Prefer claim relevance and transparent provenance to automatic institutional precedence.
Do not invent an oral collection just to populate a section.

Map every consumer of tier/confidence before changing behavior. For names, suggestions,
quizzes and sitemaps, source standing alone must not suppress otherwise publishable material.
Preserve scope requirements, content usefulness and permission rules: an attributed oral
account may support a question about that account, not an unqualified historical fact.
Distinguish editorial confidence from ordinary search relevance, which can still rank useful
matches. Record exact changes to DEC-050/052/055 and related requirements in Confluence.

Use new migrations, a bounded sample and before/after exports. Preserve source IDs and
existing API behavior through an explicit compatibility/deprecation boundary; remove legacy
logic only after its consumers are migrated. Verify deployed migration state read-only before
claiming parity. Rollback retains original provenance and never restores public access to
withdrawn/restricted testimony.

**Exit evidence:** target contract recorded; oral records survive round trips; repeats do not
read as independent confirmation; source-only exclusions removed from identified consumers;
public labels match actual state; permissions and legacy compatibility tested. **KISS:** no
new numeric truth score, no wholesale corpus retiering. **Covers:** C03, C06, C10, C24, T01–T04.

## P4 — Make templates and checks enforce the same contract

**Test first.** Add failing behavioral cases for the book-as-subject exception, an author-first
claim, one versus several attested names, uncertain spelling origin, absence statements,
internal prose in nested chapters and a legitimate source title/structural identifier.

Repair `social/tools/narration/gabarit-reel.mjs` and its reference/examples so they validate
useful structure without forcing ‘always several names’, one original spelling or a civil
register explanation. Keep special cases supported by the researched subject.

Repair `plain-language.mjs` so lexical findings are scoped appropriately. A broad document-word
match cannot be a definitive semantic verdict. Mechanical checks may block clear internal
leaks; ambiguous attribution requires an explicit review with evidence, not a silent bypass.

Extend `readerFacingProseFields` in `scripts/ci/checkEditorialRules.ts` to cover prose actually
rendered across record families, reusing existing parser/translation field metadata when
possible. Cover new nested fields; avoid a second drifting hard-coded field list. Test the
rendering boundary as well as extraction. Do not blanket-ban IDs in structural fields or
technical words in real bibliography titles. Keep the source corpus fit to publish rather
than adding an output filter that hides the defect.

Use one fixture corpus of before/after review cases for all writing routes. Automated assertions
cover deterministic behavior; a semantic review records claim scope, attribution, uncertainty
and reader comprehension. Extend existing checks/CI rather than creating another linter stack.

**Exit evidence:** legitimate examples pass, known bad cases fail or receive the documented
semantic disposition, no template forces an unsupported factual sentence, and prose-field
coverage is tested. **KISS:** one shared rule implementation plus semantic review.
**Covers:** C11–C15, C17, C23; prevents recurrence of C18–C22.

## P5 — Correct content and remove real duplicates

**Test first.** Preserve originals and their source mappings. Establish expected meaning for
three pilot pieces: a site page/fiche, a contested name-origin piece and a social caption.
Include an oral account only when one is actually available and usable. Review the same
cases before and after; a rewrite must not make the evidence stronger than it was.

Then complete the backlog in this order:

1. Missionary evaluations and unbounded descriptions of peoples (C20/C21); correct framing
   and verify the supported scope before merely moving an author's name.
2. Internal maintenance prose and identifiers (C23), including nested narrative fields;
   preserve legitimate structured references and move actual maintenance notes internally.
3. Author-first explanations and homepage counterparts (C18/C19); retain competing accounts,
   attribution, uncertainty, location and period.
4. Dense specialist prose (C22), sources-page explanations (C24), translations and reused
   captions/quiz reveals. Explain before adding detail; retain real bibliographic titles.
5. Expand beyond the seed patterns to remaining public prose and production artifacts.
   Follow the audit coverage inventory. Record route/field coverage and newly found cases;
   a zero regex count is not a semantic completion criterion.

Each occurrence gets one disposition: corrected with evidence; false positive with reason;
or superseded/deleted with a verified replacement. An unresolved blocker remains open.
Publish no bulk mechanical rewrite of historical claims. If support is insufficient, state
that scope/gap instead of inventing certainty or deleting the existence of a transmitted account.

Separate three meanings of duplicate:

| Kind                                                         | Action                                                                                                                          |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------- |
| Repeated instruction/template                                | Keep one canonical rule; replace active copies with references; retire unused copies                                            |
| Same editorial text intentionally used in several components | Reuse a shared data/copy source or controlled derivation; retain appropriate FR/EN and platform adaptations                     |
| Suspected duplicate people/name records                      | Research identity, region, period and aliases first; different accounts or neighboring groups are not merged by name similarity |

For confirmed entity duplicates, preserve provenance, IDs/aliases or redirects, inbound links,
relations and revisions; test old URLs/searches before migration. Moving duplicate-warning
prose out of a fiche does not itself resolve the duplicate. For unproven duplicates, document
why both records remain and make their distinction understandable without workshop vocabulary.

For private social libraries and binary media omitted from the audit, enumerate reachable
assets, read sidecar copy/transcripts and transcribe/review media when needed. Record inaccessible
assets as uncovered, not clean. Already published network posts require a correction package
and appropriate publication action; preparing this plan does not edit or publish them.

**Exit evidence:** every retained seed occurrence disposed of; broader scope inventoried and
reviewed in batches; suspected duplicates reconciled with preserved links; French/English
counterparts or valid deferrals recorded. **KISS:** bounded batches with one evidence record,
not a global regeneration. **Covers:** C18–C24 and the editorial-duplication objective.

## P6 — Validate actual use and useful audience outcomes

**Test first.** Run the same cases through idea selection, research, writing, translation,
message review, games/captions and an ordinary page-copy request. Test a fresh conversation
and a resumed worker handoff so success does not depend on memory of this chat.

At briefing, choose one primary reader need and the relevant context. The newcomer persona
checks intelligibility; the account-comparison persona checks situated representation; the
deepening/contribution persona checks whether sources are usable. These are review lenses, not four separate drafts or inferred audience identities.
Verify the final output against the common guide. Existing agents coordinate existing skills;
a new editorial agent is unnecessary for this remediation.

Use voluntary comprehension feedback across the needs and continental/diaspora contexts.
An initial 5–8 readers can expose problems but is not representative. Ask them to restate the
point, uncertainty and where they would check it; distinguish disagreement from misunderstanding.
Do not claim a successful reader study without actual participants or contact anyone merely
because the plan names this work.

For measurement, write failing tests before adding `fiche:source_click` at the actual source
interaction: no event without consent, one event per intended activation, no personal testimony
in properties, correct source-link classification, keyboard/navigation behavior preserved.
Add an exposure denominator only if reporting a rate. Verify a controlled observation reaches
the intended dashboard. Do not create a new analytics platform or infer ethnicity/diaspora.

Reuse the measurement protocol and date every platform window. Compare retention, saves,
source consultation and qualitative feedback at comparable post ages, with topic/format
limitations stated. Views alone neither validate personas nor prove that the wording caused
an improvement. Review mobile 320–430 px first, then tablet 768–1199 px, then desktop ≥1200 px.

**Exit evidence:** writing routes produce aligned outputs; persona selection is visible in
real briefs; instrumentation is verified; actual feedback and pending participation are
separated. Reach or a green checker cannot replace semantic review. **KISS:** existing tools,
small metric dictionary, no new dashboard or recurring automation. **Covers:** G01–G03, T06.

## P7 — Close the audit and prevent recurrence

**Test first.** Deliberately introduce a stale local skill copy, a broken guide link, an old
normative rule in an active fixture, a new internal-prose leak and a legitimate historical
quotation. Confirm the relevant control detects the defects while allowing history/quotations.
These are behavioral controls, not a promise that software can recognize every contradiction.

Complete the closure ledger with one evidence-backed disposition for every C/T/G finding.
Retire obsolete active rule files and references after checking incoming links. Preserve audit
reports and source history as dated evidence. Resolve Confluence supersession, generated models,
agent entry points and actual local installations in the same release sequence; do not call
alignment complete because only the repository clone is clean.

Run affected tests, then the repository's required checks with Node 22: `make check`,
`lint:req`, skill parity, document/link checks, source/model/loader checks where touched,
translation readiness and appropriate database/API/permission tests. Never merge over a red
required check. For migrations, verify recette round trips and public rendering before normal
production release; save a recoverable baseline and validate rollback against privacy rules.

A wording-only batch can ship independently once reviewed. A source-contract change ships
as its complete dependency chain, not with the UI using new semantics while API/quiz logic
still uses the old meaning. Confirm merge and deployment state; a commit appended after a PR
merge is not delivered by that PR.

**Completion criteria:**

- Every known finding is resolved or shown with evidence to be inapplicable/superseded;
  no unresolved contradiction is relabelled ‘done’.
- One active owner exists for each editorial rule; all relevant entry points load it.
- Canonical and live local skill entry points agree; repeatable setup prevents copied rules.
- Templates, public prose, models and source-related behavior implement the same contract.
- Every corrected claim retains usable provenance, scope and uncertainty; variants remain visible.
- Coverage includes declared content surfaces, with inaccessible material listed explicitly.
  Partial content coverage cannot be called total remediation.
- Automated checks catch known mechanical regressions and human review covers meaning.
- Changes are merged, required checks pass, and deployment/data synchronization are verified
  where applicable. Reader studies and measurements are reported only when actually performed.

“Permanent” means removing competing active rule sources and making reintroduction detectable.
It cannot mean guaranteeing that no future writer will make a semantic mistake. Reopen the
ledger when a new contradiction is found; add its regression case before correcting it.

## Finding-to-phase closure map

| Finding | Primary phase | Required closure evidence                                                                |
| ------- | ------------- | ---------------------------------------------------------------------------------------- |
| C01     | P2            | Tier reasoning removed from public-note instructions; correct note example               |
| C02     | P2/P3         | One admission rule across skills, audit rubric, site copy and behavior                   |
| C03     | P0/P3         | Explicit Confluence successor links and aligned technical contracts                      |
| C04     | P2            | All ten observed local drifts reconciled; live parity and repeatable setup               |
| C05     | P0/P7         | Single plan integrated; actual branch/merge/deployment state recorded                    |
| C06     | P2/P3         | Oral review/permission/count distinctions match instructions and implementation          |
| C07     | P2            | Demographic bands consistently warn and partial estimates remain labelled                |
| C08     | P2            | Border template no longer restores the retired Tier 1/2 veto                             |
| C09     | P2/P3         | Public models and instructions agree with structured source parsers                      |
| C10     | P3            | Non-griot oral account round trip with no invented transcript/identity                   |
| C11     | P4            | One/multiple-name cases work without a forced universal statement                        |
| C12     | P4            | Unknown original spelling and non-civil-register changes are supported                   |
| C13     | P4            | Book-as-subject passes; authority substitution receives the correct review               |
| C14     | P2/P4         | Book citation implies no invented presence or absence of field contact                   |
| C15     | P2            | English reference examples and stated gate coverage match reality                        |
| C16     | P1/P4         | Negative claim preserves the exact investigated scope in FR/EN                           |
| C17     | P2/P4         | Game skill matches readable reveal behavior; no raw-path regression                      |
| C18     | P5            | All retained author-opening rows reviewed; wider constructions covered                   |
| C19     | P5            | Homepage anecdote and counterpart preserve both explanations and provenance              |
| C20     | P5            | Missionary judgments no longer become the project's statement of local needs             |
| C21     | P5            | People's descriptions bounded by place/time/account; loaded terms reassessed             |
| C22     | P5            | Specialist concepts explained in the first reading layer; sources preserved              |
| C23     | P4/P5         | Retained leaks corrected; nested public prose covered without structural false positives |
| C24     | P3/P5         | Sources page represents actual source variety and accurate review state                  |
| T01     | P3            | Claim relevance replaces institutional standing as the editorial verdict                 |
| T02     | P3            | Reference quantity and known/unknown independence are visibly distinct                   |
| T03     | P3            | No standing-only exclusion in mapped discovery/indexing/quiz consumers                   |
| T04     | P3            | Public score/date wording cannot claim a probability of truth or false verification      |
| T05     | P1            | Read methodological evidence, scoped adaptations and no invented consultation            |
| T06     | P1/P6         | Style rules aligned and tested with actual reading contexts                              |
| G01     | P1/P6         | All four needs cover continental and diaspora readers without stereotypes                |
| G02     | P2/P6         | Real outputs and fresh-session/handoff trials demonstrate guide use                      |
| G03     | P6            | Consent-respecting event observed and comprehension evidence honestly reported           |

## Which tools apply the shared method

| Moment                        | Existing tool or entry point                                                           | Required use                                                                      |
| ----------------------------- | -------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| Subject and angle             | `ethniafrica-content-strategist`, `ethniafrica-idee`                                   | Select reader need/context, question and evidence gaps in the brief               |
| Research and corpus           | `afrik-curator`                                                                        | Apply the common method; map claims to actual sources                             |
| Narration, cards and captions | `ethniafrica-structure`, relevant clip/essay skill                                     | Load the same guide; adapt the format without adding another doctrine             |
| Review                        | `ethniafrica-message`, `ethniafrica-onomastique`, `ethniafrica-mythe` where applicable | Check meaning, scope and provenance; do not invent a myth or name-origin question |
| Translation and games         | `afrik-translator`, `afrik-game-designer`                                              | Preserve supported meaning and apply the same public register                     |
| Production/handoff            | Existing production skill and planner/executor roles                                   | Carry the approved text, reader need, source/context references and guide version |
| Plain page-writing request    | AGENTS → CLAUDE → common guide/personas                                                | Apply the method even without explicit skill invocation                           |
| Audience feedback             | `ethniafrica-audience-audit`, existing analytics/reporting                             | Update evidence and hypotheses; do not turn reach into cultural identity          |
| Mechanical enforcement        | Existing setup/parity, narration and editorial-field checks                            | Enforce deterministic constraints and route semantic uncertainty to review        |

Scripts do not select a reader's cultural identity or decide that an oral account is true.
Skills and existing agents share the same references; none owns a competing knowledge base.

## Reviewable delivery batches

Use one change per coherent outcome: (1) canonical guide/personas and supersession record;
(2) instruction cleanup and local setup; (3) source contract and compatibility migration;
(4) templates/checks; (5) pilot followed by remaining content batches; (6) minimal measurement
and route trials; (7) closure and delivery verification. Keep each implementation test-first.
Adapt the order to the dependencies above, not to an arbitrary fixed number of PRs.

No bulk deletion, database mutation, platform publication, Confluence edit, invitation or
recurring task is performed by saving this plan. Already-authorized implementation decisions
need no repeated permission; any genuinely new consequential choice must be presented as a
concrete reviewed change, with its impact, rather than another abstract planning question.
