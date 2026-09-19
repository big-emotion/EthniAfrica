import fs from "node:fs";
import sharp from "sharp";

export const SEARCH_FEED_MAX_DIFFERENT_PIXEL_RATIO = 0.01;

export type SearchFeedVariant =
  "mobile-day" | "mobile-night" | "desktop-day" | "desktop-night";
export type SearchFeedTheme = "day" | "night";
export type SearchFeedResultState = "exact" | "widened" | "typo" | "unknown";
export type SearchFeedZone = "first" | "primary" | "secondary" | "closing";
export type SearchFeedOwedPart = "silences" | "conviction" | "invitation";

export interface SearchFeedManifestBlock {
  id: string;
  zone: SearchFeedZone;
}

export interface SearchFeedPosterBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface SearchFeedManifestEntry {
  case: string;
  variant: SearchFeedVariant;
  file: string;
  query: string;
  resultState: SearchFeedResultState;
  width: number;
  theme: SearchFeedTheme;
  height: number;
  blocks: SearchFeedManifestBlock[];
  owedParts: SearchFeedOwedPart[];
  firstPoster: SearchFeedPosterBox | null;
}

export interface SearchFeedManifest {
  schemaVersion: 1;
  entries: SearchFeedManifestEntry[];
}

export interface ScreenshotDimensions {
  width: number;
  height: number;
}

export interface SearchFeedPixelDifference extends ScreenshotDimensions {
  totalPixels: number;
  differentPixels: number;
  differentPixelRatio: number;
}

type PngInput = Buffer | string;
type JsonRecord = Record<string, unknown>;

const VARIANT_GEOMETRY: Record<
  SearchFeedVariant,
  { width: number; theme: SearchFeedTheme }
> = {
  "mobile-day": { width: 430, theme: "day" },
  "mobile-night": { width: 430, theme: "night" },
  "desktop-day": { width: 1280, theme: "day" },
  "desktop-night": { width: 1280, theme: "night" },
};

const RESULT_STATES = new Set<SearchFeedResultState>([
  "exact",
  "widened",
  "typo",
  "unknown",
]);
const ZONES = new Set<SearchFeedZone>([
  "first",
  "primary",
  "secondary",
  "closing",
]);
const OWED_PARTS = new Set<SearchFeedOwedPart>([
  "silences",
  "conviction",
  "invitation",
]);

function fail(path: string, expectation: string): never {
  throw new Error(`${path} ${expectation}`);
}

function record(value: unknown, path: string): JsonRecord {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    fail(path, "must be an object");
  }
  return value as JsonRecord;
}

function string(value: unknown, path: string): string {
  if (typeof value !== "string" || value.length === 0) {
    fail(path, "must be a non-empty string");
  }
  return value;
}

function integer(value: unknown, path: string, allowZero = false): number {
  if (
    typeof value !== "number" ||
    !Number.isInteger(value) ||
    value < (allowZero ? 0 : 1)
  ) {
    fail(path, `must be a ${allowZero ? "non-negative" : "positive"} integer`);
  }
  return value;
}

function oneOf<T extends string>(
  value: unknown,
  accepted: ReadonlySet<T>,
  path: string
): T {
  if (typeof value !== "string" || !accepted.has(value as T)) {
    fail(path, `must be one of ${Array.from(accepted).join(", ")}`);
  }
  return value as T;
}

function array(value: unknown, path: string): unknown[] {
  if (!Array.isArray(value)) fail(path, "must be an array");
  return value;
}

function parsePosterBox(
  value: unknown,
  path: string
): SearchFeedPosterBox | null {
  if (value === null) return null;
  const box = record(value, path);
  return {
    x: integer(box.x, `${path}.x`, true),
    y: integer(box.y, `${path}.y`, true),
    width: integer(box.width, `${path}.width`),
    height: integer(box.height, `${path}.height`),
  };
}

