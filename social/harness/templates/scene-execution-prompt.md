# Execution prompt for another session

Replace the bracketed paths once. Use the same instructions with a smaller model. This prompt
executes an already prepared package; it does not ask that model to invent the visual plan.
See [workflow and prerequisites](../SCENE-PRODUCTION.md).

```text
Produce the EthniAfrica scene-video proof from the prepared package at [PROJECT].
Use repository [REPOSITORY] at revision [REVISION], with interpreter [PYTHON].

Read production-brief.md and social/harness/SCENE-PRODUCTION.md. Apply the
scene-video route in ethniafrica-produire. The approved narration, recording,
alignment, source register, assets, filled scene plan and handoff lock are
already supplied. Reuse existing approval for unchanged text and voice.

Run from the repository root:
[PYTHON] social/harness/ethni_scene_pipeline.py render "[PROJECT]" \
  --plan "[PROJECT]/[PLAN]" --lock "[PROJECT]/work/[LOCK]" \
  --output "[PROJECT]/_epreuves/[OUTPUT-VERSION]"

Do not rewrite speech, generate another voice, change geometry or images,
add historical claims, edit the engine, or replace the lock to bypass a mismatch.
Resolve ordinary path/environment issues within the brief. If an input or
editorial decision is missing, report the exact item and the minimum question
needed; do not restart the whole creative process.

Inspect cue previews at phone size, transitions and the final MP4. State what
was visually checked and whether you could actually listen to the audio.
Report the execution checks and their limits without claiming human approval.
Return the video, the execution report and any unresolved issue. Do not publish,
schedule or promote a library/ledger status. This remains a watermarked proof.
```

For a new subject whose package is incomplete, use `ethniafrica-structure` and the
[storyboard recipes](scene-storyboards.md) first. A model name is not a substitute for the package.
