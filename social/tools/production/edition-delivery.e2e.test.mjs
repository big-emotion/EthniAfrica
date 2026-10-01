import assert from "node:assert/strict";
import { test } from "node:test";
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import { digest } from "./artifacts.mjs";
import { run } from "./edition-cli.mjs";
import { buildPublicationKit } from "./publication-kit.mjs";

const ASOF = ["--as-of", "2026-09-29"];
const source = { tier: "referenced", title: "Fixture source" };
const reviewer = { role: "reviewer", id: "independent-reviewer" };
const write = (root, path, value) =>
  writeFileSync(
    join(root, path),
    typeof value === "string" ? value : JSON.stringify(value, null, 2)
  );
const read = (root, path) => JSON.parse(readFileSync(join(root, path), "utf8"));

function fixtureEdition(format) {
  return {
    id: `fixture-${format}`,
    subject: { key: "fixture-subject", label: "Fixture subject" },
    angle: { id: "fixture-angle", question: "A fixture question?" },
    family: "historical-portrait",
    format,
    readiness: "pret",
    intendedNetworks: ["tiktok", "instagram"],
    claims: [{ id: "c1", kind: "person", sources: [source] }],
    media: [{ kind: "audio-excerpt" }],
  };
}

const INPUT_SPEC = {
  "claim:c1": { text: "Fixture claim, version 1" },
  "copy:card1": { path: "cards/card1.png" },
  "layout:card1": { text: "crop-a" },
  "audio:mix": { text: "mix-v1" },
  "destination:tiktok": { text: "tiktok-rules" },
  "destination:instagram": { text: "instagram-rules" },
};
const approval = (check, keys, inputs) => ({
  check,
  reviewer,
  reference: `Test-only approval of ${check}`,
  inputs: Object.fromEntries(keys.map((key) => [key, inputs[key]])),
});
const approvalsFor = (inputs, musicNetworks) => [
  approval("provenance", ["claim:c1"], inputs),
  approval("uncertainty", ["claim:c1", "copy:card1"], inputs),
  approval("attribution", ["claim:c1"], inputs),
  approval("intelligibility", ["copy:card1", "layout:card1"], inputs),
  approval("non-essentialising", ["copy:card1"], inputs),
  ...musicNetworks.map((network) =>
    approval("music", ["audio:mix", `destination:${network}`], inputs)
  ),
];

function carouselRoot() {
  const root = mkdtempSync(join(tmpdir(), "edition-e2e-"));
  mkdirSync(join(root, "cards"));
  for (const name of ["card1.png", "credits.md", "copy.md", "cover.png"])
    write(root, `cards/${name}`, `fixture ${name}`);
  write(root, "edition.json", fixtureEdition("carrousel"));
  write(root, "artifacts.json", {
    kind: "carousel",
    cards: ["cards/card1.png"],
    credits: "cards/credits.md",
    copy: "cards/copy.md",
    cover: "cards/cover.png",
  });
  write(root, "spec.json", INPUT_SPEC);
  return root;
}
const cli = (root, ...args) =>
  run([...args.slice(0, 1), root, ...args.slice(1)]);

