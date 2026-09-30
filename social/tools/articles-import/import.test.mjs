/**
 * The importer end to end, on a scratch library built from nothing.
 *
 *     node --test social/tools/articles-import/
 *
 * No real library, workshop or ledger is read: each test builds the two
 * private roots, a site ledger and an empty article bank under the system
 * temp directory and drives `runImport` the way the command line does.
 */
import { strict as assert } from "node:assert";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { after, test } from "node:test";
import { fileURLToPath } from "node:url";

import sharp from "sharp";

import { runImport } from "./import.mjs";

const scratch = [];
after(() => {
  for (const dir of scratch) fs.rmSync(dir, { recursive: true, force: true });
});

const LIBRARY_PATHS = `
export function postRelPath(post) {
  if (post.status === "publie") return post.date ? "Publie/" + post.date + "/" + post.dir : null;
  return "Valide/" + post.dir;
}
`;

async function png(file, shade) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  await sharp({
    create: {
      width: 108,
      height: 135,
      channels: 3,
      background: { r: shade, g: 40, b: 90 },
    },
  })
    .png()
    .toFile(file);
}

function put(file, text) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, text);
}

const VIDEO_A_OLD = {
  id: "a-old",
  dir: "Pays-A/a-old",
  title: "A, first cut",
  subject: "Pays · A",
  pillar: "Ce que ce nom veut dire",
  status: "publie",
  date: "2026-09-10",
  channels: {
    youtube: "publié le 2026-09-10, https://www.youtube.com/shorts/OLDOLDOLD01",
  },
  notes: "NOTE-PRIVEE production : ne jamais publier cette phrase.",
  links: { campaign: "a-old", content: "video" },
};
const VIDEO_A_NEW = {
  id: "a",
  dir: "Pays-A/a",
  title: "D'où vient le nom A ?",
  subject: "Pays · A",
  pillar: "Ce que ce nom veut dire",
  status: "publie",
  date: "2026-09-20",
  channels: {
    youtube: "https://www.youtube.com/watch?v=NEWNEWNEW01",
    tiktok: "https://www.tiktok.com/@ethniafrica/video/7686049879138864406",
  },
  notes: "",
  links: { campaign: "a", content: "video" },
  workshopSubject: "a",
};
const CAROUSEL_B = {
  id: "b",
  dir: "Peuples-B/b",
  title: "B, le nom qu'on leur donne",
  subject: "Peuple · B",
  pillar: "Mythe déconstruit",
  status: "publie",
  date: "2026-09-16",
  channels: {
    tiktok: "publié le 2026-09-16, URL non enregistrée",
    instagram: "https://www.instagram.com/p/BBBBBBBBBBB/",
  },
  notes: "",
  links: { campaign: "b", content: "carrousel" },
};
const EMPTY_C = {
  id: "c",
  dir: "Peuples-C/c",
  title: "C",
  subject: "Peuple · C",
  pillar: "x",
  status: "publie",
  date: "2026-09-14",
  channels: {},
  notes: "",
  links: { campaign: "c", content: "carrousel" },
};

