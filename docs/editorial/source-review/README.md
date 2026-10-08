# Source tier rulings

`source-tier-rulings.json` is the ledger of decisions on citations the corpus still marks
`tier: "needs_review"`. It lives outside `dataset/` on purpose: every validator walks that
tree as fiches, and a ledger is not a fiche.

## Why a ledger in git

A tier edited only in the database does not survive: the next corpus sync re-upserts every
source from the JSON, and the fiche pages read tiers from the JSON directly. A ruling has
happened when it is in git, and not before.

## Why one citation at a time

The corpus measured 929 `needs_review` citations in 426 fiches on 2026-09-14, across ~887
distinct titles, more than half of them without a URL. A ruling per domain clears about one
citation, because almost nothing repeats: the only real repeats are "ONU – World Population
Prospects 2025" (21 fiches) and "ONU – Données démographiques 2025" (12). So a ruling names one
citation identity — its exact `title` and `url` — and by default applies to every fiche citing
that pair.

## Schema

```json
{
  "id": "STR-2026-09-14-0001",
  "match": { "title": "ONU – World Population Prospects 2025", "url": null },
  "appliesTo": ["pays/BEN.json"],
  "decision": "tier",
  "tier": "official",
  "rationale": "Why this tier, for the next reviewer.",
  "decidedBy": "the moderator's account id",
  "decidedAt": "2026-09-14",
  "draftId": "uuid of the admin-queue draft it came from"
}
```

| Field         | Required            | Meaning                                                                                  |
| ------------- | ------------------- | ---------------------------------------------------------------------------------------- |
| `id`          | yes, unique         | Stable handle the gate names in its messages                                             |
| `match.title` | yes                 | The citation's exact title                                                               |
| `match.url`   | yes (may be `null`) | The citation's exact url; `null` for a citation without one                              |
| `appliesTo`   | no                  | Fiche paths relative to `dataset/source/afrik`; absent means every fiche citing the pair |
| `decision`    | yes                 | `tier` sets the tier · `repair` replaces the url and sets the tier · `remove` deletes it |
| `tier`        | for `tier`/`repair` | `official`, `referenced` or `unverified` — never `needs_review`                          |
| `repairedUrl` | for `repair`        | The url the citation carries afterwards (a dated archive snapshot, the live page)        |
| `rationale`   | yes, non-empty      | Why. Stays in this ledger                                                                |
| `decidedBy`   | yes                 | The moderator's account id — never an e-mail address, this repository is public          |
| `decidedAt`   | yes                 | ISO date                                                                                 |
| `draftId`     | no                  | The `source_tier_ruling_drafts` row the ruling was pulled from                           |

**The rationale never reaches `sources[].notes`.** Notes are published to readers verbatim and
the rationale is workshop vocabulary, which `reader-facing-register` refuses there.

## Running order

1. A moderator decides in the admin queue, `/fr/admin/sources`. That writes a draft row, not a
   ruling.
2. `npx tsx scripts/afrik/pullSourceTierRulings.ts --target=recette|production` appends one
   ruling per citation (idempotent on `draftId`). When a moderator decided the same citation
   twice before the pull, the latest draft wins and the earlier ones are listed as superseded. A
   draft on a citation this ledger already rules on is listed and not appended: revise that
   ruling by hand if the new decision stands.
3. `npx tsx scripts/afrik/applySourceTierRulings.ts` prints what would change;
   `--apply` writes the fiches. It prints the `NEEDS_REVIEW_RATCHET` line to lower in the same
   change.
4. `npx tsx scripts/ci/checkSourceTierCoverage.ts` fails if a fiche contradicts a ruling, a ruled
   citation still says `needs_review`, a ruling states `needs_review` or an unknown tier, a
   rationale is empty, a ruling matches nothing, or two rulings name the same citation for a
   shared fiche (an absent `appliesTo` shares every fiche).

No editorial ruling is recorded here by tooling on its own: every entry is a moderator's
decision.

# AI-source verifications

`ai-source-verifications.json` is the ledger of web-search proposals for the corpus sources marked
`source_kind: "ai_generated"` — citations whose text came from agent or internet output rather
than from a work someone consulted. On 2026-10-08 the corpus held 1 343 of them: 494 patronyme
`sources[]` entries and 849 `provenance` markers in the anthroponym candidate queue
(`patronymes/_candidates-by-country.json`).

