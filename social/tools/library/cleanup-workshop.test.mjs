/** @req REQ-032 — Filed media survive automatic workshop housekeeping. */
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const RECORD = `# Production record

## Subject and angle
Example: explain the chosen name through its speakers. Family: name-origin.
## Steps and decisions
1. Compare the local names. Prefer the attested form because the archive supports it.
2. Render and review the approved version.
## Cuts
Omit the speculative etymology because its evidence is insufficient.
## Sources
Retain SOURCES.md and the verified crop; the archive locator is recorded below.
## Reviews
Message, myth, onomastics and contract: passed in the retained review files.
## Voice choice
Keep tts-original.mp3 and work/narration.wav, including the measured alignment.
## Open points
No unresolved production decision; publication is the operator's act.

\`\`\`production-metadata
{"postIds":["example"],"keep":[],"sources":[{"file":"assets/known.jpg","url":"https://example.org/archive/1","author":"Archive","license":"CC BY 4.0","tier":1,"variant":"Full image, original scan"}]}
\`\`\`
`;

function fixture(t) {
  const root = fs.realpathSync(
    fs.mkdtempSync(path.join(os.tmpdir(), "social-cleanup-"))
  );
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const projects = path.join(root, "workshop");
  const posts = path.join(root, "library/posts");
  const index = path.join(root, "library/00-Index");
  const subject = path.join(projects, "Example");
  function put(relative, value = "keep") {
    const file = path.join(root, relative);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, value);
    return file;
  }
  put(
    "library/00-Index/library-paths.mjs",
    `
export function postRelPath(p) {
  const bucket = p.status === "publie" ? "Publie/" + p.date : p.status === "pret" ? "Valide" : "Brouillon";
  return bucket + "/" + p.dir;
}
export function findPostRelPath() { return null; }
`
  );
  const post = {
    id: "example",
    dir: "Peuples-Example/example",
    status: "pret",
    workshopSubject: "Example",
    videos: ["final.mp4"],
    renderedFrom: { "final.mp4": "Example/video/final.mp4" },
  };
  const ledger = { posts: [post] };
  function save() {
    fs.writeFileSync(
      path.join(index, "publications.json"),
      JSON.stringify(ledger, null, 2) + "\n"
    );
  }
  save();
  put(
    "library/posts/Valide/Peuples-Example/example/video/final.mp4",
    "finished"
  );
  put("workshop/Example/video/final.mp4", "finished");
  put("workshop/Example/production-record.md", RECORD);
  put("workshop/Example/work/images/000000.png", "frame-one");
  put("workshop/Example/work/images-controle/000000.png", "frame-two");
  put("workshop/Example/work/images/hand-edited.png");
  for (const name of [
    "cards.json",
    "SOURCES.md",
    "tts-original.mp3",
    "work/narration.wav",
    "work/aligned-words.json",
    "work/scene-starts.json",
    "work/edl.py",
    "assets/known.jpg",
    "assets/unknown.jpg",
    "work/map.tif",
    "video/only-cut.mp4",
  ])
    put("workshop/Example/" + name);
  put("workshop/_shared-assets/relief.tif");
  function run(args = [], tool = "cleanup-workshop.mjs") {
    return spawnSync(process.execPath, [path.join(HERE, tool), ...args], {
      encoding: "utf8",
      env: {
        ...process.env,
        ETHNIAFRICA_SOCIAL_PROJECTS: projects,
        ETHNIAFRICA_SOCIAL_POSTS: posts,
      },
    });
  }
  return { root, projects, posts, subject, ledger, post, save, put, run };
}

// @req REQ-032
test("dry-run lists exact disposable files and bytes without writing anything", (t) => {
  const f = fixture(t);
  const before = fs.readFileSync(
    path.join(f.subject, "production-record.md"),
    "utf8"
  );
  const result = f.run(["--subject", "Example"]);
  assert.equal(result.status, 0, result.stderr);
  const report = JSON.parse(result.stdout);
  assert.equal(report.bytes, 18);
  assert.deepEqual(
    report.delete.map((x) => x.path),
    ["work/images-controle/000000.png", "work/images/000000.png"]
  );
  assert.deepEqual(report.assetsWithoutLocator, [
    "assets/unknown.jpg",
    "work/map.tif",
  ]);
  assert.ok(report.onlyCopyRisks.includes("work/narration.wav"));
  assert.equal(
    fs.readFileSync(path.join(f.subject, "production-record.md"), "utf8"),
    before
  );
  assert.ok(fs.existsSync(path.join(f.subject, "work/images/000000.png")));
});