async function buildWorld({
  posts = [VIDEO_A_OLD, VIDEO_A_NEW, CAROUSEL_B, EMPTY_C],
} = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "articles-import-"));
  scratch.push(root);
  const library = path.join(root, "library");
  const postsRoot = path.join(library, "02-Reseaux-sociaux");
  const workshopRoot = path.join(library, "workshop");
  put(path.join(library, "00-Index", "library-paths.mjs"), LIBRARY_PATHS);
  put(
    path.join(library, "00-Index", "publications.json"),
    JSON.stringify({ posts }, null, 2)
  );

  const folder = (p) => path.join(postsRoot, "Publie", p.date, p.dir);
  put(path.join(folder(VIDEO_A_OLD), "post.md"), "# old\n");
  put(path.join(folder(VIDEO_A_OLD), "video", "a-old.mp4"), "old video bytes");
  await png(path.join(folder(VIDEO_A_OLD), "video", "thumbnail.png"), 10);
  put(path.join(folder(VIDEO_A_NEW), "post.md"), "# new\n");
  put(path.join(folder(VIDEO_A_NEW), "video", "video.mp4"), "new video bytes");
  await png(path.join(folder(VIDEO_A_NEW), "video", "thumbnail.png"), 20);
  put(path.join(folder(CAROUSEL_B), "post.md"), "# b\n");
  for (const n of [1, 2, 3]) {
    await png(
      path.join(
        folder(CAROUSEL_B),
        "TikTok-Instagram",
        `b_0${n}_carrousel_1080x1350.png`
      ),
      60 * n
    );
  }
  await png(
    path.join(
      folder(CAROUSEL_B),
      "_rendus-remplaces",
      "b_01_carrousel_1080x1350.png"
    ),
    250
  );
  put(path.join(folder(EMPTY_C), "post.md"), "# c\n");

  put(
    path.join(workshopRoot, "a", "narration.fr.txt"),
    "Notre ancienne vidéo disait autre chose. Nous la corrigeons.\n"
  );
  put(
    path.join(workshopRoot, "b", "cards.json"),
    JSON.stringify({
      campagne: "b",
      cartes: [
        {
          rang: 3,
          titre: "Trois",
          corps: "",
          source: "C. Auteur, Revue, 2001",
          image: null,
        },
        {
          rang: 1,
          titre: "Un",
          corps: "Premier corps.",
          source: "",
          image: null,
        },
        {
          rang: 2,
          titre: "Deux",
          corps: "",
          source: "",
          image: {
            identite: "Une carte ancienne.",
            credit: "Carte",
            depot: "Commons",
            licence: "domaine public",
          },
        },
      ],
    })
  );

  const siteLedgerDir = path.join(root, "productions");
  put(
    path.join(siteLedgerDir, "pays", "001-a.json"),
    JSON.stringify({
      campaign: "a",
      question: { fr: "D'où vient le nom A ?" },
      publications: [
        {
          network: "youtube",
          format: "video",
          url: "https://www.youtube.com/shorts/OLDOLDOLD01",
          publishedAt: "2026-09-10",
        },
        {
          network: "youtube",
          format: "video",
          url: "https://youtube.com/shorts/NEWNEWNEW01",
          publishedAt: "2026-09-20",
        },
      ],
    })
  );
  put(
    path.join(siteLedgerDir, "peuple", "001-b.json"),
    JSON.stringify({
      campaign: "b",
      question: { fr: "D'où vient le nom B ?" },
      publications: [
        // The ledger dates this a day late; the TikTok id says the 16th.
        {
          network: "tiktok",
          format: "carrousel",
          url: "https://www.tiktok.com/@ethniafrica/photo/7685962182923767062",
          publishedAt: "2026-09-17",
        },
        {
          network: "instagram",
          format: "carrousel",
          url: "https://www.instagram.com/p/BBBBBBBBBBB",
          publishedAt: "2026-09-16",
        },
      ],
    })
  );
  put(path.join(siteLedgerDir, "README.md"), "ledger\n");
  const dossierDir = path.join(root, "dossiers");
  put(
    path.join(dossierDir, "DOS_X.json"),
    JSON.stringify({ slug: "legacy-dossier" })
  );

  return {
    root,
    library,
    postsRoot,
    workshopRoot,
    siteLedgerDir,
    dossierDir,
    articlesDir: path.join(root, "content", "articles"),
    outDir: path.join(root, "out"),
  };
}

const CURATION = {
  supersedes: [
    {
      record: "a",
      supersedes: "a-old",
      evidence: "the new narration says it corrects the earlier video",
      correctionNote: {
        file: "a/narration.fr.txt",
        quote: "Notre ancienne vidéo disait autre chose. Nous la corrigeons.",
      },
    },
  ],
};

