// @req REQ-186
// Rendering acceptance. The imagery is not in git: point
// ETHNIAFRICA_VIDEO_ASSETS at the folder holding the verified files.
// A missing folder fails; it is never reported as a pass.
import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { mkdtemp, readFile, rm, symlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import sharp from "sharp";
import { loadSequence, frameState, frameCount, project } from "./sequence.mjs";
import { renderFrame, renderFrames, encodeVideo } from "./render.mjs";
import { PAGE_HTML } from "./page.mjs";

const assets = process.env.ETHNIAFRICA_VIDEO_ASSETS;
const congo = JSON.parse(
  await readFile(new URL("./fixtures/congo.sequence.json", import.meta.url))
);
const sequence = () => loadSequence(structuredClone(congo));
const options = () => {
  assert.ok(assets, "Set ETHNIAFRICA_VIDEO_ASSETS to the verified imagery");
  return { assets };
};

// @req REQ-186
test("a frame renders at 1080 × 1920 and repeats pixel for pixel", async () => {
  const first = await renderFrame(sequence(), 240, options());
  const again = await renderFrame(sequence(), 240, options());
  const meta = await sharp(first).metadata();
  assert.equal(meta.width, 1080);
  assert.equal(meta.height, 1920);
  const [a, b] = await Promise.all(
    [first, again].map((png) => sharp(png).raw().toBuffer())
  );
  assert.ok(a.equals(b), "same frame number, same pixels");
});

// @req REQ-186
test("the globe, the travel and the hold are distinct frames", async () => {
  const pixels = await Promise.all(
    [0, 90, 330].map(async (f) =>
      sharp(await renderFrame(sequence(), f, options()))
        .raw()
        .toBuffer()
    )
  );
  assert.ok(!pixels[0].equals(pixels[1]));
  assert.ok(!pixels[1].equals(pixels[2]));
});

// @req REQ-186
test("the encoded file has the size, rate, duration and no sound", async () => {
  const dir = await mkdtemp(join(tmpdir(), "ethniafrica-video-"));
  try {
    const { file, manifest } = await encodeVideo(sequence(), dir, options());
    const probe = JSON.parse(
      execFileSync("ffprobe", [
        "-v",
        "error",
        "-count_frames",
        "-show_streams",
        "-show_format",
        "-of",
        "json",
        file,
      ])
    );
    const video = probe.streams.filter((s) => s.codec_type === "video");
    assert.equal(video.length, 1);
    assert.equal(
      probe.streams.filter((s) => s.codec_type === "audio").length,
      0
    );
    const [v] = video;
    assert.equal(v.codec_name, "h264");
    assert.equal(v.pix_fmt, "yuv420p");
    assert.equal(v.width, 1080);
    assert.equal(v.height, 1920);
    assert.equal(v.r_frame_rate, "30/1");
    assert.equal(Number(v.nb_read_frames), 360);
    assert.ok(Math.abs(Number(probe.format.duration) - 12) < 0.05);

    assert.equal(manifest.frames, 360);
    assert.equal(manifest.productionReady, false);
    for (const key of ["sequence", "imagery", "engine"])
      assert.ok(manifest.hashes[key], `${key} hash`);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

// @req REQ-186
test("unverified imagery files are refused before rendering", async () => {
  await assert.rejects(
    renderFrame(sequence(), 0, { assets: tmpdir() }),
    /imagery/i
  );
});

const west = JSON.parse(
  await readFile(
    new URL("./fixtures/west-areas.sequence.json", import.meta.url)
  )
);

async function windowStats(png, cx, cy, size) {
  const { data } = await sharp(png)
    .extract({
      left: cx - size / 2,
      top: cy - size / 2,
      width: size,
      height: size,
    })
    .raw()
    .toBuffer({ resolveWithObject: true });
  const mean = [0, 0, 0];
  const lum = [];
  for (let i = 0; i < data.length; i += 3) {
    for (let c = 0; c < 3; c++) mean[c] += data[i + c] / (data.length / 3);
    lum.push(0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2]);
  }
  const avg = lum.reduce((a, b) => a + b) / lum.length;
  const sd = Math.sqrt(
    lum.reduce((a, b) => a + (b - avg) ** 2, 0) / lum.length
  );
  return { mean, sd, max: Math.max(...lum) };
}

// @req REQ-186
test("areas, hatching and borders are drawn on the hold frame", async () => {
  // 6.4 s: the camera has landed and nothing is drawn yet. The sample
  // points sit inside each area, clear of names, borders and edges.
  const seq = () => loadSequence(structuredClone(west));
  const [before, hold] = await Promise.all(
    [192, 359].map((f) => renderFrame(seq(), f, options()))
  );
  const amber = [232, 185, 106];
  const distance = (rgb) => Math.hypot(...rgb.map((v, i) => v - amber[i]));
  const a = [
    await windowStats(before, 466, 614, 16),
    await windowStats(hold, 466, 614, 16),
  ];
  assert.ok(
    distance(a[1].mean) < distance(a[0].mean) - 15,
    "certain area A takes its amber fill"
  );
  const control = [
    await windowStats(before, 838, 790, 16),
    await windowStats(hold, 838, 790, 16),
  ];
  assert.ok(
    Math.hypot(...control[1].mean.map((v, i) => v - control[0].mean[i])) < 8,
    "ground outside every area is left as it was"
  );
  const c = [
    await windowStats(before, 878, 586, 36),
    await windowStats(hold, 878, 586, 36),
  ];
  assert.ok(c[1].sd > c[0].sd + 10, "uncertain area C is hatched");
  const border = [
    await windowStats(before, 890, 919, 24),
    await windowStats(hold, 890, 919, 24),
  ];
  assert.ok(border[1].max > border[0].max + 40, "the quiet border is drawn");
});

// @req REQ-186
test("a relief frame repeats pixel for pixel and differs from the flat frame", async () => {
  const seq = (style) => loadSequence({ ...structuredClone(west), style });
  const [first, again, flat] = await Promise.all([
    renderFrame(seq("relief"), 359, options()),
    renderFrame(seq("relief"), 359, options()),
    renderFrame(seq("flat"), 359, options()),
  ]);
  const [a, b, c] = await Promise.all(
    [first, again, flat].map((png) => sharp(png).raw().toBuffer())
  );
  assert.ok(a.equals(b), "same frame number, same pixels");
  assert.ok(!a.equals(c), "relief is not the flat map");
});

// @req REQ-186
test("a relief video needs the verified height model", async () => {
  const dir = await mkdtemp(join(tmpdir(), "ethniafrica-relief-"));
  try {
    await symlink(
      join(resolve(options().assets), "imagery"),
      join(dir, "imagery")
    );
    await assert.rejects(
      renderFrame(
        loadSequence({ ...structuredClone(west), style: "relief" }),
        0,
        { assets: dir }
      ),
      /relief/i
    );
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

// Chained chapters (0.3.0-proposition) in the « plein écran » layout of
// 0.4.0-proposition. The flat style keeps these renders short; the relief
// proof is inspected by eye. Chapter 5 draws the synthetic octagon so the
// dotted-line check knows where an edge runs.
const fixtures = new URL("./fixtures/", import.meta.url);
const saharaJson = JSON.parse(
  await readFile(new URL("sahara.chapters.sequence.json", fixtures))
);
const sahara = (ending) => {
  const input = { ...structuredClone(saharaJson), style: "flat" };
  if (ending) input.ending = ending;
  Object.assign(input.chapters[4].outline, {
    file: "synthetic-outline.geojson",
    illustrative: true,
  });
  return loadSequence(input, { dir: fixtures });
};
const pixel = async (png, x, y) => {
  const { data } = await sharp(png)
    .extract({ left: x, top: y, width: 1, height: 1 })
    .raw()
    .toBuffer({ resolveWithObject: true });
  return [data[0], data[1], data[2]];
};
const inkDistance = (rgb, hex) =>
  Math.hypot(
    ...rgb.map((v, i) => v - parseInt(hex.slice(1 + 2 * i, 3 + 2 * i), 16))
  );

// The subtitle band's letters (pixels close to the subtitle ink), and the
// share of them whose left edge has a dark stroke within 5 px.
async function subtitleInk(png) {
  const { data, info } = await sharp(png)
    .extract({ left: 60, top: 1316, width: 960, height: 136 })
    .raw()
    .toBuffer({ resolveWithObject: true });
  const at = (x, y) => {
    const i = (y * info.width + x) * info.channels;
    return [data[i], data[i + 1], data[i + 2]];
  };
  const letter = (x, y) => inkDistance(at(x, y), "#fffaf2") < 24;
  const dark = (x, y) => {
    const [r, g, b] = at(x, y);
    return 0.2126 * r + 0.7152 * g + 0.0722 * b < 30;
  };
  let letters = 0;
  let edges = 0;
  let edged = 0;
  for (let y = 0; y < info.height; y++)
    for (let x = 6; x < info.width; x++) {
      if (!letter(x, y)) continue;
      letters++;
      if (letter(x - 1, y)) continue;
      edges++;
      if ([2, 3, 4, 5].some((d) => dark(x - d, y))) edged++;
    }
  return { letters, edged: edges ? edged / edges : 0 };
}

// Mean colour difference of two frames over a box.
async function difference(a, b, box) {
  const [pa, pb] = await Promise.all(
    [a, b].map((png) => sharp(png).extract(box).raw().toBuffer())
  );
  let sum = 0;
  for (let i = 0; i < pa.length; i++) sum += Math.abs(pa[i] - pb[i]);
  return sum / pa.length;
}

// @req REQ-186
test("a chapter hold draws its marker bars and an outlined subtitle on the image; the band is empty between chapters", async () => {
  // 28 s: chapter 3 of 5 reads « l'Afrique à l'ouest / de l'Égypte. ».
  // 23.9 s: chapter 2 has left and chapter 3 has not entered.
  const [hold, gap] = await renderFrames(sahara(), [840, 717], options());
  const bars = ["#a8977f", "#a8977f", "#e8b96a", "#4a3c2c", "#4a3c2c"];
  for (const [j, ink] of bars.entries())
    assert.ok(
      inkDistance(await pixel(hold, 74 + j * 34, 260), ink) < 12,
      `bar ${j + 1} is ${ink}`
    );
  const [text, empty] = [await subtitleInk(hold), await subtitleInk(gap)];
  assert.ok(text.letters > 2000, `the subtitle is drawn (${text.letters})`);
  assert.ok(
    text.edged > 0.9,
    `a dark stroke edges the letters (${text.edged})`
  );
  // Beside the centred lines the ground is the gap frame's: no band.
  const beside = { left: 70, top: 1320, width: 150, height: 128 };
  assert.ok((await difference(hold, gap, beside)) < 2, "no band behind");
  assert.ok(empty.letters < 50, "the band is empty between chapters");
});

// @req REQ-186
test("an area named by a chunk is drawn once it has entered", async () => {
  // 20.0 s: « désert » has entered; « pays des Berbères » enters at 20.1 s
  // and is whole by 21.3 s. The sample point is inside the Berbers' band,
  // clear of its name and of the edge it shares with the desert band.
  const seq = sahara();
  const [before, after] = await renderFrames(seq, [600, 640], options());
  const { camera } = frameState(seq, 640);
  const inside = project(camera, 12, 34.5);
  const stats = async (png) =>
    windowStats(png, Math.round(inside.x), Math.round(inside.y), 30);
  assert.ok(
    (await stats(after)).sd > (await stats(before)).sd + 8,
    "the Berbers' band is hatched once it has entered"
  );
});

// @req REQ-186
test("the ending prints the series video's closing line and invitation (Cartes 1.10.0)", () => {
  const design = JSON.parse(
    readFileSync(
      new URL("../design-system/version.json", import.meta.url),
      "utf8"
    )
  );
  for (const line of [...design.signatureLines, ...design.invitationLines])
    assert.ok(PAGE_HTML.includes(line), line);
  assert.ok(!PAGE_HTML.includes("décoloniser"), "the 1.6.0 line has left");
  assert.ok(!/travers ses noms/.test(PAGE_HTML), "the motto has left");
});

// @req REQ-186
test("ending B prints the closing line's two rows under the invitation", async () => {
  const seq = sahara();
  const [end] = await renderFrames(seq, [frameCount(seq) - 1], options());
  // Block top 600: logo, word, then (27 October 2026) the invitation's three
  // rows and the line 28 px lower, its second row about 1000 to 1060. The
  // 1.6.0 block ended at y 964, so nothing was written on this row before.
  const { data } = await sharp(end)
    .extract({ left: 240, top: 996, width: 600, height: 8 })
    .raw()
    .toBuffer({ resolveWithObject: true });
  assert.ok(Math.max(...data) > 200, "the line's second row is drawn");
});

// @req REQ-186
test("ending A adds the site pill; both endings keep the imagery line", async () => {
  const a = sahara({
    variant: "A",
    pageOnline: true,
    sentence: "L'histoire du nom Sahara est sur le site.",
  });
  const b = sahara();
  const [endA] = await renderFrames(a, [frameCount(a) - 1], options());
  const [endB] = await renderFrames(b, [frameCount(b) - 1], options());
  // The pill's outline, searched under the block since the signature line
  // (Cartes 1.6.0) moved it down by three lines.
  const accentPixels = async (png) => {
    let best = 0;
    for (let y = 840; y < 1240; y += 4) {
      let count = 0;
      for (let x = 240; x < 840; x += 4)
        if (inkDistance(await pixel(png, x, y), "#e8b96a") < 40) count++;
      best = Math.max(best, count);
    }
    return best;
  };
  assert.ok((await accentPixels(endA)) > 10, "ending A shows the pill");
  assert.equal(await accentPixels(endB), 0, "ending B shows no pill");
  for (const png of [endA, endB])
    assert.ok(
      (await windowStats(png, 200, 1870, 20)).max > 120,
      "the imagery credit stays on the last frame, at the bottom"
    );
});

// @req REQ-186
test("a reconstructed outline is drawn in dots, never as a solid line", async () => {
  const seq = sahara();
  const frame = 1500; // 50 s, chapter 5 fully drawn
  const [hold] = await renderFrames(seq, [frame], options());
  const { camera } = frameState(seq, frame);
  const [from, to] = [project(camera, 19, 14.5), project(camera, 18.1, 12.4)];
  let bright = 0;
  const samples = 60;
  for (let i = 0; i < samples; i++) {
    const t = 0.2 + (0.6 * i) / samples;
    const rgb = await pixel(
      hold,
      Math.round(from.x + (to.x - from.x) * t),
      Math.round(from.y + (to.y - from.y) * t)
    );
    if (inkDistance(rgb, "#bfe0ea") < 70) bright++;
  }
  assert.ok(
    bright > samples * 0.15 && bright < samples * 0.85,
    `dots and gaps along the outline (${bright} of ${samples} bright)`
  );
});
