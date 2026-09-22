# Alignment plan — editorial promise and connected series

Based on the [confirmed essay](../essais/comprendre-les-societes-par-les-noms-2026-09-22.md),
[archived report](report-2026-09-22.md), [fresh evidence](evidence-2026-09-22.md)
and [roadmap](roadmap-2026-q4.md). This is an implementation plan, not a claim
that the product or templates have already been changed.

## Scope and decisions

The operator confirmed the essay as the next publication, the explicit
“understand Africa through names” intention in video/carousel introductions,
Monday/Wednesday/Friday appointments, and the first six subjects in their
proposed order. They explicitly left the weekly subject count flexible.
Four to six pieces remains a working envelope, subordinate to research quality.

The site has already adopted **L'Afrique à travers ses noms** in PR #1266:
`src/lib/brand.ts`, the header, About lead and render-engine tagline are aligned.
Do not redo that completed work. This plan closes the gap between that signature,
the opening of an episode and a connected publishing journey. It complements
[the September reorientation plan](../refonte-plan-2026-09-18.md), rather than
replacing its search/result architecture or creating another corpus.

Each phase starts with observable acceptance checks, then the smallest change
that satisfies them. Code changes require a failing test first and the relevant
project checks; documentation-only work uses link, attribution, completeness and
format checks, not tests that merely repeat prose. Dependencies below are ordered.
No Jira tickets, Confluence changes or external posts are created by this file;
formal specification work belongs to `ethniafrica-spec` when implementation starts.

## Phase 0 — preserve the decision and measurement

**Verify first:** the supplied report survives verbatim with attribution; the
six subjects retain their order; inherited metrics and fresh observations are
separate; all six networks have an explicit collected/missing status; no
cross-platform conversion ratio or unverified readiness claim is introduced.

- **A01 — Done:** archive report and index it. Home: this strategy directory.
- **A02 — Done:** create evidence note, roadmap and this plan; link to the essay.
- **A03 — Done in this change:** replace the production ledger's superseded
  five-subjects-per-day target with the operator's new flexible thematic cadence.
  This is a policy replacement, not a fabricated claim that bootstrap gates passed.
  The strategist skill and its launch/platform references now point to this
  revision so future runs do not reinstate the old quota or rigid pillar rotation.
- **A04 — Pending:** reconcile Sep 21 studio URLs with the private production
  library and versioned records. Owner: production workflow. Acceptance: exact
  post, format, channel, date and URL match; no repeated-angle candidate described
  as new merely because the ledger is stale. Do before selecting final cuts.

## Phase 1 — make the opening promise explicit

**Verify first:** review one name reel, one myth carousel and the project-intention
piece in a thumbnail and in their first seconds. The promise must be audible or
readable in the opening sequence, the name-specific question clear, and text
legible at mobile viewing size. Check 320–430 px first, then tablet and desktop.
Record the current conflict: a name reel's title is fixed, the carousel cover
has strict content limits, and S0 is not a name etymology.

- **A05 — Pending, before S0:** prepare the essay publication through
  `ethniafrica-idee` → `ethniafrica-structure`. Keep the user-requested S0 as a
  one-off project-intention piece; define its existing production-record home
  without inventing a corpus entity or silently adding a typology. Deliver a
  complete text for operator review before rendering or publication.
- **A06 — Pending, before S1:** `structure` and `ethniafrica-message` resolve
  placement of “Comprendre l’Afrique à travers les noms” in the opening movement
  while retaining the existing brand signature. Canonical homes:
  `docs/design/gabarits-social/GABARITS-SOCIAL.md`, the relevant idea/structure
  instructions, and the renderer only if placement needs code. Link the essay;
  do not paste its doctrine into every skill.
- **A07 — Pending, after A06:** if code changes are necessary, add failing layout
  assertions for the selected placement, implement the minimal shared change,
  render one reel and one eligible carousel, and inspect the results. Keep
  canonical `.claude/skills` and `.agents/skills` entry points in parity if edited.
  Do not revise every format or rerender historical publications for this alone.

Acceptance is communicative and visual as well as technical. An intention
hidden only in a caption or closing does not meet the operator's request.

## Phase 2 — research the first chapter before scripting

**Verify first:** build a claim/source/uncertainty sheet per subject. A source
must support the exact proposition, not merely mention the society. Record
contradictions, oral-source context, variant spellings, dates and the claim's
scope. Weak references remain labelled; being present in JSON is not clearance.

Owner: `afrik-curator`, with `idee` consuming the resulting evidence.

- **A08 — Pending, before S1:** repair the Mali etymology overstatement and
  separate historical uses from the modern state's name. Confirm the promised
  follow-up's precise scope. Smallest edit: the relevant naming passage and
  supporting sources, not a whole-country rewrite.
