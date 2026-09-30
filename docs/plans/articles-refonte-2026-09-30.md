# Articles redesign — option A implementation and content recovery plan

Status: **option A selected by the operator; implementation plan, not implementation evidence**.
Date: 2026-09-30. Repository baseline: `65aa7a8ad7e508bdc15d6f7c95a32923cfe59649` on `recette`.

This document makes the redesign executable without the originating conversation.
It records the operator's decisions, the observed starting point, recommended implementation
defaults, test-first phases, ownership, dependencies and completion evidence. It is a work
plan, not a replacement for the technical requirements in Confluence or the editorial guide.
No site pages, publication records or production media were changed while preparing it.

## 1. Operator request and decisions

The operator wants the current **Les dossiers** section to become articles developed from
content already published on social networks. A reader sees the original reel or carousel,
then a written article developing the subject. Carousels may use a slider. **Anecdotes,
Proverbes and Galerie remain; the other current dossier navigation entries are removed.**

The preceding analysis compared three approaches:

- **A — Articles:** direct access, a recent-article listing, one shared media-first article template.
- B — Le journal: an editorial front page with a maintained lead selection.
- C — Histoires: series and guided reading paths.

The operator explicitly selected **A** and requested a complete implementation plan, with
all available context, a decision on whether content recovery could be done at once, and
explicit instructions on parallel agents. B and C are not additional mandatory features.

The agreed target is:

1. Main navigation: **Parcourir · Articles · Jouer · Découvertes**.
2. Editorial access: **Tous les articles · Anecdotes · Proverbes · Galerie**.
3. Article listing shows available subjects, not unavailable module promises.
4. Article order: title and brief metadata → publication media → article text → references and related reading.
5. Social publications are the editorial starting material. Their underlying evidence must
   still support claims in the article; the project cannot cite itself as the sole proof.
6. Incorporate the work from the chat **Clarifier la voix éditoriale** and its canonical documents.
7. Mobile first: **320–430 px**, then tablet **768–1199 px**, then desktop **1200 px and above**.
8. TDD and KISS in every implementation phase. Documentation, comments, commits and PR
   descriptions are in English. Reader-facing French and English copy follows the locale rules.

### Recommended defaults, distinguished from the operator's explicit decisions

- Keep existing `/fr/dossiers` and `/fr/dossiers/<slug>` addresses for the first release,
  while changing the visible label to Articles. This avoids a gratuitous URL migration.
- Keep the current anecdote, proverb and gallery URLs and behavior.
- Keep Découvertes as the short-form reader, with a contextual **Lire l'article** link when
  a published article exists. Do not replace the immersive reader with a second article body.
- Keep the current brand, global search purpose and locale-publication mode.
- Use one article per editorial angle; an article may reference several editions or formats.
  Cross-posting the same edition on four networks does not create four articles.
- Reuse the project's existing JSON/content and media patterns; no new CMS, generalized page
  builder, recommendation engine, account system or mandatory database migration.
- No full editorial-unification rewrite, social re-rendering or source-tier redesign belongs
  in this feature. Consume the shared editorial decisions and coordinate overlapping changes.

These defaults guide routine implementation. If evidence makes one unsuitable, document
the concrete replacement and its consequences rather than silently introducing a second system.

## 2. Required context and precedence

Read these sources before editing, in this order:

1. `AGENTS.md` and `CLAUDE.md`: workflow, worktrees, traceability and locale behavior.
2. This plan: accepted product direction and bounded delivery scope.
3. [Reader-facing register](../editorial/reader-facing-register.md),
   [personas](../editorial/audience-personas.md), and
   [editorial unification plan](../editorial/remediation-plan-2026-09-30.md).
4. [Contradictions audit](../editorial/contradictions-2026-09-30/README.md), especially findings
   affecting templates, source attribution, local accounts and public prose.
5. [Brand](../design/brand-charter.md), [typography](../design/typography-charter.md) and
   [actions](../design/actions-charter.md) charters; invoke the project art-direction skill
   before changing visible compositions.
6. [Social editorial contract](../design/gabarits-social/EDITORIAL-CONTRACT.md),
   [production ledger scope](../productions/README.md),
   [media decision](embedded-media-decision.md), and
   [production-history plan](production-history-plan.md). Their dated observations are not
   substitutes for the current code or the operator's newer direction.
7. [Audience measurement](../audience/editorial-measurement.md) and the
   [September 30 evidence](../audience/audit-2026-09-30.md).

The editorial unification plan is now merged into `recette` through PR #1426, merge commit
`c3fe51d9e`. Earlier chat links to its archived worktree are no longer the handoff location.
The guide/personas and audit are integrated; the existence of the plan does **not** mean its
33 findings have all been corrected. Check its implementation ledger and current branch state.

Settled editorial principles apply immediately: popular education rather than borrowed
professional authority; subject before reference; uncertainty beside the claim; oral and
local knowledge considered in context; no invented interviews, consensus or community voice.
Readers on the continent are direct readers, not merely validators for diaspora readers.
Use the existing four reader needs, not invented demographic personas or separate writing
styles for every country. Do not duplicate the guide inside a new article charter.

