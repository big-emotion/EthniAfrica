import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, relative, resolve, sep } from "node:path";

export const DERIVED_FROM = "derived-from.json";

export type DriftFinding = {
  kind: "changed" | "missing" | "outside-repository";
  path: string;
};

export type PackDrift = {
  pack: string;
  status: "in-sync" | "drifted" | "invalid-manifest";
  findings: DriftFinding[];
};

export type DriftReport = { packs: PackDrift[]; withoutManifest: number };

type Source = { path: string; sha256: string };

/**
 * A pack is a directory that holds a SKILL.md or a derived-from.json. Packs
 * are looked up one level under `packsDir` and one more under a plugin's
 * `skills/` folder, which is how the agent-atelier plugins lay them out.
 */
function packDirectories(packsDir: string): string[] {
  const found: string[] = [];
  const walk = (dir: string, depth: number) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (!entry.isDirectory() || entry.name === "node_modules") continue;
      const child = join(dir, entry.name);
      const isPack =
        existsSync(join(child, DERIVED_FROM)) ||
        existsSync(join(child, "SKILL.md"));
      if (isPack) found.push(child);
      else if (depth < 3) walk(child, depth + 1);
    }
  };
  walk(packsDir, 0);
  return found.sort();
}

function readSources(manifestPath: string): Source[] | null {
  try {
    const parsed = JSON.parse(readFileSync(manifestPath, "utf8"));
    const sources = parsed?.sources;
    if (!Array.isArray(sources)) return null;
    const valid = sources.every(
      (s) => typeof s?.path === "string" && typeof s?.sha256 === "string"
    );
    return valid ? sources : null;
  } catch {
    return null;
  }
}

function inspectSource(root: string, source: Source): DriftFinding | null {
  const absolute = resolve(root, source.path);
  if (!absolute.startsWith(resolve(root) + sep)) {
    return { kind: "outside-repository", path: source.path };
  }
  if (!existsSync(absolute)) return { kind: "missing", path: source.path };
  const actual = createHash("sha256")
    .update(readFileSync(absolute))
    .digest("hex");
  return actual === source.sha256
    ? null
    : { kind: "changed", path: source.path };
}

/**
 * Compares every pack's recorded source hashes with the files in `root`.
 * Advisory by design: the packs live in another repository and may not exist
 * yet, so a missing directory or manifest is a normal state, not an error.
 */
export function checkSkillDrift(root: string, packsDir: string): DriftReport {
  if (!existsSync(packsDir)) return { packs: [], withoutManifest: 0 };

  const report: DriftReport = { packs: [], withoutManifest: 0 };
  for (const dir of packDirectories(packsDir)) {
    const pack = relative(packsDir, dir).split(sep).join("/");
    const manifestPath = join(dir, DERIVED_FROM);
    if (!existsSync(manifestPath)) {
      report.withoutManifest += 1;
      continue;
    }
    const sources = readSources(manifestPath);
    if (!sources) {
      report.packs.push({ pack, status: "invalid-manifest", findings: [] });
      continue;
    }
    const findings = sources
      .map((source) => inspectSource(root, source))
      .filter((finding): finding is DriftFinding => finding !== null);
    report.packs.push({
      pack,
      status: findings.length ? "drifted" : "in-sync",
      findings,
    });
  }
  return report;
}
