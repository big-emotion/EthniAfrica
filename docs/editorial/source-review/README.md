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
   `--apply` writes the fiches. It lists the English sidecars a `remove` drifts (run the
   `translate:record --drift` lines it prints) and the `NEEDS_REVIEW_RATCHET` line to lower in
   the same change. A `tier` or a `repair` drifts no sidecar: the translation hash leaves tiers
   and source urls out on purpose (`src/lib/afrik/translations/hashing.ts`), while a removal
   shifts the `sources[]` entries the sidecar was hashed against.
4. `npx tsx scripts/ci/checkSourceTierCoverage.ts` fails if a fiche contradicts a ruling, a ruled
   citation still says `needs_review`, a ruling states `needs_review` or an unknown tier, a
   rationale is empty, a ruling matches nothing, or two rulings name the same citation for a
   shared fiche (an absent `appliesTo` shares every fiche).

No editorial ruling is recorded here by tooling on its own: every entry is a moderator's
decision.