// @req REQ-186
test("carousel: package, interrupted resumption, fixture publication, later reading", () => {
  const root = carouselRoot();
  try {
    const inputs = cli(root, "inputs", "--spec", "spec.json");
    write(root, "inputs.json", inputs);
    write(root, "approvals.json", approvalsFor(inputs, ["tiktok"]));
    const base = [
      "--edition",
      "edition.json",
      "--approvals",
      "approvals.json",
      "--inputs",
      "inputs.json",
    ];

    // 1. Package one destination. Instagram is not touched.
    const tiktok = cli(
      root,
      "package",
      ...base,
      ...ASOF,
      "--artifacts",
      "artifacts.json",
      "--network",
      "tiktok"
    );
    assert.equal(
      tiktok.path,
      "package/fixture-carrousel/tiktok/edition-package.json"
    );

    // 2. The session ends. A cold start knows what remains from the disk alone.
    const cold = cli(root, "status", ...base, "--networks", "tiktok,instagram");
    assert.deepEqual(
      cold.map(({ network, review, packaged, published }) => ({
        network,
        review,
        packaged,
        published,
      })),
      [
        {
          network: "tiktok",
          review: "complete",
          packaged: true,
          published: "none",
        },
        {
          network: "instagram",
          review: "incomplete",
          packaged: false,
          published: "none",
        },
      ]
    );
    assert.deepEqual(cold[1].open, ["music missing"]);

    // 3. Only the missing review is added; nothing else is asked again.
    write(
      root,
      "approvals.json",
      approvalsFor(inputs, ["tiktok", "instagram"])
    );
    cli(
      root,
      "package",
      ...base,
      ...ASOF,
      "--artifacts",
      "artifacts.json",
      "--network",
      "instagram"
    );

    // 4. A crop change stales the layout review alone, in both destinations.
    write(root, "spec.json", {
      ...INPUT_SPEC,
      "layout:card1": { text: "crop-b" },
    });
    write(root, "inputs.json", cli(root, "inputs", "--spec", "spec.json"));
    const recropped = cli(
      root,
      "status",
      ...base,
      "--networks",
      "tiktok,instagram"
    );
    assert.deepEqual(
      recropped.map((row) => row.open),
      [["intelligibility stale"], ["intelligibility stale"]]
    );
    write(root, "spec.json", INPUT_SPEC);
    write(root, "inputs.json", inputs);

    write(root, "metrics.json", {
      views: { value: 320, status: "observed", label: "Views" },
      saves: { value: null, status: "hidden", label: "Saves" },
    });
    // 5. A labelled fixture publication: not live, not a duplicate, not a closure.
    const fixture = cli(
      root,
      "occurrence",
      "--edition",
      "edition.json",
      "--network",
      "tiktok",
      "--url",
      "https://fixture.invalid/tiktok/7000000000000000009",
      "--published-at",
      "2026-10-02T09:00:00+02:00",
      "--fixture"
    );
    assert.equal(fixture.fixture, true);
    assert.equal(
      cli(root, "status", ...base, "--networks", "tiktok")[0].published,
      "none"
    );
    assert.throws(
      () =>
        cli(
          root,
          "observe",
          "--edition",
          "edition.json",
          "--network",
          "tiktok",
          "--metrics",
          "metrics.json",
          "--observed-at",
          "2026-10-09T09:30:00+02:00"
        ),
      /published occurrence/
    );

    // 6. The fixture yields only a fixture reading.
    write(root, "metrics.json", {
      views: { value: 320, status: "observed", label: "Views" },
      saves: { value: null, status: "hidden", label: "Saves" },
    });
    const fixtureReading = cli(
      root,
      "observe",
      "--edition",
      "edition.json",
      "--network",
      "tiktok",
      "--fixture",
      "--metrics",
      "metrics.json",
      "--observed-at",
      "2026-10-09T09:30:00+02:00"
    );
    assert.equal(fixtureReading.reading.fixture, true);
    assert.equal(fixtureReading.reading.window, "7d");

    // 7. A real posting is filed only with evidence, then read 7 days later.
    assert.throws(
      () =>
        cli(
          root,
          "occurrence",
          "--edition",
          "edition.json",
          "--network",
          "tiktok",
          "--url",
          "https://www.tiktok.com/@ethniafrica/photo/7000000000000000001",
          "--published-at",
          "2026-10-02T09:00:00+02:00"
        ),
      /evidence/
    );
    cli(
      root,
      "occurrence",
      "--edition",
      "edition.json",
      "--network",
      "tiktok",
      "--url",
      "https://www.tiktok.com/@ethniafrica/photo/7000000000000000001",
      "--published-at",
      "2026-10-02T09:00:00+02:00",
      "--evidence-reference",
      "Test-only attestation, no real post"
    );
    const after = cli(
      root,
      "status",
      ...base,
      "--networks",
      "tiktok,instagram"
    );
    assert.deepEqual(
      after.map((row) => row.published),
      ["published", "none"]
    );
    const live = cli(
      root,
      "observe",
      "--edition",
      "edition.json",
      "--network",
      "tiktok",
      "--metrics",
      "metrics.json",
      "--observed-at",
      "2026-10-09T09:30:00+02:00"
    );
    assert.equal(live.reading.fixture, undefined);
    assert.equal(live.added, 1);
    const lines = readFileSync(join(root, "observations.jsonl"), "utf8")
      .trim()
      .split("\n");
    assert.equal(lines.length, 2);
    assert.deepEqual(
      lines.map((line) => Boolean(JSON.parse(line).fixture)),
      [true, false]
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

const ffmpegAvailable = spawnSync("ffmpeg", ["-version"]).status === 0;

// @req REQ-186
test(
  "video: the existing publication kit is reused as the package's output",
  { skip: !ffmpegAvailable },
  () => {
    const root = mkdtempSync(join(tmpdir(), "edition-e2e-video-"));
    try {
      mkdirSync(join(root, "release"));
      const video = join(root, "release/video.mp4");
      const encoded = spawnSync("ffmpeg", [
        "-v",
        "error",
        "-f",
        "lavfi",
        "-i",
        "color=c=0x211c15:s=1080x1920:r=1:d=2",
        "-c:v",
        "libx264",
        "-pix_fmt",
        "yuv420p",
        video,
      ]);
      assert.equal(encoded.status, 0);
      const files = { "video.mp4": digest(readFileSync(video)) };
      for (const name of [
        "captions.srt",
        "narration.fr.txt",
        "CREDITS.md",
        "mobile-preview.png",
        "release-review.json",
      ]) {
        write(root, `release/${name}`, `Fixture ${name}`);
        files[name] = digest(readFileSync(join(root, "release", name)));
      }
      write(root, "release/delivery.json", {
        action: "finalize",
        ready_to_publish: true,
        proof_only: false,
        files,
        video: { duration: 2 },
      });
      write(root, "copy.md", "## TikTok\nFixture copy.\n");
      const kit = buildPublicationKit(root, {
        delivery: "release/delivery.json",
        copy: "copy.md",
        at: 0.5,
      });
      write(root, "edition.json", fixtureEdition("video"));
      write(root, "artifacts.json", {
        kind: "video",
        delivery: "release/delivery.json",
        kit: kit.path,
      });
      write(root, "spec.json", {
        ...INPUT_SPEC,
        "copy:card1": { text: "video copy" },
      });
      const inputs = cli(root, "inputs", "--spec", "spec.json");
      write(root, "inputs.json", inputs);
      write(root, "approvals.json", approvalsFor(inputs, ["tiktok"]));
      const packaged = cli(
        root,
        "package",
        "--edition",
        "edition.json",
        "--approvals",
        "approvals.json",
        "--inputs",
        "inputs.json",
        ...ASOF,
        "--artifacts",
        "artifacts.json",
        "--network",
        "tiktok"
      );
      const manifest = read(root, packaged.path);
      assert.deepEqual(
        manifest.output.files.map((f) => f.role),
        ["video", "subtitles", "credits", "copy", "cover"]
      );
      assert.equal(manifest.publication.performed, false);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  }
);
