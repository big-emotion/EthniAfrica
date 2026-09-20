/**
 * The tracked-asset weight gate.
 *
 * `public/` is served from the repository and has never had a size check: no
 * `.gitattributes`, no LFS, nothing in CI. That was survivable while the
 * directory held a fixed set of illustrations. It stops being survivable with
 * the `carousel` kind, whose frames arrive by the dozen from the render
 * engine — a single editorial pass can add tens of megabytes to every clone
 * of a public repository, permanently, and nobody finds out until the checkout
 * is slow.
 *
 * So the ceiling lands *before* the first carousel pass rather than after it.
 * A budget written once the directory has already doubled is a budget written
 * around the damage.
 *
 * **This is a one-way ceiling, not the two-way ratchet `checkDeadCode.ts`
 * uses, and the difference is deliberate.** A ratchet works on a count of
 * findings, which only moves when somebody decides it should. A byte total
 * moves whenever an image is re-encoded, and a gate that fails the build
 * because a picture got *smaller* is a gate that gets routed around within a
 * week — which is the very failure the ratchet doctrine exists to prevent.
 * The headroom is printed on every run instead, so the number is still read
 * rather than merely enforced.
 */

import { execFileSync } from "node:child_process";
import { statSync } from "node:fs";

/**
 * Measured 2026-09-20 on `recette`: 146 tracked files, 37 008 580 bytes.
 * Rounded up to the next whole mebibyte, which leaves roughly 0.7 MiB — a
 * carousel pass has to raise this line in its own commit, which is the point.
 */
export const PUBLIC_ASSET_WEIGHT_CEILING_BYTES = 36 * 1024 * 1024;

/**
 * The largest tracked asset is `public/images/dossiers/kongo-crucifix.jpg` at
 * 1 969 987 bytes. One careless export is the usual way a directory like this
 * grows, and it is worth catching on its own rather than only in the total.
 */
export const PUBLIC_ASSET_FILE_CEILING_BYTES = 2 * 1024 * 1024;

export interface TrackedAsset {
  path: string;
  bytes: number;
}

export interface AssetWeightVerdict {
  ok: boolean;
  errors: string[];
  notices: string[];
}

const asMiB = (bytes: number) => (bytes / 1024 / 1024).toFixed(2);

export function judgeAssetWeight(
  assets: readonly TrackedAsset[]
): AssetWeightVerdict {
  const total = assets.reduce((sum, asset) => sum + asset.bytes, 0);
  const errors: string[] = [];

  if (total > PUBLIC_ASSET_WEIGHT_CEILING_BYTES) {
    errors.push(
      `public/ weighs ${asMiB(total)} MiB over ${assets.length} tracked files, above the ${asMiB(PUBLIC_ASSET_WEIGHT_CEILING_BYTES)} MiB ceiling. ` +
        `Raise PUBLIC_ASSET_WEIGHT_CEILING_BYTES in scripts/ci/checkPublicAssetWeight.ts in this commit, or ship lighter files.`
    );
  }

  for (const asset of assets) {
    if (asset.bytes > PUBLIC_ASSET_FILE_CEILING_BYTES) {
      errors.push(
        `${asset.path} is ${asMiB(asset.bytes)} MiB, above the ${asMiB(PUBLIC_ASSET_FILE_CEILING_BYTES)} MiB per-file ceiling.`
      );
    }
  }

  const headroom = PUBLIC_ASSET_WEIGHT_CEILING_BYTES - total;
  return {
    ok: errors.length === 0,
    errors,
    notices: [
      `public/: ${assets.length} tracked files, ${asMiB(total)} MiB, ${asMiB(headroom)} MiB of headroom.`,
    ],
  };
}

export function readTrackedAssets(): TrackedAsset[] {
  const listed = execFileSync("git", ["ls-files", "-z", "public"], {
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
  });
  return listed
    .split("\0")
    .filter(Boolean)
    .map((path) => ({ path, bytes: statSync(path).size }));
}

function main(): void {
  const verdict = judgeAssetWeight(readTrackedAssets());
  for (const notice of verdict.notices) console.log(notice);
  for (const error of verdict.errors) console.error(`✖ ${error}`);
  if (!verdict.ok) process.exit(1);
}

if (process.argv[1]?.endsWith("checkPublicAssetWeight.ts")) main();
