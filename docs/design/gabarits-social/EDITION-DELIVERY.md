# Edition delivery — packages per network, occurrences, readings

Status: **implemented and checked** by `social/tools/production/*.test.mjs`; not yet accepted.
Meanings (edition, occurrence, approval keyed `role:id`) are
[`EDITORIAL-CONTRACT.md`](EDITORIAL-CONTRACT.md); this file is the procedure. The canonical
REQ/DEC/ARCH behind it are pending drafts: cite none as approved.

Three records, never fused. **Rendering** is `production-progress.json` (seven stages, video only).
**Readiness for a destination** is the applicable reviews still valid for the inputs as they are now,
then a sealed package. **Publication** is an occurrence a person filed from evidence. A package
never records a posting, and no command here contacts a network or schedules anything.

## Files, all in one private package folder

| File                                       | Written by            | What it holds                                                                                          |
| ------------------------------------------ | --------------------- | ------------------------------------------------------------------------------------------------------ |
| `edition.json`                             | the producer          | contract edition: `id`, `subject`, `angle`, `family`, `format`, `claims[]`, `media[]`, `intendedNetworks` |
| `approvals.json`                           | the reviewer          | `[{check, reviewer:{role,id}, reference, inputs:{"claim:c1": sha256, …}}]`                              |
| `spec.json`                                | the producer          | what each input is: `{"claim:c1": {"text": …}, "layout:card1": {"path": …}}`                            |
| `artifacts.json`                           | the producer          | carousel: `{kind, cards[], credits, copy, cover}`; video: `{kind:"video", delivery, kit}` (reused)      |
| `package/<edition>/<network>/edition-package.json` | `package`      | sources, output identity (paths + sha256), reviews with references, `publication.performed: false`     |
| `occurrences.json`                         | `occurrence`          | what was actually posted, with evidence, or a `fixture: true` test record                              |
| `observations.jsonl`                       | `observe`             | append-only readings; the same reading imported twice is skipped                                        |

`plannedDate` is optional everywhere. A ready edition with no date packages and reads the same.

## Commands (from the repository root; `P` is the private package folder)

```sh
CLI=social/tools/production/edition-cli.mjs
BASE="--edition edition.json --approvals approvals.json --inputs inputs.json"

node $CLI inputs     "$P" --spec spec.json > "$P/inputs.json"      # hashes the inputs a review reads
node $CLI status     "$P" $BASE --networks tiktok,instagram        # review / package / publication, per network
node $CLI package    "$P" $BASE --artifacts artifacts.json --network tiktok
node $CLI occurrence "$P" --edition edition.json --network tiktok \
  --url <the real post URL> --published-at <ISO time with zone> \
  --evidence-reference "<where the proof of posting is filed>"
node $CLI observe    "$P" --edition edition.json --network tiktok \
  --metrics metrics.json --observed-at <ISO time with zone>
```

Resuming needs nothing but the folder: `status` reads the disk and the approvals, so an interrupted
session repeats no render and no review. A package whose files changed reports `stale`; a
destination whose approvals no longer match the inputs reports what is `stale` or `missing`.

## What invalidates what

- A crop or destination change touches `layout:` / `destination:` inputs: only reviews that read
  them are asked again; narration, claim and audio approvals stay.
- A claim change touches `claim:<id>`: exactly the approvals citing it go stale.
- The `music` review reads `destination:<network>`: an approval for one network does not cover another.
  Every other review reads content and carries over to each destination.
- A check that does not apply (`not-applicable`, with its reason) is never requested and never
  removes one of the five universal checks.
- The reviewer of an artifact is never its producer (`--produced-by`).

## Platform boundary

`scripts/lib/socialFormatMatrix.json` is the one table: the TypeScript ledger gate and these tools
read it. A network that refuses a format (X and the carousel) blocks the package. A **limit** is
enforced only if it carries the official page and the day it was read, and one older than 120 days
is reported as unverified again. As of 2026-09-29 exactly one limit is verified: YouTube Shorts,
180 seconds. Every other duration or card-count limit is listed under `unverifiedLimits` in the
package rather than assumed; verify it on the platform's own page the day you rely on it.

## Occurrences

Unknown is written `null`, never invented, and a live posting needs evidence: an operator attestation
with its reference, or a filed artifact. The address must belong to the network. A **fixture** is
labelled `fixture: true`, must use a `.invalid` address, never counts as live, never a duplicate, and
can only produce a fixture-labelled reading. Filing the occurrence in the private registry is the
library owner's step (`register-post.mjs`); this tool records the fact beside the package.

## Readings (7 and 28 days)

Method: `docs/audience/format-audit-2026-09-26/measurement-protocol.md`. A reading starts from a
published occurrence with an identity. Age and window are computed, never typed: 7 days is 156–180 h,
28 days is 648–696 h after a publication time that carries a zone; a date-only publication leaves the
window `null`. Each metric is `{value, status, label}` with the protocol's statuses: `hidden`,
`not_read` and `not_applicable` require `null`, `zero_shown` requires `0`. A combined Meta reading is
one record with `scope: combined_meta` (the contract's `meta-combined` is accepted and normalised) and
is never split. Paid status defaults to `unknown`.

`metrics.json` example: `{"views": {"value": 320, "status": "observed", "label": "Views"}, "saves": {"value": null, "status": "hidden", "label": "Saves"}}`.

## Tests

`cd social/tools && node --test production/` (delivery, destinations, observations, agent handoffs,
and `edition-delivery.e2e.test.mjs`, which walks a carousel and a video through package, interrupted
resumption, a fixture publication and a later reading).
