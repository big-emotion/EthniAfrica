// @req REQ-186
import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import {
  readFileSync,
  writeFileSync,
  existsSync,
  copyFileSync,
  appendFileSync,
} from "node:fs";
import { join } from "node:path";
import { createPackage, inspectPackage } from "./package.mjs";
import { packageFixture } from "./package.fixture.mjs";
import { videoPackageFixture } from "./package-video.fixture.mjs";
import { seriesPackageFixture } from "./package-series.fixture.mjs";

// @req REQ-186
test("a checked package preserves media order, exact copy, credits and alternative text", (t) => {
  const f = packageFixture(t);
  const r = createPackage(f.root, f.configPath, f.output, [
    "instagram",
    "facebook",
  ]);
  assert.equal(r.media.length, 1);
  assert.equal(r.media[0].file, "01.png");
  const post = readFileSync(join(f.root, f.output, "post.md"), "utf8");
  assert.equal((post.match(/### Légende/g) || []).length, 2);
  assert.match(post, /Premier commentaire/);
  assert.match(post, /Placement du lien/);
  assert.match(post, /Aucun/);
  assert.ok(post.includes(f.config.networks[0].caption));
  assert.match(post, /credits/i);
  assert.doesNotThrow(() =>
    inspectPackage(f.root, f.output, ["instagram", "facebook"])
  );
  assert.throws(
    () =>
      createPackage(f.root, f.configPath, f.output, ["instagram", "facebook"]),
    /exists/
  );
});
// @req REQ-186
test("network additions need new package coverage; none are silently inherited", (t) => {
  const f = packageFixture(t);
  createPackage(f.root, f.configPath, f.output, ["instagram", "facebook"]);
  assert.throws(
    () => inspectPackage(f.root, f.output, ["instagram", "facebook", "tiktok"]),
    /network/i
  );
  f.config.networks.push({
    ...structuredClone(f.config.networks[0]),
    network: "tiktok",
  });
  f.save();
  assert.throws(
    () =>
      createPackage(f.root, f.configPath, "piece/tiktok", [
        "instagram",
        "facebook",
        "tiktok",
      ]),
    /TikTok.*preference/i
  );
  f.config.networks[2].captionPreference = {
    maxLength: 180,
    evidence: f.file("preference.txt", "Synthetic operator preference"),
  };
  f.save();
  assert.doesNotThrow(() =>
    createPackage(f.root, f.configPath, "piece/tiktok", [
      "instagram",
      "facebook",
      "tiktok",
    ])
  );
});
// @req REQ-186
test("link instructions require verified destination, account evidence and matching copy", (t) => {
  const f = packageFixture(t);
  const n = f.config.networks[1];
  n.link = {
    placement: "first-comment",
    url: "https://example.org/answer?utm_source=facebook&utm_medium=social&utm_campaign=test-01&utm_content=carrousel",
  };
  n.firstComment = n.link.url;
  f.save();
  assert.throws(
    () =>
      createPackage(f.root, f.configPath, f.output, ["instagram", "facebook"]),
    /destination|route/i
  );
  const research = JSON.parse(
    readFileSync(join(f.root, f.config.research), "utf8")
  );
  research.destination = {
    status: "verified",
    invitation: "Read the answer",
    url: "https://example.org/answer",
    checkedAt: "2026-10-10",
    support: "Synthetic observation",
    evidence: f.file("live.txt", "Synthetic answer capture"),
  };
  writeFileSync(join(f.root, f.config.research), JSON.stringify(research));
  n.capability.linkPlacements = ["none", "first-comment"];
  f.save();
  assert.doesNotThrow(() =>
    createPackage(f.root, f.configPath, f.output, ["instagram", "facebook"])
  );
});
// @req REQ-186
test("an unverified profile route, pinned comment, missing caption and excessive length refuse packaging", (t) => {
  for (const mutate of [
    (c) => {
      c.networks[0].link.placement = "profile";
    },
    (c) => {
      c.networks[0].link.placement = "pinned-comment";
    },
    (c) => {
      c.networks[0].caption = "";
    },
    (c) => {
      c.networks[0].capability.captionMax = 2;
    },
  ]) {
    const f = packageFixture(t);
    mutate(f.config);
    f.save();
    assert.throws(() =>
      createPackage(f.root, f.configPath, f.output, ["instagram", "facebook"])
    );
    assert.equal(existsSync(join(f.root, f.output)), false);
  }
});
// @req REQ-186
test("changed images, post text, card input or capability evidence invalidate the package", (t) => {
  for (const target of ["01.png", "post.md", "input", "evidence"]) {
    const f = packageFixture(t);
    createPackage(f.root, f.configPath, f.output, ["instagram", "facebook"]);
    const file =
      target === "input"
        ? f.config.input
        : target === "evidence"
          ? f.config.networks[0].capability.evidence
          : `${f.output}/${target}`;
    writeFileSync(join(f.root, file), "Changed");
    assert.throws(() =>
      inspectPackage(f.root, f.output, ["instagram", "facebook"])
    );
  }
});
// @req REQ-186
test("proof exports and editorial errors cannot become final packages", (t) => {
  const f = packageFixture(t);
  const reportPath = join(f.root, f.config.render, "report.json");
  const original = readFileSync(reportPath, "utf8");
  const report = JSON.parse(original);
  report.mode = "proof";
  report.productionReady = false;
  writeFileSync(reportPath, JSON.stringify(report));
  assert.throws(
    () =>
      createPackage(f.root, f.configPath, f.output, ["instagram", "facebook"]),
    /final/i
  );
  writeFileSync(reportPath, original);
  f.config.networks[0].caption = "Le corpus constitue un corpus.";
  f.save();
  assert.throws(
    () =>
      createPackage(f.root, f.configPath, f.output, ["instagram", "facebook"]),
    /language|editorial/i
  );
  assert.equal(existsSync(join(f.root, f.output)), false);
});
// @req REQ-186
test("alternative text and comments obey the verified account limits", (t) => {
  const f = packageFixture(t);
  f.config.networks[0].capability.altMax = 1;
  f.save();
  assert.throws(
    () =>
      createPackage(f.root, f.configPath, f.output, ["instagram", "facebook"]),
    /alternative/i
  );
  f.config.networks[0].capability.altMax = 5000;
  f.config.networks[0].firstComment = "Long comment";
  f.config.networks[0].capability.commentMax = 2;
  f.save();
  assert.throws(
    () =>
      createPackage(f.root, f.configPath, f.output, ["instagram", "facebook"]),
    /comment/i
  );
});

// @req REQ-186
test("delivery retains full source locators and image reuse credits without copying private passages", (t) => {
  const f = packageFixture(t);
  const research = JSON.parse(
    readFileSync(join(f.root, f.config.research), "utf8")
  );
  research.sources[0].citation = "A complete bibliography entry";
  research.sources[0].locator = "section 8, page 24";
  research.images = [
    {
      file: "social/design-system/assets/plain.png",
      sourcePage: "https://example.org/image/1",
      creator: "Fixture author",
      description: "Synthetic background",
      reuseBasis: "Fixture permission",
      credit: "Fixture author, image 1",
      crop: "Full image",
      rightsEvidence: f.file("rights.txt", "Synthetic permission"),
    },
  ];
  writeFileSync(join(f.root, f.config.research), JSON.stringify(research));
  createPackage(f.root, f.configPath, f.output, ["instagram", "facebook"]);
  const post = readFileSync(join(f.root, f.output, "post.md"), "utf8");
  assert.match(post, /section 8, page 24/);
  assert.match(post, /https:\/\/example.org\/image\/1/);
  assert.match(post, /Fixture permission/);
  assert.ok(!post.includes("Fixture evidence"));
});

// @req REQ-186
test("each rendered photograph or document needs an image-rights record before delivery", (t) => {
  const f = packageFixture(t);
  const p = join(f.root, f.config.research);
  const dossier = JSON.parse(readFileSync(p, "utf8"));
  dossier.images = [];
  writeFileSync(p, JSON.stringify(dossier));
  assert.throws(
    () =>
      createPackage(f.root, f.configPath, f.output, ["instagram", "facebook"]),
    /image.*record/i
  );
});

// @req REQ-186
test("network descriptions are complete, bounded and preserved without changing shared media", (t) => {
  const f = packageFixture(t);
  const n = f.config.networks[0];
  n.alternativeText = [
    { file: "01.png", text: "Un fond uni présente les noms." },
  ];
  n.capability.altMax = 30;
  f.save();
  createPackage(f.root, f.configPath, f.output, ["instagram", "facebook"]);
  const copy = JSON.parse(
    readFileSync(join(f.root, f.output, "public-copy.json"))
  );
  assert.deepEqual(copy.networks[0].alternativeText, [
    n.alternativeText[0].text,
  ]);
  assert.notEqual(
    copy.networks[1].alternativeText[0],
    n.alternativeText[0].text
  );
  assert.doesNotThrow(() =>
    inspectPackage(f.root, f.output, ["instagram", "facebook"])
  );
});

// @req REQ-186
test("network descriptions reject missing, duplicate, unknown, empty and excessive entries", (t) => {
  for (const entries of [
    [],
    [{ file: "02.png", text: "Texte" }],
    [{ file: "01.png", text: "" }],
    [{ file: "01.png", text: "A".repeat(501) }],
    [
      { file: "01.png", text: "A" },
      { file: "01.png", text: "B" },
    ],
  ]) {
    const f = packageFixture(t);
    f.config.networks[0].alternativeText = entries;
    f.config.networks[0].capability.altMax = 500;
    f.save();
    assert.throws(
      () =>
        createPackage(f.root, f.configPath, f.output, [
          "instagram",
          "facebook",
        ]),
      /alternative/i
    );
  }
});

// @req REQ-186
test("documented credit URLs do not imply a destination link, but unknown URLs are refused", (t) => {
  const f = packageFixture(t);
  f.config.networks[0].caption += " Crédit : https://example.org/test-image";
  f.save();
  assert.doesNotThrow(() =>
    createPackage(f.root, f.configPath, f.output, ["instagram", "facebook"])
  );
  f.config.networks[0].caption += " https://example.org/unverified";
  f.save();
  assert.throws(
    () =>
      createPackage(f.root, f.configPath, "piece/invalid", [
        "instagram",
        "facebook",
      ]),
    /URL|link/i
  );
});

// @req REQ-186
test("license URLs need rights evidence and network alternatives still undergo language review", (t) => {
  const f = packageFixture(t);
  const license = "https://creativecommons.org/licenses/by-sa/4.0/";
  f.config.networks[0].firstComment = `Licence : ${license}`;
  f.save();
  assert.throws(
    () =>
      createPackage(f.root, f.configPath, f.output, ["instagram", "facebook"]),
    /URL|link/i
  );
  f.file("rights.txt", `Synthetic permission. License: ${license}`);
  assert.doesNotThrow(() =>
    createPackage(f.root, f.configPath, f.output, ["instagram", "facebook"])
  );
  f.config.networks[0].alternativeText = [
    { file: "01.png", text: "Le corpus constitue un corpus." },
  ];
  f.save();
  assert.throws(
    () =>
      createPackage(f.root, f.configPath, "piece/bad-alt", [
        "instagram",
        "facebook",
      ]),
    /language|editorial/i
  );
});

const both = ["instagram", "facebook"];

// @req REQ-186
test("a final video package delivers the exact video, its on-screen text and each network's copy", (t) => {
  const f = videoPackageFixture(t);
  const r = createPackage(f.root, f.configPath, f.output, both);
  assert.deepEqual(
    r.media.map((m) => m.file),
    ["video.mp4"]
  );
  assert.deepEqual(
    readFileSync(join(f.root, f.output, "video.mp4")),
    readFileSync(join(f.root, f.final, "video.mp4"))
  );
  const post = readFileSync(join(f.root, f.output, "post.md"), "utf8");
  assert.equal((post.match(/### Légende/g) || []).length, 2);
  assert.match(post, /### Premier commentaire\n\nAucun/);
  assert.match(post, /### Placement du lien/);
  assert.match(post, /incrustés/);
  assert.match(post, /sous-titres automatiques/i);
  assert.ok(post.includes(f.config.networks[0].capability.altInstruction));
  const copy = JSON.parse(
    readFileSync(join(f.root, f.output, "public-copy.json"), "utf8")
  );
  for (const line of [
    "D'où vient le nom Sahara ?",
    "Ce que le mot désignait",
    "Sahara vient de l'arabe",
    "Source : al-Idrīsī, 1154",
    "« Pays des Noirs »",
    "Tout l'atlas des noms est en ligne.",
    "Retrouvez tout l'atlas",
  ])
    assert.ok(
      copy.screen.some((s) => s.replaceAll("\u00a0", " ") === line),
      line
    );
  assert.equal(copy.networks[0].caption, f.config.networks[0].caption);
  assert.doesNotThrow(() => inspectPackage(f.root, f.output, both));
  appendFileSync(join(f.root, f.output, "video.mp4"), "x");
  assert.throws(() => inspectPackage(f.root, f.output, both), /changed/i);
});

// @req REQ-186
test("demo, mockup and excerpt videos cannot become a final package", (t) => {
  for (const [mutate, pattern] of [
    [
      (f) => {
        const p = join(f.root, f.sequence);
        const seq = JSON.parse(readFileSync(p, "utf8"));
        seq.demo = "Illustrative copy";
        writeFileSync(p, JSON.stringify(seq));
        f.writeManifest((m) => (m.demo = true));
      },
      /demo|proof/i,
    ],
    [
      (f) => {
        copyFileSync(
          join(
            process.cwd(),
            "social/video/fixtures/synthetic-areas/noirs.geojson"
          ),
          join(f.root, "piece/video-input/areas/noirs.geojson")
        );
      },
      /mockup/i,
    ],
    [
      (f) => f.writeManifest((m) => (m.range = { from: 0, to: 30 })),
      /excerpt|proof/i,
    ],
    [(f) => f.writeManifest((m) => (m.demo = true)), /demo|proof/i],
  ]) {
    const f = videoPackageFixture(t);
    mutate(f);
    assert.throws(
      () => createPackage(f.root, f.configPath, f.output, both),
      pattern
    );
    assert.equal(existsSync(join(f.root, f.output)), false);
  }
});

// @req REQ-186
test("the video manifest must match the video bytes, the sequence, the voice and the accepted design", (t) => {
  for (const [mutate, pattern] of [
    [(f) => appendFileSync(join(f.root, f.final, "video.mp4"), "x"), /video/i],
    [
      (f) => {
        const p = join(f.root, f.sequence);
        const seq = JSON.parse(readFileSync(p, "utf8"));
        seq.chapters[0].title = "D'où vient ce nom";
        writeFileSync(p, JSON.stringify(seq));
      },
      /sequence/i,
    ],
    [
      (f) => f.writeManifest((m) => (m.audio.sha256 = "0".repeat(64))),
      /audio|voice/i,
    ],
    [(f) => f.writeManifest((m) => (m.frames -= 30)), /frame/i],
    [
      (f) =>
        f.file("video-design.json", {
          name: "EthniAfrica Vidéo carte",
          version: "0.4.0-proposition",
          status: "proposed",
        }),
      /design/i,
    ],
    [
      (f) =>
        f.file("video-design.json", {
          name: "EthniAfrica Vidéo carte",
          version: "0.5.0-proposition",
          status: "accepted",
        }),
      /design/i,
    ],
  ]) {
    const f = videoPackageFixture(t);
    mutate(f);
    assert.throws(
      () => createPackage(f.root, f.configPath, f.output, both),
      pattern
    );
  }
});

// @req REQ-186
test("the video account route bounds duration, aspect, copy and accessibility", (t) => {
  for (const [mutate, pattern] of [
    [(c) => (c.format = "photo-carousel"), /video/i],
    [(c) => (c.maxDurationSeconds = 10), /duration/i],
    [(c) => delete c.maxDurationSeconds, /duration/i],
    [(c) => (c.aspect = "4:5"), /aspect/i],
    [(c) => (c.captionMax = 2), /caption/i],
    [(c) => delete c.autoCaptions, /caption/i],
    [(c) => (c.altRoute = "native"), /alternative/i],
  ]) {
    const f = videoPackageFixture(t);
    mutate(f.config.networks[0].capability);
    f.save();
    assert.throws(
      () => createPackage(f.root, f.configPath, f.output, both),
      pattern
    );
  }
});

// @req REQ-186
test("a native alternative text route carries the network's description of the video", (t) => {
  const f = videoPackageFixture(t);
  const n = f.config.networks[0];
  n.capability.altRoute = "native";
  n.capability.altMax = 100;
  n.alternativeText = [
    {
      file: "video.mp4",
      text: "Une carte du Sahara montre trois bandes de terre.",
    },
  ];
  f.save();
  createPackage(f.root, f.configPath, f.output, both);
  const post = readFileSync(join(f.root, f.output, "post.md"), "utf8");
  assert.ok(post.includes(n.alternativeText[0].text));
  const copy = JSON.parse(
    readFileSync(join(f.root, f.output, "public-copy.json"), "utf8")
  );
  assert.deepEqual(copy.networks[0].alternativeText, [
    n.alternativeText[0].text,
  ]);
  assert.deepEqual(copy.networks[1].alternativeText, []);
});

// @req REQ-186
test("video links follow the data-driven account routes and the existing network rules", (t) => {
  const destination = (f) => {
    const p = join(f.root, f.config.research);
    const research = JSON.parse(readFileSync(p, "utf8"));
    research.destination = {
      status: "verified",
      invitation: "Read the answer",
      url: "https://example.org/answer",
      checkedAt: "2026-10-13",
      support: "Synthetic observation",
      evidence: f.file("live.txt", "Synthetic answer capture"),
    };
    writeFileSync(p, JSON.stringify(research));
  };
  const networks = ["youtube", "instagram"];
  const f = videoPackageFixture(t, networks);
  destination(f);
  const youtube = f.config.networks[0];
  const youtubeLink =
    "https://example.org/answer?utm_source=youtube&utm_medium=social&utm_campaign=test-01&utm_content=video";
  youtube.link = { placement: "caption", url: youtubeLink };
  youtube.caption += ` ${youtubeLink}`;
  f.save();
  assert.throws(
    () => createPackage(f.root, f.configPath, f.output, networks),
    /route/i
  );
  youtube.capability.linkPlacements = ["none", "caption"];
  f.save();
  assert.doesNotThrow(() =>
    createPackage(f.root, f.configPath, f.output, networks)
  );
  const instagram = f.config.networks[1];
  const instagramLink =
    "https://example.org/answer?utm_source=instagram&utm_medium=social&utm_campaign=test-01&utm_content=video";
  instagram.link = { placement: "caption", url: instagramLink };
  instagram.caption += ` ${instagramLink}`;
  instagram.capability.linkPlacements = ["none", "caption"];
  f.save();
  assert.throws(
    () => createPackage(f.root, f.configPath, "piece/instagram", networks),
    /clickable caption link/i
  );
});

// @req REQ-186
test("an optional cover is the video's own declared frame", (t) => {
  const f = videoPackageFixture(t);
  f.config.cover = { frame: 30 };
  f.save();
  const r = createPackage(f.root, f.configPath, f.output, both);
  assert.deepEqual(
    r.media.map((m) => m.file),
    ["video.mp4", "cover.png"]
  );
  const png = readFileSync(join(f.root, f.output, "cover.png"));
  assert.equal(png.readUInt32BE(16), 1080);
  assert.equal(png.readUInt32BE(20), 1920);
  assert.match(
    readFileSync(join(f.root, f.output, "post.md"), "utf8"),
    /cover\.png/
  );
  assert.doesNotThrow(() => inspectPackage(f.root, f.output, both));
  f.config.cover = { frame: 100000 };
  f.save();
  assert.throws(
    () => createPackage(f.root, f.configPath, "piece/far", both),
    /cover|frame/i
  );
});

// @req REQ-186
test("a final series video package delivers the video, the words its cards and subtitles print, and each network's copy", (t) => {
  const f = seriesPackageFixture(t);
  const r = createPackage(f.root, f.configPath, f.output, both);
  assert.deepEqual(
    r.media.map((m) => m.file),
    ["video.mp4"]
  );
  assert.deepEqual(
    readFileSync(join(f.root, f.output, "video.mp4")),
    readFileSync(join(f.root, f.final, "video.mp4"))
  );
  const copy = JSON.parse(
    readFileSync(join(f.root, f.output, "public-copy.json"), "utf8")
  );
  const screen = copy.screen.map((s) => s.replaceAll(" ", " "));
  for (const line of [
    "Un continent entier",
    "Un continent immense",
    "d'habitants",
    "Florence Abena Dolphyne",
    "L'Afrique n'est pas un seul bloc.",
    "Le continent compte 54 pays,",
    // 1.10.0: the closing line and the fixed invitation.
    "L’importance de connaître nos noms.",
    "Vous pouvez continuer la recherche sur EthniAfrica, lien en profil.",
    "le pays des Noirs",
  ])
    assert.ok(screen.includes(line), line);
  // File names, identifiers and the voice's spoken forms are not on screen.
  assert.ok(!screen.some((s) => /\.jpg$|^serie-afrique|^nuit$/.test(s)));
  const post = readFileSync(join(f.root, f.output, "post.md"), "utf8");
  assert.match(post, /## On-screen text/);
  assert.match(post, /incrustés/);
  assert.doesNotThrow(() => inspectPackage(f.root, f.output, both));
  appendFileSync(join(f.root, f.output, "video.mp4"), "x");
  assert.throws(() => inspectPackage(f.root, f.output, both), /changed/i);
});

// @req REQ-186
test("a series video's manifest must match the video, its sequence, its cards, the voice and the accepted design", (t) => {
  const edit = (f, file, change) => {
    const p = join(f.root, file);
    const json = JSON.parse(readFileSync(p, "utf8"));
    change(json);
    writeFileSync(p, JSON.stringify(json));
  };
  for (const [mutate, pattern] of [
    [(f) => appendFileSync(join(f.root, f.final, "video.mp4"), "x"), /video/i],
    [
      (f) =>
        edit(f, f.sequence, (s) => (s.chapters[0].title = "Un autre titre")),
      /sequence/i,
    ],
    [
      (f) =>
        edit(f, f.cards, (d) => (d.cards[1].title = "Un continent très grand")),
      /cards|sequence/i,
    ],
    [
      (f) => f.writeManifest((m) => (m.audio.sha256 = "0".repeat(64))),
      /audio|voice/i,
    ],
    [(f) => f.writeManifest((m) => (m.frames -= 30)), /frame/i],
    [(f) => f.writeManifest((m) => (m.demo = true)), /demo|proof/i],
    [
      (f) =>
        f.file("video-design.json", {
          name: "EthniAfrica Cartes",
          version: "0.1.0-proposition",
          status: "accepted",
        }),
      /design/i,
    ],
  ]) {
    const f = seriesPackageFixture(t);
    mutate(f);
    assert.throws(
      () => createPackage(f.root, f.configPath, f.output, both),
      pattern
    );
    assert.equal(existsSync(join(f.root, f.output)), false);
  }
});

// @req REQ-186
test("each image a series video shows needs a research and rights record", (t) => {
  const f = seriesPackageFixture(t);
  const p = join(f.root, f.config.research);
  const research = JSON.parse(readFileSync(p, "utf8"));
  research.images = research.images.slice(1);
  writeFileSync(p, JSON.stringify(research));
  assert.throws(
    () => createPackage(f.root, f.configPath, f.output, both),
    /research\/rights record/
  );
});

// The Lingala answer at its name address (REQ-200), and the search page's
// reading of the same name that packages sent readers to before it.
const LINGALA = "https://ethniafrica.com/fr/atlas/recherche/lingala";
const LINGALA_SEARCH = "https://ethniafrica.com/fr/atlas/recherche?q=Lingala";

// A carousel whose Facebook first comment carries `url`, with the Lingala answer
// (or `destination`) as the verified destination of the campaign langue-07.
function lingalaPiece(t, url, destination = LINGALA) {
  const f = packageFixture(t);
  const p = join(f.root, f.config.research);
  const research = JSON.parse(readFileSync(p, "utf8"));
  research.destination = {
    status: "verified",
    invitation: "Lire la réponse",
    url: destination,
    checkedAt: "2026-10-17",
    support: "Synthetic observation",
    evidence: f.file("live.txt", "Synthetic answer capture"),
  };
  writeFileSync(p, JSON.stringify(research));
  f.config.campaign = "langue-07";
  const facebook = f.config.networks[1];
  facebook.link = { placement: "first-comment", url };
  facebook.firstComment = url;
  facebook.capability.linkPlacements = ["none", "first-comment"];
  f.save();
  return f;
}

// @req REQ-186
test("a link tagged for its network and the piece's campaign is delivered exactly", (t) => {
  const tagged =
    "https://ethniafrica.com/fr/atlas/recherche/lingala?utm_source=facebook&utm_medium=social&utm_campaign=langue-07&utm_content=carrousel";
  const f = lingalaPiece(t, tagged);
  createPackage(f.root, f.configPath, f.output, both);
  const post = readFileSync(join(f.root, f.output, "post.md"), "utf8");
  assert.ok(post.includes(`### Premier commentaire\n\n${tagged}\n`));
  assert.doesNotThrow(() => inspectPackage(f.root, f.output, both));
});

// @req REQ-186
test("a bare link to the verified destination is refused for want of its campaign tag", (t) => {
  const f = lingalaPiece(t, LINGALA);
  assert.throws(
    () => createPackage(f.root, f.configPath, f.output, both),
    /campaign tag/i
  );
  assert.equal(existsSync(join(f.root, f.output)), false);
});

// @req REQ-186
test("a link tagged for another network, campaign or format is refused", (t) => {
  for (const url of [
    `${LINGALA}?utm_source=instagram&utm_medium=social&utm_campaign=langue-07&utm_content=carrousel`,
    `${LINGALA}?utm_source=facebook&utm_medium=social&utm_campaign=langue-08&utm_content=carrousel`,
    `${LINGALA}?utm_source=facebook&utm_medium=social&utm_campaign=langue-07&utm_content=video`,
  ]) {
    const f = lingalaPiece(t, url);
    assert.throws(
      () => createPackage(f.root, f.configPath, f.output, both),
      /campaign tag/i,
      url
    );
  }
});

// @req REQ-186
test("a verified destination that already carries utm tags or a fragment is refused", (t) => {
  const tags =
    "utm_source=facebook&utm_medium=social&utm_campaign=langue-07&utm_content=carrousel";
  for (const destination of [
    `${LINGALA}?utm_source=newsletter`,
    `${LINGALA}#origine`,
  ]) {
    // The link is the destination with this piece's tags appended, so only
    // the destination itself can be at fault.
    const f = lingalaPiece(t, `${destination}&${tags}`, destination);
    assert.throws(
      () => createPackage(f.root, f.configPath, f.output, both),
      /bare page/i,
      destination
    );
    assert.equal(existsSync(join(f.root, f.output)), false);
  }
});

const FACEBOOK_TAGS =
  "utm_source=facebook&utm_medium=social&utm_campaign=langue-07&utm_content=carrousel";

// @req REQ-186
test("a new delivery sends a name to its address, not to the search page's ?q= reading", (t) => {
  const f = lingalaPiece(
    t,
    `${LINGALA_SEARCH}&${FACEBOOK_TAGS}`,
    LINGALA_SEARCH
  );
  assert.throws(
    () => createPackage(f.root, f.configPath, f.output, both),
    (error) =>
      /name's address/.test(error.message) && error.message.includes(LINGALA)
  );
  assert.equal(existsSync(join(f.root, f.output)), false);
});

// @req REQ-186
test("a name address in another case is refused, because it answers with a redirect", (t) => {
  const capitalised = "https://ethniafrica.com/fr/atlas/recherche/Lingala";
  const f = lingalaPiece(t, `${capitalised}?${FACEBOOK_TAGS}`, capitalised);
  assert.throws(
    () => createPackage(f.root, f.configPath, f.output, both),
    (error) => /redirect/.test(error.message) && error.message.includes(LINGALA)
  );
  // The accents are the corpus spelling, so they stay in the address.
  const traore = "https://ethniafrica.com/fr/atlas/recherche/traor%C3%A9";
  const accented = lingalaPiece(t, `${traore}?${FACEBOOK_TAGS}`, traore);
  assert.doesNotThrow(() =>
    createPackage(accented.root, accented.configPath, accented.output, both)
  );
});

// Turns a delivered revision into one created before name addresses: its
// dossier, input and delivered copy send the reader to the search page's
// reading of the name, and the manifest fingerprints the rewritten files.
function deliveredToSearchPage(f) {
  const files = [
    f.config.research,
    f.configPath,
    `${f.output}/post.md`,
    `${f.output}/public-copy.json`,
  ];
  for (const file of files)
    writeFileSync(
      join(f.root, file),
      readFileSync(join(f.root, file), "utf8")
        .replaceAll(`${LINGALA}?`, `${LINGALA_SEARCH}&`)
        .replaceAll(LINGALA, LINGALA_SEARCH)
    );
  const sha = (file) =>
    createHash("sha256")
      .update(readFileSync(join(f.root, file)))
      .digest("hex");
  const manifestFile = join(f.root, f.output, "package.json");
  const manifest = JSON.parse(readFileSync(manifestFile, "utf8"));
  manifest.dependencies[f.config.research] = sha(f.config.research);
  manifest.dependencies[f.configPath] = sha(f.configPath);
  for (const name of ["post.md", "public-copy.json"])
    manifest.files[name] = sha(`${f.output}/${name}`);
  writeFileSync(manifestFile, JSON.stringify(manifest, null, 2) + "\n");
}

// @req REQ-186
test("a revision delivered to the search page before name addresses still verifies", (t) => {
  const f = lingalaPiece(t, `${LINGALA}?${FACEBOOK_TAGS}`);
  createPackage(f.root, f.configPath, f.output, both);
  deliveredToSearchPage(f);
  assert.ok(
    readFileSync(join(f.root, f.output, "post.md"), "utf8").includes(
      `${LINGALA_SEARCH}&${FACEBOOK_TAGS}`
    )
  );
  assert.doesNotThrow(() => inspectPackage(f.root, f.output, both));
});

// @req REQ-186
test("a series video carries its YouTube link tagged as a video", (t) => {
  const networks = ["youtube", "instagram"];
  const f = seriesPackageFixture(t, networks);
  const p = join(f.root, f.config.research);
  const research = JSON.parse(readFileSync(p, "utf8"));
  research.destination = {
    status: "verified",
    invitation: "Lire la réponse",
    url: LINGALA,
    checkedAt: "2026-10-17",
    support: "Synthetic observation",
    evidence: f.file("live.txt", "Synthetic answer capture"),
  };
  writeFileSync(p, JSON.stringify(research));
  const youtube = f.config.networks[0];
  const caption = youtube.caption;
  const tagged = `${LINGALA}?utm_source=youtube&utm_medium=social&utm_campaign=${f.config.campaign}&utm_content=video`;
  youtube.link = { placement: "caption", url: tagged };
  youtube.caption = `${caption} ${tagged}`;
  youtube.capability.linkPlacements = ["none", "caption"];
  f.save();
  createPackage(f.root, f.configPath, f.output, networks);
  assert.ok(
    readFileSync(join(f.root, f.output, "post.md"), "utf8").includes(tagged)
  );
  const asCarousel = tagged.replace(
    "utm_content=video",
    "utm_content=carrousel"
  );
  youtube.link.url = asCarousel;
  youtube.caption = `${caption} ${asCarousel}`;
  f.save();
  assert.throws(
    () => createPackage(f.root, f.configPath, "piece/carrousel", networks),
    /campaign tag/i
  );
});

// @req REQ-186
test("a new delivery needs a campaign written as a lowercase slug", (t) => {
  for (const campaign of ["Langue 07", "langue_07", "", undefined]) {
    const f = packageFixture(t);
    f.config.campaign = campaign;
    f.save();
    assert.throws(
      () => createPackage(f.root, f.configPath, f.output, both),
      /campaign/i,
      String(campaign)
    );
  }
});

// @req REQ-186
test("a profile link is tagged as the bio link, not as the post", (t) => {
  const bio = `${LINGALA}?utm_source=instagram&utm_medium=social&utm_campaign=langue-07&utm_content=bio`;
  const f = lingalaPiece(t, LINGALA);
  f.config.networks[1].link = { placement: "none" };
  f.config.networks[1].firstComment = null;
  const instagram = f.config.networks[0];
  instagram.link = { placement: "profile", url: bio };
  instagram.capability.linkPlacements = ["none", "profile"];
  f.save();
  createPackage(f.root, f.configPath, f.output, both);
  assert.ok(
    readFileSync(join(f.root, f.output, "post.md"), "utf8").includes(bio)
  );
  instagram.link.url = bio.replace("utm_content=bio", "utm_content=carrousel");
  f.save();
  assert.throws(
    () => createPackage(f.root, f.configPath, "piece/carrousel", both),
    /campaign tag/i
  );
});

// Turns a delivered revision into one written before campaigns existed: its
// input has no campaign, and Facebook's tagged link, when there is one, is
// `bareLink` in the input and in the delivered copy. The manifest then
// fingerprints the rewritten files, as `create` did at the time.
function writtenBeforeCampaigns(f, bareLink) {
  const facebook = f.config.networks[1];
  const tagged = facebook.link.url;
  if (tagged) {
    facebook.link.url = bareLink;
    facebook.firstComment = bareLink;
  }
  delete f.config.campaign;
  f.save();
  const sha = (file) =>
    createHash("sha256")
      .update(readFileSync(join(f.root, file)))
      .digest("hex");
  const manifestFile = join(f.root, f.output, "package.json");
  const manifest = JSON.parse(readFileSync(manifestFile, "utf8"));
  for (const name of ["post.md", "public-copy.json"]) {
    const file = `${f.output}/${name}`;
    if (tagged)
      writeFileSync(
        join(f.root, file),
        readFileSync(join(f.root, file), "utf8").replaceAll(tagged, bareLink)
      );
    manifest.files[name] = sha(file);
  }
  manifest.dependencies[f.configPath] = sha(f.configPath);
  writeFileSync(manifestFile, JSON.stringify(manifest, null, 2) + "\n");
}

// @req REQ-186
test("a revision written before campaigns existed still verifies without one", (t) => {
  const f = packageFixture(t);
  createPackage(f.root, f.configPath, f.output, both);
  writtenBeforeCampaigns(f);
  assert.doesNotThrow(() => inspectPackage(f.root, f.output, both));
});

// @req REQ-186
test("a revision written before campaigns keeps its bare link only when it is the verified destination", (t) => {
  const tagged = `${LINGALA}?utm_source=facebook&utm_medium=social&utm_campaign=langue-07&utm_content=carrousel`;
  const f = lingalaPiece(t, tagged);
  createPackage(f.root, f.configPath, f.output, both);
  writtenBeforeCampaigns(f, LINGALA);
  assert.match(
    readFileSync(join(f.root, f.output, "post.md"), "utf8"),
    /### Premier commentaire\n\nhttps:\/\/ethniafrica\.com\/fr\/atlas\/recherche\/lingala\n/
  );
  assert.doesNotThrow(() => inspectPackage(f.root, f.output, both));
  const other = lingalaPiece(t, tagged);
  createPackage(other.root, other.configPath, other.output, both);
  writtenBeforeCampaigns(
    other,
    "https://ethniafrica.com/fr/atlas/recherche/kikongo"
  );
  assert.throws(
    () => inspectPackage(other.root, other.output, both),
    /verified destination/i
  );
});
