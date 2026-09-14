import { mkdirSync } from "node:fs";
import path from "node:path";

import sharp from "sharp";

import type { DownloadFormat } from "../../src/lib/discoveries/catalog";
import {
  derivableFormats,
  generatedDownloadPath,
  type GeneratedImageMaster,
} from "../../src/lib/discoveries/generatedImages";
import { TRAINED_ALGORITHMIC_MEDIA } from "./generatedImageDownloads";

const FRAMES: Record<DownloadFormat, { width: number; height: number }> = {
  "9:16": { width: 1080, height: 1920 },
  "4:5": { width: 1080, height: 1350 },
  "1:1": { width: 1080, height: 1080 },
};

// The harness watermark is 30 px tall at 1080 wide (GABARITS-SOCIAL §7 bis).
// This one carries a sentence the reader must be able to read, not only a
// silhouette to recognise, so it is two pixels taller and far less faded.
const MARK_HEIGHT = 32;
const MARK_OPACITY = 0.9;
const MARK_ASSET = "scripts/discoveries/assets/generated-image-mark.png";

// Charter inks: --afh-color-text on a light ground, --afh-night-ink on a dark one.
const DARK_INK = { r: 0x2c, g: 0x20, b: 0x18 };
const LIGHT_INK = { r: 0xf1, g: 0xe7, b: 0xd8 };
const LIGHT_GROUND_LUMINANCE = 140;

const STORY_SIDE_MARGIN = 84;
const STORY_TOP_MARGIN = 124;
const POST_MARGIN = 84;
// Kept off the avatar's circular crop by more than antialiasing needs.
const AVATAR_CIRCLE_INSET = 40;

const PAPER_SAMPLE = 24;
const JPEG_QUALITY = 85;

interface Box {
  left: number;
  top: number;
  width: number;
  height: number;
}

type Fit = "resize" | "extend" | "cover";
type Colour = [number, number, number];

/**
 * The gold ring painted around every autonym portrait, in master pixels.
 * Measured 2026-09-14 on the four 2048 px masters, along rays from the centre
 * within 20° of straight down (the arc a bottom-centred mark can reach): the
 * ring's inner edge sat between 856 and 865 px from the centre, its outer edge
 * between 912 and 920. The smallest inner radius is kept, so the mark clears
 * the ring on every portrait. A 1:1 mark on the ring collides with the painting;
 * one in the cream band below it is cut by a round avatar crop.
 */
export const AUTONYM_RING = {
  masterSize: 2048,
  innerRadius: 856,
  outerRadius: 920,
} as const;
// Enough that brush speckle on the ring's inner edge never touches a glyph.
const RING_CLEARANCE = 12;

// @req REQ-166
export function markPlacement(
  format: DownloadFormat,
  mark: { width: number; height: number },
  collection?: GeneratedImageMaster["collection"]
): Box {
  const { width, height } = FRAMES[format];
  if (format === "9:16") {
    return { left: STORY_SIDE_MARGIN, top: STORY_TOP_MARGIN, ...mark };
  }
  if (format === "4:5") {
    return {
      left: POST_MARGIN,
      top: height - POST_MARGIN - mark.height,
      ...mark,
    };
  }
  const centre = width / 2;
  const radius =
    collection === "autonymes"
      ? (AUTONYM_RING.innerRadius * width) / AUTONYM_RING.masterSize -
        RING_CLEARANCE
      : centre - AVATAR_CIRCLE_INSET;
  const bottom = centre + Math.sqrt(radius ** 2 - (mark.width / 2) ** 2);
  return {
    left: Math.floor((width - mark.width) / 2),
    top: Math.floor(bottom - mark.height),
    ...mark,
  };
}

// @req REQ-166
export function fitPlan(
  entry: Pick<GeneratedImageMaster, "collection" | "master" | "master9x16">,
  format: DownloadFormat
): { master: string; fit: Fit } | null {
  if (!derivableFormats(entry).includes(format)) return null;
  if (entry.collection === "autonymes") {
    return {
      master: entry.master,
      fit: format === "1:1" ? "resize" : "extend",
    };
  }
  return {
    master: format === "9:16" ? entry.master9x16 : entry.master,
    fit: "cover",
  };
}

// @req REQ-166
export function medianColour(samples: readonly Colour[]): Colour {
  const middle = Math.floor(samples.length / 2);
  return [0, 1, 2].map(
    (channel) =>
      samples.map((sample) => sample[channel]).sort((a, b) => a - b)[middle]
  ) as Colour;
}

// @req REQ-166
export function resolveMastersDir(
  argv: readonly string[],
  env: Record<string, string | undefined>,
  repositoryRoot: string
): string {
  const flag = argv.indexOf("--masters");
  if (flag !== -1) {
    const value = argv[flag + 1];
    if (!value) throw new Error("--masters requires a directory");
    return path.resolve(value);
  }
  const workshop = (env.ETHNIAFRICA_SOCIAL_PROJECTS ?? "").trim();
  if (workshop) return path.join(path.resolve(workshop), "decouvertes-images");
  return path.join(repositoryRoot, "output", "social", "decouvertes-images");
}

