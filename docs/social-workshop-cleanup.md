# Workshop cleanup after filing

The library is the product. Cleanup only reads its ledger and finished files. It
never moves, replaces or deletes a library file. The workshop retains one authored
decision record, `production-record.md`, **plus the replay and evidence dependencies
demonstrated below**. A Markdown-only workshop is not currently a valid replay input.

## Trigger and completion

`pret` is written before migration and copying. That write alone cannot authorize
deletion. The existing filing sequence therefore has a completion event:

```sh
node social/tools/library/register-post.mjs --id "$POST_ID" --workshop "$SUBJECT" --status pret --write
# Run the existing library migration, index and sync commands, then:
node social/tools/library/register-post.mjs --id "$POST_ID" --filed --write
```

`--filed` rereads the ledger and automatically invokes cleanup. It does not set a
status or perform migration. `produire` runs this completion event after both
carousel and video filing. A failed completion is reported, not silently skipped.
Without `--write` it is a simulation. Moving a folder in Finder is never a trigger.
After the operator records a real publication and the library files it, the same
event updates actual dates/channels and cleans any newly accumulated scratch.
Publication remains a human act; the tool cannot register `publie` itself.

All editions attached to a workshop subject must be filed or published. A shared
subject with an active adaptation is refused. `workshopSubject`, registered through
`--workshop`, supplies the explicit binding; existing `renderedFrom`, `copy` and
matching taxonomy folders also reveal associated editions. The record lists every
edition, including historical associations the ledger did not previously carry.

The state report adds a separate housekeeping column. A completed cleanup is not
another publication state. Missing records, unlinked workshops and changed work
remain visible. Help stays read-only and never treats a pending cleanup as consent
to purge the historical backlog.

## Phase 1 evidence and retention policy

Measured 2026-09-30: 69,842 files, 99,878,371,225 logical bytes (93.019 GiB),
109 subject directories plus shared/global material. Counts below exclude symlinks.
The larger inventory corrects the initial estimate of about 25 subjects.

| Class                                |  Files | Logical size | Post-publication reader and evidence                                                                      | Verdict                                                                                                                 |
| ------------------------------------ | -----: | -----------: | --------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Legacy numbered frame PNGs           | 53,533 |    85.677 GB | Montage encoder reads them during assembly; actual Duala replay generated 25 normal and 25 control frames | DELETE unless explicitly kept or referenced as evidence; retain replay inputs                                           |
| Workshop videos, proofs and releases |    119 |     3.911 GB | Progress, release validation, publication kit and library sync reread them                                | KEEP-SMALL-SUBSET: registered outputs, sealed packages, review evidence and unresolved only copies                      |
| Previews, covers, diagnostics        | 11,963 |     3.012 GB | Reviews and kits reference selected images; scene replay rebuilt ordinary previews                        | KEEP-SMALL-SUBSET: approved/referenced images and unmatched outputs; unidentified files stay protected                  |
| Sourced and transformed visuals      |    947 |     2.842 GB | Cards, scenes and covers need exact verified variants; re-fetch not proven                                | KEEP until exact source/author/licence/tier/crop and successful recovery are established                                |
| Shared assets                        |    115 |     1.425 GB | Multiple subjects read the same relief packs                                                              | KEEP; entirely outside this tool                                                                                        |
| Original/corrected/alternate takes   |    347 |     1.005 GB | Audio pacing and later recuts need the chosen performance                                                 | KEEP-SMALL-SUBSET: selected takes, splices and unresolved unique alternatives; no TTS reproduction claim                |
| Derived source/paused audio          |     86 |   959.422 MB | Audio pass writes them mechanically from the selected take                                                | DELETE only with the selected WAV, master and alignment present and no evidence reference; full audio replay not tested |
| Approved voice masters               |     54 |   598.647 MB | Montage, scene audio and hash-bound handoff require the original WAV                                      | KEEP-SMALL-SUBSET: current and separately approved cuts; library AAC does not reconstruct them                          |
| Geographic data and rasters          |     50 |   348.765 MB | Maps need authored geometry and selected relief inputs                                                    | KEEP-SMALL-SUBSET: manual geometry/source packs; unproven derivatives remain protected                                  |
| Global ideas/captions/references     |    414 |    74.253 MB | Skills and library index reread them                                                                      | KEEP; outside subject cleanup                                                                                           |
| Plans, editorial text, reviews       |  1,511 |    15.720 MB | Engines and progress read literal paths/hashes and approved text                                          | KEEP-SMALL-SUBSET: executable decks/plans, narration, sources, approvals and rationale                                  |
| Captions/transcription caches        |    466 |     4.677 MB | Generated captions can be rebuilt; approved sidecars and timing cannot be assumed disposable              | KEEP-SMALL-SUBSET: approved/manual sidecars and unproven caches                                                         |
| Logs and mechanical caches           |     50 |     2.191 MB | Runtime writes; no routine later reader, except explicit evidence                                         | DELETE work logs, ffconcat lists and pyc, unless referenced or explicitly kept                                          |
| Alignment and scene timing           |    100 |     1.095 MB | Replay and release validation use the approved clock                                                      | KEEP-SMALL-SUBSET: timing for retained editions                                                                         |
| Subject build/edit scripts           |     79 |   763.630 kB | Custom EDL, crop and montage decisions have no common replacement                                         | KEEP unresolved unique scripts                                                                                          |
| Downloaded source/licence documents  |      8 |   680.418 kB | Provenance and permission evidence may have no other copy                                                 | KEEP until exact archived evidence survives                                                                             |

