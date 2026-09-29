/**
 * The one narrow write that corrects the registry from verified evidence.
 *
 *     node --test social/tools/library/
 *
 * Pure planning is tested directly; the byte-preservation, backup and
 * idempotence promises are tested through a real `node` process on a scratch
 * library, the way the chain calls it.
 */
import { strict as assert } from "node:assert";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { after, test } from "node:test";
import { fileURLToPath } from "node:url";

import { planCorrections } from "./reconcile-plan.mjs";

const scratchDirs = [];
after(() => {
  for (const dir of scratchDirs)
    fs.rmSync(dir, { recursive: true, force: true });
});

const TOOL = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "reconcile-registry.mjs"
);

const READY = {
  id: "goma",
  dir: "Lieux-Goma/goma",
  title: "Goma",
  subject: "Lieu · Goma",
  pillar: "Ce que ce nom veut dire",
  status: "pret",
  date: "",
  dateKind: "",
  videos: ["goma.mp4"],
  channels: {},
  notes: "",
};
const PUBLISHED = {
  ...READY,
  id: "krou",
  dir: "Familles-Krou/krou",
  status: "publie",
  date: "2026-09-12",
  dateKind: "publication",
  channels: { youtube: "https://www.youtube.com/shorts/OLD" },
};

const TWO_SOURCES = [
  { kind: "site-ledger", ref: "productions/lieu/001-goma.json" },
  { kind: "live-audit", ref: "R133" },
];
const correction = (overrides = {}) => ({
  op: "record-published",
  post: "goma",
  date: "2026-09-21",
  channels: { tiktok: "https://www.tiktok.com/@c/video/7687890569099578646" },
  sources: TWO_SOURCES,
  ...overrides,
});

// @req REQ-187
test("two independent sources record a ready entry as published, once", () => {
  const { changes, refusals } = planCorrections([READY], [correction()]);
  assert.deepEqual(refusals, []);
  assert.equal(changes.length, 1);
  assert.deepEqual(changes[0].after, {
    status: "publie",
    date: "2026-09-21",
    dateKind: "publication",
    channels: {
      tiktok:
        "publié le 2026-09-21, https://www.tiktok.com/@c/video/7687890569099578646",
    },
  });
});

// @req REQ-187
test("a single source, or two of one kind, is refused", () => {
  for (const sources of [
    [TWO_SOURCES[0]],
    [TWO_SOURCES[0], { kind: "site-ledger", ref: "other" }],
    [],
  ]) {
    const { changes, refusals } = planCorrections(
      [READY],
      [correction({ sources })]
    );
    assert.equal(changes.length, 0);
    assert.match(refusals[0].reason, /two independent kinds of source/);
  }
});

// @req REQ-187
test("an earlier recorded url or date is never overwritten", () => {
  const { changes, refusals } = planCorrections(
    [PUBLISHED],
    [
      correction({
        post: "krou",
        date: "2026-09-13",
        channels: { youtube: "https://www.youtube.com/shorts/NEW" },
      }),
    ]
  );
  assert.equal(changes.length, 0);
  assert.match(refusals[0].reason, /youtube already records a different value/);
});

// @req REQ-187
test("a network the entry does not record yet is added, its date left alone", () => {
  const { changes } = planCorrections(
    [PUBLISHED],
    [
      correction({
        post: "krou",
        date: "2026-09-13",
        channels: { tiktok: "https://www.tiktok.com/@c/video/1" },
      }),
    ]
  );
  assert.deepEqual(changes[0].after.channels, {
    youtube: "https://www.youtube.com/shorts/OLD",
    tiktok: "publié le 2026-09-13, https://www.tiktok.com/@c/video/1",
  });
  assert.equal(changes[0].after.date, undefined);
});

// @req REQ-187
test("an unknown entry, network or malformed date is refused by name", () => {
  const cases = [
    [{ post: "nope" }, /no entry "nope"/],
    [
      { channels: { myspace: "https://x.invalid/1" } },
      /unknown network "myspace"/,
    ],
    [{ date: "21/09/2026" }, /date "21\/09\/2026" is not YYYY-MM-DD/],
    [{ op: "flip-everything" }, /unknown operation/],
  ];
  for (const [override, expected] of cases) {
    const { changes, refusals } = planCorrections(
      [READY],
      [correction(override)]
    );
    assert.equal(changes.length, 0);
    assert.match(refusals[0].reason, expected);
  }
});

