// @req REQ-186
// The opt-in GPU render (operator, 19 October 2026): `gpu: true` draws
// WebGL through ANGLE on Metal instead of SwiftShader, and the renderer says
// which one drew, from the WebGL renderer string the page itself reports.
// SwiftShader stays the default. Needs no imagery outside git, but needs a
// Mac GPU: the pinned runtime is verified on macOS arm64 only.
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { loadSeriesVideo } from "./series.mjs";
import { openSeriesRenderer } from "./series-render.mjs";
import { seriesDemo } from "./fixtures/series-pays.mjs";

const dir = mkdtempSync(join(tmpdir(), "series-gpu-"));
// @req REQ-186
test.after(() => rmSync(dir, { recursive: true, force: true }));
const seq = loadSeriesVideo(seriesDemo(dir), { dir });

const webglOf = async (options) => {
  const renderer = await openSeriesRenderer(seq, options);
  try {
    return renderer.runtime.webgl;
  } finally {
    await renderer.close();
  }
};

// @req REQ-186
test("by default, WebGL runs on SwiftShader and the runtime says so", async () => {
  const webgl = await webglOf({ diagnose: true });
  assert.equal(webgl.backend, "swiftshader");
  assert.match(webgl.renderer, /SwiftShader/);
});

// @req REQ-186
test("with gpu, WebGL runs on the Mac's GPU through Metal and the runtime says so", async () => {
  const webgl = await webglOf({ diagnose: true, gpu: true });
  assert.equal(webgl.backend, "gpu");
  assert.match(webgl.renderer, /Metal/);
  assert.doesNotMatch(webgl.renderer, /SwiftShader/);
});
