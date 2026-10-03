/**
 * Source one free-licence Commons photograph per proverb, reading the licence
 * from `extmetadata` rather than assuming it. Same two passes as
 * `scripts/anecdotes/sourceIllustrations.ts`, Commons only:
 *
 *   npx tsx scripts/proverbs/sourceProverbImages.ts search "query" ["query"...]
 *   npx tsx scripts/proverbs/sourceProverbImages.ts fetch <proverb-id> "File:Name.jpg"
 *
 * `search` proposes; a human picks. `fetch` refuses any licence outside the
 * allow-list, writes public/images/proverbs/<id>.jpg (900 px, q70) and prints
 * the provenance to paste into CREDITS.md.
 */

import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import sharp from "sharp";

const OUT_DIR = join(process.cwd(), "public/images/proverbs");
const LONG_EDGE = 900;
const JPEG_QUALITY = 70;
const FREE = /^(cc0|cc[ -]by(-sa)?([ -][0-9.]+)?|public domain|pd-.*)$/i;
const UA = "EthniAfrica/4 (proverb image sourcing; contact via repository)";

interface Page {
  title: string;
  imageinfo?: {
    thumburl?: string;
    width?: number;
    height?: number;
    descriptionurl?: string;
    extmetadata?: Record<string, { value?: string }>;
  }[];
}

const pause = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function get(url: string | URL): Promise<Response> {
  for (let attempt = 0; ; attempt += 1) {
    const res = await fetch(url, { headers: { "User-Agent": UA } });
    if (res.status !== 429 || attempt >= 4) return res;
    await pause(1500 * (attempt + 2));
  }
}

const plain = (v?: string) =>
  (v ?? "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

function apiUrl(params: Record<string, string>): URL {
  const url = new URL("https://commons.wikimedia.org/w/api.php");
  const all = {
    action: "query",
    format: "json",
    prop: "imageinfo",
    iiprop: "url|size|extmetadata",
    iiurlwidth: "1000",
    ...params,
  };
  for (const [k, v] of Object.entries(all)) url.searchParams.set(k, v);
  return url;
}

function describe(page: Page) {
  const info = page.imageinfo?.[0];
  const meta = info?.extmetadata ?? {};
  return {
    title: page.title,
    licence: plain(meta.LicenseShortName?.value),
    licenceUrl: plain(meta.LicenseUrl?.value),
    author: plain(meta.Artist?.value),
    description: plain(meta.ImageDescription?.value).slice(0, 160),
    filePage: info?.descriptionurl ?? "",
    thumb: info?.thumburl ?? "",
    size: `${info?.width}x${info?.height}`,
  };
}

async function search(queries: string[]) {
  for (const query of queries) {
    const url = apiUrl({
      generator: "search",
      gsrsearch: `${query} filetype:bitmap`,
      gsrnamespace: "6",
      gsrlimit: "12",
    });
    const res = await get(url);
    const body = (await res.json()) as {
      query?: { pages?: Record<string, Page> };
    };
    console.log(`\n## ${query}`);
    for (const page of Object.values(body.query?.pages ?? {})) {
      const c = describe(page);
      if (!FREE.test(c.licence)) continue;
      console.log(
        `- ${c.title} | ${c.licence} | ${c.size} | ${c.author.slice(0, 40)} | ${c.description}`
      );
    }
    await pause(1200);
  }
}

async function fetchOne(id: string, title: string) {
  const res = await get(apiUrl({ titles: title }));
  const body = (await res.json()) as { query: { pages: Record<string, Page> } };
  const c = describe(Object.values(body.query.pages)[0]);
  if (!FREE.test(c.licence))
    throw new Error(`Licence not allowed: ${c.licence}`);
  const image = await get(c.thumb);
  const buffer = Buffer.from(await image.arrayBuffer());
  const jpeg = await sharp(buffer)
    .resize({
      width: LONG_EDGE,
      height: LONG_EDGE,
      fit: "inside",
      withoutEnlargement: true,
    })
    .jpeg({ quality: JPEG_QUALITY, mozjpeg: true })
    .toBuffer();
  mkdirSync(OUT_DIR, { recursive: true });
  writeFileSync(join(OUT_DIR, `${id}.jpg`), jpeg);
  console.log(
    JSON.stringify({ id, bytes: jpeg.length, ...c, thumb: undefined }, null, 2)
  );
}

const [mode, ...rest] = process.argv.slice(2);
if (mode === "search") void search(rest);
else if (mode === "fetch") void fetchOne(rest[0], rest[1]);
else console.error("usage: search <queries...> | fetch <id> <File:Title>");
