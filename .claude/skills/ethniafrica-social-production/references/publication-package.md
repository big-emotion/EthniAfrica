# Publication package

Roadmap step 6 assembles approved final renders and agent-written adaptations.
A card carousel and a vertical video share this package; see
[Video pieces](#video-pieces) for what differs.
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
   An unavailable destination link is `none`, with copy rewritten accordingly. Image source and license URLs already present in the reviewed image records or their rights evidence remain valid credit references, even with `none`; they are not website destination promises. Other URLs are refused unless they are this network's tagged link: the verified destination followed by its [campaign tags](#campaign-tags). A Facebook
   first-comment route includes the exact tagged URL in that comment. A profile
   route requires evidence that the usable profile link actually reaches the
   verified destination, and that link carries the same tags with
   `utm_content=bio`.
5. Save `package-input.json` in the piece folder, with the piece's `campaign`.
   Create a new delivery revision:

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
| `campaign`               | Required for a new revision: the `campaign` of the piece's entry in `docs/productions/`, or a series piece's code `<series>-<episode>`. Lowercase letters, digits and single hyphens only.                                                                                                                         |
| `networks`               | Exactly one adaptation per selected network, with no omitted or extra target.                                                                                                                                                                                                                                      |
| Adaptation               | `network`, nonempty `caption`, explicit `firstComment` string or null, `link`, `capability`; TikTok also requires `captionPreference`. Optional `alternativeText` is a complete array of `{file, text}` entries, one per exported image.                                                                           |
| `link`                   | `placement`: `none`, `profile`, `first-comment` or `caption`; every non-none route needs `url`, the verified destination with this network's [campaign tags](#campaign-tags).                                                                                                                                      |
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

## Campaign tags

Every link a new revision delivers is the verified destination followed by
these four parameters, in this order, after `?` (or `&` when the destination
already has a query):

```text
utm_source=<network>&utm_medium=social&utm_campaign=<campaign>&utm_content=<content>
```

`<network>` is the adaptation's network and `<campaign>` the package's
`campaign`. `<content>` names what carries the link: `carrousel` or `video`
for a link in the post itself (Facebook first comment, YouTube or X caption),
`bio` for a profile link. A profile link stays in place after the post, so its
visits are kept apart from the post's. The Facebook first comment of a Lingala
carousel in campaign `langue-07`, whose destination is the answer for
« lingala » at its [name address](#name-addresses), is therefore:

```text
https://ethniafrica.com/fr/atlas/recherche/lingala?utm_source=facebook&utm_medium=social&utm_campaign=langue-07&utm_content=carrousel
```

The helper refuses a bare destination and a link tagged for another network,
campaign or format, and its error prints the expected link. The research
dossier keeps the bare destination; the tags belong to each adaptation. A
verified destination that already carries `utm_` parameters or a `#fragment`
is refused too: the tags would be doubled, or would land after the fragment,
where Plausible never reads them.

**Why.** Plausible credits a visit to a post only through these parameters.
The audience audit of 2026-10-13 found that no post published since 1 October
appeared as a campaign (`docs/audience/audit-2026-10-13.md`). The scheme is
the one the retired link builder used, so older and newer campaigns read alike
in the same report.

**Revisions without a campaign.** A revision delivered before this rule has no
`campaign` and keeps its bare link. `verify` still accepts it, so a piece paused
at a checkpoint does not reopen; its next revision needs a campaign.

**Limits.** In this workflow a link travels with the post only in a Facebook
first comment or a YouTube or X caption; Instagram and TikTok rely on the
profile link. A profile link is shared by every post while it stays in place,
so its visits go to the campaign it was tagged with. Plausible loads
only after a reader accepts analytics, so campaign counts are a floor.

Instagram adds tags of its own to visits from its profile link: the audit of
2026-10-13 counts 35 visitors under `utm_source=ig` and 35 under
`utm_content=link_in_bio`, tags no package writes
(`docs/audience/audit-2026-10-13.md`, campaigns line). Instagram profile visits
may therefore show under `ig`/`link_in_bio` rather than this package's
`instagram`/`bio`. A profile link tagged per piece also goes against the series
rule that "the profile link stays fixed on the search page"
(`docs/editorial/strategy/social-series.md`); the operator settles that before
a series piece uses `profile`.

### Name addresses

A piece about a name sends the reader to that name's address,
`https://ethniafrica.com/fr/atlas/recherche/<nom>`, never to the search page
with `?q=<nom>`. `<nom>` is the name as the corpus spells it, accents kept,
in lower case: `lingala`, `traor%C3%A9` (« traoré »). The research step
verifies it (see
[research and corpus](research-and-corpus.md#dossier-format)): the address
is accepted only when the sitemap lists it or it answers 200. A 404 means the
name has no address; a 308 means another spelling, so record the address it
leads to.

`create` refuses an EthniAfrica destination on the search page with `?q=`,
and a name address written in another case or composition, which answers with
a redirect. Its error prints the address to verify. It cannot see a missing
accent (`traore` answers 308 towards `traoré`): the sitemap or the 200 answer
settles that.

**Why.** Since v5.6.0 (2026-10-17) each name the corpus answers has its own
page (REQ-200). The server writes the answer into it and the sitemap lists it.
The `?q=` reading is built in the reader's browser and declares the bare search
page as its canonical. The audits of 2026-10-08 and 2026-10-13 count all these
readings as one page, `/fr/atlas/recherche`, so a campaign's landing page did
not say which name the reader came for.

**Revisions delivered before this rule.** A revision created with a `?q=`
destination still passes `verify`, so its publication can be recorded and a
piece paused at approval 3 is not reopened by this rule alone. Its next
revision needs the name address.

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

A video revision holds `video.mp4` instead of the PNG cards: a byte-identical
copy of the checked export. It can also hold `cover.png`. Its `post.md` adds
the duration, the accessibility routes and the complete on-screen text, and its
`public-copy.json` lists that text under `screen`.

`post.md` is the operator-facing document. The other text files support checks;
they are not additional documents for the operator to complete. Captions and
comments are reproduced exactly; edit the input and generate a new revision
instead of hand-editing the generated post.

## Video pieces

A vertical video from `social/video` goes through approval 3 the same way: same
command, same networks, link rules, research dossier, strict language check,
staging and integrity manifest. Only the media checks and the account route
differ. The operator decided this on 13 October 2026.

```json
{
  "schema": 1,
  "kind": "video",
  "sequence": "PIECE/video/sequence.json",
  "video": "PIECE/video/final-v1",
  "design": "PIECE/video/design-version.json",
  "cover": { "frame": 210 },
  "research": "PIECE/research.json",
  "networks": [
    {
      "network": "instagram",
      "caption": "…",
      "firstComment": null,
      "link": { "placement": "none" },
      "capability": {
        "account": "…",
        "checkedAt": "2026-10-13",
        "observation": "…",
        "evidence": "PIECE/accounts/instagram.png",
        "format": "video",
        "maxDurationSeconds": 90,
        "aspect": "9:16",
        "captionMax": 2200,
        "altRoute": "unavailable",
        "autoCaptions": "available",
        "altInstruction": "…",
        "linkPlacements": ["none"]
      }
    }
  ]
}
```

| Field      | Meaning                                                                                                                                                                                              |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `kind`     | `"video"`. Left out, the package is a card carousel as above.                                                                                                                                        |
| `sequence` | The sequence file the video was encoded from. Its areas, outline and voice resolve from its own folder, as `encodeVideo` resolved them.                                                              |
| `video`    | The folder `encodeVideo` wrote: `video.mp4` and `manifest.json`.                                                                                                                                     |
| `design`   | The accepted video design record, `{ name, version, status: "accepted" }`. The sequence's `design` must read `name version`, for example `EthniAfrica Vidéo carte 0.4.0-proposition`.                |
| `cover`    | Optional. `{ frame }` delivers `cover.png`, that frame of the video, for networks whose upload asks for a cover.                                                                                     |
| Capability | `format: "video"`, positive `maxDurationSeconds`, `aspect` such as `"9:16"`, `captionMax`, `commentMax` when a first comment exists, `altRoute`, `altInstruction`, `autoCaptions`, `linkPlacements`. |

There is no `voice` field: the sequence already names its audio and words
file, and a second declaration could disagree with the one the video was
encoded from. The helper fingerprints both files through the sequence.

**Why these refusals.** A demo sequence, a demo manifest or an excerpt
(`range`) is a proof, never a delivery. The sequence loader already refuses a
mockup area or a synthetic outline outside a demo, so the package loads the
sequence instead of re-implementing that rule. The manifest binds the export
to its inputs: the helper requires the manifest's video hash to match
`video.mp4`, its sequence hash to match the loaded sequence, its audio hash to
match the voice, and its frame count to match the sequence. FFprobe then
confirms the file itself: size, frame count, frame rate and an audio track
exactly when the sequence is voiced. `productionReady` stays false in every
video manifest. It records mechanical export only, so the package does not
read it; the three approvals still decide.

`encodeVideo` hashes the loaded sequence, whose voice paths are absolute. A
piece moved to another folder or checkout after encoding needs a new encode
before packaging. This is deliberate: the package proves that this exact
sequence produced this exact file.

**Accessibility.** Subtitles are burned into the video, so every reader sees
them without a platform feature. `public-copy.json` holds the whole on-screen
text in screen order: title, each chapter's line, map names, legend, the
Carte, Période and Source lines, every subtitle chunk, intro, outro and the
ending sentence. The strict check reads that file. The sequence file itself is
not checked, because it also holds coordinates, sources and file names. The
fixed brand slogan of the closing block is design, not piece copy. For each
network, record whether the platform offers a description field
(`altRoute`) and automatic captions (`autoCaptions`). Write the operator's
instruction in `altInstruction`, for example not to add automatic captions over
the burned-in ones. With `native` or `description`, the adaptation supplies
`alternativeText: [{ "file": "video.mp4", "text": "…" }]`; with `unavailable`,
none is required.

**Links.** The rules do not change with the format. Each placement must
appear in the account's verified `linkPlacements`. Instagram, Facebook and
TikTok never rely on a clickable caption link, and only Facebook takes a
first-comment link. A YouTube description link is accepted only when its
capability lists `caption`. Record that placement only when the evidence shows
the description link is clickable for that video format. A Short may differ
from a long video, so the account route decides, not the network name.

### Series videos (Cartes)

A sequence with `beats` is a series video drawn on the accepted Cartes design
by `social/video/series-render.mjs`; the same package takes it, loaded by
`loadSeriesVideo` instead of the map loader. The record in `design` reads
`EthniAfrica Cartes` and the version of `social/design-system/version.json`,
since the loader refuses cards of any other version. The input also names
`assets`, the folder the research dossier's image records sit under: every
image a card or a chapter card shows needs its research and rights record
there, as a carousel card does. The manifest binds the same things as above
plus the cards: the cards JSON is copy and layout, and the sequence only names
it. `encodeSeriesVideo` records the sequence hash before drawing; an export
made before it recorded one is re-encoded.

The on-screen text of a series video is every string its cards print, read
from the loaded cards (chapter cards and the chapter kicker included), each
subtitle chunk, and on the closing card the signature line and the search
invitation, which the card prints while the voice says them. Image fields,
identifiers, map file names and `say` are left out. Credits list each card's
source line, its map caption's source and its image credit.

**What remains manual.** The helper does not judge the rights to the satellite
imagery or to a voice. The on-screen Source line names the imagery, and the
dossier keeps its reuse record. Watch the delivered `video.mp4` with sound at
phone size before approval 3. A cover is extracted from the video again at
each verification, so a retouched cover cannot pass; choose another frame
instead.

## Changes and recovery

Adding a network uses the existing `networks` event first. Preserve the angle and
proof, write the missing adaptation and create a new package covering the updated
targets. A caption or link correction similarly reopens final review. A meaning,
source, rights or substantive image change returns to the affected earlier stage.

Verification refuses changed/missing/reordered media, stale rendering dependencies,
changed text, evidence, an incomplete file list, an unverified destination or
mismatched networks. The helper does not silently truncate descriptions or copy. Network-specific descriptions are supplied explicitly, checked against that network’s limit, included in the exact public-copy check and fingerprinted with the input. The original full descriptions remain available with the card text; review shortened versions for meaning and uncertainty.
Legacy final approvals without a verified package reopen delivery on recovery.

A new revision is assembled under a lock and staging directory, checked completely
and exposed by one rename. Existing output is never overwritten. Ordinary failure
removes staging and the lock. After abrupt shutdown, inspect leftover lock/staging
folders and confirm no writer is active before removing them. Cleanup and durable
publication history remain roadmap step 7.
