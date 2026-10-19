// @req REQ-186
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  readFileSync,
  rmSync,
  existsSync,
  symlinkSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createHash } from "node:crypto";
import { commitCorpus } from "./corpus.fixture.mjs";
import {
  assessResearch,
  discoverCorpus,
  prepareResearch,
  rereviewRecords,
  verifyProgress,
} from "./research.mjs";
const hash = (text) => createHash("sha256").update(text).digest("hex");
function fixture(t) {
  const root = mkdtempSync(join(tmpdir(), "social-research-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const file = (path, data) => {
    mkdirSync(join(root, path, ".."), { recursive: true });
    writeFileSync(
      join(root, path),
      typeof data === "string" ? data : JSON.stringify(data)
    );
    return path;
  };
  const fiche = "dataset/source/afrik/pays/EXAMPLE.json";
  const original = JSON.stringify({
    id: "EXAMPLE",
    nameFr: "Testland",
    etymology: "Earlier account",
    birthDate: null,
  });
  file(fiche, original);
  file("piece/source.txt", "Recorded name in 1880. Its birth date is unknown.");
  const input = {
    schema: 1,
    subject: "Testland",
    search: { terms: ["Testland"], excluded: [] },
    records: [{ file: fiche, sha256: hash(original) }],
    sources: [
      {
        id: "s1",
        kind: "written",
        citation: "Synthetic test source",
        locator: "page 2",
        recordFile: "piece/source.txt",
        passage: "Recorded name in 1880.",
        basis: "attestation",
      },
    ],
    claims: [
      {
        id: "c1",
        text: "Recorded in 1880",
        certainty: "supported",
        sources: ["s1"],
        event: "attestation",
        date: "1880",
        actor: null,
        limits: "Recording is not invention.",
      },
    ],
    findings: [
      {
        id: "f1",
        claim: "c1",
        file: fiche,
        pointer: "/etymology",
        before: { exists: true, value: "Earlier account" },
        kind: "missing",
        rationale: "The attestation is absent.",
        proposal: {
          value: "Earlier account. Recorded in 1880.",
          certainty: "supported",
          retainedAccounts: "The earlier account remains.",
        },
      },
    ],
    images: [],
    destination: {
      status: "no-link",
      invitation: "No website promise for this fixture.",
      reason: "Test case.",
    },
  };
  const save = () => file("piece/research.json", input);
  return { root, file, fiche, original, input, save };
}
// @req REQ-186
test("discovery and preparation bind claims to real fields without changing the corpus", (t) => {
  const f = fixture(t);
  assert.equal(discoverCorpus(f.root, ["testland"])[0].file, f.fiche);
  const r = prepareResearch(f.root, f.save(), "piece/research-v1");
  assert.equal(r.corrections.length, 1);
  assert.equal(r.corrections[0].status, "prepared");
  assert.equal(readFileSync(join(f.root, f.fiche), "utf8"), f.original);
  assert.match(
    readFileSync(join(f.root, "piece/research-v1/corpus.md"), "utf8"),
    /Earlier account/
  );
  assert.equal(
    JSON.parse(
      readFileSync(join(f.root, "piece/research-v1/proposed", f.fiche), "utf8")
    ).birthDate,
    null
  );
  assert.throws(
    () => prepareResearch(f.root, f.save(), "piece/research-v1"),
    /exists/
  );
});
// @req REQ-186
test("confirmations and unknown birth dates do not manufacture corrections or inventors", (t) => {
  const f = fixture(t);
  const c = f.input.claims[0];
  c.certainty = "unknown";
  c.event = "creation";
  c.date = null;
  c.actor = null;
  f.input.sources[0].basis = "unknown";
  const finding = f.input.findings[0];
  finding.kind = "uncertain";
  delete finding.proposal;
  const r = assessResearch(f.root, f.save());
  assert.equal(r.corrections.length, 0);
  c.date = "1880";
  assert.throws(() => assessResearch(f.root, f.save()), /unknown/);
  c.date = null;
  c.certainty = "supported";
  assert.throws(() => assessResearch(f.root, f.save()), /support|creation/);
});
// @req REQ-186
test("attestation cannot substantiate creation; competing accounts keep uncertainty", (t) => {
  const f = fixture(t);
  f.input.claims[0].event = "creation";
  assert.throws(() => assessResearch(f.root, f.save()), /creation/);
  f.input.claims[0].event = "attestation";
  f.input.claims[0].certainty = "contested";
  assert.throws(() => assessResearch(f.root, f.save()), /sources/);
  f.input.sources.push({ ...f.input.sources[0], id: "s2" });
  f.input.claims[0].sources.push("s2");
  assert.throws(() => assessResearch(f.root, f.save()), /certainty/);
  f.input.findings[0].proposal.certainty = "contested";
  f.input.findings[0].kind = "contradiction";
  assert.equal(assessResearch(f.root, f.save()).corrections.length, 1);
  delete f.input.findings[0].proposal.retainedAccounts;
  assert.throws(() => assessResearch(f.root, f.save()), /accounts/);
});
// @req REQ-186
test("missing evidence, unreviewed matches, stale records and incorrect before values refuse proof", (t) => {
  const f = fixture(t);
  f.input.sources[0].passage = "Not present";
  assert.throws(() => assessResearch(f.root, f.save()), /passage/);
  f.input.sources[0].passage = "Recorded name in 1880.";
  f.file("dataset/source/afrik/langues/test.json", { name: "Testland" });
  assert.throws(() => assessResearch(f.root, f.save()), /unreviewed/);
  f.input.search.excluded.push({
    file: "dataset/source/afrik/langues/test.json",
    reason: "Unrelated test homonym",
  });
  f.input.findings[0].before.value = "Wrong";
  assert.throws(() => assessResearch(f.root, f.save()), /before/);
  f.input.findings[0].before.value = "Earlier account";
  f.file(f.fiche, { id: "changed" });
  assert.throws(() => assessResearch(f.root, f.save()), /changed/);
});
// @req REQ-186
test("oral evidence requires consent, images need item rights and delivery cannot promise unchecked pages", (t) => {
  const f = fixture(t);
  f.input.sources[0].kind = "oral";
  assert.throws(() => assessResearch(f.root, f.save()), /consent/);
  f.input.sources[0].consent = "Recorded permission for this use";
  f.input.images = [{ file: f.file("piece/image.png", "fixture") }];
  assert.throws(() => assessResearch(f.root, f.save()), /image/i);
  f.input.images = [];
  f.input.destination = {
    status: "pending",
    url: "https://example.org/answer",
    invitation: "See this answer",
    reason: "Awaiting deployment",
  };
  assert.doesNotThrow(() => assessResearch(f.root, f.save()));
  assert.throws(
    () => assessResearch(f.root, f.save(), { forDelivery: true }),
    /destination/
  );
});
// @req REQ-186
test("escaped pointers work; unsafe, duplicate, overlapping or nonexistent target paths refuse", (t) => {
  const f = fixture(t);
  for (const pointer of ["/__proto__/polluted", "/missing/child"]) {
    f.input.findings[0].pointer = pointer;
    assert.throws(() => assessResearch(f.root, f.save()), /pointer|parent/);
  }
  f.input.findings[0].pointer = "/etymology";
  f.input.findings.push({ ...f.input.findings[0], id: "f2" });
  assert.throws(() => assessResearch(f.root, f.save()), /overlap/);
  f.input.findings.pop();
  f.input.sources[0].recordFile = "../escape";
  assert.throws(() => assessResearch(f.root, f.save()), /inside/);
  f.input.sources[0].recordFile = "piece/outside";
  symlinkSync(tmpdir(), join(f.root, "piece/outside"));
  assert.throws(() => assessResearch(f.root, f.save()), /inside/);
});
// @req REQ-186
test("failed preparation leaves no incomplete output; no false live status from research", (t) => {
  const f = fixture(t);
  f.input.findings[0].status = "verified-live";
  assert.throws(() => prepareResearch(f.root, f.save(), "piece/bad"), /status/);
  assert.equal(existsSync(join(f.root, "piece/bad")), false);
});
// @req REQ-186
test("corpus progress needs ordered evidence and matching local edits", (t) => {
  const f = fixture(t);
  const r = assessResearch(f.root, f.save());
  const evidence = f.file(
    "piece/checks.md",
    "Schema, editorial and discrepancy checks passed on the proposed values."
  );
  assert.throws(
    () =>
      verifyProgress(
        f.root,
        r,
        { correction: "f1", status: "verified-live", evidence },
        []
      ),
    /order/
  );
  assert.throws(
    () =>
      verifyProgress(
        f.root,
        r,
        { correction: "f1", status: "locally-checked", evidence },
        []
      ),
    /match/
  );
  f.file(f.fiche, {
    id: "EXAMPLE",
    nameFr: "Testland",
    etymology: "Earlier account. Recorded in 1880.",
    birthDate: null,
  });
  const checked = verifyProgress(
    f.root,
    r,
    { correction: "f1", status: "locally-checked", evidence },
    []
  );
  assert.equal(checked.status, "locally-checked");
  assert.throws(
    () =>
      verifyProgress(
        f.root,
        r,
        { correction: "f1", status: "proposed", evidence },
        [checked]
      ),
    /URL/
  );
});

// @req REQ-186
test("corpus path traversal and output through a symlink are refused", (t) => {
  const f = fixture(t);
  f.input.records[0].file = "dataset/source/afrik/../../../piece/research.json";
  assert.throws(
    () => assessResearch(f.root, f.save()),
    /canonical|corpus|inside/
  );
});

// @req REQ-186
test("confirmed claims generate no correction and additions preserve unrelated fields", (t) => {
  const f = fixture(t);
  f.input.findings[0].kind = "confirmation";
  delete f.input.findings[0].proposal;
  assert.equal(assessResearch(f.root, f.save()).corrections.length, 0);
  f.input.findings[0].kind = "missing";
  f.input.findings[0].pointer = "/new~1field";
  f.input.findings[0].before = { exists: false };
  f.input.findings[0].proposal = { value: "New value", certainty: "supported" };
  const r = assessResearch(f.root, f.save());
  assert.equal(r.proposed[f.fiche]["new/field"], "New value");
  assert.equal(r.proposed[f.fiche].etymology, "Earlier account");
});

// @req REQ-186
test("an approved correction applied to a committed fiche keeps the reviewed record provable", (t) => {
  const f = fixture(t);
  // Formatting JSON.stringify cannot reproduce: only the committed bytes match.
  const reviewed =
    '{\n  "id": "EXAMPLE", "nameFr": "Testland",\n  "etymology": "Earlier account",\n  "birthDate": null\n}\n';
  f.file(f.fiche, reviewed);
  f.input.records[0].sha256 = hash(reviewed);
  const input = f.save();
  commitCorpus(f.root);
  const corrected = reviewed.replace(
    '"Earlier account"',
    '"Earlier account. Recorded in 1880."'
  );
  f.file(f.fiche, corrected);
  const r = assessResearch(f.root, input, { forDelivery: true });
  assert.equal(r.dependencies[f.fiche], hash(corrected));
  assert.equal(
    r.proposed[f.fiche].etymology,
    "Earlier account. Recorded in 1880."
  );
  assert.throws(
    () => assessResearch(f.root, input, { applied: [] }),
    /Corpus record changed/
  );
  f.file(f.fiche, corrected.replace('"Testland"', '"Otherland"'));
  assert.throws(() => assessResearch(f.root, input), /Corpus record changed/);
  f.file(f.fiche, reviewed.replace('"Earlier account"', '"Reconciled"'));
  assert.throws(() => assessResearch(f.root, input), /Corpus record changed/);
  const reconciled = { ...r.corrections[0], value: "Reconciled" };
  assert.equal(
    assessResearch(f.root, input, { applied: [reconciled] }).proposed[f.fiche]
      .etymology,
    "Earlier account. Recorded in 1880."
  );
});

// @req REQ-186
test("a changed record whose reviewed version was never committed stays unprovable", (t) => {
  const f = fixture(t);
  const input = f.save();
  f.file(f.fiche, {
    id: "EXAMPLE",
    nameFr: "Testland",
    etymology: "Earlier account. Recorded in 1880.",
    birthDate: null,
  });
  assert.throws(() => assessResearch(f.root, input), /Corpus record changed/);
});

// A second finding on a field nobody changed, to show re-review leaves it alone.
function withUntouchedFinding(f) {
  f.input.findings.push({
    id: "f2",
    claim: "c1",
    file: f.fiche,
    pointer: "/birthDate",
    before: { exists: true, value: null },
    kind: "confirmation",
    rationale: "No birth date is known.",
  });
  return f.save();
}
const corpusBytes = (f) => readFileSync(join(f.root, f.fiche), "utf8");

// @req REQ-186
test("a fiche changed after review fails until a person re-reviews it with a reason", (t) => {
  const f = fixture(t);
  const input = withUntouchedFinding(f);
  const changed = JSON.stringify({
    id: "EXAMPLE",
    nameFr: "Testland (edited by another session)",
    etymology: "Earlier account. Recorded in 1880.",
    birthDate: null,
  });
  f.file(f.fiche, changed);
  assert.throws(() => assessResearch(f.root, input), /Corpus record changed/);
  assert.throws(() => rereviewRecords(f.root, input, [f.fiche], " "), /reason/);
  const summary = rereviewRecords(f.root, input, [f.fiche], "Merged PR #1");
  assert.equal(corpusBytes(f), changed);
  assert.deepEqual(summary, [
    { file: f.fiche, integrated: ["f1"], superseded: [], unchanged: ["f2"] },
  ]);
  const dossier = JSON.parse(readFileSync(join(f.root, input), "utf8"));
  const record = dossier.records[0];
  assert.equal(record.sha256, hash(changed));
  assert.equal(record.history.length, 1);
  assert.equal(record.history[0].sha256, hash(f.original));
  assert.equal(record.history[0].reason, "Merged PR #1");
  assert.ok(Number.isFinite(Date.parse(record.history[0].at)));
  assert.deepEqual(dossier.findings[0].rereview, {
    sha256: hash(changed),
    outcome: "integrated",
  });
  assert.equal(dossier.findings[1].rereview, undefined);
  const r = assessResearch(f.root, input, { forDelivery: true });
  assert.equal(r.corrections.length, 0);
  assert.equal(r.dependencies[f.fiche], hash(changed));
});

// @req REQ-186
test("a re-reviewed field holding neither value is superseded with the reason", (t) => {
  const f = fixture(t);
  const input = withUntouchedFinding(f);
  const changed = JSON.stringify({
    id: "EXAMPLE",
    nameFr: "Testland",
    etymology: "A third account written later.",
    birthDate: null,
  });
  f.file(f.fiche, changed);
  const [summary] = rereviewRecords(f.root, input, [f.fiche], "Later fix");
  assert.deepEqual(summary.superseded, ["f1"]);
  const dossier = JSON.parse(readFileSync(join(f.root, input), "utf8"));
  assert.deepEqual(dossier.findings[0].rereview, {
    sha256: hash(changed),
    outcome: "superseded",
    reason: "Later fix",
  });
  assert.equal(assessResearch(f.root, input).corrections.length, 0);
  assert.equal(corpusBytes(f), changed);
});

// @req REQ-186
test("a change after re-review fails again; a second re-review keeps the whole history", (t) => {
  const f = fixture(t);
  const input = f.save();
  assert.throws(
    () => rereviewRecords(f.root, input, [f.fiche], "Nothing changed"),
    /unchanged/
  );
  assert.throws(
    () =>
      rereviewRecords(
        f.root,
        input,
        ["dataset/source/afrik/pays/OTHER.json"],
        "Not in the dossier"
      ),
    /not a reviewed record/
  );
  const first = JSON.stringify({
    id: "EXAMPLE",
    nameFr: "Testland",
    etymology: "Earlier account. Recorded in 1880.",
    birthDate: null,
  });
  f.file(f.fiche, first);
  rereviewRecords(f.root, input, [f.fiche], "First");
  const second = first.replace('"Testland"', '"Otherland"');
  f.file(f.fiche, second);
  assert.throws(() => assessResearch(f.root, input), /Corpus record changed/);
  rereviewRecords(f.root, input, [f.fiche], "Second");
  const dossier = JSON.parse(readFileSync(join(f.root, input), "utf8"));
  assert.deepEqual(
    dossier.records[0].history.map((h) => [h.sha256, h.reason]),
    [
      [hash(f.original), "First"],
      [hash(first), "Second"],
    ]
  );
  assert.equal(dossier.findings[0].rereview.outcome, "integrated");
  assert.equal(dossier.findings[0].rereview.sha256, hash(second));
  assert.doesNotThrow(() => assessResearch(f.root, input));
});

// @req REQ-186
test("a re-review mark must describe the reviewed version honestly", (t) => {
  const f = fixture(t);
  const input = f.save();
  f.file(f.fiche, {
    id: "EXAMPLE",
    nameFr: "Testland",
    etymology: "A third account written later.",
    birthDate: null,
  });
  rereviewRecords(f.root, input, [f.fiche], "Later fix");
  const dossier = JSON.parse(readFileSync(join(f.root, input), "utf8"));
  const save = () => f.file(input, dossier);
  dossier.findings[0].rereview.outcome = "integrated";
  save();
  assert.throws(() => assessResearch(f.root, input), /integrated/);
  dossier.findings[0].rereview = { outcome: "superseded", sha256: "0" };
  save();
  assert.throws(() => assessResearch(f.root, input), /re-review/i);
  dossier.findings[0].rereview = {
    outcome: "superseded",
    sha256: dossier.records[0].sha256,
  };
  save();
  assert.throws(() => assessResearch(f.root, input), /reason/);
  dossier.findings[0].rereview.reason = "Later fix";
  dossier.records[0].history[0].reason = "";
  save();
  assert.throws(() => assessResearch(f.root, input), /reason/);
});

// @req REQ-186
test("a re-reviewed field whose place no longer exists is superseded", (t) => {
  const f = fixture(t);
  const reviewed = JSON.stringify({
    id: "EXAMPLE",
    nameFr: "Testland",
    etymology: "Earlier account",
    birthDate: null,
    gaps: [{ reason: "First gap" }, { reason: "Second gap" }],
  });
  f.file(f.fiche, reviewed);
  f.input.records[0].sha256 = hash(reviewed);
  f.input.findings.push({
    id: "f2",
    claim: "c1",
    file: f.fiche,
    pointer: "/gaps/1/reason",
    before: { exists: true, value: "Second gap" },
    kind: "confirmation",
    rationale: "The gap is still open.",
  });
  const input = f.save();
  const changed = JSON.stringify({ ...JSON.parse(reviewed), gaps: [] });
  f.file(f.fiche, changed);
  const [summary] = rereviewRecords(f.root, input, [f.fiche], "Gaps closed");
  assert.deepEqual(summary.superseded, ["f2"]);
  assert.deepEqual(summary.unchanged, ["f1"]);
  assert.doesNotThrow(() => assessResearch(f.root, input));
  assert.equal(corpusBytes(f), changed);
});
