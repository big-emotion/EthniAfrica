// @req REQ-186
// A frame's pixels are captured again when the browser never answers a
// screenshot request. Under SwiftShader, headless Chromium now and then
// drops a capture: the request waits forever, while a new request for the
// same, already drawn frame returns at once. The page is not redrawn, so the
// retry cannot change a pixel.
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import sharp from "sharp";
import { captureFrame, encodeFrames } from "./render.mjs";

const timeout = () =>
  Object.assign(new Error("page.screenshot: Timeout exceeded."), {
    name: "TimeoutError",
  });

// A stand-in for the page: answers each request in turn from `replies`.
function page(replies) {
  const calls = [];
  return {
    calls,
    screenshot: async (options) => {
      calls.push(options);
      const reply = replies[calls.length - 1];
      if (reply instanceof Error) throw reply;
      return reply;
    },
  };
}

// @req REQ-186
test("a dropped capture is requested again, with the same options", async () => {
  const p = page([timeout(), Buffer.from("png")]);
  const png = await captureFrame(p);
  assert.equal(png.toString(), "png");
  assert.equal(p.calls.length, 2);
  assert.deepEqual(p.calls[0], p.calls[1]);
  // Each request has its own short deadline, so a dropped one costs
  // seconds, not the default minute.
  assert.ok(p.calls[0].timeout <= 20000);
});

// @req REQ-186
test("a capture that keeps failing stops the render after three requests", async () => {
  const p = page([timeout(), timeout(), timeout(), Buffer.from("never")]);
  await assert.rejects(captureFrame(p), /Timeout/);
  assert.equal(p.calls.length, 3);
});

// @req REQ-186
test("any other failure is not retried", async () => {
  const p = page([new Error("Target closed"), Buffer.from("png")]);
  await assert.rejects(captureFrame(p), /Target closed/);
  assert.equal(p.calls.length, 1);
});

// A stand-in for a page reached through the DevTools protocol, the way a
// fast capture asks for its frame: answers each CDP request from `replies`.
function cdpPage(replies) {
  const calls = [];
  const sessions = [];
  return {
    calls,
    sessions,
    viewportSize: () => ({ width: 1080, height: 1920 }),
    context: () => ({
      newCDPSession: async (target) => {
        sessions.push(target);
        return {
          send: (method, params) => {
            calls.push({ method, params });
            const reply = replies[calls.length - 1];
            if (reply instanceof Error) return Promise.reject(reply);
            if (reply === "never") return new Promise(() => {});
            return Promise.resolve({ data: reply.toString("base64") });
          },
        };
      },
    }),
  };
}

// @req REQ-186
test("a fast capture asks Chromium for a lossless PNG of the whole frame, encoded for speed", async () => {
  const p = cdpPage([Buffer.from("png")]);
  const png = await captureFrame(p, { fast: true });
  assert.equal(png.toString(), "png");
  assert.deepEqual(p.calls, [
    {
      method: "Page.captureScreenshot",
      params: {
        format: "png",
        optimizeForSpeed: true,
        clip: { x: 0, y: 0, width: 1080, height: 1920, scale: 1 },
        captureBeyondViewport: false,
      },
    },
  ]);
});

// @req REQ-186
test("a page keeps one DevTools session for all its fast captures", async () => {
  const p = cdpPage([Buffer.from("a"), Buffer.from("b")]);
  await captureFrame(p, { fast: true });
  await captureFrame(p, { fast: true });
  assert.equal(p.sessions.length, 1);
});

// @req REQ-186
test("a dropped fast capture is requested again, three times at most", async () => {
  const again = cdpPage(["never", Buffer.from("png")]);
  const png = await captureFrame(again, { fast: true, timeout: 20 });
  assert.equal(png.toString(), "png");
  assert.equal(again.calls.length, 2);
  const lost = cdpPage(["never", "never", "never", Buffer.from("never")]);
  await assert.rejects(
    captureFrame(lost, { fast: true, timeout: 20 }),
    /Timeout/
  );
  assert.equal(lost.calls.length, 3);
});

// @req REQ-186
test("a frame refused during an export leaves no video behind", async () => {
  const dir = mkdtempSync(join(tmpdir(), "encode-"));
  const file = join(dir, "video.mp4");
  const png = await sharp({
    create: { width: 64, height: 64, channels: 3, background: "#15100b" },
  })
    .png()
    .toBuffer();
  try {
    await assert.rejects(
      encodeFrames(file, {
        from: 0,
        to: 30,
        render: async (f) => {
          if (f === 20) throw new Error("Layout at frame 20");
          return png;
        },
        sound: { input: [], output: ["-an"] },
      }),
      /Layout at frame 20/
    );
    assert.equal(existsSync(file), false);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
