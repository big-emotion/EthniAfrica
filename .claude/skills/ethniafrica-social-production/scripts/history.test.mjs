// @req REQ-186
// All publication reports and approvals below are synthetic.
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  mkdtempSync,
  rmSync,
  readFileSync,
  writeFileSync,
  existsSync,
  symlinkSync,
} from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { createPiece, applyEvent, loadPiece, savePiece } from "./workflow.mjs";
import { createPackage } from "./package.mjs";
import { installPackageFixture } from "./package.fixture.mjs";
import {
  archivePiece,
  inspectHistory,
  listHistory,
  cleanupPiece,
} from "./history.mjs";

function fixture(t) {
  const root = mkdtempSync(join(tmpdir(), "social-history-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const id = "synthetic-history";
  const piece = `.local/productions/${id}`;
  createPiece(root, id, "Synthetic history", ["instagram", "facebook"]);
  const f = installPackageFixture(root, piece);
  const event = (e) =>
    applyEvent(root, id, {
      expectedRevision: loadPiece(root, id).revision,
      ...e,
    });
  const brief = f.file("brief.md", "Synthetic brief");
  event({
    type: "review",
    gate: 1,
    files: [brief],
    summary: "Synthetic brief",
  });
  event({ type: "approve", gate: 1, decision: "Synthetic approval" });
  event({
    type: "design",
    file: "social/design-system/version.json",
    decision: "Synthetic design decision",
  });
  event({
    type: "review",
    gate: 2,
    files: [brief],
    researchFile: f.config.research,
    summary: "Synthetic proof",
  });
  event({ type: "approve", gate: 2, decision: "Synthetic approval" });
  const delivery = (output = f.output) => {
    createPackage(root, f.configPath, output, ["instagram", "facebook"]);
    event({
      type: "review",
      gate: 3,
      files: [`${output}/post.md`],
      packageDir: output,
      summary: "Synthetic delivery",
    });
    event({ type: "approve", gate: 3, decision: "Synthetic approval" });
  };
  delivery();
  const publish = (network) =>
    event({
      type: "publication",
      network,
      url: `https://example.org/${network}`,
      publishedAt: "2026-10-10",
      evidence:
        "Synthetic operator report: exactly this approved package was published",
    });
  const options = {
    summary: "Synthetic decision retained",
    lessons: "Synthetic lesson",
    retain: [],
  };
  return {
    ...f,
    id,
    piece,
    event,
    publish,
    delivery,
    options,
    archive: () => archivePiece(root, id, options),
  };
}

test("history retains the actual publication version across later package changes and cleanup", (t) => {
  const f = fixture(t);
  const original = f.config.networks[0].caption;
  f.publish("instagram");
  f.config.networks[1].caption = "Les noms racontent une histoire.";
  f.save();
  f.delivery(`${f.piece}/package-v2`);
  f.publish("facebook");
  f.file("source.txt", "Changed research after publication");
  const history = f.archive();
  assert.equal(history.publications[0].snapshot.copy.caption, original);
  assert.equal(
    history.publications[1].snapshot.copy.caption,
    f.config.networks[1].caption
  );
  assert.equal(
    history.publications[0].snapshot.sources[0].passage,
    "Fixture evidence"
  );
  assert.equal(
    history.publications[0].snapshot.images[0].sourcePage,
    "https://example.org/test-image"
  );
  assert.throws(
    () => f.event({ type: "checkpoint", nextAction: "Changed" }),
    /archiv|closure/i
  );
  cleanupPiece(f.root, f.id);
  assert.equal(existsSync(join(f.root, f.piece)), false);
  assert.equal(inspectHistory(f.root, f.id).subject, "Synthetic history");
  assert.equal(listHistory(f.root, "synthetic").length, 1);
  assert.equal(
    existsSync(join(f.root, "social/design-system/components/bundle.js")),
    true
  );
  assert.throws(
    () => createPiece(f.root, f.id, "Reuse", ["instagram"]),
    /archiv|exists/i
  );
  assert.doesNotThrow(() => cleanupPiece(f.root, f.id));
});

test("removing a target does not silently cancel it; explicit cancellation permits closure", (t) => {
  const f = fixture(t);
  f.publish("instagram");
  f.event({
    type: "networks",
    networks: ["instagram"],
    reason: "Synthetic target change",
  });
  assert.throws(f.archive, /facebook|outcome/i);
  f.event({
    type: "cancel-network",
    network: "facebook",
    reason: "Operator explicitly cancelled this target",
  });
  assert.equal(
    f.archive().cancellations.facebook.reason,
    "Operator explicitly cancelled this target"
  );
  cleanupPiece(f.root, f.id);
});

test("pending corpus corrections retain the entire working folder", (t) => {
  const f = fixture(t);
  f.publish("instagram");
  f.publish("facebook");
  const state = loadPiece(f.root, f.id);
  state.corpusProposals = {
    proposal: { id: "c1", file: "corpus.json", pointer: "/name", value: "new" },
  };
  savePiece(f.root, state, state.revision);
  assert.throws(f.archive, /corpus.*pending/i);
  assert.equal(existsSync(join(f.root, f.piece, "suivi.md")), true);
});

test("interrupted cleanup resumes, but changed survivors or damaged retained exports stop deletion", (t) => {
  const f = fixture(t);
  f.publish("instagram");
  f.publish("facebook");
  const h = f.archive();
  let count = 0;
  assert.throws(
    () =>
      cleanupPiece(f.root, f.id, () => {
        if (++count === 2) throw new Error("Simulated interruption");
      }),
    /Simulated/
  );
  const survivor = join(f.root, f.piece, "source.txt");
  const sourceBytes = readFileSync(survivor);
  writeFileSync(survivor, "Changed surviving evidence");
  assert.throws(() => cleanupPiece(f.root, f.id), /changed/i);
  writeFileSync(survivor, sourceBytes);
  const extra = join(f.root, f.piece, "unexpected.txt");
  writeFileSync(extra, "Unsaved new work");
  assert.throws(() => cleanupPiece(f.root, f.id), /changed|unexpected/i);
  rmSync(extra);
  const retained = join(
    f.root,
    ".local/publications",
    f.id,
    h.publications[0].snapshot.media[0].retained
  );
  const bytes = readFileSync(retained);
  writeFileSync(retained, "Damaged");
  assert.throws(() => cleanupPiece(f.root, f.id), /hash|changed/i);
  writeFileSync(retained, bytes);
  cleanupPiece(f.root, f.id);
  assert.equal(existsSync(join(f.root, f.piece)), false);
});

test("legacy publication records without a preserved package cannot authorize cleanup", (t) => {
  const f = fixture(t);
  f.publish("instagram");
  f.publish("facebook");
  const state = loadPiece(f.root, f.id);
  delete state.publications[0].snapshot;
  savePiece(f.root, state, state.revision);
  assert.throws(f.archive, /snapshot|version/i);
});

test("closure refuses symlinks, stale progress evidence, and active writers", (t) => {
  const f = fixture(t);
  f.publish("instagram");
  f.publish("facebook");
  symlinkSync(join(f.root, "social"), join(f.root, f.piece, "linked"));
  assert.throws(f.archive, /symlink/i);
  rmSync(join(f.root, f.piece, "linked"));
  writeFileSync(join(f.root, f.piece, ".suivi.lock"), String(process.pid));
  assert.throws(f.archive, /locked/i);
  rmSync(join(f.root, f.piece, ".suivi.lock"));
  const state = loadPiece(f.root, f.id);
  state.corpusProposals = { p: { id: "c" } };
  state.corpusProgress = [
    {
      proposal: "p",
      status: "verified-live",
      evidence: `${f.piece}/missing.txt`,
      evidenceHash: "bad",
    },
  ];
  savePiece(f.root, state, state.revision);
  assert.throws(f.archive, /evidence/i);
});

test("a new editorial correction after publication keeps the active work", (t) => {
  const f = fixture(t);
  f.publish("instagram");
  f.publish("facebook");
  f.event({
    type: "revise",
    kind: "copy",
    reason: "An unfinished correction requested after publication",
  });
  assert.throws(f.archive, /pending|unfinished/i);
  assert.equal(existsSync(join(f.root, f.piece, "suivi.md")), true);
});

test("verified corpus work and additional irreplaceable evidence survive closure", (t) => {
  const f = fixture(t);
  f.publish("instagram");
  f.publish("facebook");
  const evidence = f.file(
    "integration.txt",
    "Synthetic local, PR, commit and live observations"
  );
  const state = loadPiece(f.root, f.id);
  const corpus = f.file("corpus.json", { name: "corrected" });
  state.corpusProposals = {
    p: { id: "c", file: corpus, pointer: "/name", value: "corrected" },
  };
  savePiece(f.root, state, state.revision);
  for (const status of [
    "locally-checked",
    "proposed",
    "integrated",
    "verified-live",
  ])
    f.event({
      type: "corpus-progress",
      proposal: "p",
      status,
      evidence,
      url: "https://example.org/evidence",
      commit: "synthetic",
      checkedAt: "2026-10-10",
      observation: "Synthetic live verification",
    });
  f.options.retain = [
    f.file("irreplaceable.txt", "Synthetic original evidence"),
  ];
  const h = f.archive();
  assert.equal(h.corpusProgress.at(-1).status, "verified-live");
  assert.ok(
    h.files.some((file) => file.original.endsWith("irreplaceable.txt"))
  );
  cleanupPiece(f.root, f.id);
  assert.doesNotThrow(() => inspectHistory(f.root, f.id));
});

test("publication capture refuses a symlinked snapshot destination", (t) => {
  const f = fixture(t);
  symlinkSync(join(f.root, "social"), join(f.root, f.piece, ".published"));
  assert.throws(() => f.publish("instagram"), /symlink/i);
  assert.equal(loadPiece(f.root, f.id).publications.length, 0);
  assert.equal(existsSync(join(f.root, "social/media")), false);
});
