# Editorial contract — subject, angle, edition, occurrence, family, review

Interface version **1** (`CONTRACT_VERSION` in `social/tools/contract/contract.mjs`).
Status: **drafted and checked** by the contract's own tests; not yet accepted by the
sessions that consume it. Operator direction of 2026-09-27; the canonical REQ/DEC/ARCH
live in Confluence and this file restates none of them — it fixes the _meanings_ the
implementation sessions must share, and the code that enforces them.

The site's remit is unchanged: it stays name-centred. This contract governs what the
**social workshop** may produce and how it records it. Nothing here changes what the
website publishes, and nothing here asks for a site record, a fiche or a myth to exist
for a social piece.

## 1. Five words, one meaning each

| Word                       | Means                                                                                                        | Stored as (reuse first)                                                                                                            |
| -------------------------- | ------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------- |
| **Subject**                | What the piece concerns. Never a status.                                                                     | Registry post `subject` (a `Type · Label` string today). A stable `subject.key` is derived from it; `corpusRef` only when one exists. |
| **Angle**                  | The bounded question asked of the subject. Several angles per subject; a repeated angle stays eligible.      | **New field** `angle {id, question}` on the edition.                                                                               |
| **Edition**                | One concrete carousel, video or text treatment, with its own content identity and review state.              | The registry post (`id`, `dir`), one per format. Same idea as ARCH-026's "production record". **New field** `format`.              |
| **Publication occurrence** | One actual posting on one network, or an explicitly _planned_ one. "Published" is a property of this, only.  | Registry `channels{}` entry per network; the ledger's `publications[]` row. Entry shape in §3.                                     |
| **Observation**            | Timestamped metrics of one occurrence, with definitions and gaps.                                            | S6 record, §7. Nothing exists today.                                                                                               |

Relationships are `adapts`, `deepens`, `republishes` on an edition (`relations[{type,to}]`),
plus an optional `series` label. Adaptation, a new angle and republication are three
different acts and are never collapsed: same angle + new format = `adapts`; same format +
new occurrence = `republishes`; different angle = a new edition with its own `angle`.
No generic graph, no new table: four concepts already have a home; only `angle`, `format`,
`family`, `relations` and the occurrence entry shape are additions.

## 2. Family is not profile is not format

Three independent choices, made in this order, each with one owner:

1. **Narrative family** (`family`, S3). One of six: `name-investigation`,
   `historical-portrait`, `circulation-connections`, `guided-listening`, `comparison`,
   `material-biography`. Describes how the story establishes and answers its question. An
   unknown value **fails** (`validateEdition`, `applicableChecks` throws); there is no
   `free` family, and a missing family is never guessed (see §5, legacy).
2. **Visual profile** (`profile`, S4): the carousel profile id already used by
   `ethni_carousel_profiles.py` and `register-post.mjs --profile`. Card count belongs to
   the profile: `memoires-sonores` keeps its six cards, nothing else inherits that.
3. **Format and destination** (`format`, `intendedNetworks`, S6): `video | carrousel |
texte`, and which networks. Whether a network accepts a format stays in
   `scripts/lib/socialFormatMatrix.ts`; this contract does not copy it.

Scene profile (`ethni_scene_plan.py`) is derived, not a fourth axis. Defaults, which S3
may refine by a request to S0:

| Family                                        | Default scene profile |
| --------------------------------------------- | --------------------- |
| name-investigation                            | `name-origin`         |
| historical-portrait, circulation-connections  | `history-geography`   |
| comparison, material-biography                | `thematic-analysis`   |
| guided-listening                              | `free` (own beats)    |

`free` as a _scene profile_ is a rendering fact; it bypasses no review. A **series** is a
label (`name-origin`, `memoires-sonores`); `series: name-origin` is what keeps the fixed
name-origin gabarit checks, and nothing else triggers them. Editorial shelves (names,
people, histories, sonic memories) are navigation labels and are not stored on the edition.

## 3. Readiness, dates and publication

