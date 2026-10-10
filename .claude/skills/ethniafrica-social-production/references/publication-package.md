# Publication package

Roadmap step 6 assembles approved final renders and agent-written adaptations.
It uses the accepted card renderer, the [research dossier](research-and-corpus.md)
and the existing strict plain-language checker. It never posts, schedules or
changes an account. The operator still gives approval 3 for the exact delivery.

## Preparation sequence

1. Recover the selected networks and current approval 2 from the checkpoint.
   Finish the final render and inspect its images on mobile first, then tablet
   and desktop. Keep one chosen theme and the approved meaning. A successful
   package check does not replace this inspection.
2. Verify the actual account's current image-upload route, card count, caption,
   comment and accessibility limits. Record the account, date, observation and
   evidence inside the piece. Use current account UI or authoritative platform
   information where applicable; do not inherit assumed limits from this guide.
   YouTube or X is included only when selected and a suitable image route is
   actually verified. No Stories or pinned-comment dependency is generated.
3. Write each network's exact caption and optional first comment in French.
   Instagram/Facebook can share the same suitable caption; supply the same text
   for both when intended. The tool never silently copies it to another network.
   Read existing operator preferences before asking again. For TikTok, record the
   agreed concise-caption preference or obtain it if still missing; do not invent
   an operator decision to satisfy the input.
4. Set the link route to match the researched destination and the verified account.
   An unavailable link is `none`, with copy rewritten accordingly. A Facebook
   first-comment route includes the exact URL in that comment. A profile route
   requires evidence that the usable profile link actually reaches the verified
   destination. It is not automatically a per-publication tracking link.
5. Save `package-input.json` in the piece folder. Create a new delivery revision:

   ```sh
   npm run social:package -- create PIECE/package-input.json PIECE/delivery-v1 instagram facebook
   npm run social:package -- verify PIECE/delivery-v1 instagram facebook
   ```

6. Review `post.md` with the exact images. The generator runs strict publication
   checks on the source cards, renderer report and exact delivery copy. Inspect
   warnings and meaning, sources, credits and account instructions. These checks
   do not certify comprehension, rights or FALC compliance.
7. Present the complete package at approval 3. Supply `packageDir` in the review
   event, with the current checkpoint revision, `gate: 3`, review summary and
   nonempty `files`. Include `post.md` in that list. The helper verifies the whole
   package and automatically fingerprints the images, documents, configuration,
   source render, research and account evidence. It verifies again on approval.
8. Deliver the approved revision. Actual posting remains an explicit separate
   action. Record publication outcomes through the existing checkpoint event.

## Input contract

All paths are canonical project-relative paths. Inputs and output revisions stay
inside the existing piece folder; shared design/fonts/assets remain shared. The
renderer and package helpers must run from the installed project with its Node,
Playwright and Vale dependencies. No new rendering framework is installed.

| Field                    | Meaning                                                                                                                                                                                                                                                                                                            |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `schema`                 | `1`.                                                                                                                                                                                                                                                                                                               |
| `input`, `render`        | The exact card JSON and final renderer output directory. Proof/diagnostic media are refused.                                                                                                                                                                                                                       |
| `design`, `assets`       | The same design and asset directories used for rendering.                                                                                                                                                                                                                                                          |
| `research`               | The dossier approved at gate 2. It must pass delivery checks. Every rendered photograph/document/inset must have a matching `images[].file` and rights record. Shared brand provenance remains an agent review responsibility.                                                                                     |
| `networks`               | Exactly one adaptation per selected network, with no omitted or extra target.                                                                                                                                                                                                                                      |
| Adaptation               | `network`, nonempty `caption`, explicit `firstComment` string or null, `link`, `capability`; TikTok also requires `captionPreference`.                                                                                                                                                                             |
| `link`                   | `placement`: `none`, `profile`, `first-comment` or `caption`; all non-none routes need the exact verified destination `url`.                                                                                                                                                                                       |
| `capability`             | `account`, `checkedAt`, `observation`, local `evidence`, `format: "photo-carousel"`, positive `maxCards`, `captionMax`; `commentMax` when a first comment exists.                                                                                                                                                  |
| Accessibility capability | `altRoute`: `native`, `description` or `unavailable`; `altInstruction` for the operator. Native insertion requires `altMax`. Description insertion requires every exact image description already in the caption. Unavailable insertion retains descriptions and the verified limitation in the delivery document. |
| Link capability          | `linkPlacements`: verified supported routes. This workflow allows first-comment links only for Facebook and does not rely on clickable caption links on Instagram, Facebook or TikTok.                                                                                                                             |
| TikTok preference        | `{maxLength, evidence}`: the operator's recorded caption preference, distinct from the platform limit.                                                                                                                                                                                                             |

Lengths are counted in Unicode code points. Verify how the publishing interface
counts its limits and review its final preview; the helper cannot establish
platform support from a field declaration. It also cannot detect every misleading
bio-link promise in natural language. The agent must reconcile the copy with the
selected route and the source evidence.

The executable [package tests](../scripts/package.test.mjs) use synthetic account
capabilities and decisions; their values are not platform limits or approved
operator preferences.

## Delivered files

Each revision contains:

- `01.png` through `NN.png`: byte-identical copies of the checked final render,
  in reading order, ready to select for upload.
- `post.md`: media order; per-network **Légende**, **Premier commentaire** (or
  “Aucun”), **Placement du lien**, and accessibility instructions/descriptions;
  card credits, complete source locators and image reuse references. Private
  source passages and research notes are not copied into captions.
- `public-copy.json`: the exact public text used by the language check, including
  rendered card text, captions, comments, image descriptions and additional credits.
- `editorial-check.txt`: the strict checker output, including review warnings.
- `package.json`: the integrity manifest used for resumption and final approval.

`post.md` is the operator-facing document. The other text files support checks;
they are not additional documents for the operator to complete. Captions and
comments are reproduced exactly; edit the input and generate a new revision
instead of hand-editing the generated post.

## Changes and recovery

Adding a network uses the existing `networks` event first. Preserve the angle and
proof, write the missing adaptation and create a new package covering the updated
targets. A caption or link correction similarly reopens final review. A meaning,
source, rights or substantive image change returns to the affected earlier stage.

Verification refuses changed/missing/reordered media, stale rendering dependencies,
changed text, evidence, an incomplete file list, an unverified destination or
mismatched networks. The helper does not silently truncate descriptions or copy.
Legacy final approvals without a verified package reopen delivery on recovery.

A new revision is assembled under a lock and staging directory, checked completely
and exposed by one rename. Existing output is never overwritten. Ordinary failure
removes staging and the lock. After abrupt shutdown, inspect leftover lock/staging
folders and confirm no writer is active before removing them. Cleanup and durable
publication history remain roadmap step 7.
