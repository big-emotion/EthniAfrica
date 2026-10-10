import sharp from "sharp";
import { readFile, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createHash } from "node:crypto";
import { verifyOutput } from "./render.mjs";

// Calibrated on the supplied references and the pinned Chromium renderer.
// Both limits apply, so a global small colour shift cannot pass unnoticed.
export async function compareImages(
  actual,
  reference,
  diagnosticOverflow = false
) {
  const decode = (input) =>
    sharp(input)
      .toColourspace("srgb")
      .removeAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
  const [a, b] = await Promise.all([decode(actual), decode(reference)]);
  if (a.info.width !== b.info.width || a.info.height !== b.info.height)
    return { ok: false, reason: "dimensions" };
  let changed = 0,
    total = 0;
  for (let i = 0; i < a.data.length; i += 3) {
    const delta = Math.max(
      Math.abs(a.data[i] - b.data[i]),
      Math.abs(a.data[i + 1] - b.data[i + 1]),
      Math.abs(a.data[i + 2] - b.data[i + 2])
    );
    if (delta > 16) changed++;
    total += delta;
  }
  const pixels = a.info.width * a.info.height;
  const changedFraction = changed / pixels,
    meanMaxChannelDifference = total / pixels;
  const limits = diagnosticOverflow
    ? { fraction: 0.012, mean: 0.65 }
    : { fraction: 0.007, mean: 0.4 };
  return {
    ok:
      changedFraction <= limits.fraction &&
      meanMaxChannelDifference <= limits.mean,
    changedFraction,
    meanMaxChannelDifference,
    limits,
  };
}

export async function verifyReferences({
  input,
  output,
  references,
  manifest,
  design,
  assets,
}) {
  const report = await verifyOutput({ input, output, design, assets });
  const baseline = JSON.parse(await readFile(manifest));
  if (
    baseline.designVersion !== report.designVersion ||
    baseline.files.length !== report.cards.length
  )
    throw new Error("Reference manifest version/count mismatch");
  const cards = [];
  for (const c of report.cards) {
    const expected = baseline.files.find((f) => f.id === c.id);
    if (!expected || expected.file !== `${c.id}.png`)
      throw new Error(`Missing reference: ${c.id}`);
    const ref = await readFile(join(references, expected.file));
    if (createHash("sha256").update(ref).digest("hex") !== expected.sha256)
      throw new Error(`Reference hash mismatch: ${c.id}`);
    cards.push({
      id: c.id,
      ...(await compareImages(join(output, c.file), ref, c.id === "overflow")),
    });
  }
  const result = {
    designVersion: report.designVersion,
    browser: report.browser,
    cards,
    ok: cards.every((c) => c.ok),
  };
  return result;
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  const [input, output, references, resultPath] = process.argv.slice(2);
  if (!input || !output || !references || !resultPath)
    throw new Error(
      "Usage: node social/renderer/fidelity.mjs INPUT OUTPUT REFERENCES RESULT_JSON"
    );
  try {
    const manifest = fileURLToPath(
      new URL("./reference-manifest.json", import.meta.url)
    );
    const r = await verifyReferences({ input, output, references, manifest });
    await writeFile(resultPath, JSON.stringify(r, null, 2) + "\n");
    console.log(
      JSON.stringify({
        ok: r.ok,
        passed: r.cards.filter((c) => c.ok).length,
        total: r.cards.length,
        failed: r.cards.filter((c) => !c.ok).map((c) => c.id),
      })
    );
    if (!r.ok) process.exitCode = 1;
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
