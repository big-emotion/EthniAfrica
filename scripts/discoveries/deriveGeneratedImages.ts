#!/usr/bin/env tsx
/**
 * Derive the downloadable files of every generated image in Découvertes.
 *
 *   npx tsx scripts/discoveries/deriveGeneratedImages.ts [--masters <dir>]
 *
 * Run from the repository root. The approved masters are never committed:
 * they are read from `--masters`, else `$ETHNIAFRICA_SOCIAL_PROJECTS/decouvertes-images`,
 * else the checkout's gitignored `output/social/decouvertes-images`. From a
 * worktree, pass the main checkout's folder with the flag.
 *
 * Every master is checked before anything is written, so a missing file stops
 * the run instead of leaving half a set of formats in `public/`.
 *
 * Writing the files does not publish them: a download is declared in
 * `src/lib/discoveries/generatedImages.ts` once its file is committed, and
 * the download suite then holds each declared file to its size and its
 * disclosure.
 */

import { existsSync } from "node:fs";
import path from "node:path";

import { GENERATED_IMAGE_MANIFEST } from "../../src/lib/discoveries/generatedImages";
import {
  deriveGeneratedImage,
  fitPlan,
  resolveMastersDir,
} from "../lib/generatedImageDerivation";

async function main(): Promise<void> {
  const repositoryRoot = process.cwd();
  const mastersDir = resolveMastersDir(
    process.argv.slice(2),
    process.env,
    repositoryRoot
  );
  const publicDir = path.join(repositoryRoot, "public");

  const missing = GENERATED_IMAGE_MANIFEST.flatMap((entry) =>
    (["9:16", "4:5", "1:1"] as const)
      .map((format) => fitPlan(entry, format)?.master)
      .filter((master): master is string => Boolean(master))
      .filter((master) => !existsSync(path.join(mastersDir, master)))
  );
  if (missing.length > 0) {
    console.error(`Missing masters under ${mastersDir}:`);
    for (const master of new Set(missing)) console.error(`  ${master}`);
    process.exit(1);
  }

  for (const entry of GENERATED_IMAGE_MANIFEST) {
    const written = await deriveGeneratedImage(entry, {
      mastersDir,
      publicDir,
      repositoryRoot,
    });
    for (const [format, publicPath] of Object.entries(written)) {
      console.log(`${entry.slug}\t${format}\tpublic${publicPath}`);
    }
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