function options(world, extra = {}) {
  return {
    postsRoot: world.postsRoot,
    workshopRoot: world.workshopRoot,
    siteLedgerDir: world.siteLedgerDir,
    dossierDir: world.dossierDir,
    articlesDir: world.articlesDir,
    outDir: world.outDir,
    curation: CURATION,
    write: false,
    ...extra,
  };
}

function snapshotTree(dir) {
  if (!fs.existsSync(dir)) return {};
  const out = {};
  for (const entry of fs.readdirSync(dir, { recursive: true })) {
    const abs = path.join(dir, entry);
    if (fs.statSync(abs).isFile())
      out[entry] = fs.readFileSync(abs).toString("base64");
  }
  return out;
}

const readDraft = (world, id) =>
  JSON.parse(
    fs.readFileSync(path.join(world.articlesDir, `${id}.json`), "utf8")
  );
const candidate = (result, id) =>
  result.candidates.find((c) => c.articleId === id);

test("a dry run reads everything and writes nothing", async () => {
  const world = await buildWorld();
  const before = snapshotTree(world.root);
  const result = await runImport(options(world));
  assert.deepEqual(snapshotTree(world.root), before);
  assert.ok(candidate(result, "a"));
  assert.equal(candidate(result, "a").disposition, "article-draft");
});

test("drafts carry no body, keep slide order and the card's words", async () => {
  const world = await buildWorld();
  await runImport(options(world, { write: true }));
  const b = readDraft(world, "b");
  assert.equal(b.status, "draft");
  assert.deepEqual(b.fr.sections, []);
  assert.equal(b.fr.title, "D'où vient le nom B ?");
  const slides = b.media.formats[0].slides;
  assert.deepEqual(
    slides.map((s) => s.text),
    ["Un\n\nPremier corps.", "Deux", "Trois\n\nC. Auteur, Revue, 2001"]
  );
  assert.equal(slides[1].alt, "Une carte ancienne.");
  assert.match(slides[0].src, /^b\/b\/slide-01-[0-9a-f]{12}\.webp$/);
  assert.match(slides[2].src, /^b\/b\/slide-03-/);
  assert.deepEqual(
    b.sources.map((s) => s.title),
    ["C. Auteur, Revue, 2001"]
  );
  assert.equal(b.media.formats[0].credits, "Carte · Commons · domaine public");
  // The rendered derivatives exist where the relative paths say.
  for (const s of slides) {
    assert.ok(fs.existsSync(path.join(world.outDir, "derivatives", s.src)));
  }
});

test("a cross-post is one edition with several originals", async () => {
  const world = await buildWorld();
  await runImport(options(world, { write: true }));
  const b = readDraft(world, "b");
  assert.equal(b.media.edition.id, "b");
  assert.deepEqual(
    b.media.originals.map((o) => [o.network, o.publishedAt]),
    [
      ["instagram", "2026-09-16"],
      ["tiktok", "2026-09-16"],
    ]
  );
  const exceptions = candidate(
    await runImport(options(world)),
    "b"
  ).exceptions.map((e) => e.code);
  assert.ok(exceptions.includes("date-conflict"));
});

test("the corrected edition is shown, never the older URL", async () => {
  const world = await buildWorld();
  await runImport(options(world, { write: true }));
  const a = readDraft(world, "a");
  assert.equal(a.media.edition.id, "a");
  assert.equal(a.media.edition.supersedes, "a-old");
  assert.equal(
    a.media.edition.correctionNote,
    "Notre ancienne vidéo disait autre chose. Nous la corrigeons."
  );
  assert.equal(a.media.formats[0].youtubeId, "NEWNEWNEW01");
  assert.ok(!JSON.stringify(a).includes("OLDOLDOLD01"));
});

