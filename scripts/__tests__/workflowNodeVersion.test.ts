import { readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * One Node major, declared once in `package.json#engines`.
 *
 * Production builds on the Dockerfile's `node:22-alpine` while four workflows
 * kept installing Node 20, so the E2E, Lighthouse, editorial and audit jobs
 * measured a runtime nobody ships — and the nightly E2E log carried
 * supabase-js's Node 20 deprecation warning on every spec. A version typed in
 * a workflow drifts silently; this reads every `node-version:` there is.
 */

const ROOT = process.cwd();
const WORKFLOW_DIR = resolve(ROOT, ".github/workflows");

const majorOf = (version: string) =>
  version
    .trim()
    .replace(/^["']|["']$/g, "")
    .split(".")[0];

const enginesMajor = majorOf(
  JSON.parse(readFileSync(resolve(ROOT, "package.json"), "utf8")).engines.node
);

const workflowNodeVersions = readdirSync(WORKFLOW_DIR)
  .filter((file) => /\.ya?ml$/.test(file))
  .flatMap((file) =>
    readFileSync(join(WORKFLOW_DIR, file), "utf8")
      .split("\n")
      .flatMap((line, index) => {
        const match = line.match(/^\s*node-version:\s*([^#\s]+)/);
        return match
          ? [{ where: `${file}:${index + 1}`, version: match[1] }]
          : [];
      })
  );

describe("Node runtime parity", () => {
  // @req REQ-085
  it("declares a numeric Node major in package.json engines", () => {
    expect(enginesMajor).toMatch(/^\d+$/);
  });

  // @req REQ-085
  it("builds the production image on the engines major", () => {
    const dockerfile = readFileSync(resolve(ROOT, "Dockerfile"), "utf8");
    const baseImages = [...dockerfile.matchAll(/^FROM node:(\d+)/gm)].map(
      (match) => match[1]
    );

    expect(baseImages.length).toBeGreaterThan(0);
    expect(baseImages).toEqual(baseImages.map(() => enginesMajor));
  });

  // @req REQ-085
  it("installs the engines major in every workflow that sets up Node", () => {
    expect(workflowNodeVersions.length).toBeGreaterThan(0);

    const drifted = workflowNodeVersions
      .filter(({ version }) => majorOf(version) !== enginesMajor)
      .map(({ where, version }) => `${where} installs Node ${version}`);

    expect(drifted).toEqual([]);
  });
});