// @req REQ-032
test("explicit write removes frames, preserves inputs and library, and is repeatable", (t) => {
  const f = fixture(t);
  const result = f.run(["--subject", "Example", "--write"]);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(
    fs.existsSync(path.join(f.subject, "work/images/000000.png")),
    false
  );
  for (const name of [
    "cards.json",
    "SOURCES.md",
    "tts-original.mp3",
    "work/narration.wav",
    "work/aligned-words.json",
    "work/scene-starts.json",
    "work/edl.py",
    "assets/known.jpg",
    "assets/unknown.jpg",
    "work/map.tif",
    "video/only-cut.mp4",
    "work/images/hand-edited.png",
  ])
    assert.ok(fs.existsSync(path.join(f.subject, name)), name);
  assert.equal(
    fs.readFileSync(
      path.join(f.posts, "Valide/Peuples-Example/example/video/final.mp4"),
      "utf8"
    ),
    "finished"
  );
  assert.equal(
    fs.readFileSync(path.join(f.projects, "_shared-assets/relief.tif"), "utf8"),
    "keep"
  );
  assert.match(
    fs.readFileSync(path.join(f.subject, "production-record.md"), "utf8"),
    /18 bytes/
  );
  const again = f.run(["--subject", "Example", "--write"]);
  assert.equal(again.status, 0, again.stderr);
  assert.equal(JSON.parse(again.stdout).bytes, 0);
});

for (const condition of [
  "draft",
  "missing",
  "empty",
  "wrong-shelf",
  "different-copy",
  "missing-record",
  "incomplete-record",
  "record-is-directory",
  "mixed-editions",
  "unbound",
  "proof-only",
  "missing-replay-input",
]) {
  test(`refuses ${condition} without deleting a frame`, (t) => {
    const f = fixture(t);
    const final = path.join(
      f.posts,
      "Valide/Peuples-Example/example/video/final.mp4"
    );
    if (condition === "draft") f.post.status = "a-produire";
    if (condition === "missing") fs.unlinkSync(final);
    if (condition === "empty") fs.writeFileSync(final, "");
    if (condition === "wrong-shelf")
      fs.renameSync(
        path.join(f.posts, "Valide"),
        path.join(f.posts, "Brouillon")
      );
    if (condition === "different-copy") fs.writeFileSync(final, "older cut");
    if (condition === "missing-record")
      fs.unlinkSync(path.join(f.subject, "production-record.md"));
    if (condition === "incomplete-record")
      fs.writeFileSync(
        path.join(f.subject, "production-record.md"),
        "# Unfinished"
      );
    if (condition === "record-is-directory") {
      fs.unlinkSync(path.join(f.subject, "production-record.md"));
      fs.mkdirSync(path.join(f.subject, "production-record.md"));
    }
    if (condition === "mixed-editions")
      f.ledger.posts.push({
        id: "second",
        status: "a-produire",
        renderedFrom: { "next.mp4": "Example/video/next.mp4" },
      });
    if (condition === "unbound") f.ledger.posts = [];
    if (condition === "missing-replay-input")
      fs.unlinkSync(path.join(f.subject, "work/narration.wav"));
    if (condition === "proof-only") {
      fs.unlinkSync(final);
      f.post.videos = [];
      f.post.renderedFrom = {};
      f.put(
        "library/posts/Valide/Peuples-Example/example/_epreuves/proof.mp4",
        "proof"
      );
    }
    f.save();
    const result = f.run(["--subject", "Example", "--write"]);
    assert.notEqual(result.status, 0, result.stdout);
    assert.doesNotMatch(result.stderr, /MODULE_NOT_FOUND|Unknown option/);
    assert.ok(fs.existsSync(path.join(f.subject, "work/images/000000.png")));
  });
}

for (const location of ["subject", "work", "frame", "record", "library"]) {
  test(`refuses ${location} symlink without following it`, (t) => {
    const f = fixture(t);
    const target =
      location === "subject"
        ? f.subject
        : location === "work"
          ? path.join(f.subject, "work")
          : location === "frame"
            ? path.join(f.subject, "work/images/000000.png")
            : location === "record"
              ? path.join(f.subject, "production-record.md")
              : path.join(
                  f.posts,
                  "Valide/Peuples-Example/example/video/final.mp4"
                );
    const outside = path.join(f.root, "outside");
    fs.renameSync(target, outside);
    fs.symlinkSync(outside, target);
    const result = f.run(["--subject", "Example", "--write"]);
    assert.notEqual(result.status, 0, result.stdout);
    assert.ok(fs.existsSync(outside));
  });
}