- **Readiness** = the registry's own `status`: `brouillon | a-produire | bloque | pret`.
  `publie` is deliberately not a value. An edition is never "closed" by publication.
- **`plannedDate` is optional** (`YYYY-MM-DD`). A ready edition without one is valid; no
  weekday, no Sunday, no automatic schedule. A planned date is never a publication date.
- **Occurrence entry**: `{network, status: planned|published, url, publishedAt,
platformPostId?, evidence?, fixture?}`. A `published` entry must state `url` and
  `publishedAt` — the value, or explicit `null` when unknown. Unknown is recorded, never
  omitted and never invented.
- **`fixture: true`** marks a test record: it never counts as live and is never a duplicate.
- **Distribution** is derived, not stored: `none | partial | complete`, comparing live
  published networks with `intendedNetworks`. One network published means `partial`;
  another edition of the same subject is unaffected.
- **Duplicates** are one platform post filed twice (`network + platformPostId`, else
  `url`). Same subject, same angle, same format on another date is legitimate repeated
  coverage and is not flagged.
- A missing companion format is never a defect, a blocker or a `formatManquant` demand.

## 4. Review applicability

Reviews attach to the **claims and media actually present**, not to the family.

- **Universal, always required, in every family:** `provenance` (every claim carries at
  least one source with a tier — an absent or empty list fails), `uncertainty` (assertion
  tracks certainty), `attribution` (real credit for every asset), `intelligibility`,
  `non-essentialising`.
- **Conditional**, required only when triggered, otherwise reported as
  `not-applicable` **with a reason** (never silently dropped, never able to cancel a
  universal check): `name` (a claim of kind `name-origin`), `myth` (the edition declares a
  belief it corrects), `geography` (a `place|route|map` claim or a map), `music` (a
  `music` claim or music/audio-excerpt media), `name-origin-gabarit` (`series: name-origin`).
- Claim `kind` is the trigger vocabulary and is **S3's to extend**; adding a conditional
  check is a change to `applicableChecks` plus its test, made by S0 on S3's request.
- A `name-investigation` must carry at least one `name-origin` claim.

## 5. Legacy, and what stays as it is

- `docs/productions/` and `check:production-ledger` are the **name series' ledger** and
  keep their rules (`?`-ending question and myth, typologies, the network × format gate).
  A social-only piece is **never** filed there and never gets a fabricated site path
  (the Mémoires sonores precedent). Its home is the private registry.
- A registry post with no `family` is read as `name-investigation` + `series: name-origin`
  **only if** the ledger holds a record for its subject. Otherwise it stays unresolved and
  is listed for review; it is not defaulted. S2 owns that backfill and applies it only on
  verified evidence.
- The approved Mémoires sonores presentation, its six-card layout and its cadence data are
  untouched: it is `family: guided-listening`, `series` and `profile: memoires-sonores`.
- **Research-led narrative design (2026-09-30)** adds an optional `narrativeDesign` section
  to the brief: ten narrative patterns examined per subject, the operator's recorded choice,
  and a detailed outline shown before writing. It is additive and read only by
  `social/tools/narration/`, so this contract module and `CONTRACT_VERSION` do not change; the
  six families stay the classification and the patterns never replace them. Briefs without the
  section, and approved older narrations, are untouched. See
  [NARRATIVE-DESIGN.md](NARRATIVE-DESIGN.md).

## 6. Version-bound approvals

An approval records the hash of every input it read, keyed `role:id` (`claim:c1`,
`copy:card3`, `asset:photo-2`, `audio:mix`, `layout:card3`, `destination:tiktok`). It is
**stale** when any recorded input changed or vanished (`staleApprovals`), and only then.
Consequences that S3 and S6 must preserve:

- a crop or destination change touches `layout:` / `destination:` — text approvals, which
  read `copy:` and `claim:`, stay valid;
- a claim change touches `claim:<id>` — every approval that cites it (text, cover,
  caption, provenance) goes stale and nothing else;
- an approval whose inputs are all unchanged is reused, whatever else was re-rendered.
  A stage's re-run is not itself a reason to discard approvals.

