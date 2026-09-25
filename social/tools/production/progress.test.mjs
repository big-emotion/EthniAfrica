import assert from "node:assert/strict";
import {
  mkdtempSync,
  writeFileSync,
  rmSync,
  readFileSync,
  mkdirSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import {
  createState,
  completeStage,
  startTask,
  getProgress,
  dashboard,
  policy,
  checkGate,
} from "./progress.mjs";

function fixture(t, platform = "codex") {
  const root = mkdtempSync(join(tmpdir(), "video-progress-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  return { root, state: createState(platform, "Example subject") };
}

function finish(
  root,
  state,
  stage,
  approval = "operator approval in review.md"
) {
  const file = `${stage}.md`;
  writeFileSync(join(root, file), `Evidence for ${stage}`);
  return completeStage(root, state, stage, [file], approval);
}

// @req REQ-032
test("routes preparation to the planner and proof export to the executor on both platforms", (t) => {
  for (const platform of ["codex", "claude"]) {
    const { root, state } = fixture(t, platform);
    assert.equal(getProgress(root, state).percent, 0);
    assert.equal(
      getProgress(root, state).route.model,
      policy.platforms[platform].planner.model
    );
    for (const stage of ["context", "narration", "storyboard", "package"])
      finish(root, state, stage);
    const progress = getProgress(root, state);
    assert.equal(progress.percent, 70);
    assert.equal(progress.stage.id, "proof");
    assert.equal(
      progress.route.model,
      policy.platforms[platform].executor.model
    );
    finish(root, state, "proof");
    assert.equal(getProgress(root, state).stage.id, "review");
    assert.equal(
      getProgress(root, state).route.model,
      policy.platforms[platform].planner.model
    );
  }
});

// @req REQ-032
test("refuses skipped stages, missing evidence and absent approval", (t) => {
  const { root, state } = fixture(t);
  assert.throws(() => finish(root, state, "proof"), /next stage/);
  assert.throws(
    () => completeStage(root, state, "context", [], ""),
    /evidence/
  );
  assert.throws(
    () => completeStage(root, state, "context", ["missing.md"], ""),
    /ENOENT/
  );
  finish(root, state, "context");
  assert.throws(() => finish(root, state, "narration", ""), /approval/);
  assert.equal(getProgress(root, state).percent, 10);
});

// @req REQ-032
test("the execution gate refuses unapproved, waiting and changed plans", (t) => {
  const { root, state } = fixture(t);
  finish(root, state, "context");
  finish(root, state, "narration");
  assert.throws(() => checkGate(root, state, "package"), /storyboard/);
  finish(root, state, "storyboard");
  finish(root, state, "package");
  assert.equal(checkGate(root, state, "proof").percent, 70);
  state.waiting_for = "Actual operator decision needed";
  assert.throws(() => checkGate(root, state, "proof"), /waiting/);
  assert.throws(
    () => startTask(root, state, { taskId: "not-dispatched" }),
    /waiting/
  );
  state.waiting_for = null;
  writeFileSync(join(root, "storyboard.md"), "Changed plan");
  assert.throws(() => checkGate(root, state, "proof"), /storyboard/);
});

// @req REQ-032
test("a changed approved input invalidates dependent progress without erasing history", (t) => {
  const { root, state } = fixture(t);
  for (const stage of [
    "context",
    "narration",
    "storyboard",
    "package",
    "proof",
  ])
    finish(root, state, stage);
  writeFileSync(join(root, "narration.md"), "Changed narration");
  const progress = getProgress(root, state);
  assert.equal(progress.percent, 10);
  assert.equal(progress.stage.id, "narration");
  assert.equal(progress.rows[1].status, "stale");
  assert.equal(progress.rows[2].status, "pending");
  assert(state.completed.proof);
});

// @req REQ-032
test("requested models never masquerade as observed models", (t) => {
  const { root, state } = fixture(t);
  startTask(root, state, { taskId: "worker-1" });
  assert.equal(state.active.observed_model, null);
  assert.match(dashboard(root, state), /non confirmé/);
  assert.throws(
    () =>
      startTask(root, state, {
        taskId: "worker-2",
        observedModel: "gpt-6-luna",
      }),
    /model evidence/
  );
  startTask(root, state, {
    taskId: "worker-2",
    observedModel: "gpt-6-luna",
    modelEvidence: "host tool result #42",
  });
  assert.match(dashboard(root, state), /gpt-6-luna/);
  assert.match(dashboard(root, state), /différent du modèle demandé/);
  assert.equal(state.events.length, 2);
});

// @req REQ-032
test("waiting never increases progress and a support escalation is announced", (t) => {
  const { root, state } = fixture(t);
  for (const stage of ["context", "narration", "storyboard", "package"])
    finish(root, state, stage);
  state.waiting_for = "Confirm missing publication rights";
  assert.equal(getProgress(root, state).percent, 70);
  assert.match(dashboard(root, state), /Confirm missing publication rights/);
  startTask(root, state, {
    taskId: "support-1",
    support: true,
    reason: "Scene input mismatch",
  });
  assert.equal(
    state.active.requested_model,
    policy.platforms.codex.planner.model
  );
  assert.match(dashboard(root, state), /Scene input mismatch/);
});

// @req REQ-032
test("100 percent requires a clean delivery manifest and its matching files", (t) => {
  const { root, state } = fixture(t);
  for (const stage of [
    "context",
    "narration",
    "storyboard",
    "package",
    "proof",
    "review",
  ])
    finish(root, state, stage);
  assert.throws(() => finish(root, state, "delivery"), /delivery.json/);
  assert.equal(getProgress(root, state).percent, 95);
  mkdirSync(join(root, "video"));
  writeFileSync(
    join(root, "video/delivery.json"),
    JSON.stringify({ ready_to_publish: false })
  );
  assert.throws(
    () => completeStage(root, state, "delivery", ["video/delivery.json"], ""),
    /finalize/
  );
  const files = {};
  for (const file of [
    "video.mp4",
    "captions.srt",
    "narration.fr.txt",
    "CREDITS.md",
    "mobile-preview.png",
    "release-review.json",
  ]) {
    writeFileSync(join(root, "video", file), `Fixture ${file}`);
    files[file] = createHash("sha256").update(`Fixture ${file}`).digest("hex");
  }
  writeFileSync(
    join(root, "video/delivery.json"),
    JSON.stringify({
      action: "finalize",
      ready_to_publish: true,
      proof_only: false,
      files,
    })
  );
  assert.throws(
    () => completeStage(root, state, "delivery", ["video/delivery.json"]),
    /library handoff/
  );
  assert.throws(
    () => completeStage(root, state, "delivery", ["video/delivery.json"]),
    /handoff/
  );
  const handoff = {
    version: 1,
    social_copy: {
      status: "excluded",
      reason: "Test fixture excludes publication copy",
      approval_reference: "Simulated test approval only",
    },
    library: {
      status: "unregistered",
      evidence: "Synthetic test project is not registered",
    },
  };
  writeFileSync(join(root, "delivery-handoff.json"), JSON.stringify(handoff));
  completeStage(root, state, "delivery", [
    "video/delivery.json",
    "delivery-handoff.json",
  ]);
  assert.equal(getProgress(root, state).percent, 100);
  const copied = join(root, "library-copy.mp4");
  handoff.library = {
    status: "complete",
    post_id: "fixture-post",
    operation_reference: "Synthetic fixture registry operation",
    copied_video_path: copied,
  };
  writeFileSync(copied, "Wrong library export");
  writeFileSync(join(root, "delivery-handoff.json"), JSON.stringify(handoff));
  assert.throws(
    () =>
      completeStage(root, state, "delivery", [
        "video/delivery.json",
        "delivery-handoff.json",
      ]),
    /Library video/
  );
  writeFileSync(copied, readFileSync(join(root, "video/video.mp4")));
  completeStage(root, state, "delivery", [
    "video/delivery.json",
    "delivery-handoff.json",
  ]);
  assert.equal(getProgress(root, state).percent, 100);
  writeFileSync(join(root, "publication-copy.md"), "Approved fixture copy");
  handoff.social_copy = {
    status: "approved",
    path: "publication-copy.md",
    sha256: createHash("sha256").update("Approved fixture copy").digest("hex"),
    approval_reference: "Synthetic approval for test only",
  };
  writeFileSync(join(root, "delivery-handoff.json"), JSON.stringify(handoff));
  completeStage(root, state, "delivery", [
    "video/delivery.json",
    "delivery-handoff.json",
  ]);
  assert.equal(getProgress(root, state).percent, 100);
  writeFileSync(join(root, "publication-copy.md"), "Changed copy");
  assert.equal(getProgress(root, state).percent, 95);
  writeFileSync(join(root, "publication-copy.md"), "Approved fixture copy");
  assert.equal(getProgress(root, state).percent, 100);
  writeFileSync(join(root, "video/video.mp4"), "Changed export");
  assert.equal(getProgress(root, state).percent, 95);
});

// @req REQ-032
test("CLI persists a resumable dashboard and an authorized per-project model choice", (t) => {
  const { root } = fixture(t);
  const cli = fileURLToPath(new URL("./progress.mjs", import.meta.url));
  const run = (...args) =>
    spawnSync(process.execPath, [cli, ...args], { encoding: "utf8" });
  assert.equal(
    run("init", root, "--platform", "claude", "--subject", "Example").status,
    0
  );
  assert.equal(
    run("init", root, "--platform", "claude", "--subject", "Overwrite").status,
    1
  );
  assert.equal(
    run(
      "model",
      root,
      "--role",
      "planner",
      "--model",
      "sonnet",
      "--reason",
      "operator chose Sonnet"
    ).status,
    0
  );
  const status = run("status", root, "--json");
  assert.equal(JSON.parse(status.stdout).route.model, "sonnet");
  assert.equal(
    run("wait", root, "--reason", "Visual approval needed").status,
    0
  );
  assert.match(run("status", root).stdout, /Visual approval needed/);
  assert.equal(run("resume", root).status, 0);
  assert(!run("status", root).stdout.includes("Visual approval needed"));
});

// @req REQ-032
test("does not read evidence outside the private package and rejects unknown platforms", (t) => {
  const { root, state } = fixture(t);
  assert.throws(() => createState("unknown", "Subject"), /platform/);
  assert.throws(
    () => completeStage(root, state, "context", ["../outside.md"], ""),
    /inside/
  );
});

// @req REQ-032
test("native worker entry points load the shared bounded worker contracts", () => {
  for (const role of ["planner", "executor"]) {
    const canonical = `.claude/skills/ethniafrica-production/references/${role}.md`;
    for (const [platform, extension] of [
      ["claude", "md"],
      ["codex", "toml"],
    ]) {
      const file = new URL(
        `../../../.${platform}/agents/ethniafrica-video-${role}.${extension}`,
        import.meta.url
      );
      const text = readFileSync(file, "utf8");
      assert(text.includes(canonical));
      assert(
        !/^model\s*[:=]/m.test(text),
        "worker model must come from the shared routing policy"
      );
    }
  }
});
