import {
  lstatSync,
  mkdtempSync,
  mkdirSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import {
  CANONICAL_SKILLS_DIR,
  MIRROR_SKILLS_DIR,
  collectReferencedResources,
  compareSkillManifests,
  linkMirrorSkill,
  listCanonicalSkills,
  parseSkillName,
  readSkillManifest,
  reconcileMirrorSkill,
} from "../lib/skillParity";

const projectRoot = resolve(import.meta.dirname, "../..");
const temporaryRoots: string[] = [];

function makeTemporaryProject(): string {
  const root = mkdtempSync(join(tmpdir(), "skill-parity-"));
  temporaryRoots.push(root);
  return root;
}

function writeSkill(
  root: string,
  skillsDir: string,
  skillName: string,
  files: Record<string, string>
): string {
  const skillRoot = join(root, skillsDir, skillName);
  for (const [relativePath, contents] of Object.entries(files)) {
    const filePath = join(skillRoot, relativePath);
    mkdirSync(join(filePath, ".."), { recursive: true });
    writeFileSync(filePath, contents);
  }
  return skillRoot;
}

afterEach(() => {
  while (temporaryRoots.length > 0) {
    rmSync(temporaryRoots.pop() as string, { recursive: true, force: true });
  }
});

describe("parseSkillName", () => {
  // @req REQ-032
  it("reads the name declared in the YAML frontmatter", () => {
    expect(
      parseSkillName(
        "---\nname: afrik-curator\ndescription: x\n---\n\n# Body\n"
      )
    ).toBe("afrik-curator");
  });

  // @req REQ-032
  it("returns null when the document has no frontmatter block", () => {
    expect(parseSkillName("# Just a heading\n")).toBeNull();
  });

  // @req REQ-032
  it("ignores a name key that appears after the frontmatter block", () => {
    expect(
      parseSkillName("---\ndescription: x\n---\n\nname: not-the-skill-name\n")
    ).toBeNull();
  });
});

describe("collectReferencedResources", () => {
  // @req REQ-032
  it("collects skill-local resources referenced in backticks", () => {
    const markdown = [
      "Load `reference/entities.md` for the classes.",
      "The capture harness is `references/capture.md`.",
      "A template lives at `templates/tracker.json`.",
    ].join("\n");

    expect(collectReferencedResources(markdown)).toEqual([
      "reference/entities.md",
      "references/capture.md",
      "templates/tracker.json",
    ]);
  });

  // @req REQ-032
  it("does not mistake a repository path for a skill resource", () => {
    const markdown =
      "Run `npx tsx scripts/validateAfrikData.ts` and read `public/modele-pays.json`.";

    expect(collectReferencedResources(markdown)).toEqual([]);
  });

  // @req REQ-032
  it("reports each referenced resource once, in order of first mention", () => {
    const markdown =
      "`reference/tools.md` then `reference/entities.md` then `reference/tools.md`";

    expect(collectReferencedResources(markdown)).toEqual([
      "reference/tools.md",
      "reference/entities.md",
    ]);
  });
});

describe("readSkillManifest", () => {
  // @req REQ-032
  it("reports a missing skill directory rather than throwing", () => {
    const root = makeTemporaryProject();

    const manifest = readSkillManifest(root, CANONICAL_SKILLS_DIR, "absent");

    expect(manifest.exists).toBe(false);
    expect(manifest.files).toEqual({});
  });

  // @req REQ-032
  it("lists every markdown file of the skill with its contents", () => {
    const root = makeTemporaryProject();
    writeSkill(root, CANONICAL_SKILLS_DIR, "demo", {
      "SKILL.md": "---\nname: demo\n---\n\nRead `reference/a.md`.\n",
      "reference/a.md": "alpha\n",
    });

    const manifest = readSkillManifest(root, CANONICAL_SKILLS_DIR, "demo");

    expect(manifest.exists).toBe(true);
    expect(manifest.name).toBe("demo");
    expect(Object.keys(manifest.files)).toEqual(["SKILL.md", "reference/a.md"]);
  });

  // @req REQ-032
  it("names every referenced resource that the skill directory does not contain", () => {
    const root = makeTemporaryProject();
    writeSkill(root, CANONICAL_SKILLS_DIR, "demo", {
      "SKILL.md": "---\nname: demo\n---\n\nRead `reference/ghost.md`.\n",
    });

    const manifest = readSkillManifest(root, CANONICAL_SKILLS_DIR, "demo");

    expect(manifest.missingResources).toEqual(["reference/ghost.md"]);
  });
});

describe("compareSkillManifests", () => {
  const canonical = {
    label: "canonical",
    exists: true,
    name: "demo",
    files: { "SKILL.md": "one\n", "reference/a.md": "alpha\n" },
    missingResources: [],
  };

  // @req REQ-032
  it("reports no issue when both entry points expose identical instructions", () => {
    expect(
      compareSkillManifests(canonical, { ...canonical, label: "mirror" })
    ).toEqual([]);
  });

  // @req REQ-032
  it("detects a divergence in the body of a shared file", () => {
    const issues = compareSkillManifests(canonical, {
      ...canonical,
      label: "mirror",
      files: { ...canonical.files, "reference/a.md": "beta\n" },
    });

    expect(issues).toEqual([
      {
        kind: "content-mismatch",
        path: "reference/a.md",
        detail: "canonical and mirror disagree on reference/a.md",
      },
    ]);
  });

  // @req REQ-032
  it("detects a file present at one entry point only", () => {
    const issues = compareSkillManifests(canonical, {
      ...canonical,
      label: "mirror",
      files: { "SKILL.md": "one\n" },
    });

    expect(issues).toEqual([
      {
        kind: "missing-file",
        path: "reference/a.md",
        detail: "reference/a.md exists at canonical but not at mirror",
      },
    ]);
  });

  // @req REQ-032
  it("detects two entry points declaring different skill names", () => {
    const issues = compareSkillManifests(canonical, {
      ...canonical,
      label: "mirror",
      name: "other",
    });

    expect(issues).toEqual([
      {
        kind: "name-mismatch",
        path: "SKILL.md",
        detail: "canonical declares name demo, mirror declares other",
      },
    ]);
  });

  // @req REQ-032
  it("treats an absent mirror as absent rather than as a divergence", () => {
    const issues = compareSkillManifests(canonical, {
      label: "mirror",
      exists: false,
      name: null,
      files: {},
      missingResources: [],
    });

    expect(issues).toEqual([]);
  });

  // @req REQ-032
  it("reports a missing canonical entry point as a blocking issue", () => {
    const issues = compareSkillManifests(
      { ...canonical, exists: false, name: null, files: {} },
      { ...canonical, label: "mirror" }
    );

    expect(issues).toEqual([
      {
        kind: "missing-entry-point",
        path: "SKILL.md",
        detail: "canonical entry point does not exist",
      },
    ]);
  });
});

describe("listCanonicalSkills", () => {
  // @req REQ-032
  it("lists every directory holding a SKILL.md, sorted, and ignores the rest", () => {
    const root = makeTemporaryProject();
    writeSkill(root, CANONICAL_SKILLS_DIR, "zeta", {
      "SKILL.md": "---\nname: zeta\n---\n",
    });
    writeSkill(root, CANONICAL_SKILLS_DIR, "alpha", {
      "SKILL.md": "---\nname: alpha\n---\n",
    });
    writeSkill(root, CANONICAL_SKILLS_DIR, "notes", {
      "README.md": "not a skill",
    });

    expect(listCanonicalSkills(root)).toEqual(["alpha", "zeta"]);
  });

  // @req REQ-032
  it("returns nothing when the project has no skills directory", () => {
    expect(listCanonicalSkills(makeTemporaryProject())).toEqual([]);
  });

  // @req REQ-032
  it("covers every skill the repository actually ships", () => {
    expect(listCanonicalSkills(projectRoot)).toEqual(
      expect.arrayContaining([
        "afrik-curator",
        "ethniafrica-idee",
        "ethniafrica-production",
      ])
    );
  });
});

describe("linkMirrorSkill", () => {
  // @req REQ-032
  it("creates a relative symlink from the mirror to the canonical skill", () => {
    const root = makeTemporaryProject();
    writeSkill(root, CANONICAL_SKILLS_DIR, "demo", {
      "SKILL.md": "---\nname: demo\n---\n\nBody.\n",
    });

    const result = linkMirrorSkill(root, "demo");

    expect(result.action).toBe("created");
    expect(result.target).toBe("../../.claude/skills/demo");
    expect(readSkillManifest(root, MIRROR_SKILLS_DIR, "demo").name).toBe(
      "demo"
    );
  });

  // @req REQ-032
  it("is idempotent when the link already points at the canonical skill", () => {
    const root = makeTemporaryProject();
    writeSkill(root, CANONICAL_SKILLS_DIR, "demo", {
      "SKILL.md": "---\nname: demo\n---\n\nBody.\n",
    });
    linkMirrorSkill(root, "demo");

    expect(linkMirrorSkill(root, "demo").action).toBe("already-linked");
  });

  // @req REQ-032
  it("replaces a symlink that points somewhere else", () => {
    const root = makeTemporaryProject();
    writeSkill(root, CANONICAL_SKILLS_DIR, "demo", {
      "SKILL.md": "---\nname: demo\n---\n\nBody.\n",
    });
    mkdirSync(join(root, MIRROR_SKILLS_DIR), { recursive: true });
    symlinkSync("../../elsewhere", join(root, MIRROR_SKILLS_DIR, "demo"));

    expect(linkMirrorSkill(root, "demo").action).toBe("relinked");
  });

  // @req REQ-032
  it("refuses to delete a real directory standing where the link belongs", () => {
    const root = makeTemporaryProject();
    writeSkill(root, CANONICAL_SKILLS_DIR, "demo", {
      "SKILL.md": "---\nname: demo\n---\n\nBody.\n",
    });
    writeSkill(root, MIRROR_SKILLS_DIR, "demo", {
      "SKILL.md": "handwritten\n",
    });

    const result = linkMirrorSkill(root, "demo");

    expect(result.action).toBe("blocked");
    expect(readSkillManifest(root, MIRROR_SKILLS_DIR, "demo").files).toEqual({
      "SKILL.md": "handwritten\n",
    });
  });

  // @req REQ-032
  it("refuses to link a skill that does not exist canonically", () => {
    const root = makeTemporaryProject();

    expect(linkMirrorSkill(root, "absent").action).toBe("blocked");
  });
});

/**
 * A real directory where a link belongs is either a stale copy — every file
 * equals the canonical skill today or as it was at some past commit — or it
 * carries someone's own edits. Only the first may be replaced; the second is
 * listed file by file and left where it stands (audit finding C04).
 */
describe("reconcileMirrorSkill", () => {
  const canonical = "---\nname: demo\n---\n\nCurrent body.\n";
  const never = () => false;

  function seed(mirrorFiles: Record<string, string>): string {
    const root = makeTemporaryProject();
    writeSkill(root, CANONICAL_SKILLS_DIR, "demo", { "SKILL.md": canonical });
    writeSkill(root, MIRROR_SKILLS_DIR, "demo", mirrorFiles);
    return root;
  }

  // @req REQ-032
  it("replaces a copy that equals the canonical skill with the link", () => {
    const root = seed({ "SKILL.md": canonical });

    const result = reconcileMirrorSkill(root, "demo", never);

    expect(result.action).toBe("reconciled");
    expect(
      lstatSync(join(root, MIRROR_SKILLS_DIR, "demo")).isSymbolicLink()
    ).toBe(true);
  });

  // @req REQ-032
  it("replaces a copy that equals a past version of the canonical skill", () => {
    const stale = "---\nname: demo\n---\n\nOld body.\n";
    const root = seed({ "SKILL.md": stale });

    const result = reconcileMirrorSkill(
      root,
      "demo",
      (path, contents) => path === "SKILL.md" && contents === stale
    );

    expect(result.action).toBe("reconciled");
    expect(readSkillManifest(root, MIRROR_SKILLS_DIR, "demo").files).toEqual({
      "SKILL.md": canonical,
    });
  });

  // @req REQ-032
  it("refuses a copy carrying a line no canonical version ever had, and names the file", () => {
    const root = seed({ "SKILL.md": "someone's own edit\n" });

    const result = reconcileMirrorSkill(root, "demo", never);

    expect(result.action).toBe("blocked");
    expect(result.detail).toContain("SKILL.md");
    expect(
      lstatSync(join(root, MIRROR_SKILLS_DIR, "demo")).isSymbolicLink()
    ).toBe(false);
    expect(readSkillManifest(root, MIRROR_SKILLS_DIR, "demo").files).toEqual({
      "SKILL.md": "someone's own edit\n",
    });
  });

  // @req REQ-032
  it("refuses a copy with a file the canonical skill does not have", () => {
    const root = seed({ "SKILL.md": canonical, "notes/mine.md": "local\n" });

    const result = reconcileMirrorSkill(root, "demo", never);

    expect(result.action).toBe("blocked");
    expect(result.detail).toContain("notes/mine.md");
    expect(
      readSkillManifest(root, MIRROR_SKILLS_DIR, "demo").files["notes/mine.md"]
    ).toBe("local\n");
  });

  // @req REQ-032
  it("behaves as linkMirrorSkill when nothing stands in the way", () => {
    const root = makeTemporaryProject();
    writeSkill(root, CANONICAL_SKILLS_DIR, "demo", { "SKILL.md": canonical });

    expect(reconcileMirrorSkill(root, "demo", never).action).toBe("created");
    expect(reconcileMirrorSkill(root, "demo", never).action).toBe(
      "already-linked"
    );
  });
});

describe("the afrik-curator skill in this repository", () => {
  // @req REQ-032
  it("exposes a canonical entry point whose every referenced resource exists", () => {
    const manifest = readSkillManifest(
      projectRoot,
      CANONICAL_SKILLS_DIR,
      "afrik-curator"
    );

    expect(manifest.exists).toBe(true);
    expect(manifest.name).toBe("afrik-curator");
    expect(manifest.missingResources).toEqual([]);
  });

  // @req REQ-032
  it("keeps the Codex entry point identical to the canonical one", () => {
    const issues = compareSkillManifests(
      readSkillManifest(projectRoot, CANONICAL_SKILLS_DIR, "afrik-curator"),
      readSkillManifest(projectRoot, MIRROR_SKILLS_DIR, "afrik-curator")
    );

    expect(issues).toEqual([]);
  });

  // @req REQ-032
  it("documents the country-enrichment mode in the canonical skill", () => {
    const manifest = readSkillManifest(
      projectRoot,
      CANONICAL_SKILLS_DIR,
      "afrik-curator"
    );

    expect(Object.keys(manifest.files)).toContain(
      "reference/country-enrichment.md"
    );
    expect(manifest.files["SKILL.md"]).toContain("country-enrichment");
  });
});