// @req REQ-032
test("shared directories and path escapes cannot be selected", (t) => {
  const f = fixture(t);
  for (const subject of [
    "_shared-assets",
    "../library",
    f.subject,
    "Example/../Example",
  ]) {
    assert.notEqual(f.run(["--subject", subject, "--write"]).status, 0);
  }
});

// @req REQ-032
test("nested shared material and Git checkouts are refused before any deletion", (t) => {
  const f = fixture(t);
  f.put("workshop/Example/_shared-assets/work/cache.log", "shared");
  let result = f.run(["--subject", "Example", "--write"]);
  assert.notEqual(result.status, 0);
  assert.ok(fs.existsSync(path.join(f.subject, "work/images/000000.png")));
  fs.rmSync(path.join(f.subject, "_shared-assets"), { recursive: true });
  f.put("workshop/Example/nested/.git/HEAD", "ref: refs/heads/main");
  result = f.run(["--subject", "Example", "--write"]);
  assert.notEqual(result.status, 0);
  assert.ok(fs.existsSync(path.join(f.subject, "work/images/000000.png")));
});

for (const failure of ["write", "reread"]) {
  test(`record ${failure} failure occurs before any deletion`, (t) => {
    const f = fixture(t);
    const preload = f.put(
      "fault.cjs",
      `
const fs = require("node:fs");
const originalRead = fs.readFileSync;
const originalWrite = fs.writeFileSync;
let written = false;
fs.writeFileSync = function (...args) {
  if (typeof args[0] === "number") {
    if (${JSON.stringify(failure)} === "write") throw new Error("Injected record write failure");
    written = true;
  }
  return originalWrite.apply(this, args);
};
fs.readFileSync = function (...args) {
  if (written && String(args[0]).endsWith("production-record.md")) return "changed after write";
  return originalRead.apply(this, args);
};
require("node:module").syncBuiltinESMExports();
`
    );
    const result = spawnSync(
      process.execPath,
      [
        "--require",
        preload,
        path.join(HERE, "cleanup-workshop.mjs"),
        "--subject",
        "Example",
        "--write",
      ],
      {
        encoding: "utf8",
        env: {
          ...process.env,
          ETHNIAFRICA_SOCIAL_PROJECTS: f.projects,
          ETHNIAFRICA_SOCIAL_POSTS: f.posts,
        },
      }
    );
    assert.notEqual(result.status, 0);
    assert.match(
      result.stderr,
      failure === "write"
        ? /Injected record write failure/
        : /re-read verification failed/
    );
    assert.ok(fs.existsSync(path.join(f.subject, "work/images/000000.png")));
  });
}

// @req REQ-032
test("explicit keep and evidence references override the disposable class", (t) => {
  const f = fixture(t);
  f.put(
    "workshop/Example/production-record.md",
    RECORD.replace('"keep":[]', '"keep":["work/images/000000.png"]')
  );
  f.put(
    "workshop/Example/production-progress.json",
    JSON.stringify({ evidence: [{ path: "work/images-controle/000000.png" }] })
  );
  const result = f.run(["--subject", "Example", "--write"]);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(JSON.parse(result.stdout).bytes, 0);
});

// @req REQ-032
test("record evidence, absolute references and filenames with spaces are protected", (t) => {
  const f = fixture(t);
  f.put(
    "workshop/Example/production-record.md",
    RECORD.replace(
      "## Cuts",
      "Review still: `work/images/000000.png`.\n\n## Cuts"
    )
  );
  f.put(
    "workshop/Example/review.json",
    JSON.stringify({
      evidence: path.join(f.subject, "work/images-controle/000000.png"),
      log: "work/review details.log",
    })
  );
  f.put("workshop/Example/work/review details.log", "unique evidence");
  const result = f.run(["--subject", "Example", "--write"]);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(JSON.parse(result.stdout).bytes, 0);
});

// @req REQ-032
test("a script mentioning the work directory does not protect every generated frame", (t) => {
  const f = fixture(t);
  f.put("workshop/Example/work/edl.py", 'work = project / "work"\n');
  const result = f.run(["--subject", "Example"]);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(JSON.parse(result.stdout).bytes, 18);
});

