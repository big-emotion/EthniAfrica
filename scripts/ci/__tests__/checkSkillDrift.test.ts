import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createHash } from "node:crypto";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

import { checkSkillDrift } from "../../lib/skillDrift";

const sha256 = (text: string) =>
  createHash("sha256").update(text).digest("hex");

/**
 * A pack copied from an EthniAfrica skill records which file it came from and
 * the hash that file had. The check is advisory: it tells a maintainer the
 * generic pack may be stale, and it must never break on the packs that do not
 * exist yet.
 */
describe("skill drift — packs derived from this repository's skills", () => {
  let root: string;
  let packs: string;

  const write = (base: string, rel: string, body: string) => {
    const file = join(base, rel);
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, body);
  };
  const manifest = (pack: string, sources: unknown) =>
    write(packs, `${pack}/derived-from.json`, JSON.stringify({ sources }));

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), "drift-root-"));
    packs = mkdtempSync(join(tmpdir(), "drift-packs-"));
  });
  afterEach(() => {
    rmSync(root, { recursive: true, force: true });
    rmSync(packs, { recursive: true, force: true });
  });

  // @req REQ-032

  it("reports a pack whose source still has the recorded hash as in sync", () => {
    write(root, ".claude/skills/idee/SKILL.md", "v1");
    manifest("idea", [
      { path: ".claude/skills/idee/SKILL.md", sha256: sha256("v1") },
    ]);

    const report = checkSkillDrift(root, packs);

    expect(report.packs).toEqual([
      { pack: "idea", status: "in-sync", findings: [] },
    ]);
  });

  // @req REQ-032

  it("names the source file whose hash moved", () => {
    write(root, ".claude/skills/idee/SKILL.md", "v2");
    manifest("idea", [
      { path: ".claude/skills/idee/SKILL.md", sha256: sha256("v1") },
    ]);

    const [idea] = checkSkillDrift(root, packs).packs;

    expect(idea.status).toBe("drifted");
    expect(idea.findings).toEqual([
      { kind: "changed", path: ".claude/skills/idee/SKILL.md" },
    ]);
  });

  // @req REQ-032

  it("reports a source that no longer exists as missing, not as changed", () => {
    manifest("idea", [{ path: ".claude/skills/gone/SKILL.md", sha256: "ab" }]);

    const [idea] = checkSkillDrift(root, packs).packs;

    expect(idea.findings).toEqual([
      { kind: "missing", path: ".claude/skills/gone/SKILL.md" },
    ]);
  });

  // @req REQ-032

  it("tolerates packs without a derived-from.json and counts them", () => {
    write(packs, "audience-audit/SKILL.md", "no manifest here");

    const report = checkSkillDrift(root, packs);

    expect(report.packs).toEqual([]);
    expect(report.withoutManifest).toBe(1);
  });

  // @req REQ-032

  it("tolerates a packs directory that does not exist yet", () => {
    const report = checkSkillDrift(root, join(packs, "not-created"));

    expect(report).toEqual({ packs: [], withoutManifest: 0 });
  });

  // @req REQ-032

  it("reports an unreadable manifest instead of throwing", () => {
    write(packs, "idea/derived-from.json", "{ not json");

    const [idea] = checkSkillDrift(root, packs).packs;

    expect(idea.status).toBe("invalid-manifest");
  });

  // @req REQ-032

  it("refuses a source path that climbs out of the repository", () => {
    manifest("idea", [{ path: "../outside.md", sha256: "ab" }]);

    const [idea] = checkSkillDrift(root, packs).packs;

    expect(idea.findings).toEqual([
      { kind: "outside-repository", path: "../outside.md" },
    ]);
  });
});
