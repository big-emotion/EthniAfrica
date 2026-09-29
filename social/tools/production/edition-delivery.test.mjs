import assert from "node:assert/strict";
import { test } from "node:test";
import { mkdtempSync, rmSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import {
  distribution,
  findDuplicateOccurrences,
} from "../contract/contract.mjs";
import { digest } from "./artifacts.mjs";
import {
  reviewPlan,
  recordApproval,
  buildEditionManifest,
  buildDeliverySet,
  writeEditionManifest,
  deliveryStatus,
  recordOccurrence,
} from "./edition-delivery.mjs";

const ASOF = "2026-09-29";
const source = { tier: "referenced", title: "Fixture source" };
const edition = (over = {}) => ({
  id: "portrait-carrousel",
  subject: { key: "fixture-person", label: "Fixture person" },
  angle: { id: "trajectory", question: "What did the person do?" },
  family: "historical-portrait",
  format: "carrousel",
  readiness: "pret",
  intendedNetworks: ["tiktok", "instagram"],
  claims: [{ id: "c1", kind: "person", sources: [source] }],
  media: [{ kind: "audio-excerpt" }],
  ...over,
});

const reviewer = { role: "reviewer", id: "independent-reviewer" };
const approval = (check, inputs, over = {}) => ({
  check,
  inputs,
  reviewer,
  reference: `operator ruling for ${check}`,
  ...over,
});
const INPUTS = {
  "claim:c1": "h-claim",
  "copy:card1": "h-copy",
  "layout:card1": "h-layout",
  "audio:mix": "h-audio",
  "destination:tiktok": "h-tt",
  "destination:instagram": "h-ig",
};
const fullApprovals = () => [
  approval("provenance", { "claim:c1": "h-claim" }),
  approval("uncertainty", { "claim:c1": "h-claim", "copy:card1": "h-copy" }),
  approval("attribution", { "claim:c1": "h-claim" }),
  approval("intelligibility", {
    "copy:card1": "h-copy",
    "layout:card1": "h-layout",
  }),
  approval("non-essentialising", { "copy:card1": "h-copy" }),
  approval("music", { "audio:mix": "h-audio", "destination:tiktok": "h-tt" }),
];
const row = (plan, check) => plan.find((r) => r.check === check);

function workspace() {
  const root = mkdtempSync(join(tmpdir(), "edition-delivery-"));
  mkdirSync(join(root, "cards"));
  const files = {};
  for (const name of ["card1.png", "credits.md", "copy.md", "cover.png"]) {
    writeFileSync(join(root, "cards", name), `fixture ${name}`);
    files[name] = `cards/${name}`;
  }
  return { root, files };
}
const carousel = (files) => ({
  kind: "carousel",
  cards: [files["card1.png"]],
  credits: files["credits.md"],
  copy: files["copy.md"],
  cover: files["cover.png"],
});

// @req REQ-187
test("a ready edition without a date is packaged; the date is optional context", () => {
  const { root, files } = workspace();
  try {
    const manifest = buildEditionManifest(root, {
      edition: edition(),
      network: "tiktok",
      artifacts: carousel(files),
      approvals: fullApprovals(),
      inputs: INPUTS,
      asOf: ASOF,
    });
    assert.equal(manifest.edition.plannedDate, undefined);
    assert.equal(manifest.destination.network, "tiktok");
    assert.equal(manifest.publication.performed, false);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

// @req REQ-187
test("only the selected destinations get a package, and each must be intended", () => {
  const { root, files } = workspace();
  try {
    const set = buildDeliverySet(root, {
      edition: edition(),
      networks: ["tiktok"],
      artifacts: carousel(files),
      approvals: fullApprovals(),
      inputs: INPUTS,
      asOf: ASOF,
    });
    assert.deepEqual(Object.keys(set), ["tiktok"]);
    assert.throws(
      () =>
        buildDeliverySet(root, {
          edition: edition(),
          networks: ["facebook"],
          artifacts: carousel(files),
          approvals: fullApprovals(),
          inputs: INPUTS,
          asOf: ASOF,
        }),
      /facebook is not an intended destination/
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

// @req REQ-186
test("the same angle in both formats gives two independent packages", () => {
  const { root, files } = workspace();
  try {
    const carrousel = edition();
    const video = edition({ id: "portrait-video", format: "video" });
    const packaged = buildEditionManifest(root, {
      edition: carrousel,
      network: "tiktok",
      artifacts: carousel(files),
      approvals: fullApprovals(),
      inputs: INPUTS,
      asOf: ASOF,
    });
    assert.equal(packaged.edition.id, "portrait-carrousel");
    // The video edition has no approvals: the carousel package does not stand in.
    assert.throws(
      () =>
        buildEditionManifest(root, {
          edition: video,
          network: "tiktok",
          artifacts: { kind: "video", durationSeconds: 60 },
          approvals: [],
          inputs: INPUTS,
          asOf: ASOF,
        }),
      /review not complete/
    );
    assert.equal(packaged.edition.angle.id, video.angle.id);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

// @req REQ-187
test("a package is refused while any applicable review is missing or stale", () => {
  const { root, files } = workspace();
  try {
    const approvals = fullApprovals().filter((a) => a.check !== "provenance");
    assert.throws(
      () =>
        buildEditionManifest(root, {
          edition: edition(),
          network: "tiktok",
          artifacts: carousel(files),
          approvals,
          inputs: INPUTS,
          asOf: ASOF,
        }),
      /review not complete: provenance missing/
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

// @req REQ-187
test("a crop change stales only the approvals that read the layout", () => {
  const plan = reviewPlan({
    edition: edition(),
    network: "tiktok",
    approvals: fullApprovals(),
    inputs: { ...INPUTS, "layout:card1": "h-new-crop" },
  });
  assert.equal(row(plan, "intelligibility").status, "stale");
  for (const untouched of [
    "provenance",
    "uncertainty",
    "non-essentialising",
    "music",
  ])
    assert.equal(row(plan, untouched).status, "valid", untouched);
});

// @req REQ-187
test("a changed claim stales exactly the approvals that cite it", () => {
  const plan = reviewPlan({
    edition: edition(),
    network: "tiktok",
    approvals: fullApprovals(),
    inputs: { ...INPUTS, "claim:c1": "h-claim-2" },
  });
  const stale = plan.filter((r) => r.status === "stale").map((r) => r.check);
  assert.deepEqual(stale.sort(), ["attribution", "provenance", "uncertainty"]);
});

// @req REQ-187
test("unchanged narration and audio approvals are reused for another destination", () => {
  const plan = reviewPlan({
    edition: edition(),
    network: "instagram",
    approvals: fullApprovals(),
    inputs: INPUTS,
  });
  for (const reused of [
    "provenance",
    "uncertainty",
    "attribution",
    "intelligibility",
    "non-essentialising",
  ])
    assert.equal(row(plan, reused).status, "valid", reused);
});

// @req REQ-187
test("the music review belongs to its destination: tiktok's does not cover instagram", () => {
  const plan = reviewPlan({
    edition: edition(),
    network: "instagram",
    approvals: fullApprovals(),
    inputs: INPUTS,
  });
  assert.equal(row(plan, "music").status, "missing");
  const withOwn = reviewPlan({
    edition: edition(),
    network: "instagram",
    approvals: [
      ...fullApprovals(),
      approval("music", {
        "audio:mix": "h-audio",
        "destination:instagram": "h-ig",
      }),
    ],
    inputs: INPUTS,
  });
  assert.equal(row(withOwn, "music").status, "valid");
});

// @req REQ-187
test("a check that does not apply is reported with its reason, never asked for", () => {
  const plan = reviewPlan({
    edition: edition({ media: [] }),
    network: "tiktok",
    approvals: fullApprovals().filter((a) => a.check !== "music"),
    inputs: INPUTS,
  });
  assert.equal(row(plan, "music").status, "not-applicable");
  assert.match(row(plan, "music").reason, /no music/);
});

// @req REQ-187
test("an approval needs a reviewer and real evidence, and the producer cannot review its own render", () => {
  assert.throws(
    () => recordApproval({ check: "provenance", inputs: { "claim:c1": "h" } }),
    /reviewer/
  );
  assert.throws(
    () =>
      recordApproval(
        approval("provenance", { "claim:c1": "h" }, { reference: " " })
      ),
    /reference/
  );
  assert.throws(
    () =>
      recordApproval(approval("provenance", { "claim:c1": "h" }), {
        producedBy: reviewer.id,
      }),
    /cannot review its own work/
  );
});

// @req REQ-186
test("a network that refuses the format gets no package", () => {
  const { root, files } = workspace();
  try {
    assert.throws(
      () =>
        buildEditionManifest(root, {
          edition: edition({ intendedNetworks: ["x"] }),
          network: "x",
          artifacts: carousel(files),
          approvals: fullApprovals(),
          inputs: INPUTS,
          asOf: ASOF,
        }),
      /x does not accept carrousel/
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

// @req REQ-186
test("the manifest binds sources, output identity, credits, cover and review evidence", () => {
  const { root, files } = workspace();
  try {
    const manifest = buildEditionManifest(root, {
      edition: edition(),
      network: "tiktok",
      artifacts: carousel(files),
      approvals: fullApprovals(),
      inputs: INPUTS,
      asOf: ASOF,
    });
    assert.deepEqual(manifest.sources[0], { claim: "c1", sources: [source] });
    const roles = manifest.output.files.map((f) => f.role);
    assert.deepEqual(roles, ["card", "credits", "copy", "cover"]);
    assert.equal(
      manifest.output.files.find((f) => f.role === "cover").sha256,
      digest(Buffer.from("fixture cover.png"))
    );
    const valid = manifest.reviews.filter((r) => r.status === "valid");
    assert.ok(valid.length >= 5 && valid.every((r) => r.reference));
    assert.ok(
      manifest.reviews
        .filter((r) => r.status === "not-applicable")
        .every((r) => r.reason)
    );
    const out = writeEditionManifest(root, manifest, "package/tiktok");
    assert.throws(
      () => writeEditionManifest(root, manifest, "package/tiktok"),
      /already exists/
    );
    assert.match(out.path, /package\/tiktok\/edition-package\.json$/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

// @req REQ-186
test("an interrupted delivery resumes from what is on disk, without re-reviewing", () => {
  const { root, files } = workspace();
  try {
    const args = {
      edition: edition(),
      artifacts: carousel(files),
      approvals: fullApprovals().concat(
        approval("music", {
          "audio:mix": "h-audio",
          "destination:instagram": "h-ig",
        })
      ),
      inputs: INPUTS,
      asOf: ASOF,
    };
    writeEditionManifest(
      root,
      buildEditionManifest(root, { ...args, network: "tiktok" }),
      "package/tiktok"
    );
    // Session ends here. A fresh one only has the disk and the approvals.
    const status = deliveryStatus(root, {
      ...args,
      networks: ["tiktok", "instagram"],
      packageDir: (network) => `package/${network}`,
    });
    assert.deepEqual(
      status.map((s) => [s.network, s.review, s.packaged]),
      [
        ["tiktok", "complete", true],
        ["instagram", "complete", false],
      ]
    );
    assert.ok(status.every((s) => s.published === "none"));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

// @req REQ-186
test("a package that no longer matches its files reports itself stale", () => {
  const { root, files } = workspace();
  try {
    const args = {
      edition: edition(),
      artifacts: carousel(files),
      approvals: fullApprovals(),
      inputs: INPUTS,
      asOf: ASOF,
    };
    writeEditionManifest(
      root,
      buildEditionManifest(root, { ...args, network: "tiktok" }),
      "package/tiktok"
    );
    writeFileSync(join(root, files["cover.png"]), "re-exported cover");
    const [tiktok] = deliveryStatus(root, {
      ...args,
      networks: ["tiktok"],
      packageDir: (n) => `package/${n}`,
    });
    assert.equal(tiktok.packaged, "stale");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

const liveEvidence = {
  attestation: "operator",
  reference: "posted by operator, screenshot filed",
};

// @req REQ-186
test("a live occurrence needs evidence and a url that belongs to the network", () => {
  const base = {
    network: "tiktok",
    status: "published",
    publishedAt: "2026-10-02",
    url: "https://www.tiktok.com/@ethniafrica/photo/7000000000000000001",
    evidence: liveEvidence,
  };
  const entry = recordOccurrence(edition(), base);
  assert.equal(entry.fixture, undefined);
  assert.equal(entry.platformPostId, "7000000000000000001");
  assert.throws(
    () => recordOccurrence(edition(), { ...base, evidence: undefined }),
    /evidence/
  );
  assert.throws(
    () =>
      recordOccurrence(edition(), {
        ...base,
        url: "https://www.instagram.com/p/abc/",
      }),
    /not a tiktok address/
  );
  assert.throws(
    () =>
      recordOccurrence(edition(), {
        ...base,
        url: "https://tiktok.example.invalid/x",
      }),
    /not a tiktok address|placeholder/
  );
});

// @req REQ-186
test("an unknown url is written null with evidence, never invented", () => {
  const entry = recordOccurrence(edition(), {
    network: "instagram",
    status: "published",
    publishedAt: null,
    url: null,
    evidence: liveEvidence,
  });
  assert.equal(entry.url, null);
  assert.equal(entry.publishedAt, null);
  assert.throws(
    () =>
      recordOccurrence(edition(), {
        network: "instagram",
        status: "published",
        evidence: liveEvidence,
      }),
    /url/
  );
});

// @req REQ-186
test("a test fixture is labelled, uses an unroutable address, and never counts as live", () => {
  const fixture = recordOccurrence(edition(), {
    network: "tiktok",
    status: "published",
    publishedAt: "2026-10-02",
    url: "https://fixture.invalid/tiktok/7000000000000000009",
    fixture: true,
  });
  assert.equal(fixture.fixture, true);
  assert.equal(distribution(edition({ occurrences: [fixture] })).state, "none");
  assert.throws(
    () =>
      recordOccurrence(edition(), {
        network: "tiktok",
        status: "published",
        publishedAt: "2026-10-02",
        url: "https://www.tiktok.com/@a/photo/1",
        fixture: true,
      }),
    /fixture url must be a \.invalid address/
  );
  assert.equal(
    findDuplicateOccurrences([edition({ occurrences: [fixture] })]).length,
    0
  );
});

// @req REQ-186
test("one network's publication leaves the edition partial and the sibling edition untouched", () => {
  const live = recordOccurrence(edition(), {
    network: "tiktok",
    status: "published",
    publishedAt: "2026-10-02",
    url: "https://www.tiktok.com/@ethniafrica/photo/7000000000000000001",
    evidence: liveEvidence,
  });
  const published = edition({ occurrences: [live] });
  const sibling = edition({ id: "portrait-video", format: "video" });
  assert.equal(distribution(published).state, "partial");
  assert.deepEqual(distribution(published).pending, ["instagram"]);
  assert.equal(distribution(sibling).state, "none");
  assert.equal(sibling.readiness, "pret");
});

// @req REQ-186
test("building a package never records a publication", () => {
  const { root, files } = workspace();
  try {
    const args = {
      edition: edition(),
      networks: ["tiktok"],
      artifacts: carousel(files),
      approvals: fullApprovals(),
      inputs: INPUTS,
      asOf: ASOF,
    };
    const [{ manifest }] = Object.values(buildDeliverySet(root, args)).map(
      (manifest) => ({ manifest })
    );
    assert.equal(manifest.publication.performed, false);
    assert.equal(distribution(args.edition).state, "none");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
