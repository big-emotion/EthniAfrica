# Production history and publishing-cadence plan

Date: 2026-09-20. Answers `docs/plans/production-history-brief.md` §5's prompt.
Authorises the work in the brief's §3; writes no ledger file, no gate, no skill
edit itself.

## 0. One correction to the brief before anything else

The brief's §2 flagged, as an open tension, that "§1 bis's network × format
mapping … must be written down once." **On inspection it already is.**
`docs/design/gabarits-social/GABARITS-SOCIAL.md` §1 bis (dated 2026-09-16)
already states exactly the mapping this plan needs: reel → Instagram, Facebook,
YouTube, X (plus LinkedIn text-with-link); carrousel → TikTok, Instagram only —
Facebook and X explicitly do **not** receive a carousel, and LinkedIn receives
neither. "Une vidéo et un carrousel par sujet" is not a new instruction to
encode; it is the doctrine that already exists. **No edit to §1 bis is required
by this plan.** What §1 bis is missing is a place for the episode number in the
per-format folder name — addressed in §7 below.

The second tension — ten renders a publication day against a measured 83 posts
in the whole private library — is real and is resolved by staging (§9), not by
lowering the target.

## 1. Reconciling with the feed plan already in flight

`docs/plans/search-result-feed.md` §6.5 ("Shorts — the missing model", its
Phase 4) already specifies, unimplemented, almost exactly the site-side half of
this brief's §3.4:

- `DiscoveryPublication.kind` gains `"video"`, carrying
  `video: { durationSec, poster, watch: { youtube?, tiktok?, instagram? },
transcript? }` and `subjects: Array<{ kind: "people"|"country"|"family"|
"language"|"patronyme", id, label? }>`.
- The manifest lives in `src/lib/discoveries/videos.ts`, seeded with one real
  short and "the operator fills the rest" by hand.
- `cards.json` gains `sujets: ["PPL_…"]` so the chain writes subjects from now
  on, via `ethniafrica-structure`.

**This plan does not re-specify that model. It supplies the thing Phase 4
assumes without building: a versioned, gate-checked source for it.** Three
concrete adjustments this plan asks Phase 4 to accept, found by reading the
actual code rather than re-deriving it:

1. **`video.watch` needs `facebook` and `x`, not only `youtube`/`tiktok`/
   `instagram`.** §1 bis sends the reel to Facebook and X as well. Phase 4's
   three-key shape predates reading §1 bis's actual table.
2. **`DiscoveryPublication.detail.entities` is typed
   `Array<{ kind: "country"|"family"|"people", ... }>` today** —
   `src/lib/discoveries/catalog.ts`. Phase 4's own `subjects` field already
   widens this to five kinds (adding `language`, `patronyme`) but nothing
   widens `entities` to match. A production about a patronyme or a language —
   both of the operator's five typologies — cannot be filed under the existing
   type without this widening. This plan needs it done in the same change that
   adds `DISCOVERY_VIDEOS` records for those two typologies, not deferred.
3. **`videos.ts` should not be hand-filled.** Phase 4 says "the operator fills
   the rest." This plan's whole purpose is that nobody hand-fills a manifest a
   second time once `docs/productions/*.json` exists. §6 below makes
   `videos.ts` (and the carousel manifest, once one exists) a thin projection
   of the git-versioned ledger, not an authored file.

Whoever implements Phase 4 should read this plan's §6 before writing
`videos.ts`; whoever runs this plan's rollout should read Phase 4 before
writing the projection. Neither document is authoritative over the other's
scope — this one owns the ledger and its gate, Phase 4 owns the reader and the
feed. `embedded-media-brief.md` (not yet written) owns how a carousel plays;
this plan supplies its data, never its player, unchanged from the brief.

## 2. The ledger schema

`docs/productions/<typologie>/<NNN>-<slug>.json`, one file per subject,
`<typologie>` one of `peuple | pays | patronyme | lieu | langue`, `<NNN>` the
subject's episode number **within that typology**, zero-padded to 3 digits so
directory listings sort correctly (`peuple/007-lingala.json` is wrong — a
peuple episode and a langue episode share no counter; `langue/007-lingala.json`
is right).

