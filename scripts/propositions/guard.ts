/**
 * The defence against a booby-trapped proposal: whatever the routine was
 * talked into doing, a branch may only touch AFRIK fiches. This looks at the
 * diff itself, not at what the routine says it did.
 */
export interface GuardResult {
  ok: boolean;
  errors: string[];
}

export const GUARD_ROOT = "dataset/source/afrik/";
// Symlinks and submodules can point outside the allowed directory.
const FORBIDDEN_MODES = new Set(["120000", "160000"]);

/** `rawDiff` is the output of `git diff --raw --no-renames`. */
export function guardRawDiff(rawDiff: string): GuardResult {
  const lines = rawDiff.split("\n").filter((line) => line.trim() !== "");
  if (lines.length === 0) {
    return { ok: false, errors: ["the branch changes nothing"] };
  }
  const errors: string[] = [];
  for (const line of lines) {
    const [meta, path = ""] = line.split("\t");
    const [oldMode, newMode] = meta.replace(/^:/, "").split(" ");
    const inside =
      path.startsWith(GUARD_ROOT) &&
      path.endsWith(".json") &&
      !path.split("/").includes("..");
    if (!inside) {
      errors.push(`outside ${GUARD_ROOT}*.json: ${path || line}`);
    } else if (FORBIDDEN_MODES.has(oldMode) || FORBIDDEN_MODES.has(newMode)) {
      errors.push(`symlink or submodule not allowed: ${path}`);
    }
  }
  return { ok: errors.length === 0, errors };
}

export function changedPaths(rawDiff: string): string[] {
  return rawDiff
    .split("\n")
    .map((line) => line.split("\t")[1])
    .filter((path): path is string => Boolean(path));
}
