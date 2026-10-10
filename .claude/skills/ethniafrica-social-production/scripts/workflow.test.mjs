// @req REQ-186
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import {
  createPiece,
  loadPiece,
  listPieces,
  applyEvent,
  savePiece,
} from "./workflow.mjs";

function fixture(t) {
  const root = mkdtempSync(join(tmpdir(), "social-workflow-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const id = "2026-10-10-uganda";
  createPiece(root, id, "Ouganda", ["instagram", "facebook"]);
  const file = (name, text = name) => {
    const relative = `.local/productions/${id}/${name}`;
    writeFileSync(join(root, relative), text);
    return relative;
  };
  const event = (value) =>
    applyEvent(root, id, {
      expectedRevision: loadPiece(root, id).revision,
      ...value,
    });
  const review = (gate, files) =>
    event({ type: "review", gate, files, summary: `Review ${gate}` });
  const approve = (gate) =>
    event({
      type: "approve",
      gate,
      decision: `Operator approves version presented at gate ${gate}`,
    });
  const design = () =>
    event({
      type: "design",
      file: file("design.md"),
      decision: "Operator supplied and accepted this design system",
    });
  const ready = () => {
    review(1, [file("brief.md")]);
    approve(1);
    design();
    review(2, [file("copy.md"), file("proof.png")]);
    approve(2);
    review(3, [file("post.md"), file("final.png")]);
    approve(3);
  };
  return { root, id, file, event, review, approve, design, ready };
}

test("three approvals stop the workflow at the actual reviewed versions", (t) => {
  const f = fixture(t);
  assert.throws(() => f.review(2, [f.file("proof.png")]), /approval 1/i);
  f.review(1, [f.file("brief.md")]);
  assert.equal(loadPiece(f.root, f.id).waitingFor, "approval-1");
  f.approve(1);
  assert.equal(loadPiece(f.root, f.id).stage, "research");
  assert.throws(() => f.review(3, [f.file("post.md")]), /approval 2/i);
  f.design();
  f.review(2, [f.file("proof.png")]);
  f.approve(2);
  f.review(3, [f.file("post.md")]);
  f.approve(3);
  const state = loadPiece(f.root, f.id);
  assert.equal(state.stage, "ready");
  assert.deepEqual(state.publications, []);
});

test("an approval needs an explicit recorded decision and an existing review", (t) => {
  const f = fixture(t);
  assert.throws(() => f.approve(1), /review/i);
  f.review(1, [f.file("brief.md")]);
  assert.throws(
    () => f.event({ type: "approve", gate: 1, decision: "" }),
    /decision/i
  );
});

test("visual proof waits for the operator-supplied design system", (t) => {
  const f = fixture(t);
  f.review(1, [f.file("brief.md")]);
  f.approve(1);
  const before = loadPiece(f.root, f.id);
  assert.throws(() => f.review(2, [f.file("proof.png")]), /design system/i);
  assert.equal(loadPiece(f.root, f.id).revision, before.revision);
  f.event({
    type: "checkpoint",
    nextAction: "Wait for Claude Design",
    context: "The operator will return the design.",
    waitingFor: "design-system",
  });
  assert.equal(loadPiece(f.root, f.id).waitingFor, "design-system");
});

test("fresh process finds saved progress without chat history", (t) => {
  const f = fixture(t);
  f.review(1, [f.file("brief.md")]);
  f.approve(1);
  f.event({
    type: "checkpoint",
    nextAction: "Clarify Buganda link",
    context: "Tone accepted; origin date is not established.",
  });
  const cli = new URL("./workflow.mjs", import.meta.url).pathname;
  const result = spawnSync(process.execPath, [cli, "status", f.id], {
    cwd: f.root,
    encoding: "utf8",
  });
  assert.equal(result.status, 0, result.stderr);
  const state = JSON.parse(result.stdout);
  assert.equal(state.nextAction, "Clarify Buganda link");
  assert.equal(state.approvals["1"].status, "approved");
  assert.match(
    readFileSync(join(f.root, `.local/productions/${f.id}/suivi.md`), "utf8"),
    /origin date/
  );
});

test("changed claims invalidate proof and delivery but retain the angle", (t) => {
  const f = fixture(t);
  f.ready();
  f.event({
    type: "revise",
    kind: "research",
    reason: "Check earliest attestation",
  });
  const s = loadPiece(f.root, f.id);
  assert.equal(s.stage, "research");
  assert.equal(s.approvals["1"].status, "approved");
  assert.equal(s.approvals["2"].status, "stale");
  assert.equal(s.approvals["3"].status, "stale");
});

test("a rendering-only crop fix keeps meaning approved but requires final review", (t) => {
  const f = fixture(t);
  f.ready();
  f.event({
    type: "revise",
    kind: "crop",
    reason: "Move the subject above the text",
  });
  const s = loadPiece(f.root, f.id);
  assert.equal(s.stage, "produce");
  assert.equal(s.approvals["2"].status, "approved");
  assert.equal(s.approvals["3"].status, "stale");
});

test("a rejected proof returns to writing without discarding the angle", (t) => {
  const f = fixture(t);
  f.review(1, [f.file("brief.md")]);
  f.approve(1);
  f.design();
  f.review(2, [f.file("proof.png")]);
  f.event({ type: "revise", kind: "copy", reason: "Origin milestone unclear" });
  assert.equal(loadPiece(f.root, f.id).waitingFor, null);
  assert.throws(() => f.approve(2), /review/i);
  assert.equal(loadPiece(f.root, f.id).approvals["1"].status, "approved");
});

test("changed artifacts cannot inherit a saved approval or be approved from stale review", (t) => {
  const f = fixture(t);
  const brief = f.file("brief.md");
  f.review(1, [brief]);
  f.file("brief.md", "Different angle");
  assert.throws(() => f.approve(1), /changed|stale/i);
  f.review(1, [brief]);
  f.approve(1);
  f.design();
  const copy = f.file("copy.md");
  f.review(2, [copy]);
  f.approve(2);
  f.file("copy.md", "Changed claim");
  const s = loadPiece(f.root, f.id);
  assert.equal(s.approvals["1"].status, "approved");
  assert.equal(s.approvals["2"].status, "stale");
  assert.notEqual(s.stage, "produce");
});

test("an edited design invalidates proof and final approvals", (t) => {
  const f = fixture(t);
  f.ready();
  f.file("design.md", "Different type scale");
  const s = loadPiece(f.root, f.id);
  assert.equal(s.waitingFor, "design-system");
  assert.equal(s.approvals["2"].status, "stale");
  assert.equal(s.approvals["3"].status, "stale");
});

test("stale saves do not overwrite a newer checkpoint", (t) => {
  const f = fixture(t);
  const stale = loadPiece(f.root, f.id);
  f.event({
    type: "checkpoint",
    nextAction: "Newer saved action",
    context: "Updated",
  });
  assert.throws(() => savePiece(f.root, stale, stale.revision), /revision/i);
  assert.equal(loadPiece(f.root, f.id).nextAction, "Newer saved action");
});

test("a failed atomic replacement preserves the last complete checkpoint", (t) => {
  const f = fixture(t);
  const state = loadPiece(f.root, f.id);
  state.nextAction = "Unsaved";
  assert.throws(
    () =>
      savePiece(f.root, state, state.revision, () => {
        throw new Error("simulated interruption");
      }),
    /simulated interruption/
  );
  assert.notEqual(loadPiece(f.root, f.id).nextAction, "Unsaved");
});

test("discovery exposes ambiguous subjects and ignores abandoned temporary writes", (t) => {
  const f = fixture(t);
  createPiece(f.root, "2026-10-11-uganda", "Ouganda", ["tiktok"]);
  writeFileSync(
    join(f.root, `.local/productions/${f.id}/.suivi-abandoned.tmp`),
    "incomplete"
  );
  assert.equal(listPieces(f.root, "Ouganda").length, 2);
});

test("invalid paths, duplicate piece creation and empty reviews are refused", (t) => {
  const f = fixture(t);
  assert.throws(
    () => createPiece(f.root, "../escape", "Bad", ["instagram"]),
    /identifier/i
  );
  assert.throws(
    () => createPiece(f.root, f.id, "Again", ["instagram"]),
    /exists/i
  );
  assert.throws(() => f.review(1, []), /files/i);
  assert.throws(() => f.review(1, ["../outside.txt"]), /path/i);
});

test("publication records need final approval and explicit evidence; no posting is performed", (t) => {
  const f = fixture(t);
  const event = {
    type: "publication",
    network: "instagram",
    url: "https://www.instagram.com/p/example/",
    publishedAt: "2026-10-10",
    evidence: "Operator supplied the live URL",
  };
  assert.throws(() => f.event(event), /approval 3/i);
  f.ready();
  f.event(event);
  const s = loadPiece(f.root, f.id);
  assert.equal(s.publications.length, 1);
  assert.equal(s.stage, "ready");
  assert.equal(s.publications[0].network, "instagram");
});

test("adding a network retains the editorial proof and reopens final delivery", (t) => {
  const f = fixture(t);
  f.ready();
  f.event({
    type: "networks",
    networks: ["instagram", "facebook", "tiktok"],
    reason: "Operator added TikTok",
  });
  const s = loadPiece(f.root, f.id);
  assert.equal(s.approvals["1"].status, "approved");
  assert.equal(s.approvals["2"].status, "approved");
  assert.equal(s.approvals["3"].status, "stale");
  assert.equal(s.stage, "package");
  assert.ok(s.networks.includes("tiktok"));
});
