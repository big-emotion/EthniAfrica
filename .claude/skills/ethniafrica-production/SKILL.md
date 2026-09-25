---
name: ethniafrica-production
description: Coordinate an EthniAfrica scene video from an existing idea, narration or production package through visual-plan approval, voice, rendering and reviewed delivery. Use to continue a video across sessions without manually chaining structure and produire. Keeps carousel production separate; does not publish or schedule.
---

# EthniAfrica video production coordinator

Coordinate the existing skills and engine in the current session. Communicate in
French; write technical documentation in English and preserve French narration.
The operator owns editorial approvals, the planning model prepares the composition,
the execution model follows it, and the engine renders it. Do not hardcode a model
or delegate work automatically. This skill is shared by Codex and Claude.

## 1. Load the project and recover the work

Read `AGENTS.md` and `CLAUDE.md`. Use the EthniAfrica repository, locating its root
from the current checkout rather than assuming a machine-specific absolute path.
The minimum scene-release implementation is PR #1340. Check its actual merge state:
if merged, fetch and use an updated `origin/recette`; otherwise use
`origin/codex/scene-clean-delivery` in an isolated worktree. Preserve other sessions'
changes, never reset or switch their checkout, and provision a new worktree as
documented. If remote access is unavailable, report the version uncertainty; do not
claim a stale checkout is current. Keep an existing reproducibility lock tied to
its recorded engine; an update must not silently replace that baseline.

Read these repository files before preparing the plan:

- `.claude/skills/ethniafrica-structure/SKILL.md`
- `.claude/skills/ethniafrica-produire/SKILL.md`
- `social/harness/SCENE-PRODUCTION.md`
- `social/harness/SCENE-CATALOGUE.md`
- `social/harness/SCENE-RELEASE.md`
- `social/harness/templates/scene-storyboards.md`
- `social/harness/templates/scene-production-brief.md`

Recover the subject, audience, narrative, sources, private project directory and
actual approvals from this session and its files. Resolve workshop paths through
the existing project configuration or an explicit operator path. A missing directory
is not an empty project. When several subjects fit, ask which one rather than choosing
a historical demonstration. A delegated agent must receive the subject path and
approval evidence; it must not pretend to have the parent's conversation.

Read an existing `production-state.md`; otherwise use `templates/production-state.md`
in this skill to record the minimum resumable state in the private subject directory.
Respect an explicit request not to save until validation. Keep a short task list.
Preserve approved narration verbatim. A draft, an old proof, a generic “yes”, or a
technical success is not approval of an unidentified new version.

## 2. Resume at the first genuinely missing step

| Available evidence                            | Next work                                                                                                                          |
| --------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Only an idea                                  | Read existing audience/strategy work; use `ethniafrica-idee` for the missing sourced subject report, then `ethniafrica-structure`. |
| Narrative and sources, no visual plan         | Use `ethniafrica-structure` to prepare the visual proposal. Do not restart audience research or rewrite approved narration.        |
| Proposed plan, approval absent                | Present it with the complete text if that text is unapproved; wait for the combined review.                                        |
| Approved plan, missing voice/alignment/assets | Complete the approved package, resolving voice authorization before generation.                                                    |
| Filled plan and valid handoff lock            | Use `ethniafrica-produire` to verify and render; do not redesign.                                                                  |
| Exact proof and genuine release evidence      | Complete the version-bound review, finalize and perform the documented library handoff if registered.                              |
| Clean delivery already exists                 | Verify its manifest/files and report them; do not rerender without a reason.                                                       |

Load supporting skills from `.claude/skills/<name>/SKILL.md` when their work is
needed. `ethniafrica-audience-audit` and `ethniafrica-content-strategist` handle
missing upstream audience/strategy decisions; they are not compulsory reruns for
an existing narrative. `ethniafrica-message`, `ethniafrica-mythe` and, for naming
claims, `ethniafrica-onomastique` perform the applicable reviews. Keep existing
valid reviews; a thematic explanation need not invent a myth or a corpus entity.
If the source report is missing, recover or complete the missing evidence through
`idee` and report it; do not discard an existing approved narrative to restart it.

Use the canonical `structure` and `produire` instructions for their actual work.
The coordinator records routing and decisions, not a second copy of their schemas
or commands. Report missing inputs together and continue independent authorized
preparation; do not invent data to fill a template.

## 3. Present the visual plan before production

