# Reusable scene-video production

Start here for a new video or a handoff to another session. The [feature catalogue](SCENE-CATALOGUE.md)
explains the available visual elements; [three storyboards](templates/scene-storyboards.md)
explain how to combine them. The [technical contract](SCENES.md) defines exact fields and limits.

## What is reproducible

A **filled scene plan + approved recording + alignment + licensed assets + pinned renderer**
can be rendered by another session without creative decisions. No model runs inside the renderer.
A script and voice alone do not specify camera framing, historical geometry, images, context or
reading time. The planning model must still provide those choices for a new subject.

The new handoff command checks content hashes, renderer inputs, runtime and sampled raw pixels.
It is deliberately strict: a changed font, alignment or engine stops replay. It cannot certify
historical accuracy, attractive pacing or byte-identical MP4 files on every operating system.
A different machine must recreate the recorded runtime or establish a reviewed new baseline.
A lighter model can execute the command; its ability to design a new episode equally well has
not been demonstrated by this technical test.

## Session setup and older proofs

For one coordinator across the whole video workflow, use
[ethniafrica-production](../../.claude/skills/ethniafrica-production/SKILL.md).
It resumes existing work, presents the visual plan for approval before rendering
or paid audio, then coordinates `structure` and `produire` through clean delivery.
Its [state template](../../.claude/skills/ethniafrica-production/templates/production-state.md)
keeps decisions and approval evidence in the private subject directory across sessions.
This is separate from carousel production and does not publish or schedule.

In a session already holding the narrative, invoke `$ethniafrica-production` in
Codex or `/ethniafrica-production` in Claude and ask it to continue that subject.
Using the skill in the current session preserves access to the conversation.
Native agent definitions also exist for
[Codex](../../.codex/agents/ethniafrica-production.toml) and
[Claude](../../.claude/agents/ethniafrica-production.md); both load the same canonical
skill. The coordinator inherits the selected session model and automatically delegates
bounded milestones using the [shared routing policy](../../.claude/skills/ethniafrica-production/references/automatic-routing.md):
Sol/Opus for preparation and review, Luna/Sonnet for execution. Each handoff announces
the stage, weighted completion percentage, requested model and host-confirmed model
when available. This does not change the parent conversation's model.
Claude can start a dedicated main session with
`claude --agent ethniafrica-production` from this checkout. If invoking a native
subagent, supply the subject directory and real approval evidence explicitly;
do not assume it inherits the parent conversation. No background job is created.

Claude reads the versioned `.claude/skills/` entry points. For Codex, run
`npm run skills:link` in the checkout, then `npm run check:skill-parity -- --require-mirror`.
The coordinator and both scene skills are provisioned and checked alongside the curator skill. A session that
already loaded an older skill should reload it before continuing. Work on the new PR branch
until it is merged; a push does not update another checkout automatically.
Restart a session if new agent definitions or skill names do not appear. As an immediate
fallback, ask the current session to read the canonical skill file explicitly. A model
without filesystem/tool access can discuss a plan but cannot run the local renderer.

The replay check in this change covers the latest composed chronology. Earlier proofs need
their own plan, recording, assets and original engine version. The original map POC uses the
legacy `ethni_montage.py <subject> --map-proof <storyboard.json>` route, not a scene plan.
Do not convert that JSON into a scene plan by renaming fields or promise pixel equality after
an engine upgrade. Archive its renderer report/commit and use its original entry point.

## Four responsibilities

| Owner           | Supplies                                                                                                           | Must not substitute                                                       |
| --------------- | ------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------- |
| Planning model  | Audience, question, evidence, complete script, visual storyboard, source/asset choices, timings and filled plan    | An invented kingdom outline or unsupported migration                      |
| Execution model | Resolves supplied paths, checks the package, runs preparation/export, inspects results, reports failures           | Rewrites to the script, new sources, new composition, edits to the engine |
| Engine          | Input validation, time-based composition, captions, proof and reviewed clean export, fingerprints and media checks | Editorial judgment or publication approval                                |
| Operator        | Text and voice approval, meaningful visual choices, final review and publication                                   | Repeated technical confirmations already covered by the request           |