```jsonc
{
  "campaign": "lingala", // = utm_campaign = private ledger's post.id
  "typologie": "langue", // peuple | pays | patronyme | lieu | langue
  "episode": 7, // unique within typologie, never reused, never renumbered
  "question": { "fr": "D'où vient le nom lingala ?", "en": "" },
  "myth": { "fr": "…", "en": "" }, // what the carousel takes apart — required, may be English-deferred
  "narrativePattern": "une langue, une famille", // §7 ter row this subject's opening/closing follow — see §5
  "subjects": [
    {
      "kind": "language",
      "id": "lin",
      "label": { "fr": "Lingala", "en": "Lingala" },
    },
  ],
  "sitePath": "/fr/atlas/langues/lin",
  "publications": [
    {
      "network": "youtube",
      "format": "video",
      "url": "https://…",
      "publishedAt": "2026-09-05",
    },
    {
      "network": "instagram",
      "format": "carrousel",
      "url": "https://…",
      "publishedAt": "2026-09-05",
    },
    { "network": "facebook", "format": "video", "publishedAt": "2026-09-05" },
  ],
  "poster": {
    "src": "/images/productions/lingala.jpg",
    "width": 1080,
    "height": 1920,
  },
  "durationSeconds": 74,
  "sources": [{ "title": "…", "url": "…", "tier": "referenced" }],
}
```

Kept from the brief's draft unchanged: one row per network × format, a
publication with no URL is recorded not omitted, `campaign` doubles as the join
key across the private ledger and the UTM scheme, `subjects[]` carries no media,
posters are the one media exception, French is the source with English
deferrable.

Two changes from the brief's draft, both made to match code that already
exists rather than invent a second shape:

