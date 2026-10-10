// @req REQ-186
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { createPackage, inspectPackage } from "./package.mjs";
import { packageFixture } from "./package.fixture.mjs";

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
