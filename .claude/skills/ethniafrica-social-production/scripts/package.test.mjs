// @req REQ-186
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { createPackage, inspectPackage } from "./package.mjs";
import { packageFixture } from "./package.fixture.mjs";

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
