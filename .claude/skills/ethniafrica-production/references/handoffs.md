# Handoffs between the coordinator, planner, executor and reviewer

One page, so the two agent runtimes (`.claude/agents/*.md`, `.codex/agents/*.toml`) point at
the same table instead of each restating it. There is one agent per role, never one per theme.

| Role                                                                    | Receives                                                                                         | Returns                                                                        | Owns                                                                    | Resumes when                                                                   |
| ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------ | ----------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| Coordinator (`ethniafrica-production`)                                  | The private subject folder; the operator's decisions                                             | The progress record, the next single action, the decisions to ask for, grouped | `production-progress.json`, the routing, the operator conversation      | Any session: `progress.mjs status` and `edition-cli.mjs status` are read first |
| Planner (`ethniafrica-video-planner`)                                   | One bounded milestone: context, narration, storyboard, package, or a review of a stated artifact | Evidence files with hashes, unresolved decisions                               | The milestone's artifacts; the review of an artifact it did not produce | The coordinator dispatches the next milestone after checking the evidence      |
| Executor (`ethniafrica-video-executor`)                                 | A prepared, locked package and the one command to run                                            | The proof or delivery report, the exit status                                  | Rendering and finalization only                                         | The lock, proof and delivery hashes still match on disk                        |
| Independent reviewer (the planner on another artifact, or the operator) | The exact artifact and the inputs the review will read (`edition-cli.mjs inputs`)                | An approval: reviewer, real reference, the input hashes it read                | The judgement. It is bound to those inputs and to nothing else          | Never: a changed input makes the approval stale and it is asked again, alone   |

## Rules that make the reviewer independent

- An approval records who reviewed, a retrievable reference, and the hash of every input it read
  (`claim:`, `copy:`, `asset:`, `audio:`, `layout:`, `destination:`). `recordApproval` refuses a
  reviewer who is the producer of that work, and the executor never approves what it rendered.
- A changed crop touches `layout:` and `destination:`; a changed claim touches `claim:<id>` and every
  approval citing it. Nothing else goes stale, and a re-run alone invalidates nothing.
- The music review is bound to its destination: a review made for TikTok does not cover Instagram.
- The applicable reviews come from the claims and media present
  (`node social/tools/narration/check-family-brief.mjs <brief.json>`). `not-applicable` is recorded
  with its reason and never removes one of the five universal checks.

## Upstream design: `idee` owns five stages, the coordinator only resumes them

Frame, research, propose, record the choice, show the detailed plan: all five belong to
`ethniafrica-idee`, recorded in the brief's `narrativeDesign` section, not in a new registry.
`check-narrative-design.mjs <brief.json> --resume` names the real missing step; the coordinator
never records a selection, and `structure` starts only at `handoff`
(`--mode handoff`, which `check-family-brief.mjs` also enforces). Details:
`docs/design/gabarits-social/NARRATIVE-DESIGN.md`.

## Three separate records, never fused

| Question                                  | Where it lives                                                                |
| ----------------------------------------- | ----------------------------------------------------------------------------- |
| How far has rendering got                 | `production-progress.json` (`progress.mjs`), the seven video stages           |
| Is this edition ready for a destination   | Approvals against current inputs (`edition-cli.mjs status`), then a package   |
| Was it actually posted, and how did it do | `occurrences.json` and `observations.jsonl` beside the package, from evidence |

A ready edition has no date requirement, and a package is not a publication. No agent posts,
schedules or files an occurrence without evidence a person supplied. Commands:
`docs/design/gabarits-social/EDITION-DELIVERY.md`.
