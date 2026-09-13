import { existsSync } from "node:fs";
import path from "node:path";

import sharp from "sharp";

import {
  downloadChoices,
  type DiscoveryPublication,
  type DownloadFormat,
} from "../../src/lib/discoveries/catalog";

export const TRAINED_ALGORITHMIC_MEDIA =
  "http://cv.iptc.org/newscodes/digitalsourcetype/trainedAlgorithmicMedia";

interface DerivedFileProblem {
  publicationId: string;
  format: DownloadFormat;
  src: string;
  problem: "missing" | "dimensions" | "digital-source-type";
}

// Tools serialise the XMP property as an attribute, as element text or as an
// rdf:resource, so the packet is matched as text rather than parsed in one
// shape. The trailing quote or `<` keeps the neighbouring code
// `compositeWithTrainedAlgorithmicMedia` from passing for this one.
const DIGITAL_SOURCE_TYPE =
  /DigitalSourceType(?:(?:\s+rdf:resource)?\s*=\s*["']|>)\s*https?:\/\/cv\.iptc\.org\/newscodes\/digitalsourcetype\/trainedAlgorithmicMedia\s*["'<]/;

// @req REQ-166
export async function checkDeclaredDownloads(
  publications: readonly DiscoveryPublication[],
  publicDir: string
): Promise<DerivedFileProblem[]> {
  const problems: DerivedFileProblem[] = [];
  for (const publication of publications) {
    for (const choice of downloadChoices(publication)) {
      const report = (problem: DerivedFileProblem["problem"]) =>
        problems.push({
          publicationId: publication.id,
          format: choice.format,
          src: choice.src,
          problem,
        });
      const file = path.join(publicDir, choice.src);
      if (!existsSync(file)) {
        report("missing");
        continue;
      }
      const { width, height, xmp } = await sharp(file).metadata();
      if (width !== choice.width || height !== choice.height) {
        report("dimensions");
      }
      if (!DIGITAL_SOURCE_TYPE.test(xmp?.toString("utf8") ?? "")) {
        report("digital-source-type");
      }
    }
  }
  return problems;
}