Choose name-origin, history-geography or thematic-analysis from the existing
storyboards; justify a free structure when necessary. Narration organizes ideas;
paragraphs do not command cuts. A scene lasts as long as explanation and reading
comfort require. A sustained map can span several sentences while camera, regions,
points, routes and dates evolve. Change scene for a useful change of place, period,
evidence or idea. Never impose four-second image changes. Carousels stay independent.

Use the established visual language where it serves the explanation:

- A progress bar, wide geographic orientation, progressive zoom and reframing.
- Current borders as orientation, quiet or dashed when appropriate; label their period.
- Clear coloured regions and simple location points; avoid halos by default.
- Flags only when historically appropriate or explicitly present-day orientation.
- Animated schematic routes with visible uncertainty; distinguish journeys,
  migrations, political territories and population presence.
- Focused timelines with one dominant date, discreet corner context and readable motion.
- Relevant photographs or documents that explain the spoken point.
- Optional neighbouring territories or silent regional/world events when sourced,
  contemporary with the depicted period and meaningful to this audience; keep them secondary.

Do not force every feature into every video. Never reuse another subject's
historical geometry without evidence. Read `social/harness/SCENES.md` when mapping
the proposal to supported fields; do not promise an unsupported composition.

**First substantive response:** summarize what already exists, then present a concise
French table with these columns:

| Passage narratif                 | À l'écran                   | Caméra et animation   | Images, géographie et sources nécessaires | Contexte muet facultatif | Transition et durée estimée           |
| -------------------------------- | --------------------------- | --------------------- | ----------------------------------------- | ------------------------ | ------------------------------------- |
| Exact passage or clear reference | Visual purpose and elements | Supported composition | Existing assets vs missing evidence       | Quiet, optional, dated   | Explicitly estimated before alignment |

List all missing decisions together. If narration is unapproved, show its full text
alongside the plan for one combined review. If the narrative itself is unavailable,
report that gap instead of fabricating the table. **Wait for approval of the visual
plan before any rendering, cue-preview generation or paid audio.** Existing approval
of that exact unchanged plan satisfies this gate; do not ask for it again. On a
resumed execution-only run, summarize the already approved plan and proceed.

## 4. Execute the approved package

After approval, continue without repeatedly requesting unchanged decisions.
Prepare `production-brief.md`, actual sourced assets, source/licence records and
`scene-plan.json` in the private project. Reuse approved audio when available.
Otherwise resolve voice choice, pronunciation needs and paid-generation authorization
before generating audio through the existing workflow; plan approval alone is not
permission to purchase audio. The scene engine does not generate speech.

Bind timings to the completed recording and exact alignment. Never call estimated
timing measured timing, retime speech to an arbitrary slot, or give the execution
model a placeholder plan. Preserve source credits and visible uncertainty.

Use the documented `prepare`, `render` and verification commands in
`social/harness/SCENE-PRODUCTION.md`; use the existing execution prompt for a handoff.
Inspect previews at 320–430px width, transitions, subtitles and the completed proof.
Record actual listening separately from the presence of an audio stream.

Complete `release-review.json` using real evidence and existing approvals. Never
invent listening, rights clearance or passing editorial verdicts. If substantive
decisions remain, report all outstanding items together and retain the proof. An
unavailable listening tool or missing voice-rights evidence remains pending.

When release checks pass for the exact proof, run `finalize` and deliver the clean
MP4, subtitles, credits and delivery report. Complete the documented library handoff
if the post is registered, verifying the delivered hash. Do not fabricate a publication
category for an unregistered thematic project. Include existing approved social copy
and links in the handoff when available; flag missing publication copy separately.
**Do not publish or schedule anything.**

Do not modify the renderer to make a subject fit. Identify an essential missing
capability and propose the closest supported composition for review. Technical
reruns within approved choices are not new creative approval gates.

## 5. Leave a resumable handoff

Update private `production-state.md` after each meaningful milestone and before
yielding. It links to artifacts, actual approval evidence and the next concrete
action; it is not an executable release review or a new library publication state.
Record repository revision, chosen profile, current artifact hashes, unresolved
decisions and the exact last successful command/report. Preserve earlier approvals
as history; changed inputs invalidate only the affected decisions. Never modify
approval markers or replace locks just to make checks pass.

At delivery, link the actual media and report what was verified, what still needs
operator input, and whether library handoff is complete. A lighter model can replay
a sealed package; equal creative quality from an incomplete narrative is not guaranteed.
