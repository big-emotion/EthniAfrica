# Research and corpus alignment

Roadmap step 5 connects evidence preparation to the existing three approvals.
Read the [checkpoint operations](checkpoint-operations.md) and the canonical
[production specification](https://big-emotion.atlassian.net/wiki/spaces/ETHNIAFRIC/pages/212795394).
These tools use Node built-ins. They never query or write a database, publish,
merge or deploy. Research interpretation remains the agent's responsibility.

## Agent sequence

1. After approval 1, identify the studied form, related names, peoples, languages
   and regions. Search the actual corpus using relevant spellings and aliases:

   ```sh
   node .claude/skills/ethniafrica-social-production/scripts/research.mjs discover Ouganda Uganda Buganda
   ```

   This is normalized substring discovery across JSON records, not semantic
   research. Examine the candidates and their relationships. Broaden the terms
   when sources reveal another name. The output includes file hashes. Record a
   reason for each excluded match; a broad geographic mention is not necessarily
   relevant. A no-match result needs a documented scope explanation.

2. Research original passages with available search/browser tools and institutional
   collections. Existing fiches are starting points, not independent confirmation.
   Prefer sources suited to the particular claim; preserve supported disagreement.
   Retain short, usable evidence records and precise locators within the piece's
   folder, respecting source permissions. Oral accounts need attribution and
   permission for the actual use. Never fabricate a passage, source, consent or
   verification observation to satisfy a field.
3. Write `research.json` in that same piece folder, using the format below. Every
   factual claim in the planned cards must be covered, even though the helper
   cannot infer whether an omitted assertion appears in prose. Compare against
   specific fiche fields. Prepare minimal corrections with their sources and any
   needed source-list changes. Preserve competing accounts in the corrected text,
   not merely in internal notes. Explicitly separate creation, attestation,
   adoption and antecedents; unknown dates and actors stay null.
4. Prepare a new comparison revision:

   ```sh
   node .claude/skills/ethniafrica-social-production/scripts/research.mjs prepare PIECE/research.json PIECE/research-v1
   ```

   This writes `corpus.md`, `report.json` and candidate copies under `proposed/`.
   It does not edit canonical fiches. Inspect the actual before/after values and
   check meaning. The candidate copies are proposals, not schema-validated or
   publication-ready data. Never copy a complete candidate over a fiche that has
   changed since its recorded hash.

5. At approval 2, present the complete proof, the source evidence, `corpus.md` and
   candidate corrections. Include those files in the review event and set
   `researchFile` to the project-relative dossier. The coordinator adds evidence,
   image-rights files, excluded matches and reviewed fiches to the fingerprints.
   A missing comparison refuses review. The helper also checks for newly matching
   corpus files before approval and on recovery. This is part of approval 2,
   not a fourth human gate.
6. For an approved correction, first establish a focused failing regression check
   for the discrepancy. Apply the smallest edit through the normal repository
   workflow; run the applicable fiche schema/data validation, editorial checks and
   focused regression. Use `scripts/validateAfrikData.ts` as appropriate to the
   existing data workflow; do not invent an unsupported per-file flag. Review the
   resulting diff, then record the checks, PR, integration and live evidence below.
   A production release still requires its own explicit authorization.
7. Before approval 3, verify the promised public destination against the actual
   supported answer, not just an HTTP success or a merged PR. If unavailable,
   resolve it or rewrite the invitation and record `no-link`. Review the changed
   proof when meaning or destination changes; verifying the same pending address
   and invitation is not a change (see below). Final review rejects `pending`.

## Dossier format

The complete executable synthetic examples are in
[`research.test.mjs`](../scripts/research.test.mjs). They are test evidence, not
historical assertions or operator approvals. Fields:

| Field               | Content                                                                                                                                                                                                                                                                                                                  |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `schema`, `subject` | `1` and the subject.                                                                                                                                                                                                                                                                                                     |
| `search`            | Nonempty `terms`; `excluded` entries each have `file` and `reason`. Every discovered match is reviewed or explicitly excluded.                                                                                                                                                                                           |
| `records`           | Entries with canonical project-relative corpus `file` and its current `sha256`. Empty only with `noCorpusReason`.                                                                                                                                                                                                        |
| `sources`           | Unique `id`, `kind` (`written` or `oral`), `citation`, `locator`, short exact `passage`, local `recordFile`, `basis`. Oral sources also need `consent`.                                                                                                                                                                  |
| Source `basis`      | `attestation`, `creation`, `adoption`, `context`, `hypothesis` or `unknown`: what this passage supports. Split passages with different roles into separate records.                                                                                                                                                      |
| `claims`            | Unique `id`, `text`, `certainty` (`supported`, `hypothesis`, `unknown`, `contested`), nonempty source IDs in `sources`, and `limits`. Contested claims need distinct source IDs.                                                                                                                                         |
| Name-event claim    | Additionally `event` (`attestation`, `creation`, `adoption`, `antecedent`), `date` and `actor`, explicitly null when unknown. An unknown claim cannot invent either. A supported creation needs a creation source; attestation alone is refused.                                                                         |
| `findings`          | Unique `id`, `claim` ID, corpus `file`, JSON `pointer`, `before: {exists, value}`, `kind` (`confirmation`, `missing`, `contradiction`, `uncertain`), and `rationale`. Every reviewed file needs a finding.                                                                                                               |
| Finding `proposal`  | Optional `{value, certainty, retainedAccounts}`. Certainty matches the claim. Contradictions, hypotheses and competing accounts need an explanation of what is retained. Confirmations have no correction. Nonoverlapping additions/replacements only; no deletion operation.                                            |
| `images`            | Selected assets with `file`, exact item `sourcePage`, `creator`, `description`, `reuseBasis`, `credit`, `crop` and local `rightsEvidence`. Empty while none selected; fill it for all images used in the proof.                                                                                                          |
| `destination`       | `status`, exact `invitation`; `no-link` needs `reason`, `pending` needs HTTPS `url`, `verified` needs `url`, `checkedAt`, `support` observation and local `evidence` file. The `url` is the bare page, without `utm_` parameters: the package adds each network's [campaign tags](publication-package.md#campaign-tags). |

The checker verifies that the quoted passage occurs in its saved record and
that before-values and hashes match. It cannot verify that the record is an
authentic external source, that a claim faithfully interprets it, that two
sources are independent, or that a licence permits the intended adaptation.
Those checks belong to the agent and the human proof review. A structurally
valid dossier is not a claim of historical certainty or FALC compliance.

## Corpus progress and recovery

Approval 2 saves each proposed correction with a key of the form
`RESEARCH_HASH:FINDING_ID` in `corpusProposals`. The ordinary status command
returns these keys. Use a `corpus-progress` event with that `proposal`, the next
`status`, a project-relative `evidence` file and the current `expectedRevision`.

| Status            | Evidence to obtain before recording                                                                                                                                                                        |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `prepared`        | Produced by comparison; this is not an integration claim.                                                                                                                                                  |
| `locally-checked` | Actual field matches the approved proposal; saved successful schema, editorial and discrepancy checks. The helper checks the field value and fingerprints the log; it does not execute the checks for you. |
| `proposed`        | Actual repository review/PR `url` and saved supporting evidence. Attach a created PR to the chat as usual.                                                                                                 |
| `integrated`      | Actual integration `commit` and evidence that the correction is present in the intended integration branch.                                                                                                |
| `verified-live`   | Actual public `url`, `checkedAt`, supporting `observation`, and saved live evidence after the normal release/synchronization path.                                                                         |

Statuses advance in order for each approved proposal. The helper labels these
as agent-recorded evidence, not automatic remote verification. Missing logs,
skipped states and an unchanged local target are refused. Changed evidence is
marked `evidenceCurrent: false` on recovery and prevents further advancement.
Do not report such a record as current verified evidence.

When the correction was merged together with later edits to the same field (for
example sources added by another change, or a URL normalized to match an existing
locator), the field no longer equals the approved value byte for byte. Record
`locally-checked` with a `reconciliation` explaining each difference. The helper
keeps the approved proposal unchanged and stores the integrated field as
`observedValue`, so both remain visible. It refuses when the field still holds
the reviewed `before` value: a correction that was never applied cannot be
reconciled. Do not use this to accept a change of meaning; that needs a revised
proof.

### Integrated corrections keep the proof current

A canonical fiche edit changes the proof's source fingerprint. Applying the
corrections the operator approved is the expected outcome of approval 2, not a
change to what was reviewed, so it does not reopen the proof. A reviewed fiche
whose hash changed stays current when all of these hold:

- at least one approved correction for that fiche has a `locally-checked` record
  (or a later status) in the current checkpoint;
- each such correction's pointer holds the approved value, or the recorded
  reconciled `observedValue`;
- putting those pointers back to their reviewed `before` values (removing a
  field that did not exist) gives exactly the reviewed JSON structure.

Any other change reopens approval 2 and downstream delivery while preserving
approval 1: a later unrelated edit to the same fiche, a corrected field
reverted or changed again, or an edit recorded without its `locally-checked`
progress. A change of meaning still needs a revised proof. Never rewrite hashes
to hide a change.

The checkpoint stores only the reviewed fiche's sha256, not its bytes. Writing
the JSON again does not reproduce the repository's formatting (prettier output
differs from `JSON.stringify`), so the helper recovers the reviewed bytes from
git history: the newest commit of that path whose content has the reviewed
sha256. Limits: the reviewed version must have been committed and be reachable
from the checked-out branch; otherwise, or when git is unavailable, the edit
reopens approval 2. Comparison is structural, so key order matters and
whitespace does not. This needs no new checkpoint field and applies equally to
checkpoints saved before the rule existed.

