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
import { deflateSync } from "node:zlib";
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

const sha = (value) => createHash("sha256").update(value).digest("hex");

function png(width, height) {
  const chunk = (type, data) => {
    const bytes = Buffer.concat([Buffer.from(type), data]);
    let crc = 0xffffffff;
    for (const byte of bytes) {
      crc ^= byte;
      for (let bit = 0; bit < 8; bit++)
        crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
    const out = Buffer.alloc(data.length + 12);
    out.writeUInt32BE(data.length);
    bytes.copy(out, 4);
    out.writeUInt32BE((crc ^ 0xffffffff) >>> 0, out.length - 4);
    return out;
  };
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width);
  header.writeUInt32BE(height, 4);
  header[8] = 8;
  header[9] = 2;
  return Buffer.concat([
    Buffer.from("89504e470d0a1a0a", "hex"),
    chunk("IHDR", header),
    chunk("IDAT", deflateSync(Buffer.alloc((width * 3 + 1) * height))),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

function deliveryFixture(t) {
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
  mkdirSync(join(root, "video/publication"), { recursive: true });
  const files = {};
  for (const name of [
    "video.mp4",
    "captions.srt",
    "narration.fr.txt",
    "CREDITS.md",
    "mobile-preview.png",
    "release-review.json",
  ]) {
    const bytes = `Fixture ${name}`;
    writeFileSync(join(root, "video", name), bytes);
    files[name] = sha(bytes);
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
  writeFileSync(join(root, "video/publication/thumbnail.png"), png(1080, 1920));
  writeFileSync(
    join(root, "video/publication/publication-copy.md"),
    "## Instagram (reel)\nTexte français approuvé.\n"
  );
  const kit = {
    version: 1,
    source_delivery: {
      path: "video/delivery.json",
      sha256: sha(readFileSync(join(root, "video/delivery.json"))),
    },
    source_video_sha256: files["video.mp4"],
    at_seconds: 1,
    files: Object.fromEntries(
      ["thumbnail.png", "publication-copy.md"].map((name) => [
        name,
        sha(readFileSync(join(root, "video/publication", name))),
      ])
    ),
  };
  const handoff = {
    version: 1,
    publication_kit: {
      path: "video/publication/publication-kit.json",
      sha256: "",
    },
    social_copy: {
      status: "approved",
      path: "video/publication/publication-copy.md",
      sha256: kit.files["publication-copy.md"],
      approval_reference: "Synthetic copy approval",
    },
    thumbnail: {
      status: "approved",
      path: "video/publication/thumbnail.png",
      sha256: kit.files["thumbnail.png"],
      approval_reference: "Synthetic cover review at phone size",
    },
    library: {
      status: "unregistered",
      evidence: "Synthetic unregistered project",
    },
  };
  const save = () => {
    writeFileSync(
      join(root, "video/publication/publication-kit.json"),
      JSON.stringify(kit)
    );
    handoff.publication_kit.sha256 = sha(
      readFileSync(join(root, "video/publication/publication-kit.json"))
    );
    writeFileSync(join(root, "delivery-handoff.json"), JSON.stringify(handoff));
  };
  const complete = () =>
    completeStage(root, state, "delivery", [
      "video/delivery.json",
      "delivery-handoff.json",
    ]);
  save();
  return { root, state, kit, handoff, save, complete };
}

// @req REQ-032
test("delivery requires both an approved thumbnail and Markdown copy, with no silent exclusion", (t) => {
  const f = deliveryFixture(t);
  const thumbnail = f.handoff.thumbnail;
  delete f.handoff.thumbnail;
  f.save();
  assert.throws(f.complete, /thumbnail/i);
  assert.equal(getProgress(f.root, f.state).percent, 95);
  f.handoff.thumbnail = { ...thumbnail, approval_reference: "" };
  f.save();
  assert.throws(f.complete, /thumbnail/i);
  f.handoff.thumbnail = thumbnail;
  f.handoff.social_copy = {
    status: "excluded",
    reason: "Old scope",
    approval_reference: "Old approval",
  };
  f.save();
  assert.throws(f.complete, /social copy/i);
});

// @req REQ-032
test("delivery still requires a successful clean manifest and all release artifacts", (t) => {
  const f = deliveryFixture(t);
  assert.throws(
    () => completeStage(f.root, f.state, "delivery", ["review.md"]),
    /delivery.json/
  );
  const path = join(f.root, "video/delivery.json");
  const report = JSON.parse(readFileSync(path, "utf8"));
  writeFileSync(path, JSON.stringify({ ...report, ready_to_publish: false }));
  assert.throws(f.complete, /finalize/);
  delete report.files["CREDITS.md"];
  writeFileSync(path, JSON.stringify(report));
  assert.throws(f.complete, /CREDITS/);
});

// @req REQ-032
test("100 percent tracks the real kit files and the finalized source video", (t) => {
  const f = deliveryFixture(t);
  f.complete();
  assert.equal(getProgress(f.root, f.state).percent, 100);
  const cover = join(f.root, f.handoff.thumbnail.path);
  const original = readFileSync(cover);
  writeFileSync(cover, png(360, 640));
  assert.equal(getProgress(f.root, f.state).percent, 95);
  f.kit.files["thumbnail.png"] = sha(readFileSync(cover));
  f.handoff.thumbnail.sha256 = f.kit.files["thumbnail.png"];
  f.save();
  assert.throws(f.complete, /1080.*1920/);
  writeFileSync(cover, original);
  f.kit.files["thumbnail.png"] = sha(original);
  f.handoff.thumbnail.sha256 = sha(original);
  f.save();
  f.kit.source_video_sha256 = "stale-video";
  f.save();
  assert.throws(f.complete, /source video/i);
  f.kit.source_video_sha256 = sha(
    readFileSync(join(f.root, "video/video.mp4"))
  );
  f.save();
  assert.equal(getProgress(f.root, f.state).percent, 100);
  writeFileSync(join(f.root, f.handoff.social_copy.path), "Changed post");
  assert.equal(getProgress(f.root, f.state).percent, 95);
});

// @req REQ-032
test("registered delivery verifies library copies of video, thumbnail and Markdown", (t) => {
  const f = deliveryFixture(t);
  const lib = join(f.root, "library");
  mkdirSync(lib);
  const entries = [
    ["video", "video/video.mp4"],
    ["thumbnail", f.handoff.thumbnail.path],
    ["social_copy", f.handoff.social_copy.path],
  ];
  f.handoff.library = {
    status: "complete",
    post_id: "fixture",
    operation_reference: "Test registration",
  };
  for (const [key, path] of entries) {
    const dest = join(lib, key);
    writeFileSync(dest, readFileSync(join(f.root, path)));
    f.handoff.library[`copied_${key}_path`] = dest;
  }
  f.save();
  f.complete();
  assert.equal(getProgress(f.root, f.state).percent, 100);
  writeFileSync(f.handoff.library.copied_thumbnail_path, "Wrong cover");
  assert.equal(getProgress(f.root, f.state).percent, 95);
  f.save();
  assert.throws(f.complete, /Library thumbnail/);
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
