// A static server rooted at the repository. The end card embeds the site
// mockups in an iframe and types into their search field, which a file://
// page cannot do: each file:// document is its own origin.
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("../../", import.meta.url));
const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css",
  ".js": "text/javascript",
  ".mjs": "text/javascript",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ttf": "font/ttf",
};

export function startServer(port = 0) {
  const server = createServer(async (req, res) => {
    const path = normalize(
      decodeURIComponent(new URL(req.url, "http://x").pathname)
    );
    if (path.includes("..")) return res.writeHead(403).end();
    try {
      const body = await readFile(join(ROOT, path));
      res
        .writeHead(200, {
          "content-type": TYPES[extname(path)] ?? "application/octet-stream",
        })
        .end(body);
    } catch {
      res.writeHead(404).end();
    }
  });
  return new Promise((resolve) =>
    server.listen(port, "127.0.0.1", () =>
      resolve({ server, origin: `http://127.0.0.1:${server.address().port}` })
    )
  );
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { origin } = await startServer(Number(process.argv[2] ?? 4317));
  console.log(`${origin}/social/series-idents/boards/storyboard.html`);
}
