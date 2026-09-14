import { mkdtempSync, mkdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import sharp from "sharp";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import type { DiscoveryPublication } from "@/lib/discoveries/catalog";
import { getDiscoveryPublications } from "@/lib/discoveries/entries";

import {
  checkDeclaredDownloads,
  TRAINED_ALGORITHMIC_MEDIA,
} from "../lib/generatedImageDownloads";

const repositoryPublic = path.resolve(__dirname, "../../public");

function xmpDeclaring(digitalSourceType: string): string {
  return [
    '<x:xmpmeta xmlns:x="adobe:ns:meta/">',
    '<rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">',
    '<rdf:Description rdf:about=""',
    ' xmlns:Iptc4xmpExt="http://iptc.org/std/Iptc4xmpExt/2008-02-29/"',
    ` Iptc4xmpExt:DigitalSourceType="${digitalSourceType}"/>`,
    "</rdf:RDF>",
    "</x:xmpmeta>",
  ].join("");
}

async function writeImage(
  file: string,
  width: number,
  height: number,
  xmp?: string
): Promise<void> {
  mkdirSync(path.dirname(file), { recursive: true });
  const canvas = sharp({
    create: { width, height, channels: 3, background: "#000000" },
  }).jpeg();
  await (xmp ? canvas.withXmp(xmp) : canvas).toFile(file);
}

function generatedWith(
  downloads: DiscoveryPublication["downloads"]
): DiscoveryPublication {
  return {
    id: "image:fixture",
    kind: "image",
    status: "published",
    slug: { fr: "image-fixture", en: "image-fixture" },
    title: { fr: "Titre", en: "Title" },
    description: { fr: "Résumé", en: "Summary" },
    downloads,
  };
}

describe("generated image derived files", () => {
  let publicDir: string;
  const tagged = xmpDeclaring(TRAINED_ALGORITHMIC_MEDIA);

  beforeAll(async () => {
    publicDir = mkdtempSync(path.join(tmpdir(), "generated-downloads-"));
    const folder = path.join(publicDir, "images/discoveries/generated/fixture");
    await writeImage(path.join(folder, "9x16.jpg"), 1080, 1920, tagged);
    await writeImage(path.join(folder, "4x5.jpg"), 1080, 1350, tagged);
    await writeImage(path.join(folder, "1x1.jpg"), 1080, 1080, tagged);
    await writeImage(path.join(folder, "untagged.jpg"), 1080, 1080);
    await writeImage(
      path.join(folder, "digital-capture.jpg"),
      1080,
      1350,
      xmpDeclaring(
        "http://cv.iptc.org/newscodes/digitalsourcetype/digitalCapture"
      )
    );
  });

  afterAll(() => {
    rmSync(publicDir, { recursive: true, force: true });
  });

  // @req REQ-166
  it("accepts three files at their exact dimensions that declare trainedAlgorithmicMedia", async () => {
    const problems = await checkDeclaredDownloads(
      [
        generatedWith({
          "9:16": "/images/discoveries/generated/fixture/9x16.jpg",
          "4:5": "/images/discoveries/generated/fixture/4x5.jpg",
          "1:1": "/images/discoveries/generated/fixture/1x1.jpg",
        }),
      ],
      publicDir
    );
    expect(problems).toEqual([]);
  });

  // @req REQ-166
  it("refuses a file whose metadata does not declare trainedAlgorithmicMedia", async () => {
    const problems = await checkDeclaredDownloads(
      [
        generatedWith({
          "1:1": "/images/discoveries/generated/fixture/untagged.jpg",
          "4:5": "/images/discoveries/generated/fixture/digital-capture.jpg",
        }),
      ],
      publicDir
    );
    expect(problems).toEqual([
      expect.objectContaining({
        src: "/images/discoveries/generated/fixture/digital-capture.jpg",
        problem: "digital-source-type",
      }),
      expect.objectContaining({
        src: "/images/discoveries/generated/fixture/untagged.jpg",
        problem: "digital-source-type",
      }),
    ]);
  });

  // @req REQ-166
  it("refuses a declared file that is missing or not at its format's dimensions", async () => {
    const problems = await checkDeclaredDownloads(
      [
        generatedWith({
          "9:16": "/images/discoveries/generated/fixture/1x1.jpg",
          "4:5": "/images/discoveries/generated/fixture/absent.jpg",
        }),
      ],
      publicDir
    );
    expect(problems.map(({ format, problem }) => [format, problem])).toEqual([
      ["9:16", "dimensions"],
      ["4:5", "missing"],
    ]);
  });

  // @req REQ-166
  it("finds every derived file the shipped catalog declares, sized and tagged", async () => {
    expect(
      await checkDeclaredDownloads(getDiscoveryPublications(), repositoryPublic)
    ).toEqual([]);
  });
});
