// Encodes an ident from its render(t), one screenshot per frame piped into
// FFmpeg, as the support film was made:
//   node social/series-idents/render.mjs intro|outro out.mp4 [layers] [name]
// The clips are mute; the reel's voice is laid over them in the edit.
import { createRequire } from "node:module";
import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import { startServer } from "./serve.mjs";
import { CLIPS, FPS, WIDTH, HEIGHT } from "./shots.mjs";

const { chromium } = createRequire(import.meta.url)("playwright");

export async function renderClip(
  clip,
  out,
  { from = 0, to = clip.duration, layers, name, repeat } = {}
) {
  const { server, origin } = await startServer();
  const browser = await chromium.launch();
  const ffmpeg = spawn(
    "ffmpeg",
    [
      "-v",
      "error",
      "-y",
      "-f",
      "image2pipe",
      "-framerate",
      String(FPS),
      "-i",
      "-",
      "-c:v",
      "libx264",
      "-preset",
      "slow",
      "-crf",
      "16",
      "-pix_fmt",
      "yuv420p",
      "-r",
      String(FPS),
      "-movflags",
      "+faststart",
      out,
    ],
    { stdio: ["pipe", "inherit", "inherit"] }
  );
  const done = new Promise((resolve, reject) =>
    ffmpeg.on("close", (code) =>
      code === 0 ? resolve() : reject(new Error(`ffmpeg exited with ${code}`))
    )
  );
  try {
    const page = await browser.newPage({
      viewport: { width: WIDTH, height: HEIGHT },
    });
    const query = new URLSearchParams({
      t: String(from),
      ...(layers && { layers }),
      ...(name && { name }),
    });
    await page.goto(`${origin}/social/series-idents/${clip.file}?${query}`);
    await page.waitForFunction(() => window.identReady === true, null, {
      timeout: 20000,
    });
    await page.evaluate(() =>
      Promise.all([...document.images].map((i) => i.decode().catch(() => {})))
    );
    const shoot = async (t) => {
      await page.evaluate((t) => window.render(t), t);
      return page.screenshot({ type: "png" });
    };
    const first = Math.round(from * FPS),
      last = Math.round(to * FPS);
    for (let f = first; f < last; f++) {
      const png = await shoot(f / FPS);
      if (!ffmpeg.stdin.write(png))
        await new Promise((r) => ffmpeg.stdin.once("drain", r));
    }
    ffmpeg.stdin.end();
    await done;
    const hashes =
      repeat === undefined
        ? []
        : await Promise.all(
            [await shoot(repeat), await shoot(repeat)].map((b) =>
              createHash("sha256").update(b).digest("hex")
            )
          );
    return { frames: last - first, hashes };
  } finally {
    await browser.close();
    server.close();
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [id, out, layers, name] = process.argv.slice(2);
  const clip = CLIPS.find((c) => c.id === id);
  if (!clip || !out)
    throw new Error("Usage: render.mjs intro|outro out.mp4 [layers] [name]");
  const { frames } = await renderClip(clip, out, { layers, name });
  console.log(`${out}: ${frames} frames`);
}