## One production package

Use one private workshop directory per video. Keep large media and local absolute paths outside Git.
Copy the [production brief](templates/scene-production-brief.md) and complete it rather than
asking the execution model to infer missing decisions.

```text
<subject>/
  production-state.md      resumable tasks, artifact versions and actual approval evidence
  production-brief.md       audience, format, approved intentions, allowed adjustments
  narration.fr.txt          full approved speech, unchanged by rendering
  post.md                  genuine existing text-approval record
  SOURCES.md               claims, image identity, licensing, geometry provenance
  message.md               editorial review of this composition
  mythe.md                 myth review; an explanatory piece may say “explique”
  scene-plan.json           filled executable composition, not a placeholder
  assets/                  licensed images and GeoJSON, relative paths
  work/
    narration.wav          completed approved recording
    aligned-words.json     words and timings for that exact recording
    scene-handoff.json     technical baseline generated after preparation
  _epreuves/<version>/      proof, reports and release-review.json
  video/<version>/         reviewed clean MP4, subtitles, credits and delivery manifest
```

The source record stores hashes and ordered whole-paragraph audio cuts. `cards.json` and
`cartes.json` are optional for scene-only videos. Editing a carousel does not invalidate a scene-video handoff. Preserve file timestamps when transferring a package; never touch the
approval marker merely to bypass a stale-approval error. Keep the plan at the package root.

## From idea to export

| Stage                | Input and work                                                                                                    | Concrete output / exit condition                                                         |
| -------------------- | ----------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| 1. Audience and idea | Read the existing audience/idea work; choose one question and the intended audience                               | A sourced subject report, not a manufactured corpus entry                                |
| 2. Structure         | Choose one storyboard. Write the full narrative and the on-screen optional context. Explain each proposed shot    | Completed brief and script; distinguish spoken text from silent context                  |
| 3. Text approval     | Show the entire script and relevant visible copy to the operator; apply existing approval                         | Genuine `post.md` approval. Reuse authorization already given for unchanged text         |
| 4. Voice             | Reuse an approved recording or prepare it through the existing voice workflow; finish alignment before proceeding | Recording, measured words and pronunciation check. The scene command never calls TTS     |
| 5. Visual assembly   | Bind cues to measured words; choose assets/camera, source historical overlays, assign scene types and transitions | A filled plan, matching source hashes, source register, complete assets                  |
| 6. Preparation       | Validate and produce cue previews; review mobile reading, paths and uncertainty; finish message/myth review       | Named handoff lock and visual package ready for execution                                |
| 7. Execution         | One command verifies the package, compares sampled frames, exports and fully decodes the MP4                      | Proof, cue previews, `render-report.json`, `execution-report.json`                       |
| 8. Release review    | Watch/listen, confirm visual meaning and final delivery suitability                                               | Complete the version-bound review from real evidence and existing operator decisions     |
| 9. Final delivery    | Run `finalize`, then deliver through the registry for an existing registered post                                 | Clean video, subtitle file, credits and hashed delivery report; no automatic publication |

Text and voice approval do not approve unseen historical polygons. Bundle the visual proposal
with the text review where possible, so later execution does not require a new design conversation.
Routine path resolution and reruns are not new approval points. Ask only for an unresolved
editorial choice, a missing input or a material deviation outside the brief.

## Commands

From the repository root, use the harness environment installed with
`social/harness/requirements.txt`. Set `PYTHON` to its interpreter and `PROJECT` to the private
subject folder. Paths are quoted so spaces are safe. No API credentials are needed to render.