- **A09 — Pending, before S2/S3:** verify Manden/Mandé/mandingue distinctions,
  identity uses and Julakan morphology; incorporate the existing Dioula follow-up
  research rather than opening a duplicate production.
- **A10 — Pending, before S4/S5:** substantiate jamu and named obligations;
  separate oral founding narratives, norms and observed practice. No shared
  surname → unique ancestor inference, and no alliance → absence of wars claim.
- **A11 — Pending, before S6:** establish the Diina's terminology, period and
  institutions from targeted sources. Do not date “the Fulbe” from one polity.
- **A12 — Pending, two weeks before each later chapter:** apply the same source
  sheet to S7–S14, verifying a genuinely distinct angle against existing posts.
  The [roadmap briefs](roadmap-2026-q4.md#research-briefs-and-comparables) specify
  entry points and current evidence gaps.

For any corpus change, add/check the relevant existing validation case first,
make only the needed field/source edits, run AFRIK/editorial validation and the
translation-parity report, and record any permitted English deferral. This plan
itself changes no fiche or translation status.

## Phase 3 — let a reader continue from a post to the next question

**Verify first:** manually follow a real source link from each native app into
the relevant French name result/fiche. Check actual tapability, redirects,
consent and retained attribution. Do not blame the site for missing clicks or
claim that a URL in a caption was clickable without observing it.

- **A13 — Pending, before the first historical episode:** production/strategy
  chooses one precise destination per piece. Mali must land on the Mali answer;
  Traoré on the naming answer, not an unrelated family directory. Use the existing
  link builder. Preserve the subject and next step after consent decisions.
- **A14 — Pending, highest-priority experience work:**
  `ethniafrica-experience-optimizer` inspects About, Traoré and Mercator on mobile
  (320–430 px), then tablet, then desktop. Inherited samples are 6, 6 and 21
  visitors: verify the path before deciding a redesign. Show the reader a
  relevant next name or question and a return path.
- **A15 — Pending, after A14:** specify links in both directions across the
  first sequence using existing search/name/fiche surfaces. Prefer one shared
  template change over six bespoke pages. Repository file scope is 772 people,
  54 countries, 39 languages, 797 patronyms and 25 families, but applicability
  depends on data; do not assume every record is complete.
- **A16 — Pending, after path verification:** establish per-post tracking with
  platform, publication date, distinct angle and target URL. Confirm a measured
  event without adding a tracking system or removing consent. Keep native
  platform taps, post views and consented site arrivals as different measures.

If UI or routing changes follow, first write a failing journey test for the
observed failure, implement the smallest shared correction and perform a visual
mobile-first check. This phase does not author new page designs inside strategy.

## Phase 4 — run a sustainable editorial review

**Verify first:** the first two weeks have recorded production effort, source
readiness, publication URLs and measurable feedback. Do not infer capacity from
the old thirty-renders-per-week aspiration.

- **A17 — Pending, weekly:** select the next three appointments from the ordered
  subject queue; name the new question of every continuation. Select useful
  companions after research, without padding to six pieces.
- **A18 — Pending, 3–4 Oct and then at the roadmap checkpoints:** compare
  same-platform, same-format, similarly aged pieces. Read comments as questions,
  distinguish correction from disagreement, and record why the next chapter
  deepens or moves. Review at 72 hours, seven days and 28 days where available.
- **A19 — Pending, 4 Dec:** review audience geography, workload, unfinished
  corrections and continental progression. Retain the opening promise; adjust
  its execution if retention evidence identifies a problem.

Keep this process in a simple dated review table and existing ledger. No new
scheduler, analytics integration or automation is necessary to start. Actual
posting remains the operator's decision for the specific reviewed piece.

## Phase 5 — extend the continent, then assess an English line

**Verify first:** select the next regional chapter from source readiness, a
specific unanswered question and refreshed comparables. Check that expansion
is not perpetually postponed by the best-performing community. Distinguish a
comparison from proof of historical contact.

- **A20 — Pending, 19–20 Dec:** prepare the next North/Sahara–Sahel, East/Indian
  Ocean, Southern/Great Lakes or island chapter, using the roadmap's continental
  horizon. Those regions remain research directions until precise briefs exist.
- **A21 — Deferred:** scope original English content with its own audience,
  themes, two pilot briefs and measured workload. Resolve bilingual counterpart
  policy explicitly; do not silently treat original English content as an
  exemption. Keep current French-only publication mode until a separate launch
  decision is made. No English deliverable is required to finish this quarter.

## Completion record for this planning task

The report, evidence note, ordered roadmap and implementation backlog are saved.
Cadence documentation reflects the latest operator decision. Public intros,
corpus corrections, UI changes, scripts, renders, posting, scheduler entries and
English launch remain future work with the dependencies above. No unfinished
implementation is labelled complete merely because its plan exists.