Two old design rules need a scoped update: brand charter §8.6 restricts axis hubs to a
text/archive spread, and the navigation currently exposes draft entries as Bientôt. The
selected article listing supersedes those rules for this editorial section only. Update their
tests and documentation with the behavior change; do not delete tests to bypass the conflict.
The operator's breakpoint ranges above supersede older 720/800 px shorthand in project prose.

Confluence remains the home of REQ/DEC/ARCH contracts. Use the existing project specification
workflow to check relevant contracts and record amendments before implementing behavior that
changes them. Do not allocate requirement numbers from memory or recreate a specification mirror.

## 3. Dated findings and recovery feasibility

### 3.1 Current site and implementation

Observed on the public site on September 30, at 320/390 px, then 900 px, then 1440 px:

- Mobile dossier navigation counts 13 entries; only Anecdotes, Proverbes and Galerie are
  active links. Remaining entries are presented as Bientôt.
- The dossier landing page presents section choices and an archive image rather than articles.
- The seven records under `dataset/source/afrik/dossiers/` all have `readiness: draft`.
- The dynamic dossier page already exists, but its strict content model requires a vertical,
  rubric, thesis, chapters, readings and related structures. It does not supply the requested
  social-media opening or an article publication lifecycle.
- `EmbedFacade` supplies click-to-load YouTube playback and consent handling. The current
  enabled provider list is YouTube only; TikTok, Instagram and Facebook link out.
- `DiscoveryReader` supplies carousel display, position controls and optional audio, but its
  surrounding full-screen navigation is not the article reading layout.
- `toDiscoveryPublication` currently projects videos, not local carousel frames. Its body
  can be just a question or short description. It is not a full article generator.
- Human sitemap and XML sitemap both depend on `siteTree`; do not assume article detail URLs
  will be discovered automatically. The current human tree also adds name/doctrine links
  beyond the visible dossier landing-page cards.

### 3.2 Recount performed for this plan

| Measurement                                                   | Observed value | Interpretation                                                         |
| ------------------------------------------------------------- | -------------: | ---------------------------------------------------------------------- |
| Site ledger subject records                                   |             56 | Name series plus exceptions; not the complete private workshop         |
| Site records with at least one social URL                     |             51 | Candidate subjects, not approved articles                              |
| Site publication-occurrence rows                              |            142 | Multiple networks, formats and editions                                |
| Occurrences with a URL                                        |            120 | 78 video rows and 42 carousel rows                                     |
| Occurrences with both URL and date                            |            111 | Nine URL-bearing rows lack a recorded date                             |
| Occurrences without URL                                       |             22 | Not counted as verified live posts                                     |
| Private library records                                       |            128 | All statuses combined                                                  |
| Private records declared `publie`                             |             74 | Publication is recorded, not independently rechecked on every platform |
| Published private records with at least one HTTPS channel URL |             32 | Other channel fields may contain publication notes instead of URLs     |
| Published folders resolved from date and directory            |       74 of 74 | Folder existence does not establish complete media                     |
| Declared copy paths found under the workshop root             |       66 of 74 | Eight pointers need reconciliation; text may exist elsewhere           |
| Media files in the scoped published-folder scan               |            588 | Includes alternate export formats; not 588 approved assets             |
| Total bytes in that media scan                                |  1,527,305,576 | About 1.53 GB decimal; not a deduplicated web-delivery estimate        |

The media scan counted PNG/JPEG/WebP, MP4, MP3 and WAV files, excluding dot/underscore
directories and `work/`. It was an existence/size scan, not playback, OCR, licensing or
historical verification. Do not add private and site totals together.

Eight declared copy pointers did not resolve: `afrique`, `lingala`, `nigeria`, `bantu`,
`cameroun`, `corriger-la-carte`, `ghana`, `senegal`. Resolve moved/archived copy or publication
captions before treating any as lost. Two published folders contain only `post.md` in the
examined tree: `creole-ne-dans-la-colonie` and `senoufo-caste-sculpteurs`. Their rendered media
requires separate recovery. Never substitute a similarly named file without evidence.

The private folders are located by environment variables, not personal absolute paths:

- `ETHNIAFRICA_SOCIAL_PROJECTS`: subject research, `cards.json`, narration, captions and assets.
- `ETHNIAFRICA_SOCIAL_POSTS`: published/ready/draft library shelves.
- The library index is the posts root's sibling `00-Index/publications.json`.
- Use that index's `library-paths.mjs` to resolve shelves and dates; do not invent a new
  directory convention. A published record normally resolves to `Publie/<date>/<dir>`.