Record `locally-checked` for every correction of an edited fiche before any
other event. A `corpus-progress` event does not save an intermediate approval
status, but any other event saved while a fiche holds unrecorded corrections
saves the proof as `stale`. A checkpoint saved that way, including one saved
before this rule, is recovered with `restore-approval` (gate `2` and a
`reason`). It restores the same approval and decision only when the fiches
pass the rule above, every other reviewed file is unchanged, corpus coverage is
unchanged, the angle was not approved again, the design and dossier were not
replaced and no angle, research, copy or design correction was requested after
the approval. Approval 3, if it was staled at the same time, needs a new final
review.

A newly searched name or other substantive new research also needs a revised
proof.

### Verifying a pending destination

Review 2 saves the reviewed `destination` and a hash of the dossier without it.
Changing the dossier from that `pending` destination to `verified` with the same
`url` and `invitation` keeps approval 2: it completes the promise shown in the
proof. Any other dossier edit, another invitation or address, or a move from
`no-link` (which adds a link the proof did not show) reopens approval 2. Final
review still checks the verification fields and evidence. Checkpoints reviewed
before this rule lack the saved destination, so for them every dossier edit
reopens approval 2.

The tool writes each comparison to a new directory under the piece. A lock and
staging directory protect the final rename. Normal failure removes them. After
an abrupt interruption, inspect any remaining lock/staging directory and confirm
no writer is running before cleanup; an existing output is never overwritten.
This research helper never deploys or deletes working files. Pending corpus
work blocks closure under [History and cleanup](history-and-cleanup.md); only
verified completion allows the production folder to be consolidated and cleaned.

## Checks

```sh
node --test .claude/skills/ethniafrica-social-production/scripts/*.test.mjs
node .claude/skills/ethniafrica-social-production/scripts/research.mjs check PIECE/research.json
node .claude/skills/ethniafrica-social-production/scripts/research.mjs check PIECE/research.json --delivery
```

Run publication checks on actual proposed public text and final publication
files. Synthetic fixture prose and the internal comparison are not public copy.
