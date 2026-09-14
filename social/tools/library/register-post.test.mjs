/**
 * The chain's one write into the library ledger, exercised as the skills call it:
 * a real `node` process pointed at a scratch library through the environment.
 *
 *     node --test social/tools/
 *
 * The scratch library carries its own `library-paths.mjs` because the tool
 * delegates the bucket rule to whatever module the library ships. The fixture's
 * rule is deliberately simpler than the real one; what is under test is that the
 * tool asks the library instead of deciding.
 */
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const TOOL = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "register-post.mjs"
);

const SHELF_RULE = `
export function postRelPath(post) {
  return \`\${post.status === "pret" ? "Valide" : "Brouillon"}/\${post.dir}\`;
}
export function findPostRelPath(root, dir, existsSync, join) {
  for (const bucket of ["Valide", "Brouillon"]) {
    if (existsSync(join(root, bucket, dir))) return \`\${bucket}/\${dir}\`;
  }
  return null;
}
`;

const PUBLISHED = {
  id: "krou-klao",
  title: "Les Krou — « la mer » ?",
  subject: "Peuples · Krou",
  pillar: "Ce que ce nom veut dire",
  status: "publie",
  date: "2026-09-12",
  dateKind: "publication",
  videos: [],
  channels: { youtube: "publié le 2026-09-12, URL non enregistrée" },
  notes: "Clé `dir` en dernier, comme trois entrées réelles.",
  dir: "Familles-Krou/krou-klao",
  copy: "_legendes/krou-klao.md",
};

const IN_PROGRESS = {
  id: "touareg-cinq-pays",
  dir: "Peuples-Touareg/touareg-cinq-pays",
  title: "Du Niger à l'Algérie, les frontières traversent les Touareg.",
  subject: "Peuple · Touareg",
  pillar: "La carte cachée",
  status: "a-produire",
  date: "",
  dateKind: "",
  videos: [],
  channels: {},
  views: "",
  notes: "",
  links: {
    path: "/fr/atlas/peuples/PPL_TUAREG",
    campaign: "touareg-cinq-pays",
    content: "carrousel",
  },
  copy: "_legendes/touareg-cinq-pays.md",
  titleApproved: "2026-09-13",
};

const LEDGER = {
  _comment: "Scratch ledger for register-post tests.",
  posts: [PUBLISHED, IN_PROGRESS],
};

/** A library laid out as the tool expects: the index beside the posts shelf. */
function scratchLibrary({ indent = "  ", ledgerText } = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "register-post-"));
  const index = path.join(root, "00-Index");
  const posts = path.join(root, "02-Reseaux-sociaux");
  fs.mkdirSync(index);
  fs.mkdirSync(posts);
  fs.writeFileSync(path.join(index, "library-paths.mjs"), SHELF_RULE);
  const ledger = path.join(index, "publications.json");
  fs.writeFileSync(
    ledger,
    ledgerText ?? JSON.stringify(LEDGER, null, indent) + "\n"
  );
  return { root, posts, ledger };
}

function register(args, postsRoot) {
  return spawnSync(process.execPath, [TOOL, ...args], {
    encoding: "utf8",
    env: { ...process.env, ETHNIAFRICA_SOCIAL_POSTS: postsRoot },
  });
}

const MANDE = [
  "--id",
  "mande-nest-pas-un-peuple",
  "--dir",
  "Familles-Mande/mande-nest-pas-un-peuple",
  "--title",
  "On dit « les Mandé » comme un peuple.",
  "--subject",
  "Famille · Mandé",
  "--pillar",
  "Ce que ce nom veut dire",
  "--status",
  "brouillon",
];

// @req REQ-032
test("a registration is a dry run unless --write is given", () => {
  const library = scratchLibrary();
  const before = fs.readFileSync(library.ledger, "utf8");

  const run = register(MANDE, library.posts);

  assert.equal(run.status, 0, run.stderr);
  assert.match(run.stdout, /mande-nest-pas-un-peuple/);
  assert.equal(fs.readFileSync(library.ledger, "utf8"), before);
  assert.equal(
    fs.existsSync(path.join(library.posts, "Brouillon", "Familles-Mande")),
    false
  );
});

// @req REQ-032
test("--write appends the entry with the defaults build-index reads, and creates its folder", () => {
  const library = scratchLibrary();

  const run = register([...MANDE, "--write"], library.posts);

  assert.equal(run.status, 0, run.stderr);
  const expected = {
    ...LEDGER,
    posts: [
      ...LEDGER.posts,
      {
        id: "mande-nest-pas-un-peuple",
        dir: "Familles-Mande/mande-nest-pas-un-peuple",
        title: "On dit « les Mandé » comme un peuple.",
        subject: "Famille · Mandé",
        pillar: "Ce que ce nom veut dire",
        status: "brouillon",
        date: "",
        dateKind: "",
        videos: [],
        channels: {},
        views: "",
        notes: "",
      },
    ],
  };
  assert.equal(
    fs.readFileSync(library.ledger, "utf8"),
    JSON.stringify(expected, null, 2) + "\n"
  );
  assert.ok(
    fs
      .statSync(
        path.join(
          library.posts,
          "Brouillon",
          "Familles-Mande",
          "mande-nest-pas-un-peuple"
        )
      )
      .isDirectory()
  );
});