## Why a human decides

A web search finds pages; it does not establish that a page states the claim. The model can misread
a source, quote one that only resembles the claim, or find nothing for a statement that rests on an
oral account. So tooling only ever writes `proposed`, and every other status is a person's
decision.

No outcome deletes a source. The doctrine (`docs/editorial/doctrine.md` §1.1) never blocks a source
for not being written or online: when no candidate holds, the reviewer keeps the citation as the
synthesis it is (`rejected`) or flags that an oral account must be recorded (`oral_needed`).

## Why one source at a time

An entry names a source by fiche and JSON path, not by title. The tail is mostly one generic
citation repeated across hundreds of fiches, each standing for a different name, so a title match
would verify them all at once.

## Schema

```json
{
  "id": "ASV-2026-10-08-0001",
  "fiche": "patronymes/PAT_DIOP.json",
  "path": "sources[0]",
  "claim": "id: PAT_DIOP; nameMain: Diop; nameSystem: clan_name",
  "original": {
    "title": "Relevé de couverture anthroponymique EthniAfrica",
    "url": null
  },
  "candidates": [
    {
      "title": "…",
      "author": "…",
      "year": 1998,
      "url": "https://…",
      "source_kind": "academic",
      "quote": "the passage that states the claim",
      "supports": "which part of the claim it establishes"
    }
  ],
  "status": "accepted",
  "chosen": 0,
  "tier": "referenced",
  "decidedBy": "the reviewer's account id",
  "decidedAt": "2026-10-09",
  "proposedAt": "2026-10-08",
  "model": "claude-opus-5-5"
}
```

| Field        | Required                 | Meaning                                                                                       |
| ------------ | ------------------------ | --------------------------------------------------------------------------------------------- |
| `id`         | yes, unique              | `ASV-YYYY-MM-DD-NNNN`; the date is the proposal's, the number runs across the whole ledger    |
| `fiche`      | yes                      | Fiche path relative to `dataset/source/afrik`                                                 |
| `path`       | yes, unique with `fiche` | JSON path of the source in the fiche, e.g. `sources[0]`, `countries[3].entries[1].provenance` |
| `claim`      | yes                      | The string fields beside the source — what it vouches for, as a search brief                  |
| `original`   | yes                      | The machine-written citation's `title` and `url` at proposal time                             |
| `candidates` | yes (may be empty)       | Each a work with an http(s) `url` and a verbatim `quote`; never `ai_generated` or a marker    |
| `status`     | yes                      | `proposed` · `accepted` · `rejected` (keep as synthesis) · `oral_needed`                      |
| `chosen`     | for `accepted`           | Index of the accepted candidate                                                               |
| `tier`       | for `accepted`           | `official`, `referenced` or `unverified`, set by the reviewer — never by the model            |
| `decidedBy`  | for every human status   | The reviewer's account id — never an e-mail address, this repository is public                |
| `decidedAt`  | for every human status   | ISO date                                                                                      |
| `proposedAt` | yes                      | ISO date of the search                                                                        |
| `model`      | yes                      | The model that ran the search                                                                 |

## Running order

1. `npx tsx scripts/afrik/verifyAiGeneratedSources.ts --limit 20` (or the weekly
   `ai-source-verification` workflow, which opens a pull request) searches the next ai_generated
   sources in corpus order, skipping any already in the ledger, and appends `proposed` entries.
2. A reviewer opens each candidate's url, checks that the quote is there and states the claim, then
   sets `status` and `decidedBy` / `decidedAt` — plus `chosen` and `tier` when accepting.
3. `npx tsx scripts/afrik/applyAiSourceVerifications.ts` prints what would change; `--apply`
   replaces each accepted source with the chosen candidate (keeping its `sourceKey`, writing no
   `notes` — a ledger id is workshop vocabulary). It prints the `AI_GENERATED_RATCHET` line to
   lower in the same change.
4. `npm run check:ai-sources` fails when a new ai_generated source enters the corpus, when the count
   drops below the ratchet, when an entry is malformed, and when an accepted entry is not in the
   fiche yet or the fiche contradicts it.