`progress.mjs` today deletes every later stage when an earlier one is completed again, and
binds only `evidence[{path,sha256}]`. That stage cascade may stay as production order, but
review approvals must be keyed by input as above: S6 extends `evidence` entries with a
`role` and reads staleness from inputs, not from stage position. This is a request to S6,
not an edit made here.

## 7. Observation record (shape S6 implements)

`{editionId, network, platformPostId|url, capturedAt, windowDays: 0|7|28, source:
manual|export, metrics: {<name>: {value|null, definition}}}`. `null` means _not read_ and
is different from a platform-reported `0`. A combined Meta figure is stored once with
`scope: "meta-combined"`, never split into two invented per-network measurements. It starts
from a real occurrence; rendering completion starts nothing.

## 8. Acceptance scenarios

Each is a test in `social/tools/contract/contract.test.mjs` (fixtures:
`social/tools/contract/fixtures/editions.json`, synthetic — not evidence).

| Scenario (Given / When / Then, compressed)                                                       | Test                                                            |
| ------------------------------------------------------------------------------------------------ | --------------------------------------------------------------- |
| An approved name story exists → validated → valid and keeps its name-origin gabarit check        | approved existing name story; legacy name series keeps…         |
| A sourced social-only portrait, no site record, no myth → validated → valid, `myth` not-applicable with a reason | sourced social-only portrait…                                   |
| Same angle in carousel and video, both posted → duplicates searched → none                       | repeated angle stays eligible…                                  |
| One platform post filed twice → duplicates searched → one                                        | same platform post recorded twice…                              |
| Two intended networks, one published → distribution → `partial`; a planned or fixture entry → `none` | publishing on one network…; planned occurrence…; fixture URL…   |
| `pret` with no date → validated → valid; malformed date → refused                                | ready without a date…; malformed date…                          |
| Published with url/date omitted → refused; explicit `null` → valid                               | published occurrence with unknown…                              |
| Unknown family → validated → fails naming the value; no source on a claim → fails in every family | unknown family…; claim without source…; universal checks…       |
| A name claim, a route, music or a declared myth inside a portrait → conditional checks required  | conditional checks follow the actual claims…                    |
| Crop changed → only crop approval stale; claim changed → exactly its dependants stale            | changed crop…; changed claim…; disappeared input…               |

## 9. Ownership, dependencies, start conditions

| Area                                                                                                        | Owner                     |
| ----------------------------------------------------------------------------------------------------------- | ------------------------- |
| This document, `social/tools/contract/`, `CLAUDE.md` and `docs/productions/README.md` policy paragraphs      | **S0**                    |
| Audit documents, measurement protocol                                                                        | S1                        |
| `social/tools/library/`, `social/tools/etat-pipeline/`, `docs/productions/` records; the only registry writer | S2                        |
| The eight skills of the chain, `gabarit-reel.mjs`, narrative templates and claim-kind vocabulary            | S3                        |
| `ethni_carousel_profiles.py`, `ethni_carrousel2.py`, `carousel-profiles/`, visual guides                    | S4                        |
| `ethni_scene_plan.py`, scene render, audio timeline                                                         | S5                        |
| `social/tools/production/`, release contracts, `socialFormatMatrix.ts`, both agent folders, observations    | S6                        |

Dependencies: S0 → S2, S3, S4, S5 (parallel) → S6 → S7. S2 needs S1's evidence before
disputed backfills. S4's final integration waits for accepted S3; S6 starts on named
accepted revisions of S2–S5. A change to a shared shape is a written request to S0, which
bumps `CONTRACT_VERSION`.

**Start condition for every session:** the S0 pull request is merged into the integration
branch (worktrees branch from it); until then, read this file and the module from the S0
branch and write no code against them. The canonical REQ/DEC/ARCH behind this contract are
_pending drafts_ until a person approves them; do not cite an ID as approved.

Integration evidence for this contract, measured on one merged revision: [INTEGRATION-ACCEPTANCE.md](INTEGRATION-ACCEPTANCE.md).
