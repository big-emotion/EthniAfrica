// @req REQ-186
import { createHash } from "node:crypto";
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  readFileSync,
  rmSync,
} from "node:fs";
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

import { createPackage } from "./package.mjs";
import { installPackageFixture } from "./package.fixture.mjs";

function fixture(t) {
  const root = mkdtempSync(join(tmpdir(), "social-workflow-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const id = "2026-10-10-uganda";
  createPiece(root, id, "Ouganda", ["instagram", "facebook"]);
  installPackageFixture(root, `.local/productions/${id}`);
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
  const research = () =>
    file(
      "research.json",
      JSON.stringify({
        schema: 1,
        subject: "Synthetic fixture",
        search: { terms: ["Synthetic fixture"], excluded: [] },
        records: [],
        noCorpusReason: "No matching test corpus records",
        findings: [],
        images: [
          {
            file: "social/design-system/assets/plain.png",
            sourcePage: "https://example.org/test-image",
            creator: "Test fixture",
            description: "Synthetic background",
            reuseBasis: "Generated test fixture",
            credit: "Image de test.",
            crop: "Full image",
            rightsEvidence: file(
              "rights.txt",
              "Synthetic test image permission"
            ),
          },
        ],
        sources: [
          {
            id: "s1",
            kind: "written",
            citation: "Synthetic source",
            locator: "page 1",
            passage: "Fixture evidence",
            recordFile: file("source.txt", "Fixture evidence"),
            basis: "context",
          },
        ],
        claims: [
          {
            id: "c1",
            text: "Fixture claim",
            certainty: "supported",
            sources: ["s1"],
            limits: "Test only",
          },
        ],
        destination: {
          status: "no-link",
          invitation: "No link in test",
          reason: "Test only",
        },
      })
    );
  const review = (gate, files) => {
    let packageDir;
    const state = loadPiece(root, id);
    if (gate === 3 && state.approvals[2]?.status === "approved") {
      const fixture = installPackageFixture(
        root,
        `.local/productions/${id}`,
        state.networks
      );
      packageDir = `.local/productions/${id}/package-${state.revision}`;
      createPackage(root, fixture.configPath, packageDir, state.networks);
    }
    return event({
      type: "review",
      gate,
      files,
      summary: `Review ${gate}`,
      ...(gate === 2 ? { researchFile: research() } : {}),
      ...(packageDir ? { packageDir } : {}),
    });
  };
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

test("proof cannot skip research; source changes invalidate approval without changing the angle", (t) => {
  const f = fixture(t);
  f.review(1, [f.file("brief.md")]);
  f.approve(1);
  f.design();
  assert.throws(
    () =>
      f.event({
        type: "review",
        gate: 2,
        files: [f.file("proof.png")],
        summary: "Missing research",
      }),
    /research/i
  );
  f.review(2, [f.file("proof.png")]);
  f.approve(2);
  f.file("source.txt", "Changed source evidence");
  assert.equal(loadPiece(f.root, f.id).approvals[2].status, "stale");
  assert.equal(loadPiece(f.root, f.id).approvals[1].status, "approved");
});

test("a pending site promise can enter proof but cannot enter final delivery", (t) => {
  const f = fixture(t);
  f.review(1, [f.file("brief.md")]);
  f.approve(1);
  f.design();
  f.review(2, [f.file("proof.png")]);
  const path = `.local/productions/${f.id}/research.json`;
  const dossier = JSON.parse(readFileSync(join(f.root, path), "utf8"));
  dossier.destination = {
    status: "pending",
    url: "https://example.org/answer",
    invitation: "An answer is promised",
  };
  f.file("research.json", JSON.stringify(dossier));
  f.event({
    type: "review",
    gate: 2,
    files: [f.file("proof.png")],
    researchFile: path,
    summary: "Pending destination shown",
  });
  f.approve(2);
  assert.throws(() => f.review(3, [f.file("post.md")]), /destination/i);
  assert.equal(loadPiece(f.root, f.id).approvals[2].status, "approved");
});

test("a newly matching fiche cannot slip into approval after the proof was shown", (t) => {
  const f = fixture(t);
  f.review(1, [f.file("brief.md")]);
  f.approve(1);
  f.design();
  f.review(2, [f.file("proof.png")]);
  const dir = join(f.root, "dataset/source/afrik/pays");
  mkdirSync(dir, { recursive: true });
  writeFileSync(
    join(dir, "NEW.json"),
    JSON.stringify({ name: "Synthetic fixture" })
  );
  assert.throws(() => f.approve(2), /coverage|unreviewed/);
});

test("approved corrections retain a separately evidenced integration history after corpus edits", (t) => {
  const f = fixture(t);
  f.review(1, [f.file("brief.md")]);
  f.approve(1);
  f.design();
  f.review(2, [f.file("proof.png")]);
  const path = `.local/productions/${f.id}/research.json`;
  const dossier = JSON.parse(readFileSync(join(f.root, path), "utf8"));
  const fiche = "dataset/source/afrik/pays/TEST.json";
  mkdirSync(join(f.root, "dataset/source/afrik/pays"), { recursive: true });
  const original = JSON.stringify({
    name: "Synthetic fixture",
    summary: "Old",
  });
  writeFileSync(join(f.root, fiche), original);
  dossier.records = [
    {
      file: fiche,
      sha256: createHash("sha256").update(original).digest("hex"),
    },
  ];
  dossier.findings = [
    {
      id: "fix1",
      claim: "c1",
      file: fiche,
      pointer: "/summary",
      before: { exists: true, value: "Old" },
      kind: "missing",
      rationale: "Synthetic discrepancy",
      proposal: { value: "New", certainty: "supported" },
    },
  ];
  f.file("research.json", JSON.stringify(dossier));
  f.event({
    type: "review",
    gate: 2,
    researchFile: path,
    files: [f.file("proof.png")],
    summary: "Review correction",
  });
  f.approve(2);
  const proposal = Object.keys(loadPiece(f.root, f.id).corpusProposals)[0];
  const evidence = f.file(
    "checks.txt",
    "Simulated successful discrepancy, schema and editorial checks"
  );
  assert.throws(
    () =>
      f.event({
        type: "corpus-progress",
        proposal,
        status: "verified-live",
        evidence,
      }),
    /order/
  );
  writeFileSync(
    join(f.root, fiche),
    JSON.stringify({ name: "Synthetic fixture", summary: "New" })
  );
  f.event({
    type: "corpus-progress",
    proposal,
    status: "locally-checked",
    evidence,
  });
  const s = loadPiece(f.root, f.id);
  assert.equal(s.approvals[2].status, "stale");
  assert.equal(s.approvals[1].status, "approved");
  assert.equal(s.corpusProgress[0].status, "locally-checked");
  f.event({
    type: "corpus-progress",
    proposal,
    status: "proposed",
    evidence,
    url: "https://example.org/review/1",
  });
  f.event({
    type: "corpus-progress",
    proposal,
    status: "integrated",
    evidence,
    commit: "fixture-commit",
  });
  assert.throws(
    () =>
      f.event({
        type: "corpus-progress",
        proposal,
        status: "verified-live",
        evidence,
        url: "https://example.org/answer",
        checkedAt: "2026-10-10",
      }),
    /observation/
  );
  f.event({
    type: "corpus-progress",
    proposal,
    status: "verified-live",
    evidence,
    url: "https://example.org/answer",
    checkedAt: "2026-10-10",
    observation: "Synthetic live verification",
  });
  assert.equal(
    loadPiece(f.root, f.id).corpusProgress.at(-1).evidenceCurrent,
    true
  );
  f.file("checks.txt", "Different evidence");
  assert.equal(
    loadPiece(f.root, f.id).corpusProgress.at(-1).evidenceCurrent,
    false
  );
});

test("final approval requires a verified package and fingerprints its actual media", (t) => {
  const f = fixture(t);
  f.review(1, [f.file("brief.md")]);
  f.approve(1);
  f.design();
  f.review(2, [f.file("proof.png")]);
  f.approve(2);
  assert.throws(
    () =>
      f.event({
        type: "review",
        gate: 3,
        files: [f.file("post.md")],
        summary: "Incomplete delivery",
      }),
    /package/i
  );
  f.review(3, [f.file("post.md")]);
  f.approve(3);
  const state = loadPiece(f.root, f.id);
  const png = Object.keys(state.approvals[3].files).find((p) =>
    /package-[0-9]+\/01.png$/.test(p)
  );
  assert.ok(png);
  writeFileSync(join(f.root, png), "Changed final image");
  const changed = loadPiece(f.root, f.id);
  assert.equal(changed.approvals[3].status, "stale");
  assert.equal(changed.approvals[2].status, "approved");
});
