# Mandatory video publication kit

A complete scene-video delivery includes the clean MP4, a **1080 × 1920 PNG
cover**, and a **Markdown file containing the approved posts for the intended
networks**. `mobile-preview.png` is a 360px inspection image, not a cover.
This contract is shared by Codex and Claude; it does not change carousel delivery.

## Plan once, then execute

During `structure`, add a cover choice to the existing visual proposal: the scene,
the intended still moment, its legible short title (at most eight words), and its
purpose. Prefer an already supported title/map composition. Keep the focal subject
and title readable on a 320–430px phone and in a central feed crop; inspect the
actual target platform crop when available. Avoid mid-transition frames, small
subtitles used as a title, dense timelines and unsupported geographical claims.
Do not add another shot solely because a cover is needed when an existing one fits.

Prepare the French network-specific publication copy at the same time. Use the
canonical `structure` copy conventions for the selected networks: headings, body,
source line, real links and appropriate hashtags. Do not deliver narration, internal
working notes or `post.md` approval markers as the public post. Reuse the existing
approved `_legendes/<id>.md`; freeze an exact copy **inside the private project**
for the handoff. If missing, the planning worker prepares it and includes it in the
combined review. A draft's existence is not approval.

After voice alignment, record the cover's measured timestamp **relative to the
exported video**, including any excerpt offset, in `production-brief.md`. Review
this moment in the proof along with the film. Existing approval of the unchanged
composition and copy remains valid; do not reopen these decisions on export.
If no existing moment makes a readable cover, resolve that composition in the
visual plan before sealing it. The executor must not invent a new title or asset.

## Build after finalize

The release engine remains sealed. This companion command reads its successful
`delivery.json`, verifies the release file hashes, extracts the selected clean
frame using the existing ffmpeg/ffprobe installation and copies the approved
Markdown verbatim. It does not alter the video or its manifest, generate images,
purchase audio, grant approval or publish. No extra API service is needed.

```sh
node social/tools/production/publication-kit.mjs "$PROJECT" \
  --delivery video/release-01/delivery.json \
  --copy approved-publication-copy.md --at 2.4
```

The time above is an example, not a default. Use the measured approved time.
The constant-frame-rate release is sampled at the frame containing that instant;
the manifest records both requested and frame times. Paths
are relative to the private project. The command writes a new directory beside the
release; an existing directory is never overwritten. Use `--output` with a new
relative directory for a revised kit, keeping the original release unchanged.

| File                                                | Purpose                                                        |
| --------------------------------------------------- | -------------------------------------------------------------- |
| `video/release-01/video.mp4`                        | Sealed clean video                                             |
| `video/release-01/publication/thumbnail.png`        | Full-resolution cover from the approved frame                  |
| `video/release-01/publication/publication-copy.md`  | Exact approved network posts, ready to copy                    |
| `video/release-01/publication/publication-kit.json` | File hashes, source release/video identity and extraction time |

Subtitles, credits and other provenance files stay beside `video.mp4`. The cover
inherits the source frame's assets and licence obligations; retain the release's
`CREDITS.md`. Review the clean cover at phone size, its readability, crop and absence
of a proof badge, then record the real approval reference and exact hashes in
`delivery-handoff.json` as documented in [automatic routing](automatic-routing.md).
A technical extraction alone is not visual or editorial approval. Link the MP4,
cover, Markdown and credits explicitly in the final response.

## Library handoff and completion

For a registered subject, use the existing registration tool and real post ID.
Pass all three delivered files in the same registration, because `--video` replaces
the previous delivered set. Despite the option's historical name, the existing
`renderedFrom`/sync pipeline copies each named file, including PNG and Markdown:

```sh
node social/tools/library/register-post.mjs --id "$POST_ID" \
  --video "video.mp4=$PROJECT/video/release-01/video.mp4" \
  --video "thumbnail.png=$PROJECT/video/release-01/publication/thumbnail.png" \
  --video "publication-copy.md=$PROJECT/video/release-01/publication/publication-copy.md" \
  --write
```

Retain any other required registered outputs when supplying that set. Ensure the
registry's `copy` still points to the approved network copy through its supported
`--copy` option; never substitute the workshop's internal `post.md`. Run the normal
migration/index/sync workflow from `SCENE-RELEASE.md`, and compare all three delivered
file hashes at the actual library paths. The generated library `post.md` remains the
network overview; the separate Markdown is the exact portable approved copy.

An unregistered subject still receives the complete private kit; record its actual
unregistered status without inventing a category. A missing or changed cover, copy,
review reference, kit manifest or required library copy keeps progress at 95%.
**There is no social-copy or thumbnail exclusion that can produce 100%.**
Old completed records without this kit reopen at delivery and can be completed
without rerendering an unchanged valid release. The engine's `ready_to_publish`
flag certifies its existing release checks, not completion of this companion kit.