// @req REQ-032
test("links, copy and a delivered video are recorded in the ledger's own shape", () => {
  const library = scratchLibrary();

  const run = register(
    [
      ...MANDE,
      "--link-path",
      "/fr/atlas/familles/FLG_MANDE",
      "--copy",
      "_legendes/mande-nest-pas-un-peuple.md",
      "--video",
      "mande-nest-pas-un-peuple.mp4=Mande/video/mande-nest-pas-un-peuple.mp4",
      "--write",
    ],
    library.posts
  );

  assert.equal(run.status, 0, run.stderr);
  const entry = JSON.parse(fs.readFileSync(library.ledger, "utf8")).posts.at(
    -1
  );
  assert.deepEqual(entry.links, {
    path: "/fr/atlas/familles/FLG_MANDE",
    campaign: "mande-nest-pas-un-peuple",
    content: "video",
  });
  assert.equal(entry.copy, "_legendes/mande-nest-pas-un-peuple.md");
  assert.deepEqual(entry.videos, ["mande-nest-pas-un-peuple.mp4"]);
  assert.deepEqual(entry.renderedFrom, {
    "mande-nest-pas-un-peuple.mp4": "Mande/video/mande-nest-pas-un-peuple.mp4",
  });
  assert.deepEqual(Object.keys(entry).slice(-3), [
    "links",
    "copy",
    "renderedFrom",
  ]);
});

// @req REQ-032
test("updating an entry keeps its field order and every other byte of the ledger", () => {
  const library = scratchLibrary();

  const run = register(
    [
      "--id",
      "touareg-cinq-pays",
      "--video",
      "touareg.mp4=Touareg/video/touareg.mp4",
      "--write",
    ],
    library.posts
  );

  assert.equal(run.status, 0, run.stderr);
  const updated = { ...IN_PROGRESS };
  updated.videos = ["touareg.mp4"];
  updated.renderedFrom = { "touareg.mp4": "Touareg/video/touareg.mp4" };
  assert.equal(
    fs.readFileSync(library.ledger, "utf8"),
    JSON.stringify({ ...LEDGER, posts: [PUBLISHED, updated] }, null, 2) + "\n"
  );
});

// @req REQ-032
test("the ledger's own indentation is written back", () => {
  const library = scratchLibrary({ indent: "\t" });

  const run = register([...MANDE, "--write"], library.posts);

  assert.equal(run.status, 0, run.stderr);
  const text = fs.readFileSync(library.ledger, "utf8");
  assert.equal(text, JSON.stringify(JSON.parse(text), null, "\t") + "\n");
  assert.equal(JSON.parse(text).posts.length, 3);
});

// @req REQ-032
test("a ledger that a rewrite would reformat is refused and left untouched", () => {
  const ledgerText =
    JSON.stringify(LEDGER, null, 2).replace("Scratch", "Scr\\u0061tch") + "\n";
  const library = scratchLibrary({ ledgerText });

  const run = register([...MANDE, "--write"], library.posts);

  assert.notEqual(run.status, 0);
  assert.equal(fs.readFileSync(library.ledger, "utf8"), ledgerText);
});

// @req REQ-032
test("publishing is not a status the chain can register", () => {
  const library = scratchLibrary();
  const before = fs.readFileSync(library.ledger, "utf8");
  const args = [...MANDE.slice(0, -1), "publie", "--write"];

  const run = register(args, library.posts);

  assert.notEqual(run.status, 0);
  assert.match(run.stderr, /publie/);
  assert.equal(fs.readFileSync(library.ledger, "utf8"), before);
});

// @req REQ-032
test("a folder already held by another post is refused", () => {
  const library = scratchLibrary();
  const args = [...MANDE, "--write"];
  args[args.indexOf("--dir") + 1] = IN_PROGRESS.dir;

  const run = register(args, library.posts);

  assert.notEqual(run.status, 0);
  assert.match(run.stderr, /touareg-cinq-pays/);
});

// @req REQ-032
test("a new post without its identifying fields is refused", () => {
  const library = scratchLibrary();

  const run = register(
    ["--id", "sans-titre", "--status", "brouillon", "--write"],
    library.posts
  );

  assert.notEqual(run.status, 0);
  assert.match(run.stderr, /--dir/);
});

// @req REQ-032
test("no library, or no ledger beside it, is an error rather than an empty library", () => {
  const unconfigured = register(MANDE, "");
  assert.notEqual(unconfigured.status, 0);
  assert.match(unconfigured.stderr, /ETHNIAFRICA_SOCIAL_POSTS/);

  const bare = fs.mkdtempSync(path.join(os.tmpdir(), "register-post-bare-"));
  const shelfOnly = path.join(bare, "02-Reseaux-sociaux");
  fs.mkdirSync(shelfOnly);
  const missing = register(MANDE, shelfOnly);
  assert.notEqual(missing.status, 0);
  assert.match(missing.stderr, /publications\.json/);
});

// @req REQ-032
test("--where names the folder a post actually sits in, which is where a render must aim", () => {
  const library = scratchLibrary();
  const misfiled = path.join(library.posts, "Valide", IN_PROGRESS.dir);
  fs.mkdirSync(misfiled, { recursive: true });

  const found = register(["--where", "touareg-cinq-pays"], library.posts);
  assert.equal(found.status, 0, found.stderr);
  assert.equal(found.stdout.trim(), misfiled);

  const unknown = register(["--where", "nulle-part"], library.posts);
  assert.notEqual(unknown.status, 0);
});

// @req REQ-032
test("an entry whose folder sits in another bucket gets no second folder", () => {
  const library = scratchLibrary();
  fs.mkdirSync(path.join(library.posts, "Valide", IN_PROGRESS.dir), {
    recursive: true,
  });

  const run = register(
    ["--id", "touareg-cinq-pays", "--notes", "rendu", "--write"],
    library.posts
  );

  assert.equal(run.status, 0, run.stderr);
  assert.equal(
    fs.existsSync(path.join(library.posts, "Brouillon", IN_PROGRESS.dir)),
    false
  );
});