function xmpPacket(): string {
  return [
    '<x:xmpmeta xmlns:x="adobe:ns:meta/">',
    '<rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">',
    '<rdf:Description rdf:about=""',
    ' xmlns:Iptc4xmpExt="http://iptc.org/std/Iptc4xmpExt/2008-02-29/"',
    ` Iptc4xmpExt:DigitalSourceType="${TRAINED_ALGORITHMIC_MEDIA}"/>`,
    "</rdf:RDF>",
    "</x:xmpmeta>",
  ].join("");
}

async function paperColour(master: string): Promise<Colour> {
  const { width, height } = await sharp(master).metadata();
  const corners = [
    [0, 0],
    [width - PAPER_SAMPLE, 0],
    [0, height - PAPER_SAMPLE],
    [width - PAPER_SAMPLE, height - PAPER_SAMPLE],
  ];
  const samples: Colour[] = [];
  for (const [left, top] of corners) {
    const { data, info } = await sharp(master)
      .extract({ left, top, width: PAPER_SAMPLE, height: PAPER_SAMPLE })
      .removeAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    for (let offset = 0; offset < data.length; offset += info.channels) {
      samples.push([data[offset], data[offset + 1], data[offset + 2]]);
    }
  }
  return medianColour(samples);
}

async function fittedFrame(
  master: string,
  fit: Fit,
  format: DownloadFormat
): Promise<Buffer> {
  const { width, height } = FRAMES[format];
  if (fit === "cover") {
    return sharp(master)
      .removeAlpha()
      .resize(width, height, { fit: "cover", position: "centre" })
      .png()
      .toBuffer();
  }
  const square = await sharp(master)
    .removeAlpha()
    .resize(width, width, { fit: "cover", position: "centre" })
    .png()
    .toBuffer();
  if (fit === "resize") return square;
  const [r, g, b] = await paperColour(master);
  const added = height - width;
  return sharp(square)
    .extend({
      top: Math.floor(added / 2),
      bottom: Math.ceil(added / 2),
      background: { r, g, b },
    })
    .png()
    .toBuffer();
}

async function inkedMark(
  markAsset: string,
  ground: Buffer,
  format: DownloadFormat,
  collection: GeneratedImageMaster["collection"]
): Promise<{ input: Buffer; left: number; top: number }> {
  const { data: alpha, info } = await sharp(markAsset)
    .resize({ height: MARK_HEIGHT })
    .extractChannel("alpha")
    .linear(MARK_OPACITY, 0)
    .raw()
    .toBuffer({ resolveWithObject: true });
  const box = markPlacement(
    format,
    { width: info.width, height: info.height },
    collection
  );
  // `stats()` describes the input, not the extracted pipeline output, so the
  // region is materialised first; otherwise the ink follows the frame's
  // average and a light corner of a dark scene gets light ink.
  const region = await sharp(ground).extract(box).png().toBuffer();
  const { channels } = await sharp(region).stats();
  const luminance =
    0.2126 * channels[0].mean +
    0.7152 * channels[1].mean +
    0.0722 * channels[2].mean;
  const ink = luminance > LIGHT_GROUND_LUMINANCE ? DARK_INK : LIGHT_INK;
  const input = await sharp({
    create: {
      width: info.width,
      height: info.height,
      channels: 3,
      background: ink,
    },
  })
    .joinChannel(alpha, {
      raw: { width: info.width, height: info.height, channels: 1 },
    })
    .png()
    .toBuffer();
  return { input, left: box.left, top: box.top };
}

/**
 * Writes every derivable format of one image under `publicDir` and returns
 * the public path of each file written, keyed by format — the shape the
 * catalog declares as `downloads`.
 */
// @req REQ-166
export async function deriveGeneratedImage(
  entry: GeneratedImageMaster,
  options: { mastersDir: string; publicDir: string; repositoryRoot: string }
): Promise<Partial<Record<DownloadFormat, string>>> {
  const markAsset = path.join(options.repositoryRoot, MARK_ASSET);
  const written: Partial<Record<DownloadFormat, string>> = {};
  for (const format of derivableFormats(entry)) {
    const plan = fitPlan(entry, format);
    const frame = await fittedFrame(
      path.join(options.mastersDir, plan.master),
      plan.fit,
      format
    );
    const mark = await inkedMark(markAsset, frame, format, entry.collection);
    const publicPath = generatedDownloadPath(entry.slug, format);
    const file = path.join(options.publicDir, publicPath);
    mkdirSync(path.dirname(file), { recursive: true });
    await sharp(frame)
      .composite([mark])
      .withIccProfile("srgb")
      .withXmp(xmpPacket())
      .jpeg({ quality: JPEG_QUALITY, chromaSubsampling: "4:4:4" })
      .toFile(file);
    written[format] = publicPath;
  }
  return written;
}