- **`subjects[]` reuses Phase 4's exact kind union** (`people | country |
family | language | patronyme`) rather than the brief's ad hoc `"language"`
  example — this is the same field Phase 4 wants on `DiscoveryPublication`, so
  the projection in §6 is a near-identity copy, not a translation table.
- **Added `narrativePattern`**, a free-text row-name from GABARITS §7 ter's
  fifteen-row table (§5 below explains why this is a separate axis from
  `typologie` and cannot be inferred from it).

`campaign` must be unique across every file (the gate enforces this — a
duplicate means the same subject was filed twice, usually because the private
ledger's `id` was typed differently the second time). `episode` must be
contiguous per typology starting at 1 — a hole means a subject was deleted
without renumbering, which breaks "numbered by episode, so a reader can
follow a series" as stated in the brief.

## 3. The gate — `scripts/ci/checkProductionLedger.ts`

Follows the `--selftest` template already used by `scripts/ci/checkLocalPaths.ts`
(`FIXTURES: Array<[fixture, shouldTrip]>`, a `selftest()` counted against it,
wired as `"check:production-ledger": "tsx scripts/ci/checkProductionLedger.ts
--selftest && tsx scripts/ci/checkProductionLedger.ts"` in `package.json`,
added to the same CI job that runs the other `check:*` scripts (find it by
grepping `.github/workflows` for an existing `check:` script name — see the
brief's own note that this file must not restate the location).

**Test-first**: write the `--selftest` fixture table before the checker body,
per repository convention. Minimum fixture set:

| Fixture                                                                                            | Should trip                                                |
| -------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| Well-formed file, all required fields, no publications yet                                         | no                                                         |
| Well-formed file, one publication with `url` omitted                                               | no                                                         |
| `subjects[].id` not present in any corpus loader's ID space (`PPL_*`/ISO 3166-1/ISO 639-3/`PAT_*`) | **yes**                                                    |
| Two files with the same `campaign`                                                                 | **yes**                                                    |
| Two files in `langue/` both claiming `episode: 4`                                                  | **yes**                                                    |
| A file in `langue/` at `episode: 5` with no file at `episode: 4`                                   | **yes**                                                    |
| A `publications[]` row `{network: "facebook", format: "carrousel"}`                                | **yes** — contradicts §1 bis                               |
| A `publications[]` row `{network: "linkedin", format: "carrousel"}`                                | **yes** — same reason                                      |
| `sitePath` not matching any route `src/lib/routing.ts` resolves                                    | **yes**                                                    |
| Missing `en` under `question`/`myth`                                                               | no — reported by `check:translation-parity`, not this gate |
| Schema violation (unknown top-level key, wrong type)                                               | **yes**                                                    |

Failing on the network × format contradiction means the checker imports (or
re-encodes as a constant, if importing `.mjs` from `.ts` in a `tsx`-run script
is awkward) the exact table from §1 bis rather than a second hand-copied one —
this repository's own doctrine is "a copy of the list is how it drifts"
(`check:local-paths`'s own justification). Prefer a single
`NETWORK_FORMAT_MATRIX` constant exported from a new, tiny
`scripts/lib/socialFormatMatrix.ts` that both this gate and (later)
`ethniafrica-structure` import, with a comment pointing at GABARITS §1 bis as
the source of truth and the date it was last revised.

**Not a ratchet.** Every category above is held at zero, unlike `check:dead` or
`chronology-symmetry` — a production ledger entry is authored once, correctly,
by a skill that already has everything it needs (the corpus loader, the route
table, the format matrix) to get it right the first time. There is no backlog
to ratchet down.

## 4. The import — `scripts/productions/importLedger.ts`

Run by hand once, against `$ETHNIAFRICA_SOCIAL_POSTS/00-Index/publications.json`
(83 entries). For each **subject** (merging a video post and a carousel post of
the same subject, matched on `links.campaign`):

1. Resolve `subjects[]` — attempt an exact or near-exact title match against
   the AFRIK corpus loaders (peoples, countries, languages, families,
   patronymes) to recover a `{kind, id}` pair. A subject the corpus does not
   hold at all (e.g. a person, a myth with no single entity) is reported, not
   guessed.
2. Assign `typologie` from the private ledger's `pillar`/`subject` text where
   it maps cleanly to one of the five; otherwise report it for the operator to
   assign by hand — **the importer never invents a typology for a subject the
   operator has not classified**, because a wrong typology corrupts the
   episode counter permanently once other files are numbered after it.
3. Assign `episode` by import order within each resolved typology — this is
   necessarily retroactive and approximate for the 83 pre-existing posts, and
   the report must say so in bold: **the episode numbers this import assigns
   are a filing convenience for the back-catalogue, not a claim about
   broadcast order.** Only episodes numbered by `ethniafrica-structure` from
   this plan's rollout onward are load-bearing.
4. Carry over every `publications[]` row, `poster` (from the post's rendered
   cover if one exists on disk), and `campaign` = `post.id` unchanged.
5. Write nothing for a subject whose typology or entity cannot be resolved —
   list it in the report instead, grouped by reason (`no-entity-match`,
   `no-typology`, `ambiguous-subject`).

The report is the punch list handed back to the operator; the importer is run
again after each round of manual fixes to `PRODUCTIONS`/the private ledger
until the report is empty or the operator accepts a residue as "will not
migrate" (e.g. a post about a myth with no single filed entity).

## 5. Reconciling five typologies with fifteen narrative patterns

GABARITS §7 ter's table (§7 ter, "La table par type de contenu") has fifteen
rows keyed by **narrative pattern** — "un peuple réparti sur plusieurs pays",
"un pays et les peuples qui y vivent", "une langue accusée d'invention
coloniale", "un personnage historique", and so on — each fixing an opening
sentence pattern and a closing title/body. The operator's five **typologies**
(peuple, pays, patronyme, lieu, langue) name what the subject _is_ — the
corpus entity the question is about. These are orthogonal axes, exactly as the
brief anticipated: a `langue` subject can close on "Cette langue n'a pas
disparu" (the generic language/family row) or on "Cette langue n'a pas été
inventée" (the colonial-invention row) depending on which myth it takes apart,
never on typology alone.

**One gap the table does not yet cover**: no row exists for a patronyme whose
myth is simply "where does this family name come from" in the way Traoré/Diop
or Keïta/Coulibaly are used as the doctrine's own worked examples elsewhere in
this file. The closest existing rows — "un mot d'usage courant, qui reprend le
nom … d'une personne" (Rastafari) and "un nom partagé, repris par plusieurs
peuples distincts" — both presuppose a _specific_ twist a plain patronyme
episode may not have. **This plan does not invent that sixteenth row**; it
flags the gap for whoever writes the first patronyme episode under the new
cadence to raise with the operator (or via `/ethniafrica-onomastique`) before
that episode's `narrativePattern` is filled, per §7 ter's own rule that "un lot
dont le type n'a pas de ligne ici … n'a pas de clôture."

`narrativePattern` on the ledger entry (§2) stores the row's key phrase
verbatim (first few words are enough to disambiguate, e.g. `"un peuple réparti
sur plusieurs pays"`) so a later audit can group episodes by which myth-pattern
they used, independent of typology.

## 6. The site projection

`src/lib/productions/ledger.ts` — reads every `docs/productions/**/*.json` at
build/server time (Node `fs`, same trust level as
`docs/audience/audit-*.md` being read by the content-strategist skill; this
runs server-side only, mirroring the existing note that "static banks are read
server-side so the client bundle does not ship 67 facts").

`src/lib/productions/toDiscoveryPublication.ts` — a pure function,
**unit-tested first**, mapping one ledger entry to a `DiscoveryPublication`:

- `kind: "video"` when a `publications[]` row has `format: "video"`; emits a
  second, separate `DiscoveryPublication` of `kind: "carousel"` when a
  `format: "carrousel"` row also exists, sharing `subjects`/`campaign` but
  each with its own `id` (`<campaign>-video` / `<campaign>-carousel`) — a
  subject with both formats is two publications, matching how the private
  ledger already treats them as two posts.
- `video.watch` — one key per network present among that subject's `format:
"video"` rows, using the widened key set from §1.
- `detail.entities` — copied from `subjects[]` once `catalog.ts`'s union is
  widened per §1.2; this is the field `?autour=<id,id>` filters on (Phase 4,
  §6.5), so getting the widened kind set right here is what makes a patronyme
  or language production show up in its own fiche's "everything about this
  subject" deck.
- A publication with **zero** rows carrying a `url` (every network still
  "publié, URL non enregistrée") does not pass Phase 4's `eligiblePublications`
  video branch — poster and subjects are not enough, a watch link is required —
  so it is projected but stays invisible on the feed until a URL lands. This
  matches Phase 4's own eligibility rule; this plan changes nothing about it.

`src/lib/discoveries/videos.ts` becomes:

```ts
export const DISCOVERY_VIDEOS: DiscoveryPublication[] = loadProductionLedger()
  .flatMap(toDiscoveryPublication)
  .filter((p) => p.kind === "video");
```

No hand-authored records, no drift between the ledger a skill writes and the
manifest the reader shows. The carousel branch (`kind === "carousel"`) is
produced by the same function but **not wired into any reader yet** — that
wiring, and whether it renders as self-hosted images or an embed, is
`embedded-media-brief.md`'s decision, unchanged from the brief's own scope
line. Until that brief lands, projected carousel records simply exist and are
unused, which is a safe, inert state — nothing reads them, nothing breaks.

`social/tools/link-builder/productions.mjs`'s twenty entries are superseded
for any subject that has a `docs/productions/**/*.json` file: `sitePath`
replaces `path`, and the ledger replaces the former prose inventory of
published videos (since deleted) as the up-to-date list.
Do not delete `productions.mjs` in this pass — it is still read by
`check-anchors.mjs` and `seed-productions.mjs`, and retiring it is a separate,
mechanical change once every one of its twenty subjects has a ledger file
(track this as a rollout follow-up, not blocking).

## 7. GABARITS-SOCIAL.md diffs

- **§1 bis** — no change to the network × format table (§0 above). One
  addition: a bullet noting that the per-format folder name (`TikTok-
Instagram/`, `Instagram-Facebook-YouTube-X/`) sits alongside a
  `docs/productions/<typologie>/<NNN>-<slug>.json` file once the ledger
  exists, so a render's folder and its ledger entry can be cross-checked by
  `campaign`.
- **§7 ter** — one new paragraph before "La table par type de contenu",
  stating the typology/pattern axis distinction from §5 above, and recording
  the patronyme gap as an open item with today's date, in the same style the
  table already records its own decision history (e.g. the Rastafari and
  Mungo Park rows).
- **§10** — `cards.json` gains two fields, both optional until this plan's
  rollout reaches the skill that writes them (§8):
  - `sujets: string[]` — bare corpus ids (`"PPL_…"`, an ISO 3166-1 alpha-3, an
    ISO 639-3 code, `"PAT_…"`), exactly as Phase 4 §6.5 already specifies. Kind
    is inferred from the id's shape by `toDiscoveryPublication`'s corpus
    lookup, never hand-typed twice.
  - `episode: number` — the same value as the ledger entry's `episode`,
    written once by `ethniafrica-structure` at the moment it creates both
    files (§8), so the two can never drift; the gate's duplicate/hole checks
    (§3) are the enforcement, not a second copy of the rule in `cards.json`'s
    own validation.

## 8. Skill changes

In the order the operator asked for (`idee` and `structure` first):

- **`ethniafrica-idee`** — reads `docs/productions/` to compute the next free
  episode number per typology and to check whether a current-events subject
  (the operator's Goma example) should jump the queue; states the five
  typologies as the only valid `typologie` values a subject report may declare;
  states the "video + carousel, ≤ 3 minutes, presents the project, explains why
  appellations are hard and why 'ethnie' does not fit" requirements from the
  brief's §2 as fields the subject report must address before `structure`
  starts.
- **`ethniafrica-structure`** — writes the `docs/productions/**/*.json` file in
  the same tool call that writes the private ledger entry (never sequential
  calls a crashed session could leave half-done); copies `subjects[]`/`sujets`
  from the same corpus lookup into both `cards.json` and the ledger file, so
  the identity bridge is authored exactly once; requires `narrativePattern`
  resolved against §7 ter before writing (fails loudly, per §5, rather than
  leaving it blank).
- **`ethniafrica-produire`** — unchanged in rendering; after a successful
  render, appends the `publications[]` rows it can already know (format,
  network list from §1 bis) with `url` empty, so the operator only has to fill
  URLs in after posting, not the whole row shape.
- **`ethniafrica-reseaux-help`** — reads `docs/productions/` in addition to the
  private pipeline state; answers "where is this subject published, in which
  format" directly from `publications[]` instead of requiring the operator to
  open the right private post entry.
- **`ethniafrica-audience-audit`** — keys its per-post tables by `campaign` in
  addition to the human title, so a Plausible/platform metric joins a ledger
  file without a human reading both side by side. This is an additive column,
  not a rewrite of the audit's existing prose format.
- **`ethniafrica-content-strategist`** — reads the cadence document (§9) as
  its capacity ceiling: it may not propose more subjects for a publication day
  than the currently active stage of the ramp allows.

Follows `scripts/lib/audienceSkillContract.ts`'s existing shape for this kind
of cross-skill contract: a small `scripts/lib/productionSkillContract.ts`
naming `ethniafrica-structure` as producer and `ethniafrica-reseaux-help` /
`ethniafrica-audience-audit` / `ethniafrica-content-strategist` as consumers,
checked the same way — each consumer's skill file must still literally
reference `docs/productions/`, so an edit that silently drops the read fails
the contract instead of quietly reverting to guessing.

## 9. The cadence document, and the ramp

**Where the cadence lives**: `docs/productions/README.md` — new file,
alongside the ledger it describes, not inside GABARITS-SOCIAL.md (which
specifies _rendering_, not _scheduling_) and not inside a skill's private
`reference/` folder (which no gate reads, the exact failure mode the brief's
§1.5 names). Holds: the three publication days, the five-typologies-per-day
target, the fixed question formula, the per-piece requirements from the
brief's §2, and the ramp below — the one place `ethniafrica-idee` and
`ethniafrica-content-strategist` both read.

**The ramp**, resolving the brief's first tension explicitly rather than
mandating 30 renders a week from day one:

| Stage         | Cadence                                           | Rationale                                                                                                                              |
| ------------- | ------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| 0 — bootstrap | 1 subject, filed entirely by hand, no cadence yet | Prove the schema, the gate and the projection on one real subject end to end (§10) before any skill depends on them                    |
| 1             | Monday only, 2 subjects/day                       | Exercise `idee`→`structure`→`produire` against the new fields at low volume; surface schema problems while the fix is cheap            |
| 2             | Monday + Wednesday, 3 subjects/day                | Once Stage 1 runs three publication days with zero gate failures                                                                       |
| 3             | Monday/Wednesday/Friday, 5 subjects/day           | The operator's target cadence, reached once Stage 2 has sustained its rate for two consecutive weeks without a backlog of unfiled URLs |

Moving between stages is a `content-strategist` decision recorded in its own
dated report (it already writes one), not a code change — the cadence
document states the ceiling for the _current_ stage, and advancing a stage is
editing one line in it.

## 10. Rollout

Test-first at every step, per repository convention.

1. **Bootstrap fixture, by hand**: file one real, already-published subject
   (Lingala is a good candidate — already used as the worked example above, and
   already has both a video and a carousel per the private ledger) as
   `docs/productions/langue/001-lingala.json`, written by hand against the
   schema in §2, no tooling yet.
2. **Gate, test-first**: write the `--selftest` fixture table (§3) before
   `checkProductionLedger.ts`'s body; confirm it passes on the Lingala file and
   trips on each negative fixture; wire into `package.json` and the CI workflow.
3. **Projection, test-first**: unit tests for `toDiscoveryPublication` against
   the Lingala fixture before writing the function; widen
   `DiscoveryPublication["detail"]["entities"]["kind"]` in the same change,
   with its own test; wire `DISCOVERY_VIDEOS` per §6.
4. **Import, run once**: `importLedger.ts` against the private library; work
   the report to zero or an accepted residue; commit the resulting files under
   `docs/productions/` in batches small enough to review (by typology, five
   PRs rather than one).
5. **Skills**: `ethniafrica-idee` and `ethniafrica-structure` first, per the
   operator's stated priority; the remaining four skills in §8 after.
6. **Cadence document** (§9) lands with Stage 0 already true (one subject
   filed) and Stage 1 as the declared next step; `content-strategist` owns
   advancing it from there.
7. **Housekeeping**: add `docs/productions/README.md`,
   `production-history-brief.md` and this plan to `docs/README.md`'s index —
   `check:orphan-docs` holds a zero ceiling and will fail the build otherwise.
8. **Spec follow-up, not done here**: per `CLAUDE.md`'s own rule that
   Confluence is the source of truth for Requirements/Decisions/Architecture,
   run `/ethniafrica-spec` to draft the REQ/DEC entries this cadence and schema
   deserve (a REQ for the ledger's shape and gate, a DEC for the fixed
   five-typology cadence superseding the abandoned "three videos a week" plan
   `content-strategist` already recorded as reverted). This plan does not
   invent REQ/DEC numbers itself.

## 11. What this plan still leaves out

Unchanged from the brief's own §6: how a published piece plays on the site
(`embedded-media-brief.md`), and the editorial substance of any single
subject. Added by this plan's own research: the sixteenth `narrativePattern`
row for a plain patronyme episode (§5) is not resolved here — it is the first
concrete decision the rollout's Stage 1 patronyme subject will need from the
operator or `/ethniafrica-onomastique`.