// @req REQ-032
test("published status uses the dated shelf and records actual occurrences", (t) => {
  const f = fixture(t);
  f.post.status = "publie";
  f.post.date = "2026-09-30";
  f.post.channels = { youtube: "https://example.org/watch/1" };
  f.save();
  const dest = path.join(f.posts, "Publie/2026-09-30");
  fs.mkdirSync(dest, { recursive: true });
  fs.renameSync(
    path.join(f.posts, "Valide/Peuples-Example"),
    path.join(dest, "Peuples-Example")
  );
  const result = f.run(["--subject", "Example", "--write"]);
  assert.equal(result.status, 0, result.stderr);
  assert.match(
    fs.readFileSync(path.join(f.subject, "production-record.md"), "utf8"),
    /https:\/\/example.org\/watch\/1/
  );
});

// @req REQ-032
test("filing completion in register-post invokes cleanup automatically, dry-run stays dry", (t) => {
  const f = fixture(t);
  const args = ["--id", "example", "--filed"];
  const dry = f.run(args, "register-post.mjs");
  assert.equal(dry.status, 0, dry.stderr);
  assert.ok(fs.existsSync(path.join(f.subject, "work/images/000000.png")));
  const write = f.run([...args, "--write"], "register-post.mjs");
  assert.equal(write.status, 0, write.stderr);
  assert.equal(
    fs.existsSync(path.join(f.subject, "work/images/000000.png")),
    false
  );
});

// @req REQ-032
test("registration stores an explicit workshop binding and rejects shared or escaped paths", (t) => {
  const f = fixture(t);
  delete f.post.workshopSubject;
  f.save();
  const result = f.run(
    ["--id", "example", "--workshop", "Example", "--write"],
    "register-post.mjs"
  );
  assert.equal(result.status, 0, result.stderr);
  assert.equal(
    JSON.parse(
      fs.readFileSync(path.join(f.root, "library/00-Index/publications.json"))
    ).posts[0].workshopSubject,
    "Example"
  );
  for (const subject of ["../Example", "_shared-assets", "Example/subfolder"])
    assert.notEqual(
      f.run(
        ["--id", "example", "--workshop", subject, "--write"],
        "register-post.mjs"
      ).status,
      0
    );
});

// @req REQ-032
test("filing completion fails visibly when the actual library copy is missing", (t) => {
  const f = fixture(t);
  fs.unlinkSync(
    path.join(f.posts, "Valide/Peuples-Example/example/video/final.mp4")
  );
  const result = f.run(
    ["--id", "example", "--filed", "--write"],
    "register-post.mjs"
  );
  assert.notEqual(result.status, 0);
  assert.ok(fs.existsSync(path.join(f.subject, "work/images/000000.png")));
});

// @req REQ-032
test("derived audio needs the selected take and master; evidence logs and unique takes survive", (t) => {
  const f = fixture(t);
  f.put("workshop/Example/work/source.wav", "derived-source");
  f.put("workshop/Example/work/paused.wav", "derived-paused");
  f.put("workshop/Example/work/ffmpeg.log", "encoder output");
  f.put("workshop/Example/work/proof.log", "approval evidence");
  f.put("workshop/Example/review.json", '{"evidence":"work/proof.log"}');
  let result = JSON.parse(f.run(["--subject", "Example"]).stdout);
  assert.ok(!result.delete.some((file) => file.path === "work/source.wav"));
  f.put("workshop/Example/work/tts-original.wav", "unique selected take");
  const write = f.run(["--subject", "Example", "--write"]);
  assert.equal(write.status, 0, write.stderr);
  result = JSON.parse(write.stdout);
  for (const name of ["source.wav", "paused.wav", "ffmpeg.log"])
    assert.ok(result.delete.some((file) => file.path === `work/${name}`));
  for (const name of ["proof.log", "tts-original.wav", "narration.wav"])
    assert.ok(fs.existsSync(path.join(f.subject, "work", name)));
});

// @req REQ-032
test("the state report distinguishes completed housekeeping from a missing record", (t) => {
  const f = fixture(t);
  f.put(
    "library/posts/Valide/Peuples-Example/example/post.md",
    "# Example\n\n**🟢 Validé, en attente**\n\n| Sujet | Example |\n"
  );
  let result = f.run([], "../etat-pipeline/build-etat.mjs");
  assert.equal(result.status, 0, result.stderr);
  assert.match(
    fs.readFileSync(path.join(f.projects, "etat-du-pipeline.md"), "utf8"),
    /cleanup pending/
  );
  assert.equal(f.run(["--subject", "Example", "--write"]).status, 0);
  result = f.run([], "../etat-pipeline/build-etat.mjs");
  assert.equal(result.status, 0, result.stderr);
  assert.match(
    fs.readFileSync(path.join(f.projects, "etat-du-pipeline.md"), "utf8"),
    /scratch cleaned/
  );
});
