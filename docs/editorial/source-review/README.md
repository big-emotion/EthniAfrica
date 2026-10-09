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

The guarantee is that no AI-generated source enters the corpus without a person looking at it — not
that none exists. A reviewed source may stay, labelled as what it is.

## Why a human decides

A web search finds pages; it does not establish that a page states the claim. The model can misread
a source, quote one that only resembles the claim, or find nothing for a statement that rests on an
oral account. So tooling only ever writes `proposed`, and every other status is a person's
decision.

No outcome deletes a source. The doctrine (`docs/editorial/doctrine.md` §1.1) never blocks a source
for not being written or online: when no candidate holds, the reviewer keeps the citation as the
synthesis it is (`rejected`) or flags that an oral account must be recorded (`oral_needed`).

## What one source is

A source is identified by its fiche, title and url (trimmed; an absent or empty url is none). Not
by title alone: the tail is mostly one generic citation repeated across hundreds of fiches, each
standing for a different name. Not by JSON path either: a citation inserted above shifts every
index after it, and the same source would read as new.

Within one fiche, ai_generated sources sharing a title and url are one source, and one decision
covers all of them. A `provenance` marker in the candidate queue carries neither, so its identity
adds the owning entry's `countryId` and `name` (recorded as the entry's `owner`), plus `nameSystem`
where those two repeat; a collision that survives that fails every tool loudly. The queue's 849
markers are 849 sources, and reordering the queue changes none of them.

An entry's `path` records where the source was at proposal time. Tooling re-locates the source by
identity and never trusts that path.

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
  "model": "opus (claude -p)"
}
```

| Field        | Required               | Meaning                                                                                    |
| ------------ | ---------------------- | ------------------------------------------------------------------------------------------ |
| `id`         | yes, unique            | `ASV-YYYY-MM-DD-NNNN`; the date is the proposal's, the number runs across the whole ledger |
| `fiche`      | yes                    | Fiche path relative to `dataset/source/afrik`                                              |
| `path`       | yes                    | Where the source was at proposal time, e.g. `sources[0]`; informative, not an identifier   |
| `claim`      | yes                    | The string fields beside the source — what it vouches for, as a search brief               |
| `original`   | yes                    | The machine-written citation's `title` and `url` at proposal time                          |
| `candidates` | yes (may be empty)     | Each a work with an http(s) `url` and a verbatim `quote`; never `ai_generated` or a marker |
| `status`     | yes                    | `proposed` · `accepted` · `rejected` (keep as synthesis) · `oral_needed`                   |
| `chosen`     | for `accepted`         | Index of the accepted candidate                                                            |
| `tier`       | for `accepted`         | `official`, `referenced` or `unverified`, set by the reviewer — never by the model         |
| `decidedBy`  | for every human status | The reviewer's account id — never an e-mail address, this repository is public             |
| `decidedAt`  | for every human status | ISO date                                                                                   |
| `proposedAt` | yes                    | ISO date of the search                                                                     |
| `model`      | yes                    | The model that ran the search                                                              |

## Where the search runs

On the operator's machine, never on GitHub, and on their Claude subscription through Claude Code
in non-interactive mode (`claude -p`). There is no API key to configure and no secret in the
repository. The run gets the web tools only (`WebSearch`, `WebFetch`), in safe mode with no MCP
server, its answer held to a JSON schema; the claim is passed on stdin. A run that fails or times
out is not ledgered, so it is retried; an answer that cannot be read is ledgered with no candidate.

Prerequisite: `claude` on `PATH` and logged in once (`npm install -g @anthropic-ai/claude-code`,
then `claude`).

### The pre-push hook

`.husky/pre-push` runs `scripts/hooks/prePushAiSources.ts`. It looks only at the ai_generated
sources the pushed commits add (compared with the remote branch, or with the merge-base on
`origin/recette` for a new branch), by fiche, title and url — an insertion that only shifts an index adds nothing:

- none added — exits silently, without calling Claude. This is almost every push;
- added and decided in the pushed ledger (`rejected`, `oral_needed`) — the push goes through;
- added with no ledger entry — searches them (at most 20 per attempt), appends `proposed`
  entries to the working-tree ledger, prints what to decide, and blocks the push;
- `proposed`, or `accepted` but not applied yet — blocks the push and says what is missing;
- `claude` missing — blocks the push and says how to install it, or how to record a decision by
  hand (`rejected` and `oral_needed` need no search).

The decision counts once it is in a pushed commit: commit the ledger, then push again.

Bypass: `git push --no-verify`. CI still runs `npm run check:ai-sources` on every pull request,
whose ratchet fails on any new unreviewed ai_generated source whether the hook ran or not.

## Running order

1. Proposals come from the pre-push hook for new sources, or from the backlog command for the
   existing ones: `npm run verify:ai-sources -- --limit 20` (20 by default) searches the next
   ai_generated sources in corpus order, skipping any already in the ledger, and appends
   `proposed` entries.
2. A reviewer opens each candidate's url, checks that the quote is there and states the claim, then
   sets `status` and `decidedBy` / `decidedAt` — plus `chosen` and `tier` when accepting.
3. `npx tsx scripts/afrik/applyAiSourceVerifications.ts` prints what would change; `--apply`
   re-locates each accepted source by identity and replaces it with the chosen candidate (keeping
   its `sourceKey`, writing no `notes` — a ledger id is workshop vocabulary). It writes nothing
   when an accepted identity is in the fiche neither as an ai_generated source nor as the applied
   candidate. It prints the `UNREVIEWED_AI_GENERATED_RATCHET` line to lower in the same change.
4. `npm run check:ai-sources` counts the unreviewed ai_generated sources: every one whose identity
   has no `rejected` or `oral_needed` entry (an accepted one is replaced in the fiche; a proposed
   one is still unreviewed). It fails when that count rises above the ratchet or falls below it,
   when an entry is malformed or two entries name one identity, and when an accepted entry is not
   in the fiche yet or the fiche contradicts it. Recording a `rejected` or `oral_needed` decision
   lowers the count, so lower the ratchet in the same change.

## Source kinds awaiting a person

`source-kind-review.json` lists the fiche sources that `scripts/afrik/classifySourceKinds.ts`
leaves without a `source_kind`, grouped by host. A group carrying a `rule` is held on purpose,
with the reason: the host serves several kinds of work (archive.org), or the vocabulary has no
kind for it yet (encyclopedias, NGOs, mission databases). A group without one is a host no rule
names. The script regenerates the file on every `--apply`; a decision lands as a new rule in
the script or as a `source_kind` written in the fiche, and `npm run check:source-kinds` is then
lowered to the new count.
