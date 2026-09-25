# Automatic model routing and visible progress

This is the coordinator's execution loop, not optional advice. The operator has
authorized automatic delegation for video production. Keep the coordinator in the
main conversation through the production skill (or Claude's main `--agent` mode)
so progress and approval requests reach the operator. A native coordinator invoked
as a subagent must forward these updates through its parent. If nesting or progress
forwarding is unavailable, return the handoff to the parent; never claim hidden work
or an unsupported model switch happened.

## Routing policy

Read `references/routing.json` relative to this skill. It is the single source for
stage order, weights, worker names and requested models. Codex uses Sol for planning
and review, Luna for execution; Claude uses Opus and Sonnet. Workers do not pin a
model in their native definitions: the coordinator supplies the policy's model in
each native spawn call. An explicit operator choice overrides the policy for that
run; record it using the `model` command, in the handoff and announcements. To make it persistent, update the
policy in an isolated repository change rather than editing global tool settings.

The coordinator's own conversation model stays selected by the operator. Delegating
to Luna or Sonnet does not convert the parent session to that model or eliminate its
token usage. Do not label the entire session as running on the worker's model.

| Milestone  | Completion | Owner              | Evidence needed before completion                                                                                                      |
| ---------- | ---------- | ------------------ | -------------------------------------------------------------------------------------------------------------------------------------- |
| context    | 10%        | planner            | Recovered audience/subject/source report and private project identity; missing evidence resolved                                       |
| narration  | 30%        | planner + operator | Exact full narration and actual approval record                                                                                        |
| storyboard | 50%        | planner + operator | Complete sequence table and approval of that visual version                                                                            |
| package    | 70%        | planner            | Actual assets and sources, approved voice, exact alignment, filled plan, inspected preparation previews and valid lock                 |
| proof      | 85%        | executor           | Rendered proof, verification and execution reports; complete decode                                                                    |
| review     | 95%        | planner + operator | Exact proof's genuine release review, actual listening/rights/editorial evidence and required approvals                                |
| delivery   | 100%       | executor           | Clean finalize manifest and verified files; actual library handoff if registered, approved publication copy or explicit scope decision |

Percentages are weighted completed milestones, not elapsed time, estimated cost or
visual-quality scores. Do not increment during a render, tool wait or approval wait.
The progress tool verifies recorded file hashes, not truthfulness of approval or
historical claims. The scene engine and release review remain authoritative.

## Coordinator loop

1. Recover existing work and approvals before creating jobs. Maintain human-readable
   `production-state.md` and machine-readable `production-progress.json` in the same
   private subject directory. The latter is for routing/progress only, not a new
   library status. Do not rebuild finished milestones merely to earn percentages.
2. Run `status --json` and read its first incomplete/stale milestone and `route`.
   Inspect the referenced evidence before completing recovered milestones. Snapshots
   should be stable: do not fingerprint a constantly changing handoff as evidence
   for every stage. Include the actual narration/recording/plan/lock/reports so changes
   invalidate dependent milestones. Do not fingerprint `production-progress.json`
   or `production-state.md` as its own completion evidence.
   Keep immutable approval snapshots such as `approvals/narration-v1.md` and
   `storyboard-approved.md`, with exact statements and retrievable references.
   Do not hash an append-only approval journal as every milestone's evidence:
   recording a later approval must not invalidate unchanged earlier decisions.
   Keep the approved visual proposal separate from the executable brief's subsequent
   permitted timing adjustments; meaningful changes require a new proposal version.
3. Display the progress dashboard in the main chat **before every stage and model
   handoff**, then explain the next bounded task. Preserve the full French visual
   sequence table at the storyboard stage. Never reduce it to the progress table.
4. Honor existing approval gates. If approval, paid voice authorization or a substantive
   decision is missing, use `wait --reason`, show all missing decisions together and
   stop dependent work. Silence or elapsed time never grants approval. Once the actual
   decision arrives, record the evidence, use `resume`, and continue automatically.
5. Run the progress tool's `gate PROJECT --stage STAGE` before dependent work.
   The planner repeats it before preparation previews; the executor repeats it
   before render/finalize. A failed gate returns to the coordinator, never to a
   direct renderer bypass. Then delegate exactly one bounded milestone, explicitly
   setting the policy model:
   - **Codex:** use the available native spawn tool with the named worker type and
     explicit `model` and `reasoning_effort` when supported. For runtimes with
     `fork_turns`, use `none` so the model override is accepted. If the named worker
     is not loaded yet but generic spawning supports explicit models, use a generic
     worker with the full corresponding worker contract and the same explicit model.
     Read the exposed tool schema; do not invent parameters or model names.
   - **Claude:** use the native `Agent` tool with `subagent_type` from `route.agent`
     and `model` from `route.model`. Supply the bounded handoff in `prompt`. Do not
     rely on implicit inheritance for workers. The worker definitions read shared
     `references/planner.md` or `references/executor.md` and cannot delegate further.
   - Use asynchronous/background execution when the host supports it so the main
     coordinator can announce real progress and surface questions. Wait for the
     worker before starting the next dependent milestone. Do not launch another
     task to compensate for a slow response.
6. After a successful spawn, record the actual task ID with `start`. Pass
   `--observed-model` only when the host reports it, with `--model-evidence` pointing
   to that tool event. Otherwise retain “non confirmé”. A worker claiming its own
   model is not host evidence. A provider alias may resolve to a full model ID;
   report both and distinguish a legitimate alias resolution from a fallback.
7. Keep the operator informed at transitions, on a blocker, and at least once a
   minute while work continues, using real worker/tool status. Do not manufacture
   intermediate percentages. The parent receives all decisions; workers do not
   create competing conversations asking the operator for approvals.
8. Inspect the returned outputs and evidence, then run `complete` for the current
   milestone. Do not accept “done” without artifacts. Show the new dashboard and
   automatically dispatch the next stage unless a substantive approval is missing.
   Workers only perform their assigned stage; they cannot skip the strong review
   and finalize during proof export.
9. If the execution worker encounters a substantive input problem, automatically
   dispatch one bounded support task to the planner model, announce the escalation
   and record `start --support --reason`. A second identical unresolved failure
   becomes one consolidated blocker, not an endless expensive retry loop. Technical
   fixes within the brief proceed; new claims, geometry, narration or asset choices
   return to the affected approval. Invalidate and revalidate downstream milestones.
10. Finish only at verified delivery. Report unregistered delivery separately from
    library handoff. Never invent publication copy, rights, approvals or a successful
    check just to reach 100%. Actual publishing and scheduling remain outside scope.

If native delegation, a requested model or required media tools are unavailable,
announce the limitation and requested model. Do not secretly execute on the expensive
parent, change the user's global configuration, install another CLI, or claim a
successful switch. Save the resumable state and group the minimum decisions needed
to continue. A fallback model requires an explicit operator choice unless already
authorized for this run. Do not retry authentication, quota or permission failures
by cycling models.

## Private progress commands

Run from the selected repository checkout. `PROJECT` is the private subject folder.
The coordinator is the only writer. Commands do not invoke an LLM, render media,
generate audio, grant approvals or publish anything; native tools execute the jobs.

```sh
node social/tools/production/progress.mjs init "$PROJECT" --platform codex --subject "Subject label"
node social/tools/production/progress.mjs status "$PROJECT"
node social/tools/production/progress.mjs status "$PROJECT" --json
node social/tools/production/progress.mjs gate "$PROJECT" --stage proof

# Only for a real operator override; validate model availability with the host.
node social/tools/production/progress.mjs model "$PROJECT" --role planner \
  --model gpt-6-astra --reasoning-effort high --reason "actual operator choice reference"

# After reading actual report/source evidence; repeat --evidence for each file.
node social/tools/production/progress.mjs complete "$PROJECT" --stage context --evidence context.md

# A requested model is not a confirmed runtime model. Record the real spawn ID.
node social/tools/production/progress.mjs start "$PROJECT" --task-id "actual-worker-id"

# Only when the host explicitly reports the runtime model:
node social/tools/production/progress.mjs start "$PROJECT" --task-id "actual-worker-id" \
  --observed-model "reported-model-id" --model-evidence "host event reference"

node social/tools/production/progress.mjs wait "$PROJECT" --reason "Validation du plan visuel attendue"
node social/tools/production/progress.mjs resume "$PROJECT"

# Use only the actual approval reference and exact approved files.
node social/tools/production/progress.mjs complete "$PROJECT" --stage narration \
  --evidence narration.fr.txt --evidence approvals/narration-v1.md --approval-reference "actual narration approval reference"

node social/tools/production/progress.mjs complete "$PROJECT" --stage delivery \
  --evidence video/release-01/delivery.json --evidence delivery-handoff.json
```

Include the approved social copy or record an explicit scope
decision before completing delivery. A missing file, changed hash or absent approval
reference refuses completion; changed evidence rolls the dashboard back to the first
affected milestone. Never edit percentages by hand.

## Delivery evidence

Write private `delivery-handoff.json` alongside the final package. This is an
evidence record, not another library registry. Fill from actual review and registry
results. The progress tool requires it before displaying 100%, verifies the finalized
files and social-copy hash, and compares a registered library video with the final
MP4's recorded hash. Approval references remain attestations, not authenticated signatures.

```json
{
  "version": 1,
  "social_copy": {
    "status": "approved",
    "path": "publication-copy.md",
    "sha256": "actual file digest",
    "approval_reference": "actual approval reference"
  },
  "library": {
    "status": "complete",
    "post_id": "actual registered post ID",
    "operation_reference": "actual registration report or command result",
    "copied_video_path": "absolute path returned by the private registry lookup"
  }
}
```

For an actually unregistered subject, replace `library` with
`{"status":"unregistered","evidence":"actual lookup result or established unregistered scope"}`.
If the operator explicitly excludes social copy from this delivery, replace
`social_copy` with `{"status":"excluded","reason":"actual agreed scope","approval_reference":"actual operator decision"}`.
Do not silently assume that exclusion or registration status. Keep an incomplete
delivery at 95% and list the remaining decision. Media files remain available even
while publication-copy or library handoff is pending.

Official native interfaces: [Codex custom agents](https://developers.openai.com/codex/subagents/)
and [Claude subagents](https://code.claude.com/docs/en/sub-agents).
