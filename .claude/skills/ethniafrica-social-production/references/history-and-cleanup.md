# Publication history and cleanup

Implements roadmap step 7 under the [operator specification](https://big-emotion.atlassian.net/wiki/spaces/ETHNIAFRIC/pages/212795394).
Use the same commands in Claude and Codex. These are agent tools; the operator
can simply ask to finish, pause or retrieve a publication.

## Record the actual outcome first

After explicit publication authorization and actual posting, record each network
with the coordinator's `publication` event. The event requires approval 3 and
rechecks the exact package. It now preserves the published images and a snapshot
of that network's caption, comment, link route, card text, alternative text,
sources/passages and image credits/rights. Identical files are stored only once.
The snapshot survives later package revisions. The event does not post and its
evidence is an agent observation or an explicitly attributed operator report,
not automatic verification of a social platform. Confirm that the reported post
matches that package; reconcile differences before recording it. Unknown URLs
stay explicitly null. Never invent a publication date or URL.

Use `cancel-network` with `network` and the operator's actual `reason` for an
abandoned target. Removing a network through `networks` does not cancel it. A
published outcome cannot be relabelled cancelled. Re-adding a target clears its
cancellation and requires a new outcome if it has never been published.

An old publication record without a preserved version blocks closure: recover
and reconcile its actual files and copy first. Do not attach today's package to
an old post merely to pass the check.

## Consolidate, inspect, then clean

Before closure, verify every intended target, resolve pending retouches, and
complete every approved corpus proposal through `verified-live` with unchanged
evidence. While any target or correction remains pending, keep the active folder
intact. The helper does not infer corpus integration from a commit alone.

Prepare a small closure input with `summary` (useful decisions), `lessons` (or
explicitly none) and `retain` (additional project-relative files containing
irreplaceable evidence, or explicitly an empty list). Review source records for
original oral recordings, consent documents or other evidence not already
included in the dossier. Include those files in `retain`; a consent description
is not a backup of an original recording. Do not include regenerable drafts,
shared design assets or a duplicate workshop. This is agent consolidation, not
a fourth routine human approval.

```sh
node .claude/skills/ethniafrica-social-production/scripts/history.mjs archive PIECE_ID < closure.json
node .claude/skills/ethniafrica-social-production/scripts/history.mjs inspect PIECE_ID
node .claude/skills/ethniafrica-social-production/scripts/history.mjs cleanup PIECE_ID
```

The retained location is `.local/publications/PIECE_ID/`:

- `history.md`: readable publication text plus a structured record of exact
  versions, sources/passages, image URLs/credits, outcomes, decisions, corpus
  status and lessons. It contains no permanent approval log.
- `media/`: final images actually published, addressed by their contents; the
  history preserves their original numbered order for each network.
- `evidence/`: cited source records, rights evidence, corpus integration evidence
  and explicitly retained irreplaceable files. These may be private.

This local archive is excluded from Git. It is not a remote backup and does not
change the legacy public JSON ledger in `docs/productions/`. Shared tools/design
remain in their normal locations; integrated corpus edits remain in Git.

Archive creation verifies outcomes and evidence, copies the retained material,
and freezes that piece against further coordinator writes. Read the resulting
history and inspect its media before invoking cleanup. To develop a later
publication from a closed piece, start a new identifier and cite the history.

Cleanup verifies the retained files and that the working folder still matches
the consolidation inventory. It deletes only those inventoried local working
files, then empty folders. This includes `suivi.md`, package `post.md`, rejected
versions, proofs, downloaded images and temporary renders whose useful material
has been consolidated. It never deletes shared files or an unrelated pilot.
Do not run closure on the original Uganda inspection material.

## Interrupted work and retrieval

```sh
node .claude/skills/ethniafrica-social-production/scripts/history.mjs list SUBJECT
node .claude/skills/ethniafrica-social-production/scripts/history.mjs inspect PIECE_ID
```

Search active checkpoints first and retained histories as well. After cleanup,
use the history rather than expecting `suivi.md` to exist. A fresh session needs
only this skill, the identifier and the retained folder to retrieve the result.

A temporary `.cleanup.json` remains in the archive until cleanup finishes. On
interruption, inspect the archive and rerun `cleanup PIECE_ID`. Already deleted
files are allowed; changed survivors, unexpected new files, symlinks or damaged
retained media stop deletion. Inspect such conflicts and preserve new material;
do not rewrite the journal or force removal to bypass the refusal. Locks owned
by a dead process can be recovered; live or ambiguous locks must be respected.
After success the temporary journal disappears. A repeated cleanup is harmless.

The archive does not depend on today's renderer, current corpus or current
source URLs to verify its retained bytes. It records what was published and the
evidence available then; it does not certify historical truth or continued
availability of a social post.
