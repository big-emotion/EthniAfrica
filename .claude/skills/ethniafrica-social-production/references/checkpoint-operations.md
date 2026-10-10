# Checkpoint operations

Run the helper from the project root. It uses only Node's built-in modules and
writes one human-readable `suivi.md` with an embedded JSON state in the piece's
existing temporary folder. Use the helper for state changes; do not hand-edit
approvals or duplicate state into another permanent log.

```sh
node .claude/skills/ethniafrica-social-production/scripts/workflow.mjs init 2026-10-10-uganda Ouganda instagram facebook tiktok
node .claude/skills/ethniafrica-social-production/scripts/workflow.mjs list Ouganda
node .claude/skills/ethniafrica-social-production/scripts/workflow.mjs status 2026-10-10-uganda
```

The `init` example is illustrative; do not create it just by reading this file.
Use the actual date, subject and selected networks. Existing folders are refused,
including historical pilots without a checkpoint; inspect those separately.

## Record an event

Read `status` first and use its revision. Send one JSON event through standard
input; do not put untrusted user text in interpolated shell commands. The example
below assumes revision 1; use the actual value. Remove any temporary event file
once the helper has consumed it.

```sh
node .claude/skills/ethniafrica-social-production/scripts/workflow.mjs event PIECE_ID <<'JSON'
{
  "expectedRevision": 1,
  "type": "checkpoint",
  "nextAction": "Verify the earliest attestation before presenting the proof",
  "context": "Angle approved. Date of coinage remains unknown. Research: research.md. Corpus comparison: corpus.md."
}
JSON
```

| Event         | Fields in addition to `expectedRevision`                                          | Meaning                                                                                                                                                                                                                        |
| ------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `checkpoint`  | `nextAction`; optional `context`, `waitingFor`                                    | Save compact resumption context. Waiting reasons: null, `design-system`, `operator-information`, `operator-resume`. A pending approval cannot be overwritten by a pause.                                                       |
| `design`      | `file`, `decision`                                                                | Record the operator-supplied and accepted design reference. `file` is project-relative; list all dependent design assets in proof/final reviews too. Reopens affected proof/delivery.                                          |
| `review`      | `gate` (1–3), nonempty `files`, `summary`; `researchFile` at gate 2               | Save fingerprints of all artifacts presented, then wait. Files must exist inside the project. Include the brief for gate 1; research, copy, corpus proposal and proof for gate 2; actual final media and `post.md` for gate 3. |
| `approve`     | `gate`, `decision`                                                                | Record the operator's explicit response to the current presentation. A decision string is evidence for recovery, not proof of authorization by itself. Never invent it.                                                        |
| `revise`      | `kind`, `reason`                                                                  | Route an actual correction. Kinds: `angle`, `research`, `copy`, `crop`, `package`, `design`. Meaning/rights changes use `research` or `copy`, not the rendering-only `crop` route.                                             |
| `networks`    | `networks`, `reason`                                                              | Record the operator's changed target list; preserve the angle and proof while reopening final delivery for the affected adaptation.                                                                                            |
| `publication` | `network`, `url` (HTTPS or explicit null), `publishedAt` (YYYY-MM-DD), `evidence` | Record an already-published outcome. Does not publish. Evidence can be the operator's report, labelled as such; an unknown URL remains null. Requires a current approved final package.                                        |

A later network change is recorded through `networks` before a new final
presentation; do not claim an unreviewed target was in the approved package.
Do not bypass selected networks in publication records.

Artifacts remain in the piece folder during this implementation phase. The
helper records project-relative paths so a fresh session in the same checkout
can resolve them. A returned external design must be copied into the project or
recorded through a local reference file before it can be fingerprinted; preserve
its original source location and version in that file.

## Research and corpus corrections

At gate 2, supply `researchFile` for the prepared dossier. Follow
[Research and corpus alignment](research-and-corpus.md) for discovery, evidence,
comparison revisions and candidate corrections. Evidence and reviewed corpus
files are automatically fingerprinted. Gate 3 refuses a pending destination.
Legacy checkpoints without a research dossier must revisit proof before delivery.

After approval 2, `corpus-progress` records an approved `proposal` key, the next
`status`, an `evidence` file and the status-specific PR, commit or live-page facts.
It never applies a correction or changes the website. Evidence freshness and
historical integration records survive resumption and targeted proof revisions.

## Recovery and limits

`status` recalculates approval freshness; changed inputs invalidate downstream
approvals in the returned state. The next successful event persists that result.
An unfinished review is not an approval. The helper uses an exclusive write lock,
a revision check and atomic replacement. An interrupted temporary write does not
replace the last complete checkpoint. A lock owned by a terminated process can
be recovered; a live or unidentifiable lock is reported for inspection. Do not
force-delete a live lock.

The helper cannot judge historical accuracy, readability, crop meaning, rights,
who actually gave approval, or whether a link is live. The agent must verify or
label those facts. Approval 3 yields `ready`, never automatic publication. It
records no automatic cleanup, analytics or deployment. Publication records remain
available while corrections are prepared; changing a live post still needs an
explicit operator instruction.

## Verification

```sh
node --test .claude/skills/ethniafrica-social-production/scripts/workflow.test.mjs
```

Tests use isolated temporary folders removed after each case. They simulate
approval events; they do not grant approvals for real content. Fresh-process
recovery verifies disk continuity, not behavioral equivalence of language models.
