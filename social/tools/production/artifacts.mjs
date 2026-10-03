import { createHash } from "node:crypto";
import { readFileSync, realpathSync } from "node:fs";
import { resolve, relative, isAbsolute } from "node:path";

export const digest = (bytes) =>
  createHash("sha256").update(bytes).digest("hex");
export const requireValue = (condition, message) => {
  if (!condition) throw new Error(message);
};

export function artifact(root, path) {
  requireValue(
    typeof path === "string" && path.length && !isAbsolute(path),
    "Evidence must be relative and inside the private package"
  );
  const base = realpathSync(root);
  const candidate = resolve(base, path);
  const inside = (value) => {
    const p = relative(base, value);
    return p && !p.startsWith("..") && !isAbsolute(p);
  };
  requireValue(
    inside(candidate),
    "Evidence must stay inside the private package"
  );
  requireValue(
    inside(realpathSync(candidate)),
    "Evidence symlink must stay inside the private package"
  );
  return { path, sha256: digest(readFileSync(candidate)) };
}