```sh
PYTHON="social/harness/venv/bin/python"
PROJECT="<private-subject-directory>"

# Planning/preparation: create a technical baseline and 360px previews at every checked cue.
"$PYTHON" social/harness/ethni_scene_pipeline.py prepare "$PROJECT" \
  --plan "$PROJECT/scene-plan.json" --lock "$PROJECT/work/scene-handoff.json" \
  --output "$PROJECT/_epreuves/preparation"

# Execution: verify, export, inspect media streams and decode the entire result.
"$PYTHON" social/harness/ethni_scene_pipeline.py render "$PROJECT" \
  --plan "$PROJECT/scene-plan.json" --lock "$PROJECT/work/scene-handoff.json" \
  --output "$PROJECT/_epreuves/replay-01"

# Read-only replay check: identical inputs/runtime and sampled pixels, no video encoding.
"$PYTHON" social/harness/ethni_scene_pipeline.py verify "$PROJECT" \
  --plan "$PROJECT/scene-plan.json" --lock "$PROJECT/work/scene-handoff.json" \
  --output "$PROJECT/_epreuves/replay-01"
```

`--output` changes the proof destination without changing the visual plan. A lock is a technical
baseline, **not an approval signature**. Preparing twice is idempotent only when identity and
sample hashes still match. A changed package requires review and a new named lock; do not delete
or overwrite the previous baseline to make replay green. The command does not generate voice,
fetch media, repair source facts, declare an audit passed or publish anything.

The actual output is `video-scenes-epreuve.mp4`. Successful execution verifies H.264/AAC,
1080×1920, 25 fps, audio/video duration, complete decoding and sampled pre-encoding pixels.
Absence of an exception is not proof that every label is visible: the map deliberately omits
labels that fall outside the viewport. Inspect cue previews and transitions, including the
smallest intended viewing size (320–430px wide).

## Three different kinds of change

- **Replay:** keep every input, plan and runtime; choose a new output folder. The execution model needs no creative interpretation.
- **New subject using a storyboard:** planning still supplies evidence, assets, exact speech and geographic geometry. Reuse the composition vocabulary and workflow; create a new plan and lock.
- **New visual capability:** stop the production handoff at that limitation. Change the engine separately with tests, review the new rendering and establish a new baseline.

## Readiness audit and remaining work

| Finding before this handoff                                                 | Resolution / remaining boundary                                                                                                   |
| --------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| PR #1335 was merged before the timeline-composition commit                  | The follow-up branch includes that missing commit as well as this package                                                         |
| Skills knew the scene entry point but continued into deck-only requirements | Explicit scene routing and linked preparation/execution contract                                                                  |
| Templates were largely placeholder text scenes                              | Three visual storyboards now map editorial beats to reusable scene types; JSON starters remain intentionally invalid until filled |
| One scene midpoint could miss all but one timeline state                    | Cue preview index and fingerprint comparison cover preflight event/camera/feature samples                                         |
| Rendering required remembering several separate checks                      | One execution command verifies inputs, renders and checks the media                                                               |
| A narration alone could be mistaken for a reproducible montage              | The brief and execution prompt require a filled plan and assets                                                                   |
| Scene render originally created only watermarked proofs                     | `finalize` now delivers a clean package after version-bound review; see [release workflow](SCENE-RELEASE.md)                      |
| Voice synthesis and external alignment                                      | Still upstream; reuse the recording. Provider cost and pronunciation remain outside the render command                            |
| Audio mixing and video clips                                                | No music/SFX mixing or clip scene yet; only the supplied narration track                                                          |
| Historical maps and migration geometry                                      | Still authored and sourced; never reconstructed automatically from a script                                                       |
| Smaller-model quality                                                       | Command execution is deterministic; a second subject authored by a smaller model remains a separate practical trial               |

For immediate operation, fill the brief and plan once per subject, then use the
[execution prompt](templates/scene-execution-prompt.md). Continue through the [release workflow](SCENE-RELEASE.md) for a clean deliverable.
Preparation supplies editorial and rights decisions once; execution prepares the
publication package and the skill handles an existing library registration. Actual posting remains manual.

## Current video timing doctrine

Narration organizes ideas; paragraphs do not prescribe cuts. A scene lasts as long as explanation
and reading comfort require. A map can span several sentences while camera, regions, points,
routes and dates evolve. A new scene should clarify a change of place, period, evidence or idea.
Carousel layouts and cadence are independent. The old image-deck montage is retained only to
reproduce archived work, not as the default for a new video.
