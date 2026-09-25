# Reviewed scene-video delivery

Use the [production workflow](SCENE-PRODUCTION.md) and [execution prompt](templates/scene-execution-prompt.md).
The default scene render remains a watermarked proof. `finalize` delivers a clean publication
package after review of that exact proof. It never posts to a social network.

## One review, attached to one version

`render` generates `release-review.json` next to the proof. All judgments start pending.
The execution model completes it from actual review and existing operator decisions, not by
asking the operator to edit JSON. Reuse prior approval for unchanged speech, voice and composition.
Ask one consolidated question only for missing rights or substantive editorial choices.

The record contains:

- The handoff hash and proof path/hash. Modified inputs, a new baseline or a different proof
  invalidate it. Moving the project with unchanged relative paths is supported.
- `reviewer` and `approval_reference`: who reviewed the release and the real approval evidence.
- `intended_release`: exactly the plan's `excerpt` or `complete`. A demonstration excerpt is
  not silently reclassified as a complete episode. Review its standalone meaning and closing.
- `output_license`: the reviewed distribution licence/permission statement. Do not derive
  this from the basemap alone; include narration, voice rights and every incorporated asset.
- `checks`: `visual`, `listening`, `history`, `message`, `myth`, `voice_rights`,
  `license_compatibility`, `closing`. Each needs `status: "pass"` and concrete `evidence`.
  A myth review can pass because the piece explains rather than refutes, with that reason recorded.
- `assets`: every asset ID, its exact licence and credit, a passing status and evidence of identity
  and rights review. Retain the permission URL, account entitlement or private evidence reference.

`production-brief.md`, `SOURCES.md`, `message.md` and `mythe.md` must be present and fingerprinted.
Their existence does not mean they pass. A proof-only verdict must be updated to review the intended
release before preparing its release baseline. Never fabricate a verdict to satisfy the command.

The tool validates attestations and technical identity; it cannot authenticate a human signature,
listen, research historical claims or decide legal compatibility. These are preparation/review tasks.
Automatic audio-stream detection is not the `listening` check.

## Final command

```sh
"$PYTHON" social/harness/ethni_scene_pipeline.py finalize "$PROJECT" \
  --plan "$PROJECT/scene-plan.json" --lock "$PROJECT/work/scene-handoff.json" \
  --review "$PROJECT/_epreuves/replay-01/release-review.json" \
  --output "$PROJECT/video/release-01"
```

The destination must be new, outside `_epreuves` and outside a source checkout. A failed review
or encode never leaves a folder that looks like a completed delivery. Existing versions and
proofs are preserved. Choose a new version for another export, not an overwrite switch.

The only visual change is removal of the diagonal proof badge. Branding, camera, subtitles,
progress, source credits and uncertainty qualifiers stay. Audio is cut from the same recording
with the same timings; it is not generated or retimed again. The command rechecks input identity
and review at the end, and fully decodes the H.264/AAC 1080×1920, 25 fps output.

## Delivery contents

| File                  | Purpose                                                                                 |
| --------------------- | --------------------------------------------------------------------------------------- |
| `video.mp4`           | Clean video, with existing burned-in captions and narration                             |
| `captions.srt`        | Optional subtitle sidecar; avoid displaying duplicate captions on the platform          |
| `narration.fr.txt`    | Exact spoken excerpt                                                                    |
| `CREDITS.md`          | Asset credits, licences, sources, voice-rights evidence and release scope               |
| `mobile-preview.png`  | 360px clean preview; inspect the video too                                              |
| `release-review.json` | The reviewed version and evidence                                                       |
| `delivery.json`       | File hashes, codec/duration/full-decode results, ready-to-publish flag, published=false |

`ready_to_publish` means the recorded review and technical checks passed. It is not a legal
certification or a claim that the platform has accepted or published the file.

## Complete publication kit

The table above lists the sealed engine export. A complete production also requires
`publication/thumbnail.png` (1080 × 1920), `publication/publication-copy.md` and their
`publication-kit.json`. The copy contains approved posts for the selected networks;
the thumbnail uses the approved clean frame, not `mobile-preview.png`.
Follow the [mandatory publication kit procedure](../../.claude/skills/ethniafrica-production/references/publication-delivery.md)
for extraction, mobile inspection and version-bound review. Do not edit the engine
manifest to add these companion files. The coordinator cannot report 100% without
the kit and required library copies, even when engine finalization has passed.

## Library handoff

For a registered post, the production skill continues with the existing registry, after a
successful finalization. Resolve the real post ID and library paths; never invent a category:

```sh
node social/tools/library/register-post.mjs --where <id>
node social/tools/library/register-post.mjs --id <id> \
  --video video.mp4=<project>/video/<version>/video.mp4 \
  --video thumbnail.png=<project>/video/<version>/publication/thumbnail.png \
  --video publication-copy.md=<project>/video/<version>/publication/publication-copy.md --write
node social/tools/library/register-post.mjs --id <id> --status pret --write
node <00-Index>/migrate-library.mjs --write
node <00-Index>/build-index.mjs
node <00-Index>/sync-deliverables.mjs --write
```

Verify the library's `video/` contains all three delivered files with matching hashes.
Retain any other required outputs when registering this replacement set, and ensure
the registry's `copy` references the approved network copy. Keep the complete
workshop delivery package as provenance. Update an existing production ledger's supported
network/format entries with neither URL nor publication date, then run
`npm run check:production-ledger` and rebuild the pipeline state as described in `produire`.
An unregistered thematic post can receive its reviewed private delivery without a fictional
ledger entry; report library registration separately. Social copy and links come from the
approved brief/copy file; the renderer does not invent them. Actual publishing stays with the operator.