// @req REQ-187
test("planning an already applied correction finds nothing left to change", () => {
  const first = planCorrections([READY], [correction()]).changes[0];
  const applied = { ...READY, ...first.after };
  const second = planCorrections([applied], [correction()]);
  assert.deepEqual(second.changes, []);
  assert.deepEqual(second.refusals, []);
});

function scratchLibrary(posts, indent = "  ") {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "reconcile-"));
  scratchDirs.push(root);
  fs.mkdirSync(path.join(root, "Posts"));
  fs.mkdirSync(path.join(root, "00-Index"));
  const ledger = path.join(root, "00-Index", "publications.json");
  fs.writeFileSync(
    ledger,
    JSON.stringify({ _comment: "x", posts }, null, indent) + "\n"
  );
  fs.writeFileSync(
    path.join(root, "corrections.json"),
    JSON.stringify({ corrections: [correction()] })
  );
  return { root, ledger, corrections: path.join(root, "corrections.json") };
}

const run = (root, args) =>
  spawnSync("node", [TOOL, ...args], {
    encoding: "utf8",
    env: { ...process.env, ETHNIAFRICA_SOCIAL_POSTS: path.join(root, "Posts") },
  });

// @req REQ-187
test("without --write nothing changes on disk", () => {
  const { root, ledger, corrections } = scratchLibrary([READY, PUBLISHED]);
  const before = fs.readFileSync(ledger, "utf8");
  const result = run(root, ["--corrections", corrections]);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /goma/);
  assert.equal(fs.readFileSync(ledger, "utf8"), before);
  assert.deepEqual(fs.readdirSync(path.join(root, "00-Index")), [
    "publications.json",
  ]);
});

// @req REQ-187
test("--write backs the registry up first, changes only that entry, and a second run is a no-op", () => {
  const { root, ledger, corrections } = scratchLibrary(
    [READY, PUBLISHED],
    "\t"
  );
  const before = fs.readFileSync(ledger, "utf8");

  const first = run(root, [
    "--corrections",
    corrections,
    "--backup-label",
    "test-run",
    "--write",
  ]);
  assert.equal(first.status, 0, first.stderr);
  const backup = path.join(
    root,
    "00-Index",
    "publications.json.avant-test-run"
  );
  assert.equal(fs.readFileSync(backup, "utf8"), before);
  assert.match(first.stdout, /publications\.json\.avant-test-run/);

  const after = JSON.parse(fs.readFileSync(ledger, "utf8"));
  assert.equal(after.posts[0].status, "publie");
  assert.deepEqual(after.posts[1], PUBLISHED);
  assert.ok(fs.readFileSync(ledger, "utf8").startsWith('{\n\t"_comment"'));

  const written = fs.readFileSync(ledger, "utf8");
  const second = run(root, [
    "--corrections",
    corrections,
    "--backup-label",
    "test-run-2",
    "--write",
  ]);
  assert.equal(second.status, 0, second.stderr);
  assert.equal(fs.readFileSync(ledger, "utf8"), written);
  assert.equal(
    fs.existsSync(
      path.join(root, "00-Index", "publications.json.avant-test-run-2")
    ),
    false
  );
});

// @req REQ-187
test("an existing backup is never overwritten", () => {
  const { root, corrections } = scratchLibrary([READY]);
  const backup = path.join(root, "00-Index", "publications.json.avant-taken");
  fs.writeFileSync(backup, "earlier backup");
  const result = run(root, [
    "--corrections",
    corrections,
    "--backup-label",
    "taken",
    "--write",
  ]);
  assert.notEqual(result.status, 0);
  assert.equal(fs.readFileSync(backup, "utf8"), "earlier backup");
});

// @req REQ-187
test("a registry whose reserialisation would change other bytes is refused", () => {
  const { root, ledger, corrections } = scratchLibrary([READY]);
  const text = fs
    .readFileSync(ledger, "utf8")
    .replace('"Goma"', '"Gom\\u0061"');
  fs.writeFileSync(ledger, text);
  const result = run(root, [
    "--corrections",
    corrections,
    "--backup-label",
    "odd",
    "--write",
  ]);
  assert.notEqual(result.status, 0);
  assert.equal(fs.readFileSync(ledger, "utf8"), text);
});