test("an older release in another format is recorded, not shown as a companion", async () => {
  const OLD_VIDEO_B = {
    ...VIDEO_A_OLD,
    id: "b-video",
    dir: "Peuples-B/b-video",
    date: "2026-09-05",
    channels: { youtube: "https://youtube.com/shorts/BVIDEOBVID1" },
    notes: "",
    links: { campaign: "b", content: "video" },
  };
  const world = await buildWorld({
    posts: [VIDEO_A_OLD, VIDEO_A_NEW, CAROUSEL_B, EMPTY_C, OLD_VIDEO_B],
  });
  const folder = path.join(
    world.postsRoot,
    "Publie",
    "2026-09-05",
    "Peuples-B",
    "b-video"
  );
  put(path.join(folder, "video", "b.mp4"), "old b video");
  await png(path.join(folder, "video", "thumbnail.png"), 99);
  const result = await runImport(options(world, { write: true }));
  const b = readDraft(world, "b");
  assert.deepEqual(
    b.media.formats.map((f) => f.kind),
    ["carousel"]
  );
  assert.ok(!JSON.stringify(b).includes("BVIDEOBVID1"));
  assert.ok(
    candidate(result, "b").exceptions.some(
      (e) => e.code === "edition-not-shown" && e.detail.includes("b-video")
    )
  );
});

test("two editions of one format with no ruling are refused, not guessed", async () => {
  const world = await buildWorld();
  const result = await runImport(options(world, { curation: {}, write: true }));
  const a = candidate(result, "a");
  assert.equal(a.disposition, "needs-recovery");
  assert.match(
    a.exceptions.map((e) => e.detail).join("\n"),
    /ambiguous selected release/
  );
  assert.ok(!fs.existsSync(path.join(world.articlesDir, "a.json")));
});

test("a correction note must be found verbatim in the workshop", async () => {
  const world = await buildWorld();
  const curation = structuredClone(CURATION);
  curation.supersedes[0].correctionNote.quote = "A sentence nobody wrote.";
  const result = await runImport(options(world, { curation }));
  assert.equal(candidate(result, "a").disposition, "needs-recovery");
  assert.match(
    JSON.stringify(candidate(result, "a").exceptions),
    /not found verbatim/
  );
});

test("a re-run is stable: same files, same bytes, no duplicates", async () => {
  const world = await buildWorld();
  await runImport(options(world, { write: true }));
  const first = snapshotTree(world.root);
  const second = await runImport(options(world, { write: true }));
  assert.deepEqual(snapshotTree(world.root), first);
  assert.deepEqual(
    second.candidates.filter((c) => c.draft).map((c) => c.draft.action),
    ["unchanged", "unchanged"]
  );
});

test("a draft edited by hand is never overwritten", async () => {
  const world = await buildWorld();
  await runImport(options(world, { write: true }));
  const file = path.join(world.articlesDir, "b.json");
  const edited = fs
    .readFileSync(file, "utf8")
    .replace(
      '"sections": []',
      '"sections": [{"heading": "H", "paragraphs": ["P"]}]'
    );
  fs.writeFileSync(file, edited);
  const result = await runImport(options(world, { write: true }));
  assert.equal(fs.readFileSync(file, "utf8"), edited);
  assert.equal(candidate(result, "b").draft.action, "refuse");
});

test("a source changed since the snapshot is refused", async () => {
  const world = await buildWorld();
  await runImport(options(world, { write: true }));
  const slide = path.join(
    world.postsRoot,
    "Publie",
    "2026-09-16",
    "Peuples-B",
    "b",
    "TikTok-Instagram",
    "b_02_carrousel_1080x1350.png"
  );
  await png(slide, 7);
  const result = await runImport(options(world, { write: true }));
  assert.equal(candidate(result, "b").disposition, "needs-recovery");
  assert.match(
    JSON.stringify(candidate(result, "b").exceptions),
    /changed since the snapshot/
  );
});

test("a hash declared by the release that does not match is refused", async () => {
  const world = await buildWorld({
    posts: [
      {
        ...VIDEO_A_NEW,
        renderedFrom: { "video.mp4": "a/video/release-01/video.mp4" },
      },
    ],
  });
  put(
    path.join(world.workshopRoot, "a", "video", "release-01", "delivery.json"),
    JSON.stringify({ video: { sha256: "0".repeat(64) } })
  );
  const result = await runImport(options(world, { curation: {} }));
  assert.equal(candidate(result, "a").disposition, "needs-recovery");
  assert.match(
    JSON.stringify(candidate(result, "a").exceptions),
    /delivery\.json/
  );
});