The small scene replay failed without `work/narration.wav`. Restoring only that
master and `aligned-words.json` alongside approved text/plan/assets produced a
fully decoded 1080×1920, 25 fps, ten-second video with two scenes and 16 checks.
The legacy Duala sample regenerated frames/captions, but none of the 25 normal
frames matched historical pixels with today's engine. Scratch is reproducible
under the current renderer, not a pixel-exact historical archive. The filed reel
audio decoded from AAC differed in both length and hash from its approved WAV.

Of 86 eligible ledger editions (74 published, 12 ready), 81 had non-empty media
on the expected shelf. This is an existence check, not a claim that every delivery
is complete. Five had missing shelves or only Markdown/proofs. Mixed subjects and
unknown associations must not inherit another edition's readiness. The audit found
407 potential only copies among 443 voice/video/script files checked against
library copies, and 482 visual/geographic files without an explicit file-to-locator
association. This does not mean all 482 lack URLs in their prose source documents.

The executable allowlist is intentionally narrower than every conditional verdict:
numbered legacy frame sequences, mechanical work logs/caches and verified derived
audio. Other classes remain protected until their per-file dependency or selection
is resolved. Extension alone never makes a source image, video or take disposable.
This avoids erasing unidentified custom montages under a promise of regeneration.

## The decision record

`structure` creates the record in the subject root and carries over the angle and
cuts from `idee`. Later stages update it from actual decisions. It explains why;
it does not duplicate narration or card copy. Keep `cards.json` and `SOURCES.md`
as small operational inputs: the engine reads them, and approved identities hash
them. Folding them into Markdown would break replay and existing approvals.
The same applies to current plans, timing, source evidence and review documents.

Use this shape, replacing every placeholder before filing. Explicitly justify a
non-applicable review or voice choice. Never manufacture approval or a locator.
`keep` can name a subject-relative file or directory and always overrides deletion.
All source files remain kept even when the metadata is complete; it is recovery
documentation, not proof that re-fetch succeeded.

````markdown
# Production record

## Subject and angle

TODO: subject, question, narrative family, chosen angle and reason.

## Steps and decisions

TODO: ordered stages, choices, reasons, and links to retained inputs.

## Cuts

TODO: what was omitted or replaced and why.

## Sources

TODO: source tiers, archive locators, author, licence/attribution, exact file/crop.

## Reviews

TODO: message, myth, onomastics and contract verdicts with actual evidence paths.

## Voice choice

TODO: selected original/corrected take, splices, master, timing and choice rationale.

## Open points

TODO: unresolved choices, or an explicit statement that none remain.

```production-metadata
{
  "postIds": ["edition-id"],
  "keep": [],
  "sources": [
    {
      "file": "assets/chosen-image.jpg",
      "url": "https://example.org/exact-archive-record",
      "author": "TODO",
      "license": "TODO",
      "tier": 1,
      "variant": "TODO: exact original, dimensions and crop"
    }
  ]
}
```
````

Cleanup writes and rereads a verification receipt before the first unlink, then
marks the receipt complete only after deletion. It records real publication
occurrences from the ledger without inventing dates or channels. An interrupted
operation leaves a pending receipt; repeating the command checks everything again.
Run it only after rendering has finished. A changed candidate is refused before
unlinking; there is no cross-process render lock.

## Simulation and an explicit purge

```sh
node social/tools/library/cleanup-workshop.mjs --subject "$SUBJECT"
# Only after reviewing that subject's report and authorizing historical deletion:
node social/tools/library/cleanup-workshop.mjs --subject "$SUBJECT" --write
```

JSON output lists exact paths/bytes, blockers, source-locator gaps, retained totals
and potential only copies. `candidateBytes` is the allowlisted inventory;
`bytes`/`delete` are zero/empty when any precondition blocks cleanup. A missing
record is not silently synthesized. `--post <id>` may repeat for a legacy read-only
survey; deletion still requires those associations in the authored record.

No backlog command runs with `--write` as part of shipping this change. There is
no bulk purge switch. The library must be outside the workshop, no symlink is
traversed, shared/global directories and Git checkouts are refused, and all named
deliverables must be non-empty at their status-derived paths. Existing workshop
sync sources must match the delivered bytes. Unlisted carousel media are checked
for non-empty final output; editorial completeness remains the upstream review.

## Roads not taken

- Recursive deletion of `work/` would destroy masters, timing and custom edits.
- Inferring readiness from folder names or one MP4 would bypass the ledger and
  lose mixed-edition work. Status alone is insufficient before filing completes.
- Regenerating voice or downloading a vaguely matching image changes approved
  performance/provenance; no paid generation or asset re-fetch belongs in cleanup.
- A second archive/manifest system would duplicate the existing delivery seals.
  One authored Markdown record and a small allowlist keep the boundary reviewable.
- Shared relief data needs a separate policy: inventory consumers, retain a
  canonical checksummed source plus build recipe, prove recovery, then request
  operator approval for that shared cache. Subject cleanup never purges it.

Tests exercise public commands against temporary workshop/library fixtures and
remove them afterwards. They cover dry-run, repeatability, records that cannot be
written/reread, status/shelf/output failures, active editions, evidence overrides,
symlink escapes, unique inputs, shared assets and the filing/state hooks.