function parseManifestEntry(
  value: unknown,
  index: number
): SearchFeedManifestEntry {
  const path = `manifest.entries[${index}]`;
  const entry = record(value, path);
  const caseName = string(entry.case, `${path}.case`);
  const variant = oneOf(
    entry.variant,
    new Set(Object.keys(VARIANT_GEOMETRY)) as ReadonlySet<SearchFeedVariant>,
    `${path}.variant`
  );
  const file = string(entry.file, `${path}.file`);
  const width = integer(entry.width, `${path}.width`);
  const theme = oneOf(
    entry.theme,
    new Set<SearchFeedTheme>(["day", "night"]),
    `${path}.theme`
  );
  const expected = VARIANT_GEOMETRY[variant];

  if (width !== expected.width) {
    fail(`${path}.width`, `must be ${expected.width} for variant ${variant}`);
  }
  if (theme !== expected.theme) {
    fail(`${path}.theme`, `must be ${expected.theme} for variant ${variant}`);
  }
  if (!file.endsWith(".dc.html") || file.includes("/") || file.includes("\\")) {
    fail(`${path}.file`, "must be a board filename ending in .dc.html");
  }

  return {
    case: caseName,
    variant,
    file,
    query: string(entry.query, `${path}.query`),
    resultState: oneOf(entry.resultState, RESULT_STATES, `${path}.resultState`),
    width,
    theme,
    height: integer(entry.height, `${path}.height`),
    blocks: array(entry.blocks, `${path}.blocks`).map((block, blockIndex) => {
      const blockPath = `${path}.blocks[${blockIndex}]`;
      const parsed = record(block, blockPath);
      return {
        id: string(parsed.id, `${blockPath}.id`),
        zone: oneOf(parsed.zone, ZONES, `${blockPath}.zone`),
      };
    }),
    owedParts: array(entry.owedParts, `${path}.owedParts`).map(
      (part, partIndex) =>
        oneOf(part, OWED_PARTS, `${path}.owedParts[${partIndex}]`)
    ),
    firstPoster: parsePosterBox(entry.firstPoster, `${path}.firstPoster`),
  };
}

// @req REQ-180
export function parseSearchFeedManifest(value: unknown): SearchFeedManifest {
  const manifest = record(value, "manifest");
  if (manifest.schemaVersion !== 1) {
    fail("manifest.schemaVersion", "must be 1");
  }

  const entries = array(manifest.entries, "manifest.entries").map(
    parseManifestEntry
  );
  if (entries.length === 0) fail("manifest.entries", "must not be empty");

  const keys = new Set<string>();
  for (const entry of entries) {
    const key = `${entry.case}/${entry.variant}`;
    if (keys.has(key)) fail("manifest.entries", `contains duplicate ${key}`);
    keys.add(key);
  }

  return { schemaVersion: 1, entries };
}

// @req REQ-180
export function loadSearchFeedManifest(filePath: string): SearchFeedManifest {
  return parseSearchFeedManifest(JSON.parse(fs.readFileSync(filePath, "utf8")));
}

// @req REQ-180
export function assertExactScreenshotDimensions(
  expected: ScreenshotDimensions,
  actual: ScreenshotDimensions
): void {
  if (actual.height !== expected.height) {
    throw new Error(
      `Screenshot height mismatch: expected ${expected.height}px, received ${actual.height}px; ` +
        "even a 1px height difference fails visual parity"
    );
  }
  if (actual.width !== expected.width) {
    throw new Error(
      `Screenshot width mismatch: expected ${expected.width}px, received ${actual.width}px; ` +
        "even a 1px width difference fails visual parity"
    );
  }
}

async function decodePng(input: PngInput) {
  return sharp(input)
    .toColourspace("srgb")
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
}

// @req REQ-180
export async function comparePngs(
  expectedPng: PngInput,
  actualPng: PngInput
): Promise<SearchFeedPixelDifference> {
  const [expected, actual] = await Promise.all([
    decodePng(expectedPng),
    decodePng(actualPng),
  ]);

  assertExactScreenshotDimensions(expected.info, actual.info);

  const totalPixels = expected.info.width * expected.info.height;
  const channels = expected.info.channels;
  let differentPixels = 0;

  for (let pixel = 0; pixel < totalPixels; pixel += 1) {
    const offset = pixel * channels;
    for (let channel = 0; channel < channels; channel += 1) {
      if (expected.data[offset + channel] !== actual.data[offset + channel]) {
        differentPixels += 1;
        break;
      }
    }
  }

  return {
    width: expected.info.width,
    height: expected.info.height,
    totalPixels,
    differentPixels,
    differentPixelRatio: differentPixels / totalPixels,
  };
}

// @req REQ-180
export async function assertPixelParity(
  expectedPng: PngInput,
  actualPng: PngInput,
  maxDifferentPixelRatio = SEARCH_FEED_MAX_DIFFERENT_PIXEL_RATIO
): Promise<SearchFeedPixelDifference> {
  if (
    !Number.isFinite(maxDifferentPixelRatio) ||
    maxDifferentPixelRatio < 0 ||
    maxDifferentPixelRatio > 1
  ) {
    throw new Error("maxDifferentPixelRatio must be between 0 and 1");
  }

  const result = await comparePngs(expectedPng, actualPng);
  if (result.differentPixelRatio > maxDifferentPixelRatio) {
    throw new Error(
      `Visual parity failed: ${result.differentPixels}/${result.totalPixels} pixels differ ` +
        `(${(result.differentPixelRatio * 100).toFixed(4)}%), exceeding the ` +
        `${(maxDifferentPixelRatio * 100).toFixed(4)}% ceiling`
    );
  }
  return result;
}