A concurrent chat, **Clean social pipeline intermediates**, recently changed cleanup rules
(PR #1427). Re-read the current export/retention behavior and snapshot the selected release
files before relying on transient `work/` outputs. Do not run cleanup as part of recovery.

### 3.3 Decision: recovery belongs in one dedicated phase, with an internal pilot

**A complete one-shot copy/import cannot be called correct today.** The unresolved copy
pointers, two empty media folders, date/edition mismatches and divergent inventories prevent
that claim. No bulk media transfer is performed in this planning task.

Implement recovery as **P3 below**, containing inventory reconciliation → three pilots →
idempotent bulk import of resolved material → explicit exceptions. This is one delivery phase,
not dozens of manual per-network projects. Article writing and review remain P5.
Do not describe a pilot or an exceptions report as completion of the full backlog.

Current public-asset limits are 41 MiB total and 2 MiB per file in
`scripts/ci/checkPublicAssetWeight.ts`. A raw 1.53 GB copy into `public/` is not a workable
implementation. Preserve masters in the private library, export web derivatives, measure the
total, and select durable delivery in P1/P3. Do not raise limits merely to admit raw masters.

### 3.4 Three seed cases

| Pilot                               | Available starting material                                                           | Specific risk to resolve                                                                                                                         |
| ----------------------------------- | ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `mali-quelle-histoire`              | Selected published video, thumbnail, publication copy; workshop narration and sources | Distinguish approved release text from intermediate rewrites; source files also contain image credits                                            |
| `lingala-invente-par-les-belges`    | Nine 1080×1350 carousel slides; cards and sources                                     | Private record dates it September 16; site campaign groups a September 5 video and September 7/17 carousel occurrences; do not conflate editions |
| `manden-mande-mandingue-trois-mots` | September 25 video, narration, copy and sources                                       | The earlier September 16 video remains in the site catalogue; later narration explicitly corrects it                                             |

Known YouTube IDs for reconciliation, not automatic selection:
Mali `A99ETtxdxiU`; Mandé older `vESK91smqxQ`, newer `bqpj5UiwGJ8`;
the older Lingala video `kzzDsZQlprI`. Confirm actual edition correspondence before wiring.

## 4. Target reader experience

### 4.1 Navigation and listing

- Change the visible label Les dossiers to **Articles** in header, mobile menu, landing page,
  footer, breadcrumbs, metadata and relevant calls to action, with English counterparts.
- The section offers exactly four primary destinations: Tous les articles, Anecdotes,
  Proverbes, Galerie. Remove the six-column domain classification and all Bientôt entries.
- Preserve Parcourir, Jouer, site search and the current three retained collections.
- Listing order defaults to article publication date descending, with a stable ID tie-breaker.
  Updating a typo must not silently republish/reorder the article.
- Mobile: one column, clear title and brief introduction, compact collection links, first
  article visible early. Cards carry image/poster, title, short excerpt and limited metadata.
- Tablet: two listing columns when cards remain readable. Desktop: two or three columns.
  Keep the existing three-level card typography and image provenance rules.
- Start with simple pagination following the repository's existing pattern; no infinite scroll
  or complex faceted taxonomy is needed for this first release. A subject search/filter may
  be added only if demonstrated useful with the actual catalogue, not as a mandatory scaffold.
- A deliberate unpublished/empty state must not expose private titles or resemble an outage.
  A failed content read must not be presented as an honestly empty publication catalogue.

### 4.2 Shared article template

Reading order is consistent at every breakpoint:

1. Breadcrumb/back-to-articles link.
2. One title; accountable byline, article date, optional accurate reading time.
3. Chosen reel or carousel, with its own publication provenance and original post link(s).
4. Brief introductory paragraph and complete article body with meaningful headings.
5. Claim-adjacent citations; uncertainty remains in the body, not postponed to a disclaimer.
6. Consulted references, relevant related articles/fiche links, and a contribution route.

Media behavior:

- Preserve aspect ratio; never crop baked-in text. Provide **Aller au texte** before tall media.
- Carousel: swipe plus previous/next buttons, visible current/total count, usable keyboard
  focus, accessible slide announcements, optional enlargement with focus restoration.
  No automatic advance. Make slide text available as real text; alt text describes the image
  rather than hiding the entire essay in one inaccessible attribute.
- Video: poster and deliberate play, captions and accessible transcript where available;
  do not claim transcription exists when it has not been recovered. The article remains usable
  without video playback. No autoplay on page entry or unexpected background sound.
- Reuse the current YouTube facade and consent contract; do not enable additional platform
  scripts as a shortcut. For a retained post without a usable YouTube edition, P3 must deliver
  a cleared native video derivative through durable media hosting, or record a concrete
  unresolved item. A link-out alone does not satisfy the target's playable reel requirement.
- If reel and carousel explain the same angle, one article can expose a compact format choice
  above the text. The main body is not hidden behind tabs. Different angles need not merge.
- Mobile uses one article column. Tablet widens the page container without forcing a split.
  Desktop may add an in-page contents rail for long articles, but the media stays before body.
  Limit the entire document container consistently; do not narrow individual paragraphs while
  leaving all other blocks on unrelated edges.
- Keep the parchment surface, existing display/body faces and section accent. Do not copy
  social-card all-caps typography into running article prose or use generated images as
  undocumented historical illustrations.

### 4.3 Existing surfaces and URLs

| Surface                                     | First-release treatment                                                                                        |
| ------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `/fr/dossiers`                              | Article listing, label Articles                                                                                |
| `/fr/dossiers/<new-article-slug>`           | Shared article route; stable canonical URL                                                                     |
| Anecdotes / proverbes / galerie             | Existing routes and collections preserved                                                                      |
| Old draft dossier and Nommer/chapter routes | Remain withheld unless explicitly assigned a reviewed replacement; no automatic revival                        |
| Old theme/migration/colonization navigation | Removed from this section; record the disposition of each route                                                |
| Existing name and doctrine pages            | Preserve their appropriate Parcourir/project destinations; remove their extra dossier grouping where necessary |
| Découvertes                                 | Preserve immersive media reader; link to the matching published article                                        |
| Search companion media                      | Update only relevant article destinations/editions; preserve name-answer behavior                              |

Reserve static segments (`anecdotes`, `proverbes`, `galerie`, `themes`, `nommer`, `migrations`,
`regards`) and check slug collisions before accepting any new article. Do not remove `/api/v2/dossiers`
or change its schema merely because the public section label changes. Legacy research records
and strict dossier models remain intact unless a separate compatibility-reviewed migration is needed.

The human sitemap lists entry points and sensible article access; XML lists every eligible
canonical article URL. Both use the same publication predicate. Do not turn the human plan into
a dump of every corpus record to solve XML coverage. If a URL actually changes, use an explicit
old-to-new map; no blanket redirects of unrelated old dossiers to a generic page.

## 5. Minimal content and recovery contract

### 5.1 One article bank, shared projections

Recommended default: a small validated article bank, separate from the 17 strict AFRIK models,
under `content/articles/`, read by a server-only `src/lib/articles/` loader. Reuse references
to existing production IDs/occurrences and corpus entities. Do not force a thesis, myth,
linguistic category or fictitious fiche onto every social subject. Do not add arbitrary sections
to `modele-dossier.json` to make it act as a blog schema.

One shared publication predicate and one projected summary feed the listing, menu counts,
related links, sitemap, metadata and discovery links. The header receives summaries, never
full articles. Rendering must not read the private library or depend on workstation paths.

P1 must freeze the concrete schema and fixtures before parallel UI/import work. At minimum:

| Area             | Required information or behavior                                                                                            |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Identity         | Stable article ID, localized slug/title/excerpt, editorial angle; reserved-slug validation                                  |
| Lifecycle        | Draft or published, actual article publication date, optional modification date; no publication inferred from file presence |
| Authorship       | Actual accountable author/editor; no invented qualifications or bylines                                                     |
| Media provenance | Selected immutable edition ID, ordered formats/assets, original occurrence references, per-network URLs/dates where known   |
| Body             | Intro and sections of real text with source references; no copied internal production notes                                 |
| Sources          | Identifiable work/account, locators where available, provenance and relevant uncertainty; preserve oral-source distinctions |
| Media assets     | Dimensions, format, order, alt/slide text, caption/transcript reference, credits and cleared use scope                      |
| Relationships    | Optional related article IDs and corpus entities; every link resolves, no fabricated corpus ID                              |
| Corrections      | Superseded edition relation and an understandable correction note when materially relevant                                  |
| Locale           | French/English content and explicit deferred-translation handling consistent with the current guide                         |

If existing article primitives are added by another session, reuse them after checking the
contract instead of creating a parallel bank. This path choice is a recommended implementation
default, not a claim that these files exist today. No new public API is required for the listing.

### 5.2 Private reconciliation manifest

Maintain a private recovery manifest outside the public repository, addressed through a
dedicated configured output root. It tracks each candidate and its disposition:

- library record and site campaign IDs; subject, angle, edition and occurrence mappings;
- original relative file pointers and checksums, selected release, files recovered and missing;
- URL/date evidence, conflicts, aliases and correction/supersession relationships;
- factual sources separately from media credits; rights review including audio reuse;
- exported derivative identity, size, order, dimensions and destination;
- status: unresolved, mapped, exported, article-draft, reviewed, published, or excluded with reason.

These are workflow states, not new public labels or another source of editorial doctrine.
Do not commit private notes, absolute local paths, credentials, private ledger dumps or raw
research folders. Public records contain only the cleared material needed to render and cite.

The importer must support a read-only dry run, deterministic output, hash-based verification,
collision refusal, re-running without duplicate articles/assets, and a report of every rejected
or unresolved candidate. No automatic rewriting of either source ledger. Fixes to shared
registries are separately reviewed changes by their designated owner.

### 5.3 Storage decision before bulk export

Measure web derivatives on the pilots, then estimate the full selected set. Prefer existing
durable media delivery if already available and suitable. Small optimized posters/slides may
use current public-asset delivery within its reviewed budget. Large video masters never enter Git.

If the full web set cannot fit the existing budget, implement delivery from persistent media
storage using the project's deployment infrastructure, with deterministic public URLs and an
explicit upload/backup/release procedure. Verify repository/deployment support first; do not
claim such hosting is already configured. A new paid service/account requires a concrete
costed choice, not an implicit subscription. Record the selected mechanism before P3 bulk export.
Local private paths, temporary agent files and expiring platform CDN URLs are not production hosting.

Audio/music clearance on a social platform must not be assumed to cover website reuse.
Record cleared audio or omit the unlicensed soundtrack while preserving the visual publication
and original-post link. Do not add a new legal doctrine to this plan; verify the actual asset terms.

### 5.4 Completeness and broader social subjects

Inventory the union of published private records and URL-bearing site records, reconciling
overlap instead of choosing one registry as the entire historical catalogue. Include newer
subjects found after the dated snapshot and record a cut-off date for the migration batch.

Classify every candidate as an article to produce, an edition/format of another article,
material requiring recovery, or an explicit editorial exclusion. Production reminders and
calls for upcoming subjects need not be padded into essays. Broader cultural subjects must not
be silently discarded just because the historical name-series ledger cannot describe them.
Record any scope exclusions for operator review; do not claim importing only the name series
completes the request. No mandatory myth, name-origin angle or corpus fiche for a broader article.

## 6. Phased task list — test first, smallest implementation, evidence

- [ ] P0 — Refresh evidence, resolve scope and record route/content dispositions.
- [ ] P1 — Freeze the article contract, fixtures and media-delivery choice.
- [ ] P2 — Build the shared article and listing experience against fixtures.
- [ ] P3 — Recover, reconcile and import existing publications (pilot then full resolved batch).
- [ ] P4 — Integrate navigation, sitemap, metadata and discovery destinations.
- [ ] P5 — Write/review the three pilot articles, then complete the eligible backlog.
- [ ] P6 — Validate the integrated release, deploy through the project workflow and verify.

### P0 — Refresh and establish the baseline (one coordinator)

**Test first:** record current routes, menu/link sets, publication visibility, locale behavior,
and examples of duplicate cross-posts, corrected editions, missing media and broken copy pointers.
Record expected dispositions before changing anything. Refresh counts and compare newer work.

**Implement:** create the bounded recovery manifest and route inventory; verify the merged
editorial plan and any current implementation. Reconcile shared ownership with ongoing editorial
and social-retention work. Record technical contract amendments through the existing spec workflow.
The latest user request governs the article direction; do not ask again whether A was selected.

**Exit evidence:** each old navigation entry has a destination/removal decision; each candidate
has an identity or an unresolved mapping; publication cut-off and pilot editions are recorded.
New scope/storage choices are concrete and separated from already settled preferences.

### P1 — Content contract and fixtures (one owner)

**Test first:** failing tests for draft exclusion everywhere, duplicate IDs/slugs, reserved
segments, missing required media/source references, corrected versus superseded edition,
unknown relationships, deterministic order, and French-only publication. Include video-only,
carousel-only, both-format and incomplete-record fixtures. Bad records fail validation with
actionable diagnostics; loading failures are not empty catalogues.

**Implement:** smallest article schema/loader, shared publication predicate and summaries,
stable occurrence/edition references, and the measured media-delivery decision. Keep private
reconciliation state separate from public article content. Establish authorship/date semantics.
Add traceability using verified requirement IDs, not invented annotations.

**Exit evidence:** fixtures exercise the frozen contract; UI and importer can proceed without
editing it independently. Runtime works without private filesystem access. Existing dossier
API/parser contracts remain green. Storage/export destination and ownership are recorded.

### P2 — Listing and article UI (parallel lane A after P1)

**Test first:** behavioral tests for media-before-body order, one title, article links,
pagination, carousel swipe/buttons/keyboard, text alternative, consent-gated video, unavailable
media fallback, and focus restoration. Capture expectations at 320, 390/430, 768/900/1199 and
1200/1440 px before adjusting layout. Keep the article body readable when media fails.

**Implement:** one listing and shared template; reuse/extract only the media functionality
needed from existing readers. Supply bilingual UI copy. Add optional format switch and contents
navigation only where real content requires them. Update the scoped charter rule and tests.

**Exit evidence:** inspect the rendered pages and all media states, not only snapshots or unit
tests. No horizontal page overflow, clipped slide text, inaccessible controls, accidental audio
or desktop layout squeezed onto a phone. No speculative series system or magazine lead manager.

### P3 — Recovery and import (parallel lane B after P1; one importer writer)

**Test first:** on isolated fixtures prove dry run makes no writes; repeated import is stable;
wrong/missing hashes, ambiguous selected releases and duplicate slugs are refused; slide order
is preserved; cross-posts collapse to occurrences of one edition; a corrected edition cannot be
silently replaced by the oldest URL; missing copy/assets create explicit exceptions. Test that
private paths and production notes never enter public output.

**Implement, sequentially within this phase:**

1. Snapshot source metadata; resolve the union of inventories and exact selected releases.
2. Recover the eight copy pointers and the two media-empty folders from the workshop,
   retained releases or original publication sources. An unrecoverable item remains explicit.
3. Run Mali, Lingala and Mandé through reconciliation and web export; inspect actual rendered
   slides/video, ordered text, hashes, dimensions, original links and factual/source credits.
4. Export cleared derivatives into the agreed durable destination; preserve source masters.
5. Import the remaining resolved batch as **draft** article material. Retain all occurrences
   without duplicating article pages. Do not manufacture dates or fill bodies with generic prose.
6. Re-run without changes; compare manifest and output hashes, counts and size totals.
7. Produce a reconciliation report accounting for every candidate, including those absent
   from the public ledger. Supply per-item next actions for unresolved/excluded material.

**Exit evidence:** all recoverable, in-scope published editions are mapped and imported;
source assets are unchanged; web derivatives are accessible and budgeted; unresolved items
have precise reasons and owners. A fully closed recovery phase has no unaccounted candidates.
If exceptions remain, call it partial recovery and keep the affected checklist items open.

### P4 — Navigation, SEO and cross-surface integration (coordinator after P2/P3 contracts)

**Test first:** assert the four editorial destinations across mobile/desktop/footer/site map;
no retired entries or draft counts; retained collections resolve unchanged; every published
article appears in XML and has correct canonical metadata; drafts never appear there; discovery
links point to the selected article/edition; relevant old URLs have explicit dispositions.

**Implement:** connect header, module registry, route helpers, copy, breadcrumbs, human/XML
sitemaps, relevant fiche/search links and Découvertes. Add appropriate Article metadata using
actual author and article dates; distinguish media publication date. Update share previews.
Retire duplicate manually authored discovery entries when the shared projection replaces them.
No global search rewrite and no destructive removal of old dossier data or API endpoints.

**Exit evidence:** a user can arrive from a publication, read its article, inspect its sources,
open the relevant fiche and return to the listing. All links use the same visibility rules.
No inconsistent labels, broken routes, article duplication or accidental English publication.

### P5 — Editorial production (pilots sequential; disjoint batches may then run in parallel)

**Test first:** for each pilot, freeze the reader's question, supported claims, uncertainty,
reference mapping and expected improvement over its caption/transcript. Check that readers can
identify what is explained, what is not established and where to verify it. These are semantic
review cases, not a test that merely looks for the word Sources.

**Implement:** write a real article from the chosen publication, research and references.
Add useful context and distinctions without expanding beyond the evidence. Do not reproduce
hashtags, calls to share or internal approvals as article paragraphs. Keep quotations and
oral carriers accurately attributed. If historical media is materially corrected, show the
updated edition and explain the correction instead of silently rewriting the historical post.

Review Mali, Lingala and Mandé first against the shared guide and existing project review
workflow. Then apply the same template to all eligible candidates in disjoint ID batches.
Prepare English counterparts or record an explicit non-empty deferred marker through the
agreed article translation contract; UI copy remains bilingual. Do not change `SITE_LOCALE_MODE`.

**Exit evidence:** every eligible article is written and reviewed, not only the three pilots.
Every retained claim has usable support; references resolve to the intended work/account;
media provenance and credits are distinguishable from factual sources; no invented interview,
professional qualification or uniform community belief. Deferred, excluded and blocked items
remain visible in the implementation ledger with reasons. Numerical test success is not prose approval.

### P6 — Integrated release and handoff (one coordinator, independent review)

**Test first:** run end-to-end journeys for mobile article discovery, reel playback/decline,
carousel navigation/expansion, no-media-network access, sources, contribution, retained
collections, draft URL exclusion and locale behavior. Verify deployment can access every asset
without private folders or temporary files. Establish a rollback rehearsal before publication.

**Implement:** integrate reviewed commits, run the required gates below, perform visual and
semantic review, and prepare the project release with its normal release workflow. Creating
this plan does not authorize deploying an unreviewed implementation. An execution session must
follow the user's release authorization and the project release skill.

**Exit evidence:** green required checks on the integrated revision; representative page/media
screenshots at the specified widths; complete recovery/editorial ledger; selected release and
rollback revision recorded; live URL/media checks after authorized deployment. Track source
consultation, article reading and media actions through the existing consent-aware measurement
contract, without claiming time-on-page alone proves understanding.

## 7. Parallel-agent policy and integration order

**Use bounded parallel agents during implementation; do not parallelize shared registries or
bulk imports.** No subagents were needed to author this planning document.

Recommended maximum: **one coordinator plus two workers**, with an independent reviewer using
the remaining slot when needed. More agents would increase shared-file contention at this size.

| Stage        | Parallelism                           | Ownership                                                                                                             |
| ------------ | ------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| P0/P1        | Sequential                            | Coordinator owns contract, fixtures, route decisions and shared registries                                            |
| P2 and P3    | Two workers after P1                  | A owns article/media UI and its tests; B owns recovery importer, private manifest and designated draft/export outputs |
| P4           | Sequential integration                | Coordinator owns SiteHeader, moduleRegistry, routing, siteTree, sitemap and shared discovery/search adapters          |
| P5 pilot     | Sequential                            | One writer establishes the three pilots; separate semantic review before scaling                                      |
| P5 remainder | At most two content workers           | Exclusive article-ID batches and their translations; no shared-manifest edits                                         |
| P6           | One integrator + independent reviewer | Review may be parallel/read-only; merges, export publication and deploy remain serialized                             |

Operational rules:

- Give every worker exact files/article IDs, expected tests, inputs and completion evidence.
  Tell them they are not alone in the codebase; they must preserve others' edits.
- Each writing agent uses an isolated worktree from the integration baseline and runs
  `npm run worktree:setup`. Never edit in the shared checkout or switch another agent's branch.
- After P1, every worker starts from the same contract commit. Workers propose contract
  changes to the coordinator rather than independently forking the schema.
- Only one writer operates the importer/export destination. Research workers may inspect
  separate subjects but may not run concurrent shared-ledger rewrites or media cleanup.
- Workers commit and report their changes; the coordinator integrates in dependency order,
  resolves conflicts, and runs integrated tests. Passing isolated suites is insufficient.
- Do not create user-owned chats for these subtasks. Use subagents when execution is authorized.
  Reading another chat does not grant permission to message it; coordinate through shared
  committed contracts or explicit user-authorized messages.
- Do not automatically spawn specialist video rendering agents: this is recovery and article
  work. A new rendering is a separate, explicitly justified task if no suitable released asset exists.

Dependency order:

```text
P0 → P1 → P2 (UI) ──────────────────┐
          P3 (recovery/import) ─────┼→ P4 integration → P6 release validation
          P3 pilot → P5 writing ────┘
                     pilot review → remaining article batches
```

P5 can begin on reconciled pilot material while remaining imports continue. A draft must never
be published merely to unblock UI work; fixtures support that work until editorial review passes.

## 8. Repository change map

Paths below are verified starting points unless marked proposed. Recheck them after concurrent
work; line numbers are deliberately not frozen into this handoff.

| Responsibility            | Existing paths / proposed additions                                                                                                                 | Owner                                                      |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| Navigation                | `src/components/layout/SiteHeader.tsx`, `SiteFooter.tsx`, `src/lib/hubs/moduleRegistry.ts`, `axisRoutes.ts`, `src/lib/dossiers/menu.ts`             | Coordinator                                                |
| Labels/routes/trails      | `src/lib/i18n/copy/chrome.ts`, `sitemapPage.ts`, `src/lib/routing.ts`, `src/lib/navigation/deriveTrail.ts`, applicable hub copy                     | Coordinator                                                |
| Landing/detail routes     | `src/app/[lang]/dossiers/page.tsx`, `[dossier]/page.tsx`; preserve static retained collection routes                                                | UI worker                                                  |
| Article bank and loader   | Proposed `content/articles/`, `src/lib/articles/` and colocated tests                                                                               | Coordinator for contract; content workers for assigned IDs |
| Article UI                | Proposed `src/components/articles/`; reusable pieces from `src/components/dossiers/`                                                                | UI worker                                                  |
| Existing media            | `src/components/media/EmbedFacade.tsx`, `src/lib/embeds/providers.ts`, `src/components/discoveries/DiscoveryReader.tsx`, `CarouselAudioControl.tsx` | UI worker; coordinate shared edits                         |
| Recovery                  | Proposed importer in the existing `social/tools/` tooling; reuse `paths.mjs` and library path resolution                                            | Recovery worker                                            |
| Production/discovery data | `docs/productions/`, `src/lib/productions/ledger.ts`, `toDiscoveryPublication.ts`, `src/lib/discoveries/{entries,catalog,videos,slugs}.ts`          | Coordinator; workers submit reconciliation evidence        |
| Discovery routes          | `src/app/[lang]/decouvertes/[[...publication]]/page.tsx`, reader's related destinations                                                             | Coordinator                                                |
| Search companions         | `src/lib/search/companionCatalogs.ts`, `src/components/search/feed/ShortsBlock.tsx`                                                                 | Coordinator; only relevant destinations                    |
| Site maps and metadata    | `src/lib/siteTree.ts`, `src/app/sitemap.ts`, `src/app/[lang]/plan-du-site/page.tsx`, `src/lib/seo/`                                                 | Coordinator                                                |
| Legacy compatibility      | `src/lib/afrik/parsers/dossierTypes.ts`, `dossierParser.ts`, `src/lib/dossiers/corpus.ts`, dossier API/loaders                                      | Preserve; any required change reviewed centrally           |
| Charters/documentation    | Brand §8.6 and applicable navigation/dossier charter tests; this plan's progress and completion evidence                                            | Coordinator                                                |

Existing tests worth extending include navigation/header/footer tests, site-trail coverage,
`dossiersFreezeReach`, dossier frozen-route tests, sitemap tests, `EmbedFacade` tests, discovery
reader tests, and production projection tests. Reuse behavioral tests where they already prove
the requirement; avoid a new suite that merely mirrors implementation details.

## 9. Verification and acceptance

At the appropriate scope, the final implementation must pass:

```bash
make check
npm run lint:req
npm run check:dead
npm run check:translation-parity -- --base origin/recette
npm run check:production-ledger
npm run check:asset-weight
npm run check:orphan-docs
npm run check:local-paths
npm run check:infra-disclosure
npm run test:charter-contracts
```

Use meaningful targeted tests before each implementation change, then broaden once at
integration. Include `npm run test:social-tools` when importer/tooling changes; the Python engine
suite is needed only if engine code changes. Translation parity is a report, never proof of an
English launch. Do not lower gates or use force publication to conceal failures.

Run relevant Playwright journeys and existing accessibility/performance gates with the new
article and listing routes covered. Use responsive boundary widths, keyboard navigation,
zoom, long titles, dense slides, media failure and disabled/revoked embed consent. Remove
temporary capture/log files after the session; preserve only intentionally reviewed evidence.

Final acceptance checklist:

- [ ] Four clear editorial destinations; no unavailable legacy menu promises.
- [ ] Anecdotes, Proverbes, Galerie and their existing links still work.
- [ ] One article template shows media before a complete readable body at every breakpoint.
- [ ] Every published article has a selected edition, usable media, accountable dates/byline,
      traceable factual sources and clear credits.
- [ ] Every in-scope published candidate is accounted for; pilot delivery is not called full migration.
- [ ] Re-running recovery does not duplicate, overwrite curated copy or select old corrected media.
- [ ] Missing/uncleared material stays explicit; source masters and research are preserved.
- [ ] Discovery, search companions and articles refer to the intended edition without duplicate bodies.
- [ ] Sitemap/canonicals/trails/publication predicates agree; no draft or unintended English exposure.
- [ ] Editorial checks include semantic review against the common guide and personas.
- [ ] Shared registry changes are integrated once, with no conflicting agent edits.
- [ ] Integrated gates, rendered review and post-deployment checks have recorded outcomes.

## 10. Rollout, rollback and limits

Keep original source ledgers and released masters unchanged during import. Web derivatives
are versioned by edition/hash; deploy required media before making their articles visible.
Never overwrite a published media URL with a different edition. Record created destinations
so a failed import can be rolled back without deleting source or other agents' files.

Release the shared experience with the three reviewed pilots, then publish the remaining
reviewed batches. This is progressive rollout, not a reduction of the full-backlog objective.
Keep a previous known-good app revision and retain media needed by it. A rollback withdraws
new article visibility or reverts the app; it does not delete historical publication records.

Open work to resolve during execution is bounded: exact publication/correction mappings,
missing captions/media, durable delivery capacity, clearance for website audio reuse, and
disposition of non-article social posts. These do not reopen the choice of option A. The
existing editorial-remediation owner continues to own global policy and source-model changes.

This plan does not certify the historical accuracy of all existing posts, the current
availability of every social URL, or the licensing of every exported file. Those are item-level
checks within P3/P5. It does not establish a delivery estimate without measuring the unresolved
backlog. Its completeness is the covered workflow and accounting contract, not a promise that
unexamined material is ready.

## 11. Copyable handoff to an implementation session

> Implement option A of `docs/plans/articles-refonte-2026-09-30.md` on the current integration
> baseline. Read AGENTS.md, CLAUDE.md and all required editorial/design references in section 2.
> The operator selected Articles: media first, article text below, preserving Anecdotes,
> Proverbes and Galerie and removing the other dossier navigation entries. Work phase by phase,
> test first and KISS. Keep the plan checklist and per-candidate recovery/editorial accounting
> current. Start with P0/P1 sequentially, then use the bounded parallel ownership in section 7.
> Recover original publications through the configured private roots, reconcile editions and
> corrections, run the three pilots, and complete the remaining eligible backlog. Do not treat
> the 51 site subjects or 74 private published records as already reconciled articles. Preserve
> source masters, legacy research, oral accounts and uncertainty. Use one shared article contract
> and publication predicate; do not add a CMS or publish English. Report actual completion,
> unresolved items and verification evidence. Follow the normal reviewed release workflow;
> do not claim deployment, source verification or content completion that has not happened.

## 12. Supporting references

- [W3C carousel accessibility](https://www.w3.org/WAI/tutorials/carousels/): explicit controls,
  keyboard operation and understandable state changes.
- [Google URL migration guidance](https://developers.google.com/search/docs/crawling-indexing/site-move-with-url-changes):
  only relevant when addresses actually change; keeping routes reduces migration work.
- [Google Article metadata](https://developers.google.com/search/docs/appearance/structured-data/article):
  use real authorship, dates and images; markup does not guarantee a search presentation.

These external references were consulted during the preceding analysis. Recheck current
technical documentation when implementing; this document does not freeze third-party behavior.
