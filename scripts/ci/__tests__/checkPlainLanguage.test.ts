// @req REQ-178
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFileSync, spawnSync } from "node:child_process";
import { afterEach, describe, expect, it } from "vitest";

import {
  checkEditorialFiles,
  editorialPaths,
  readStagedCopy,
} from "../checkPlainLanguage";

const roots: string[] = [];
function workspace() {
  const root = mkdtempSync(join(tmpdir(), "ethniafrica-language-"));
  roots.push(root);
  execFileSync("git", ["init", "-q"], { cwd: root });
  mkdirSync(join(root, "src"));
  mkdirSync(join(root, "dataset/source/afrik"), { recursive: true });
  mkdirSync(join(root, "docs/productions"), { recursive: true });
  return root;
}
afterEach(() =>
  roots
    .splice(0)
    .forEach((root) => rmSync(root, { recursive: true, force: true }))
);

describe("plain-language entry points", () => {
  // @req REQ-178
  it("discovers untracked fiches, code and publications without checking tests, internal worksheets or archived sources", () => {
    const root = workspace();
    for (const file of [
      "src/card.tsx",
      "src/copy.json",
      "src/card.test.tsx",
      "dataset/source/afrik/new.json",
      "dataset/source/afrik/_notes.json",
      "docs/productions/caption.md",
      "docs/productions/README.md",
    ]) {
      writeFileSync(join(root, file), "");
    }
    expect(editorialPaths(root)).toEqual([
      "dataset/source/afrik/new.json",
      "docs/productions/caption.md",
      "src/card.tsx",
      "src/copy.json",
    ]);
  });

  // @req REQ-178
  it("checks what will be committed, even if the working copy has already been corrected", () => {
    const root = workspace();
    writeFileSync(join(root, "src/card.tsx"), "<p>Notre corpus.</p>");
    execFileSync("git", ["add", "src/card.tsx"], { cwd: root });
    writeFileSync(join(root, "src/card.tsx"), "<p>Nos fiches.</p>");
    expect(readStagedCopy(root).some((u) => u.text === "Notre corpus.")).toBe(
      true
    );
  });

  // @req REQ-178
  it("does not try to read deleted tracked content", () => {
    const root = workspace();
    writeFileSync(join(root, "src/card.tsx"), "<p>Bonjour.</p>");
    execFileSync("git", ["add", "src/card.tsx"], { cwd: root });
    rmSync(join(root, "src/card.tsx"));
    expect(editorialPaths(root)).toEqual([]);
  });

  // @req REQ-178
  it("refuses incomplete input and checks the final version again after any edit", () => {
    const root = workspace();
    expect(() => checkEditorialFiles([], { root, strict: true })).toThrow(/No/);
    expect(() =>
      checkEditorialFiles(["missing.txt"], { root, strict: true })
    ).toThrow();
    writeFileSync(join(root, "caption.txt"), "Ce peuple porte plusieurs noms.");
    expect(
      checkEditorialFiles(["caption.txt"], { root, strict: true }).errors
    ).toHaveLength(0);
    writeFileSync(join(root, "empty.txt"), "");
    expect(() =>
      checkEditorialFiles(["caption.txt", "empty.txt"], { root, strict: true })
    ).toThrow(/No readable/);
    writeFileSync(join(root, "caption.txt"), "Nous ne tranchons pas.");
    expect(
      checkEditorialFiles(["caption.txt"], { root, strict: true }).errors
    ).toHaveLength(1);
  });

  // @req REQ-178
  it("makes the publication CLI fail on errors and refuses mixing strict and audit modes", () => {
    const root = workspace();
    const file = join(root, "caption.txt");
    const cli = (...args: string[]) =>
      spawnSync(
        process.execPath,
        ["--import", "tsx", "scripts/ci/checkPlainLanguage.ts", ...args],
        { encoding: "utf8" }
      );
    writeFileSync(file, "Notre corpus.");
    expect(cli("--strict", file).status).toBe(1);
    expect(cli("--strict", "--audit", file).status).toBe(1);
    writeFileSync(file, "Ce peuple porte plusieurs noms.");
    expect(cli("--strict", file).status).toBe(0);
  });
});
