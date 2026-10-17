// @req REQ-186
import { test } from "node:test";
import assert from "node:assert/strict";
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
  n.link = { placement: "first-comment", url: "https://example.org/answer" };
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
    url: n.link.url,
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
  youtube.link = { placement: "caption", url: "https://example.org/answer" };
  youtube.caption += " https://example.org/answer";
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
  instagram.link = { placement: "caption", url: "https://example.org/answer" };
  instagram.caption += " https://example.org/answer";
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
    "Connaître nos noms, décoloniser leur emploi, nous nommer nous-mêmes.",
    "Cherchez Afrique sur EthniAfrica, lien en profil.",
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