test("slug collisions and reserved segments are refused", async () => {
  const world = await buildWorld({
    posts: [
      {
        ...CAROUSEL_B,
        id: "galerie",
        channels: {},
        links: { campaign: "galerie", content: "carrousel" },
      },
    ],
  });
  const reserved = await runImport(options(world, { curation: {} }));
  assert.equal(candidate(reserved, "galerie").disposition, "needs-recovery");
  assert.match(
    JSON.stringify(candidate(reserved, "galerie").exceptions),
    /reserved/
  );

  const other = await buildWorld();
  put(
    path.join(other.articlesDir, "other.json"),
    JSON.stringify({ id: "other", status: "draft", fr: { slug: "b" } })
  );
  const clash = await runImport(options(other, { write: true }));
  assert.match(
    candidate(clash, "b")
      .exceptions.map((e) => e.detail)
      .join("\n"),
    /slug "b" is already used by other\.json/
  );
  assert.ok(!fs.existsSync(path.join(other.articlesDir, "b.json")));
});

test("a legacy dossier slug is reserved too", async () => {
  const world = await buildWorld({
    posts: [
      {
        ...CAROUSEL_B,
        id: "legacy-dossier",
        channels: {},
        links: { campaign: "legacy-dossier", content: "carrousel" },
      },
    ],
  });
  const result = await runImport(options(world, { curation: {} }));
  assert.match(
    JSON.stringify(candidate(result, "legacy-dossier").exceptions),
    /reserved/
  );
});

test("missing media is an explicit exception with a next action", async () => {
  const world = await buildWorld();
  const result = await runImport(options(world));
  const c = candidate(result, "c");
  assert.equal(c.disposition, "needs-recovery");
  assert.ok(c.exceptions.some((e) => e.code === "no-media" && e.next));
});

test("private roots and production notes never reach public output", async () => {
  const world = await buildWorld();
  await runImport(options(world, { write: true }));
  for (const file of fs.readdirSync(world.articlesDir)) {
    const text = fs.readFileSync(path.join(world.articlesDir, file), "utf8");
    assert.ok(!text.includes(world.library), file);
    assert.ok(!text.includes(os.homedir()), file);
    assert.ok(!text.includes("NOTE-PRIVEE"), file);
    assert.ok(!text.includes("Publie/"), file);
  }
});

test("an excerpt never comes from a caption file's working notes", async () => {
  const world = await buildWorld({
    posts: [{ ...VIDEO_A_NEW, copy: "_legendes/a.md" }],
  });
  put(
    path.join(world.workshopRoot, "_legendes", "a.md"),
    "# A\n\nRewritten and validated by the operator on 2026-09-25, after the full draft was shown.\n\n> D'où vient le nom A ? Une longue légende publiée sur les réseaux, assez longue pour servir.\n"
  );
  await runImport(options(world, { curation: {}, write: true }));
  const a = readDraft(world, "a");
  assert.ok(!JSON.stringify(a).includes("validated by the operator"));
  assert.equal(a.fr.excerpt, a.fr.title);
});

test("the command refuses to run without its private roots", () => {
  const tool = path.join(
    path.dirname(fileURLToPath(import.meta.url)),
    "run.mjs"
  );
  const run = spawnSync(process.execPath, [tool, "--out", os.tmpdir()], {
    env: {
      PATH: process.env.PATH,
      ETHNIAFRICA_SOCIAL_POSTS: "",
      ETHNIAFRICA_SOCIAL_PROJECTS: "",
    },
    cwd: os.tmpdir(),
    encoding: "utf8",
  });
  assert.notEqual(run.status, 0);
  assert.match(run.stderr, /ETHNIAFRICA_SOCIAL_(POSTS|PROJECTS)/);
});
